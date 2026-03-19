/**
 * Programmatic API for openapi-to-mcp.
 *
 * Usage:
 *   import { generateMcpServer } from "@softwaresavants/openapi-to-mcp";
 *
 *   const result = await generateMcpServer("https://petstore3.swagger.io/api/v3/openapi.json", {
 *     outputDir: "./petstore-mcp",
 *     name: "petstore",
 *   });
 */

import { resolve } from "node:path";
import { loadSpec, parseSpec } from "./parser.js";
import { generate } from "./generator.js";
import type { ParsedSpec, ParsedTool, ParsedParam, FilterOptions } from "./parser.js";
import type { GenerateOptions } from "./generator.js";

export type { ParsedSpec, ParsedTool, ParsedParam, FilterOptions, GenerateOptions };

export interface GenerateMcpServerOptions {
  /** Output directory. If omitted, files are not written — only parsed. */
  outputDir?: string;
  /** Server name. Defaults to spec info.title slugified. */
  name?: string;
  /** Only include paths matching these globs. */
  include?: string[];
  /** Exclude paths matching these globs. */
  exclude?: string[];
}

export interface GenerateMcpServerResult {
  /** Parsed spec metadata. */
  spec: ParsedSpec;
  /** Files written (relative paths). Empty if outputDir was not provided. */
  files: string[];
}

/**
 * Parse an OpenAPI spec and optionally generate an MCP server project.
 */
export async function generateMcpServer(
  source: string,
  options: GenerateMcpServerOptions = {},
): Promise<GenerateMcpServerResult> {
  const spec = await loadSpec(source);
  const parsed = parseSpec(spec, {
    include: options.include,
    exclude: options.exclude,
  });

  if (!options.outputDir) {
    return { spec: parsed, files: [] };
  }

  const serverName = options.name ?? toSlug(parsed.title);
  const outputDir = resolve(options.outputDir);

  const files = await generate({
    outputDir,
    serverName,
    baseUrl: parsed.baseUrl,
    tools: parsed.tools,
  });

  return { spec: parsed, files };
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
