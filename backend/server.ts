import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ordersRouter } from './routes/orders.js';
import { raffleRouter } from './routes/raffle.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { sellerRouter } from './routes/seller.js';
import { cartsRouter } from './routes/carts.js';
import { catalogRouter } from './routes/catalog.js';
import { connectMongo } from './data/mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Seller product and raffle image uploads are sent as data URLs in JSON.
app.use(express.json({ limit: '12mb' }));

// Health check endpoint (for Render health check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Akshaya Patra Welfare Foundation API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/orders', ordersRouter);
app.use('/api/raffle', raffleRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/carts', cartsRouter);
app.use('/api', catalogRouter);

// Serve frontend static files if built in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Akshaya Patra Welfare Foundation API Server is running.');
    }
  });
});

connectMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`[Akshaya Patra Backend] Server running on port ${PORT}`);
  });
}).catch((error: unknown) => {
  console.error('[Akshaya Patra Backend] Startup failed:', error);
  process.exit(1);
});

export default app;
