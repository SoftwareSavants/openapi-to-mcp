# openapi-to-mcp

Generate a lean MCP server from any OpenAPI spec. One command — give it a spec URL or file, get a complete TypeScript MCP server with tools for every API endpoint.

<!-- TODO: Record terminal GIF and replace this section
     Run: npx @softwaresavants/openapi-to-mcp https://petstore3.swagger.io/api/v3/openapi.json
     Tool: https://github.com/faressoft/terminalizer or asciinema
-->

## Quick Start

```bash
npx @softwaresavants/openapi-to-mcp https://petstore3.swagger.io/api/v3/openapi.json
```

That's it. You now have a working MCP server in `./swagger-petstore-openapi-3-0-mcp/`.

```bash
cd swagger-petstore-openapi-3-0-mcp
npm install
cp .env.example .env   # fill in your API key
npm run build
npm start
```

## Usage

```bash
# From a URL
openapi-to-mcp https://api.example.com/openapi.json

# From a local file (JSON or YAML)
openapi-to-mcp ./api-spec.yaml

# Custom output directory and name
openapi-to-mcp spec.json -o ./my-mcp-server --name my-product

# Only include specific endpoints
openapi-to-mcp spec.json --include "/pets/**" "/users/**"

# Exclude endpoints
openapi-to-mcp spec.json --exclude "/admin/**" "/internal/**"

# Overwrite existing output
openapi-to-mcp spec.json -o ./existing-dir --force
```

## Programmatic API

Use as a library in your own tools:

```typescript
import { generateMcpServer } from "@softwaresavants/openapi-to-mcp";

// Parse only (no file output)
const { spec } = await generateMcpServer("https://api.example.com/openapi.json");
console.log(`Found ${spec.tools.length} tools`);

// Parse + generate
const { files } = await generateMcpServer("https://api.example.com/openapi.json", {
  outputDir: "./my-mcp-server",
  name: "my-product",
  include: ["/pets/**"],
});
```

## What It Generates

A complete MCP server project based on the [mcp-starter](https://github.com/SoftwareSavants/mcp-starter) template:

```
my-product-mcp/
├── package.json
├── tsconfig.json
├── .env.example          # Pre-filled with your API's base URL
├── .gitignore
├── README.md
└── src/
    ├── index.ts           # Server entry — all tools registered
    ├── auth.ts            # API key + OAuth token auth
    ├── types.ts           # ApiConfig type
    ├── oauth-provider.ts  # Proxy OAuth provider
    ├── transports/
    │   ├── stdio.ts       # Stdio transport (default)
    │   ├── http.ts        # HTTP + OAuth transport
    │   └── sse.ts         # SSE transport (dev/testing)
    └── tools/
        ├── list_pets.ts   # One file per API operation
        ├── get_pet.ts
        └── ...
```

## Three Transport Modes

Generated servers support all three transport modes out of the box:

```bash
npm start          # Stdio — API key auth (default, for Claude Desktop)
npm run start:http # HTTP — OAuth 2.1 (production, multi-user)
npm run start:sse  # SSE — API key auth (dev/testing, browser clients)
```

## Design Philosophy

This tool generates MCP servers that are **lean by design**:

- **Token-efficient descriptions.** Tool descriptions are capped at 80 characters. Every character in a tool description costs tokens on every LLM request — bloated descriptions waste money and context window.
- **One tool per operation.** Each API endpoint becomes exactly one MCP tool with a clean Zod schema. No god-tools, no mega-handlers.
- **Working OAuth out of the box.** The generated HTTP transport uses `ProxyOAuthServerProvider` from the MCP SDK — real OAuth 2.1 with PKCE, not placeholder code.
- **Claude Desktop compatible.** Tool names are auto-truncated to 64 characters with collision detection. Generated servers work with Claude Desktop without manual fixes.
- **Full `$ref` dereferencing.** Uses `@apidevtools/swagger-parser` to resolve all `$ref` references, including deeply nested and cross-file references. No "missing schema" surprises.
- **Filter, don't bloat.** Use `--include`/`--exclude` to generate only the tools that matter. 5-10 tools is ideal — fewer tools means the LLM picks the right one every time.

## Examples

Check the [`examples/`](./examples) directory for complete generated servers you can browse:

| Example | Source Spec | Tools | Description |
|---------|------------|-------|-------------|
| [`petstore-mcp`](./examples/petstore-mcp) | [Swagger Petstore](https://petstore3.swagger.io/api/v3/openapi.json) | 19 | Classic pet store — CRUD pets, orders, users |
| [`notion-mcp`](./examples/notion-mcp) | [Notion API](https://developers.notion.com) | 13 | Blocks, databases, pages, users |

Each example is a complete, type-checked project — browse `src/tools/` to see what the generated tool code looks like.

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output <dir>` | Output directory | `./<server-name>-mcp` |
| `-n, --name <name>` | Server name | From spec `info.title` |
| `--include <patterns...>` | Only include paths matching these globs | All paths |
| `--exclude <patterns...>` | Exclude paths matching these globs | None |
| `--force` | Overwrite existing output directory | Prompt |
| `-h, --help` | Show help | |

## Need a Production MCP Server?

This tool generates a solid starting point. For a production-grade MCP server with custom auth, permissions, and ongoing maintenance — [talk to us](https://www.software-savants.com/en/mcp-development).

**Software Savants** — the AI-native product studio. We build lean MCP servers that don't bloat the context window.

## License

MIT
