import { Router, Request, Response } from 'express';
import { getMongoDb } from '../data/mongo.js';

export const cartsRouter = Router();

const isValidCartId = (cartId: string): boolean => /^[a-zA-Z0-9-]{20,80}$/.test(cartId);

cartsRouter.get('/:cartId', async (req: Request, res: Response) => {
  if (!isValidCartId(req.params.cartId)) {
    return res.status(400).json({ success: false, message: 'Invalid cart ID' });
  }

  try {
    const cart = await getMongoDb().collection('carts').findOne({ cartId: req.params.cartId });
    return res.json({ success: true, cart: cart ? { items: cart.items, iphoneTicketsCount: cart.iphoneTicketsCount, raffleCampaignId: cart.raffleCampaignId || null } : null });
  } catch (error) {
    console.error('Failed to load cart', error);
    return res.status(503).json({ success: false, message: 'Cart storage is unavailable' });
  }
});

cartsRouter.put('/:cartId', async (req: Request, res: Response) => {
    const { items, iphoneTicketsCount, raffleCampaignId } = req.body;
    if (!isValidCartId(req.params.cartId) || !Array.isArray(items) || items.length > 1 ||
      items.some((item: { quantity?: number }) => item.quantity !== 1) ||
      !Number.isInteger(iphoneTicketsCount) || iphoneTicketsCount < 0 || iphoneTicketsCount > 100 ||
      (raffleCampaignId !== null && raffleCampaignId !== undefined && !/^[a-zA-Z0-9-]{1,100}$/.test(raffleCampaignId))) {
    return res.status(400).json({ success: false, message: 'Invalid cart data' });
  }

  try {
    const cart = {
      cartId: req.params.cartId,
      items,
      iphoneTicketsCount,
      raffleCampaignId: raffleCampaignId || null,
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    await getMongoDb().collection('carts').updateOne(
      { cartId: cart.cartId },
      { $set: cart },
      { upsert: true }
    );
    return res.json({ success: true, cart: { items, iphoneTicketsCount, raffleCampaignId: raffleCampaignId || null } });
  } catch (error) {
    console.error('Failed to save cart', error);
    return res.status(503).json({ success: false, message: 'Cart storage is unavailable' });
  }
});