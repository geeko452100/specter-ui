"""
Scores every posting against a resume/skills profile using TF-IDF + cosine
similarity (scikit-learn) — classic, explainable ML rather than an
embeddings model, since it needs no model download and runs in seconds on a
GitHub Actions runner, matching the "no heavy infra" posture of the rest of
this pipeline.

Called from crawler/export.py on every export, so postings.json always
reflects match_score computed against whatever's currently in
profile/resume.txt — editing your resume/skills text and re-running
`python -m crawler.export` re-scores without touching the database.
"""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# How many overlapping resume/job terms to surface per posting, for
# explainability (why did this posting score the way it did).
TOP_TERMS_PER_POSTING = 5


class _HTMLTextExtractor(HTMLParser):
    """Pulls the visible text out of an HTML fragment, dropping tags and
    unescaping entities (HTMLParser does the latter itself via
    convert_charrefs). Posting descriptions come from job boards as raw
    HTML (`<p>`, `<a href=...>`, `&nbsp;`) — left in, tokens like "href",
    "nbsp", and every URL's domain end up in the TF-IDF vocabulary and
    dilute the real skill/tech terms a resume should be scored against.
    """

    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []

    def handle_data(self, data: str) -> None:
        self._chunks.append(data)

    def text(self) -> str:
        return " ".join(self._chunks)


def _strip_html(text: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(text)
    return parser.text()


def load_profile_text(path: Path) -> str:
    """Read the resume/skills profile a posting is scored against.

    Fails loudly if missing or empty — same "misconfiguration breaks loudly
    at startup" policy DATABASE_URL and CRAWLER_CONTACT_EMAIL follow
    elsewhere in this pipeline, rather than silently scoring everything 0.
    """
    if not path.exists():
        raise RuntimeError(
            f"Missing resume/skills profile at {path}. Copy "
            f"{path.parent / (path.stem + '.example' + path.suffix)} to "
            f"{path.name} and fill in your resume/skills/portfolio text."
        )
    text = path.read_text().strip()
    if not text:
        raise RuntimeError(f"{path} is empty — add your resume/skills text before scoring.")
    return text


def _posting_text(posting: dict[str, Any]) -> str:
    tags = posting.get("tags") or []
    return "\n".join(
        [
            posting.get("title") or "",
            posting.get("company") or "",
            _strip_html(posting.get("description") or ""),
            " ".join(tags),
        ]
    )


def score_postings(postings: list[dict[str, Any]], profile_text: str) -> None:
    """Mutate each posting dict in place, adding:

    - `match_score`: cosine similarity between the resume profile and the
      posting's title/company/description/tags, 0.0 (no overlap) to 1.0
      (identical term distribution).
    - `match_terms`: up to TOP_TERMS_PER_POSTING terms driving that score —
      the posting's highest-weighted terms that also appear in the resume.

    No-op (nothing added) if `postings` is empty.
    """
    if not postings:
        return

    corpus = [profile_text] + [_posting_text(p) for p in postings]
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(corpus)

    profile_vector = matrix[0]
    posting_vectors = matrix[1:]
    similarities = cosine_similarity(profile_vector, posting_vectors)[0]

    feature_names = vectorizer.get_feature_names_out()
    profile_terms = set(vectorizer.inverse_transform(profile_vector)[0])

    for posting, score, row in zip(postings, similarities, posting_vectors):
        posting["match_score"] = round(float(score), 4)

        row_array = row.toarray()[0]
        terms = []
        for idx in row_array.argsort()[::-1]:
            if row_array[idx] <= 0 or len(terms) >= TOP_TERMS_PER_POSTING:
                break
            term = feature_names[idx]
            if term in profile_terms:
                terms.append(term)
        posting["match_terms"] = terms
