import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import type { SpotifyClientConfig } from "../api.js";
import { useSpotifyAuth } from "../hooks/useSpotifyAuth.js";

interface SpotifyAuthContextValue {
  config: SpotifyClientConfig;
  status: ReturnType<typeof useSpotifyAuth>["status"];
  client: ReturnType<typeof useSpotifyAuth>["client"];
  error: ReturnType<typeof useSpotifyAuth>["error"];
  authenticate: ReturnType<typeof useSpotifyAuth>["authenticate"];
  logOut: ReturnType<typeof useSpotifyAuth>["logOut"];
}

const SpotifyAuthContext = createContext<SpotifyAuthContextValue | undefined>(
  undefined
);

interface SpotifyAuthProviderProps {
  config: SpotifyClientConfig;
  children: ReactNode;
}

export function SpotifyAuthProvider({
  config,
  children,
}: SpotifyAuthProviderProps) {
  const auth = useSpotifyAuth(config);

  const value = useMemo<SpotifyAuthContextValue>(
    () => ({
      config,
      status: auth.status,
      client: auth.client,
      error: auth.error,
      authenticate: auth.authenticate,
      logOut: auth.logOut,
    }),
    [auth.authenticate, auth.client, auth.error, auth.logOut, auth.status, config]
  );

  return (
    <SpotifyAuthContext.Provider value={value}>
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export function useSpotifyAuthContext() {
  const context = useContext(SpotifyAuthContext);

  if (!context) {
    throw new Error("useSpotifyAuthContext must be used within SpotifyAuthProvider");
  }

  return context;
}
