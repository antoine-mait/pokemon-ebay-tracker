const rarityMap = {
    holo: "Holo",
    rare: "Rare",
    ultra: "Ultra Rare",
    unco: "Uncommon",
    commune: "Common",
    "illustration rare": "Illustration Rare",
    "illustration speciale rare": "Special Illustration Rare"
};

const setCodeRegex = /minis\/([A-Z0-9]+)\.png/;
const setRegex = /\[u\](.+?)\[\/u\]/;
const cardRegex = /:(\w+.*?):\s+([0-9A-Za-z/]+)\s+(.+)/;
const imgRegex = /\[IMG\](https:\/\/[^\]]+)\[\/IMG\]/i;

function parseCardFile(fileContent) {
    const cards = [];
    let currentSet = "";
    let setCode = "";
    let setImageUrl = "";
    let isInLegendSection = false; // Flag to ignore legend section

    fileContent.split("\n").forEach((line) => {
        // Check if we've reached the legend section - stop processing
        if (line.includes("Légende :") || line.includes("Legende :")) {
            isInLegendSection = true;
            return;
        }

        // Skip all lines after legend section starts
        if (isInLegendSection) {
            return;
        }

        // Detect SET and extract image URL
        const imgMatch = imgRegex.exec(line);
        if (imgMatch) {
            setImageUrl = imgMatch[1];
            const codeMatch = setCodeRegex.exec(setImageUrl);
            if (codeMatch) {
                setCode = codeMatch[1];
            }
        }

        const setMatch = setRegex.exec(line);
        if (setMatch) {
            currentSet = setMatch[1].trim();
            return;
        }

        // Detect cards
        const cardMatch = cardRegex.exec(line);
        if (cardMatch && currentSet) {
            const rarityKey = cardMatch[1].toLowerCase().trim();
            const rarity = rarityMap[rarityKey] || rarityKey;
            const number = cardMatch[2];
            const name = cardMatch[3].replace(/\s+/g, " ").trim();

            cards.push({
                set: currentSet,
                setCode: setCode || "",
                setImageUrl: setImageUrl || "",
                number,
                name,
                rarity,
                imageUrl: null,
                price: null
            });
        }
    });

    return cards;
}

export { parseCardFile };