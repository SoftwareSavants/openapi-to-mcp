import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {

};

export const name = "get_inventory";
export const description = "Returns pet inventories by status.";

export async function handler(
  args: {  },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/store/inventory`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
