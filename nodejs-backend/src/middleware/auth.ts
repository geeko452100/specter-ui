import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

type Bindings = { API_TOKEN: string };

/**
 * Bearer-token check for the private board — this API has exactly one
 * consumer (me), so a full auth system would be solving a problem that
 * doesn't exist here. Uses a length-blinded constant-time comparison so a
 * mismatched token doesn't leak timing information about how many leading
 * bytes matched. Requires the `nodejs_compat` flag (see wrangler.jsonc) for
 * node:crypto.
 */
export const requireAuth: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const [scheme, token] = (c.req.header("authorization") ?? "").split(" ");

  if (scheme !== "Bearer" || !token || !safeEqual(token, c.env.API_TOKEN)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};

function safeEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}
