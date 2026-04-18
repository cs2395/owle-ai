require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Clone a voice from an audio blob
app.post("/api/clone-voice", upload.single("audio"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("name", "owner_voice");
    form.append("files", req.file.buffer, {
      filename: req.file.originalname || "audio.webm",
      contentType: req.file.mimetype,
    });

    const { data } = await axios.post(
      "https://api.elevenlabs.io/v1/voices/add",
      form,
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          ...form.getHeaders(),
        },
      }
    );

    res.json({ voice_id: data.voice_id });
  } catch (err) {
    console.error("clone-voice error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Render text-to-speech with a cloned voice
app.post("/api/render-voice", async (req, res) => {
  try {
    const { text, voice_id } = req.body;

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        model_id: "eleven_multilingual_v2",
        text,
        voice_settings: { stability: 0.6, similarity_boost: 0.9 },
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    res.set("Content-Type", "audio/mpeg");
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error("render-voice error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.listen(3001, () => console.log("Server running on http://localhost:3001"));
