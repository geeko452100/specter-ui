import { readFile, stat } from "node:fs/promises";
import type { JobPosting } from "../types.js";

export class PostingsNotFoundError extends Error {
  constructor(path: string) {
    super(
      `No postings export found at ${path}. Run the python-crawler ` +
        "pipeline first (python -m crawler.run) to generate it.",
    );
    this.name = "PostingsNotFoundError";
  }
}

let cache: { mtimeMs: number; postings: JobPosting[] } | null = null;

/**
 * Reads data/postings.json, re-parsing only when the file's mtime has
 * changed since the last read — python-crawler runs periodically, not
 * continuously, so most requests hit the in-memory cache instead of
 * re-parsing a multi-megabyte JSON file.
 */
export async function getPostings(jsonPath: string): Promise<JobPosting[]> {
  let mtimeMs: number;
  try {
    mtimeMs = (await stat(jsonPath)).mtimeMs;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new PostingsNotFoundError(jsonPath);
    }
    throw err;
  }

  if (cache && cache.mtimeMs === mtimeMs) {
    return cache.postings;
  }

  const raw = await readFile(jsonPath, "utf-8");
  const postings = JSON.parse(raw) as JobPosting[];
  cache = { mtimeMs, postings };
  return postings;
}
