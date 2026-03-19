#!/usr/bin/env node

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { loadSpec, parseSpec } from "./parser.js";
import { generate } from "./generator.js";

const program = new Command();

program
  .name("openapi-to-mcp")
  .description("Generate a lean MCP server from any OpenAPI spec")
  .version("1.0.0")
  .argument("<spec>", "OpenAPI spec file path or URL (JSON or YAML)")
  .option("-o, --output <dir>", "Output directory (default: ./<server-name>-mcp)")
  .option("-n, --name <name>", "Server name (default: from spec info.title)")
  .option("--include <patterns...>", "Only include paths matching these globs (e.g. /pets/*)")
  .option("--exclude <patterns...>", "Exclude paths matching these globs")
  .option("--force", "Overwrite existing output directory without prompting")
  .action(async (specSource: string, opts) => {
    console.log(`Loading spec from ${specSource}...`);
    const spec = await loadSpec(specSource);
    const parsed = parseSpec(spec, {
      include: opts.include,
      exclude: opts.exclude,
    });

    const serverName = opts.name ?? toSlug(parsed.title);
    const outputDir = resolve(opts.output ?? `./${serverName}-mcp`);

    // Check if output directory exists
    if (!opts.force && existsSync(outputDir)) {
      console.error(`Error: Output directory already exists: ${outputDir}`);
      console.error("Use --force to overwrite.");
      process.exit(1);
    }

    console.log(`Generating MCP server "${serverName}" with ${parsed.tools.length} tools...`);

    if (parsed.tools.length === 0) {
      console.error("Warning: No operations found. Check that your spec has paths defined.");
      if (opts.include) {
        console.error(`  --include filter: ${opts.include.join(", ")}`);
        console.error("  Try broader patterns or remove the filter.");
      }
    }

    if (parsed.tools.length > 20) {
      console.log(
        `Note: Found ${parsed.tools.length} operations. Use --include/--exclude to keep only the most useful tools (5-10 is ideal).`,
      );
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
  });

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

program.parseAsync().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
