import { Router } from "express";

import { SpotifyOAuthService } from "../api.js";
import { OauthStateStore } from "../state/oauth-state-store.js";
import { createPkcePair, generateState } from "../utils/pkce.js";

interface LoginRouteOptions {
  spotifyAuth: SpotifyOAuthService;
  stateStore: OauthStateStore;
}

export function loginRoute({ spotifyAuth, stateStore }: LoginRouteOptions) {
  const router = Router();

  router.get("/login", async (_req, res) => {
    const { verifier, challenge } = createPkcePair();
    const state = generateState();

    stateStore.save(state, verifier);

    try {
      const authorizationUrl = await spotifyAuth.createAuthorizationUrl(
        state,
        challenge
      );

      res.redirect(authorizationUrl);
    } catch (error) {
      console.error(error);
      stateStore.consume(state);
      res.status(500).json({ error: "Failed to create authorization URL" });
    }
  });

  return router;
}
