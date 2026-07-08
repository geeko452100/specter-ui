import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

/**
 * Bearer-token check for the private board. Uses a length-blinded
 * constant-time comparison so a mismatched token doesn't leak timing
 * information about how many leading bytes matched.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.header("authorization") ?? "").split(" ");

  if (scheme !== "Bearer" || !token || !safeEqual(token, config.apiToken)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

function safeEqual(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (providedBuf.length !== expectedBuf.length) {
    // Compare against itself so the response time doesn't depend on how
    // the provided token's length differs from the real one.
    timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}
