import { Router } from "express";

import { SpotifyOAuthService } from "../api.js";
import { OauthStateStore } from "../state/oauth-state-store.js";

interface CallbackRouteOptions {
  spotifyAuth: SpotifyOAuthService;
  stateStore: OauthStateStore;
}

export function callbackRoute({ spotifyAuth, stateStore }: CallbackRouteOptions) {
  const router = Router();

  router.get("/callback", async (req, res) => {
    const { code, state, error } = req.query;

    if (typeof error === "string") {
      res.status(400).json({ error });
      return;
    }

    if (typeof code !== "string" || typeof state !== "string") {
      res.status(400).json({ error: "Missing authorization code or state" });
      return;
    }

    const stateEntry = stateStore.consume(state);

    if (!stateEntry) {
      res.status(400).json({ error: "Invalid or expired state" });
      return;
    }

    try {
      const token = await spotifyAuth.exchangeCodeForToken(
        code,
        stateEntry.verifier
      );

      const tokenJson = JSON.stringify(token);
      const encodedToken = Buffer.from(tokenJson, "utf8").toString("base64");

      res.type("html").send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Spotify OAuth Callback</title>
  </head>
  <body>
    <p>Completing authentication…</p>
    <script>
      const tokenJson = atob('${encodedToken}');
      localStorage.setItem('spotify-token', tokenJson);
      window.location.replace('/');
    </script>
  </body>
</html>`);
    } catch (oauthError) {
      console.error(oauthError);
      res.status(500).json({
        error: "Failed to exchange authorization code",
        message:
          oauthError instanceof Error ? oauthError.message : String(oauthError),
      });
    }
  });

  return router;
}
