import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import nodemailer from 'nodemailer';
import { getMongoClient, getMongoDb, syncCatalogProductBackup } from '../data/mongo.js';
import { requireSellerSession } from './auth.js';
import { CatalogProduct, RaffleCampaignConfig } from '../data/catalog.js';

export const sellerRouter = Router();

const portalCollection = () => getMongoDb().collection<any>('seller_portal');
const productsCollection = () => getMongoDb().collection<CatalogProduct>('products');

const catalogValidationError = (data: any): string | null => {
  if (!data || typeof data.name !== 'string' || !data.name.trim()) return 'Product name is required';
  if (typeof data.sku !== 'string' || !data.sku.trim()) return 'Product SKU is required';
  if (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0) return 'Product price must be greater than zero';
  if (!Number.isInteger(Number(data.stockQuantity)) || Number(data.stockQuantity) < 0) return 'Stock must be a non-negative whole number';
  if (typeof data.imageUrl !== 'string' && typeof data.image !== 'string' && !data.images?.[0]) return 'A real product image is required';
  if (data.raffle?.enabled) {
    const drawDate = typeof data.raffle.drawDate === 'string' ? new Date(data.raffle.drawDate) : null;
    if (!drawDate || !Number.isFinite(drawDate.getTime()) || drawDate.getTime() < Date.now() + 31 * 24 * 60 * 60 * 1000) {
      return 'Choose a raffle draw date and time at least one month from today';
    }
  }
  if (data.raffle?.enabled && (
    typeof data.raffle.itemName !== 'string' || !data.raffle.itemName.trim() ||
    typeof data.raffle.itemImage !== 'string' || !data.raffle.itemImage.trim() ||
    !Number.isFinite(Number(data.raffle.itemPrice)) || Number(data.raffle.itemPrice) <= 0 ||
    !Number.isFinite(Number(data.raffle.ticketPrice)) || Number(data.raffle.ticketPrice) <= 0 ||
    typeof data.raffle.drawDate !== 'string' || !data.raffle.drawDate.trim()
  )) return 'Enabled raffle entries need a prize name, prize value, prize image, ticket price, and draw date';
  return null;
};

