import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  petId: z.number().describe("ID of pet to return"),
};

export const name = "get_pet_by_id";
export const description = "Find pet by ID.";

export async function handler(
  args: { petId: number },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/pet/${args.petId}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
