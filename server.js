// ==============================
// 🌍 FLOWMIND CHAT BACKEND API
// ==============================
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const PDFDocument = require("pdfkit");

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ============================
// ✅ OpenAI
// ============================
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// ============================
// ✅ Data Setup
// ============================
let messages = [];
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_DIR = path.join(DATA_DIR, "orders");
const KNOWLEDGE_PATH = path.join(DATA_DIR, "business_knowledge.json");
const ORDERS_PATH = path.join(ORDERS_DIR, "completed.json");
fs.mkdirSync(ORDERS_DIR, { recursive: true });

function loadJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return fallback;
  }
}
function saveJSON(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
}

let knowledge = loadJSON(KNOWLEDGE_PATH, {
  company: { name: "FlowMind AI", tone: "Professional" },
  notes: "",
  products: [],
  faq: [],
});

// ============================
// ✅ Helper Functions
// ============================
async function sendWhatsAppMessage(to, text) {
  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WA_TOKEN}`,
      },
    });

    console.log("✅ WhatsApp →", to, response.data);
  } catch (err) {
    console.error("❌ WhatsApp send error:", err.response?.data || err.message);
  }
}

function newOrderId() {
  return "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ============================
// ✅ Root
// ============================
app.get("/", (_, res) => res.send("🚀 FlowMind Chat API is live!"));

// ============================
// ✅ Meta Webhook Verify
// ============================
app.get("/webhooks/whatsapp", (req, res) => {
  const VERIFY_TOKEN = "flowmind_verify_token";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ============================
// ✅ WhatsApp Inbound
// ============================
app.post("/webhooks/whatsapp", async (req, res) => {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;
    const userText = msg.text?.body || "hello";
    console.log("💬 Incoming from", from, ":", userText);
    messages.push({ from, text: userText, timestamp: new Date().toISOString() });

    // 1️⃣ Product detection
    const found = knowledge.products?.find((p) =>
      (p.keywords || []).some((k) =>
        userText.toLowerCase().includes(k.toLowerCase())
      )
    );

    if (found) {
      await sendWhatsAppMessage(
        from,
        `✅ ${found.name}: ${found.description}\nPrice: ₦${found.price}\n\nWould you like to pay by bank transfer or card (Paystack link)?`
      );
      return res.sendStatus(200);
    }

    // 2️⃣ AI response
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are FlowMind AI for ${knowledge.company.name}.
Tone: ${knowledge.company.tone}.
Important Notes: ${knowledge.notes || "None"}
Knowledge: ${JSON.stringify(knowledge, null, 2)}
Be warm, human-like, and concise. Ask one clear follow-up at a time when needed.`,
        },
        { role: "user", content: userText },
      ],
    });

    const replyText =
      ai.choices[0].message.content || "Thanks! How can I help you today?";
    await sendWhatsAppMessage(from, replyText);

    messages.push({
      from: "FlowMind AI",
      text: replyText,
      timestamp: new Date().toISOString(),
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ /webhooks/whatsapp error:", err.message);
    return res.sendStatus(500);
  }
});

// ============================
// ✅ Dashboard APIs
// ============================
app.get("/api/messages", (_, res) => res.json(messages.slice(-200)));

app.get("/api/knowledge", (_, res) => {
  try {
    const data = loadJSON(KNOWLEDGE_PATH, knowledge);
    return res.json(data);
  } catch {
    return res.status(500).json({ error: "Could not load knowledge." });
  }
});

app.post("/api/knowledge", (req, res) => {
  try {
    knowledge = req.body;
    saveJSON(KNOWLEDGE_PATH, knowledge);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Could not save knowledge." });
  }
});

// ============================
// ✅ Manual Reply (Dashboard)
// ============================
app.post("/send-reply", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });
    const lastUser = [...messages]
      .reverse()
      .find((m) => m.from && m.from !== "FlowMind AI");
    if (!lastUser) return res.status(400).json({ error: "No recipient found" });
    await sendWhatsAppMessage(lastUser.from, text);
    messages.push({ from: "You", text, timestamp: new Date().toISOString() });
    return res.json({ success: true });
  } catch (e) {
    console.error("❌ /send-reply:", e.message);
    return res.status(500).json({ error: "Failed to send reply" });
  }
});

// ============================
// ✅ Orders / Receipts
// ============================
app.get("/api/orders", (_, res) => {
  try {
    const list = loadJSON(ORDERS_PATH, []);
    return res.json(list);
  } catch {
    return res.status(500).json({ error: "Unable to load orders." });
  }
});

app.get("/api/orders/download/:orderId", (req, res) => {
  const { orderId } = req.params;
  const orders = loadJSON(ORDERS_PATH, []);
  const order = orders.find((o) => (o.orderId || o.id) === orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const company = knowledge.company?.name || "FlowMind AI";
  const fn = `delivery_${orderId}.pdf`;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fn}"`);
  doc.pipe(res);

  doc.fontSize(18).text(`${company} — Delivery Note`, { align: "left" });
  doc.moveDown();
  doc.fontSize(12).text(`Order ID: ${orderId}`);
  doc.text(`Customer: ${order.thread || order.customerName || "N/A"}`);
  doc.text(`Product: ${order.product || "N/A"}`);
  doc.text(`Amount Paid: ₦${(order.amount || 0).toLocaleString()}`);
  doc.text(`Reference: ${order.reference || "N/A"}`);
  doc.text(`Delivery Date: ${order.deliveryDate || "Not set"}`);
  doc.moveDown();
  doc.fontSize(10).fillColor("#555").text("Thank you for your purchase!");
  doc.end();
});

// ============================
// ✅ WhatsApp Test Endpoint
// ============================
app.post("/test-whatsapp", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message)
    return res.status(400).json({ error: "Missing to/message" });

  console.log("🧪 Testing WhatsApp send to", to);
  try {
    await sendWhatsAppMessage(to, message);
    res.json({ success: true, to, message });
  } catch (e) {
    console.error("❌ /test-whatsapp:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ============================
// ✅ Start
// ============================
const PORT = process.env.PORT || 7000;
app.listen(PORT, () =>
  console.log(`🌐 Backend running on http://localhost:${PORT}`)
);
