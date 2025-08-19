// ASTI.K — Telegram-бот с ИИ (Telegraf + OpenAI v4). Render-ready.
const { Telegraf, Markup } = require("telegraf");
const express = require("express");
const OpenAI = require("openai");

// === ENV ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!BOT_TOKEN || !OPENAI_API_KEY) {
  console.error("ENV missing: BOT_TOKEN or OPENAI_API_KEY");
  process.exit(1);
}

// === Init ===
const bot = new Telegraf(BOT_TOKEN);
const app = express();
const ai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Стейт на память диалога (очень простой)
const S = {};
const getS = (id) => (S[id] ??= { mode: null, step: 0, data: {} });
const reset = (id) => (S[id] = { mode: null, step: 0, data: {} });

// Универсальный запрос к ИИ
async function askAI(userMsg, sys = "") {
  try {
    const r = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            (sys || "") +
            "\nТы — ASTI.K, дерзкий, честный стилист поколения Z. " +
            "Говоришь кратко, структурно, по делу; без лести и воды. " +
            "Фокус: фигура/силуэт, цели, психология, ткани, формулы образов, анти-советы. " +
            "Форматируй пункты, используй короткие заголовки. HTML разрешён: <b>, <i>, списки."
        },
        { role: "user", content: userMsg }
      ]
    });
    return r.choices?.[0]?.message?.content?.trim() || "…";
  } catch (e) {
    console.error("AI error:", e.message);
    return "Сервер ИИ недоступен. Попробуй ещё раз позже.";
  }
}

// === Keep-alive для Render ===
app.get("/", (_, res) => res.send("ASTI.K is live"));
app.listen(process.env.PORT || 10000, () => console.log("Server running"));

// === Приветствие с кнопкой «Диагностика» ===
bot.start(async (ctx) => {
  reset(ctx.from.id);
  await ctx.replyWithHTML(
    "🚨 <b>Стоп. Ты в зоне ASTI.K.</b>\n" +
      "Здесь нет фальшивых комплиментов и розовых соплей.\n\n" +
      "Я — бот, который:\n" +
      "💣 Разнесёт твои модные иллюзии.\n" +
      "🩸 Покажет, почему твои вещи реально «старят» или «дешевят».\n" +
      "⚡ Скажет, что тебе нужно, чтобы выглядеть дороже и увереннее.\n\n" +
      "🧩 Начнём с <b>диагностики фигуры</b>.\n" +
      "Это не тест из журнала — это быстрый разбор: где у тебя +100 к стилю, а где 🔻 минус.\n\n" +
      "👉 Готова к честному зеркалу?",
    Markup.inlineKeyboard([[Markup.button.callback("🔍 Диагностика", "diag_start")]])
  );
});

// === Диагностика (3 шага) → ИИ-резюме ===
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
        "3/3 👉 Куда тебе чаще всего нужны образы? (офис / свидания / повседневно / мероприятия). И какой вайб? (минимализм / дерзко / женственно / спорт-шик).",
      );
    }
    if (st.step === 3) {
      st.data.context_vibe = t;
      st.mode = null;
      st.step = 0;

      const prompt =
        Собери честное резюме диагностики фигуры и стилистические рекомендации.\n +
        Дано:\n- рост/вес: ${st.data.height_weight}\n- размер: ${st.data.size}\n- контекст/вайб: ${st.data.context_vibe}\n\n +
        Формат ответа (HTML):\n<b>Сильные стороны</b> — 3 пункта\n<b>Риск-зоны и как нейтрализовать</b> — 3 пункта\n<b>Быстрые формулы образов</b> — 3 штуки\n<b>Анти-советы</b> — 2 штуки\n +
        Коротко, по делу.;

      const aiText = await askAI(prompt);
      await ctx.

Кристина Астанина, [19.08.2025 20:59]
replyWithHTML(aiText);

      // Хук на продолжение
      return ctx.replyWithHTML(
        "Хочешь глубже: <b>психология стиля</b>, <b>ткани</b>, <b>волосы</b> и даже <b>бельё</b>?\n" +
          "Напиши, что интересует, — разберём точечно.",
      );
    }
  }

  // Если не в сценарии — свободный ИИ-совет по стилю
  const aiText = await askAI(
    Клиент спрашивает/пишет: "${t}". Дай ответ стилиста с конкретикой: 3–5 тезисов и короткое объяснение "почему работает".
  );
  return ctx.replyWithHTML(aiText);
});

// Безопасный стоп
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
bot.launch().then(() => console.log("ASTI.K bot launched"));
