import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  properties: z.string().describe("properties").optional(),
  title: z.array(z.string()).describe("title").optional(),
};

export const name = "update_adatabase";
export const description = "Update a database";

export async function handler(
  args: { id: string; properties?: string; title?: string[] },
  config: ApiConfig,
) {

  const { properties, title } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/databases/${args.id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties, title }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
