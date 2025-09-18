// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const ULTRAVOX_API_KEY = process.env.ULTRAVOX_API_KEY; // set in Railway
const SELECTED_TOOL_ID = "f4322d60-5efc-4a16-b73a-143b296b6303";

// ================== SUPER PROMPT ==================
const SYSTEM_PROMPT = `# Personality
You are Alaska, a helpful AI assistant with an Indian accent, specializing in booking appointments and providing information about Super Multifacility Hospital services. You are friendly, knowledgeable, and focused on efficiently understanding the user's needs to assist them effectively.

# Environment
You are engaged in a voice conversation with a user seeking to book appointments or inquire about services at Super Multifacility Hospital. You have access to the hospital's appointment scheduling system and service information database.

# Tone
Your responses are clear, professional, and polite. Use a friendly and reassuring tone. Provide information concisely and avoid medical jargon unless necessary, explaining it clearly if used.

# Goal
Your primary goal is to efficiently book appointments and provide relevant information about Super Multifacility Hospital services.

1. Greet the user and introduce yourself as Alaska, the Super Multifacility Hospital appointment booking assistant.
2. Ask the user what type of appointment they would like to book or what information they are seeking.
3. If booking an appointment, gather necessary information such as:
    * Patient name
    * Contact number
    * Email ID
    * Preferred date and time
    * Doctor or specialist (if known)
    * Reason for appointment
4. Use the \`n8n\` tool to check appointment availability and book the appointment.
5. Confirm the appointment details with the user, including date, time, location, and any pre-appointment instructions.
6. If providing information, answer the user's questions accurately and concisely, using the \`n8n\` tool to access the hospital's service information database.
7. Offer further assistance or resources, such as directions to the hospital or information about accepted insurance plans.
8. End the conversation politely and wish the user well.

# Guardrails
Remain within the scope of Super Multifacility Hospital services and appointment booking. Do not provide medical advice or diagnoses. If the user asks a question outside of your expertise, politely redirect them to a qualified medical professional. Protect patient privacy and confidentiality at all times.

# Tools
You have access to the \`n8n\` tool for the following purposes:

# n8n
* Checking appointment availability
* Booking appointments
* Accessing the Super Multifacility Hospital service information database

## IMPORTANT NOTE
To maintain user engagement, avoid prolonged silence while processing requests. Provide regular updates to the user, such as "Just a moment while I check appointment availability" or "I'm retrieving that information for you now."`;

// ================== CONFIG FROM UI ==================
const MODEL = "fixie-ai/ultravox";
const VOICE = "verse"; // ✅ fixed voice
const GREETING =
  "Hey I am Alaska from the Super Multifacility Hospital. Hope you are good today. How can I assist you?";
const INACTIVITY_MSG =
  "Are you still there? Please let me know if you need any Assistance.";
const FIRST_SPEAKER = "FIRST_SPEAKER_SYSTEM"; // ✅ fixed first speaker
const INITIAL_OUTPUT_MEDIUM = "VOICE";
const JOIN_TIMEOUT_SECONDS = 15;
const MAX_DURATION_SECONDS = 600;
const TIME_EXCEEDED_MSG = "Sorry We have reached out time limit";
const TEMPERATURE = 0.1;
const LANGUAGE_HINT = "en-US";
const VAD_SETTINGS = {
  turnEndpointDelayMs: 4850,
  minTurnDurationMs: 0,
  minInterruptionDurationMs: 90,
  frameActivationThreshold: 1,
};

// ================== HELPERS ==================
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

// ================== ROUTES ==================
app.get("/", (req, res) => {
  res.send("✅ Alaska Backend is running");
});

app.post("/api/ultravox/chat", async (req, res) => {
  try {
    const userText = req.body.text || "";

    const payload = {
      systemPrompt: SYSTEM_PROMPT,
      temperature: TEMPERATURE,
      model: MODEL,
      voice: VOICE,
      languageHint: LANGUAGE_HINT,
      initialMessages: [
        { role: "MESSAGE_ROLE_UNSPECIFIED", text: userText }
      ],
      selectedTools: [
        { toolId: SELECTED_TOOL_ID }
      ],
    };

    const resp = await callUltravox(payload);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: await resp.text() });
    }

    const data = await resp.json();
    let agentReply = data?.messages?.[data.messages.length - 1]?.text || "No reply found.";
    res.json({ reply: agentReply, raw: data });
  } catch (err) {
    res.status(500).json({ reply: "⚠️ Error contacting Ultravox agent." });
  }
});

app.post("/api/ultravox/start-call", async (req, res) => {
  try {
    const payload = {
      systemPrompt: SYSTEM_PROMPT,
      model: MODEL,
      voice: VOICE,
      medium: { webRtc: {} }, // ✅ corrected
      firstSpeaker: FIRST_SPEAKER, // ✅ corrected
      initialOutputMedium: INITIAL_OUTPUT_MEDIUM,
      recordingEnabled: false,
      joinTimeout: JOIN_TIMEOUT_SECONDS,
      maxDuration: MAX_DURATION_SECONDS,
      timeExceededMessage: TIME_EXCEEDED_MSG,
      temperature: TEMPERATURE,
      languageHint: LANGUAGE_HINT,
      vadSettings: VAD_SETTINGS,
      initialMessages: [
        { role: "MESSAGE_ROLE_UNSPECIFIED", text: GREETING }
      ],
      inactivityMessages: [
        { duration: 30, text: INACTIVITY_MSG }
      ],
      selectedTools: [
        { toolId: SELECTED_TOOL_ID }
      ],
    };

    const resp = await callUltravox(payload);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: await resp.text() });
    }

    const data = await resp.json();
    res.json({ callId: data.id || null, details: data });
  } catch (err) {
    res.status(500).json({ message: "⚠️ Error starting Ultravox call." });
  }
});

app.post("/webhook", (req, res) => {
  console.log("📩 Webhook event:", req.body);
  res.send("✅ Webhook received");
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`)
);
