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

export type SpotifyClientView = Pick<
  SpotifyOAuthConfig,
  "clientId" | "redirectUri" | "scopes"
>;

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

export class SpotifyOAuthService {
  public constructor(private readonly config: SpotifyOAuthConfig) {}

  public get clientView(): SpotifyClientView {
    const { clientId, redirectUri, scopes } = this.config;
    return { clientId, redirectUri, scopes };
  }

  public async createAuthorizationUrl(
    state: string,
    codeChallenge: string
  ): Promise<string> {
    const strategy = this.createStrategy();
    const authorizeUrl = await strategy.buildAuthorizationUrl(codeChallenge);

    const url = new URL(authorizeUrl);
    url.searchParams.set("state", state);
    return url.toString();
  }

  public exchangeCodeForToken(code: string, verifier: string): Promise<AccessToken> {
    return this.createStrategy().exchangeAuthorizationCode(code, verifier);
  }

  public createApiClient(token: AccessToken): SpotifyApi {
    return SpotifyApi.withAccessToken(this.config.clientId, token);
  }

  private createStrategy(): ServerAuthorizationCodeWithPKCEStrategy {
    return new ServerAuthorizationCodeWithPKCEStrategy(
      this.config.clientId,
      this.config.redirectUri,
      this.config.scopes
    );
  }
}

export function createSpotifyApi(
  config: SpotifyOAuthConfig,
  token: AccessToken
): SpotifyApi {
  return SpotifyApi.withAccessToken(config.clientId, token);
}

export async function createAuthorizationUrl(
  config: SpotifyOAuthConfig,
  state: string,
  codeChallenge: string
): Promise<string> {
  return new SpotifyOAuthService(config).createAuthorizationUrl(state, codeChallenge);
}

export function exchangeCodeForToken(
  config: SpotifyOAuthConfig,
  code: string,
  verifier: string
): Promise<AccessToken> {
  return new SpotifyOAuthService(config).exchangeCodeForToken(code, verifier);
}
