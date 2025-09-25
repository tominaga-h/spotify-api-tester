import express from "express";

import { SpotifyOAuthService } from "./api.js";
import {
  port,
  publicSpotifyClientConfig,
  spotifyOAuthConfig,
} from "./config.js";
import { callbackRoute } from "./routes/callback.js";
import { clientRoute } from "./routes/client.js";
import { homeRoute } from "./routes/home.js";
import { loginRoute } from "./routes/login.js";
import { OauthStateStore } from "./state/oauth-state-store.js";

const app = express();

const spotifyAuth = new SpotifyOAuthService(spotifyOAuthConfig);
const stateStore = new OauthStateStore();

app.use(clientRoute());
app.use(homeRoute({ clientConfig: publicSpotifyClientConfig }));
app.use(loginRoute({ spotifyAuth, stateStore }));
app.use(callbackRoute({ spotifyAuth, stateStore }));

app.listen(port, () => {
  console.log(`Spotify OAuth server listening on http://localhost:${port}`);
  console.log(`Using redirect URI: ${publicSpotifyClientConfig.redirectUri}`);
  console.log(
    "Make sure this redirect URI is added to your Spotify developer app at https://developer.spotify.com/dashboard/applications."
  );
});
