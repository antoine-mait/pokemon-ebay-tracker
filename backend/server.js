import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://pokemon-ebay-tracker.onrender.com',
    'https://pokemon-ebay-tracker.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   POST /api/upload-cards`);
  console.log(`   POST /api/enrich-cards`);
  console.log(`   POST /api/fetch-price`);
});