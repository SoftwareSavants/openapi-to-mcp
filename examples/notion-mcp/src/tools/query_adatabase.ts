import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  filter: z.string().describe("filter").optional(),
};

export const name = "query_adatabase";
export const description = "Query a database";

export async function handler(
  args: { id: string; filter?: string },
  config: ApiConfig,
) {

  const { filter } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/databases/${args.id}/query`, {
    method: "POST",
    body: JSON.stringify({ filter }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
