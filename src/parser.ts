import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPI, OpenAPIV3 } from "openapi-types";

// ── Re-export types consumers might need ────────────────

export interface ParsedTool {
  name: string;
  description: string;
  method: string;
  path: string;
  params: ParsedParam[];
  hasBody: boolean;
  bodyParams: ParsedParam[];
}

export interface ParsedParam {
  name: string;
  location: "path" | "query" | "body";
  required: boolean;
  description: string;
  zodType: string;
}

export interface ParsedSpec {
  title: string;
  version: string;
  baseUrl: string;
  tools: ParsedTool[];
}

export interface FilterOptions {
  include?: string[];
  exclude?: string[];
}

// ── Spec loading (uses swagger-parser for full $ref dereferencing) ──

export async function loadSpec(source: string): Promise<OpenAPI.Document> {
  try {
    return await SwaggerParser.dereference(source);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("ENOENT") || msg.includes("no such file")) {
      throw new Error(`Could not read spec file: ${source}`);
    }
    if (msg.includes("HTTP ERROR") || msg.includes("Not Found")) {
      throw new Error(`Failed to fetch spec from URL: ${source}`);
    }

    throw new Error(`Failed to parse OpenAPI spec: ${msg}`);
  }
}

// ── Spec parsing ────────────────────────────────────────

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;
const MAX_TOOL_NAME_LENGTH = 64;

export function parseSpec(
  spec: OpenAPI.Document,
  filters?: FilterOptions,
): ParsedSpec {
  const doc = spec as OpenAPIV3.Document;
  const baseUrl = doc.servers?.[0]?.url ?? "https://api.example.com";
  const tools: ParsedTool[] = [];
  const nameCount = new Map<string, number>();

  if (!doc.paths) {
    return { title: doc.info.title, version: doc.info.version, baseUrl, tools };
  }

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    if (!pathItem) continue;

    // Apply include/exclude filters
    if (filters?.include?.length && !filters.include.some((p) => matchPath(path, p))) continue;
    if (filters?.exclude?.length && filters.exclude.some((p) => matchPath(path, p))) continue;

    const pathParams = (pathItem.parameters ?? []) as OpenAPIV3.ParameterObject[];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      let name = toolName(operation, method, path);

      // Truncate to 64 chars (Claude Desktop limit)
      if (name.length > MAX_TOOL_NAME_LENGTH) {
        const hash = simpleHash(name);
        name = name.slice(0, MAX_TOOL_NAME_LENGTH - 5) + "_" + hash;
      }

      // Detect collisions
      const count = nameCount.get(name) ?? 0;
      nameCount.set(name, count + 1);
      if (count > 0) {
        name = name.slice(0, MAX_TOOL_NAME_LENGTH - 2) + "_" + count;
      }

      const description = truncate(
        operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`,
        80,
      );

      // Merge path-level + operation-level params
      const allParams = [...pathParams, ...((operation.parameters ?? []) as OpenAPIV3.ParameterObject[])];
      const params = allParams
        .filter((p) => p.in === "path" || p.in === "query")
        .map((p) => paramToParsed(p));

      const bodyParams = extractBodyParams(operation.requestBody as OpenAPIV3.RequestBodyObject | undefined);

      tools.push({
        name,
        description,
        method: method.toUpperCase(),
        path,
        params,
        hasBody: bodyParams.length > 0,
        bodyParams,
      });
    }
  }

  return {
    title: doc.info.title,
    version: doc.info.version,
    baseUrl,
    tools,
  };
}

// ── Helpers ─────────────────────────────────────────────

function toolName(op: OpenAPIV3.OperationObject, method: string, path: string): string {
  if (op.operationId) {
    return sanitizeName(toSnakeCase(op.operationId));
  }
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[{}]/g, ""));
  return sanitizeName(toSnakeCase(`${method}_${segments.join("_")}`));
}

function sanitizeName(s: string): string {
  // Strip path traversal and non-alphanumeric chars (except underscore)
  return s.replace(/[^a-z0-9_]/g, "").replace(/^_+|_+$/g, "");
}

function toSnakeCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-.\s]+/g, "_")
    .toLowerCase()
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 4);
}

function matchPath(path: string, pattern: string): boolean {
  // Simple glob: /pets/* matches /pets/123, /pets/** matches /pets/123/toys
  const regex = pattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${regex}$`).test(path);
}

function schemaToZodType(schema: OpenAPIV3.SchemaObject | undefined): string {
  if (!schema) return "z.string()";

  if (schema.enum) {
    const values = schema.enum.map((v) => `"${v}"`).join(", ");
    return `z.enum([${values}])`;
  }

  switch (schema.type) {
    case "integer":
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      return `z.array(${schemaToZodType(schema.items as OpenAPIV3.SchemaObject)})`;
    default:
      return "z.string()";
  }
}

function paramToParsed(p: OpenAPIV3.ParameterObject): ParsedParam {
  return {
    name: p.name,
    location: p.in as "path" | "query",
    required: p.required ?? p.in === "path",
    description: truncate(p.description ?? p.name, 60),
    zodType: schemaToZodType(p.schema as OpenAPIV3.SchemaObject | undefined),
  };
}

function extractBodyParams(body: OpenAPIV3.RequestBodyObject | undefined): ParsedParam[] {
  if (!body) return [];

  const content = body.content?.["application/json"]?.schema as OpenAPIV3.SchemaObject | undefined;
  if (!content?.properties) return [];

  const required = new Set(content.required ?? []);

  return Object.entries(content.properties).map(([name, prop]) => {
    const schema = prop as OpenAPIV3.SchemaObject;
    return {
      name,
      location: "body" as const,
      required: required.has(name),
      description: truncate(schema.description ?? name, 60),
      zodType: schemaToZodType(schema),
    };
  });
}
