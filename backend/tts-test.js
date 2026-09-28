const { EdgeTTS } = require("node-edge-tts");

async function speak(text, voice, outFile) {
  const tts = new EdgeTTS({ voice, lang: "en-US" });
  await tts.ttsPromise(text, outFile);
  console.log("Saved", outFile);
}

async function main() {
  await speak(
    "Welcome to the show! Today we talk about AI.",
    "en-US-GuyNeural",
    "hostA.mp3"
  );
  await speak(
    "Thanks for having me. This is going to be fun.",
    "en-US-JennyNeural",
    "hostB.mp3"
  );
}

main();