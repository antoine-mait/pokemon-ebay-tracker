import React, { useState } from "react";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";

const FileUpload = ({ onCardsGenerated, isDarkMode }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    stage: "",
    detail: "",
    subDetail: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress({
      current: 0,
      total: 3,
      stage: "Starting...",
      detail: "Preparing to process file",
      subDetail: "",
    });

    try {
      // Step 1: Upload and parse file
      setProgress({
        current: 1,
        total: 3,
        stage: "Uploading file...",
        detail: `Processing ${file.name}`,
        subDetail: "Reading file contents...",
      });

      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(
        "http://localhost:3001/api/upload-cards",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) throw new Error("Upload failed");

      const { cards } = await uploadResponse.json();
      const uniqueSets = new Set(cards.map((c) => c.set)).size;

      setProgress({
        current: 1,
        total: 3,
        stage: "File parsed successfully",
        detail: `Found ${cards.length} cards in ${uniqueSets} different sets`,
        subDetail: `${
          cards.filter((c) => c.rarity === "Holo" || c.rarity === "Ultra Rare")
            .length
        } rare cards detected`,
      });

      console.log("📦 Parsed cards:", cards);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 2: Check localStorage for existing images
      const existingCardsStr = localStorage.getItem("generated_cards_data");
      let existingCardsMap = new Map();

      if (existingCardsStr) {
        try {
          const existingCards = JSON.parse(existingCardsStr);
          existingCards.forEach((card) => {
            const key = `${card.setCode}-${card.number}`;
            if (card.imageUrl) {
              existingCardsMap.set(key, card.imageUrl);
            }
          });
          console.log(
            `📚 Loaded ${existingCardsMap.size} cached images from localStorage`
          );
        } catch (e) {
          console.error("Error loading existing cards:", e);
        }
      }

      // Merge existing imageUrls with new cards
      const cardsWithExistingImages = cards.map((card) => {
        const key = `${card.setCode}-${card.number}`;
        const existingImageUrl = existingCardsMap.get(key);
        // Keep setImageUrl from new parsed data, only merge the card imageUrl
        return existingImageUrl
          ? {
              ...card,
              imageUrl: existingImageUrl,
              setImageUrl: card.setImageUrl,
            }
          : card;
      });

      // Separate cards that need images from those that already have them
      const cardsNeedingImages = cardsWithExistingImages.filter(
        (card) => !card.imageUrl
      );
      const cardsAlreadyWithImages = cardsWithExistingImages.filter(
        (card) => card.imageUrl
      );

      console.log(
        `📊 ${cardsAlreadyWithImages.length} cards already have images (cached)`
      );
      console.log(`🔍 ${cardsNeedingImages.length} cards need images`);

      setProgress({
        current: 2,
        total: 3,
        stage: "Checking card images...",
        detail: `✓ ${cardsAlreadyWithImages.length} cached • ${cardsNeedingImages.length} to fetch`,
        subDetail:
          cardsNeedingImages.length > 0
            ? "Connecting to Pokémon TCG API..."
            : "All images already cached!",
      });

      let enrichedCards;

      // Only fetch images if there are cards without imageUrl
      if (cardsNeedingImages.length > 0) {
        console.log(
          "🔍 Starting image fetch for",
          cardsNeedingImages.length,
          "cards"
        );

        const enrichResponse = await fetch(
          "http://localhost:3001/api/enrich-cards",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cards: cardsNeedingImages }),
          }
        );

        if (!enrichResponse.ok) throw new Error("Enrichment failed");

        const { cards: newlyEnrichedCards } = await enrichResponse.json();

        console.log("✅ Image fetch complete for new cards");

        // Combine cards that already had images with newly enriched cards
        enrichedCards = [...cardsAlreadyWithImages, ...newlyEnrichedCards];
      } else {
        // All cards already have images from cache
        enrichedCards = cardsAlreadyWithImages;
      }

      const withImages = enrichedCards.filter((c) => c.imageUrl).length;
      const withoutImages = enrichedCards.length - withImages;

      console.log("✅ Total images:", { withImages, withoutImages });
      if (withoutImages > 0) {
        console.log(
          "Cards without images:",
          enrichedCards.filter((c) => !c.imageUrl)
        );
      }

      setProgress({
        current: 2,
        total: 3,
        stage: "Images retrieved",
        detail: `✓ ${withImages} images found${
          withoutImages > 0 ? ` • ${withoutImages} missing` : ""
        }`,
        subDetail:
          withoutImages > 0
            ? "Some cards not found in API"
            : "All images loaded successfully!",
      });

      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 3: Complete
      setProgress({
        current: 3,
        total: 3,
        stage: "Complete!",
        detail: `Successfully loaded ${enrichedCards.length} cards`,
        subDetail: `Ready to view • ${withImages} with images • ${uniqueSets} sets • ${cardsAlreadyWithImages.length} from cache`,
      });

      console.log("✅ Upload complete! Generated cards:", enrichedCards);

      setSuccess(true);
      onCardsGenerated(enrichedCards);

      // Auto-hide after 4 seconds
      setTimeout(() => {
        setSuccess(false);
        setProgress({
          current: 0,
          total: 0,
          stage: "",
          detail: "",
          subDetail: "",
        });
      }, 4000);
    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message);
      setProgress({
        current: 0,
        total: 0,
        stage: "",
        detail: "",
        subDetail: "",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow-md p-6 mb-6`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-xl font-bold ${
            isDarkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          📁 Upload Card List
        </h2>
        {success && (
          <div className="flex items-center gap-2 text-green-500 animate-pulse">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">
              Cards loaded successfully!
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                uploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white transition-colors`}
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Choose .txt File
                </>
              )}
            </div>
          </label>

          {uploading && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {progress.stage}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {progress.current}/{progress.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>

              {/* Main detail */}
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                } mb-1`}
              >
                {progress.detail}
              </p>

              {/* Sub detail */}
              {progress.subDetail && (
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } italic`}
                >
                  {progress.subDetail}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div
          className={`text-xs ${
            isDarkMode ? "text-gray-500" : "text-gray-600"
          }`}
        >
          Upload your{" "}
          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
            magasin-date.txt
          </code>{" "}
          file to generate the card database with images.
          <br />
          <span className="text-green-600 dark:text-green-400">
            💡 Images are cached - re-uploading the same file will use saved
            images!
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
