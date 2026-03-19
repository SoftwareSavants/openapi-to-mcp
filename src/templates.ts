import type { ParsedTool, ParsedParam } from "./parser.js";

// ── Static files (identical across all generated projects) ──

export function packageJson(name: string): string {
  return JSON.stringify(
    {
      name,
      version: "1.0.0",
      description: `MCP server for ${name}`,
      type: "module",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        start: "node --env-file=.env dist/index.js",
        "start:http": "node --env-file=.env dist/index.js --http",
        "start:sse": "node --env-file=.env dist/index.js --sse",
        dev: "tsx --env-file=.env src/index.ts",
        "dev:http": "tsx --env-file=.env src/index.ts --http",
        "dev:sse": "tsx --env-file=.env src/index.ts --sse",
      },
      dependencies: {
        "@modelcontextprotocol/sdk": "^1.0.0",
        express: "^5.1.0",
        zod: "^4.3.6",
      },
      devDependencies: {
        "@types/express": "^5.0.0",
        "@types/node": "^22.0.0",
        tsx: "^4.19.0",
        typescript: "^5.7.0",
      },
      license: "MIT",
    },
    null,
    2,
  );
}

export const tsconfig = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "bundler",
      outDir: "dist",
      rootDir: "src",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      types: ["node"],
    },
    include: ["src"],
  },
  null,
  2,
);

export const gitignore = `node_modules/
dist/
.env
`;

export function envExample(baseUrl: string): string {
  return `# ── Stdio Mode (default) ──────────────────────────────────
# Used when running: npm start
API_BASE_URL=${baseUrl}
API_KEY=your-api-key

# ── HTTP + OAuth Mode ────────────────────────────────────
# Used when running: npm run start:http
# Uncomment and fill in to enable OAuth mode.

# OAUTH_AUTHORIZATION_URL=https://auth.yourproduct.com/authorize
# OAUTH_TOKEN_URL=https://auth.yourproduct.com/token
# OAUTH_USERINFO_URL=https://api.yourproduct.com/userinfo
# OAUTH_CLIENT_ID=your-oauth-client-id
# OAUTH_CLIENT_SECRET=your-oauth-client-secret
# OAUTH_SCOPES=read,write
# OAUTH_ISSUER_URL=http://localhost:3000
# OAUTH_REVOCATION_URL=https://auth.yourproduct.com/revoke
# PORT=3000
`;
}

export const typesTs = `export interface ApiConfig {
  baseUrl: string;
  getAuthHeader: () => string;
}
`;

export const authTs = `import type { ApiConfig } from "./types.js";

export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!baseUrl) throw new Error("API_BASE_URL environment variable is required");
  if (!apiKey) throw new Error("API_KEY environment variable is required");

  return { baseUrl, getAuthHeader: () => \`Bearer \${apiKey}\` };
}

export function getApiConfigFromToken(token: string): ApiConfig {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL environment variable is required");

  return { baseUrl, getAuthHeader: () => \`Bearer \${token}\` };
}

export async function apiRequest<T>(
  config: ApiConfig,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = \`\${config.baseUrl}\${path}\`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: config.getAuthHeader(),
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(\`API error \${response.status}: \${body.slice(0, 200)}\`);
  }

  return response.json() as Promise<T>;
}
`;

export const stdioTs = `import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export async function startStdio(server: McpServer) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
`;

export const oauthProviderTs = `import { ProxyOAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(\`\${name} environment variable is required for OAuth mode\`);
  return value;
}

const clients = new Map<string, OAuthClientInformationFull>();

export function createOAuthProvider() {
  const authorizationUrl = requiredEnv("OAUTH_AUTHORIZATION_URL");
  const tokenUrl = requiredEnv("OAUTH_TOKEN_URL");
  const clientId = requiredEnv("OAUTH_CLIENT_ID");
  requiredEnv("OAUTH_CLIENT_SECRET");

  return new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl,
      tokenUrl,
      revocationUrl: process.env.OAUTH_REVOCATION_URL,
    },

    verifyAccessToken: async (token: string): Promise<AuthInfo> => {
      const res = await fetch(requiredEnv("OAUTH_USERINFO_URL"), {
        headers: { Authorization: \`Bearer \${token}\` },
      });

      if (!res.ok) {
        throw new Error("Invalid or expired access token");
      }

      return {
        token,
        clientId,
        scopes: (process.env.OAUTH_SCOPES ?? "").split(",").filter(Boolean),
      };
    },

    getClient: async (id: string): Promise<OAuthClientInformationFull | undefined> => {
      return clients.get(id);
    },
  });
}
`;

