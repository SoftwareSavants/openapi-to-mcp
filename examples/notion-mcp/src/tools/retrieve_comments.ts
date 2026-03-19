import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  block_id: z.string().describe("block_id").optional(),
  page_size: z.string().describe("page_size").optional(),
};

export const name = "retrieve_comments";
export const description = "Retrieve comments";

export async function handler(
  args: { block_id?: string; page_size?: string },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  if (args.block_id !== undefined) searchParams.set("block_id", String(args.block_id));
  if (args.page_size !== undefined) searchParams.set("page_size", String(args.page_size));

  const data = await apiRequest<Record<string, unknown>>(config, `/v1/comments?${searchParams.toString()}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
