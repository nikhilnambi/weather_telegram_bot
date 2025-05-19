require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

async function isValidCity(city) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
            city
        )}&format=json&limit=1`;
        const response = await axios.get(url, {
            headers: { "User-Agent": "TelegramWeatherBot/1.0" }, // polite header
        });
        if (response.data && response.data.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch {
        return false;
    }
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Hi! Please type your city name to get current weather. For example: `London`, `Delhi`, or `Tokyo`.",
        {
            parse_mode: "Markdown",
        }
    );
});

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const city = msg.text;

    // Ignore commands like /start
    if (city.startsWith("/")) return;

    let validity = await isValidCity(city);

    if (!validity) {
        throw new Error("Please try another city name.");
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