export const httpTransportTs = `import express from "express";
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

  const issuerUrl = new URL(process.env.OAUTH_ISSUER_URL ?? \`http://localhost:\${port}\`);

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
    console.log(\`MCP HTTP server listening on port \${port}\`);
    console.log(\`OAuth authorization: \${issuerUrl.href}authorize\`);
    console.log(\`MCP endpoint:        \${issuerUrl.href}mcp\`);
  });
}
`;

export const sseTransportTs = [
  'import express from "express";',
  'import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";',
  'import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";',
  'import { getApiConfig } from "../auth.js";',
  'import type { ApiConfig } from "../types.js";',
  "",
  "export async function startSse(",
  "  createServer: (getConfig: () => ApiConfig) => McpServer,",
  ") {",
  "  const port = Number(process.env.PORT ?? 3000);",
  "  const config = getApiConfig();",
  "",
  "  const app = express();",
  "",
  "  const sessions = new Map<string, SSEServerTransport>();",
  "",
  '  app.get("/sse", async (req, res) => {',
  '    const transport = new SSEServerTransport("/messages", res);',
  "    sessions.set(transport.sessionId, transport);",
  "",
  "    const server = createServer(() => config);",
  "    await server.connect(transport);",
  "",
  "    transport.onclose = () => {",
  "      sessions.delete(transport.sessionId);",
  "    };",
  "  });",
  "",
  '  app.post("/messages", async (req, res) => {',
  "    const sessionId = req.query.sessionId as string;",
  "    const transport = sessions.get(sessionId);",
  "",
  "    if (!transport) {",
  '      res.status(400).json({ error: "No active session." });',
  "      return;",
  "    }",
  "",
  "    await transport.handlePostMessage(req, res);",
  "  });",
  "",
  "  app.listen(port, () => {",
  "    console.log(`MCP SSE server listening on port ${port}`);",
  "    console.log(`SSE endpoint: http://localhost:${port}/sse`);",
  "  });",
  "}",
].join("\n") + "\n";

// ── Dynamic files (generated per-spec) ──────────────────

export function toolFile(tool: ParsedTool): string {
  // Deduplicate: path/query params take precedence over body params with the same name
  const seen = new Set(tool.params.map((p) => safeName(p.name)));
  const dedupedBodyParams = tool.bodyParams.filter((p) => !seen.has(safeName(p.name)));
  const allParams = [...tool.params, ...dedupedBodyParams];

  const schemaFields = allParams
    .map((p) => {
      const base = `${p.zodType}.describe("${escapeStr(p.description)}")`;
      return `  ${safeName(p.name)}: ${p.required ? base : `${base}.optional()`},`;
    })
    .join("\n");

  const argsType = allParams
    .map((p) => `${safeName(p.name)}${p.required ? "" : "?"}: ${zodToTsType(p.zodType)}`)
    .join("; ");

  const pathExpr = buildPathExpr(tool.path, tool.params);
  const queryParams = tool.params.filter((p) => p.location === "query");
  const bodyFields = dedupedBodyParams;

  let handlerBody = "";

  // Query params
  if (queryParams.length > 0) {
    handlerBody += `  const searchParams = new URLSearchParams();\n`;
    for (const q of queryParams) {
      if (q.required) {
        handlerBody += `  searchParams.set("${q.name}", String(args.${safeName(q.name)}));\n`;
      } else {
        handlerBody += `  if (args.${safeName(q.name)} !== undefined) searchParams.set("${q.name}", String(args.${safeName(q.name)}));\n`;
      }
    }
    handlerBody += `\n  const data = await apiRequest<Record<string, unknown>>(config, \`${pathExpr}?\${searchParams.toString()}\``;
  } else {
    handlerBody += `  const data = await apiRequest<Record<string, unknown>>(config, \`${pathExpr}\``;
  }

  // Request options
  if (tool.method !== "GET") {
    const bodyObj =
      bodyFields.length > 0
        ? `{ ${bodyFields.map((f) => safeName(f.name)).join(", ")} }`
        : "{}";
    const destructure =
      bodyFields.length > 0
        ? `\n  const { ${bodyFields.map((f) => safeName(f.name)).join(", ")} } = args;\n`
        : "";
    handlerBody = destructure + handlerBody;
    handlerBody += `, {\n    method: "${tool.method}",\n    body: JSON.stringify(${bodyObj}),\n  });\n`;
  } else {
    handlerBody += `);\n`;
  }

  handlerBody += `\n  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };`;

  return `import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
${schemaFields}
};

export const name = "${tool.name}";
export const description = "${escapeStr(tool.description)}";

export async function handler(
  args: { ${argsType} },
  config: ApiConfig,
) {
${handlerBody}
}
`;
}

