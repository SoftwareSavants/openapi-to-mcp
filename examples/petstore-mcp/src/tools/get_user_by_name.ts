import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  username: z.string().describe("The name that needs to be fetched. Use user1 for testing"),
};

export const name = "get_user_by_name";
export const description = "Get user by user name.";

export async function handler(
  args: { username: string },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/user/${args.username}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
