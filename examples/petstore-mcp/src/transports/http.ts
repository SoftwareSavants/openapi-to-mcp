import express from "express";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { createOAuthProvider } from "../oauth-provider.js";
import { getApiConfigFromToken } from "../auth.js";
import type { ApiConfig } from "../types.js";

export async function startHttp(
  createServer: (getConfig: () => ApiConfig) => McpServer,
) {
  const port = Number(process.env.PORT ?? 3000);
  const provider = createOAuthProvider();

  const issuerUrl = new URL(process.env.OAUTH_ISSUER_URL ?? `http://localhost:${port}`);

  const app = express();

  app.use(mcpAuthRouter({
    provider,
    issuerUrl,
    scopesSupported: (process.env.OAUTH_SCOPES ?? "").split(",").filter(Boolean),
  }));

  const bearerAuth = requireBearerAuth({ verifier: provider });

  const sessions = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", bearerAuth, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport = sessionId ? sessions.get(sessionId) : undefined;

    if (!transport) {
      const token = req.auth!.token;

      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport!);
        },
      });

      transport.onclose = () => {
        const id = transport!.sessionId;
        if (id) sessions.delete(id);
      };

      const server = createServer(() => getApiConfigFromToken(token));
      await server.connect(transport);
    }

    await transport.handleRequest(req, res);
  });

  app.get("/mcp", bearerAuth, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? sessions.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: "No active session. Send a POST to /mcp first." });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.delete("/mcp", bearerAuth, async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? sessions.get(sessionId) : undefined;

    if (!transport) {
      res.status(400).json({ error: "No active session." });
      return;
    }

    await transport.handleRequest(req, res);
  });

  app.listen(port, () => {
    console.log(`MCP HTTP server listening on port ${port}`);
    console.log(`OAuth authorization: ${issuerUrl.href}authorize`);
    console.log(`MCP endpoint:        ${issuerUrl.href}mcp`);
  });
}
