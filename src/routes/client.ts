import { Router } from "express";

export function clientRoute() {
  const router = Router();

  router.get("/client/createSpotifyApi.js", (_req, res) => {
    res
      .type("application/javascript")
      .send(
        `import { SpotifyApi } from "https://cdn.jsdelivr.net/npm/@spotify/web-api-ts-sdk@1.2.0/+esm";
export const createSpotifyApi = (config, token) => SpotifyApi.withAccessToken(config.clientId, token);
`
      );
  });

  return router;
}
