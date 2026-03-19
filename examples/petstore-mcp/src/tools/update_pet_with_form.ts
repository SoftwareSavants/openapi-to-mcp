import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  petId: z.number().describe("ID of pet that needs to be updated"),
  name: z.string().describe("Name of pet that needs to be updated").optional(),
  status: z.string().describe("Status of pet that needs to be updated").optional(),
};

export const name = "update_pet_with_form";
export const description = "Updates a pet in the store with form data.";

export async function handler(
  args: { petId: number; name?: string; status?: string },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  if (args.name !== undefined) searchParams.set("name", String(args.name));
  if (args.status !== undefined) searchParams.set("status", String(args.status));

  const data = await apiRequest<Record<string, unknown>>(config, `/pet/${args.petId}?${searchParams.toString()}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
