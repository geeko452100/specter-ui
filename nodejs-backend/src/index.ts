import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { config } from "./config.js";
import { requireAuth } from "./middleware/auth.js";
import { healthRouter } from "./routes/health.js";
import { postingsRouter } from "./routes/postings.js";

const app = express();

if (config.corsOrigin) {
  app.use(cors({ origin: config.corsOrigin }));
}

app.use(healthRouter);
app.use("/api", requireAuth, postingsRouter);

// Express 5 forwards rejected promises from async handlers here
// automatically, so route handlers don't need their own try/catch.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`nodejs-backend listening on :${config.port}`);
});
