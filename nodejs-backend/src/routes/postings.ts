import { Router } from "express";
import { config } from "../config.js";
import { getPostings, PostingsNotFoundError } from "../lib/postingsStore.js";

export const postingsRouter = Router();

// GET /api/postings?remote=true&company=stripe&tag=react&source=greenhouse
postingsRouter.get("/postings", async (req, res) => {
  try {
    let postings = await getPostings(config.postingsJsonPath);

    const remote = firstString(req.query.remote);
    if (remote !== undefined) {
      const wantRemote = remote === "true";
      postings = postings.filter((p) => p.remote === wantRemote);
    }

    const company = firstString(req.query.company);
    if (company !== undefined) {
      const needle = company.toLowerCase();
      postings = postings.filter((p) => p.company.toLowerCase().includes(needle));
    }

    const tag = firstString(req.query.tag);
    if (tag !== undefined) {
      const needle = tag.toLowerCase();
      postings = postings.filter((p) => p.tags.some((t) => t.toLowerCase() === needle));
    }

    const source = firstString(req.query.source);
    if (source !== undefined) {
      postings = postings.filter((p) => p.source.startsWith(source));
    }

    res.json({ count: postings.length, postings });
  } catch (err) {
    if (err instanceof PostingsNotFoundError) {
      res.status(503).json({ error: err.message });
      return;
    }
    throw err;
  }
});

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}
