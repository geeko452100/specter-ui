import { Router } from "express";

export const healthRouter = Router();

// Deliberately unauthenticated — just confirms the process is up, not that
// the postings data is loaded (see GET /api/postings for that).
healthRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
