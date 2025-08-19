// ASTI.K — Telegram-бот со встроенным ИИ (Telegraf + OpenAI). Готов для Render.
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const OpenAI = require("openai");

// === ENV ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!BOT_TOKEN || !OPENAI_API_KEY) {
  console.error("ENV missing: BOT_TOKEN or OPENAI_API_KEY");
  process.exit(1);
}

// === INIT ===
const bot = new Telegraf(BOT_TOKEN);
const app = express();
const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Простейшая «память» шагов диагностики
const S = {};
const getS = (id) => (S[id] ??= { mode: null, step: 0, data: {} });
const reset = (id) => (S[id] = { mode: null, step: 0, data: {} });

// Запрос к ИИ
async function askAI(userMsg, sys = "") {
  try {
    const r = await ai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        {
          role: "system",
          content:
            (sys || "") +
            "\nТы — ASTI.K, дерзкий честный стилист поколения Z. " +
            "Отвечай кратко, структурно и по делу, без лести и воды. " +
            "Упор: фигура/силуэт, цели, психология стиля, ткани/фактуры, формулы образов, анти-советы. " +
            "Допускается HTML: <b>, <i>, списки."
        },
        { role: "user", content: userMsg }
      ]
    });
    return r.choices?.[0]?.message?.content?.trim() || "…";
  } catch (e) {
    console.error("AI error:", e?.message || e);
    return "Техническая пауза у ИИ. Попробуй ещё раз позже.";
  }
}

// === keep-alive для Render (и страничка «живу») ===
app.get("/", (_, res) => res.send("ASTI.K is live"));
app.listen(process.env.PORT || 10000, () => console.log("Server running"));

// === /start — приветствие и кнопка ===
bot.start(async (ctx) => {
  reset(ctx.from.id);
  await ctx.replyWithHTML(
    "🚨 <b>Стоп. Ты в зоне ASTI.K.</b>\n" +
      "Здесь нет фальшивых комплиментов и розовых соплей.\n\n" +
      "Я — бот, который:\n" +
      "💣 Разнесёт твои модные иллюзии.\n" +
      "🩸 Покажет, почему вещи могут «старить» или «дешевить».\n" +
      "⚡ Скажет, что нужно, чтобы выглядеть дороже и увереннее.\n\n" +
      "🧩 Начнём с <b>диагностики фигуры</b> — короткий честный разбор.\n\n" +
      "👉 Готова к зеркалу?",
    Markup.inlineKeyboard([[Markup.button.callback("🔍 Диагностика", "diag_start")]])
  );
});

// === Диагностика (3 шага) ===
bot.action("diag_start", async (ctx) => {
  const st = getS(ctx.from.id);
  st.mode = "diag";
  st.step = 1;
  st.data = {};
  await ctx.answerCbQuery();
  await ctx.reply("1/3 👉 Напиши: <b>рост</b> (см) и <b>вес</b> (кг). Пример: 168 / 62", { parse_mode: "HTML" });
});

bot.on("text", async (ctx) => {
  const st = getS(ctx.from.id);
  const t = (ctx.message.text || "").trim();

  if (st.mode === "diag") {
    if (st.step === 1) {
      st.data.height_weight = t;
      st.step = 2;
      return ctx.reply("2/3 👉 Твой <b>размер одежды</b> (верх/низ, если отличаются). Пример: 44-46 / 46", { parse_mode: "HTML" });
    }

    if (st.step === 2) {
      st.data.size = t;
      st.step = 3;
      return ctx.reply(
        "3/3 👉 Куда чаще всего нужны образы? (офис / свидания / повседневно / мероприятия). И какой вайб? (минимализм / дерзко / женственно / спорт-шик)."
      );
    }

    if (st.step === 3) {
      st.data.context_vibe = t;

      const prompt = `
Собери честное резюме диагностики фигуры и стилистические рекомендации.
Дано:
- рост/вес: ${st.data.height_weight}
- размер: ${st.data.size}
- контекст/вайб: ${st.data.context_vibe}

Формат ответа (HTML):
<b>Сильные стороны</b> — 3 пункта
<b>Риск-зоны и как нейтрализовать</b> — 3 пункта
<b>Быстрые формулы образов</b> — 3 штуки
<b>Анти-советы</b> — 2 штуки
Коротко, по делу.`;

      const aiText = await askAI(prompt);
      reset(ctx.from.id);

      await ctx.replyWithHTML(aiText);
      await ctx.reply(
        "Продолжим?",
        Markup.inlineKeyboard([
          [Markup.button.

callback("👗 Мини-капсула", "capsule_start")],
          [Markup.button.callback("💡 Советы по стилю", "advice_start")]
        ])
      );
      return;
    }
  }

  // Если не в режиме диагностики — передаём вопрос в ИИ
  const reply = await askAI(t);
  return ctx.replyWithHTML(reply);
});

// Заглушки на будущие ветки (чтобы кнопки работали красиво)
bot.action("capsule_start", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Ок, мини-капсула. Напиши: цели, бюджет и дресскод. Я предложу быстрый план.");
});
bot.action("advice_start", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("Задай любой вопрос по стилю — отвечу конкретно и без воды.");
});

// === Запуск long-polling ===
bot.launch();
console.log("ASTI.K bot started");
