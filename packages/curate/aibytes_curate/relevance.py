"""The editorial line: what gets into an edition, and why the rest did not.

The spec's rule is that the filter, not a per-category cap, is the editorial
line - an edition carries everything that passes and nothing is trimmed to fit.
That only works if the filter is honest about what it dropped, which is what
rejected.json is for.

Three reasons an item does not make it:

    unusable    the adapter could not shape it (no URL, no title)
    not-ai      no AI signal in the source's own words
    duplicate   the same destination already arrived from an earlier source

## Where the AI filter actually runs

Each source is filtered by the same predicate its fetcher uses, imported from
packages/fetchers rather than restated here - so curate can never disagree with
the snapshot it is reading. On a normal run the fetchers have already applied
those predicates and they pass again for free; on a snapshot taken with
--no-ai-filter, curate is the backstop that keeps the line in one place.

Two sources are deliberately not keyword-filtered, for opposite reasons:

- **TechCrunch** is fetched from TechCrunch's own `artificial-intelligence`
  category, so the source has already made the call editorially. Running our
  vocabulary over it on top drops real AI stories whose headline happens not to
  use our words - "Amazon just tripled its order of Nvidia chips", "Gamma
  acquires design startup Lica" - and we would be overruling the source with a
  worse filter.
- **Product Hunt** is the opposite: its query is `featured: true` with no topic
  filter at all, so its snapshot is the week's top launches whatever they are
  about. It is the one source where this filter does real work, and it uses the
  shared vocabulary since the PH fetcher has no predicate of its own.
"""

import re
import urllib.parse

from . import REPO_ROOT  # noqa: F401  (imported for its sys.path setup)
from .adapters import ORDER
from aibytes_fetchers import keywords
from aibytes_fetchers.sources import github, hackernews

REASONS = ("unusable", "not-ai", "duplicate")

# Category order in the file, matching the app's section order.
CATEGORY_ORDER = ("launches", "repos", "news", "hn")

# Product Hunt's vocabulary. Taglines and descriptions are prose, so acronyms
# compile case-sensitively as they do for HackerNews titles; topic names arrive
# capitalised ("Vibe coding"), so the phrase list covers those in any casing.
PH_PATTERNS_CASED = keywords.compile_patterns(keywords.ACRONYMS)
PH_PATTERNS = keywords.compile_patterns(
    keywords.PHRASES,
    (
        r"ai[ -](agent|model|coding|assistant|native|powered)",
        r"\bagentic\b",
        r"\bmcp\b|model context protocol",
        r"text[ -]to[ -](image|video|speech|sql)",
        r"\binference\b",
        r"\bembeddings?\b",
        r"vector (database|db|search)",
    ),
    flags=re.IGNORECASE,
)


def _producthunt_is_ai(draft):
    text = draft.text or ""
    if any(p.search(text) for p in PH_PATTERNS_CASED):
        return True
    if any(p.search(text) for p in PH_PATTERNS):
        return True
    host = urllib.parse.urlsplit(draft.url or "").netloc.lower()
    return bool(keywords.DOMAINS.search(host))


def _topic_scoped(draft):
    """The feed is already scoped at the source, so its judgement stands."""
    return True


# Source -> the predicate that decides whether it is AI. Every source has an
# entry, and `_topic_scoped` is spelled out rather than left as None: a missing
# key has to mean "nobody decided", not "let it through".
PREDICATES = {
    "producthunt": _producthunt_is_ai,
    "hackernews": lambda draft: hackernews.is_ai_story(draft.raw),
    "github": lambda draft: github.is_ai_repo(draft.raw),
    "techcrunch": _topic_scoped,
}

# Why an item was dropped, per source, for the rejection log.
NOT_AI_DETAIL = {
    "producthunt": "no AI keyword or domain in the tagline, description or topics",
    "hackernews": "no AI keyword or domain in the title or link",
    "github": "no AI keyword in the repo name or description",
}


def is_ai(draft):
    """True when this source's own predicate says the item is AI.

    A source with no entry in PREDICATES falls back to the shared vocabulary
    rather than being waved through - a new fetcher must not bypass the
    editorial line just because nobody added it here. A drift test catches the
    omission at test time; this is what happens if one ever slips past it.
    """
    predicate = PREDICATES.get(draft.source, _producthunt_is_ai)
    try:
        return bool(predicate(draft))
    except (KeyError, TypeError, AttributeError):
        # A raw item missing what the fetcher's predicate reads. Fall back to
        # the text we did manage to collect rather than dropping it silently.
        return _producthunt_is_ai(draft)


def dedup_key(url):
    """What counts as 'the same link' across two sources.

    Host case and a leading www., a trailing slash, and query order are all
    ways the same article arrives looking different. Tracking params are
    already gone by here (adapters.clean_url), so what is left of the query is
    load-bearing and stays.
    """
    if not url:
        return None
    parts = urllib.parse.urlsplit(url)
    host = parts.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    path = parts.path.rstrip("/") or "/"
    query = urllib.parse.urlencode(sorted(urllib.parse.parse_qsl(parts.query)))
    return (host, path, query)


def rejection(draft, reason, detail):
    """A rejected draft, in the shape rejected.json records."""
    return {
        "id": draft.id,
        "source": draft.source,
        "title": draft.item.get("title"),
        "url": draft.url,
        "reason": reason,
        "detail": detail,
    }


def apply(drafts):
    """Filter and dedup. Returns (kept, rejected), both in a stable order.

    Kept items are ordered by category, then by source, then by the source's
    own ranking - so the file is the app's reading order and a re-run over the
    same snapshots produces byte-identical output.
    """
    kept, rejected, seen = [], [], {}

    for draft in drafts:
        if not is_ai(draft):
            rejected.append(rejection(
                draft, "not-ai",
                NOT_AI_DETAIL.get(draft.source, "no AI signal in the source's own words")))
            continue

        key = dedup_key(draft.url)
        if key is not None and key in seen:
            survivor = seen[key]
            rejected.append(rejection(
                draft, "duplicate",
                f"same destination as {survivor.id} from {survivor.source}"))
            continue
        if key is not None:
            seen[key] = draft
        kept.append(draft)

    kept.sort(key=_position)
    return kept, rejected


def _position(draft):
    category = draft.item.get("category")
    return (
        CATEGORY_ORDER.index(category) if category in CATEGORY_ORDER else len(CATEGORY_ORDER),
        ORDER.index(draft.source) if draft.source in ORDER else len(ORDER),
        draft.rank,
    )
