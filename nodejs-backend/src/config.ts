import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),

  // Shared-secret bearer token for the private board — this backend has a
  // single consumer (me), so a full auth system would be pure overhead.
  // Required at startup, same fail-fast policy python-crawler uses for its
  // contact email: a misconfigured secret should break loudly, not launch
  // silently unauthenticated.
  apiToken: required("API_TOKEN"),

  // The hand-off file python-crawler's `crawler.export` writes. Defaults
  // to the sibling directory so `npm run dev` works out of the box in this
  // monorepo layout.
  postingsJsonPath: path.resolve(
    process.cwd(),
    process.env.POSTINGS_JSON_PATH ?? "../python-crawler/data/postings.json",
  ),

  // Unset by default: CORS is off until a frontend origin actually needs
  // to call this API cross-origin.
  corsOrigin: process.env.CORS_ORIGIN,
};
