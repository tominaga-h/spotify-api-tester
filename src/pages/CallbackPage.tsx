import { useEffect, useMemo } from "react";
import { Navigate } from "react-router-dom";

import { useSpotifyAuthContext } from "../context/SpotifyAuthContext.js";

export function CallbackPage() {
  const { status, error } = useSpotifyAuthContext();
  const hasCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("code");
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [status]);

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  if (!hasCode) {
    return <Navigate to="/" replace />;
  }

  if (status === "error") {
    return (
      <main className="container">
        <h1>Completing authentication failed</h1>
        {error ? <pre className="error">{error.message}</pre> : null}
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Completing authentication…</h1>
      <p>Please wait while we finalize the Spotify login.</p>
    </main>
  );
}
