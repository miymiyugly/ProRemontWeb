const express = require("express");
const path = require("path");

const config = require("./config");

const app = express();

const PORT = config.port;
const BOT_TOKEN = config.BOT_TOKEN;
const CHAT_IDS = Array.isArray(config.userIds) ? config.userIds : [];

// Экранирование для Telegram MarkdownV2
function escapeMd(text) {
  return String(text == null ? "" : text).replace(
    /[_*\[\]()~`>#+\-=|{}.!\\]/g,
    "\\$&",
  );
}

const VARIANT_LABELS = {
  base: "Базовый ремонт",
  comfort: "Комфорт",
  premium: "Премиум",
  vip: "VIP",
};

function buildTelegramMessage({ name, phone, message, variant }) {
  const now = new Date().toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const variantLabel =
    variant && VARIANT_LABELS[variant]
      ? VARIANT_LABELS[variant]
      : variant || "—";

  const phoneDigits = phone.replace(/\D/g, "");
  const lines = [
    "🔔 *Новая заявка с сайта Про\\-Ремонт*",
    "",
    `👤 *Имя:* ${escapeMd(name)}`,
    `📞 *Телефон:* [${escapeMd(phone)}](tel:+${phoneDigits})`,
    `🛠 *Тариф:* ${escapeMd(variantLabel)}`,
  ];

  if (message && String(message).trim()) {
    lines.push("");
    lines.push("💬 *Комментарий:*");
    lines.push(`_${escapeMd(String(message).trim())}_`);
  }

  lines.push("");
  lines.push(`🕒 ${escapeMd(now)} \\(МСК\\)`);

  return lines.join("\n");
}

async function sendTelegramNotification(payload) {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.warn("[telegram] BOT_TOKEN или userIds не заданы — пропуск");
    return;
  }

  const text = buildTelegramMessage(payload);
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  await Promise.all(
    CHAT_IDS.map(async (chatId) => {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "MarkdownV2",
            disable_web_page_preview: true,
          }),
        });
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          console.error(
            `[telegram] chat ${chatId} failed: ${r.status} ${body}`,
          );
        }
      } catch (e) {
        console.error(`[telegram] chat ${chatId} error:`, e.message);
      }
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));
// Serve the logo from project root
app.use("/logo.jpg", express.static(path.join(__dirname, "logo.jpg")));

// Simple contact endpoint (logs request — заменить на отправку в CRM/почту/Telegram)
app.post("/api/contact", (req, res) => {
  const { name, phone, message, variant } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ ok: false, error: "Укажите имя" });
  }

  const digits = String(phone || "")
    .replace(/\D/g, "")
    .replace(/^8/, "7");
  if (!/^7\d{10}$/.test(digits)) {
    return res.status(400).json({
      ok: false,
      error: "Номер должен быть в российском формате: +7XXXXXXXXXX",
    });
  }
  const normalizedPhone = "+" + digits;

  // TODO: интеграция с почтой / Telegram / CRM
  console.log("[contact]", new Date().toISOString(), {
    name,
    phone: normalizedPhone,
    message,
    variant,
  });

  // Уведомление в Telegram (не блокируем ответ клиенту)
  sendTelegramNotification({
    name: String(name).trim(),
    phone: normalizedPhone,
    message,
    variant,
  }).catch((e) => console.error("[telegram] unexpected:", e));

  return res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ProRemont site running at http://localhost:${PORT}`);
});
