import { Hono } from "hono";

export const healthRoute = new Hono();

// Just confirms the Worker is up, not that the postings data is loaded
// (see POST /guest/match for that).
healthRoute.get("/health", (c) => c.json({ status: "ok" }));
