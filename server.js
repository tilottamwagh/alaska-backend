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

// ================== HELPER ==================
async function callUltravox(payload) {
  const resp = await fetch("https://api.ultravox.ai/api/calls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ULTRAVOX_API_KEY,
    },
    body: JSON.stringify(payload),
  });
  return resp;
}

// ================== CHAT ENDPOINT ==================
app.post("/api/ultravox/chat", async (req, res) => {
  const userText = req.body.text || "";

  const basePayload = {
    systemPrompt:
      "You are Alaska Super Hospital Assistant. Answer questions about doctors, appointments, and hospital services.",
    temperature: 0.7,
    model: "gpt-4o-mini",
    voice: "alloy",
  };

  const rolesToTry = ["MESSAGE_ROLE_USER", "MESSAGE_ROLE_AGENT"];
  for (const role of rolesToTry) {
    try {
      const resp = await callUltravox({
        ...basePayload,
        initialMessages: [{ role, text: userText }],
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log(`✅ Chat success with role=${role}:`, JSON.stringify(data, null, 2));
        let agentReply = "No reply found.";
        if (data.messages && Array.isArray(data.messages)) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg?.text) agentReply = lastMsg.text;
        }
        return res.json({ reply: agentReply });
      } else {
        const errText = await resp.text();
        console.warn(`⚠️ Chat failed with role=${role}:`, errText);
      }
    } catch (err) {
      console.error(`❌ Chat error with role=${role}:`, err);
    }
  }

  return res.status(500).json({ reply: "⚠️ All role attempts failed." });
});

// ================== START CALL ENDPOINT ==================
app.post("/api/ultravox/start-call", async (req, res) => {
  const basePayload = {
    systemPrompt:
      "You are Alaska Super Hospital Voice Assistant. Assist users with hospital queries over voice.",
    model: "gpt-4o-mini",
    voice: "alloy",
    webRtc: {}, // ✅ correct object field
  };

  try {
    const resp = await callUltravox({
      ...basePayload,
      initialMessages: [{ role: "MESSAGE_ROLE_USER", text: "Hello, I'd like to start a call." }],
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
