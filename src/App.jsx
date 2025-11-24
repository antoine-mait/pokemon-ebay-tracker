import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import cardsData from './cardsData.js'

const PokemonCardsSheet = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSet, setFilterSet] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [checkedCards, setCheckedCards] = useState(new Set());
  const [hoveredCard, setHoveredCard] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [ebayPrices, setEbayPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState({});
  const [cachedPrices, setCachedPrices] = useState({});

  const sets = ['all', ...new Set(cardsData.map(card => card.set))].sort();
  const rarities = ['all', 'Holo', 'Ultra Rare', 'Rare', 'Uncommon', 'Common'];

  // Mapping des codes d'extension vers les URLs des images
  const setImageMap = {
    'MT': 'https://www.pokecardex.com/assets/images/symboles/minis/MT.png',
    'DP': 'https://www.pokecardex.com/assets/images/symboles/minis/DP.png',
    'PROMO': 'https://www.pokecardex.com/assets/images/symboles/minis/PROMO.png',
    'PK': 'https://www.pokecardex.com/assets/images/symboles/minis/PK.png',
    'DF': 'https://www.pokecardex.com/assets/images/symboles/minis/DF.png',
    'CG': 'https://www.pokecardex.com/assets/images/symboles/minis/CG.png',
    'HP': 'https://www.pokecardex.com/assets/images/symboles/minis/HP.png',
    'LM': 'https://www.pokecardex.com/assets/images/symboles/minis/LM.png',
    'DS': 'https://www.pokecardex.com/assets/images/symboles/minis/DS.png',
    'UF': 'https://www.pokecardex.com/assets/images/symboles/minis/UF.png',
    'EM': 'https://www.pokecardex.com/assets/images/symboles/minis/EM.png',
    'DX': 'https://www.pokecardex.com/assets/images/symboles/minis/DX.png',
    'RFVF': 'https://www.pokecardex.com/assets/images/symboles/minis/RFVF.png',
    'HL': 'https://www.pokecardex.com/assets/images/symboles/minis/HL.png',
    'TMTA': 'https://www.pokecardex.com/assets/images/symboles/minis/TMTA.png',
    'DR': 'https://www.pokecardex.com/assets/images/symboles/minis/DR.png',
    'SS': 'https://www.pokecardex.com/assets/images/symboles/minis/SS.png',
    'RS': 'https://www.pokecardex.com/assets/images/symboles/minis/RS.png',
    'SK': 'https://www.pokecardex.com/assets/images/symboles/minis/SK.png',
    'AQ': 'https://www.pokecardex.com/assets/images/symboles/minis/AQ.png',
    'EX': 'https://www.pokecardex.com/assets/images/symboles/minis/EX.png',
    'N4': 'https://www.pokecardex.com/assets/images/symboles/minis/N4.png',
    'NR': 'https://www.pokecardex.com/assets/images/symboles/minis/NR.png',
    'ND': 'https://www.pokecardex.com/assets/images/symboles/minis/ND.png',
    'NG': 'https://www.pokecardex.com/assets/images/symboles/minis/NG.png'
  };

  React.useEffect(() => {
  // Load all cached prices on mount
  fetch('http://localhost:3001/api/all-prices')
    .then(res => res.json())
    .then(data => {
      console.log('Loaded cached prices:', data);
      setCachedPrices(data);
    })
    .catch(err => console.error('Error loading cached prices:', err));
}, []);

const getCachedPrice = (card) => {
  const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
  return cachedPrices[searchQuery] || 'N/A';
};

  const filteredCards = cardsData.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        card.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSet = filterSet === 'all' || card.set === filterSet;
    const matchesRarity = filterRarity === 'all' || card.rarity === filterRarity;
    return matchesSearch && matchesSet && matchesRarity;
  });

  // Grouper les cartes par extension
  const groupedCards = filteredCards.reduce((acc, card, index) => {
    const setName = card.set;
    if (!acc[setName]) {
      acc[setName] = [];
    }
    acc[setName].push({ ...card, originalIndex: index });
    return acc;
  }, {});

  const handleCheckboxChange = (cardIndex) => {
    setCheckedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardIndex)) {
        newSet.delete(cardIndex);
      } else {
        newSet.add(cardIndex);
      }
      return newSet;
    });
  };

  const exportToCSV = () => {
    const headers = ['Extension', 'Code', 'Numero', 'Nom', 'Rarete'];
    const csvContent = [
      headers.join(','),
      ...filteredCards.map(card => 
        [
          `"${card.set}"`,
          card.setCode,
          card.number,
          `"${card.name}"`,
          card.rarity
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'cartes_pokemon_recherchees.csv';
    link.click();
  };

  const generateEbayRSSFeeds = () => {
    const feeds = cardsData.slice(0, 150).map(card => {
      const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
      const rssUrl = `https://www.ebay.fr/sch/i.html?_rss=1&_nkw=${encodeURIComponent(searchQuery)}`;
      return {
        title: `${card.name} (${card.number}) - ${card.set}`,
        url: rssUrl,
        category: card.set
      };
    });

    const opmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>Cartes Pokémon eBay Feeds (150 premières)</title>
      </head>
      <body>
        <outline text="Cartes Pokémon" title="Cartes Pokémon">
    ${feeds.map(feed => `      <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.url}"/>`).join('\n')}
        </outline>
      </body>
    </opml>`;

    const blob = new Blob([opmlContent], { type: 'text/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pokemon_cards_ebay_feeds.opml';
    link.click();
  };

const fetchEbayPrice = async (card, cardIndex) => {
  if (ebayPrices[cardIndex] || loadingPrices[cardIndex]) return;
  
  setLoadingPrices(prev => ({ ...prev, [cardIndex]: true }));
  
  try {
    const searchQuery = `Pokémon ${card.name} ${card.number.replace('/', ' ')}`;
    const response = await fetch(`http://localhost:3001/api/ebay-price?query=${encodeURIComponent(searchQuery)}`);
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const data = await response.json();
    if (response.status === 429) {
        setEbayPrices(prev => ({ ...prev, [cardIndex]: 'Patientez...' }));
        setTimeout(() => fetchEbayPrice(card, cardIndex), 3000);
        return;
      }
    setEbayPrices(prev => ({ ...prev, [cardIndex]: data.price }));
  } catch (error) {
    console.error('Error fetching eBay price:', error);
    setEbayPrices(prev => ({ ...prev, [cardIndex]: 'Erreur' }));
  } finally {
    setLoadingPrices(prev => ({ ...prev, [cardIndex]: false }));
  }
};

const calculateTotalPrice = () => {
  let total = 0;
  let count = 0;
  
  filteredCards.forEach(card => {
    const price = getCachedPrice(card);
    if (price !== 'N/A' && price !== 'Erreur') {
      // Extract numeric value from price string like "12.50 €"
      const numericPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (!isNaN(numericPrice)) {
        total += numericPrice;
        count++;
      }
    }
  });
  
  return count > 0 ? `${total.toFixed(2)} €` : 'N/A';
};

  return (
    <div className={`w-full min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ paddingLeft: '100px', paddingTop: '20px', paddingRight: '20px' }}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-colors ${
          isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100 border-2 border-gray-300'
        }`}
        title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6`}>
          <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'} mb-2`}>
            🎴 Cartes Pokémon Recherchées
          </h1>
          <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Mise à jour : 23 novembre 2025
          </p>
          <p className={`text-lg font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mt-2`}>
            Total : {filteredCards.length} cartes
            {checkedCards.size > 0 && ` • ${checkedCards.size} cochée(s)`}
            {' • Prix total : '}
            <span className={calculateTotalPrice() !== 'N/A' ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''}>
              {calculateTotalPrice()}
            </span>
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                <Search className="inline w-4 h-4 mr-1" />
                Recherche
              </label>
              <input
                type="text"
                placeholder="Nom ou numéro de carte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div style={{ paddingTop: '10px', paddingBottom: '10px' }}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                <Filter className="inline w-4 h-4 mr-1" />
                Extension
              </label>
              <select
                value={filterSet}
                onChange={(e) => setFilterSet(e.target.value)}
                className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {sets.map(set => (
                  <option key={set} value={set}>
                    {set === 'all' ? 'Toutes' : set}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ paddingTop: '10px', paddingBottom: '10px' }}>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Rareté
              </label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {rarities.map(rarity => (
                  <option key={rarity} value={rarity}>
                    {rarity === 'all' ? 'Toutes' : rarity}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="py-4 flex flex-wrap gap-2">
            <button
              onClick={exportToCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              Exporter en CSV
            </button>
            <button
              onClick={generateEbayRSSFeeds}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              Générer flux RSS eBay (OPML)
            </button>
          </div>
        </div>

        {/* Tableau avec séparations par extension */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider w-16"></th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Obtenu</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Code</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Numéro</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Nom</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Rareté</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Prix eBay</th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Prix Préchargé</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedCards).map(([setName, cards]) => (
                  <React.Fragment key={setName}>
                    {/* En-tête d'extension */}
                    <tr className={`bg-gradient-to-r border-t-4 border-indigo-500 ${
                      isDarkMode 
                        ? 'from-indigo-900 to-gray-800' 
                        : 'from-indigo-100 to-gray-100'
                    }`}>
                      <td className="px-3 py-4 align-middle text-center">
                        {setImageMap[cards[0].setCode] && (
                          <img 
                            src={setImageMap[cards[0].setCode]} 
                            alt={cards[0].setCode}
                            className="inline-block"
                            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                          />
                        )}
                      </td>
                      <td colSpan="7" className="py-4" style={{ textAlign: 'center' }}>
                        <span className={`text-base md:text-lg font-extrabold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`} style={{ fontWeight: 'bold' }}>
                          {setName}
                        </span>
                      </td>
                    </tr>
                    {/* Cartes de cette extension */}
                    {cards.map((card) => (
                      <tr key={card.originalIndex} className={`transition-colors border-b ${
                        isDarkMode 
                          ? 'hover:bg-gray-700 border-gray-700' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}>
                        <td className="px-3 py-3 md:py-4"></td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <input
                            type="checkbox"
                            checked={checkedCards.has(card.originalIndex)}
                            onChange={() => handleCheckboxChange(card.originalIndex)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {card.setCode}
                        </td>
                        <td className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-mono ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {card.number}
                        </td>
                        <td 
                          className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium ${
                            isDarkMode ? 'text-gray-100' : 'text-gray-900'
                          }`}
                          onMouseEnter={(e) => {
                            setHoveredCard(card);
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          <a 
                            href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`Pokémon ${card.name} ${card.number.replace('/', ' ')}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hover:underline ${
                              isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {card.name}
                          </a>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            card.rarity === 'Ultra Rare' 
                              ? (isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-200 text-purple-900') :
                            card.rarity === 'Holo' 
                              ? (isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-200 text-yellow-900') :
                            card.rarity === 'Rare' 
                              ? (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-200 text-blue-900') :
                            card.rarity === 'Uncommon' 
                              ? (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-200 text-green-900') :
                            (isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700')
                          }`}>
                            {card.rarity}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <button
                            onClick={() => window.open(`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`Pokémon ${card.name} ${card.number.replace('/', ' ')}`)}`, '_blank')}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
                          >
                            eBay
                          </button>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm">
                          <span className={`font-semibold ${
                            getCachedPrice(card) !== 'N/A' 
                              ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                              : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                          }`}>
                            {getCachedPrice(card)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredCards.length === 0 && (
            <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Aucune carte trouvée avec ces critères
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Holo</div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter(c => c.rarity === 'Holo').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Ultra Rare</div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter(c => c.rarity === 'Ultra Rare').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Rare</div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter(c => c.rarity === 'Rare').length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Extensions</div>
            <div className="text-2xl md:text-3xl font-bold">
              {new Set(cardsData.map(c => c.set)).size}
            </div>
          </div>
        </div>
      </div>

     {/* Card Preview Tooltip */}
      {hoveredCard && hoveredCard.imageUrl && (
        <div style={{
          position: 'fixed',
          left: `${tooltipPosition.x + 20}px`,
          top: `${tooltipPosition.y - 100}px`,
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '8px'
          }}>
            <img 
              src={hoveredCard.imageUrl}
              alt={hoveredCard.name}
              style={{ 
                width: '200px', 
                height: 'auto',
                borderRadius: '4px',
                display: 'block'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonCardsSheet;