import axios from 'axios';

let cachedToken = null;
let tokenExpiry = null;

async function getEbayToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const EBAY_APP_ID = process.env.EBAY_APP_ID;
  const EBAY_CERT_ID = process.env.EBAY_CERT_ID;
  const credentials = Buffer.from(`${EBAY_APP_ID}:${EBAY_CERT_ID}`).toString('base64');
  
  try {
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
  } catch (error) {
    console.error('Token error:', error.response?.data || error.message);
    throw error;
  }
}

async function getEbayPrice(card) {
  const MAX_RETRIES = 3;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const token = await getEbayToken();
      const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
      
      const { data } = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
        params: {
          q: searchQuery,
          limit: 50,
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
        // Take first 10 items (or all if less than 10)
        const items = data.itemSummaries.slice(0, 10);
        
        // Extract prices and filter out invalid ones
        const prices = items
          .map(item => item.price?.value)
          .filter(price => price !== undefined && price !== null && !isNaN(price));
        
        if (prices.length > 0) {
          // Calculate average
          const avgPrice = prices.reduce((sum, price) => sum + parseFloat(price), 0) / prices.length;
          const currency = items[0].price?.currency;
          
          console.log(`    📊 Found ${prices.length} prices, average: ${avgPrice.toFixed(2)} ${currency}`);
          console.log(`    💰 Price range: ${Math.min(...prices).toFixed(2)} - ${Math.max(...prices).toFixed(2)} ${currency}`);
          
          return `${avgPrice.toFixed(2)} ${currency === 'EUR' ? '€' : currency}`;
        }
      }
      
      return 'N/A';
    } catch (error) {
      console.error(`eBay price error (attempt ${attempt + 1}/${MAX_RETRIES}):`, error.message);
      
      // If token error, clear cache and retry
      if (error.response?.status === 401) {
        cachedToken = null;
        tokenExpiry = null;
      }
      
      // Wait before retry
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return 'Erreur';
}

export { getEbayPrice };
