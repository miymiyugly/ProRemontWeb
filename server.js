const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

  return res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`ProRemont site running at http://localhost:${PORT}`);
});
