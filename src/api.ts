import {
  AuthorizationCodeWithPKCEStrategy,
  SpotifyApi,
  type AccessToken,
} from "@spotify/web-api-ts-sdk";

export interface SpotifyOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

class ServerAuthorizationCodeWithPKCEStrategy extends AuthorizationCodeWithPKCEStrategy {
  public async buildAuthorizationUrl(codeChallenge: string): Promise<string> {
    return this.generateRedirectUrlForUser(this.scopes, codeChallenge);
  }

  public async exchangeAuthorizationCode(
    code: string,
    verifier: string
  ): Promise<AccessToken> {
    return this.exchangeCodeForToken(code, verifier);
  }
}

function createAuthStrategy(config: SpotifyOAuthConfig) {
  return new ServerAuthorizationCodeWithPKCEStrategy(
    config.clientId,
    config.redirectUri,
    config.scopes
  );
}

export async function createAuthorizationUrl(
  config: SpotifyOAuthConfig,
  state: string,
  codeChallenge: string
): Promise<string> {
  const strategy = createAuthStrategy(config);
  const baseUrl = await strategy.buildAuthorizationUrl(codeChallenge);

  const url = new URL(baseUrl);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(
  config: SpotifyOAuthConfig,
  code: string,
  codeVerifier: string
): Promise<AccessToken> {
  const strategy = createAuthStrategy(config);
  return strategy.exchangeAuthorizationCode(code, codeVerifier);
}

export function createSpotifyApi(
  config: SpotifyOAuthConfig,
  token: AccessToken
): SpotifyApi {
  return SpotifyApi.withAccessToken(config.clientId, token);
}
