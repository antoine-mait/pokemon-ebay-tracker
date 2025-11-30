import React, { useState, useEffect } from "react";
import { Download, Search, Filter, DollarSign, Save } from "lucide-react";
import FileUpload from "./components/FileUpload";
import {
  loadPriceCache,
  getCachedPrice,
  updatePriceInCache,
  exportPriceCacheAsJSON,
} from "./utils/priceCache";
import cardsDataImport from "./cardsData.js";
import { API_URL } from "./config";

const sanitizeForEbay = (text) => {
  return text
    .replace(/δ/g, "") // Remove delta
};

const PokemonCardsSheet = () => {
  const [cardsData, setCardsData] = useState(cardsDataImport);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSet, setFilterSet] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");
  const [checkedCards, setCheckedCards] = useState(new Set());
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [priceCache, setPriceCache] = useState({});
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [priceProgress, setPriceProgress] = useState({ current: 0, total: 0 });

  const sets = ["all", ...new Set(cardsData.map((card) => card.set))].sort();
  const rarities = ["all", "Holo", "Ultra Rare", "Rare", "Uncommon", "Common"];

  useEffect(() => {
    const cache = loadPriceCache();
    setPriceCache(cache);

    const savedCards = localStorage.getItem("generated_cards_data");
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards);
        setCardsData(parsedCards);
      } catch (error) {
        console.error("Error loading saved cards:", error);
      }
    }
  }, []);

  // In App.jsx, around line 48-60, update handleCardsGenerated:

  const handleCardsGenerated = (newCards) => {
    const existingCards = localStorage.getItem("generated_cards_data");
    let mergedCards = newCards;

    if (existingCards) {
      try {
        const parsedExisting = JSON.parse(existingCards);
        const existingMap = new Map(
          parsedExisting.map((card) => [`${card.setCode}-${card.number}`, card])
        );

        mergedCards = newCards.map((card) => {
          const key = `${card.setCode}-${card.number}`;
          const existing = existingMap.get(key);
          if (existing && existing.imageUrl) {
            // Preserve setImageUrl from new upload (newCards), only merge imageUrl from cache
            return {
              ...card,
              imageUrl: existing.imageUrl,
              setImageUrl: card.setImageUrl, // Keep the new setImageUrl from parsed file
            };
          }
          return card;
        });
      } catch (error) {
        console.error("Error merging cards:", error);
      }
    }

    console.log("📊 Merged cards with setImageUrl:", mergedCards.slice(0, 3)); // Debug: check first 3 cards
    setCardsData(mergedCards);
    localStorage.setItem("generated_cards_data", JSON.stringify(mergedCards));
  };

  const fetchPriceForCard = async (card) => {
    try {
      const response = await fetch(`${API_URL}/api/fetch-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card }),
      });

      if (response.status === 429) {
        // Rate limit reached!
        const data = await response.json();
        alert(
          `⚠️ ${
            data.message || "API limit reached. Please try again tomorrow."
          }`
        );
        setFetchingPrices(false); // Stop fetching
        setPriceProgress({ current: 0, total: 0 });
        return "RATE_LIMIT";
      }

      if (response.ok) {
        const { price } = await response.json();

        // Check if backend returned rate limit error
        if (price === "RATE_LIMIT_EXCEEDED") {
          alert("⚠️ eBay API limit reached! Please try again tomorrow.");
          setFetchingPrices(false);
          setPriceProgress({ current: 0, total: 0 });
          return "RATE_LIMIT";
        }

        setPriceCache((prevCache) => {
          const newCache = updatePriceInCache(card, price, prevCache);
          return newCache;
        });
        return price;
      }
    } catch (error) {
      console.error("Error fetching price:", error);
    }
    return "Erreur";
  };

  // Function 1: Refresh ALL prices (clears cache first)
  const refreshAllPrices = async () => {
    setFetchingPrices(true);

    const cardsToRefresh = filteredCards;

    // Clear cache for all cards
    setPriceCache((prevCache) => {
      const newCache = { ...prevCache };
      cardsToRefresh.forEach((card) => {
        const searchQuery = `Pokémon ${card.name} ${card.number.replace(
          "/",
          " "
        )}`;
        delete newCache[searchQuery];
      });
      return newCache;
    });

    setPriceProgress({ current: 0, total: cardsToRefresh.length });

    // Process ONE card at a time with delay
    for (let i = 0; i < cardsToRefresh.length; i++) {
      const card = cardsToRefresh[i];

      const result = await fetchPriceForCard(card);

      // Stop if rate limit reached
      if (result === "RATE_LIMIT") {
        console.log("⚠️ Stopping due to rate limit");
        return; // Exit function early
      }

      setPriceProgress({
        current: i + 1,
        total: cardsToRefresh.length,
      });

      // Add 300ms delay between each request
      if (i < cardsToRefresh.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setFetchingPrices(false);
    setPriceProgress({ current: 0, total: 0 });
  };

  // Function 2: Fetch ONLY missing prices (N/A or Erreur)
  const fetchMissingPrices = async () => {
    setFetchingPrices(true);

    const cardsNeedingPrices = filteredCards.filter((card) => {
      const price = getCachedPrice(card, priceCache);
      return price === "N/A" || price === "Erreur";
    });

    console.log(`🔍 Found ${cardsNeedingPrices.length} cards without prices`);

    setPriceProgress({ current: 0, total: cardsNeedingPrices.length });

    if (cardsNeedingPrices.length === 0) {
      alert("✅ All cards already have prices!");
      setFetchingPrices(false);
      return;
    }

    // Process ONE card at a time with delay
    for (let i = 0; i < cardsNeedingPrices.length; i++) {
      const card = cardsNeedingPrices[i];

      const result = await fetchPriceForCard(card);

      // Stop if rate limit reached
      if (result === "RATE_LIMIT") {
        console.log("⚠️ Stopping due to rate limit");
        return; // Exit function early
      }

      setPriceProgress({
        current: i + 1,
        total: cardsNeedingPrices.length,
      });

      // Add 300ms delay between each request
      if (i < cardsNeedingPrices.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setFetchingPrices(false);
    setPriceProgress({ current: 0, total: 0 });
  };

  const filteredCards = cardsData.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSet = filterSet === "all" || card.set === filterSet;
    const matchesRarity =
      filterRarity === "all" || card.rarity === filterRarity;
    return matchesSearch && matchesSet && matchesRarity;
  });

  const groupedCards = filteredCards.reduce((acc, card, index) => {
    const setName = card.set;
    if (!acc[setName]) {
      acc[setName] = [];
    }
    acc[setName].push({ ...card, originalIndex: index });
    return acc;
  }, {});

  const handleCheckboxChange = (cardIndex) => {
    setCheckedCards((prev) => {
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
    const headers = ["Extension", "Code", "Numero", "Nom", "Rarete", "Prix"];
    const csvContent = [
      headers.join(","),
      ...filteredCards.map((card) =>
        [
          `"${card.set}"`,
          card.setCode,
          card.number,
          `"${card.name}"`,
          card.rarity,
          `"${getCachedPrice(card, priceCache)}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cartes_pokemon_recherchees.csv";
    link.click();
  };

  const generateEbayRSSFeeds = () => {
    const feeds = cardsData.slice(0, 150).map((card) => {
      const searchQuery = `Pokémon ${card.name} ${card.number.replace(
        "/",
        " "
      )}`;
      const rssUrl = `https://www.ebay.fr/sch/i.html?_rss=1&_nkw=${encodeURIComponent(
        searchQuery
      )}`;
      return {
        title: `${card.name} (${card.number}) - ${card.set}`,
        url: rssUrl,
        category: card.set,
      };
    });

    const opmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <opml version="2.0">
      <head>
        <title>Cartes Pokémon eBay Feeds (150 premières)</title>
      </head>
      <body>
        <outline text="Cartes Pokémon" title="Cartes Pokémon">
    ${feeds
      .map(
        (feed) =>
          `      <outline type="rss" text="${feed.title}" title="${feed.title}" xmlUrl="${feed.url}" htmlUrl="${feed.url}"/>`
      )
      .join("\n")}
        </outline>
      </body>
    </opml>`;

    const blob = new Blob([opmlContent], { type: "text/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pokemon_cards_ebay_feeds.opml";
    link.click();
  };

  const calculateTotalPrice = () => {
    let total = 0;
    let count = 0;

    filteredCards.forEach((card) => {
      const price = getCachedPrice(card, priceCache);
      if (price !== "N/A" && price !== "Erreur" && price !== "In your dream") {
        const numericPrice = parseFloat(
          price.replace(/[^\d.,]/g, "").replace(",", ".")
        );
        if (!isNaN(numericPrice)) {
          total += numericPrice;
          count++;
        }
      }
    });

    return count > 0 ? `${total.toFixed(2)} €` : "N/A";
  };

  return (
    <div
      className={`w-full min-h-screen ${
        isDarkMode ? "bg-gray-900" : "bg-gray-100"
      }`}
      style={{ paddingLeft: "100px", paddingTop: "20px", paddingRight: "20px" }}
    >
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-colors ${
          isDarkMode
            ? "bg-gray-700 text-yellow-400 hover:bg-gray-600"
            : "bg-white text-gray-800 hover:bg-gray-100 border-2 border-gray-300"
        }`}
        title={isDarkMode ? "Mode clair" : "Mode sombre"}
      >
        {isDarkMode ? "☀️" : "🌙"}
      </button>

      <div className="max-w-7xl mx-auto">
        <FileUpload
          onCardsGenerated={handleCardsGenerated}
          isDarkMode={isDarkMode}
        />

        <div
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6`}
        >
          <h1
            className={`text-2xl md:text-3xl font-bold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            } mb-2`}
          >
            🎴 Cartes Pokémon Recherchées
          </h1>
          <p
            className={`text-sm md:text-base ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>
          <p
            className={`text-lg font-semibold ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            } mt-2`}
          >
            Total : {filteredCards.length} cartes
            {checkedCards.size > 0 && ` • ${checkedCards.size} cochée(s)`}
            {" • Prix total : "}
            <span
              className={
                calculateTotalPrice() !== "N/A"
                  ? isDarkMode
                    ? "text-green-400"
                    : "text-green-600"
                  : ""
              }
            >
              {calculateTotalPrice()}
            </span>
          </p>
        </div>

        <div
          className={`${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className="md:col-span-2"
              style={{ paddingTop: "10px", paddingBottom: "10px" }}
            >
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
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
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                <Filter className="inline w-4 h-4 mr-1" />
                Extension
              </label>
              <select
                value={filterSet}
                onChange={(e) => setFilterSet(e.target.value)}
                className={`w-full px-4 py-4 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {sets.map((set) => (
                  <option key={set} value={set}>
                    {set === "all" ? "Toutes" : set}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ paddingTop: "10px", paddingBottom: "10px" }}>
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                } mb-2`}
              >
                Rareté
              </label>
              <select
                value={filterRarity}
                onChange={(e) => setFilterRarity(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                {rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity === "all" ? "Toutes" : rarity}
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

            <button
              onClick={fetchMissingPrices}
              disabled={fetchingPrices}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <DollarSign className="w-4 h-4" />
              {fetchingPrices
                ? `Fetching (${priceProgress.current}/${priceProgress.total})`
                : "Fetch Missing Prices"}
            </button>

            <button
              onClick={refreshAllPrices}
              disabled={fetchingPrices}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <DollarSign className="w-4 h-4" />
              {fetchingPrices
                ? `Refreshing (${priceProgress.current}/${priceProgress.total})`
                : "Refresh All Prices"}
            </button>

            <button
              onClick={() => exportPriceCacheAsJSON(priceCache)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <Save className="w-4 h-4" />
              Export Price Cache
            </button>
          </div>
        </div>

        {Object.entries(groupedCards).map(([setName, cards]) => (
          <div key={setName} className="mb-8">
            <div
              className={`bg-gradient-to-r border-t-4 border-indigo-500 rounded-lg shadow-md p-4 mb-4 ${
                isDarkMode
                  ? "from-indigo-900 to-gray-800"
                  : "from-indigo-100 to-gray-100"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {cards[0].setImageUrl && (
                  <img
                    src={cards[0].setImageUrl}
                    alt={cards[0].setCode}
                    className="inline-block"
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain",
                    }}
                  />
                )}
                <span
                  className={`text-lg md:text-xl font-extrabold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {setName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-7 gap-4 md:gap-6">
              {cards.map((card) => (
                <div
                  key={card.originalIndex}
                  className={`rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-gray-200">
                    {card.imageUrl ? (
                      <a
                        href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(
                          `pokemon ${sanitizeForEbay(
                            card.name
                          )} ${card.number.replace("/", " ")} ${sanitizeForEbay(
                            card.set
                          )}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x420?text=No+Image";
                          }}
                        />
                      </a>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={checkedCards.has(card.originalIndex)}
                        onChange={() =>
                          handleCheckboxChange(card.originalIndex)
                        }
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          card.rarity === "Ultra Rare"
                            ? "bg-purple-600 text-white"
                            : card.rarity === "Holo"
                            ? "bg-yellow-500 text-gray-900"
                            : card.rarity === "Rare"
                            ? "bg-blue-600 text-white"
                            : card.rarity === "Uncommon"
                            ? "bg-green-600 text-white"
                            : "bg-gray-500 text-white"
                        }`}
                      >
                        {card.rarity}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <a
                      href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(
                        `pokemon ${sanitizeForEbay(
                          card.name
                        )} ${card.number.replace("/", " ")} ${sanitizeForEbay(
                          card.set
                        )}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block font-semibold text-sm mb-2 hover:underline ${
                        isDarkMode
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      {card.name}
                    </a>

                    <p
                      className={`text-xs mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {card.setCode} #{card.number}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className={`text-lg font-bold ${
                          getCachedPrice(card, priceCache) !== "N/A"
                            ? isDarkMode
                              ? "text-green-400"
                              : "text-green-600"
                            : isDarkMode
                            ? "text-gray-500"
                            : "text-gray-400"
                        }`}
                      >
                        {getCachedPrice(card, priceCache)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredCards.length === 0 && (
          <div
            className={`text-center py-12 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Aucune carte trouvée avec ces critères
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Holo</div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter((c) => c.rarity === "Holo").length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">
              Ultra Rare
            </div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter((c) => c.rarity === "Ultra Rare").length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">Rare</div>
            <div className="text-2xl md:text-3xl font-bold">
              {cardsData.filter((c) => c.rarity === "Rare").length}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-4 text-white">
            <div className="text-xs md:text-sm font-medium mb-1">
              Extensions
            </div>
            <div className="text-2xl md:text-3xl font-bold">
              {new Set(cardsData.map((c) => c.set)).size}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonCardsSheet;
