import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const PORT = process.env.PORT || 3000;

// Health check
app.get("/", (req, res) => {
  res.send("WhatsApp bot is running");
});

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// WhatsApp webhook receiver
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;
    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text) {
      return;
    }

    const from = message.from;
    const text = message.text.body.toLowerCase();

    console.log("User:", from);
    console.log("Message:", text);

    let reply = "Sorry, I didn't understand that.";

    // Simple keyword bot
    if (text.includes("hi") || text.includes("hello")) {
      reply = "Hello 👋\nHow can I help you?";
    } else if (text.includes("help")) {
      reply =
        "Available commands:\n" +
        "1. hi\n" +
        "2. price\n" +
        "3. contact\n" +
        "4. bye";
    } else if (text.includes("price")) {
      reply = "Our product price is ₹499.";
    } else if (text.includes("contact")) {
      reply = "Contact us at support@example.com";
    } else if (text.includes("bye")) {
      reply = "Goodbye 👋 Have a nice day!";
    }

    // Send reply
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Reply sent");
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
