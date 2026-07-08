/**
 * Mirrors the JSON shape crawler/export.py in python-crawler writes and
 * uploads to R2 as postings.json. Keep this in sync with JobPosting/
 * export.py's COLUMNS if that schema ever changes.
 */
export interface JobPosting {
  source: string;
  external_id: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  remote: boolean | null;
  description: string | null;
  tags: string[];
  posted_at: string | null;
  first_seen_at: string;
  last_seen_at: string;
  /** Cosine similarity (0-1) against profile/resume.txt — see
   * python-crawler/crawler/matcher.py. postings.json is pre-sorted highest
   * match first, so array order already reflects this. */
  match_score: number;
  /** Top overlapping resume/posting terms driving match_score, for
   * explainability. */
  match_terms: string[];
}
