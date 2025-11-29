# 🎴 Pokémon Cards Collection Manager

A full-stack web application for managing and tracking your Pokémon card collection with automatic price fetching from eBay and card images from the Pokémon TCG API.

![React](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC)

## ✨ Features

- 📤 **File Upload**: Import your card collection from a `.txt` file
- 🖼️ **Automatic Image Fetching**: Gets card images from Pokémon TCG API
- 💰 **Price Tracking**: Fetches average prices from eBay France
- 🔍 **Advanced Filtering**: Search by name, number, set, or rarity
- 📊 **Statistics Dashboard**: View collection statistics at a glance
- 💾 **Smart Caching**: Images and prices are cached locally
- 🌓 **Dark/Light Mode**: Toggle between themes
- 📥 **Export Features**: 
  - Export to CSV
  - Generate eBay RSS feeds (OPML format)
  - Export price cache as JSON
- ✅ **Card Selection**: Check/uncheck cards for tracking
- 🔗 **Direct eBay Links**: Click any card to search on eBay

## 🏗️ Architecture

```
04-POKEMON-CARDS/
├── backend/
│   ├── routes/
│   │   └── uploadRoutes.js          # API endpoints
│   ├── services/
│   │   ├── fileParserService.js     # Parse .txt card files
│   │   ├── pokemonTcgService.js     # Fetch card images from API
│   │   ├── ebayService.js           # Fetch prices from eBay
│   │   └── all_sets_full.json       # Pokémon TCG set mappings
│   ├── checkAPI.js                  # Utility to test Pokémon TCG API
│   ├── server.js                    # Express server entry point
│   └── .env                         # Environment variables
├── src/
│   ├── components/
│   │   └── FileUpload.jsx           # File upload component
│   ├── utils/
│   │   └── priceCache.js            # Price caching utilities
│   ├── App.jsx                      # Main application component
│   ├── cardsData.js                 # Initial card data
│   └── main.jsx                     # React entry point
├── public/
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Pokémon TCG API key (get one at https://dev.pokemontcg.io/)
- eBay Developer account with API credentials

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd 04-POKEMON-CARDS
```

2. **Install dependencies**
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. **Setup environment variables**

Create a `.env` file in the `backend/` directory:

```env
# Pokémon TCG API
POKEMON_TCG_API_KEY=your_pokemon_tcg_api_key_here

# eBay API
EBAY_APP_ID=your_ebay_app_id_here
EBAY_CERT_ID=your_ebay_cert_id_here

# Server
PORT=3001
```

**Getting API Keys:**

- **Pokémon TCG API**: 
  1. Visit https://dev.pokemontcg.io/
  2. Sign up for a free account
  3. Generate an API key from your dashboard

- **eBay API**:
  1. Visit https://developer.ebay.com/
  2. Create a developer account
  3. Create an application to get your App ID and Cert ID
  4. Use Production keys for live data or Sandbox keys for testing

4. **Start the backend server**
```bash
cd backend
npm start
```

The backend will run on `http://localhost:3001`

5. **Start the frontend** (in a new terminal)
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📖 Usage

### Uploading Your Card Collection

1. Prepare a `.txt` file in the following format:

```txt
[u]Set Name[/u] [img]https://www.pokecardex.com/assets/images/symboles/minis/DP.png[/img]
:holo: 1/130 Torterra
:rare: 2/130 Infernape
:ultra: 3/130 Empoleon
:commune: 4/130 Turtwig

[u]Another Set[/u] [img]https://www.pokecardex.com/assets/images/symboles/minis/MT.png[/img]
:holo: 5/100 Pikachu
```

**Format rules:**
- Set names wrapped in `[u]...[/u]`
- Set code extracted from image URL (e.g., `DP.png` → `DP`)
- Cards format: `:rarity: number/total Name`
- Supported rarities: `holo`, `rare`, `ultra`, `unco`, `commune`

2. Click "Choose .txt File" button
3. Select your file
4. Wait for the upload and image fetching process
5. Your cards will be displayed with images and organized by set

### Fetching Prices

- **Automatic Caching**: Prices are cached to localStorage to avoid redundant API calls
- **Bulk Refresh**: Click "Refresh All Prices" to update all visible cards
- **Progress Tracking**: Progress is shown during bulk operations (batches of 100)
- **Price Display**: Average price from top 10 eBay listings shown on each card

### Filtering & Searching

- **Search**: Type card name or number in the search box
- **Filter by Set**: Select from dropdown to view specific sets
- **Filter by Rarity**: Choose rarity level (Holo, Ultra Rare, etc.)
- **Combined Filters**: All filters work together
- **Real-time Updates**: Results update as you type/select

### Checking Cards

