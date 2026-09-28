import { Router, Request, Response } from 'express';
import { getMongoDb } from '../data/mongo.js';
import { CatalogProduct } from '../data/catalog.js';

export const catalogRouter = Router();

catalogRouter.get('/products', async (_req: Request, res: Response) => {
  try {
    const products = await getMongoDb().collection<CatalogProduct>('products')
      .find({ status: 'Active', stockQuantity: { $gt: 0 } })
      .sort({ createdAt: -1 })
      .toArray();
    const sellerIds = Array.from(new Set(products.map(product => product.sellerId)));
    const privateStores = await getMongoDb().collection('seller_portal')
      .find({ sellerId: { $in: sellerIds }, 'profile.settings.storeVisibility': 'PRIVATE' }, { projection: { sellerId: 1 } })
      .toArray();
    const privateSellerIds = new Set(privateStores.map(store => store.sellerId));
    return res.json({
      success: true,
      products: products.filter(product => !privateSellerIds.has(product.sellerId)).map(product => ({
        ...product,
        inStock: product.stockQuantity > 0,
        image: product.image || product.images[0] || '',
        isDiwaliSpecial: product.isDiwaliSpecial ?? product.category === 'diwali-crackers'
      }))
    });
  } catch (error) {
    console.error('Unable to load product catalog', error);
    return res.status(503).json({ success: false, message: 'Product catalog is unavailable' });
  }
});

catalogRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await getMongoDb().collection<CatalogProduct>('products').findOne({
      id: req.params.id,
      status: 'Active',
      stockQuantity: { $gt: 0 }
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, product: { ...product, inStock: product.stockQuantity > 0, image: product.image || product.images[0] || '' } });
  } catch (error) {
    console.error('Unable to load product', error);
    return res.status(503).json({ success: false, message: 'Product is unavailable' });
  }
});
