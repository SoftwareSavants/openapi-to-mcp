import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  paragraph: z.string().describe("paragraph").optional(),
};

export const name = "update_ablock";
export const description = "Update a block";

export async function handler(
  args: { id: string; paragraph?: string },
  config: ApiConfig,
) {

  const { paragraph } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/blocks/${args.id}`, {
    method: "PATCH",
    body: JSON.stringify({ paragraph }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
