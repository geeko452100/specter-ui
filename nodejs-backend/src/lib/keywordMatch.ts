import type { JobPosting } from "../types.js";

// A compact English stopword list — not sklearn's exact list (see
// python-crawler/crawler/matcher.py for the "real" TF-IDF scoring against
// the site owner's own resume), just enough to filter noise words out of
// guest-uploaded resumes for the lightweight overlap scoring below.
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "all", "am", "an", "and", "any",
  "are", "as", "at", "be", "because", "been", "before", "being", "below",
  "between", "both", "but", "by", "can", "did", "do", "does", "doing",
  "down", "during", "each", "few", "for", "from", "further", "had", "has",
  "have", "having", "he", "her", "here", "hers", "herself", "him",
  "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its",
  "itself", "me", "more", "most", "my", "myself", "no", "nor", "not",
  "of", "off", "on", "once", "only", "or", "other", "our", "ours",
  "ourselves", "out", "over", "own", "same", "she", "should", "so",
  "some", "such", "than", "that", "the", "their", "theirs", "them",
  "themselves", "then", "there", "these", "they", "this", "those",
  "through", "to", "too", "under", "until", "up", "very", "was", "we",
  "were", "what", "when", "where", "which", "while", "who", "whom",
  "why", "will", "with", "you", "your", "yours", "yourself",
  "yourselves", "using", "used", "use", "also", "etc", "via",
]);

const TOKEN_PATTERN = /[a-z0-9][a-z0-9+.#-]{1,}/g;
const MAX_TOP_TERMS = 5;

export function tokenize(text: string): string[] {
  // TOKEN_PATTERN allows trailing +.#- mid-token (so "node.js", "c#", "c++"
  // survive intact), which also greedily swallows real trailing punctuation
  // like the period ending a sentence — strip that back off afterward.
  const matches = text.toLowerCase().match(TOKEN_PATTERN) ?? [];
  return matches
    .map((token) => token.replace(/[.#+-]+$/, ""))
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

export function buildTokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

function postingText(posting: JobPosting): string {
  return [posting.title, posting.company, posting.description ?? "", posting.tags.join(" ")].join("\n");
}

export interface GuestMatch {
  posting: JobPosting;
  match_score: number;
  match_terms: string[];
}

/**
 * Cosine similarity over binary (present/absent) term vectors — i.e.
 * |intersection| / sqrt(|resumeTokens| * |postingTokens|). Cheap (just set
 * intersection, no corpus-wide vectorization) so it can run per-request over
 * hundreds of postings within a Worker's CPU budget, unlike the real TF-IDF
 * scoring in python-crawler/crawler/matcher.py which needs the whole corpus
 * to compute IDF weights.
 */
export function scoreAgainstResume(postings: JobPosting[], resumeText: string): GuestMatch[] {
  const resumeTokens = buildTokenSet(resumeText);

  return postings
    .map((posting) => {
      const postingTokens = buildTokenSet(postingText(posting));
      const overlap = [...postingTokens].filter((t) => resumeTokens.has(t));
      const denom = Math.sqrt(resumeTokens.size * postingTokens.size);
      const score = denom > 0 ? overlap.length / denom : 0;

      // Prefer longer, more specific overlapping terms (e.g. "typescript"
      // over "api") as the surfaced match_terms, since tags/skills tend to
      // be longer than generic words that slipped past the stopword list.
      const terms = overlap.sort((a, b) => b.length - a.length).slice(0, MAX_TOP_TERMS);

      return { posting, match_score: Math.round(score * 10000) / 10000, match_terms: terms };
    })
    .sort((a, b) => b.match_score - a.match_score);
}
