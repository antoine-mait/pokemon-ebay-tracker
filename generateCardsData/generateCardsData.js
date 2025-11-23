const fs = require("fs");

// --- CONFIG ---
const inputFile = "pokemon_wanted_card_global.txt";

// --- DICTIONNAIRE DES RARETÉS ---
const rarityMap = {
    holo: "Holo",
    rare: "Rare",
    ultra: "Ultra Rare",
    unco: "Uncommon",
    commune: "Common"
};

// --- LECTURE DU FICHIER ---
const rawText = fs.readFileSync(inputFile, "utf8");

// --- REGEX ---
const setRegex = /\[u\](.+?)\[\/u\]/;
const cardRegex = /:(\w+):\s+([0-9A-Za-z/]+)\s+(.+)/;

let currentSet = "";
let setCode = "";
const cardsData = [];

// EXTRACT CODE OF SET FROM IMG URL LIKE minis/DP.png
const setCodeRegex = /minis\/([A-Z0-9]+)\.png/;

rawText.split("\n").forEach((line) => {
    // Detect SET
    const setMatch = setRegex.exec(line);
    if (setMatch) {
        currentSet = setMatch[1].trim();

        // Detect associated set code from the previous [IMG] line
        const imgMatch = setCodeRegex.exec(line);
        if (imgMatch) {
            setCode = imgMatch[1];
        }
        return;
    }

    // Detect cards
    const cardMatch = cardRegex.exec(line);
    if (cardMatch && currentSet) {
        const rarityKey = cardMatch[1].toLowerCase();
        const rarity = rarityMap[rarityKey] || rarityKey;

        const number = cardMatch[2];
        const name = cardMatch[3].replace(/\s+/g, " ").trim();

        cardsData.push({
            set: currentSet,
            setCode: setCode || "",
            number,
            name,
            rarity
        });
    }
});

// --- OUTPUT JS FILE ---
const outputJS = "const cardsData = " + JSON.stringify(cardsData, null, 4) + ";\n\nexport default cardsData;\n";

fs.writeFileSync("cardsData.js", outputJS, "utf8");

console.log("✔ cardsData.js généré avec", cardsData.length, "cartes.");
