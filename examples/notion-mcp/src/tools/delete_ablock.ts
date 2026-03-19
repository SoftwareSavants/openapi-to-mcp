import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
};

export const name = "delete_ablock";
export const description = "Delete a block";

export async function handler(
  args: { id: string },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/blocks/${args.id}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
