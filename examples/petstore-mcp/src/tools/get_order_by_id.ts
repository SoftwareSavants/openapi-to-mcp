import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  orderId: z.number().describe("ID of order that needs to be fetched"),
};

export const name = "get_order_by_id";
export const description = "Find purchase order by ID.";

export async function handler(
  args: { orderId: number },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/store/order/${args.orderId}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
