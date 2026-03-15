import express from "express";
import webhookRoutes from "./routes/webhook.js";
import agentRoutes from "./routes/agent.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.use("/webhook", webhookRoutes);
app.use("/agent", agentRoutes);

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
