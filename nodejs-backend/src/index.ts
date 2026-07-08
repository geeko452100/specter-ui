import { Hono } from "hono";
import { cors } from "hono/cors";
import { requireAuth } from "./middleware/auth.js";
import { healthRoute } from "./routes/health.js";
import { postingsRoute } from "./routes/postings.js";

type Bindings = {
  POSTINGS_BUCKET: R2Bucket;
  API_TOKEN: string;
  CORS_ORIGIN?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS is opt-in per-request (reads the binding at request time, not
// module load time) since Workers don't have a single "startup" moment to
// configure this once — unset CORS_ORIGIN just means no CORS headers.
app.use("*", async (c, next) => {
  if (c.env.CORS_ORIGIN) {
    return cors({ origin: c.env.CORS_ORIGIN })(c, next);
  }
  await next();
});

app.route("/", healthRoute);
app.use("/api/*", requireAuth);
app.route("/api", postingsRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
