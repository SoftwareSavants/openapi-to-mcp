import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
};

export const name = "retrieve_auser";
export const description = "Retrieve a user";

export async function handler(
  args: { id: string },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/users/${args.id}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