export function indexTs(tools: ParsedTool[], serverName: string): string {
  const imports = tools
    .map((t) => `import * as ${camelName(t.name)} from "./tools/${t.name}.js";`)
    .join("\n");

  const registrations = tools
    .map(
      (t) => `  server.registerTool(${camelName(t.name)}.name, {
    description: ${camelName(t.name)}.description,
    inputSchema: ${camelName(t.name)}.params,
  }, async (args) => ${camelName(t.name)}.handler(args, getConfig()));`,
    )
    .join("\n\n");

  return `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiConfig } from "./auth.js";
import type { ApiConfig } from "./types.js";

${imports}

function createServer(getConfig: () => ApiConfig): McpServer {
  const server = new McpServer({
    name: "${escapeStr(serverName)}",
    version: "1.0.0",
  });

${registrations}

  return server;
}

async function main() {
  const mode = process.argv.includes("--http") ? "http"
    : process.argv.includes("--sse") ? "sse"
    : "stdio";

  if (mode === "http") {
    const { startHttp } = await import("./transports/http.js");
    await startHttp(createServer);
  } else if (mode === "sse") {
    const { startSse } = await import("./transports/sse.js");
    await startSse(createServer);
  } else {
    const config = getApiConfig();
    const server = createServer(() => config);
    const { startStdio } = await import("./transports/stdio.js");
    await startStdio(server);
  }
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
`;
}

export function readme(serverName: string, baseUrl: string, toolCount: number): string {
  return `# ${serverName} MCP Server

Auto-generated MCP server with ${toolCount} tools. Built from an OpenAPI spec using [@softwaresavants/openapi-to-mcp](https://github.com/SoftwareSavants/openapi-to-mcp).

## Quick Start

\`\`\`bash
npm install
cp .env.example .env   # fill in your API key
npm run build
npm start
\`\`\`

Claude Desktop config (\`~/Library/Application\\ Support/Claude/claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "${serverName}": {
      "command": "node",
      "args": [
        "--env-file=path/to/${serverName}-mcp/.env",
        "path/to/${serverName}-mcp/dist/index.js"
      ]
    }
  }
}
\`\`\`

## Tools

| Tool | Method | Path | Description |
|------|--------|------|-------------|

## HTTP + OAuth Mode

\`\`\`bash
# Fill in OAuth env vars in .env, then:
npm run start:http
\`\`\`

## License

MIT — generated by [Software Savants](https://www.software-savants.com/en/mcp-development)
`;
}

// ── String helpers ──────────────────────────────────────

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function safeName(s: string): string {
  // Convert param names like "user-id" or "user.name" to valid JS identifiers
  return s.replace(/[-.\s]/g, "_");
}

function camelName(snakeName: string): string {
  return snakeName.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function buildPathExpr(path: string, params: ParsedParam[]): string {
  // Convert /users/{id}/posts to /users/${args.id}/posts
  return path.replace(/\{(\w+)\}/g, (_, name) => `\${args.${safeName(name)}}`);
}

function zodToTsType(zodType: string): string {
  if (zodType.startsWith("z.enum(")) {
    // z.enum(["a", "b"]) → "a" | "b"
    const inner = zodType.match(/z\.enum\(\[(.+)\]\)/)?.[1] ?? "";
    return inner.split(", ").join(" | ");
  }
  if (zodType === "z.number()") return "number";
  if (zodType === "z.boolean()") return "boolean";
  if (zodType.startsWith("z.array(")) return `${zodToTsType(zodType.slice(8, -1))}[]`;
  return "string";
}
