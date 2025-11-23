import fs from "fs";
import 'dotenv/config';
import { pokemonNameTranslation } from './pokemonFrenchToEnglish.js';
// --- CONFIG ---
const inputFile = "pokemon_wanted_card_global.txt";
const apiKey = process.env.POKEMON_TCG_API_KEY;
const CONCURRENT_REQUESTS = 10; // Number of concurrent API requests

// --- DICTIONNAIRE DES RARETÉS ---
const rarityMap = {
    holo: "Holo",
    rare: "Rare",
    ultra: "Ultra Rare",
    unco: "Uncommon",
    commune: "Common"
};

// Mapping of your set codes to Pokemon TCG API set codes
const setCodeMapping = {
    'MT': 'dp3',      // Mysterious Treasures
    'DP': 'dp1',      // Diamond & Pearl
    'PROMO': 'dp-p',  // DP Promos
    'PK': 'pk',       // Power Keepers
    'DF': 'df',       // Dragon Frontiers
    'CG': 'cg',       // Crystal Guardians
    'HP': 'hp',       // Holon Phantoms
    'LM': 'lm',       // Legend Maker
    'DS': 'ds',       // Delta Species
    'UF': 'uf',       // Unseen Forces
    'EM': 'em',       // Emerald
    'DX': 'dx',       // Deoxys
    'RFVF': 'ex3',    // FireRed LeafGreen
    'HL': 'hl',       // Hidden Legends
    'TMTA': 'ex2',    // Team Magma vs Team Aqua
    'DR': 'ex1',      // Dragon
    'SS': 'ss',       // Sandstorm
    'RS': 'rs',       // Ruby & Sapphire
    'SK': 'sk',       // Skyridge
    'AQ': 'aq',       // Aquapolis
    'EX': 'ex',       // Expedition
    'N4': 'neo4',     // Neo Destiny
    'NR': 'neo3',     // Neo Revelation
    'ND': 'neo2',     // Neo Discovery
    'NG': 'neo1'      // Neo Genesis
};


// Function to translate Pokemon name
function translatePokemonName(frenchName) {
    // Remove any special characters or extra spaces
    const cleanName = frenchName.trim();
    
    // Return English name if translation exists, otherwise return original
    return pokemonNameTranslation[cleanName] || cleanName;
}

// Function to fetch card image from Pokemon TCG API
async function fetchCardImage(card, index, total) {
    try {
        console.log(`[${index + 1}/${total}] 🔍 ${card.name} (${card.setCode} ${card.number})`);
        
        const apiSetCode = setCodeMapping[card.setCode];
        if (!apiSetCode) {
            console.log(`   ❌ No mapping for: ${card.setCode}`);
            return { ...card, imageUrl: null, reason: 'No set mapping' };
        }
        
        // Extract just the card number before the slash
        const numberOnly = card.number.split('/')[0];
        const cardId = `${apiSetCode}-${numberOnly}`;
        
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const imageUrl = data.data.images.large || data.data.images.small;
            console.log(`   ✅ Found: ${data.data.name}`);
            console.log(`   🖼️  ${imageUrl}`);
            return { ...card, imageUrl };
        } else {
            // Try with translated name
            const translatedName = translatePokemonName(card.name);
            console.log(`   🔄 Trying translated name: ${translatedName}`);
            
            const searchUrl = `https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(translatedName)}" set.id:${apiSetCode}`;
            
            const searchResponse = await fetch(searchUrl, {
                headers: {
                    'X-Api-Key': apiKey
                }
            });
            
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                
                if (searchData.data && searchData.data.length > 0) {
                    const imageUrl = searchData.data[0].images.large || searchData.data[0].images.small;
                    console.log(`   ✅ Found via search: ${searchData.data[0].name}`);
                    console.log(`   🖼️  ${imageUrl}`);
                    return { ...card, imageUrl };
                }
            }
            
            console.log(`   ❌ Not found: ${cardId}`);
            return { ...card, imageUrl: null, reason: 'Card not found in API' };
        }
    } catch (error) {
        console.error(`   💥 Error: ${error.message}`);
        return { ...card, imageUrl: null, reason: `Error: ${error.message}` };
    }
}

// --- LECTURE DU FICHIER ---
console.log(`📖 Reading file: ${inputFile}`);
const rawText = fs.readFileSync(inputFile, "utf8");
console.log(`✅ File read successfully\n`);

// --- REGEX ---
const setRegex = /\[u\](.+?)\[\/u\]/;
const cardRegex = /:(\w+):\s+([0-9A-Za-z/]+)\s+(.+)/;

let currentSet = "";
let setCode = "";
const cardsData = [];

// EXTRACT CODE OF SET FROM IMG URL LIKE minis/DP.png
const setCodeRegex = /minis\/([A-Z0-9]+)\.png/;

