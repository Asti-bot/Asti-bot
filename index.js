// ASTI.K — минимальный бот: приветствие + кнопка «Диагностика»
const { Telegraf, Markup } = require("telegraf");
const express = require("express");

// 1) Токен
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Нет BOT_TOKEN в переменных окружения!");
  process.exit(1);
}

// 2) Инициализация
const bot = new Telegraf(BOT_TOKEN);
const app = express();

// 3) Keep-alive для Render
app.get("/", (_, res) => res.send("ASTI.K is live"));
app.listen(process.env.PORT || 10000, () => console.log("Server running"));

// 4) Приветствие
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    "🚨 <b>Стоп. Ты в зоне ASTI.K.</b>\n" +
    "Здесь нет фальшивых комплиментов и розовых соплей.\n\n" +
    "Я — бот, который:\n" +
    "💣 Разнесёт твои модные иллюзии.\n" +
    "🩸 Покажет, почему твои вещи реально «старят» или «дешевят».\n" +
    "⚡️ Скажет, что тебе нужно, чтобы выглядеть дороже и увереннее.\n\n" +
    "🧩 Начнём с <b>диагностики фигуры</b>.\n" +
    "Это не тест из журнала — это быстрый разбор: где у тебя +100 к стилю, а где 🔻 минус.\n\n" +
    "👉 Готова к честному зеркалу?",
    Markup.inlineKeyboard([
      [Markup.button.callback("🔍 Диагностика", "diag_start")]
    ])
  );
});

// 5) Обработчик кнопки — просто первый шаг (чтобы не падало)
bot.action("diag_start", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.replyWithHTML(
    "Окей. Начнём.\n\n" +
    "Напиши <b>рост</b> (см) и <b>вес</b> (кг) в одну строку.\n" +
    "Пример: <code>168 / 62</code>"
  );
});

// 6) Запуск
bot.launch();
