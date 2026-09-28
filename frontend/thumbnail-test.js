require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");
const { createCanvas } = require("canvas");
const fs = require("fs");

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function getThemeFromTopic(topic) {
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 200,
    system: `Given a podcast topic, output ONLY valid JSON, no markdown:
{"title": "short punchy 3-5 word title", "color1": "#hex", "color2": "#hex"}
Pick 2 hex colors that visually fit the topic mood.`,
    messages: [{ role: "user", content: `Topic: ${topic}` }],
  });

  let text = res.content[0].text;
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(text);
}

async function generateThumbnail(topic) {
  const theme = await getThemeFromTopic(topic);
  console.log("Theme:", theme);

  const size = 800;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, theme.color1);
  grad.addColorStop(1, theme.color2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Title text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px Sans";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Wrap text into lines
  const words = theme.title.split(" ");
  const lines = [];
  let currentLine = "";
  words.forEach(word => {
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
  const startY = size / 2 - (lines.length - 1) * lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, startY + i * lineHeight);
  });

  // Podcast label
  ctx.font = "30px Sans";
  ctx.fillText("AUTOPOD", size / 2, size - 60);

  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync("thumbnail.png", buffer);
  console.log("Saved thumbnail.png");
}

generateThumbnail("The impact of social media on mental health");