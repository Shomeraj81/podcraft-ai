require("dotenv").config();
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const Anthropic = require("@anthropic-ai/sdk");
const { EdgeTTS } = require("node-edge-tts");
const fs = require("fs");

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

const server = new McpServer({
  name: "autopod-tools",
  version: "1.0.0",
});

// Tool 1: generate script
server.registerTool(
  "generate_script",
  {
    title: "Generate podcast script",
    description: "Writes a two-host podcast dialogue JSON for a given topic",
    inputSchema: { topic: z.string() },
  },
  async ({ topic }) => {
    const systemPrompt = `You write two-host podcast scripts.
Host A: curious, asks questions, casual tone.
Host B: knowledgeable, explains clearly, friendly tone.
Output ONLY valid JSON array, no markdown. Format:
[{"speaker": "Host A", "line": "..."}, {"speaker": "Host B", "line": "..."}]
8-10 lines total.`;

    const res = await claude.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: `Topic: ${topic}` }],
    });

    let text = res.content[0].text;
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    fs.writeFileSync("script.json", text);

    return { content: [{ type: "text", text }] };
  }
);

// Tool 2: text to speech
server.registerTool(
  "text_to_speech",
  {
    title: "Convert text to speech",
    description: "Converts a line of text to an mp3 using given voice",
    inputSchema: {
      text: z.string(),
      voice: z.string(),
      outFile: z.string(),
    },
  },
  async ({ text, voice, outFile }) => {
    const tts = new EdgeTTS({ voice, lang: "en-US" });
    await tts.ttsPromise(text, outFile);
    return { content: [{ type: "text", text: `Saved ${outFile}` }] };
  }
);

const transport = new StdioServerTransport();
server.connect(transport);