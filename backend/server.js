// backend/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Allow all Vercel preview URLs and your production URLs
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'https://pokemon-ebay-tracker.onrender.com',
      'https://pokemon-ebay-tracker.vercel.app'
    ];
    
    // Allow all Vercel preview URLs
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Increase payload size limit to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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