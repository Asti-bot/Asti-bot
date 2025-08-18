const { Telegraf } = require("telegraf");
const express = require("express");

const app = express();

// Берем токен из переменных окружения
const bot = new Telegraf(process.env.BOT_TOKEN);

// Команда /start
bot.start((ctx) => {
  ctx.reply("Привет! 👋 Я твой ASTI Stylist Bot. Готов помочь с образом!");
});

// Пример простой команды
bot.hears("Привет", (ctx) => ctx.reply("Привет! Как настроение?"));

// Запуск бота
bot.launch();

// Express сервер для Render (чтобы он не засыпал)
app.get("/", (req, res) => {
  res.send("ASTI Bot is running!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running...");
});
