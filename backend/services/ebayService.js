import axios from 'axios';

let cachedToken = null;
let tokenExpiry = null;

// Sanitize card name - remove special characters that cause search issues
function removeDeltaSymbol(text) {
  return text
    .replace(/δ´/g, '')           // Remove delta symbol
    .replace(/Espèces Delta/gi, '') // Remove "Espèces Delta" (case insensitive)
    .trim();                        // Remove extra spaces
}

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
  const RETRY_DELAY = 1000; // ADD THIS LINE - 1 second delay
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const token = await getEbayToken();
      
      // Sanitize card data
      const cleanName = removeDeltaSymbol(card.name);
      // const cleanSet = removeDeltaSymbol(card.set);
      const cleanNumber = removeDeltaSymbol(card.number).replace('/', ' ');

      // const searchQuery = `pokemon ${cleanName} ${cleanNumber} ${cleanSet}`;
      const searchQuery = `pokemon ${cleanName} ${cleanNumber}`;
      
      console.log(`🔍 Searching eBay: "${searchQuery}"`);
      
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
      
      console.log(`    ⚠️ No results found for "${searchQuery}"`);
      return 'N/A';
    } catch (error) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.errors?.[0]?.message || error.message;
      
      console.error(`❌ eBay API error (attempt ${attempt + 1}/${MAX_RETRIES}):`, statusCode, errorMessage);
      
      // Handle specific error codes
      if (statusCode === 401) {
        // Token expired, clear cache and retry
        cachedToken = null;
        tokenExpiry = null;
        console.log('🔄 Token expired, getting new token...');
      } else if (statusCode === 429) {
        // Rate limit hit - return specific error message
        console.error('⚠️ Rate limit exceeded!');
        return 'RATE_LIMIT_EXCEEDED';  // Special error code
      } else if (statusCode === 500 || statusCode === 503) {
        // Server error, retry
        console.log('🔄 Server error, retrying...');
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  return 'Erreur';
}

export { getEbayPrice, removeDeltaSymbol  };