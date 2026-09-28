require("dotenv").config();
const { LocalIndex } = require("vectra");
const { pipeline } = require("@huggingface/transformers");
const path = require("path");

let embedder;

async function getEmbedding(text) {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

async function main() {
  const index = new LocalIndex(path.join(__dirname, "kb-index"));
  if (!(await index.isIndexCreated())) await index.createIndex();

  const queryVector = await getEmbedding("Why are electric cars becoming popular?");
  const results = await index.queryItems(queryVector, "", 2);

  console.log("Top matches:");
  results.forEach(r => console.log("-", r.item.metadata.text, "(score:", r.score.toFixed(3), ")"));
}

main();