import priceCacheJSON from '../priceCache.json';
const CACHE_KEY = 'pokemon_price_cache';
const CACHE_VERSION = '1.0';

export const loadPriceCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    let localStorageCache = {};
    
    if (cached) {
      const { version, data } = JSON.parse(cached);
      if (version === CACHE_VERSION) {
        localStorageCache = data;
      }
    }
    
    // ✅ Merge JSON file prices with localStorage (localStorage takes priority)
    return { ...priceCacheJSON, ...localStorageCache };
  } catch (error) {
    console.error('Error loading price cache:', error);
    return priceCacheJSON; // ✅ Fallback to JSON if localStorage fails
  }
};

export const savePriceCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      data: cache,
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error saving price cache:', error);
  }
};

export const getCachedPrice = (card, cache) => {
  const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
  return cache[searchQuery] || 'N/A';
};

export const updatePriceInCache = (card, price, cache) => {
  const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
  const newCache = { ...cache, [searchQuery]: price };
  savePriceCache(newCache);
  return newCache;
};

export const exportPriceCacheAsJSON = (cache) => {
  const blob = new Blob([JSON.stringify(cache, null, 2)], { 
    type: 'application/json' 
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'priceCache.json';
  link.click();
};