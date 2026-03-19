import { z } from "zod";
import type { ApiConfig } from "../types.js";
import { apiRequest } from "../auth.js";

export const params = {
  username: z.string().describe("name that need to be deleted"),
  id: z.number().describe("id").optional(),
  firstName: z.string().describe("firstName").optional(),
  lastName: z.string().describe("lastName").optional(),
  email: z.string().describe("email").optional(),
  password: z.string().describe("password").optional(),
  phone: z.string().describe("phone").optional(),
  userStatus: z.number().describe("User Status").optional(),
};

export const name = "update_user";
export const description = "Update user resource.";

export async function handler(
  args: { username: string; id?: number; firstName?: string; lastName?: string; email?: string; password?: string; phone?: string; userStatus?: number },
  config: ApiConfig,
) {

  const { id, firstName, lastName, email, password, phone, userStatus } = args;
  const data = await apiRequest<Record<string, unknown>>(config, `/user/${args.username}`, {
    method: "PUT",
    body: JSON.stringify({ id, firstName, lastName, email, password, phone, userStatus }),
  });

  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}
