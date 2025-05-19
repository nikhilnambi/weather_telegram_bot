require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;

// Middleware to parse JSON bodies
app.use(express.json());

// Create Telegram bot without polling
const bot = new TelegramBot(TOKEN);

// Telegram will send updates here
app.post(`/webhook/${TOKEN}`, async (req, res) => {
    const update = req.body;

    try {
        if (update.message) {
            const msg = update.message;
            const chatId = msg.chat.id;

            // Handle /start command
            if (msg.text && msg.text.toLowerCase() === "/start") {
                await bot.sendMessage(
                    chatId,
                    "👋 Hi! Please type your city name to get current weather. For example: `London`, `Delhi`, or `Tokyo`.",
                    { parse_mode: "Markdown" }
                );
                return res.sendStatus(200);
            }

            // Ignore non-text messages or commands
            if (!msg.text || msg.text.startsWith("/")) {
                return res.sendStatus(200);
            }

            // Fetch weather data from wttr.in
            const city = msg.text;
            try {
                const url = `https://wttr.in/${encodeURIComponent(
                    city
                )}?format=j1`;
                const response = await axios.get(url);

                if (
                    response.data &&
                    response.data.current_condition &&
                    response.data.current_condition.length > 0
                ) {
                    const weather = response.data.current_condition[0];
                    const reply = `🌤️ Weather in ${city}:
🌡️ Temp: ${weather.temp_C}°C
🤔 Feels like: ${weather.FeelsLikeC}°C
📌 Condition: ${weather.weatherDesc[0].value}`;

                    await bot.sendMessage(chatId, reply);
                } else {
                    await bot.sendMessage(
                        chatId,
                        `❌ Could not find weather for "${city}". Please try another city name.`
                    );
                }
            } catch (error) {
                await bot.sendMessage(
                    chatId,
                    `❌ Could not fetch weather data. Please try again later.`
                );
            }
        }

        // Respond OK to Telegram
        res.sendStatus(200);
    } catch (error) {
        console.error("Webhook error:", error);
        res.sendStatus(500);
    }
});

// Simple health check endpoint
app.get("/", (req, res) => {
    res.send("Telegram Weather Bot (Webhook) is running!");
});

app.listen(PORT, async () => {
    console.log(`Server listening on port ${PORT}`);

    // Set Telegram webhook URL dynamically on server start
    const url = `https://weather-telegram-bot-160q.onrender.com
    }/webhook/${TOKEN}`;
    try {
        await bot.setWebHook(url);
        console.log("Webhook set to:", url);
    } catch (err) {
        console.error("Error setting webhook:", err);
    }
});
