import type { ApiConfig } from "./types.js";

export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;

  if (!baseUrl) throw new Error("API_BASE_URL environment variable is required");
  if (!apiKey) throw new Error("API_KEY environment variable is required");

  return { baseUrl, getAuthHeader: () => `Bearer ${apiKey}` };
}

export function getApiConfigFromToken(token: string): ApiConfig {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) throw new Error("API_BASE_URL environment variable is required");

  return { baseUrl, getAuthHeader: () => `Bearer ${token}` };
}

export async function apiRequest<T>(
  config: ApiConfig,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${config.baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: config.getAuthHeader(),
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API error ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json() as Promise<T>;
}
