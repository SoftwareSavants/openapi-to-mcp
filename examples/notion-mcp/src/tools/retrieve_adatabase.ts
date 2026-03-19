import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
};

export const name = "retrieve_adatabase";
export const description = "Retrieve a database";

export async function handler(
  args: { id: string },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/databases/${args.id}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
