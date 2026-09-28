import { randomUUID } from 'crypto';
import { Router, Request, Response } from 'express';
import { getMongoDb } from '../data/mongo.js';
import { RaffleTicketDocument } from '../data/catalog.js';
import { getMongoClient } from '../data/mongo.js';
import { requireSellerSession } from './auth.js';

export const raffleRouter = Router();

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
      draw: drawByCampaign.get(campaign.campaignId) || null
    })) });
  } catch (error) {
    console.error('Unable to load raffle campaigns', error);
    return res.status(503).json({ success: false, message: 'Raffle campaigns are unavailable' });
  }
});

raffleRouter.get('/draw/:campaignId', async (req: Request, res: Response) => {
  try {
    const draw = await getMongoDb().collection('raffle_draws').findOne({ campaignId: req.params.campaignId });
    return res.json({ success: true, draw });
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

raffleRouter.post('/draw', requireSellerSession, async (req: Request, res: Response) => {
  const campaignId = typeof req.body.campaignId === 'string' ? req.body.campaignId : '';
  if (!campaignId) return res.status(400).json({ success: false, message: 'Campaign ID is required' });

  const db = getMongoDb();
  const draws = db.collection('raffle_draws');
  try {
    const existingDraw = await draws.findOne({ campaignId });
    if (existingDraw) return res.json({ success: true, alreadyDrawn: true, draw: existingDraw, winner: existingDraw.winner });

    const campaign = await db.collection('raffle_campaigns').findOne({ campaignId, status: 'ACTIVE' });
    if (!campaign) return res.status(404).json({ success: false, message: 'Active raffle campaign not found' });

    const [candidate] = await db.collection<RaffleTicketDocument>('raffle_tickets')
      .aggregate<RaffleTicketDocument>([
        { $match: { campaignId, status: 'ACTIVE_VALID' } },
        { $sample: { size: 1 } }
      ])
      .toArray();
    if (!candidate) return res.status(400).json({ success: false, message: 'No valid tickets exist for this campaign' });

    const draw = {
      drawId: `DRAW-${randomUUID().toUpperCase()}`,
      campaignId,
      ticketNumber: candidate.ticketNumber,
      buyerId: candidate.buyerId,
      orderId: candidate.orderId,
      winner: candidate,
      drawnAt: new Date(),
      algorithm: 'MongoDB random sample from active unique campaign tickets'
    };
    const session = getMongoClient().startSession();
    try {
      await session.withTransaction(async () => {
        await draws.insertOne(draw, { session });
        const ticketUpdate = await db.collection('raffle_tickets').updateOne(
          { campaignId, ticketNumber: candidate.ticketNumber, buyerId: candidate.buyerId, status: 'ACTIVE_VALID' },
          { $set: { status: 'WINNER_SELECTED' } },
          { session }
        );
        if (!ticketUpdate.matchedCount) throw new Error('DRAW_TICKET_NOT_ACTIVE');
        const campaignUpdate = await db.collection('raffle_campaigns').updateOne(
          { campaignId, status: 'ACTIVE' },
          { $set: { status: 'DRAWN', drawnAt: draw.drawnAt, winningTicketNumber: candidate.ticketNumber } },
          { session }
        );
        if (!campaignUpdate.matchedCount) throw new Error('DRAW_CAMPAIGN_NOT_ACTIVE');
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const winner = await draws.findOne({ campaignId });
        return res.json({ success: true, alreadyDrawn: true, draw: winner, winner: winner?.winner });
      }
      if ((error as Error).message === 'DRAW_TICKET_NOT_ACTIVE' || (error as Error).message === 'DRAW_CAMPAIGN_NOT_ACTIVE') {
        return res.status(409).json({ success: false, message: 'Campaign changed during draw; refresh the ledger and retry' });
      }
      throw error;
    } finally {
      await session.endSession();
    }
    return res.json({ success: true, alreadyDrawn: false, draw, winner: candidate });
  } catch (error) {
    console.error('Unable to complete raffle draw', error);
    return res.status(503).json({ success: false, message: 'Winner draw could not be recorded' });
  }
});