const saveRaffleCampaign = async (
  sellerId: string,
  productId: string,
  requested: Partial<RaffleCampaignConfig> | undefined,
  previous?: CatalogProduct
): Promise<RaffleCampaignConfig | undefined> => {
  const campaigns = getMongoDb().collection('raffle_campaigns');
  const tickets = getMongoDb().collection('raffle_tickets');
  const oldCampaignId = previous?.raffle?.campaignId;
  if (!requested?.enabled) {
    if (oldCampaignId) await campaigns.updateOne({ campaignId: oldCampaignId }, { $set: { status: 'CLOSED', closedAt: new Date() } });
    return undefined;
  }

  const oldCampaign = oldCampaignId ? await campaigns.findOne({ campaignId: oldCampaignId }) : null;
  const settingsChanged = !previous?.raffle ||
    previous.raffle.itemName !== requested.itemName ||
    previous.raffle.itemPrice !== Number(requested.itemPrice) ||
    previous.raffle.itemImage !== requested.itemImage ||
    previous.raffle.ticketPrice !== Number(requested.ticketPrice) ||
    previous.raffle.drawDate !== requested.drawDate;
  const ticketsSold = oldCampaignId ? await tickets.countDocuments({ campaignId: oldCampaignId }) : 0;
  const drawn = oldCampaignId ? await getMongoDb().collection('raffle_draws').findOne({ campaignId: oldCampaignId }) : null;
  const needsNewCampaign = !oldCampaignId || (settingsChanged && (ticketsSold > 0 || Boolean(drawn)));
  const campaignId = needsNewCampaign ? randomUUID() : oldCampaignId;
  if (oldCampaignId && campaignId !== oldCampaignId) {
    await campaigns.updateOne({ campaignId: oldCampaignId }, { $set: { status: 'CLOSED', closedAt: new Date() } });
  }

  const config: RaffleCampaignConfig = {
    campaignId,
    enabled: true,
    itemName: requested.itemName!.trim(),
    itemPrice: Number(requested.itemPrice),
    itemImage: requested.itemImage!.trim(),
    ticketPrice: Number(requested.ticketPrice),
    drawDate: requested.drawDate!.trim()
  };
  await campaigns.updateOne(
    { campaignId },
    {
      $set: { sellerId, productId, ...config, status: oldCampaign?.status === 'DRAWN' && campaignId === oldCampaignId ? 'DRAWN' : 'ACTIVE', updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  );
  await getMongoDb().collection('raffle_sequences').updateOne(
    { campaignId },
    { $setOnInsert: { campaignId, value: 0 } },
    { upsert: true }
  );
  return config;
};

const buildCatalogProduct = (
  data: any,
  sellerId: string,
  id: string,
  previous?: CatalogProduct,
  raffle?: RaffleCampaignConfig
): CatalogProduct => {
  const price = Number(data.price);
  const donationPercentage = Math.min(100, Math.max(0, Number(data.donationPercentage || 0)));
  const stockQuantity = Number(data.stockQuantity);
  const image = String(data.imageUrl || data.image || data.images?.[0] || previous?.image || '').trim();
  const profitToCause = Number.isFinite(Number(data.profitToCause)) ? Number(data.profitToCause) : Math.round(price * donationPercentage) / 100;
  return {
    ...previous,
    id,
    sellerId,
    name: String(data.name).trim(),
    category: String(data.category || previous?.category || 'diwali-crackers'),
    description: String(data.description || ''),
    image,
    images: Array.isArray(data.images) && data.images.length ? data.images : [image],
    price,
    costPrice: Number(data.costPrice ?? Math.max(0, price - profitToCause)),
    discountPrice: data.discountPrice === '' || data.discountPrice == null ? undefined : Number(data.discountPrice),
    stockQuantity,
    inStock: stockQuantity > 0,
    sku: String(data.sku).trim(),
    barcode: String(data.barcode || previous?.barcode || `BAR-${randomUUID()}`),
    donationPercentage,
    profitToCause,
    causeSupported: data.causeSupported === 'medical' || /medical|clinic/i.test(String(data.donationCause || '')) ? 'medical' : 'education',
    impactNote: String(data.impactNote || data.impactStatement || previous?.impactNote || ''),
    status: stockQuantity === 0 ? 'Out of stock' : data.status === 'Draft' ? 'Draft' : 'Active',
    shippingAvailability: String(data.shippingAvailability || previous?.shippingAvailability || 'Hyderabad Metro Only'),
    weight: String(data.weight || previous?.weight || ''),
    dimensions: String(data.dimensions || previous?.dimensions || ''),
    rating: previous?.rating || 0,
    reviewsCount: previous?.reviewsCount || 0,
    taxExempt: false,
    itemsIncluded: Array.isArray(data.itemsIncluded) ? data.itemsIncluded : previous?.itemsIncluded,
    isDiwaliSpecial: data.isDiwaliSpecial ?? String(data.category).toLowerCase() === 'diwali-crackers',
    raffle,
    createdAt: previous?.createdAt || new Date().toISOString().slice(0, 10),
    updatedAt: new Date()
  };
};

const createInitialPortalState = async (sellerId: string) => {
  const account = await getMongoDb().collection('sellers').findOne({ sellerId });
  return {
    sellerId,
    inventoryLogs: [],
    payouts: [],
    notifications: [],
    tickets: [],
    profile: account ? {
      sellerId,
      storeName: account.storeName,
      sellerName: account.sellerName,
      email: account.email,
      phone: account.phone,
      gstin: account.gstin,
      settings: {},
      policies: {}
    } : { sellerId },
    updatedAt: new Date()
  };
};

const removeLegacyDemoPortalRecords = async (sellerId: string, initialState: Awaited<ReturnType<typeof createInitialPortalState>>) => {
  if (sellerId !== 'SLR-HYD-8821') return;
  await portalCollection().updateOne(
    { sellerId },
    { $pull: {
      inventoryLogs: { id: { $in: ['ADJ-2026-091', 'ADJ-2026-092'] } },
      payouts: { id: { $in: ['PAY-2026-SEP-01', 'PAY-2026-SEP-02'] } },
      notifications: { id: { $in: ['notif-001', 'notif-002', 'notif-003', 'notif-004'] } },
      tickets: { id: { $in: ['TCK-2026-041', 'TCK-2026-039'] } }
    } } as any
  );
  await portalCollection().updateOne(
    { sellerId, 'profile.storeDescription': 'Certified rural cooperative of 65 women artisans, organic oil pressers, and traditional potters from Medak and Sangareddy districts. In partnership with Akshaya Patra Welfare Foundation, 100% of profits fund child nutrition and rural livelihood.', 'profile.storeLogo': 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80' },
    { $set: { profile: initialState.profile, updatedAt: new Date() } }
  );
};

const sellerOrderView = (order: any) => {
  const metadata = order.orderMetadata || {};
  const customer = order.customerDetails || {};
  const address = order.deliveryAddress || {};
  const payment = order.payment || {};
  const statusMap: Record<string, string> = {
    CONFIRMED: 'Confirmed',
    PROCESSING: 'Packed',
    OUT_FOR_DELIVERY: 'Shipped',
    DELIVERED: 'Delivered',
    READY_FOR_PICKUP: 'Ready for Pickup'
  };
  const status = order.sellerStatus || statusMap[metadata.orderStatus] || 'Pending';
  const details = Array.isArray(order.orderDetails) ? order.orderDetails : [];
  return {
    orderId: metadata.orderId,
    refid: order.refid || 'subhash',
    customerName: customer.fullName || '',
    customerMobile: customer.mobileNumber || '',
    customerEmail: customer.email || '',
    community: address.communityApartment || '',
    nearbyNodalPoint: address.nearbyNodalPoint || '',
    pincode: address.pincode || '',
    deliveryAddress: [address.houseFlatNumber, address.streetAddress, address.areaLocality, address.city, address.pincode].filter(Boolean).join(', '),
    orderDate: metadata.orderDate || '',
    estimatedDeliveryDate: metadata.estimatedDeliveryDate || '',
    status,
    pickupReadyAt: order.pickupReadyAt,
    totalAmount: Number(metadata.totalAmount || 0),
    donationTotal: details.reduce((sum: number, item: any) => sum + Number(item.donationAmount || 0), 0),
    paymentMethod: payment.paymentMethod || '',
    paymentStatus: payment.paymentStatus || '',
    courierPartner: order.courierPartner,
    trackingNumber: order.trackingNumber,
    linkedRaffleTickets: order.linkedRaffleTickets || [],
    items: details.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      donationAmount: item.donationAmount,
      donationCause: item.donationCause
    }))
  };
};

