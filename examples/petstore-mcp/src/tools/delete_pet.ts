import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  petId: z.number().describe("Pet id to delete"),
};

export const name = "delete_pet";
export const description = "Deletes a pet.";

export async function handler(
  args: { petId: number },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/pet/${args.petId}`, {
    method: "DELETE",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
