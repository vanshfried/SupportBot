import express from "express";
import { sendMessage } from "../services/whatsapp.js";
import {
  conversations,
  humanSessions,
  addMessage,
} from "../store/conversations.js";

const router = express.Router();

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

router.post("/", async (req, res) => {
  res.sendStatus(200);

  try {
    const body = req.body;

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message || !message.text) return;

    const from = message.from;
    const text = message.text.body.toLowerCase();

    console.log("User:", from, text);

    addMessage(from, "user", text);

    if (humanSessions.get(from)) {
      console.log("Human session active");
      return;
    }

    let reply = "Sorry, I didn't understand.";

    if (text.includes("hi") || text.includes("hello")) {
      reply = "Hello 👋 How can I help?";
    } else if (text.includes("help")) {
      reply = "Commands:\n\n" + "price\n" + "contact\n" + "human";
    } else if (text.includes("price")) {
      reply = "Our product costs ₹499";
    } else if (text.includes("contact")) {
      reply = "Email support@example.com";
    } else if (text.includes("human")) {
      humanSessions.set(from, true);
      reply = "Connecting you to human agent...";
    }

    addMessage(from, "agent", reply);

    await sendMessage(from, reply);
  } catch (err) {
    console.error("Webhook error:", err.message);
  }
});

router.get("/conversations", (req, res) => {
  const result = {};

  for (const [user, messages] of conversations.entries()) {
    result[user] = messages;
  }

  res.json(result);
});

export default router;
