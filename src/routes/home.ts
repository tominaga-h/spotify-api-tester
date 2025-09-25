import { Router } from "express";

import type { SpotifyClientView } from "../api.js";

interface HomeRouteOptions {
  clientConfig: SpotifyClientView;
}

export function homeRoute({ clientConfig }: HomeRouteOptions) {
  const router = Router();

  router.get("/", (_req, res) => {
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Spotify OAuth Demo</title>
    <style>
      body { font-family: sans-serif; margin: 2rem; }
      pre { background: #f4f4f4; padding: 1rem; border-radius: 0.5rem; }
    </style>
  </head>
  <body>
    <h1>Spotify OAuth Demo</h1>
    <p><a id="login-link" href="/login">Log in with Spotify</a></p>
    <section>
      <h2>Status</h2>
      <div id="status">Checking localStorage for token…</div>
    </section>
    <section>
      <h2>Current User Profile</h2>
      <pre id="profile">Sign in to load profile information.</pre>
    </section>
    <script type="module">
      import { createSpotifyApi } from "/client/createSpotifyApi.js";

      const config = ${JSON.stringify(clientConfig)};
      const statusEl = document.getElementById("status");
      const profileEl = document.getElementById("profile");
      const loginLink = document.getElementById("login-link");

      const storedToken = localStorage.getItem("spotify-token");

      if (!storedToken) {
        statusEl.textContent = "No token found. Use the login link above.";
        profileEl.textContent = "Sign in to load profile information.";
        return;
      }

      try {
        const token = JSON.parse(storedToken);
        statusEl.textContent = "Token found. Initializing Spotify SDK…";

        const spotify = createSpotifyApi(config, token);
        const profile = await spotify.currentUser.profile();

        statusEl.textContent = "Authenticated using stored token.";
        profileEl.textContent = JSON.stringify(profile, null, 2);
        loginLink.textContent = "Re-authenticate with Spotify";
      } catch (error) {
        console.error(error);
        statusEl.textContent = "Stored token is invalid or expired. Please log in again.";
        profileEl.textContent = "Sign in to load profile information.";
        localStorage.removeItem("spotify-token");
      }
    </script>
  </body>
</html>`;

    res.type("html").send(html);
  });

  return router;
}
