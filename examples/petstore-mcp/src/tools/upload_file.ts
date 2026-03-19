import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  petId: z.number().describe("ID of pet to update"),
  additionalMetadata: z.string().describe("Additional Metadata").optional(),
};

export const name = "upload_file";
export const description = "Uploads an image.";

export async function handler(
  args: { petId: number; additionalMetadata?: string },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  if (args.additionalMetadata !== undefined) searchParams.set("additionalMetadata", String(args.additionalMetadata));

  const data = await apiRequest<Record<string, unknown>>(config, `/pet/${args.petId}/uploadImage?${searchParams.toString()}`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
