require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Cache urban areas to avoid frequent API calls
let urbanAreasCache = null;

// Fetch and cache urban areas from Teleport API
async function getUrbanAreas() {
    if (urbanAreasCache) return urbanAreasCache;

    try {
        const response = await axios.get(
            "https://api.teleport.org/api/urban_areas/"
        );
        urbanAreasCache = response.data._links["ua:item"].map((area) =>
            area.name.toLowerCase()
        );
        return urbanAreasCache;
    } catch (err) {
        console.error("Failed to fetch urban areas:", err);
        return [];
    }
}

// Check if city exists in urban areas list
async function isValidCity(city) {
    const urbanAreas = await getUrbanAreas();
    return urbanAreas.includes(city.toLowerCase());
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Hi! Please type your city name to get current weather. For example: `London`, `Delhi`, or `Tokyo`.",
        { parse_mode: "Markdown" }
    );
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const city = msg.text;

    // Ignore non-text messages or commands starting with '/'
    if (!city || city.startsWith("/")) return;

    try {
        const validity = await isValidCity(city);

        if (!validity) {
            return bot.sendMessage(
                chatId,
                `❌ "${city}" is not recognized as a valid city. Please try another city name.`
            );
        }

        // Fetch weather info from wttr.in
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        const response = await axios.get(url);
        const weather = response.data.current_condition[0];

        const reply = `🌤️ Weather in ${city}:
🌡️ Temp: ${weather.temp_C}°C
🤔 Feels like: ${weather.FeelsLikeC}°C
📌 Condition: ${weather.weatherDesc[0].value}`;

        bot.sendMessage(chatId, reply);
    } catch (err) {
        console.error("Error handling message:", err);
        bot.sendMessage(
            chatId,
            `❌ Sorry, something went wrong. Please try again later.`
        );
    }
});
