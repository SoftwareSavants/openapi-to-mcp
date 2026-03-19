import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ParsedTool } from "./parser.js";
import * as T from "./templates.js";

export interface GenerateOptions {
  outputDir: string;
  serverName: string;
  baseUrl: string;
  tools: ParsedTool[];
}

export async function generate(opts: GenerateOptions) {
  const { outputDir, serverName, baseUrl, tools } = opts;

  // Create directory structure
  await mkdir(join(outputDir, "src", "tools"), { recursive: true });
  await mkdir(join(outputDir, "src", "transports"), { recursive: true });

  // Static files
  const files: [string, string][] = [
    ["package.json", T.packageJson(serverName)],
    ["tsconfig.json", T.tsconfig],
    [".gitignore", T.gitignore],
    [".env.example", T.envExample(baseUrl)],
    ["README.md", T.readme(serverName, baseUrl, tools.length)],
    ["src/types.ts", T.typesTs],
    ["src/auth.ts", T.authTs],
    ["src/transports/stdio.ts", T.stdioTs],
    ["src/transports/http.ts", T.httpTransportTs],
    ["src/oauth-provider.ts", T.oauthProviderTs],
  ];

  // Dynamic files
  files.push(["src/index.ts", T.indexTs(tools, serverName)]);

  for (const tool of tools) {
    files.push([`src/tools/${tool.name}.ts`, T.toolFile(tool)]);
  }

  // Write all files
  for (const [relPath, content] of files) {
    const fullPath = join(outputDir, relPath);
    await writeFile(fullPath, content, "utf-8");
  }

  return files.map(([p]) => p);
}
