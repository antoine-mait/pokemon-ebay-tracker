import React, { useState } from 'react';
import { Download, Search, Filter } from 'lucide-react';
import cardsData from './cardsData.js'
import cachedPricesData from './priceCache.json';

const PokemonCardsSheet = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSet, setFilterSet] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [checkedCards, setCheckedCards] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
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
    console.log('Loaded cached prices:', cachedPricesData);
    setCachedPrices(cachedPricesData);
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

  const calculateTotalPrice = () => {
    let total = 0;
    let count = 0;
    
    filteredCards.forEach(card => {
      const price = getCachedPrice(card);
      if (price !== 'N/A' && price !== 'Erreur') {
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

        {/* Grid view with expansion separations */}
        {Object.entries(groupedCards).map(([setName, cards]) => (
          <div key={setName} className="mb-8">
            {/* En-tête d'extension */}
            <div className={`bg-gradient-to-r border-t-4 border-indigo-500 rounded-lg shadow-md p-4 mb-4 ${
              isDarkMode 
                ? 'from-indigo-900 to-gray-800' 
                : 'from-indigo-100 to-gray-100'
            }`}>
              <div className="flex items-center justify-center gap-3">
                {setImageMap[cards[0].setCode] && (
                  <img 
                    src={setImageMap[cards[0].setCode]} 
                    alt={cards[0].setCode}
                    className="inline-block"
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />
                )}
                <span className={`text-lg md:text-xl font-extrabold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {setName}
                </span>
              </div>
            </div>

            {/* Grid de cartes - 4 par ligne */}
            <div className="grid grid-cols-3 md:grid-cols-7 gap-4 md:gap-6">
              {cards.map((card) => (
                <div 
                  key={card.originalIndex}
                  className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  {/* Image de la carte */}
                  <div className="relative aspect-[2/3] bg-gray-200">
                    {card.imageUrl ? (
                      <a 
                        href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`Pokémon ${card.name} ${card.number.replace('/', ' ')}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full cursor-pointer"
                      >
                        <img 
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x420?text=No+Image';
                          }}
                        />
                      </a>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    
                    {/* Checkbox en haut à gauche */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={checkedCards.has(card.originalIndex)}
                        onChange={() => handleCheckboxChange(card.originalIndex)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Badge de rareté en haut à droite */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        card.rarity === 'Ultra Rare' 
                          ? 'bg-purple-600 text-white' :
                        card.rarity === 'Holo' 
                          ? 'bg-yellow-500 text-gray-900' :
                        card.rarity === 'Rare' 
                          ? 'bg-blue-600 text-white' :
                        card.rarity === 'Uncommon' 
                          ? 'bg-green-600 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {card.rarity}
                      </span>
                    </div>
                  </div>

                  {/* Informations de la carte */}
                  <div className="p-3">
                    {/* Nom de la carte avec lien eBay */}
                    <a 
                      href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`Pokémon ${card.name} ${card.number.replace('/', ' ')}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block font-semibold text-sm mb-2 hover:underline ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      {card.name}
                    </a>

                    {/* Numéro de carte */}
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {card.setCode} #{card.number}
                    </p>

                    {/* Prix */}
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${
                        getCachedPrice(card) !== 'N/A' 
                          ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                          : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                      }`}>
                        {getCachedPrice(card)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Aucune carte trouvée avec ces critères
          </div>
        )}

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
    </div>
  );
};

export default PokemonCardsSheet;