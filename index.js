require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Express server so Render sees an open port
app.get("/", (req, res) => res.send("Telegram Weather Bot is running!"));

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Create Telegram bot with polling
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Log polling errors
bot.on("polling_error", (error) => {
    console.error("Polling error:", error);
});

// Start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "👋 Hi! Please type your city name to get current weather. For example: `London`, `Delhi`, or `Tokyo`.",
        {
            parse_mode: "Markdown",
        }
    );
});

// Listen for any text messages (city names)
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const city = msg.text;

    // Ignore commands (starting with '/')
    if (city.startsWith("/")) return;

    try {
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        const response = await axios.get(url);

        // Check if weather data exists
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

            bot.sendMessage(chatId, reply);
        } else {
            bot.sendMessage(
                chatId,
                `❌ Could not find weather for "${city}". Please try another city name.`
            );
        }
    } catch (err) {
        console.error(err);
        bot.sendMessage(
            chatId,
            `❌ Could not find weather for "${city}". Please try another city name.`
        );
    }
});
