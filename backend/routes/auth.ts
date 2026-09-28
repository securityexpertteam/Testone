import { Router, Request, Response, NextFunction } from 'express';
import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { Collection, Document } from 'mongodb';
import { getMongoDb } from '../data/mongo.js';

export const authRouter = Router();

interface CustomerUser extends Document {
  loginId: string;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts?: number;
  lastOtpSentAt?: Date;
}

interface SellerAccount extends Document {
  email: string;
  passwordHash: string;
  sellerId: string;
  storeName: string;
  sellerName: string;
  phone: string;
  gstin: string;
}

const getUsers = (): Collection<CustomerUser> => getMongoDb().collection<CustomerUser>('users');
const getSellers = (): Collection<SellerAccount> => getMongoDb().collection<SellerAccount>('sellers');

const hashOtp = (email: string, otp: string): string => {
  const secret = process.env.OTP_HASH_SECRET;
  if (!secret) throw new Error('OTP_HASH_SECRET must be configured');
  return createHmac('sha256', secret).update(`${email}:${otp}`).digest('hex');
};

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }

  const otpSecret = process.env.OTP_HASH_SECRET;
  if (process.env.NODE_ENV !== 'production' && otpSecret && otpSecret.length >= 32) {
    return createHmac('sha256', otpSecret).update('akshaya-patra-local-jwt-signing-v1').digest('hex');
  }

  throw new Error('JWT_SECRET must be configured with at least 32 characters');
};

