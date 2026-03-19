import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { getApiConfig } from "../auth.js";
import type { ApiConfig } from "../types.js";

export async function startSse(
  createServer: (getConfig: () => ApiConfig) => McpServer,
) {
  const port = Number(process.env.PORT ?? 3000);
  const config = getApiConfig();

  const app = express();

  const sessions = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    const transport = new SSEServerTransport("/messages", res);
    sessions.set(transport.sessionId, transport);

    const server = createServer(() => config);
    await server.connect(transport);

    transport.onclose = () => {
      sessions.delete(transport.sessionId);
    };
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sessions.get(sessionId);

    if (!transport) {
      res.status(400).json({ error: "No active session." });
      return;
    }

    await transport.handlePostMessage(req, res);
  });

  app.listen(port, () => {
    console.log(`MCP SSE server listening on port ${port}`);
    console.log(`SSE endpoint: http://localhost:${port}/sse`);
  });
}
