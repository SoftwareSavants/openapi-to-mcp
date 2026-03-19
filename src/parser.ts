import YAML from "yaml";

// ── OpenAPI types (minimal subset we need) ──────────────

export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string }[];
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, SchemaObject> };
}

export interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  patch?: Operation;
  delete?: Operation;
  parameters?: Parameter[];
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, unknown>;
  tags?: string[];
}

export interface Parameter {
  name: string;
  in: "query" | "path" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBody {
  required?: boolean;
  content?: Record<string, { schema?: SchemaObject }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  $ref?: string;
}

// ── Parsed tool representation ──────────────────────────

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

// ── Spec loading ────────────────────────────────────────

export async function loadSpec(source: string): Promise<OpenAPISpec> {
  let raw: string;

  if (source.startsWith("http://") || source.startsWith("https://")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`Failed to fetch spec: ${res.status} ${res.statusText}`);
    raw = await res.text();
  } else {
    const { readFile } = await import("node:fs/promises");
    raw = await readFile(source, "utf-8");
  }

  // Try JSON first, then YAML
  try {
    return JSON.parse(raw) as OpenAPISpec;
  } catch {
    return YAML.parse(raw) as OpenAPISpec;
  }
}

// ── Spec parsing ────────────────────────────────────────

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function parseSpec(spec: OpenAPISpec): {
  title: string;
  version: string;
  baseUrl: string;
  tools: ParsedTool[];
} {
  const baseUrl = spec.servers?.[0]?.url ?? "https://api.example.com";
  const tools: ParsedTool[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const pathParams = pathItem.parameters ?? [];

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const name = toolName(operation, method, path);
      const description = truncate(
        operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`,
        80,
      );

      // Merge path-level + operation-level params
      const allParams = [...pathParams, ...(operation.parameters ?? [])];
      const params = allParams
        .filter((p) => p.in === "path" || p.in === "query")
        .map((p) => paramToParsed(p, spec));

      const bodyParams = extractBodyParams(operation.requestBody, spec);

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
    title: spec.info.title,
    version: spec.info.version,
    baseUrl,
    tools,
  };
}

// ── Helpers ─────────────────────────────────────────────

function toolName(op: Operation, method: string, path: string): string {
  if (op.operationId) {
    return toSnakeCase(op.operationId);
  }
  // Fallback: method + path → "get_users_by_id"
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/[{}]/g, ""));
  return toSnakeCase(`${method}_${segments.join("_")}`);
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

function resolveRef(ref: string, spec: OpenAPISpec): SchemaObject | undefined {
  // Only handles #/components/schemas/X
  const match = ref.match(/^#\/components\/schemas\/(.+)$/);
  if (!match) return undefined;
  return spec.components?.schemas?.[match[1]];
}

function resolveSchema(schema: SchemaObject | undefined, spec: OpenAPISpec): SchemaObject | undefined {
  if (!schema) return undefined;
  if (schema.$ref) return resolveRef(schema.$ref, spec);
  return schema;
}

function schemaToZodType(schema: SchemaObject | undefined, spec: OpenAPISpec): string {
  const resolved = resolveSchema(schema, spec);
  if (!resolved) return "z.string()";

  if (resolved.enum) {
    const values = resolved.enum.map((v) => `"${v}"`).join(", ");
    return `z.enum([${values}])`;
  }

  switch (resolved.type) {
    case "integer":
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      return `z.array(${schemaToZodType(resolved.items, spec)})`;
    default:
      return "z.string()";
  }
}

function paramToParsed(p: Parameter, spec: OpenAPISpec): ParsedParam {
  return {
    name: p.name,
    location: p.in as "path" | "query",
    required: p.required ?? p.in === "path",
    description: truncate(p.description ?? p.name, 60),
    zodType: schemaToZodType(p.schema, spec),
  };
}

function extractBodyParams(body: RequestBody | undefined, spec: OpenAPISpec): ParsedParam[] {
  if (!body) return [];

  const content = body.content?.["application/json"]?.schema;
  const schema = resolveSchema(content, spec);
  if (!schema?.properties) return [];

  const required = new Set(schema.required ?? []);

  return Object.entries(schema.properties).map(([name, prop]) => ({
    name,
    location: "body" as const,
    required: required.has(name),
    description: truncate(prop.description ?? name, 60),
    zodType: schemaToZodType(prop, spec),
  }));
}
