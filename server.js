import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ULTRAVOX_AGENT_ID = process.env.ULTRAVOX_AGENT_ID;
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;

// ✅ Chat endpoint
app.post("/api/ultravox/chat", async (req, res) => {
  try {
    const userText = req.body.text || "";

    const resp = await fetch(`https://api.ultravox.ai/api/calls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY,
      },
      body: JSON.stringify({
        agentId: ULTRAVOX_AGENT_ID,
        initialMessages: [
          {
            role: "MESSAGE_ROLE_USER",
            text: userText,
          },
        ],
        systemPrompt: "You are Alaska, a helpful hospital voice assistant.",
      }),
    });

    const data = await resp.json();
    let agentReply = "No reply found.";

    // If messages exist, pick last one
    if (data.call && data.call.messages && data.call.messages.length > 0) {
      const msgs = data.call.messages;
      const last = msgs[msgs.length - 1];
      agentReply = last.text || agentReply;
    }

    res.json({ reply: agentReply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "⚠️ Error contacting Ultravox agent." });
  }
});

// ✅ Start Call endpoint
app.post("/api/ultravox/start-call", async (req, res) => {
  try {
    const resp = await fetch(`https://api.ultravox.ai/api/calls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY,
      },
      body: JSON.stringify({
        agentId: ULTRAVOX_AGENT_ID,
        systemPrompt: "You are Alaska, a hospital assistant ready for voice calls.",
      }),
    });

    const data = await resp.json();
    res.json({
      callId: data.call?.id || null,
      status: data.call?.status || "started",
      message: "Call started successfully",
    });
  } catch (err) {
    console.error("Start call error:", err);
    res.status(500).json({ message: "⚠️ Error starting Ultravox call." });
  }
});

// ✅ Webhook for Ultravox events
app.post("/webhook", (req, res) => {
  console.log("Webhook event received:", req.body);
  res.status(200).send("✅ Webhook received");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
