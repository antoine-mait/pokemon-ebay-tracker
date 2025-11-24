import fs from 'fs';
import 'dotenv/config';

const apiKey = process.env.POKEMON_TCG_API_KEY;

// Add delay function to avoid rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getAllNintendoPromoCards() {
    try {
        console.log('Fetching all Nintendo Black Star Promos cards from API...\n');
        
        let allCards = [];
        let page = 1;
        let hasMorePages = true;
        let retries = 0;
        const maxRetries = 3;
        
        while (hasMorePages) {
            try {
                const response = await fetch(
                    `https://api.pokemontcg.io/v2/cards?q=set.id:np&page=${page}&pageSize=250`,
                    {
                        headers: {
                            'X-Api-Key': apiKey
                        },
                        signal: AbortSignal.timeout(10000) // 10 second timeout
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                allCards = allCards.concat(data.data);
                
                console.log(`Fetched page ${page} - ${allCards.length} cards so far...`);
                
                // Check if there are more pages
                hasMorePages = data.data.length === 250;
                page++;
                retries = 0; // Reset retries on success
                
                // Add delay between requests
                if (hasMorePages) {
                    await delay(500);
                }
                
            } catch (error) {
                if (retries < maxRetries) {
                    retries++;
                    console.log(`⚠️  Request failed, retrying (${retries}/${maxRetries})...`);
                    await delay(2000); // Wait 2 seconds before retry
                } else {
                    throw error;
                }
            }
        }
        
        console.log(`\n✅ Found ${allCards.length} total cards\n`);
        
        // Format the data nicely
        const formattedCards = allCards.map(card => ({
            number: card.number,
            name: card.name,
            rarity: card.rarity,
            imageUrl: card.images.large || card.images.small,
            set: card.set.name,
            setId: card.set.id
        }));
        
        // Save to JSON file
        fs.writeFileSync('npPromo_Black_Star_Nintendo.json', JSON.stringify(formattedCards, null, 2), 'utf8');
        
        console.log('💾 Saved to npPromo_Black_Star_Nintendo.json\n');
        
        // Print all cards
        console.log('All cards:');
        formattedCards.forEach(card => {
            console.log(`${card.number} - ${card.name} (${card.rarity})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n💡 Tips:');
        console.log('- Check your internet connection');
        console.log('- The API might be temporarily down, try again in a few moments');
        console.log('- Verify your API key is correct');
    }
}

getAllNintendoPromoCards();