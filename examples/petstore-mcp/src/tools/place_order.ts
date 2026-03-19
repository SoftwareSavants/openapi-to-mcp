import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.number().describe("id").optional(),
  petId: z.number().describe("petId").optional(),
  quantity: z.number().describe("quantity").optional(),
  shipDate: z.string().describe("shipDate").optional(),
  status: z.enum(["placed", "approved", "delivered"]).describe("Order Status").optional(),
  complete: z.boolean().describe("complete").optional(),
};

export const name = "place_order";
export const description = "Place an order for a pet.";

export async function handler(
  args: { id?: number; petId?: number; quantity?: number; shipDate?: string; status?: "placed" | "approved" | "delivered"; complete?: boolean },
  config: ApiConfig,
) {

  const { id, petId, quantity, shipDate, status, complete } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/store/order`, {
    method: "POST",
    body: JSON.stringify({ id, petId, quantity, shipDate, status, complete }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
