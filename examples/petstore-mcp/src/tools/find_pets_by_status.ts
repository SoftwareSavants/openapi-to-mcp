import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  status: z.enum(["available", "pending", "sold"]).describe("Status values that need to be considered for filter"),
};

export const name = "find_pets_by_status";
export const description = "Finds Pets by status.";

export async function handler(
  args: { status: "available" | "pending" | "sold" },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  searchParams.set("status", String(args.status));

  const data = await apiRequest<Record<string, unknown>>(config, `/pet/findByStatus?${searchParams.toString()}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
