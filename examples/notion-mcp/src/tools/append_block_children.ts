import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.string().describe("id"),
  children: z.array(z.string()).describe("children").optional(),
};

export const name = "append_block_children";
export const description = "Append block children";

export async function handler(
  args: { id: string; children?: string[] },
  config: ApiConfig,
) {

  const { children } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/blocks/${args.id}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
