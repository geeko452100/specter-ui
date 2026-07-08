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
}
