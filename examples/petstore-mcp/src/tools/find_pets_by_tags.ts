import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  tags: z.array(z.string()).describe("Tags to filter by"),
};

export const name = "find_pets_by_tags";
export const description = "Finds Pets by tags.";

export async function handler(
  args: { tags: string[] },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("tags", String(args.tags));

  const data = await apiRequest<Record<string, unknown>>(config, `/pet/findByTags?${searchParams.toString()}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
