require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const EBAY_APP_ID = process.env.EBAY_APP_ID;
const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
const PRICE_CACHE_FILE = path.join(__dirname, 'priceCache.json');

// Import your cards data - adjust path if needed
const cardsData = require('../src/cardsData.js').default || require('../src/cardsData.js');

let cachedToken = null;
let tokenExpiry = null;

async function getEbayToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  
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
  
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (7000 * 1000);
  return cachedToken;
}

async function fetchPrice(card, index, total) {
  const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
  
  try {
    const token = await getEbayToken();
    const apiUrl = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
    
    const { data } = await axios.get(apiUrl, {
      params: {
        q: searchQuery,
        limit: 10,
        filter: 'buyingOptions:{FIXED_PRICE}',
        sort: 'price'
      },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=FR'
      }
    });
    
    if (data.itemSummaries && data.itemSummaries.length > 0) {
       const prices = data.itemSummaries
        .map(item => item.price?.value)
        .filter(price => price != null)
        .map(price => parseFloat(price));
      
      if (prices.length > 0) {
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const currency = data.itemSummaries[0].price?.currency;
        
        // Check if price is over 200€
        if (averagePrice > 200) {
          console.log(`[${index + 1}/${total}] 💰 ${card.name}: In your dream (${averagePrice.toFixed(2)} ${currency === 'EUR' ? '€' : currency})`);
          return { query: searchQuery, price: 'In your dream' };
        }
        
        const formattedPrice = `${averagePrice.toFixed(2)} ${currency === 'EUR' ? '€' : currency}`;
        console.log(`[${index + 1}/${total}] ✅ ${card.name}: ${formattedPrice} (avg of ${prices.length} listings)`);
        return { query: searchQuery, price: formattedPrice };
      }
    }
    
    console.log(`[${index + 1}/${total}] ⚠️  ${card.name}: No price found`);
    return { query: searchQuery, price: 'N/A' };
    
  } catch (error) {
    console.error(`[${index + 1}/${total}] ❌ ${card.name}: Error -`, error.message);
    return { query: searchQuery, price: 'Erreur' };
  }
}

async function fetchAllPrices() {
  console.log(`🚀 Starting to fetch prices for ${cardsData.length} cards...`);
  
  const priceCache = {};
  
  for (let i = 0; i < cardsData.length; i++) {
    const result = await fetchPrice(cardsData[i], i, cardsData.length);
    priceCache[result.query] = result.price;
    
    // Save progress every 10 cards
    if ((i + 1) % 10 === 0) {
      await fs.writeFile(PRICE_CACHE_FILE, JSON.stringify(priceCache, null, 2));
      console.log(`💾 Progress saved (${i + 1}/${cardsData.length})\n`);
    }
    
    // Wait 5 seconds between requests to respect rate limits
    if (i < cardsData.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final save
  await fs.writeFile(PRICE_CACHE_FILE, JSON.stringify(priceCache, null, 2));
  console.log('\n✅ All prices fetched and saved!');
  console.log(`📊 Total: ${cardsData.length} cards processed`);
}

fetchAllPrices().catch(console.error);