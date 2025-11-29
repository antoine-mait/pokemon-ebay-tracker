import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and parse JSON
const setsData = JSON.parse(
  readFileSync(join(__dirname, 'all_sets_full.json'), 'utf-8')
);

// Build setCodeMapping dynamically from JSON (ptcgoCode -> id)
const setCodeMapping = {};
setsData.data.forEach(set => {
  if (set.ptcgoCode) {
    setCodeMapping[set.ptcgoCode] = set.id;
  }
});

// Build setNameMapping (name -> id) for fallback
const setNameMapping = {};
setsData.data.forEach(set => {
  if (set.name) {
    setNameMapping[set.name.toLowerCase()] = set.id;
  }
});

// Special mappings for French set names and promo sets
const specialSetMapping = {
  'promos black star dp': 'dpp',
  'ex : rouge feu & vert feuille': 'ex6',
  'ex : team magma vs team aqua': 'ex4',
  'black star nintendo': 'np',
  'aquapolis': 'ecard2',
  'box topper': 'bp'
};

console.log('📚 Loaded', Object.keys(setCodeMapping).length, 'set codes from all_sets_full.json');
console.log('📚 Loaded', Object.keys(setNameMapping).length, 'set names for fallback');

async function fetchCardImage(card) {
    try {
        // First try: use setCode mapping (ptcgoCode)
        let apiSetCode = setCodeMapping[card.setCode];
        
        // Second try: if not found, try to match by set name
        if (!apiSetCode && card.set) {
            const setNameLower = card.set.toLowerCase();
            
            // Check special mappings first
            if (specialSetMapping[setNameLower]) {
                apiSetCode = specialSetMapping[setNameLower];
                console.log(`    🔄 Special mapping: Found "${card.set}" -> ${apiSetCode}`);
            } else {
                // Try regular name mapping
                apiSetCode = setNameMapping[setNameLower];
                
                if (apiSetCode) {
                    console.log(`    🔄 Fallback: Found "${card.set}" by name -> ${apiSetCode}`);
                }
            }
        }
        
        // Third try: For promo cards, try alternative promo set codes
        if (!apiSetCode && card.setCode === 'PROMO') {
            const promoSets = ['dpp', 'hsp', 'bwp', 'xyp', 'smp', 'swshp', 'svp', 'np', 'basep'];
            for (const promoSet of promoSets) {
                const numberOnly = card.number.replace(/[^0-9]/g, '');
                const imageUrl = `https://images.pokemontcg.io/${promoSet}/${numberOnly}_hires.png`;
                
                const testResponse = await fetch(imageUrl, { method: 'HEAD' });
                if (testResponse.ok) {
                    console.log(`    ✅ Found in promo set: ${promoSet}`);
                    console.log(`    🖼️  ${imageUrl}`);
                    return { ...card, imageUrl };
                }
            }
        }
        
        if (!apiSetCode) {
            console.log(`    ⚠️  No set mapping for: ${card.setCode} / "${card.set}"`);
            return { ...card, imageUrl: null, reason: 'No set mapping' };
        }
        
        // Extract just the card number before the slash (e.g., "12/123" -> "12")
        // Remove 'a' suffix for Aquapolis cards (e.g., "50a" -> "50")
        let numberOnly = card.number.split('/')[0];
        
        // Special handling for Aquapolis cards with 'a' suffix
        if (apiSetCode === 'ecard2' && numberOnly.endsWith('a')) {
            numberOnly = numberOnly.slice(0, -1);
            console.log(`    🔄 Removed 'a' suffix for Aquapolis: ${card.number} -> ${numberOnly}`);
        }
        
        // Build the direct image URL
        const imageUrl = `https://images.pokemontcg.io/${apiSetCode}/${numberOnly}_hires.png`;
        
        console.log(`    🔍 Trying: ${imageUrl}`);
        
        // Test if the image exists by fetching it
        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
        
        if (imageResponse.ok) {
            console.log(`    ✅ Found: ${card.name}`);
            console.log(`    🖼️  ${imageUrl}`);
            return { ...card, imageUrl };
        } else {
            // If _hires doesn't work, try without _hires
            const imageUrlNoHires = `https://images.pokemontcg.io/${apiSetCode}/${numberOnly}.png`;
            console.log(`    🔄 Trying without _hires: ${imageUrlNoHires}`);
            
            const imageResponseNoHires = await fetch(imageUrlNoHires, { method: 'HEAD' });
            
            if (imageResponseNoHires.ok) {
                console.log(`    ✅ Found: ${card.name}`);
                console.log(`    🖼️  ${imageUrlNoHires}`);
                return { ...card, imageUrl: imageUrlNoHires };
            }
            
            console.log(`    ❌ Not found: ${card.name} (${apiSetCode}/${numberOnly})`);
            return { ...card, imageUrl: null, reason: 'Image not found' };
        }
    } catch (error) {
        console.error(`    💥 Error: ${error.message}`);
        return { ...card, imageUrl: null, reason: `Error: ${error.message}` };
    }
}

export { fetchCardImage, setCodeMapping };