sellerRouter.get('/portal/state', requireSellerSession, async (_req: Request, res: Response) => {
  try {
    const sellerId = String(res.locals.sellerId);
    const initialState = await createInitialPortalState(sellerId);
    await portalCollection().updateOne({ sellerId }, { $setOnInsert: initialState }, { upsert: true });
    await removeLegacyDemoPortalRecords(sellerId, initialState);
    const [state, products, orders] = await Promise.all([
      portalCollection().findOne({ sellerId }, { projection: { _id: 0 } }),
      getMongoDb().collection<CatalogProduct>('products').find({ sellerId }).sort({ createdAt: -1 }).toArray(),
      getMongoDb().collection('orders').find({ 'orderMetadata.sellerId': sellerId }).sort({ createdAt: -1 }).toArray()
    ]);
    return res.json({ success: true, state: { ...state, products, orders: orders.map(sellerOrderView) } });
  } catch (error) {
    console.error('Unable to load seller portal state', error);
    return res.status(503).json({ success: false, message: 'Seller data could not be loaded from MongoDB' });
  }
});

sellerRouter.put('/portal/state', requireSellerSession, async (req: Request, res: Response) => {
  if (req.body.orders !== undefined) {
    return res.status(400).json({ success: false, message: 'Update orders through the order-status endpoint' });
  }
  const fields = ['inventoryLogs', 'payouts', 'notifications', 'tickets', 'profile'] as const;
  const updates: Record<string, unknown> = {};
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      if (field === 'profile' ? (!req.body[field] || typeof req.body[field] !== 'object' || Array.isArray(req.body[field])) : !Array.isArray(req.body[field])) {
        return res.status(400).json({ success: false, message: `Invalid seller portal field: ${field}` });
      }
      updates[field] = req.body[field];
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No seller portal changes provided' });
  }

  try {
    const sellerId = String(res.locals.sellerId);
    updates.updatedAt = new Date();
    await portalCollection().updateOne({ sellerId }, { $set: updates });
    const state = await portalCollection().findOne({ sellerId }, { projection: { _id: 0 } });
    return res.json({ success: true, state });
  } catch (error) {
    console.error('Unable to save seller portal state', error);
    return res.status(503).json({ success: false, message: 'Seller data could not be saved to MongoDB' });
  }
});

