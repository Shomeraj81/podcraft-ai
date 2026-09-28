require("dotenv").config();
const { EdgeTTS } = require("node-edge-tts");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const HOST_VOICES = {
  "Host A": "en-US-GuyNeural",
  "Host B": "en-US-JennyNeural",
};

async function speakLine(text, voice, outFile) {
  const tts = new EdgeTTS({ voice, lang: "en-US" });
  await tts.ttsPromise(text, outFile);
}

async function main() {
  const script = JSON.parse(fs.readFileSync("script.json", "utf-8"));

  const tempDir = path.join(__dirname, "temp_clips");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const clipFiles = [];

  for (let i = 0; i < script.length; i++) {
    const line = script[i];
    const voice = HOST_VOICES[line.speaker];
    const outFile = path.join(tempDir, `clip_${i}.mp3`);
    console.log(`Generating clip ${i + 1}/${script.length} (${line.speaker})...`);
    await speakLine(line.line, voice, outFile);
    clipFiles.push(outFile);
  }

  // Build ffmpeg concat list file
  const listFile = path.join(tempDir, "list.txt");
  const listContent = clipFiles.map(f => `file '${f.replace(/\\/g, "/")}'`).join("\n");
  fs.writeFileSync(listFile, listContent);

  const outputFile = "episode.mp3";
  console.log("Stitching with ffmpeg...");
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${outputFile}"`);

  console.log("Done. Saved as", outputFile);
}

main();