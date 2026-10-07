import { Router, Request, Response } from 'express';
import { getMongoDb } from '../data/mongo.js';
import { RaffleTicketDocument } from '../data/catalog.js';
import { Document } from 'mongodb';

export const raffleRouter = Router();

const toPublicDraw = (draw: Document | null) => {
  if (!draw) return null;
  const winner = typeof draw.winner === 'object' && draw.winner !== null
    ? draw.winner as Document
    : {};
  return {
    campaignId: draw.campaignId,
    drawId: draw.drawId,
    prizeName: draw.prizeName,
    drawnAt: draw.drawnAt,
    winner: {
      customerName: winner.customerName,
      ticketNumber: winner.ticketNumber || draw.ticketNumber
    }
  };
};

raffleRouter.get('/campaigns', async (_req: Request, res: Response) => {
  try {
    const campaigns = await getMongoDb().collection('raffle_campaigns')
      .find({ status: { $in: ['ACTIVE', 'DRAWN'] } })
      .sort({ createdAt: -1 })
      .toArray();
    const draws = await getMongoDb().collection('raffle_draws')
      .find({ campaignId: { $in: campaigns.map(campaign => campaign.campaignId) } })
      .toArray();
    const drawByCampaign = new Map(draws.map(draw => [draw.campaignId, draw]));
    return res.json({ success: true, campaigns: campaigns.map(campaign => ({
      ...campaign,
      draw: toPublicDraw(drawByCampaign.get(campaign.campaignId) || null)
    })) });
  } catch (error) {
    console.error('Unable to load raffle campaigns', error);
    return res.status(503).json({ success: false, message: 'Raffle campaigns are unavailable' });
  }
});

raffleRouter.get('/draw/:campaignId', async (req: Request, res: Response) => {
  try {
    const draw = await getMongoDb().collection('raffle_draws').findOne({ campaignId: req.params.campaignId });
    return res.json({ success: true, draw: toPublicDraw(draw) });
  } catch (error) {
    console.error('Unable to load campaign draw', error);
    return res.status(503).json({ success: false, message: 'Campaign draw is unavailable' });
  }
});

raffleRouter.get('/tickets', async (req: Request, res: Response) => {
  const campaignId = typeof req.query.campaignId === 'string' ? req.query.campaignId : undefined;
  try {
    const query = campaignId ? { campaignId } : {};
    const tickets = await getMongoDb().collection<RaffleTicketDocument>('raffle_tickets')
      .find(query)
      .sort({ bookingTimestamp: -1, ticketNumber: 1 })
      .toArray();
    return res.json({ success: true, total: tickets.length, tickets });
  } catch (error) {
    console.error('Unable to load raffle tickets', error);
    return res.status(503).json({ success: false, message: 'Raffle ledger is unavailable' });
  }
});

raffleRouter.get('/search', async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) return res.json({ success: true, count: 0, tickets: [] });
  const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const tickets = await getMongoDb().collection<RaffleTicketDocument>('raffle_tickets')
      .find({
        $or: [
          { ticketNumber: { $regex: safeQuery, $options: 'i' } },
          { customerName: { $regex: safeQuery, $options: 'i' } },
          { email: { $regex: safeQuery, $options: 'i' } },
          { mobileNumber: { $regex: safeQuery } },
          { whatsAppNumber: { $regex: safeQuery } },
          { orderId: { $regex: safeQuery, $options: 'i' } },
          { communityApartment: { $regex: safeQuery, $options: 'i' } }
        ]
      })
      .sort({ bookingTimestamp: -1 })
      .toArray();
    return res.json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    console.error('Unable to search raffle tickets', error);
    return res.status(503).json({ success: false, message: 'Raffle search is unavailable' });
  }
});