sellerRouter.post('/portal/tickets', requireSellerSession, async (req: Request, res: Response) => {
  const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
  const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
  const category = typeof req.body.category === 'string' ? req.body.category.trim() : '';
  if (!subject || !description || !category) {
    return res.status(400).json({ success: false, message: 'Ticket category, subject, and description are required' });
  }
  try {
    const sellerId = String(res.locals.sellerId);
    const ticket = {
      id: `TCK-${randomUUID().toUpperCase()}`,
      subject,
      description,
      category,
      priority: 'Medium',
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    await portalCollection().updateOne(
      { sellerId },
      { $push: { tickets: { $each: [ticket], $position: 0 } }, $set: { updatedAt: new Date() } } as any,
      { upsert: true }
    );
    return res.status(201).json({ success: true, ticket });
  } catch (error) {
    console.error('Unable to save seller support ticket', error);
    return res.status(503).json({ success: false, message: 'Support ticket could not be saved to MongoDB' });
  }
});

sellerRouter.patch('/portal/orders/:id/status', requireSellerSession, async (req: Request, res: Response) => {
  const { status, courierPartner, trackingNumber } = req.body;
  const allowedStatuses: Record<string, string> = {
    Pending: 'CONFIRMED',
    Confirmed: 'CONFIRMED',
    Packed: 'PROCESSING',
    Shipped: 'OUT_FOR_DELIVERY',
    'Ready for Pickup': 'READY_FOR_PICKUP',
    Delivered: 'DELIVERED',
    Cancelled: 'CANCELLED',
    Refunded: 'REFUNDED'
  };
  if (!allowedStatuses[status]) return res.status(400).json({ success: false, message: 'Invalid order status' });
  try {
    const sellerId = String(res.locals.sellerId);
    const db = getMongoDb();
    const existing = await db.collection('orders').findOne({ 'orderMetadata.orderId': req.params.id, 'orderMetadata.sellerId': sellerId });
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found for this seller' });
    if (status === 'Ready for Pickup' && !['Packed', 'Ready for Pickup'].includes(existing.sellerStatus || '')) {
      return res.status(409).json({ success: false, message: 'Pack this order before making it available at the nodal point' });
    }
    if (status === 'Ready for Pickup') {
      const email = String(existing.customerDetails?.email || '');
      if (!existing.deliveryAddress?.nearbyNodalPoint || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'A nodal point and customer email are required before pickup notification' });
      }
      const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
      if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
        return res.status(503).json({ success: false, message: 'Pickup notifications require SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM' });
      }
      const pickupCode = randomInt(100000, 1000000).toString();
      const secret = process.env.OTP_HASH_SECRET;
      if (!secret) return res.status(503).json({ success: false, message: 'OTP_HASH_SECRET must be configured for pickup claims' });
      const pickupCodeHash = createHmac('sha256', secret).update(`${req.params.id}:${pickupCode}`).digest('hex');
      const pickupReadyAt = new Date();
      await db.collection('orders').updateOne(
        { _id: existing._id, 'orderMetadata.sellerId': sellerId },
        { $set: { sellerStatus: status, 'orderMetadata.orderStatus': allowedStatuses[status], pickupCodeHash, pickupCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000), pickupCodeAttempts: 0, pickupReadyAt, updatedAt: pickupReadyAt } }
      );
      try {
        const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: SMTP_USER, pass: SMTP_PASS } });
        await transporter.sendMail({
          from: SMTP_FROM,
          to: email,
          subject: `Your order is ready at ${existing.deliveryAddress.nearbyNodalPoint}`,
          text: `Hello ${existing.customerDetails.fullName || 'there'}, your order ${req.params.id} is ready for pickup at ${existing.deliveryAddress.nearbyNodalPoint}. Show this one-time pickup code to the seller: ${pickupCode}. It expires in 7 days and can only be used once. Keep it private until you collect your order.`
        });
      } catch (mailError) {
        await db.collection('orders').updateOne({ _id: existing._id, pickupCodeHash }, { $unset: { pickupCodeHash: '', pickupCodeExpiresAt: '', pickupCodeAttempts: '', pickupReadyAt: '' }, $set: { sellerStatus: existing.sellerStatus || 'Packed', 'orderMetadata.orderStatus': existing.orderMetadata?.orderStatus || 'PROCESSING' } });
        throw mailError;
      }
      const readyOrder = await db.collection('orders').findOne({ _id: existing._id });
      return res.json({ success: true, notificationSent: true, order: sellerOrderView(readyOrder) });
    }
    const session = getMongoClient().startSession();
    try {
      await session.withTransaction(async () => {
        await db.collection('orders').updateOne(
          { _id: existing._id, 'orderMetadata.sellerId': sellerId },
          { $set: {
            sellerStatus: status,
            'orderMetadata.orderStatus': allowedStatuses[status],
            ...(courierPartner ? { courierPartner } : {}),
            ...(trackingNumber ? { trackingNumber } : {}),
            updatedAt: new Date()
          }, $unset: { pickupCodeHash: '', pickupCodeExpiresAt: '', pickupCodeAttempts: '' } },
          { session }
        );
        if (status === 'Cancelled' && existing.sellerStatus !== 'Cancelled') {
          const items = Array.isArray(existing.orderDetails) ? existing.orderDetails : [];
          for (const item of items) {
            if (String(item.productId).startsWith('raffle-')) continue;
            await db.collection('products').updateOne(
              { id: item.productId, sellerId },
              { $inc: { stockQuantity: Number(item.quantity || 0) }, $set: { inStock: true, status: 'Active', updatedAt: new Date() } },
              { session }
            );
          }
          await db.collection('raffle_tickets').updateMany(
            { orderId: req.params.id, status: 'ACTIVE_VALID' },
            { $set: { status: 'CANCELLED', cancelledAt: new Date() } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
    if (status === 'Cancelled' && existing.sellerStatus !== 'Cancelled') {
      const items = Array.isArray(existing.orderDetails) ? existing.orderDetails : [];
      for (const item of items) {
        if (String(item.productId).startsWith('raffle-')) continue;
        await syncCatalogProductBackup(String(item.productId), sellerId);
      }
    }
    const order = await getMongoDb().collection('orders').findOne({ 'orderMetadata.orderId': req.params.id, 'orderMetadata.sellerId': sellerId });
    return res.json({ success: true, order: sellerOrderView(order) });
  } catch (error) {
    console.error('Unable to update seller order', error);
    return res.status(503).json({ success: false, message: 'Order status could not be saved to MongoDB' });
  }
});

sellerRouter.post('/portal/orders/:id/claim', requireSellerSession, async (req: Request, res: Response) => {
  const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
  if (!/^\d{6}$/.test(code)) return res.status(400).json({ success: false, message: 'Enter the six-digit pickup code' });
  try {
    const sellerId = String(res.locals.sellerId);
    const orders = getMongoDb().collection('orders');
    const order = await orders.findOne({ 'orderMetadata.orderId': req.params.id, 'orderMetadata.sellerId': sellerId, sellerStatus: 'Ready for Pickup' });
    if (!order) return res.status(409).json({ success: false, message: 'Order is not waiting for pickup' });
    if (!order.pickupCodeHash || !order.pickupCodeExpiresAt || new Date(order.pickupCodeExpiresAt).getTime() <= Date.now()) {
      return res.status(410).json({ success: false, message: 'Pickup code expired; notify the buyer to request a new pickup notification' });
    }
    if (Number(order.pickupCodeAttempts || 0) >= 5) return res.status(429).json({ success: false, message: 'Too many incorrect attempts; issue a new pickup code' });
    const secret = process.env.OTP_HASH_SECRET;
    if (!secret) return res.status(503).json({ success: false, message: 'OTP_HASH_SECRET must be configured' });
    const submittedHash = createHmac('sha256', secret).update(`${req.params.id}:${code}`).digest('hex');
    const expected = Buffer.from(String(order.pickupCodeHash), 'hex');
    const submitted = Buffer.from(submittedHash, 'hex');
    if (expected.length !== submitted.length || !timingSafeEqual(expected, submitted)) {
      await orders.updateOne({ _id: order._id, sellerStatus: 'Ready for Pickup' }, { $inc: { pickupCodeAttempts: 1 } });
      return res.status(400).json({ success: false, message: 'Pickup code is incorrect' });
    }
    const result = await orders.updateOne(
      { _id: order._id, sellerStatus: 'Ready for Pickup', pickupCodeHash: order.pickupCodeHash, pickupCodeExpiresAt: { $gt: new Date() } },
      { $set: { sellerStatus: 'Delivered', 'orderMetadata.orderStatus': 'DELIVERED', deliveredAt: new Date(), updatedAt: new Date() }, $unset: { pickupCodeHash: '', pickupCodeExpiresAt: '', pickupCodeAttempts: '' } }
    );
    if (!result.modifiedCount) return res.status(409).json({ success: false, message: 'Pickup code has already been used or expired' });
    const claimedOrder = await orders.findOne({ _id: order._id });
    return res.json({ success: true, order: sellerOrderView(claimedOrder) });
  } catch (error) {
    console.error('Unable to claim nodal pickup', error);
    return res.status(503).json({ success: false, message: 'Pickup claim could not be saved' });
  }
});

sellerRouter.post('/portal/products', requireSellerSession, async (req: Request, res: Response) => {
  const validationError = catalogValidationError(req.body);
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  try {
    const sellerId = String(res.locals.sellerId);
    const id = randomUUID();
    const raffle = await saveRaffleCampaign(sellerId, id, req.body.raffle);
    const product = buildCatalogProduct(req.body, sellerId, id, undefined, raffle);
    await productsCollection().insertOne(product);
    const backupSync = await syncCatalogProductBackup(id, sellerId);
    return res.status(201).json({ success: true, product, backupSync });
  } catch (error) {
    console.error('Unable to create seller product', error);
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ success: false, message: 'A product with this SKU already exists' });
    return res.status(503).json({ success: false, message: 'Product could not be saved to MongoDB' });
  }
});

sellerRouter.patch('/portal/products/:id', requireSellerSession, async (req: Request, res: Response) => {
  const validationError = catalogValidationError(req.body);
  if (validationError) return res.status(400).json({ success: false, message: validationError });
  try {
    const sellerId = String(res.locals.sellerId);
    const previous = await productsCollection().findOne({ id: req.params.id, sellerId });
    if (!previous) return res.status(404).json({ success: false, message: 'Product not found' });
    const raffle = await saveRaffleCampaign(sellerId, previous.id, req.body.raffle, previous);
    const updatedProduct = buildCatalogProduct(req.body, sellerId, previous.id, previous, raffle);
    await productsCollection().replaceOne({ id: previous.id, sellerId }, updatedProduct);
    const backupSync = await syncCatalogProductBackup(previous.id, sellerId);
    const products = await productsCollection().find({ sellerId }).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, message: 'Product updated successfully', product: updatedProduct, products, backupSync });
  } catch (error) {
    console.error('Unable to update seller product', error);
    if ((error as { code?: number }).code === 11000) return res.status(409).json({ success: false, message: 'A product with this SKU already exists' });
    return res.status(503).json({ success: false, message: 'Product changes could not be saved to MongoDB' });
  }
});

