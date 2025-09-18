import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Ultravox Agent + API Key (replace with yours if rotated)
const ULTRAVOX_AGENT_ID = "d56b89c1-154e-4c47-bfc2-33c8a85698ff";
const ULTRAVOX_API_KEY = "RWqVcNoE.bpzsvW5JkeUqF9ZwoTSQ3JWb9wUi1Y31";

// Route for frontend messages → forwards to Ultravox
app.post("/api/ultravox", async (req, res) => {
  try {
    const userMessage = req.body.text;

    const uvResponse = await fetch(
      `https://api.ultravox.ai/agents/${ULTRAVOX_AGENT_ID}/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ULTRAVOX_API_KEY}`
        },
        body: JSON.stringify({ text: userMessage }),
      }
    );

    const data = await uvResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error talking to Ultravox:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Webhook endpoint to receive events from Ultravox
app.post("/webhook", (req, res) => {
  console.log("Webhook event received:", req.body);
  res.status(200).send("✅ Webhook received");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
