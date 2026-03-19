# openapi-to-mcp

Generate a lean MCP server from any OpenAPI spec. One command — give it a spec URL or file, get a complete TypeScript MCP server with tools for every API endpoint.

## Quick Start

```bash
npx openapi-to-mcp https://petstore3.swagger.io/api/v3/openapi.json
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

# Custom output directory
openapi-to-mcp spec.json -o ./my-mcp-server

# Custom server name
openapi-to-mcp spec.json --name my-product
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
    │   └── http.ts        # HTTP + OAuth transport
    └── tools/
        ├── list_pets.ts   # One file per API operation
        ├── get_pet.ts
        └── ...
```

Each API operation becomes an MCP tool with:
- **Name** from `operationId` (or auto-generated from method + path)
- **Description** from `summary` (truncated to 80 chars — lean by design)
- **Zod schema** from parameters and request body
- **Handler** that calls the API endpoint

## Dual Transport

Generated servers support both transport modes out of the box:

```bash
npm start          # Stdio mode — API key auth (default)
npm run start:http # HTTP mode — OAuth 2.1
```

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
| `-o, --output` | Output directory | `./<server-name>-mcp` |
| `-n, --name` | Server name | From spec `info.title` |
| `-h, --help` | Show help | |

## Need a Production MCP Server?

This tool generates a solid starting point. For a production-grade MCP server with custom auth, permissions, and ongoing maintenance — [talk to us](https://www.software-savants.com/en/mcp-development).

**Software Savants** — the AI-native product studio. We build lean MCP servers that don't bloat the context window.

## License

MIT
