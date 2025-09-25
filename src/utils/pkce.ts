import crypto from "node:crypto";

export interface PkcePair {
  verifier: string;
  challenge: string;
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/=+$/u, "")
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_");
}

export function generateState(length = 16): string {
  return crypto.randomBytes(length).toString("hex");
}

export function createPkcePair(): PkcePair {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const digest = crypto.createHash("sha256").update(verifier).digest();
  const challenge = base64UrlEncode(digest);

  return { verifier, challenge };
}
