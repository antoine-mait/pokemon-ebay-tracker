import fs from "fs";
import 'dotenv/config';

const apiKey = process.env.POKEMON_TCG_API_KEY;

// Fetch a specific set and save full JSON
async function fetchSetFullJSON(setId) {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/sets/${setId}`, {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n📦 Full JSON Response:');
            console.log(JSON.stringify(data, null, 2));
            
            fs.writeFileSync(`set_${setId}_full.json`, JSON.stringify(data, null, 2), 'utf8');
            console.log(`\n💾 Saved to: set_${setId}_full.json`);
            return data;
        } else {
            console.log(`❌ Error: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

// Fetch all sets and save full JSON
async function fetchAllSetsFullJSON() {
    try {
        const response = await fetch('https://api.pokemontcg.io/v2/sets?pageSize=250', {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n📦 Full JSON Response for all sets:');
            console.log(JSON.stringify(data, null, 2));
            
            fs.writeFileSync('all_sets_full.json', JSON.stringify(data, null, 2), 'utf8');
            console.log(`\n💾 Saved to: all_sets_full.json`);
            return data;
        } else {
            console.log(`❌ Error: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

// Fetch a card and save full JSON
async function fetchCardFullJSON(cardId) {
    try {
        const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, {
            headers: {
                'X-Api-Key': apiKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('\n📦 Full JSON Response:');
            console.log(JSON.stringify(data, null, 2));
            
            fs.writeFileSync(`card_${cardId.replace('/', '_')}_full.json`, JSON.stringify(data, null, 2), 'utf8');
            console.log(`\n💾 Saved to: card_${cardId.replace('/', '_')}_full.json`);
            return data;
        } else {
            console.log(`❌ Error: ${response.status}`);
            return null;
        }
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.log('Usage:');
    console.log('  node script.js set <setId>     - Get full JSON for a specific set');
    console.log('  node script.js sets            - Get full JSON for all sets');
    console.log('  node script.js card <cardId>   - Get full JSON for a specific card');
    console.log('\nExamples:');
    console.log('  node script.js set dp3');
    console.log('  node script.js sets');
    console.log('  node script.js card dp3-1');
} else if (command === 'set' && args[1]) {
    fetchSetFullJSON(args[1]);
} else if (command === 'sets') {
    fetchAllSetsFullJSON();
} else if (command === 'card' && args[1]) {
    fetchCardFullJSON(args[1]);
} else {
    console.log('❌ Invalid command or missing argument');
}