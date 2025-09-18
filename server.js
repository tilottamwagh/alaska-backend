import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Read from environment variables (Railway Settings → Variables)
const ULTRAVOX_AGENT_ID = process.env.ULTRAVOX_AGENT_ID;
const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY;

// Route for frontend messages → forwards to Ultravox
app.post("/api/ultravox", async (req, res) => {
  try {
    const userMessage = req.body.text || "";

    if (!ULTRAVOX_AGENT_ID || !ULTRAVOX_API_KEY) {
      return res.status(500).json({ reply: "⚠️ Backend not configured with Agent ID or API Key" });
    }

    const uvResponse = await fetch(
      `https://api.ultravox.ai/agents/${ULTRAVOX_AGENT_ID}/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ULTRAVOX_API_KEY}`,
        },
        body: JSON.stringify({ text: userMessage }),
      }
    );

    if (!uvResponse.ok) {
      const errorText = await uvResponse.text();
      console.error("Ultravox API error:", uvResponse.status, errorText);
      return res.status(500).json({ reply: "⚠️ Error from Ultravox API" });
    }

    const data = await uvResponse.json();

    // Pick the best reply field safely
    const reply =
      data.reply ||
      data.response ||
      data.text ||
      JSON.stringify(data);

    res.json({ reply });
  } catch (error) {
    console.error("Error talking to Ultravox:", error);
    res.status(500).json({ reply: "⚠️ Error contacting Ultravox agent." });
  }
});

// Webhook endpoint to receive events from Ultravox
app.post("/webhook", (req, res) => {
  console.log("Webhook event received:", req.body);
  res.status(200).send("✅ Webhook received");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
