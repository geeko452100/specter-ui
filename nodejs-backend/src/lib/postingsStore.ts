import type { JobPosting } from "../types.js";

export class PostingsNotFoundError extends Error {
  constructor() {
    super(
      "No postings export found in R2 (key: postings.json). Run the " +
        "python-crawler pipeline first — it uploads this after every real run.",
    );
    this.name = "PostingsNotFoundError";
  }
}

// No in-memory caching here, unlike the old file-backed version of this
// store: Workers don't guarantee an isolate (and its module state) survives
// between requests, so a cache would be unreliable and R2 reads are already
// fast — not worth the complexity for a low-traffic personal API.
export async function getPostings(bucket: R2Bucket): Promise<JobPosting[]> {
  const object = await bucket.get("postings.json");
  if (!object) {
    throw new PostingsNotFoundError();
  }
  return object.json<JobPosting[]>();
}