console.log(`🔍 Parsing card data...`);
rawText.split("\n").forEach((line) => {
    // Detect SET
    const setMatch = setRegex.exec(line);
    if (setMatch) {
        currentSet = setMatch[1].trim();

        // Detect associated set code from the previous [IMG] line
        const imgMatch = setCodeRegex.exec(line);
        if (imgMatch) {
            setCode = imgMatch[1];
            console.log(`📦 Found set: ${currentSet} (Code: ${setCode})`);
        }
        return;
    }

    // Detect cards
    const cardMatch = cardRegex.exec(line);
    if (cardMatch && currentSet) {
        const rarityKey = cardMatch[1].toLowerCase();
        const rarity = rarityMap[rarityKey] || rarityKey;

        const number = cardMatch[2];
        const name = cardMatch[3].replace(/\s+/g, " ").trim();

        cardsData.push({
            set: currentSet,
            setCode: setCode || "",
            number,
            name,
            rarity,
            imageUrl: null
        });
    }
});

console.log(`✅ Parsed ${cardsData.length} cards from file\n`);

// Fetch images from API with concurrency
async function enrichCardsWithImages() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting API fetch with ${CONCURRENT_REQUESTS} concurrent requests`);
    console.log(`${'='.repeat(60)}\n`);
    
    const results = [];
    const total = cardsData.length;
    
    // Process cards in batches
    for (let i = 0; i < cardsData.length; i += CONCURRENT_REQUESTS) {
        const batch = cardsData.slice(i, i + CONCURRENT_REQUESTS);
        const batchNum = Math.floor(i / CONCURRENT_REQUESTS) + 1;
        const totalBatches = Math.ceil(cardsData.length / CONCURRENT_REQUESTS);
        
        console.log(`\n📦 Batch ${batchNum}/${totalBatches} (Cards ${i + 1}-${Math.min(i + CONCURRENT_REQUESTS, total)})`);
        console.log(`${'─'.repeat(60)}`);
        
        // Fetch all cards in this batch concurrently
        const batchPromises = batch.map((card, batchIndex) => 
            fetchCardImage(card, i + batchIndex, total)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        saveProgress(results);
        
        const successCount = results.filter(c => c.imageUrl).length;
        const failCount = results.length - successCount;
        
        console.log(`${'─'.repeat(60)}`);
        console.log(`📊 Progress: ${results.length}/${total} cards (${Math.round(results.length/total*100)}%)`);
        console.log(`   ✅ Success: ${successCount} (${Math.round(successCount/results.length*100)}%)`);
        console.log(`   ❌ Failed: ${failCount} (${Math.round(failCount/results.length*100)}%)`);
        
        // Small delay between batches to avoid rate limiting
        if (i + CONCURRENT_REQUESTS < cardsData.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ All cards processed!`);
    console.log(`${'='.repeat(60)}`);
    
    return results;
}

function saveProgress(results) {
    const outputJS = "const cardsData = " + JSON.stringify(results, null, 4) + ";\n\nexport default cardsData;\n";
    fs.writeFileSync("cardsData.js", outputJS, "utf8");
}
// Main execution
async function main() {
    const startTime = Date.now();
    
    const results = await enrichCardsWithImages();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // --- OUTPUT JS FILE ---
    console.log(`\n💾 Writing output file...`);
    const outputJS = "const cardsData = " + JSON.stringify(results, null, 4) + ";\n\nexport default cardsData;\n";
    fs.writeFileSync("cardsData.js", outputJS, "utf8");
    console.log(`✅ File written: cardsData.js`);
    
    const cardsWithImages = results.filter(c => c.imageUrl).length;
    const cardsWithoutImages = results.filter(c => !c.imageUrl);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 FINAL STATISTICS`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total cards: ${results.length}`);
    console.log(`✅ With images: ${cardsWithImages} (${Math.round(cardsWithImages/results.length*100)}%)`);
    console.log(`❌ Without images: ${cardsWithoutImages.length} (${Math.round(cardsWithoutImages.length/results.length*100)}%)`);
    console.log(`⏱️  Time taken: ${duration}s`);
    console.log(`⚡ Speed: ${(results.length/duration).toFixed(1)} cards/second`);
    console.log(`${'='.repeat(60)}\n`);
    
    // List all cards without images
    if (cardsWithoutImages.length > 0) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`❌ CARDS NOT FOUND (${cardsWithoutImages.length} total)`);
        console.log(`${'='.repeat(60)}\n`);
        
        cardsWithoutImages.forEach((card, index) => {
            console.log(`${index + 1}. ${card.name} (${card.setCode} ${card.number}) - ${card.set}`);
            if (card.reason) {
                console.log(`   Reason: ${card.reason}`);
            }
        });
        
        // Also save to a file
        const notFoundList = cardsWithoutImages.map((card, index) => 
            `${index + 1}. ${card.name} (${card.setCode} ${card.number}) - ${card.set}${card.reason ? ` - ${card.reason}` : ''}`
        ).join('\n');
        
        fs.writeFileSync("cards_not_found.txt", notFoundList, "utf8");
        console.log(`\n💾 Not found list saved to: cards_not_found.txt`);
    }
}

main().catch(console.error);