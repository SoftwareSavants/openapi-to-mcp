import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.number().describe("id").optional(),
  name: z.string().describe("name"),
  category: z.string().describe("category").optional(),
  photoUrls: z.array(z.string()).describe("photoUrls"),
  tags: z.array(z.string()).describe("tags").optional(),
  status: z.enum(["available", "pending", "sold"]).describe("pet status in the store").optional(),
};

export const name = "update_pet";
export const description = "Update an existing pet.";

export async function handler(
  args: { id?: number; name: string; category?: string; photoUrls: string[]; tags?: string[]; status?: "available" | "pending" | "sold" },
  config: ApiConfig,
) {

  const { id, name, category, photoUrls, tags, status } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/pet`, {
    method: "PUT",
    body: JSON.stringify({ id, name, category, photoUrls, tags, status }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
