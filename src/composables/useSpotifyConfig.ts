import { ref } from 'vue';

import type { SpotifyClientConfig } from '@/utils/spotify';

interface SpotifyEnvironmentConfig extends SpotifyClientConfig {}

function parseScopes(raw: string | undefined): string[] {
  if (!raw) {
    return [
      'user-read-email',
      'user-read-currently-playing',
      'user-read-playback-state',
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

export function useSpotifyConfig() {
  const runtimeConfig = useRuntimeConfig();
  const config = ref<SpotifyEnvironmentConfig | null>(null);
  const error = ref<Error | null>(null);

  const resolveConfig = () => {
    try {
      const clientId = runtimeConfig.public.spotifyClientId ?? '';
      const redirectUri =
        runtimeConfig.public.spotifyRedirectUri ||
        (process.client ? `${window.location.origin.replace(/\/$/u, '')}/callback` : 'http://localhost:3000/callback');
      const scopes = parseScopes(runtimeConfig.public.spotifyScopes);

      if (!clientId) {
        throw new Error('NUXT_PUBLIC_SPOTIFY_CLIENT_ID is not defined');
      }

      config.value = { clientId, redirectUri, scopes };
      error.value = null;
    } catch (err) {
      config.value = null;
      error.value = err instanceof Error ? err : new Error(String(err));
    }
  };

  if (!config.value && !error.value) {
    resolveConfig();
  }

  return { config, error, resolveConfig };
}
