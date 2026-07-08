import { Hono } from "hono";
import { cors } from "hono/cors";
import { contactRoute } from "./routes/contact.js";
import { guestMatchRoute } from "./routes/guestMatch.js";
import { healthRoute } from "./routes/health.js";

type Bindings = {
  POSTINGS_BUCKET: R2Bucket;
  CORS_ORIGIN?: string;
  RESEND_API_KEY: string;
  CONTACT_TO_ADDRESS: string;
  CONTACT_FROM_ADDRESS: string;
  RATE_LIMIT: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS is opt-in per-request (reads the binding at request time, not
// module load time) since Workers don't have a single "startup" moment to
// configure this once — unset CORS_ORIGIN just means no CORS headers.
// Comma-separated so both specterui.dev and www.specterui.dev can be listed.
app.use("*", async (c, next) => {
  if (c.env.CORS_ORIGIN) {
    const origins = c.env.CORS_ORIGIN.split(",").map((o) => o.trim());
    return cors({ origin: origins })(c, next);
  }
  await next();
});

app.route("/", healthRoute);
app.route("/", contactRoute);
app.route("/", guestMatchRoute);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
