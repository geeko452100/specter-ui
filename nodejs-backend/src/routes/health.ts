import { Hono } from "hono";

export const healthRoute = new Hono();

// Deliberately unauthenticated — just confirms the Worker is up, not that
// the postings data is loaded (see GET /api/postings for that).
healthRoute.get("/health", (c) => c.json({ status: "ok" }));
