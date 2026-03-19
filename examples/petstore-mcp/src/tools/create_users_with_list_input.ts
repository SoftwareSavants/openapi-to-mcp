import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {

};

export const name = "create_users_with_list_input";
export const description = "Creates list of users with given input array.";

export async function handler(
  args: {  },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/user/createWithList`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
