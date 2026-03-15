import express from "express";
import { sendMessage } from "../services/whatsapp.js";
import { humanSessions, addMessage } from "../store/conversations.js";

const router = express.Router();

router.post("/reply", async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({
      error: "Missing fields",
    });
  }

  await sendMessage(to, message);

  addMessage(to, "agent", message);

  res.json({
    success: true,
  });
});

router.post("/end", (req, res) => {
  const { user } = req.body;

  humanSessions.delete(user);

  res.json({
    success: true,
    message: "Conversation returned to bot",
  });
});

export default router;