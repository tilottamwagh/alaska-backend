import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;

console.log("🚀 Starting Alaska Backend...");
console.log("✅ API Key present?", ULTRAVOX_API_KEY ? "✅ YES" : "❌ NO");

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  console.log("✅ Health check hit from Railway");
  res.send("✅ Alaska Backend is running");
});

// ================== CHAT ENDPOINT ==================
app.post("/api/ultravox/chat", async (req, res) => {
  try {
    const userText = req.body.text || "";

    const resp = await fetch("https://api.ultravox.ai/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY,
      },
      body: JSON.stringify({
        systemPrompt:
          "You are Alaska Super Hospital Assistant. Answer questions about doctors, appointments, and hospital services.",
        temperature: 0.7,
        model: "gpt-4o-mini",
        voice: "alloy",
        initialMessages: [
          { role: "USER", text: userText } // ✅ now uppercase USER
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("❌ Ultravox chat API error:", resp.status, errText);
      return res
        .status(500)
        .json({ reply: `⚠️ Error from Ultravox API: ${resp.status} ${errText}` });
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
    const resp = await fetch("https://api.ultravox.ai/api/calls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ULTRAVOX_API_KEY,
      },
      body: JSON.stringify({
        systemPrompt:
          "You are Alaska Super Hospital Voice Assistant. Assist users with hospital queries over voice.",
        model: "gpt-4o-mini",
        voice: "alloy",
        medium: "webRtc", // ✅ correct way
        initialMessages: [
          { role: "USER", text: "Hello, I’d like to start a call." }
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("❌ Ultravox start-call API error:", resp.status, errText);
      return res
        .status(500)
        .json({ message: `⚠️ Error starting Ultravox call: ${resp.status} ${errText}` });
    }

    const data = await resp.json();
    console.log("✅ Ultravox start-call response:", JSON.stringify(data, null, 2));

    res.json({
      callId: data.id || null,
      status: data.status || "started",
      details: data,
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
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Backend running and listening on http://0.0.0.0:${PORT}`)
);
