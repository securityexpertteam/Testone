import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { getMongoClient, getMongoDb, syncCatalogProductBackup } from '../data/mongo.js';
import { CatalogProduct, RaffleTicketDocument } from '../data/catalog.js';
import { OrderBooking } from '../data/store.js';
import { requireCustomerSession, requireSellerSession } from './auth.js';

export const ordersRouter = Router();

const referralIds = new Set(['subhash', 'srini', 'kumar']);

const normalizeReferralId = (value: unknown): string => {
  if (typeof value !== 'string') return 'subhash';
  const referralId = value.trim().toLowerCase();
  return referralIds.has(referralId) ? referralId : 'subhash';
};

ordersRouter.get('/referral-summary', requireSellerSession, async (_req: Request, res: Response) => {
  try {
    const summaries = await getMongoDb().collection('orders').aggregate<{
      _id: string;
      orderCount: number;
      totalRevenue: number;
    }>([
      { $match: { 'orderMetadata.sellerId': res.locals.sellerId } },
      {
        $group: {
          _id: { $ifNull: ['$refid', 'subhash'] },
          orderCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $convert: {
                input: { $ifNull: ['$orderMetadata.finalPayableAmount', '$orderMetadata.totalAmount'] },
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    const summaryByReferral = new Map(summaries.map(summary => [summary._id, summary]));
    const referralSummaries = ['subhash', 'srini', 'kumar'].map(refid => ({
      refid,
      orderCount: summaryByReferral.get(refid)?.orderCount || 0,
      totalRevenue: summaryByReferral.get(refid)?.totalRevenue || 0
    }));
    return res.json({ success: true, summaries: referralSummaries });
  } catch (error) {
    console.error('Unable to load referral order summary', error);
    return res.status(503).json({ success: false, message: 'Referral order summary is unavailable' });
  }
});

ordersRouter.get('/', requireSellerSession, async (_req: Request, res: Response) => {
  try {
    const orders = await getMongoDb().collection('orders')
      .find({ 'orderMetadata.sellerId': res.locals.sellerId })
      .sort({ 'orderMetadata.orderDate': -1 })
      .toArray();
    return res.json({ success: true, total: orders.length, orders });
  } catch (error) {
    console.error('Unable to load orders', error);
    return res.status(503).json({ success: false, message: 'Orders are unavailable' });
  }
});

ordersRouter.post('/', requireCustomerSession, async (req: Request, res: Response) => {
  const orderData = req.body as OrderBooking;
  if (!orderData?.customerDetails || !orderData.deliveryAddress || !Array.isArray(orderData.orderDetails)) {
    return res.status(400).json({ success: false, message: 'Invalid order booking payload' });
  }
  if (orderData.customerDetails.email.trim().toLowerCase() !== res.locals.customerLoginId) {
    return res.status(403).json({ success: false, message: 'Checkout email must match the verified login ID' });
  }
  if (orderData.orderDetails.length > 1 || orderData.orderDetails.some(item => item.quantity !== 1)) {
    return res.status(400).json({ success: false, message: 'Checkout permits one physical item per order' });
  }

  const requestedTicketCount = Number(orderData.optionalPromotion?.ticketCount || 0);
  if (!Number.isInteger(requestedTicketCount) || requestedTicketCount < 0 || requestedTicketCount > 100) {
    return res.status(400).json({ success: false, message: 'Ticket quantity must be between 0 and 100' });
  }
  if (orderData.orderDetails.length === 0 && requestedTicketCount === 0) {
    return res.status(400).json({ success: false, message: 'Add a product or raffle ticket before checkout' });
  }

  try {
    const db = getMongoDb();
    const loginId = String(res.locals.customerLoginId);
    const buyer = await db.collection('users').findOne({ loginId });
    if (!buyer) return res.status(401).json({ success: false, message: 'Verify your email before checkout' });

    let product: CatalogProduct | null = null;
    if (orderData.orderDetails.length === 1) {
      const productId = orderData.orderDetails[0].productId;
      product = await db.collection<CatalogProduct>('products').findOne({ id: productId, status: 'Active', stockQuantity: { $gt: 0 } });
      if (!product) return res.status(409).json({ success: false, message: 'The selected product is unavailable or out of stock' });
    }

    const requestedCampaignId = orderData.optionalPromotion?.raffleCampaignId || product?.raffle?.campaignId;
    let campaign: Record<string, any> | null = null;
    if (requestedTicketCount > 0) {
      if (!requestedCampaignId) return res.status(400).json({ success: false, message: 'Choose an active raffle campaign before adding tickets' });
      if (product && (!product.raffle?.enabled || product.raffle.campaignId !== requestedCampaignId)) {
        return res.status(409).json({ success: false, message: 'The selected product is not linked to that raffle campaign' });
      }
      campaign = await db.collection('raffle_campaigns').findOne({ campaignId: requestedCampaignId, status: 'ACTIVE' });
      if (!campaign) return res.status(409).json({ success: false, message: 'That raffle campaign is closed' });
    }

    const dbProductPrice = product ? Number(product.discountPrice || product.price) : 0;
    const ticketPrice = campaign ? Number(campaign.ticketPrice) : 0;
    const raffleTotal = requestedTicketCount * ticketPrice;
    const orderId = `APW-${new Date().getFullYear()}-${randomUUID().slice(0, 12).toUpperCase()}`;
    const now = new Date();
    const transactionId = orderData.payment?.transactionId || `TXN-${randomUUID().slice(0, 16).toUpperCase()}`;
    const confirmedOrder: OrderBooking & { orderId: string; buyerId: string; status: string } = {
      ...orderData,
      orderId,
      refid: normalizeReferralId(orderData.refid),
      customerDetails: { ...orderData.customerDetails, email: loginId },
      orderDetails: product ? [{
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        quantity: 1,
        unitPrice: dbProductPrice,
        discount: Math.max(0, product.price - dbProductPrice),
        donationPercentage: product.donationPercentage,
        donationAmount: product.profitToCause,
        donationCause: product.causeSupported === 'medical' ? 'Remote Mobile Medical Clinics' : 'Rural Classroom STEM Kits',
        impactStatement: product.impactNote
      }] : [{
        productId: `raffle-${campaign!.campaignId}`,
        productName: `${campaign!.itemName} Raffle Ticket`,
        productImage: campaign!.itemImage,
        quantity: requestedTicketCount,
        unitPrice: ticketPrice,
        discount: 0,
        donationPercentage: 100,
        donationAmount: raffleTotal,
        donationCause: 'Welfare Causes',
        impactStatement: 'Raffle entry proceeds support the seller campaign.'
      }],
      optionalPromotion: {
        hasBonusEntry: requestedTicketCount > 0,
        promotionTitle: campaign?.itemName || 'Raffle Entry',
        promotionEntryFee: ticketPrice,
        ticketCount: requestedTicketCount,
        promotionSelectionStatus: requestedTicketCount > 0 ? 'SELECTED' : 'NOT_SELECTED',
        raffleCampaignId: campaign?.campaignId
      },
      payment: {
        ...orderData.payment,
        transactionId,
        paymentAmount: dbProductPrice + raffleTotal,
        currency: 'INR',
        paymentTimestamp: now.toISOString()
      },
      orderMetadata: {
        ...orderData.orderMetadata,
        orderId,
        sellerId: product?.sellerId || String(campaign?.sellerId || ''),
        orderDate: now.toISOString(),
        subtotal: dbProductPrice,
        totalAmount: dbProductPrice + raffleTotal,
        finalPayableAmount: dbProductPrice + raffleTotal
      },
      linkedRaffleTickets: [],
      buyerId: String(buyer._id),
      status: 'CONFIRMED'
    };

    const client = getMongoClient();
    const session = client.startSession();
    const generatedTickets: RaffleTicketDocument[] = [];
    try {
      await session.withTransaction(async () => {
        if (product) {
          const stockUpdate = await db.collection<CatalogProduct>('products').updateOne(
            { id: product!.id, stockQuantity: { $gt: 0 }, status: 'Active' },
            { $inc: { stockQuantity: -1 }, $set: { updatedAt: now } },
            { session }
          );
          if (!stockUpdate.modifiedCount) throw new Error('PRODUCT_OUT_OF_STOCK');
        }

        for (let index = 0; index < requestedTicketCount; index += 1) {
          const sequence = await db.collection('raffle_sequences').findOneAndUpdate(
            { campaignId: campaign!.campaignId },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: 'after', session }
          );
          const sequenceValue = Number(sequence?.value || 0);
          const ticketNumber = `TK-${campaign!.campaignId.slice(0, 8).toUpperCase()}-${String(sequenceValue).padStart(8, '0')}`;
          generatedTickets.push({
            ticketNumber,
            campaignId: campaign!.campaignId,
            orderId,
            buyerId: String(buyer._id),
            transactionId,
            customerName: orderData.customerDetails.fullName,
            email: loginId,
            mobileNumber: orderData.customerDetails.mobileNumber,
            whatsAppNumber: orderData.customerDetails.whatsAppNumber,
            alternateMobileNumber: orderData.customerDetails.alternateMobileNumber,
            communityApartment: orderData.deliveryAddress.communityApartment,
            nearbyNodalPoint: orderData.deliveryAddress.nearbyNodalPoint,
            pincode: orderData.deliveryAddress.pincode,
            price: ticketPrice,
            prize: String(campaign!.itemName),
            ticketPrice,
            raffleItemName: String(campaign!.itemName),
            raffleItemPrice: Number(campaign!.itemPrice),
            raffleItemImage: String(campaign!.itemImage),
            drawDate: String(campaign!.drawDate),
            bookingTimestamp: now.toISOString(),
            status: 'ACTIVE_VALID',
            source: 'CART_CHECKOUT'
          });
        }

        confirmedOrder.linkedRaffleTickets = generatedTickets.map(ticket => ticket.ticketNumber);
        await db.collection('orders').insertOne({ ...confirmedOrder, createdAt: now }, { session });
        await db.collection('payments').insertOne({
          paymentId: `PAY-${randomUUID().toUpperCase()}`,
          orderId,
          buyerId: String(buyer._id),
          transactionId,
          paymentMethod: confirmedOrder.payment.paymentMethod,
          paymentProvider: confirmedOrder.payment.paymentProvider,
          paymentStatus: confirmedOrder.payment.paymentStatus,
          amount: confirmedOrder.payment.paymentAmount,
          currency: confirmedOrder.payment.currency,
          recordedAt: now
        }, { session });
        const donationEntries = confirmedOrder.orderDetails
          .filter(item => Number(item.donationAmount) > 0)
          .map(item => ({
            donationId: `DON-${randomUUID().toUpperCase()}`,
            orderId,
            buyerId: String(buyer._id),
            donorName: confirmedOrder.customerDetails.fullName,
            donorEmail: loginId,
            amount: Number(item.donationAmount),
            cause: item.donationCause,
            source: item.productId.startsWith('raffle-') ? 'RAFFLE_TICKET' : 'PRODUCT_PURCHASE',
            paymentStatus: confirmedOrder.payment.paymentStatus,
            recordedAt: now
          }));
        if (donationEntries.length) await db.collection('donations').insertMany(donationEntries, { session });
        if (generatedTickets.length) {
          await db.collection<RaffleTicketDocument>('raffle_tickets').insertMany(generatedTickets, { session });
        }
        await db.collection('users').updateOne(
          { _id: buyer._id },
          { $set: { fullName: orderData.customerDetails.fullName, mobileNumber: orderData.customerDetails.mobileNumber, updatedAt: now } },
          { session }
        );
      });
    } catch (error) {
      if ((error as Error).message === 'PRODUCT_OUT_OF_STOCK') {
        return res.status(409).json({ success: false, message: 'The selected product just sold out' });
      }
      throw error;
    } finally {
      await session.endSession();
    }

    const catalogBackupSync = product
      ? await syncCatalogProductBackup(product.id, product.sellerId)
      : undefined;

    return res.status(201).json({
      success: true,
      message: 'Order and raffle tickets saved to MongoDB',
      order: confirmedOrder,
      generatedTickets,
      catalogBackupSync
    });
  } catch (error) {
    console.error('Unable to create MongoDB order', error);
    return res.status(503).json({ success: false, message: 'Order could not be committed to MongoDB' });
  }
});
