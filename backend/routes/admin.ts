import { createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { Collection, Document } from 'mongodb';
import { getMongoDb } from '../data/mongo.js';

export const adminRouter = Router();

interface AdminAccount extends Document {
  username: string;
  passwordHash: string;
  mustChangePassword: boolean;
  tokenVersion: number;
  resetOtpHash?: string;
  resetOtpExpiresAt?: Date;
  resetOtpAttempts?: number;
  resetOtpCreatedAt?: Date;
  loginFailedAttempts?: number;
  loginLockedUntil?: Date;
}

interface AdminToken {
  role: 'admin' | 'admin-reset';
  username: string;
  tokenVersion: number;
  mustChangePassword?: boolean;
}

interface SellerSummary {
  email: string;
  sellerId: string;
  storeName: string;
  sellerName: string;
  phone: string;
  gstin: string;
  status: string;
  approvedAt?: Date;
  suspendedAt?: Date;
  createdAt?: Date;
}

const admins = (): Collection<AdminAccount> => getMongoDb().collection<AdminAccount>('admins');
const jwtSecret = (): string => {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
  return secret;
};
const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) =>
  `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const verifyPassword = (password: string, storedHash: string): boolean => {
  const [salt, encodedHash] = storedHash.split(':');
  if (!salt || !encodedHash) return false;
  const expected = Buffer.from(encodedHash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const secureEqual = (expectedValue: string, providedValue: string): boolean => {
  const expected = Buffer.from(expectedValue);
  const provided = Buffer.from(providedValue);
  return expected.length === provided.length && expected.length > 0 && timingSafeEqual(expected, provided);
};
const getConfiguredAdmin = () => ({
  username: process.env.ADMIN_USERNAME?.trim() || '',
  initialPassword: process.env.ADMIN_INITIAL_PASSWORD || '',
  resetCode: process.env.ADMIN_RESET_CODE || '',
  email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || '',
  mobile: process.env.ADMIN_MOBILE?.replace(/[^\d+]/g, '') || ''
});
const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const hashResetOtp = (username: string, otp: string): string => {
  const secret = process.env.OTP_HASH_SECRET || '';
  if (secret.length < 32) throw new Error('OTP_HASH_SECRET must be configured with at least 32 characters');
  return createHmac('sha256', secret).update(`${username}:${otp}`).digest('hex');
};
const issueAdminToken = (username: string, tokenVersion: number, mustChangePassword: boolean): string =>
  jwt.sign(
    { role: 'admin', username, tokenVersion, mustChangePassword },
    jwtSecret(),
    { algorithm: 'HS256', issuer: 'akshaya-patra-api', audience: 'akshaya-patra-admin', expiresIn: '8h' }
  );

const ensureInitialAdmin = async (): Promise<AdminAccount> => {
  const config = getConfiguredAdmin();
  if (!config.username) throw new Error('ADMIN_USERNAME must be configured');
  const collection = admins();
  let admin = await collection.findOne({ username: config.username });
  if (!admin) {
    if (config.initialPassword.length < 12) {
      throw new Error('ADMIN_INITIAL_PASSWORD must be configured with at least 12 characters to initialize the administrator');
    }
    await collection.updateOne(
      { username: config.username },
      {
        $setOnInsert: {
          username: config.username,
          passwordHash: hashPassword(config.initialPassword),
          mustChangePassword: true,
          tokenVersion: 0,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    admin = await collection.findOne({ username: config.username });
  }
  if (!admin) throw new Error('Administrator account could not be initialized');
  return admin;
};

export const requireAdminSession = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Administrator login is required' });
  try {
    const payload = jwt.verify(token, jwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'akshaya-patra-api',
      audience: 'akshaya-patra-admin'
    });
    if (
      typeof payload === 'string' || payload.role !== 'admin' ||
      typeof payload.username !== 'string' || payload.username !== getConfiguredAdmin().username
    ) {
      return res.status(401).json({ success: false, message: 'Administrator session is invalid' });
    }
    const admin = await admins().findOne({ username: payload.username });
    if (!admin || admin.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Administrator session has been revoked' });
    }
    res.locals.admin = admin;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Administrator session expired or is invalid' });
    }
    console.error('Unable to verify administrator session', error);
    return res.status(503).json({ success: false, message: 'Administrator authentication is unavailable' });
  }
};

const requireAdminAccess = async (req: Request, res: Response, next: NextFunction) => {
  await requireAdminSession(req, res, () => {
    if (res.locals.admin.mustChangePassword) {
      return res.status(403).json({ success: false, message: 'Change the initial administrator password before continuing' });
    }
    return next();
  });
};

const deliverAdminOtp = async (otp: string, email: string, mobile: string): Promise<void> => {
  if (process.env.ADMIN_OTP_MODE?.trim().toLowerCase() === 'development') return;

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const smsAccountSid = process.env.ADMIN_SMS_ACCOUNT_SID || '';
  const smsAuthToken = process.env.ADMIN_SMS_AUTH_TOKEN || '';
  const smsFrom = process.env.ADMIN_SMS_FROM || '';
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !smsAccountSid || !smsAuthToken || !smsFrom) {
    throw new Error('Configure SMTP and ADMIN_SMS_ACCOUNT_SID, ADMIN_SMS_AUTH_TOKEN, and ADMIN_SMS_FROM for production recovery');
  }
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  const smsBody = new URLSearchParams({
    To: mobile,
    From: smsFrom,
    Body: `Akshaya Patra administrator recovery code: ${otp}. It expires in 10 minutes.`
  });
  const smsResponse = fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(smsAccountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${smsAccountSid}:${smsAuthToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: smsBody
  });
  const [emailResult, smsResult] = await Promise.allSettled([
    transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: 'Administrator account recovery code',
      text: `Your administrator recovery code is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`
    }),
    smsResponse
  ]);
  if (smsResult.status === 'fulfilled' && !smsResult.value.ok) {
    throw new Error(`SMS provider rejected the recovery message with HTTP ${smsResult.value.status}`);
  }
  if (emailResult.status === 'rejected') throw emailResult.reason;
  if (smsResult.status === 'rejected') throw smsResult.reason;
};

adminRouter.post('/login', async (req: Request, res: Response) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required' });
  try {
    const admin = await ensureInitialAdmin();
    if (admin.loginLockedUntil && admin.loginLockedUntil.getTime() > Date.now()) {
      return res.status(429).json({ success: false, message: 'Administrator sign-in is temporarily locked; try again later' });
    }
    if (admin.username !== username || !verifyPassword(password, admin.passwordHash)) {
      if (admin.username !== username) {
        return res.status(401).json({ success: false, message: 'Administrator credentials are invalid' });
      }
      const failedAttempts = (admin.loginFailedAttempts || 0) + 1;
      await admins().updateOne(
        { _id: admin._id },
        { $set: {
          loginFailedAttempts: failedAttempts,
          ...(failedAttempts >= 5 ? { loginLockedUntil: new Date(Date.now() + 15 * 60_000) } : {})
        } }
      );
      if (failedAttempts >= 5) return res.status(429).json({ success: false, message: 'Administrator sign-in is temporarily locked; try again later' });
      return res.status(401).json({ success: false, message: 'Administrator credentials are invalid' });
    }
    await admins().updateOne(
      { _id: admin._id },
      { $set: { loginFailedAttempts: 0 }, $unset: { loginLockedUntil: '' } }
    );
    return res.json({
      success: true,
      token: issueAdminToken(admin.username, admin.tokenVersion, admin.mustChangePassword),
      mustChangePassword: admin.mustChangePassword
    });
  } catch (error) {
    console.error('Unable to authenticate administrator', error);
    return res.status(503).json({ success: false, message: 'Administrator login is not configured or available' });
  }
});

adminRouter.post('/password/change', requireAdminSession, async (req: Request, res: Response) => {
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  const admin = res.locals.admin as AdminAccount;
  if (newPassword.length < 14) return res.status(400).json({ success: false, message: 'Use a new password of at least 14 characters' });
  const configuredBootstrapPassword = getConfiguredAdmin().initialPassword;
  const matchesStoredPassword = verifyPassword(currentPassword, admin.passwordHash);
  const matchesBootstrapPassword = admin.mustChangePassword &&
    configuredBootstrapPassword.length >= 12 &&
    secureEqual(configuredBootstrapPassword, currentPassword);
  if (!matchesStoredPassword && !matchesBootstrapPassword) {
    return res.status(403).json({
      success: false,
      message: admin.mustChangePassword
        ? 'Current password does not match the initialized account or configured bootstrap password'
        : 'Current password is incorrect'
    });
  }
  if (verifyPassword(newPassword, admin.passwordHash) || secureEqual(newPassword, currentPassword)) {
    return res.status(400).json({ success: false, message: 'Choose a password different from the current password' });
  }
  try {
    const tokenVersion = admin.tokenVersion + 1;
    await admins().updateOne(
      { _id: admin._id, tokenVersion: admin.tokenVersion },
      { $set: { passwordHash: hashPassword(newPassword), mustChangePassword: false, tokenVersion, passwordChangedAt: new Date() } }
    );
    return res.json({ success: true, token: issueAdminToken(admin.username, tokenVersion, false) });
  } catch (error) {
    console.error('Unable to change administrator password', error);
    return res.status(503).json({ success: false, message: 'Administrator password could not be changed' });
  }
});

adminRouter.post('/recovery/request', async (req: Request, res: Response) => {
  const config = getConfiguredAdmin();
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.replace(/[^\d+]/g, '') : '';
  const resetCode = typeof req.body.resetCode === 'string' ? req.body.resetCode : '';
  if (!config.username || !validEmail(config.email) || !config.mobile || !config.resetCode || config.resetCode.length < 32) {
    return res.status(503).json({ success: false, message: 'Administrator recovery is not configured' });
  }
  if (
    username !== config.username ||
    email !== config.email ||
    mobile !== config.mobile ||
    !secureEqual(config.resetCode, resetCode)
  ) {
    return res.status(403).json({ success: false, message: 'Administrator recovery details could not be verified' });
  }
  try {
    const admin = await ensureInitialAdmin();
    if (admin.resetOtpCreatedAt && Date.now() - admin.resetOtpCreatedAt.getTime() < 60_000) {
      return res.status(429).json({ success: false, message: 'Wait one minute before requesting another recovery code' });
    }
    const otp = randomInt(100000, 1000000).toString();
    await admins().updateOne(
      { _id: admin._id },
      { $set: { resetOtpHash: hashResetOtp(username, otp), resetOtpExpiresAt: new Date(Date.now() + 10 * 60_000), resetOtpAttempts: 0, resetOtpCreatedAt: new Date() } }
    );
    try {
      await deliverAdminOtp(otp, config.email, config.mobile);
    } catch (error) {
      await admins().updateOne({ _id: admin._id }, { $unset: { resetOtpHash: '', resetOtpExpiresAt: '', resetOtpAttempts: '' } });
      throw error;
    }
    return res.json({
      success: true,
      message: process.env.ADMIN_OTP_MODE?.trim().toLowerCase() === 'development'
        ? 'Development recovery code generated'
        : 'Recovery code sent to the configured email and mobile',
      ...(process.env.ADMIN_OTP_MODE?.trim().toLowerCase() === 'development' ? { developmentOtp: otp } : {})
    });
  } catch (error) {
    console.error('Unable to issue administrator recovery code', error);
    return res.status(503).json({ success: false, message: 'Recovery code could not be delivered; verify email and SMS configuration' });
  }
});

adminRouter.post('/recovery/verify', async (req: Request, res: Response) => {
  const config = getConfiguredAdmin();
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const mobile = typeof req.body.mobile === 'string' ? req.body.mobile.replace(/[^\d+]/g, '') : '';
  const resetCode = typeof req.body.resetCode === 'string' ? req.body.resetCode : '';
  const otp = typeof req.body.otp === 'string' ? req.body.otp.trim() : '';
  if (!config.username || !validEmail(config.email) || !config.mobile || !config.resetCode || config.resetCode.length < 32) {
    return res.status(503).json({ success: false, message: 'Administrator recovery is not configured' });
  }
  if (
    username !== config.username || email !== config.email || mobile !== config.mobile ||
    !secureEqual(config.resetCode, resetCode) || !/^\d{6}$/.test(otp)
  ) {
    return res.status(401).json({ success: false, message: 'Recovery code is invalid or expired' });
  }
  try {
    const admin = await admins().findOne({ username });
    const suppliedHash = hashResetOtp(username, otp);
    if (!admin?.resetOtpHash || !secureEqual(admin.resetOtpHash, suppliedHash)) {
      if (admin) await admins().updateOne({ _id: admin._id, resetOtpAttempts: { $lt: 5 } }, { $inc: { resetOtpAttempts: 1 } });
      return res.status(401).json({ success: false, message: 'Recovery code is invalid or expired' });
    }
    const consumed = await admins().findOneAndUpdate(
      { _id: admin._id, resetOtpHash: suppliedHash, resetOtpExpiresAt: { $gt: new Date() }, resetOtpAttempts: { $lt: 5 } },
      { $unset: { resetOtpHash: '', resetOtpExpiresAt: '', resetOtpAttempts: '' } },
      { returnDocument: 'after' }
    );
    if (!consumed) return res.status(401).json({ success: false, message: 'Recovery code is invalid or expired' });
    const resetToken = jwt.sign(
      { role: 'admin-reset', username, tokenVersion: consumed.tokenVersion },
      jwtSecret(),
      { algorithm: 'HS256', issuer: 'akshaya-patra-api', audience: 'akshaya-patra-admin-reset', expiresIn: '10m' }
    );
    return res.json({ success: true, resetToken });
  } catch (error) {
    console.error('Unable to verify administrator recovery code', error);
    return res.status(503).json({ success: false, message: 'Administrator recovery is unavailable' });
  }
});

adminRouter.post('/recovery/complete', async (req: Request, res: Response) => {
  const resetToken = typeof req.body.resetToken === 'string' ? req.body.resetToken : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  if (newPassword.length < 14) return res.status(400).json({ success: false, message: 'Use a new password of at least 14 characters' });
  try {
    const payload = jwt.verify(resetToken, jwtSecret(), {
      algorithms: ['HS256'],
      issuer: 'akshaya-patra-api',
      audience: 'akshaya-patra-admin-reset'
    }) as AdminToken;
    if (payload.role !== 'admin-reset') return res.status(401).json({ success: false, message: 'Recovery session is invalid' });
    const existingAdmin = await admins().findOne({ username: payload.username, tokenVersion: payload.tokenVersion });
    if (!existingAdmin) return res.status(401).json({ success: false, message: 'Recovery session has expired' });
    if (verifyPassword(newPassword, existingAdmin.passwordHash)) {
      return res.status(400).json({ success: false, message: 'Choose a password different from the current password' });
    }
    const tokenVersion = payload.tokenVersion + 1;
    const result = await admins().updateOne(
      { username: payload.username, tokenVersion: payload.tokenVersion },
      {
        $set: { passwordHash: hashPassword(newPassword), mustChangePassword: false, tokenVersion, passwordChangedAt: new Date() },
        $unset: { resetOtpHash: '', resetOtpExpiresAt: '', resetOtpAttempts: '' }
      }
    );
    if (!result.matchedCount) return res.status(401).json({ success: false, message: 'Recovery session has expired' });
    return res.json({ success: true, token: issueAdminToken(payload.username, tokenVersion, false) });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, message: 'Recovery session has expired' });
    }
    console.error('Unable to reset administrator password', error);
    return res.status(503).json({ success: false, message: 'Administrator password could not be reset' });
  }
});

adminRouter.get('/dashboard', requireAdminAccess, async (_req: Request, res: Response) => {
  try {
    const db = getMongoDb();
    const sellersCollection = db.collection<SellerSummary & Document>('sellers');
    const [
      sellers, orders, donations, products, campaigns, orderChannels, referralChannels,
      orderTotals, donationTotals, donationCauses, paymentStatuses, orderStatuses,
      monthlyRevenue, sellerPerformance, lowStockProducts, ticketStatuses, catalogEconomics, donors
    ] = await Promise.all([
      sellersCollection.find({}, {
        projection: {
          _id: 0, email: 1, sellerId: 1, storeName: 1, sellerName: 1, phone: 1, gstin: 1,
          status: 1, approvedAt: 1, suspendedAt: 1, createdAt: 1
        }
      }).sort({ createdAt: -1 }).limit(250).toArray(),
      db.collection('orders').find({}, {
        projection: {
          _id: 0, orderId: 1, createdAt: 1, refid: 1, 'customerDetails.fullName': 1,
          'orderMetadata.sellerId': 1, 'orderMetadata.finalPayableAmount': 1,
          'payment.paymentMethod': 1, 'payment.paymentStatus': 1, 'payment.paymentAmount': 1,
          sellerStatus: 1
        }
      }).sort({ createdAt: -1 }).limit(250).toArray(),
      db.collection('donations').find({}, {
        projection: { _id: 0, donationId: 1, orderId: 1, donorName: 1, amount: 1, cause: 1, source: 1, paymentStatus: 1, recordedAt: 1 }
      }).sort({ recordedAt: -1 }).limit(500).toArray(),
      db.collection('products').find({}, {
        projection: { _id: 0, id: 1, sellerId: 1, name: 1, category: 1, status: 1, stockQuantity: 1, price: 1, updatedAt: 1 }
      }).sort({ updatedAt: -1 }).limit(250).toArray(),
      db.collection('raffle_campaigns').find({}, {
        projection: { _id: 0, campaignId: 1, sellerId: 1, itemName: 1, status: 1, ticketPrice: 1, drawDate: 1 }
      }).sort({ updatedAt: -1 }).limit(100).toArray(),
      db.collection('orders').aggregate([
        { $match: { 'payment.paymentStatus': { $in: ['PAID', 'SUCCESS'] } } },
        { $group: { _id: { $ifNull: ['$payment.paymentMethod', 'Unknown'] }, orders: { $sum: 1 }, revenue: { $sum: { $convert: { input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$payment.paymentAmount'] }, to: 'double', onError: 0, onNull: 0 } } } } },
        { $sort: { revenue: -1 } }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $match: { 'payment.paymentStatus': { $in: ['PAID', 'SUCCESS'] } } },
        { $group: { _id: { $ifNull: ['$refid', 'subhash'] }, orders: { $sum: 1 }, revenue: { $sum: { $convert: { input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$payment.paymentAmount'] }, to: 'double', onError: 0, onNull: 0 } } } } },
        { $sort: { revenue: -1 } }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $in: ['$payment.paymentStatus', ['PAID', 'SUCCESS']] }, { $convert: { input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$payment.paymentAmount'] }, to: 'double', onError: 0, onNull: 0 } }, 0] } } } }
      ]).toArray(),
      db.collection('donations').aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] } } },
        { $group: { _id: null, donations: { $sum: 1 }, revenue: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } } } }
      ]).toArray(),
      db.collection('donations').aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] } } },
        { $group: { _id: { $ifNull: ['$cause', 'Unspecified'] }, contributions: { $sum: 1 }, revenue: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } } } },
        { $sort: { revenue: -1 } }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $group: { _id: { $ifNull: ['$payment.paymentStatus', 'Unknown'] }, orders: { $sum: 1 }, amount: { $sum: { $convert: { input: { $ifNull: ['$payment.paymentAmount', '$orderMetadata.finalPayableAmount'] }, to: 'double', onError: 0, onNull: 0 } } } } },
        { $sort: { orders: -1 } }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $group: { _id: { $ifNull: ['$orderMetadata.orderStatus', '$status'] }, orders: { $sum: 1 } } },
        { $sort: { orders: -1 } }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $match: { createdAt: { $type: 'date' } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ['$payment.paymentStatus', ['PAID', 'SUCCESS']] }, { $convert: { input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$payment.paymentAmount'] }, to: 'double', onError: 0, onNull: 0 } }, 0] } },
          donation: { $sum: { $cond: [{ $in: ['$payment.paymentStatus', ['PAID', 'SUCCESS']] }, { $sum: { $map: { input: { $ifNull: ['$orderDetails', []] }, as: 'item', in: { $convert: { input: '$$item.donationAmount', to: 'double', onError: 0, onNull: 0 } } } } }, 0] } }
        } },
        { $sort: { _id: 1 } },
        { $limit: 24 }
      ]).toArray(),
      db.collection('orders').aggregate([
        { $group: {
          _id: { $ifNull: ['$orderMetadata.sellerId', 'Unassigned'] },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ['$payment.paymentStatus', ['PAID', 'SUCCESS']] }, { $convert: { input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$payment.paymentAmount'] }, to: 'double', onError: 0, onNull: 0 } }, 0] } },
          contribution: { $sum: { $cond: [{ $in: ['$payment.paymentStatus', ['PAID', 'SUCCESS']] }, { $sum: { $map: { input: { $ifNull: ['$orderDetails', []] }, as: 'item', in: { $convert: { input: '$$item.donationAmount', to: 'double', onError: 0, onNull: 0 } } } } }, 0] } }
        } },
        { $sort: { revenue: -1 } },
        { $limit: 100 }
      ]).toArray(),
      db.collection('products').find({ status: { $ne: 'Archived' }, stockQuantity: { $lte: 10 } }, {
        projection: { _id: 0, id: 1, sellerId: 1, name: 1, stockQuantity: 1, status: 1 }
      }).sort({ stockQuantity: 1 }).limit(100).toArray(),
      db.collection('raffle_tickets').aggregate([
        { $group: { _id: { $ifNull: ['$status', 'Unknown'] }, tickets: { $sum: 1 }, revenue: { $sum: { $convert: { input: '$price', to: 'double', onError: 0, onNull: 0 } } } } },
        { $sort: { tickets: -1 } }
      ]).toArray(),
      db.collection('products').aggregate([
        { $match: { status: 'Active' } },
        { $group: {
          _id: null,
          activeProducts: { $sum: 1 },
          stockUnits: { $sum: { $convert: { input: '$stockQuantity', to: 'double', onError: 0, onNull: 0 } } },
          stockCostValue: { $sum: { $multiply: [{ $convert: { input: '$costPrice', to: 'double', onError: 0, onNull: 0 } }, { $convert: { input: '$stockQuantity', to: 'double', onError: 0, onNull: 0 } }] } },
          averageListedMarginPerUnit: { $avg: { $subtract: [{ $convert: { input: '$price', to: 'double', onError: 0, onNull: 0 } }, { $convert: { input: '$costPrice', to: 'double', onError: 0, onNull: 0 } }] } }
        } }
      ]).toArray(),
      db.collection('donations').aggregate([
        { $match: { paymentStatus: { $in: ['PAID', 'SUCCESS'] } } },
        { $group: {
          _id: { email: { $ifNull: ['$donorEmail', 'Unknown'] }, name: { $ifNull: ['$donorName', 'Unknown'] } },
          contributionCount: { $sum: 1 },
          totalContribution: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } },
          lastContributionAt: { $max: '$recordedAt' }
        } },
        { $sort: { totalContribution: -1 } },
        { $limit: 250 }
      ]).toArray()
    ]);
    const auditEvents = await db.collection('admin_audit').find({}, {
      projection: { _id: 0, actor: 1, action: 1, sellerId: 1, occurredAt: 1 }
    }).sort({ occurredAt: -1 }).limit(100).toArray();
    const [vendorTotal, approvedCount, pendingCount, legacyPendingCount, suspendedCount] = await Promise.all([
      db.collection('sellers').countDocuments(),
      db.collection('sellers').countDocuments({ status: 'APPROVED' }),
      db.collection('sellers').countDocuments({ status: 'PENDING_REVIEW' }),
      db.collection('sellers').countDocuments({ status: { $exists: false } }),
      db.collection('sellers').countDocuments({ status: 'SUSPENDED' })
    ]);
    return res.json({
      success: true,
      dashboard: {
        generatedAt: new Date().toISOString(),
        metrics: {
          vendors: { total: vendorTotal, approved: approvedCount, pending: pendingCount + legacyPendingCount, suspended: suspendedCount },
          orders: orderTotals[0] || { orders: 0, revenue: 0 },
          donations: donationTotals[0] || { donations: 0, revenue: 0 },
          products: { total: await db.collection('products').countDocuments(), active: await db.collection('products').countDocuments({ status: 'Active' }) },
          raffleCampaigns: await db.collection('raffle_campaigns').countDocuments()
        },
        sellers,
        orders,
        donations,
        products,
        campaigns,
        orderChannels,
        referralChannels,
        donationCauses,
        financials: {
          paymentStatuses,
          orderStatuses,
          monthlyRevenue,
          sellerPerformance,
          catalogEconomics: catalogEconomics[0] || { activeProducts: 0, stockUnits: 0, stockCostValue: 0, averageListedMarginPerUnit: 0 },
          raffleTicketStatuses: ticketStatuses
        },
        donorContributors: donors,
        operations: {
          lowStockProducts,
          lowStockCount: await db.collection('products').countDocuments({ status: { $ne: 'Archived' }, stockQuantity: { $lte: 10 } }),
          openSellerTickets: await db.collection('seller_portal').aggregate([
            { $unwind: { path: '$tickets', preserveNullAndEmptyArrays: false } },
            { $match: { 'tickets.status': { $in: ['Open', 'In Progress'] } } },
            { $count: 'count' }
          ]).toArray().then(result => result[0]?.count || 0)
        },
        sponsors: [],
        auditEvents
      }
    });
  } catch (error) {
    console.error('Unable to load administrator portfolio dashboard', error);
    return res.status(503).json({ success: false, message: 'Portfolio dashboard data is unavailable' });
  }
});

adminRouter.patch('/sellers/:sellerId/status', requireAdminAccess, async (req: Request, res: Response) => {
  const status = req.body.status;
  if (status !== 'APPROVED' && status !== 'SUSPENDED') {
    return res.status(400).json({ success: false, message: 'Status must be APPROVED or SUSPENDED' });
  }
  try {
    const db = getMongoDb();
    const seller = await db.collection<SellerSummary & Document>('sellers').findOne({ sellerId: req.params.sellerId });
    if (!seller) return res.status(404).json({ success: false, message: 'Seller account was not found' });
    const now = new Date();
    const update = status === 'APPROVED'
      ? { $set: { status, approvedAt: now, approvedBy: (res.locals.admin as AdminAccount).username, updatedAt: now }, $unset: { suspendedAt: '' } }
      : { $set: { status, suspendedAt: now, updatedAt: now } };
    await db.collection('sellers').updateOne({ _id: seller._id }, update);
    await db.collection('admin_audit').insertOne({
      actor: (res.locals.admin as AdminAccount).username,
      action: status === 'APPROVED' ? 'SELLER_APPROVED' : 'SELLER_SUSPENDED',
      sellerId: seller.sellerId,
      occurredAt: now
    });
    let notificationSent = false;
    let notificationMessage = 'Status was saved. Configure SMTP to email the seller.';
    try {
      const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) throw new Error('SMTP is not configured');
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
      await transporter.sendMail({
        from: SMTP_FROM,
        to: seller.email,
        subject: status === 'APPROVED' ? 'Your seller portal access is approved' : 'Your seller portal access has been suspended',
        text: status === 'APPROVED'
          ? `Hello ${seller.sellerName}, your seller account for ${seller.storeName} has been approved. You can now sign in to the separate seller portal.`
          : `Hello ${seller.sellerName}, your seller portal access has been suspended. Please contact the collaboration team for assistance.`
      });
      notificationSent = true;
      notificationMessage = 'Seller status updated and email notification sent.';
    } catch (error) {
      console.error(`Seller ${status.toLowerCase()} notification could not be sent`, error);
    }
    return res.json({ success: true, sellerId: seller.sellerId, status, notificationSent, notificationMessage });
  } catch (error) {
    console.error('Unable to update seller approval status', error);
    return res.status(503).json({ success: false, message: 'Seller approval status could not be updated' });
  }
});
