import {
  AuthorizationCodeWithPKCEStrategy,
  SpotifyApi,
} from '@spotify/web-api-ts-sdk';

export interface SpotifyClientConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export function createSpotifyClient(config: SpotifyClientConfig): SpotifyApi {
  const strategy = new AuthorizationCodeWithPKCEStrategy(
    config.clientId,
    config.redirectUri,
    config.scopes
  );

  return new SpotifyApi(strategy);
}
