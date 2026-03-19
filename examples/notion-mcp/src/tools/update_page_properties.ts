import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  properties: z.string().describe("properties").optional(),
};

export const name = "update_page_properties";
export const description = "Update Page properties ";

export async function handler(
  args: { id: string; properties?: string },
  config: ApiConfig,
) {

  const { properties } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/pages/${args.id}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
