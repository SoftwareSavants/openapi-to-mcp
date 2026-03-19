import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  username: z.string().describe("The user name for login").optional(),
  password: z.string().describe("The password for login in clear text").optional(),
};

export const name = "login_user";
export const description = "Logs user into the system.";

export async function handler(
  args: { username?: string; password?: string },
  config: ApiConfig,
) {
  const searchParams = new URLSearchParams();
  if (args.username !== undefined) searchParams.set("username", String(args.username));
  if (args.password !== undefined) searchParams.set("password", String(args.password));

  const data = await apiRequest<Record<string, unknown>>(config, `/user/login?${searchParams.toString()}`);

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
