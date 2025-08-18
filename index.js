const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// /start — новое приветствие + кнопки
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    '<b>✨ Ты пришла вовремя. Добро пожаловать в ASTI.</b>\n\n' +
    '<i>Это место, где стиль становится заклинанием, а каждая деталь – частью твоей силы.</i>\n\n' +
    'Выбери, с чего начнём 👇',
    Markup.inlineKeyboard([
      [Markup.button.callback('🔮 Диагностика', 'diagnostic')],
      [Markup.button.callback('👗 Мини-капсула', 'capsule')],
      [Markup.button.callback('💡 Советы по стилю', 'advice')]
    ])
  );
});

// обработчики кнопок (пока простые ответы)
bot.action('diagnostic', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Ок. Начнём мини-диагностику вкуса и силуэта. Напиши, куда ты чаще всего ходишь (офис/встречи/свидания)…');
});

bot.action('capsule', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Супер! Соберу мини-капсулу. Напиши, какой у тебя дресс-код/стиль и бюджет.');
});

bot.action('advice', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Задай любой стилистический вопрос — помогу ✨');
});

// keep-alive для Render
app.get('/', (_, res) => res.send('ASTI Bot is running!'));
app.listen(process.env.PORT || 3000, () => console.log('Server is running...'));

bot.launch();
