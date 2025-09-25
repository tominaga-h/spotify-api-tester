import { config as loadEnv } from "dotenv";

import type { SpotifyOAuthConfig } from "./api.js";

loadEnv({ path: ".env", quiet: true });

const REQUIRED_ENV_VARS = ["SPOTIFY_API_CLIENT_ID", "SPOTIFY_API_CLIENT_SECRET"] as const;

const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
}

const defaultScopes = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-playback-position",
  "user-read-recently-played",
  "user-top-read",
];

function parseScopes(value: string | undefined): string[] {
  if (!value) {
    return defaultScopes;
  }

  return Array.from(
    new Set(
      value
        .split(/[\s,]+/u)
        .map((scope) => scope.trim())
        .filter(Boolean)
    )
  );
}

const portValue = Number(process.env.PORT ?? 3000);

if (Number.isNaN(portValue)) {
  throw new Error("PORT must be a valid number");
}

export const port = portValue;

const scopes = parseScopes(process.env.SPOTIFY_API_SCOPES);

export const spotifyOAuthConfig: SpotifyOAuthConfig = {
  clientId: process.env.SPOTIFY_API_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_API_CLIENT_SECRET!,
  redirectUri:
    process.env.SPOTIFY_API_REDIRECT_URI ?? `http://localhost:${port}/callback`,
  scopes,
};

export type PublicSpotifyClientConfig = Pick<
  SpotifyOAuthConfig,
  "clientId" | "redirectUri" | "scopes"
>;

export const publicSpotifyClientConfig: PublicSpotifyClientConfig = {
  clientId: spotifyOAuthConfig.clientId,
  redirectUri: spotifyOAuthConfig.redirectUri,
  scopes: spotifyOAuthConfig.scopes,
};
