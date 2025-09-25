import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { SpotifyAuthProvider } from "./context/SpotifyAuthContext.js";
import { getSpotifyConfig } from "./config.js";
import { CallbackPage } from "./pages/CallbackPage.js";
import { HomePage } from "./pages/HomePage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { TrackPage } from "./pages/TrackPage.js";

export function App() {
  const [{ config, error: configError }] = useState(() => {
    try {
      return { config: getSpotifyConfig(), error: null } as const;
    } catch (error) {
      return { config: null, error: error as Error } as const;
    }
  });

  if (configError) {
    return (
      <main className="container">
        <h1>Spotify OAuth React Demo</h1>
        <p className="error">{configError.message}</p>
        <p>
          Provide <code>VITE_SPOTIFY_CLIENT_ID</code> in your environment configuration.
        </p>
      </main>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <BrowserRouter>
      <SpotifyAuthProvider config={config}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SpotifyAuthProvider>
    </BrowserRouter>
  );
}

export default App;
