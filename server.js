import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Read environment variables
const ULTRAVOX_AGENT_ID = process.env.ULTRAVOX_AGENT_ID;
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;

// ✅ Debug logging – check if Railway is injecting vars
console.log("🚀 Starting Alaska Backend...");
console.log("✅ Agent ID:", ULTRAVOX_AGENT_ID || "❌ MISSING");
console.log("✅ API Key present?", ULTRAVOX_API_KEY ? "✅ YES" : "❌ NO");

// ================== CHAT ENDPOINT ==================
app.post("/api/ultravox/chat", async (req, res) => {
  try {
    const userText = req.body.text || "";

    const url = `https://app.ultravox.ai/api/internal/agents/${ULTRAVOX_AGENT_ID}/test_calls`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY, // ✅ Correct header
      },
      body: JSON.stringify({ text: userText }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("❌ Ultravox chat API error:", resp.status, errText);
      return res.status(500).json({ reply: "⚠️ Error from Ultravox API" });
    }

    const data = await resp.json();
    console.log("✅ Ultravox chat response:", JSON.stringify(data, null, 2));

    let agentReply = "No reply found.";
    if (data.messages && Array.isArray(data.messages)) {
      const lastMsg = data.messages[data.messages.length - 1];
      if (lastMsg?.text) agentReply = lastMsg.text;
    }

    res.json({ reply: agentReply });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ reply: "⚠️ Error contacting Ultravox agent." });
  }
});

// ================== START CALL ENDPOINT ==================
app.post("/api/ultravox/start-call", async (req, res) => {
  try {
    const url = `https://app.ultravox.ai/api/internal/blocky/start-call`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY, // ✅ Correct header
      },
      body: JSON.stringify({ agentId: ULTRAVOX_AGENT_ID }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("❌ Ultravox start-call API error:", resp.status, errText);
      return res.status(500).json({ message: "⚠️ Error starting Ultravox call." });
    }

    const data = await resp.json();
    console.log("✅ Ultravox start-call response:", JSON.stringify(data, null, 2));

    res.json({
      callId: data.callId || null,
      livekitUrl: data.livekit?.url || null,
      token: data.livekit?.token || null,
      status: data.status || "started",
    });
  } catch (err) {
    console.error("❌ Start call error:", err);
    res.status(500).json({ message: "⚠️ Error starting Ultravox call." });
  }
});

// ================== WEBHOOK ==================
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook event received:", req.body);
  res.status(200).send("✅ Webhook received");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
