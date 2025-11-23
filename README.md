# Pokémon Cards Tracker

A web application to track and manage your Pokémon card collection with eBay price monitoring.

## Features

- 📋 **Card Management**: Display and organize Pokémon cards by set/extension
- 🔍 **Search & Filter**: Search by card name or number, filter by set and rarity
- ✅ **Collection Tracking**: Check off cards you've obtained
- 📊 **Statistics**: View collection stats by rarity and sets
- 💰 **eBay Integration**: Direct links to check current prices on eBay
- 📤 **Export Options**: 
  - Export filtered results to CSV
  - Generate eBay RSS feeds (OPML format) for price monitoring

## Data Source

The card data (`pokemon_wanted_card_global.txt`) is generated from a **CardMarket export file**. 

⚠️ **Note**: This project is currently **not fully working** and under development.

## How It Works

1. Export your card list from CardMarket
2. Convert the export file to the required format in `cardsData.js` using node generateCardsData.js
3. The app displays all cards grouped by extension/set
4. Use filters to find specific cards
5. Click "Voir prix" to check current eBay prices
6. Export RSS feeds to monitor price changes via feed readers (like Inoreader)

## Tech Stack

- React
- Tailwind CSS
- Lucide React (icons)

## Installation
```bash
npm install
npm run dev
```

## Usage

### Searching
- Use the search bar to find cards by name or number
- Filter by extension (set) or rarity

### Tracking Collection
- Check the "Obtenu" checkbox for cards you own
- The header shows total cards and checked count

### Exporting
- **CSV Export**: Downloads filtered cards as a CSV file
- **RSS Feeds**: Generates OPML file with eBay RSS feeds for the first 150 cards (can be imported into Inoreader or similar feed readers)

## Known Issues

- RSS feeds may encounter eBay geo-blocking issues when accessed through feed readers
- Data import from CardMarket needs manual conversion

## Future Improvements

- [ ] Automated CardMarket import
- [ ] Price history tracking
- [ ] Better RSS feed handling
- [ ] Collection value calculator
- [ ] Multiple collection support

## License

MIT