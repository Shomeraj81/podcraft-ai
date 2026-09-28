require("dotenv").config();
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function generateScript(topic) {
  const systemPrompt = `You write two-host podcast scripts.
Host A: curious, asks questions, casual tone.
Host B: knowledgeable, explains clearly, friendly tone.

Output ONLY valid JSON array, no markdown, no extra text. Format:
[{"speaker": "Host A", "line": "..."}, {"speaker": "Host B", "line": "..."}]

Make it exactly 18-20 lines total, targeting a 5 minute spoken episode. Each line 1-2 sentences, natural conversation, cover the topic with examples and follow-up questions.`;

  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: `Topic: ${topic}` }],
  });

  let text = res.content[0].text;
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const script = JSON.parse(text);
  require("fs").writeFileSync("script.json", JSON.stringify(script, null, 2));
  console.log("Generated", script.length, "lines");
}

generateScript("The impact of social media on mental health");