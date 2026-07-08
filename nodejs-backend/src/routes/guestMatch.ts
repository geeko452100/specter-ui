import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { extractText, getDocumentProxy } from "unpdf";
import { scoreAgainstResume } from "../lib/keywordMatch.js";
import { getPostings, PostingsNotFoundError } from "../lib/postingsStore.js";

type Bindings = { POSTINGS_BUCKET: R2Bucket; RATE_LIMIT: KVNamespace };

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_REQUESTS_PER_WINDOW = 20;
const WINDOW_SECONDS = 60 * 60;

export const guestMatchRoute = new Hono<{ Bindings: Bindings }>();

// POST /guest/match — public, no auth. Recruiters upload their own resume
// (.txt or .pdf) and get postings ranked against it. Nothing is persisted:
// the file is parsed, scored, and discarded within this one request.
guestMatchRoute.post(
  "/guest/match",
  bodyLimit({
    maxSize: MAX_FILE_BYTES,
    onError: (c) => c.json({ error: "Resume file is too large (max 3MB)." }, 413),
  }),
  async (c) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    const limited = await isRateLimited(c.env.RATE_LIMIT, ip);
    if (limited) {
      c.header("Retry-After", String(WINDOW_SECONDS));
      return c.json({ error: "Too many resume uploads from this address. Try again later." }, 429);
    }

    const body = await c.req.parseBody();
    const file = body["resume"];
    if (!(file instanceof File)) {
      return c.json({ error: "Upload a resume file under the `resume` field." }, 400);
    }

    const name = file.name.toLowerCase();
    let resumeText: string;
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        const pdf = await getDocumentProxy(buffer);
        const { text } = await extractText(pdf, { mergePages: true });
        resumeText = text;
      } catch (err) {
        console.error("PDF extraction failed", err);
        return c.json({ error: "Couldn't read that PDF. Try a plain .txt file instead." }, 400);
      }
    } else if (name.endsWith(".txt") || file.type.startsWith("text/")) {
      resumeText = await file.text();
    } else {
      return c.json({ error: "Only .txt and .pdf resumes are supported." }, 400);
    }

    if (!resumeText.trim()) {
      return c.json({ error: "That resume file appears to be empty." }, 400);
    }

    let postings;
    try {
      postings = await getPostings(c.env.POSTINGS_BUCKET);
    } catch (err) {
      if (err instanceof PostingsNotFoundError) {
        return c.json({ error: err.message }, 503);
      }
      throw err;
    }

    const matches = scoreAgainstResume(postings, resumeText);
    return c.json({
      count: matches.length,
      postings: matches.map((m) => ({ ...m.posting, match_score: m.match_score, match_terms: m.match_terms })),
    });
  },
);

async function isRateLimited(kv: KVNamespace, ip: string): Promise<boolean> {
  const key = `guestmatch:${ip}`;
  const now = Date.now();
  const existing = await kv.get<{ count: number; expiresAt: number }>(key, "json");

  if (existing && existing.expiresAt > now) {
    if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
      return true;
    }
    await kv.put(
      key,
      JSON.stringify({ count: existing.count + 1, expiresAt: existing.expiresAt }),
      { expirationTtl: Math.ceil((existing.expiresAt - now) / 1000) },
    );
    return false;
  }

  await kv.put(key, JSON.stringify({ count: 1, expiresAt: now + WINDOW_SECONDS * 1000 }), {
    expirationTtl: WINDOW_SECONDS,
  });
  return false;
}