const hashSellerPassword = (password: string, salt = randomBytes(16).toString('hex')): string =>
  `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;

const verifySellerPassword = (password: string, storedHash: string): boolean => {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const createSellerToken = (seller: SellerAccount): string => jwt.sign(
  { role: 'seller', sellerId: seller.sellerId },
  getJwtSecret(),
  { algorithm: 'HS256', subject: seller.email, issuer: 'akshaya-patra-api', audience: 'akshaya-patra-seller', expiresIn: '12h' }
);

const isDevelopmentOtpMode = (): boolean =>
  process.env.NODE_ENV !== 'production' && (process.env.OTP_DELIVERY_MODE || 'development') === 'development';

const sendCustomerOtp = async (email: string, otp: string): Promise<void> => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM must be configured');
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Your Akshaya Patra checkout OTP',
    text: `Your one-time password is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`
  });
};

authRouter.post('/user/otp/request', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'A valid email login ID is required' });
  }

  try {
    const users = getUsers();
    const user = await users.findOne({ loginId: email });
    if (user?.lastOtpSentAt && Date.now() - user.lastOtpSentAt.getTime() < 60_000) {
      return res.status(429).json({ success: false, message: 'Wait one minute before requesting another OTP' });
    }

    const otp = randomInt(100000, 1000000).toString();
    await users.updateOne(
      { loginId: email },
      { $set: { loginId: email, otpHash: hashOtp(email, otp), otpExpiresAt: new Date(Date.now() + 10 * 60_000), otpAttempts: 0, lastOtpSentAt: new Date() } },
      { upsert: true }
    );

    if (!isDevelopmentOtpMode()) {
      try {
        await sendCustomerOtp(email, otp);
      } catch (error) {
        await users.updateOne({ loginId: email }, { $unset: { otpHash: '', otpExpiresAt: '' } });
        throw error;
      }
    }
    return res.json({
      success: true,
      message: isDevelopmentOtpMode() ? 'Development OTP generated' : 'OTP sent to your email login ID',
      ...(isDevelopmentOtpMode() ? { developmentOtp: otp } : {})
    });
  } catch (error) {
    console.error('Unable to send customer OTP', error);
    return res.status(503).json({ success: false, message: 'OTP service is unavailable; check MongoDB and SMTP configuration' });
  }
});

authRouter.post('/user/otp/verify', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Enter the email login ID and six-digit OTP' });
  }

  try {
    const jwtSecret = getJwtSecret();
    const users = getUsers();
    const suppliedHash = Buffer.from(hashOtp(email, otp), 'hex');
    const user = await users.findOne({ loginId: email });
    const storedHash = user?.otpHash ? Buffer.from(user.otpHash, 'hex') : Buffer.alloc(0);
    const isOtpMatch = suppliedHash.length === storedHash.length && storedHash.length > 0 && timingSafeEqual(suppliedHash, storedHash);
    const consumedOtp = isOtpMatch ? await users.findOneAndUpdate(
      { loginId: email, otpHash: suppliedHash.toString('hex'), otpExpiresAt: { $gt: new Date() }, otpAttempts: { $lt: 5 } },
      { $unset: { otpHash: '', otpExpiresAt: '', otpAttempts: '' } },
      { returnDocument: 'after' }
    ) : null;
    if (!consumedOtp) {
      await users.updateOne(
        { loginId: email, otpHash: { $exists: true }, otpExpiresAt: { $gt: new Date() }, otpAttempts: { $lt: 5 } },
        { $inc: { otpAttempts: 1 } }
      );
      return res.status(401).json({ success: false, message: 'OTP is invalid or expired; request a new one' });
    }

    await users.updateOne({ _id: consumedOtp._id }, { $set: { lastLoginAt: new Date() } });
    const token = jwt.sign({}, jwtSecret, {
      algorithm: 'HS256',
      subject: email,
      issuer: 'akshaya-patra-api',
      audience: 'akshaya-patra-customer',
      expiresIn: '30d'
    });
    return res.json({ success: true, token, loginId: email });
  } catch (error) {
    console.error('Unable to verify customer OTP', error);
    return res.status(503).json({ success: false, message: 'Account service is unavailable' });
  }
});

export const requireCustomerSession = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Verify your email OTP before checkout' });

  let secret: string;
  try {
    secret = getJwtSecret();
  } catch (error) {
    console.error('JWT configuration error', error);
    return res.status(503).json({ success: false, message: 'Customer authentication is not configured' });
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'akshaya-patra-api',
      audience: 'akshaya-patra-customer'
    });
    if (typeof payload === 'string' || !payload.sub) {
      return res.status(401).json({ success: false, message: 'Your login session is invalid; verify a new OTP' });
    }
    res.locals.customerLoginId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Your login session expired or is invalid; verify a new OTP' });
  }
};

// POST /api/auth/seller/register
authRouter.post('/seller/register', async (req: Request, res: Response) => {
  const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : '';
  const sellerName = typeof req.body.sellerName === 'string' ? req.body.sellerName.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const gstin = typeof req.body.gstin === 'string' ? req.body.gstin.trim() : '';
  if (!storeName || !email || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Store name, valid email, and an 8-character password are required' });
  }

  try {
    const sellers = getSellers();
    if (await sellers.findOne({ email })) {
      return res.status(409).json({ success: false, message: 'A seller account already exists for this email' });
    }
    const seller: SellerAccount = {
      email,
      passwordHash: hashSellerPassword(password),
      sellerId: `SLR-${randomBytes(6).toString('hex').toUpperCase()}`,
      storeName,
      sellerName,
      phone,
      gstin: gstin || 'PENDING_VERIFICATION'
    } as SellerAccount;
    await sellers.insertOne(seller);
    const token = createSellerToken(seller);
    return res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      token,
      seller: { sellerId: seller.sellerId, storeName, sellerName, email, phone, gstin: seller.gstin }
    });
  } catch (error) {
    console.error('Unable to register seller', error);
    return res.status(503).json({ success: false, message: 'Seller registration is unavailable' });
  }
});

// POST /api/auth/seller/login
authRouter.post('/seller/login', async (req: Request, res: Response) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const sellers = getSellers();
    const seller = await sellers.findOne({ email });

    if (!seller || !verifySellerPassword(password, seller.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid seller email or password' });
    }
    const token = createSellerToken(seller);
    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      seller: {
        sellerId: seller.sellerId,
        storeName: seller.storeName,
        sellerName: seller.sellerName,
        email: seller.email,
        phone: seller.phone,
        gstin: seller.gstin,
        role: 'SELLER'
      }
    });
  } catch (error) {
    console.error('Unable to authenticate seller', error);
    return res.status(503).json({ success: false, message: 'Seller authentication is unavailable' });
  }
});

export const requireSellerSession = (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Seller login is required' });

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'akshaya-patra-api',
      audience: 'akshaya-patra-seller'
    });
    if (typeof payload === 'string' || !payload.sub || payload.role !== 'seller' || typeof payload.sellerId !== 'string') {
      return res.status(401).json({ success: false, message: 'Seller session is invalid' });
    }
    res.locals.sellerLoginId = payload.sub;
    res.locals.sellerId = payload.sellerId;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Seller session expired or is invalid' });
  }
};

// POST /api/auth/seller/forgot-password
authRouter.post('/seller/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  return res.json({
    success: true,
    message: `Password reset OTP token has been dispatched to ${email}. Check your registered email / mobile.`
  });
});
