import { SpotifyApi } from "@spotify/web-api-ts-sdk";

export function getSpotifyApiClient() {

  const clientId = process.env.SPOTIFY_API_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_API_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_API_CLIENT_ID or SPOTIFY_API_CLIENT_SECRET is not set");
  }

  const scopes = [
    "user-read-private",
    "user-read-email",
  ];

  return SpotifyApi.withUserAuthorization(clientId, "http://localhost/", scopes);
}