sellerRouter.delete('/portal/products/:id', requireSellerSession, async (req: Request, res: Response) => {
  try {
    const sellerId = String(res.locals.sellerId);
    const existing = await productsCollection().findOne({ id: req.params.id, sellerId });
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    if (existing.raffle?.campaignId) {
      await getMongoDb().collection('raffle_campaigns').updateOne(
        { campaignId: existing.raffle.campaignId },
        { $set: { status: 'CLOSED', closedAt: new Date() } }
      );
    }
    await productsCollection().deleteOne({ id: existing.id, sellerId });
    const backupSync = await syncCatalogProductBackup(existing.id, sellerId, 'DELETE');
    const products = await productsCollection().find({ sellerId }).sort({ createdAt: -1 }).toArray();
    return res.json({ success: true, products, backupSync });
  } catch (error) {
    console.error('Unable to delete seller product', error);
    return res.status(503).json({ success: false, message: 'Product could not be deleted from MongoDB' });
  }
});

sellerRouter.patch('/portal/products/:id/stock', requireSellerSession, async (req: Request, res: Response) => {
  const newQuantity = Number(req.body.newQuantity);
  const reason = typeof req.body.reason === 'string' ? req.body.reason : 'Physical Stock Count Audit';
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    return res.status(400).json({ success: false, message: 'Stock quantity must be a non-negative whole number' });
  }
  try {
    const sellerId = String(res.locals.sellerId);
    const previous = await productsCollection().findOne({ id: req.params.id, sellerId });
    if (!previous) return res.status(404).json({ success: false, message: 'Product not found' });
    const updatedProduct = {
      ...previous,
      stockQuantity: newQuantity,
      inStock: newQuantity > 0,
      status: newQuantity === 0 ? 'Out of stock' as const : previous.status === 'Out of stock' ? 'Active' as const : previous.status,
      updatedAt: new Date()
    };
    const log = {
      id: randomUUID(),
      productId: previous.id,
      productName: previous.name,
      sku: previous.sku,
      previousQuantity: previous.stockQuantity,
      updatedQuantity: newQuantity,
      changeAmount: newQuantity - previous.stockQuantity,
      reason,
      adjustedBy: sellerId,
      timestamp: new Date().toISOString()
    };
    const session = getMongoClient().startSession();
    try {
      await session.withTransaction(async () => {
        await productsCollection().replaceOne({ id: previous.id, sellerId }, updatedProduct, { session });
        await portalCollection().updateOne({ sellerId }, { $push: { inventoryLogs: { $each: [log], $position: 0 } } } as any, { session });
      });
    } finally {
      await session.endSession();
    }
    const portal = await portalCollection().findOne({ sellerId }, { projection: { inventoryLogs: 1 } });
    const backupSync = await syncCatalogProductBackup(previous.id, sellerId);
    return res.json({ success: true, product: updatedProduct, inventoryLogs: portal?.inventoryLogs || [], backupSync });
  } catch (error) {
    console.error('Unable to save inventory adjustment', error);
    return res.status(503).json({ success: false, message: 'Inventory adjustment could not be committed to MongoDB' });
  }
});
