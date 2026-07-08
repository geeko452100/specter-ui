import { Hono } from "hono";
import { getPostings, PostingsNotFoundError } from "../lib/postingsStore.js";
import type { JobPosting } from "../types.js";

type Bindings = { POSTINGS_BUCKET: R2Bucket };

export const postingsRoute = new Hono<{ Bindings: Bindings }>();

// GET /api/postings?remote=true&company=stripe&tag=react&source=greenhouse&min_score=0.2
postingsRoute.get("/postings", async (c) => {
  let postings: JobPosting[];
  try {
    postings = await getPostings(c.env.POSTINGS_BUCKET);
  } catch (err) {
    if (err instanceof PostingsNotFoundError) {
      return c.json({ error: err.message }, 503);
    }
    throw err;
  }

  const remote = c.req.query("remote");
  if (remote !== undefined) {
    const wantRemote = remote === "true";
    postings = postings.filter((p) => p.remote === wantRemote);
  }

  const company = c.req.query("company");
  if (company !== undefined) {
    const needle = company.toLowerCase();
    postings = postings.filter((p) => p.company.toLowerCase().includes(needle));
  }

  const tag = c.req.query("tag");
  if (tag !== undefined) {
    const needle = tag.toLowerCase();
    postings = postings.filter((p) => p.tags.some((t) => t.toLowerCase() === needle));
  }

  const source = c.req.query("source");
  if (source !== undefined) {
    postings = postings.filter((p) => p.source.startsWith(source));
  }

  const minScore = c.req.query("min_score");
  if (minScore !== undefined) {
    const threshold = Number(minScore);
    postings = postings.filter((p) => p.match_score >= threshold);
  }

  return c.json({ count: postings.length, postings });
});
