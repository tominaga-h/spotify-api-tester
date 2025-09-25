import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

import { createSpotifyClient, type SpotifyClientConfig } from "../api.js";

type AuthStatus = "idle" | "authenticating" | "authenticated" | "error";

interface SpotifyAuthState {
  status: AuthStatus;
  client: SpotifyApi | null;
  error: Error | null;
  authenticate: () => Promise<void>;
}

export function useSpotifyAuth(config?: SpotifyClientConfig | null): SpotifyAuthState {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [client, setClient] = useState<SpotifyApi | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const configRef = useRef<SpotifyClientConfig | null>(config ?? null);

  useEffect(() => {
    configRef.current = config ?? null;
  }, [config]);

  const configSignature = useMemo(() => {
    if (!config) {
      return null;
    }

    return [config.clientId, config.redirectUri, config.scopes.join(" ")].join("|");
  }, [config]);

  useEffect(() => {
    if (!configSignature || !configRef.current) {
      setClient(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const sdk = createSpotifyClient(configRef.current);

    (async () => {
      try {
        const token = await sdk.getAccessToken();

        if (cancelled) {
          return;
        }

        if (
          token &&
          (typeof token.expires !== "number" || token.expires > Date.now())
        ) {
          setClient(sdk);
          setStatus("authenticated");
          setError(null);
        } else {
          setClient(null);
          setStatus("idle");
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setClient(null);
          setError(err instanceof Error ? err : new Error(String(err)));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configSignature]);

  const authenticate = useCallback(async () => {
    if (!configRef.current) {
      return;
    }

    setStatus("authenticating");
    setError(null);

    const sdk = createSpotifyClient(configRef.current);

    try {
      const { authenticated } = await sdk.authenticate();

      if (authenticated) {
        setClient(sdk);
        setStatus("authenticated");
        setError(null);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus("error");
    }
  }, []);

  return { status, client, error, authenticate };
}
