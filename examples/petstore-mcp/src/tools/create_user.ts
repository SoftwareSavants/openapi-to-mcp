import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  id: z.number().describe("id").optional(),
  username: z.string().describe("username").optional(),
  firstName: z.string().describe("firstName").optional(),
  lastName: z.string().describe("lastName").optional(),
  email: z.string().describe("email").optional(),
  password: z.string().describe("password").optional(),
  phone: z.string().describe("phone").optional(),
  userStatus: z.number().describe("User Status").optional(),
};

export const name = "create_user";
export const description = "Create user.";

export async function handler(
  args: { id?: number; username?: string; firstName?: string; lastName?: string; email?: string; password?: string; phone?: string; userStatus?: number },
  config: ApiConfig,
) {

  const { id, username, firstName, lastName, email, password, phone, userStatus } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/user`, {
    method: "POST",
    body: JSON.stringify({ id, username, firstName, lastName, email, password, phone, userStatus }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
