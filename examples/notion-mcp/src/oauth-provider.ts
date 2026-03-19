import { ProxyOAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required for OAuth mode`);
  return value;
}

const clients = new Map<string, OAuthClientInformationFull>();

export function createOAuthProvider() {
  const authorizationUrl = requiredEnv("OAUTH_AUTHORIZATION_URL");
  const tokenUrl = requiredEnv("OAUTH_TOKEN_URL");
  const clientId = requiredEnv("OAUTH_CLIENT_ID");
  requiredEnv("OAUTH_CLIENT_SECRET");

  return new ProxyOAuthServerProvider({
    endpoints: {
      authorizationUrl,
      tokenUrl,
      revocationUrl: process.env.OAUTH_REVOCATION_URL,
    },

    verifyAccessToken: async (token: string): Promise<AuthInfo> => {
      const res = await fetch(requiredEnv("OAUTH_USERINFO_URL"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Invalid or expired access token");
      }

      return {
        token,
        clientId,
        scopes: (process.env.OAUTH_SCOPES ?? "").split(",").filter(Boolean),
      };
    },

    getClient: async (id: string): Promise<OAuthClientInformationFull | undefined> => {
      return clients.get(id);
    },
  });
}
