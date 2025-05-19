require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const nlp = require("compromise");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Function to check if text is likely a city using compromise
function isProbablyCity(text) {
    const doc = nlp(text);
    const places = doc.places().out("array");
    return places.length > 0;
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
    const city = msg.text.trim();

    // Ignore commands
    if (city.startsWith("/")) return;

    // Use compromise to check if it's likely a city
    if (!isProbablyCity(city)) {
        bot.sendMessage(
            chatId,
            `❌ That doesn't look like a valid city name. Please try again.`
        );
        return;
    }

    try {
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        const response = await axios.get(url);
        const weather = response.data.current_condition[0];

        const reply = `🌤️ Weather in ${city}:
🌡️ Temp: ${weather.temp_C}°C
🤔 Feels like: ${weather.FeelsLikeC}°C
📌 Condition: ${weather.weatherDesc[0].value}`;

        bot.sendMessage(chatId, reply);
    } catch (err) {
        bot.sendMessage(
            chatId,
            `❌ Could not find weather for "${city}". Please try another city name.`
        );
    }
});
