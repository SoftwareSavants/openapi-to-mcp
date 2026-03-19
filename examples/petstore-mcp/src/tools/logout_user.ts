import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {

};

export const name = "logout_user";
export const description = "Logs out current logged in user session.";

export async function handler(
  args: {  },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/user/logout`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
