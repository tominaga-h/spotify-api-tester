import express from "express";
import crypto from "node:crypto";
import { config as loadEnv } from "dotenv";

import {
  createAuthorizationUrl,
  exchangeCodeForToken,
  createSpotifyApi,
  type SpotifyOAuthConfig,
} from "./api.js";

loadEnv({ path: ".env", quiet: true });

const requiredEnvVars = ["SPOTIFY_API_CLIENT_ID", "SPOTIFY_API_CLIENT_SECRET"];
const missingEnv = requiredEnvVars.filter((variable) => !process.env[variable]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const port = Number(process.env.PORT ?? 3000);
const redirectUri =
  process.env.SPOTIFY_API_REDIRECT_URI ?? `http://localhost:${port}/callback`;
const scopes = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-top-read',
  'user-read-recently-played',
];

const spotifyConfig: SpotifyOAuthConfig = {
  clientId: process.env.SPOTIFY_API_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_API_CLIENT_SECRET!,
  redirectUri,
  scopes: scopes.map((scope) => scope.trim()).filter(Boolean),
};

const app = express();

type StateEntry = {
  verifier: string;
  createdAt: number;
};

const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 5 * 60 * 1000;

function purgeExpiredStates(now: number = Date.now()) {
  for (const [state, entry] of stateStore.entries()) {
    if (now - entry.createdAt > STATE_TTL_MS) {
      stateStore.delete(state);
    }
  }
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/=+$/u, "")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_");
}

function createPkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const challenge = base64UrlEncode(
    crypto.createHash("sha256").update(verifier).digest()
  );

  return { verifier, challenge };
}

app.get("/", (_req, res) => {
  res.send(
    "<p>Spotify OAuth demo is running. Visit <a href=\"/login\">/login</a> to start the flow.</p>"
  );
});

app.get("/login", async (_req, res) => {
  purgeExpiredStates();

  const { verifier, challenge } = createPkcePair();
  const state = generateState();

  stateStore.set(state, { verifier, createdAt: Date.now() });

  try {
    const authorizationUrl = await createAuthorizationUrl(
      spotifyConfig,
      state,
      challenge
    );

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error(error);
    stateStore.delete(state);
    res.status(500).json({ error: "Failed to create authorization URL" });
  }
});

app.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (typeof error === "string") {
    res.status(400).json({ error });
    return;
  }

  if (typeof code !== "string" || typeof state !== "string") {
    res.status(400).json({ error: "Missing authorization code or state" });
    return;
  }

  purgeExpiredStates();
  const stateEntry = stateStore.get(state);

  if (!stateEntry) {
    res.status(400).json({ error: "Invalid or expired state" });
    return;
  }

  stateStore.delete(state);

  try {
    const token = await exchangeCodeForToken(
      spotifyConfig,
      code,
      stateEntry.verifier
    );

    const spotify = createSpotifyApi(spotifyConfig, token);
    const profile = await spotify.currentUser.profile();
    const track = await spotify.player.getCurrentlyPlayingTrack("ES");

    res.json({
      token,
      profile,
      track,
    });
  } catch (oauthError) {
    console.error(oauthError);
    res.status(500).json({
      error: "Failed to exchange authorization code",
      message: oauthError instanceof Error ? oauthError.message : String(oauthError),
    });
  }
});

app.listen(port, () => {
  console.log(`Spotify OAuth server listening on http://localhost:${port}`);
  console.log(`Using redirect URI: ${spotifyConfig.redirectUri}`);
  console.log(
    "Make sure this redirect URI is added to your Spotify developer app at https://developer.spotify.com/dashboard/applications."
  );
});
