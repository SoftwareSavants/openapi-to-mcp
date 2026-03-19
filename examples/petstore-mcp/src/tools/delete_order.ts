import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  orderId: z.number().describe("ID of the order that needs to be deleted"),
};

export const name = "delete_order";
export const description = "Delete purchase order by identifier.";

export async function handler(
  args: { orderId: number },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/store/order/${args.orderId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
