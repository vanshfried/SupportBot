import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
console.log("ACCESS TOKEN:", process.env.WHATSAPP_ACCESS_TOKEN);
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const PORT = process.env.PORT || 3000;

// Store users currently handled by human agent
const humanSessions = new Map();

// =============================
// Send WhatsApp Message Function
// =============================
async function sendMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Message sent to:", to);
  } catch (error) {
    console.error("Send message error:", error.response?.data || error.message);
  }
}

// =============================
// Webhook verification (Meta)
// =============================
app.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    console.log("Token:", WHATSAPP_TOKEN?.slice(0, 10));
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// =============================
// WhatsApp Webhook Receiver
// =============================
app.post("/", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text) return;

    const from = message.from;
    const text = message.text.body.toLowerCase();

    console.log("User:", from);
    console.log("Message:", text);

    // =============================
    // HUMAN MODE
    // =============================
    if (humanSessions.get(from)) {
      console.log("Human agent conversation");

      console.log(`Customer ${from}: ${text}`);

      // Here you could forward message to:
      // Slack
      // Telegram
      // Agent dashboard
      // CRM

      return;
    }

    // =============================
    // BOT MODE
    // =============================
    let reply = "Sorry, I didn't understand that.";

    if (text.includes("hi") || text.includes("hello")) {
      reply = "Hello 👋\nHow can I help you today?";
    } else if (text.includes("help")) {
      reply =
        "Available commands:\n\n" +
        "1️⃣ price\n" +
        "2️⃣ contact\n" +
        "3️⃣ human\n";
    } else if (text.includes("price")) {
      reply = "Our product price is ₹499.";
    } else if (text.includes("contact")) {
      reply = "Contact us at support@example.com";
    } else if (text.includes("human") || text.includes("agent")) {
      // enable human takeover
      humanSessions.set(from, true);

      reply =
        "✅ Connecting you to a human agent.\n\n" +
        "Please wait while we assign someone.";

      console.log(`Human support requested by ${from}`);
    }

    await sendMessage(from, reply);
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message);
  }
});

// =============================
// Agent Reply API
// =============================
app.post("/agent/reply", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      error: "Missing 'to' or 'message'",
    });
  }

  try {
    await sendMessage(to, message);

    res.json({
      success: true,
      message: "Reply sent",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to send reply",
    });
  }
});

// =============================
// End Human Session
// =============================
app.post("/agent/end", (req, res) => {
  const { user } = req.body;

  if (!user) {
    return res.status(400).json({
      error: "Missing user number",
    });
  }

  humanSessions.delete(user);

  console.log(`Session ended for ${user}`);

  res.json({
    success: true,
    message: "Conversation returned to bot",
  });
});

// =============================
// Health Check
// =============================
app.get("/health", (req, res) => {
  res.send("WhatsApp bot is running 🚀");
});

// =============================
// Start Server
// =============================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
