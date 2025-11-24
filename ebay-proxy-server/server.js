require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

// Load from .env file
const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;

const fs = require('fs').promises;
const path = require('path');

const PRICE_CACHE_FILE = path.join(__dirname, 'priceCache.json');
let priceCache = {};

// Load price cache on startup
async function loadPriceCache() {
  try {
    const data = await fs.readFile(PRICE_CACHE_FILE, 'utf8');
    priceCache = JSON.parse(data);
    console.log(`📦 Loaded ${Object.keys(priceCache).length} cached prices`);
  } catch (error) {
    console.log('📦 No price cache found, starting fresh');
    priceCache = {};
  }
}

// Save price cache to file
async function savePriceCache() {
  try {
    await fs.writeFile(PRICE_CACHE_FILE, JSON.stringify(priceCache, null, 2));
    console.log('💾 Price cache saved');
  } catch (error) {
    console.error('Error saving price cache:', error);
  }
}

const rateLimitCache = new Map();
const RATE_LIMIT_MS = 5000;

function checkRateLimit(cardKey) {
  const now = Date.now();
  const lastCall = rateLimitCache.get(cardKey);
  
  if (lastCall && (now - lastCall) < RATE_LIMIT_MS) {
    return false;
  }
  
  rateLimitCache.set(cardKey, now);
  return true;
}

let cachedToken = null;
let tokenExpiry = null;

async function getEbayToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('Using cached token');
    return cachedToken;
  }

  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  
  try {
    console.log('Requesting new token...');
    const { data } = await axios.post(
      'https://api.ebay.com/identity/v1/oauth2/token',
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );
    
    // Cache token (expires in ~7200 seconds, we refresh after 7000)
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (7000 * 1000);
    console.log('New token received and cached');
    
    return cachedToken;
  } catch (error) {
    console.error('Token error:', error.response?.data || error.message);
    throw error;
  }
}

app.get('/api/ebay-price', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (priceCache[query]) {
      console.log('💰 Returning cached price for:', query);
      return res.json({ price: priceCache[query] });
    }

    if (!checkRateLimit(query)) {
      return res.status(429).json({ price: 'Trop rapide' });
    }
    
    const token = await getEbayToken();
    
    // Use Browse API instead - better rate limits
    const apiUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
    
    console.log('Searching eBay Browse API for:', query);
    console.log('Token received:', token ? 'Yes' : 'No');
    
    const { data } = await axios.get(apiUrl, {
      params: {
        q: query,
        limit: 3,
        filter: 'buyingOptions:{FIXED_PRICE}',
        sort: 'price'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=FR'
      }
    });
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.itemSummaries && data.itemSummaries.length > 0) {
      const item = data.itemSummaries[0];
      const price = item.price?.value;
      const currency = item.price?.currency;
      
      if (price) {
      const formattedPrice = `${parseFloat(price).toFixed(2)} ${currency === 'EUR' ? '€' : currency}`;
      console.log('Price found:', formattedPrice);
      
      // SAVE TO CACHE:
      priceCache[query] = formattedPrice;
      await savePriceCache();
      
      res.json({ price: formattedPrice });
    }
    } else {
      console.log('No items found');
      res.json({ price: 'Aucun' });
    }
  } catch (error) {
    console.error('Full error:', JSON.stringify(error.response?.data || error.message, null, 2));
    res.status(500).json({ price: 'Erreur' });
  }
});

app.get('/api/all-prices', async (req, res) => {
  res.json(priceCache);
});

const PORT = 3001;
loadPriceCache().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ eBay proxy server running on http://localhost:${PORT}`);
    console.log(`Using App ID: ${EBAY_APP_ID}`);
  });
});
