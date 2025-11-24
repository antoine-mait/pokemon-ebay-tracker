import fs from 'fs';
import 'dotenv/config';

const apiKey = process.env.POKEMON_TCG_API_KEY;

async function getAllRubyAndSaphireCards() {
    try {
        console.log('Fetching all Ruby & Sapphire cards from API...\n');
        
        const response = await fetch('https://api.pokemontcg.io/v2/cards?q=set.id:ex1', {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`✅ Found ${data.data.length} cards\n`);
        
        // Format the data nicely
        const formattedCards = data.data.map(card => ({
            number: card.number,
            name: card.name,
            rarity: card.rarity,
            imageUrl: card.images.large || card.images.small,
            set: card.set.name,
            setId: card.set.id
        }));
        
        // Save to JSON file
        fs.writeFileSync('ex1_ruby_sapphire.json', JSON.stringify(formattedCards, null, 2), 'utf8');
        
        console.log('💾 Saved to ex1_ruby_sapphire.json\n');
        
        // Print first 10 for preview
        console.log('Preview (first 10 cards):');
        formattedCards.slice(0, 10).forEach(card => {
            console.log(`${card.number} - ${card.name} (${card.rarity})`);
        });
        
        console.log(`\n... and ${formattedCards.length - 10} more cards`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getAllRubyAndSaphireCards();