import express from 'express';
import multer from 'multer';
import { parseCardFile } from '../services/fileParserService.js';
import { fetchCardImage } from '../services/pokemonTcgService.js';
import { getEbayPrice } from '../services/ebayService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const CONCURRENT_REQUESTS = 10;

router.post('/upload-cards', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        const cards = parseCardFile(fileContent);
        
        console.log(`📦 Parsed ${cards.length} cards from file`);
        
        res.json({
            message: 'File parsed successfully',
            totalCards: cards.length,
            cards: cards
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
});

router.post('/enrich-cards', async (req, res) => {
    try {
        const { cards } = req.body;
        const apiKey = process.env.POKEMON_TCG_API_KEY;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔍 Starting image fetch for ${cards.length} cards`);
        console.log(`${'='.repeat(60)}\n`);
        
        // Process ALL cards simultaneously (no batching needed for direct image URLs)
        const enrichedCards = await Promise.all(
            cards.map((card, index) => {
                console.log(`  [${index + 1}/${cards.length}] ${card.name} (${card.setCode} #${card.number}) - ${card.rarity}`);
                return fetchCardImage(card, apiKey);
            })
        );
        
        const withImages = enrichedCards.filter(c => c.imageUrl).length;
        const withoutImages = enrichedCards.length - withImages;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ Complete! ${withImages}/${cards.length} images found (${((withImages/cards.length)*100).toFixed(1)}%)`);
        console.log(`❌ Missing: ${withoutImages} cards`);
        console.log(`${'='.repeat(60)}\n`);
        
        res.json({ cards: enrichedCards });
    } catch (error) {
        console.error('Enrichment error:', error);
        res.status(500).json({ error: 'Failed to enrich cards' });
    }
});

router.post('/fetch-price', async (req, res) => {
  try {
    const { card } = req.body;
    
    if (!card) {
      return res.status(400).json({ error: 'Card data required' });
    }

    console.log(`💰 Fetching price for: ${card.name} ${card.set} (${card.number})`);
    
    const price = await getEbayPrice(card);
    
    // Check if rate limit was hit
    if (price === 'RATE_LIMIT_EXCEEDED') {
      return res.status(429).json({ 
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'eBay API rate limit reached. Please try again tomorrow.'
      });
    }
    
    console.log(`  💵 Price: ${price}`);
    
    res.json({ price });
  } catch (error) {
    console.error('Error in /fetch-price:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

export default router;