require("dotenv").config();
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const Anthropic = require("@anthropic-ai/sdk");

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

async function main() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcp-server.js"],
  });

  const client = new Client({ name: "autopod-client", version: "1.0.0" });
  await client.connect(transport);

  const toolsList = await client.listTools();
  console.log("Tools available:", toolsList.tools.map(t => t.name));

  const claudeTools = toolsList.tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  }));

  let messages = [
    { role: "user", content: "Generate a podcast script about the future of electric vehicles." },
  ];

  let res = await claude.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    tools: claudeTools,
    messages,
  });

  console.log("Stop reason:", res.stop_reason);

  if (res.stop_reason === "tool_use") {
    const toolUse = res.content.find(c => c.type === "tool_use");
    console.log("Claude wants to call:", toolUse.name, toolUse.input);

    const result = await client.callTool({
      name: toolUse.name,
      arguments: toolUse.input,
    });

    console.log("Tool result:", result.content[0].text.slice(0, 200));
  }

  process.exit(0);
}

main();