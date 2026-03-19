import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  page_id: z.string().describe("page_id"),
  property_id: z.string().describe("property_id"),
};

export const name = "retrieve_apage_property_item";
export const description = "Retrieve a Page Property Item";

export async function handler(
  args: { page_id: string; property_id: string },
  config: ApiConfig,
) {
  const data = await apiRequest<Record<string, unknown>>(config, `/v1/pages/${args.page_id}/properties/${args.property_id}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
