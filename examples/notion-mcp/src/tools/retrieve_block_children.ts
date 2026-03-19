import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  page_size: z.string().describe("page_size").optional(),
};

export const name = "retrieve_block_children";
export const description = "Retrieve block children";

export async function handler(
  args: { id: string; page_size?: string },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  if (args.page_size !== undefined) searchParams.set("page_size", String(args.page_size));

  const data = await apiRequest<Record<string, unknown>>(config, `/v1/blocks/${args.id}/children?${searchParams.toString()}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