- Click the checkbox in the top-left corner of any card
- Checked cards count is displayed in the header
- Use this to track which cards you need to purchase or have sold

### Exporting Data

1. **CSV Export**: Click "Exporter en CSV" to download current filtered view
   - Includes: Extension, Code, Number, Name, Rarity, Price
   - UTF-8 encoded with BOM for Excel compatibility

2. **RSS Feeds**: Click "Générer flux RSS eBay (OPML)" 
   - Generates OPML file for first 150 cards
   - Import into RSS reader to monitor eBay listings

3. **Price Cache**: Click "Export Price Cache" 
   - Downloads complete price cache as JSON
   - Use to backup or transfer price data

## 🛠️ API Endpoints

### Backend API

**POST** `/api/upload-cards`
- Upload and parse card list file
- Body: FormData with file
- Returns: `{ message, totalCards, cards: [...] }`

**POST** `/api/enrich-cards`
- Fetch images for cards from Pokémon TCG API
- Body: `{ cards: [...] }`
- Returns: `{ cards: [...] }` with `imageUrl` fields populated

**POST** `/api/fetch-price`
- Fetch average price from eBay for a single card
- Body: `{ card: {...} }`
- Returns: `{ price: "10.50 €" }`

**GET** `/health`
- Health check endpoint
- Returns: `{ status: "ok", timestamp: "..." }`

## 💾 Data Storage

### LocalStorage Keys

- `generated_cards_data`: Stores uploaded cards with images
- `pokemon_price_cache`: Stores fetched prices with timestamps

### Cache Strategy

- **Images**: Cached permanently in localStorage
- **Prices**: Cached with version number
- **Merging**: New uploads preserve existing images
- **Clear Cache**: Delete localStorage keys to reset

## 🎨 Customization

### Set Icons

Edit the `setImageMap` in `App.jsx` to add new set icons:

```javascript
const setImageMap = {
  'YOUR_SET_CODE': 'https://url-to-icon.png',
  // ...
};
```

### Rarity Colors

Modify rarity badge colors in the card render section:

```javascript
card.rarity === 'Ultra Rare' ? 'bg-purple-600 text-white' :
card.rarity === 'Holo' ? 'bg-yellow-500 text-gray-900' :
// ...
```

### Price Display Format

Edit `getCachedPrice()` in `priceCache.js` to change price formatting.

## 🐛 Troubleshooting

### Images Not Loading

1. Check if `all_sets_full.json` exists in `backend/services/`
2. Verify Pokémon TCG API key is correct
3. Check console for specific card errors
4. Some older sets may not have images in the API

### Prices Not Fetching

1. Verify eBay API credentials in `.env`
2. Check eBay API rate limits (usually 5000 calls/day)
3. Ensure backend server is running on port 3001
4. Check browser console for CORS errors

### File Upload Fails

1. Ensure file format matches the specification
2. Check backend console for parsing errors
3. Verify file encoding is UTF-8
4. Test with a smaller sample file first

### LocalStorage Full

If you hit localStorage limits:
1. Export your price cache
2. Clear browser localStorage
3. Re-upload your card file
4. Import price cache if needed

## 🔧 Development

### Running Tests

```bash
# Test Pokémon TCG API
cd backend
node checkAPI.js sets              # Fetch all sets
node checkAPI.js set dp3           # Fetch specific set
node checkAPI.js card dp3-1        # Fetch specific card
```

### Building for Production

```bash
# Build frontend
npm run build

# The dist/ folder contains production-ready files
# Serve with any static file server
```

### Environment Variables

```env
# Required
POKEMON_TCG_API_KEY=xxx
EBAY_APP_ID=xxx
EBAY_CERT_ID=xxx

# Optional
PORT=3001                          # Backend port
NODE_ENV=development               # or production
```

## 📊 Features Breakdown

### Frontend (React + Vite)
- React 18 with Hooks
- TailwindCSS for styling
- Lucide React for icons
- LocalStorage for data persistence
- Responsive grid layout (3 cols mobile, 7 cols desktop)

### Backend (Node.js + Express)
- Express server
- Multer for file uploads
- Axios for HTTP requests
- eBay OAuth 2.0 authentication
- Pokémon TCG API integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Pokémon TCG API](https://pokemontcg.io/) for card data and images
- [eBay API](https://developer.ebay.com/) for price data
- [PokéCardex](https://www.pokecardex.com/) for set icons
- [Lucide](https://lucide.dev/) for beautiful icons

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

## 🗺️ Roadmap

- [ ] Add card condition tracking (Mint, Near Mint, etc.)
- [ ] Support for multiple currencies
- [ ] Price history charts
- [ ] Batch card editing
- [ ] Import from CSV
- [ ] Collection value calculator
- [ ] Print-friendly view
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] User authentication
- [ ] Cloud sync

---
