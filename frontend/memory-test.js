require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

const episodeSchema = new mongoose.Schema({
  topic: String,
  script: Array,
  createdAt: { type: Date, default: Date.now },
});

const Episode = mongoose.model("Episode", episodeSchema);

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const script = require("./script.json");

  const episode = await Episode.create({
    topic: "the future of electric vehicles",
    script,
  });
  console.log("Saved episode:", episode._id);

  const pastEpisodes = await Episode.find().sort({ createdAt: -1 }).limit(3);
  console.log("Past episodes:", pastEpisodes.map(e => e.topic));

  await mongoose.disconnect();
}

main();