#!/usr/bin/env node

import { resolve } from "node:path";
import { loadSpec, parseSpec } from "./parser.js";
import { generate } from "./generator.js";

// ── CLI ─────────────────────────────────────────────────

const args = process.argv.slice(2);

function usage(): never {
  console.log(`
  openapi-to-mcp — Generate a lean MCP server from an OpenAPI spec

  Usage:
    openapi-to-mcp <spec> [options]

  Arguments:
    spec              OpenAPI spec file path or URL (JSON or YAML)

  Options:
    -o, --output      Output directory (default: ./<server-name>-mcp)
    -n, --name        Server name (default: from spec info.title)
    -h, --help        Show this help

  Examples:
    openapi-to-mcp https://petstore3.swagger.io/api/v3/openapi.json
    openapi-to-mcp ./api-spec.yaml -o ./my-mcp-server
    openapi-to-mcp spec.json --name my-product
`);
  process.exit(0);
}

function getFlag(flag: string, alias?: string): string | undefined {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag || (alias && args[i] === alias)) {
      return args[i + 1];
    }
  }
  return undefined;
}

if (args.includes("-h") || args.includes("--help") || args.length === 0) {
  usage();
}

const specSource = args.find((a) => !a.startsWith("-") && args.indexOf(a) === 0) ?? args[0];
if (!specSource || specSource.startsWith("-")) {
  console.error("Error: spec file or URL is required\n");
  usage();
}

async function main() {
  console.log(`Loading spec from ${specSource}...`);
  const spec = await loadSpec(specSource);
  const parsed = parseSpec(spec);

  const serverName = getFlag("--name", "-n") ?? toSlug(parsed.title);
  const outputDir = resolve(getFlag("--output", "-o") ?? `./${serverName}-mcp`);

  console.log(`Generating MCP server "${serverName}" with ${parsed.tools.length} tools...`);

  if (parsed.tools.length === 0) {
    console.error("Warning: No operations found in the spec. Check that your spec has paths defined.");
  }

  // Cap at 20 tools — lean by design
  if (parsed.tools.length > 20) {
    console.log(`Note: Found ${parsed.tools.length} operations. Consider keeping only the most useful tools (5-10 is ideal).`);
  }

  const files = await generate({
    outputDir,
    serverName,
    baseUrl: parsed.baseUrl,
    tools: parsed.tools,
  });

  console.log(`\nGenerated ${files.length} files in ${outputDir}/\n`);
  console.log("Next steps:");
  console.log(`  cd ${outputDir}`);
  console.log("  npm install");
  console.log("  cp .env.example .env   # fill in your API key");
  console.log("  npm run build");
  console.log("  npm start");
  console.log();
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
