import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";

import { useSpotifyAuthContext } from "../context/SpotifyAuthContext.js";

export function LoginPage() {
  const { status, authenticate, error } = useSpotifyAuthContext();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || status === "authenticated" || status === "authenticating") {
      return;
    }

    startedRef.current = true;
    authenticate().catch((err) => {
      console.error(err);
    });
  }, [authenticate, status]);

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  if (status === "error") {
    return (
      <main className="container">
        <h1>Spotify OAuth React Demo</h1>
        <p className="error">Authentication failed.</p>
        {error ? <pre className="error">{error.message}</pre> : null}
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Redirecting to Spotify…</h1>
      <p>If you are not redirected automatically, please allow popups and try again.</p>
    </main>
  );
}
