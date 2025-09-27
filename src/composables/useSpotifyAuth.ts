import { computed, reactive, ref } from 'vue';
import type { SpotifyApi } from '@spotify/web-api-ts-sdk';

import { createSpotifyClient, type SpotifyClientConfig } from '@/utils/spotify';

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';

interface SpotifyAuthState {
  status: AuthStatus;
  client: SpotifyApi | null;
  error: Error | null;
}

const state = reactive<SpotifyAuthState>({
  status: 'idle',
  client: null,
  error: null,
});

const configRef = ref<SpotifyClientConfig | null>(null);
let configSignature: string | null = null;
let pendingTokenCheck = 0;

function makeSignature(config: SpotifyClientConfig) {
  return [config.clientId, config.redirectUri, config.scopes.join(' ')].join('|');
}

function resetState() {
  state.status = 'idle';
  state.client = null;
  state.error = null;
}

async function checkExistingSession(config: SpotifyClientConfig) {
  const signature = makeSignature(config);
  configSignature = signature;
  configRef.value = config;
  const requestId = ++pendingTokenCheck;
  const sdk = createSpotifyClient(config);

  try {
    const token = await sdk.getAccessToken();

    if (requestId !== pendingTokenCheck) {
      return;
    }

    if (token && (typeof token.expires !== 'number' || token.expires > Date.now())) {
      state.client = sdk;
      state.status = 'authenticated';
      state.error = null;
    } else {
      state.client = null;
      state.status = 'idle';
      state.error = null;
    }
  } catch (err) {
    if (requestId !== pendingTokenCheck) {
      return;
    }

    state.client = null;
    state.status = 'error';
    state.error = err instanceof Error ? err : new Error(String(err));
  }
}

export function initSpotifyAuth(config: SpotifyClientConfig | null) {
  if (!config) {
    configRef.value = null;
    configSignature = null;
    resetState();
    return;
  }

  const signature = makeSignature(config);

  if (signature === configSignature && state.client) {
    configRef.value = config;
    return;
  }

  resetState();
  checkExistingSession(config).catch((err) => {
    state.client = null;
    state.status = 'error';
    state.error = err instanceof Error ? err : new Error(String(err));
  });
}

export function useSpotifyAuth() {
  const status = computed(() => state.status);
  const client = computed(() => state.client);
  const error = computed(() => state.error);
  const config = computed(() => configRef.value);

  const authenticate = async () => {
    const configValue = configRef.value;

    if (!configValue) {
      return;
    }

    state.status = 'authenticating';
    state.error = null;

    const sdk = createSpotifyClient(configValue);

    try {
      const { authenticated } = await sdk.authenticate();

      if (authenticated) {
        state.client = sdk;
        state.status = 'authenticated';
        state.error = null;
      } else {
        state.client = null;
        state.status = 'idle';
      }
    } catch (err) {
      state.client = null;
      state.status = 'error';
      state.error = err instanceof Error ? err : new Error(String(err));
    }
  };

  const logOut = () => {
    if (state.client) {
      try {
        state.client.logOut();
      } catch (err) {
        console.error(err);
      }
    }

    resetState();
  };

  return {
    status,
    client,
    error,
    config,
    authenticate,
    logOut,
  };
}
