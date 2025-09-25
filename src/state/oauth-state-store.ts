export interface OauthStateEntry {
  verifier: string;
  createdAt: number;
}

export class OauthStateStore {
  private readonly store = new Map<string, OauthStateEntry>();

  public constructor(private readonly ttlMs: number = 5 * 60 * 1000) {}

  public save(state: string, verifier: string, now: number = Date.now()): void {
    this.prune(now);
    this.store.set(state, { verifier, createdAt: now });
  }

  public consume(state: string, now: number = Date.now()): OauthStateEntry | null {
    this.prune(now);
    const entry = this.store.get(state) ?? null;

    if (entry) {
      this.store.delete(state);
    }

    return entry;
  }

  public prune(now: number = Date.now()): void {
    for (const [state, entry] of this.store.entries()) {
      if (now - entry.createdAt > this.ttlMs) {
        this.store.delete(state);
      }
    }
  }
}
