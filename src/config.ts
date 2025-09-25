export interface SpotifyEnvironmentConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

function parseScopes(raw: string | undefined): string[] {
  if (!raw) {
    return [
      "user-read-email",
      "user-read-currently-playing",
      "user-read-playback-state",
    ];
  }

  return Array.from(
    new Set(
      raw
        .split(/[\s,]+/u)
        .map((scope) => scope.trim())
        .filter(Boolean)
    )
  );
}

export function getSpotifyConfig(): SpotifyEnvironmentConfig {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? "";
  const redirectUri =
    import.meta.env.VITE_SPOTIFY_REDIRECT_URI ??
    `${window.location.origin.replace(/\/$/u, "")}/callback`;
  const scopes = parseScopes(import.meta.env.VITE_SPOTIFY_SCOPES);

  if (!clientId) {
    throw new Error("VITE_SPOTIFY_CLIENT_ID is not defined");
  }

  return { clientId, redirectUri, scopes };
}
