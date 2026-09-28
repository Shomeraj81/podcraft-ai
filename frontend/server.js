require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Anthropic = require("@anthropic-ai/sdk");
const { EdgeTTS } = require("node-edge-tts");
const { execSync } = require("child_process");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ---- MongoDB schema ----
const episodeSchema = new mongoose.Schema({
  topic: String,
  title: String,
  author: String,
  script: Array,
  audioUrl: String,
  thumbnailUrl: String,
  likes: { type: Number, default: 0 },
  comments: [
    {
      name: String,
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
const Episode = mongoose.model("Episode", episodeSchema);

const HOST_VOICES = {
  "Host A": "en-US-GuyNeural",
  "Host B": "en-US-JennyNeural",
};

// ---- Helper: generate script ----
async function generateScript(topic) {
  const systemPrompt = `You write two-host podcast scripts.
Host A: curious, asks questions, casual tone.
Host B: knowledgeable, explains clearly, friendly tone.

Output ONLY valid JSON array, no markdown, no extra text. Format:
[{"speaker": "Host A", "line": "..."}, {"speaker": "Host B", "line": "..."}]

Make it exactly 18-20 lines total, targeting a 5 minute spoken episode. Each line 1-2 sentences, natural conversation, cover the topic with examples and follow-up questions.`;

  const res = await claude.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: `Topic: ${topic}` }],
  });

  let text = res.content[0].text;
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(text);
}

// ---- Helper: theme + thumbnail ----
async function generateThumbnail(topic, episodeId) {
  const { createCanvas } = require("canvas");

  const res = await claude.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: `Given a podcast topic, output ONLY valid JSON, no markdown:
{"title": "short punchy 3-5 word title", "color1": "#hex", "color2": "#hex"}
Pick 2 hex colors that visually fit the topic mood.`,
    messages: [{ role: "user", content: `Topic: ${topic}` }],
  });

  let text = res.content[0].text;
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const theme = JSON.parse(text);

  const size = 800;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, theme.color1);
  grad.addColorStop(1, theme.color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px Sans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = theme.title.split(" ");
  const lines = [];
  let currentLine = "";
  words.forEach((word) => {
    const test = currentLine + word + " ";
    if (ctx.measureText(test).width > size - 100 && currentLine !== "") {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine = test;
    }
  });
  lines.push(currentLine.trim());

  const lineHeight = 70;
  const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, startY + i * lineHeight);
  });

  ctx.font = "30px Sans";
  ctx.fillText("AUTOPOD", size / 2, size - 60);

  const filePath = path.join(__dirname, `thumb_${episodeId}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer("image/png"));
  return { filePath, title: theme.title };
}

// ---- Helper: TTS + stitch ----
async function generateAudio(script, episodeId) {
  const tempDir = path.join(__dirname, `temp_${episodeId}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const clipFiles = [];
  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    const voice = HOST_VOICES[line.speaker] || HOST_VOICES["Host A"];
    const outFile = path.join(tempDir, `clip_${i}.mp3`);
    const tts = new EdgeTTS({ voice, lang: "en-US" });
    await tts.ttsPromise(line.line, outFile);
    clipFiles.push(outFile);
  }

  const listFile = path.join(tempDir, "list.txt");
  const listContent = clipFiles
    .map((f) => `file '${f.replace(/\\/g, "/")}'`)
    .join("\n");
  fs.writeFileSync(listFile, listContent);

  const outputFile = path.join(__dirname, `episode_${episodeId}.mp3`);
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`);

  // cleanup clips
  fs.rmSync(tempDir, { recursive: true, force: true });

  return outputFile;
}

// ---- ROUTE: generate podcast ----
app.post("/api/generate", async (req, res) => {
  try {
    const { topic, author } = req.body;
    if (!topic || !author) {
      return res.status(400).json({ error: "topic and author required" });
    }

    const episodeId = Date.now().toString();
    console.log("Generating script...");
    const script = await generateScript(topic);

    console.log("Generating audio...");
    const audioPath = await generateAudio(script, episodeId);

    console.log("Generating thumbnail...");
    const { filePath: thumbPath, title } = await generateThumbnail(topic, episodeId);

    console.log("Uploading to Cloudinary...");
    const audioUpload = await cloudinary.uploader.upload(audioPath, {
      resource_type: "video",
      folder: "autopod/audio",
    });
    const thumbUpload = await cloudinary.uploader.upload(thumbPath, {
      folder: "autopod/thumbnails",
    });

    // cleanup local files
    fs.unlinkSync(audioPath);
    fs.unlinkSync(thumbPath);

    const episode = await Episode.create({
      topic,
      title,
      author,
      script,
      audioUrl: audioUpload.secure_url,
      thumbnailUrl: thumbUpload.secure_url,
    });

    res.json(episode);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---- ROUTE: get feed ----
app.get("/api/episodes", async (req, res) => {
  const episodes = await Episode.find().sort({ createdAt: -1 });
  res.json(episodes);
});

// ---- ROUTE: get one episode ----
app.get("/api/episodes/:id", async (req, res) => {
  const episode = await Episode.findById(req.params.id);
  if (!episode) return res.status(404).json({ error: "not found" });
  res.json(episode);
});

// ---- ROUTE: like ----
app.post("/api/episodes/:id/like", async (req, res) => {
  const episode = await Episode.findByIdAndUpdate(
    req.params.id,
    { $inc: { likes: 1 } },
    { new: true }
  );
  res.json(episode);
});

// ---- ROUTE: comment ----
app.post("/api/episodes/:id/comment", async (req, res) => {
  const { name, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: "name and text required" });

  const episode = await Episode.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { name, text } } },
    { new: true }
  );
  res.json(episode);
});

// ---- Start server ----
async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  app.listen(5000, () => console.log("Server running on port 5000"));
}

start();