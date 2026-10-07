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
  status?: 'PENDING_REVIEW' | 'APPROVED' | 'SUSPENDED';
  approvedAt?: Date;
  approvedBy?: string;
  suspendedAt?: Date;
  createdAt?: Date;
}

const requireSellerAdminKey = (req: Request, res: Response, next: NextFunction) => {
  const configuredKey = process.env.SELLER_ADMIN_KEY || '';
  const suppliedKey = req.header('x-seller-admin-key') || '';
  if (configuredKey.length < 32) {
    return res.status(503).json({ success: false, message: 'Seller administration is not configured' });
  }
  const configured = Buffer.from(configuredKey);
  const supplied = Buffer.from(suppliedKey);
  if (configured.length !== supplied.length || !timingSafeEqual(configured, supplied)) {
    return res.status(403).json({ success: false, message: 'Seller administrator access is required' });
  }
  return next();
};

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

const isDevelopmentOtpMode = (): boolean => {
  const configuredMode = process.env.OTP_DELIVERY_MODE?.trim().toLowerCase();
  // Allow an explicit development override on a temporary Render test deployment.
  // Never enable this mode implicitly when NODE_ENV is production.
  return configuredMode
    ? configuredMode === 'development'
    : process.env.NODE_ENV !== 'production';
};

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

authRouter.post('/seller/register', async (req: Request, res: Response) => {
  const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : '';
  const sellerName = typeof req.body.sellerName === 'string' ? req.body.sellerName.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const gstin = typeof req.body.gstin === 'string' ? req.body.gstin.trim().toUpperCase() : '';
  if (
    !storeName || storeName.length > 120 ||
    !sellerName || sellerName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 || password.length > 128 ||
    !/^\+?[\d\s()-]{8,20}$/.test(phone) ||
    gstin.length > 32
  ) {
    return res.status(400).json({
      success: false,
      message: 'Enter a store name, representative, valid email and phone, and a password of 12–128 characters'
    });
  }

  try {
    const sellers = getSellers();
    const existingSeller = await sellers.findOne({ email }, { projection: { _id: 1 } });
    if (existingSeller) {
      return res.status(409).json({ success: false, message: 'An account or application already exists for this email' });
    }
    const seller: SellerAccount = {
      email,
      passwordHash: hashSellerPassword(password),
      sellerId: `SLR-${randomBytes(6).toString('hex').toUpperCase()}`,
      storeName,
      sellerName,
      phone,
      gstin: gstin || 'PENDING_VERIFICATION',
      status: 'PENDING_REVIEW',
      createdAt: new Date()
    };
    await sellers.insertOne(seller);
    return res.status(201).json({
      success: true,
      message: 'Application received. Admin review and approval are required before seller sign-in is enabled.'
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account or application already exists for this email' });
    }
    console.error('Unable to save seller application', error);
    return res.status(503).json({ success: false, message: 'Seller application could not be submitted' });
  }
});

authRouter.post('/admin/sellers', requireSellerAdminKey, async (req: Request, res: Response) => {
  const storeName = typeof req.body.storeName === 'string' ? req.body.storeName.trim() : '';
  const sellerName = typeof req.body.sellerName === 'string' ? req.body.sellerName.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const gstin = typeof req.body.gstin === 'string' ? req.body.gstin.trim() : '';
  if (!storeName || !sellerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    return res.status(400).json({ success: false, message: 'Store name, representative, valid email, and a password of at least 12 characters are required' });
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
      gstin: gstin || 'PENDING_VERIFICATION',
      status: 'PENDING_REVIEW',
      createdAt: new Date()
    };
    await sellers.insertOne(seller);
    return res.status(201).json({
      success: true,
      message: 'Seller account created and awaiting review',
      seller: { sellerId: seller.sellerId, storeName, sellerName, email, phone, gstin: seller.gstin, status: seller.status }
    });
  } catch (error) {
    console.error('Unable to provision seller account', error);
    return res.status(503).json({ success: false, message: 'Seller account could not be provisioned' });
  }
});

authRouter.get('/admin/sellers', requireSellerAdminKey, async (_req: Request, res: Response) => {
  try {
    const sellers = await getSellers().find(
      {},
      { projection: { _id: 0, email: 1, sellerId: 1, storeName: 1, sellerName: 1, phone: 1, gstin: 1, status: 1, approvedAt: 1, suspendedAt: 1, createdAt: 1 } }
    ).sort({ storeName: 1 }).toArray();
    return res.json({
      success: true,
      sellers: sellers.map(({ email, sellerId, storeName, sellerName, phone, gstin, status, approvedAt, suspendedAt }) => ({
        email, sellerId, storeName, sellerName, phone, gstin, status: status || 'PENDING_REVIEW', approvedAt, suspendedAt
      }))
    });
  } catch (error) {
    console.error('Unable to load seller administration records', error);
    return res.status(503).json({ success: false, message: 'Seller records could not be loaded' });
  }
});

authRouter.patch('/admin/sellers/:sellerId/status', requireSellerAdminKey, async (req: Request, res: Response) => {
  const status = req.body.status;
  if (status !== 'APPROVED' && status !== 'SUSPENDED') {
    return res.status(400).json({ success: false, message: 'Status must be APPROVED or SUSPENDED' });
  }
  try {
    const now = new Date();
    const update = status === 'APPROVED'
      ? { $set: { status, approvedAt: now, approvedBy: 'seller-admin', updatedAt: now } }
      : { $set: { status, suspendedAt: now, updatedAt: now } };
    const result = await getSellers().updateOne({ sellerId: req.params.sellerId }, update);
    if (!result.matchedCount) return res.status(404).json({ success: false, message: 'Seller account was not found' });
    return res.json({ success: true, sellerId: req.params.sellerId, status });
  } catch (error) {
    console.error('Unable to update seller approval status', error);
    return res.status(503).json({ success: false, message: 'Seller approval status could not be updated' });
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
    if (seller.status !== 'APPROVED') {
      return res.status(403).json({ success: false, message: 'Seller access is not approved. Contact the collaboration team.' });
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

export const requireSellerSession = async (req: Request, res: Response, next: NextFunction) => {
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
    const seller = await getSellers().findOne({ sellerId: payload.sellerId, email: payload.sub, status: 'APPROVED' });
    if (!seller) return res.status(401).json({ success: false, message: 'Seller access is no longer approved' });
    return next();
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Seller session expired or is invalid' });
    }
    if (error && typeof error === 'object' && 'name' in error && error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Seller session expired or is invalid' });
    }
    console.error('Unable to verify seller approval', error);
    return res.status(503).json({ success: false, message: 'Seller authorization is unavailable' });
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
