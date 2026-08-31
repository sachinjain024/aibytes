"""Raw snapshot items -> draft edition items, one adapter per source.

Each fetcher writes its source's own shape; the contract in
packages/feed-schema is one shape for all four. This is where four become one.

An adapter fills every field the contract requires except `summary` and `tags`
- those are Claude's - so what comes out of here is a Draft, not an item. It
also carries the source text forward as `text`, which is what the relevance
filter reads and what Claude is given to write the summary from.

Adapters are pure: no network, no clock. Product Hunt's real website needs one
redirect to resolve, so the adapter records the redirect as a `link_hint` and
`links.resolve` upgrades it later, if it is allowed to.
"""

import datetime as dt
import re
import unicodedata
import urllib.parse

# The contract's source names, keyed by the SOURCE value in the snapshot
# envelope. GitHub is the one that differs ("github-trending" on disk).
SOURCE_NAMES = {
    "producthunt": "producthunt",
    "hackernews": "hackernews",
    "techcrunch": "techcrunch",
    "github-trending": "github",
}

# Item id prefixes. Short on purpose - the id is read in commits and hide.py
# invocations - and matching the aliases the fetch CLI already accepts.
PREFIXES = {
    "producthunt": "ph",
    "hackernews": "hn",
    "techcrunch": "tc",
    "github": "gh",
}

# Query params that identify the referrer rather than the resource. Stripped so
# two sources linking to the same article dedup against each other, and so a
# published URL does not carry our own campaign tags around. `source` is
# deliberately absent: plenty of real URLs use it as a genuine parameter.
TRACKING_PARAMS = frozenset((
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "utm_id", "utm_name", "ref", "ref_src", "referrer", "fbclid", "gclid",
    "mc_cid", "mc_eid", "igshid", "spm",
))

SLUG_MAX = 48


class Draft:
    """One candidate item: the contract fields we can derive, plus context.

    `item` is the edition item minus `summary` and `tags`. `text` is what the
    source said about it, which the relevance filter matches on and Claude
    writes the summary from. `rank` is the source's own ordering, kept so the
    edition's item order is the source's order rather than dict order.
    """

    __slots__ = ("item", "text", "rank", "raw", "link_hint")

    def __init__(self, item, text, rank, raw=None, link_hint=None):
        self.item = item
        self.text = text
        self.rank = rank
        # The source's own item, kept so the relevance filter can run each
        # fetcher's own predicate against the shape it was written for.
        self.raw = raw if raw is not None else {}
        self.link_hint = link_hint

    @property
    def id(self):
        return self.item["id"]

    @property
    def source(self):
        return self.item["source"]

    @property
    def url(self):
        return self.item["url"]

    def __repr__(self):
        return f"Draft({self.item['id']!r})"


# --------------------------------------------------------------------------
# Shared helpers
# --------------------------------------------------------------------------

def clean_url(url):
    """The canonical URL: tracking params dropped, everything else untouched."""
    if not isinstance(url, str) or not url.strip():
        return None
    parts = urllib.parse.urlsplit(url.strip())
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return None
    kept = [
        (k, v) for k, v in urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
        if k.lower() not in TRACKING_PARAMS
    ]
    return urllib.parse.urlunsplit((
        parts.scheme, parts.netloc, parts.path,
        urllib.parse.urlencode(kept), parts.fragment,
    ))


def slugify(text, max_len=SLUG_MAX):
    """A URL-safe slug for an item id, cut at a word boundary."""
    if not isinstance(text, str):
        return ""
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")
    if len(slug) > max_len:
        # Prefer a whole word; fall back to a hard cut for one very long word.
        slug = slug[:max_len].rsplit("-", 1)[0] or slug[:max_len]
    return slug.strip("-")


def make_id(source, slug, date):
    """`<prefix>-<slug>-<date>`, matching the contract's ID pattern."""
    return f"{PREFIXES[source]}-{slug}-{date}"


def _signals(**pairs):
    """Signals, zeros and Nones dropped; None when the source reported nothing.

    The contract omits `signals` rather than emitting it empty, and a zero is
    the source saying nothing happened rather than reporting a number.
    """
    signals = {k: int(v) for k, v in pairs.items() if isinstance(v, (int, float)) and v > 0}
    return signals or None


def _meta(**pairs):
    """Meta, Nones and blanks dropped; None when nothing is left."""
    meta = {k: v.strip() for k, v in pairs.items() if isinstance(v, str) and v.strip()}
    return meta or None


def _build(item_id, *, title, url, source, source_url, category, image,
           signals=None, meta=None, published_at=None):
    """Assemble a contract item in the contract's key order, omitting blanks."""
    item = {
        "id": item_id,
        "title": title,
        "url": url,
        "source": source,
        "source_url": source_url,
        "category": category,
        "image": image,
    }
    if signals:
        item["signals"] = signals
    if meta:
        item["meta"] = meta
    if published_at:
        item["published_at"] = published_at
    item["hidden"] = False
    return item


def _timestamp(value):
    """Pass an ISO 8601 timestamp through, or None if it is not one."""
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        dt.datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError:
        return None
    return value.strip()


def _dropped(source, raw, reason, detail):
    """A raw item an adapter could not shape, on its way to rejected.json."""
    return {
        "source": source,
        "title": raw.get("title") or raw.get("name") or None,
        "url": raw.get("url") or None,
        "reason": reason,
        "detail": detail,
    }


def _identify(source, raw, date, fallback, used):
    """A unique item id for this edition, or None if there is nothing to slug."""
    slug = slugify(fallback)
    if not slug:
        return None
    item_id = make_id(source, slug, date)
    if item_id in used:
        # Two launches called "Notion AI" in one edition is rare but real, and
        # the contract requires ids unique within the edition.
        item_id = next(
            (candidate for candidate in
             (make_id(source, f"{slug}-{n}", date) for n in range(2, 100))
             if candidate not in used),
            None,
        )
        if item_id is None:
            # Better to report the item than to publish a duplicate id.
            return None
    used.add(item_id)
    return item_id


# --------------------------------------------------------------------------
# Product Hunt -> launches
# --------------------------------------------------------------------------

def from_producthunt(envelope, date, used=None):
    """PH launches. `url` wants the product's own site, which only exists
    behind a producthunt.com/r/ redirect - recorded as a link_hint here and
    resolved by links.resolve, which is the only part that needs the network.
    """
    used = used if used is not None else set()
    drafts, dropped = [], []
    for rank, post in enumerate(envelope.get("posts") or []):
        page = clean_url(post.get("url"))
        name = (post.get("name") or "").strip()
        if not page:
            dropped.append(_dropped("producthunt", post, "unusable", "no launch page URL"))
            continue
        if not name:
            dropped.append(_dropped("producthunt", post, "unusable", "no product name"))
            continue
        item_id = _identify("producthunt", post, date, post.get("slug") or name, used)
        if not item_id:
            dropped.append(_dropped("producthunt", post, "unusable", "name does not slug"))
            continue

        thumbnail = post.get("thumbnail") or {}
        thumb_url = clean_url(thumbnail.get("url")) if isinstance(thumbnail, dict) else None
        topics = [
            t.get("name") for t in ((post.get("topics") or {}).get("nodes") or [])
            if isinstance(t, dict) and t.get("name")
        ]

        drafts.append(Draft(
            _build(
                item_id,
                title=name,
                # Upgraded to the product's own site by links.resolve; the
                # launch page is a correct destination until then.
                url=page,
                source="producthunt",
                source_url=page,
                category="launches",
                image={"type": "logo", "url": thumb_url} if thumb_url else {"type": "none"},
                signals=_signals(upvotes=post.get("votesCount"),
                                 comments=post.get("commentsCount")),
                published_at=_timestamp(post.get("featuredAt") or post.get("createdAt")),
            ),
            text=" ".join(filter(None, [
                name, post.get("tagline"), post.get("description"), " ".join(topics),
            ])),
            rank=rank,
            raw=post,
            link_hint=clean_url(post.get("website")),
        ))
    return drafts, dropped


# --------------------------------------------------------------------------
# GitHub trending -> repos
# --------------------------------------------------------------------------

def from_github(envelope, date, used=None):
    """Trending repos. The repo is both the destination and the source page,
    and the owner's avatar is derivable from the name, so nothing here needs a
    second request."""
    used = used if used is not None else set()
    drafts, dropped = [], []
    for rank, repo in enumerate(envelope.get("repos") or []):
        full_name = (repo.get("name") or "").strip()
        url = clean_url(repo.get("url"))
        if not full_name or "/" not in full_name:
            dropped.append(_dropped("github", repo, "unusable", "no owner/repo name"))
            continue
        if not url:
            dropped.append(_dropped("github", repo, "unusable", "no repo URL"))
            continue
        owner, _, short_name = full_name.partition("/")
        item_id = _identify("github", repo, date, short_name, used)
        if not item_id:
            dropped.append(_dropped("github", repo, "unusable", "repo name does not slug"))
            continue

        drafts.append(Draft(
            _build(
                item_id,
                title=full_name,
                url=url,
                source="github",
                source_url=url,
                category="repos",
                # ?size=80 keeps the 40px card crisp on a 2x display. GitHub
                # serves an identicon for owners with no avatar, so this never
                # 404s and the Octocat fallback is only for a failed request.
                image={"type": "avatar",
                       "url": f"https://github.com/{urllib.parse.quote(owner)}.png?size=80"},
                signals=_signals(stars=repo.get("stars"),
                                 stars_gained=repo.get("period_stars"),
                                 forks=repo.get("forks")),
                meta=_meta(language=repo.get("language")),
                # No published_at: the trending page reports a window, not a
                # publish date, which is why the contract makes it optional.
            ),
            text=" ".join(filter(None, [full_name, repo.get("description"), repo.get("language")])),
            rank=rank,
            raw=repo,
        ))
    return drafts, dropped


# --------------------------------------------------------------------------
# TechCrunch -> news
# --------------------------------------------------------------------------

def from_techcrunch(envelope, date, used=None):
    """TechCrunch AI articles. The article is its own source page.

    The snapshot's `hackernews` block is the fetcher's ranking aid, not a
    signal worth showing - a story with 7 points would render a number that
    means nothing. When the same article is genuinely on the HN front page it
    arrives through the HN snapshot too, and dedup merges those points across.
    """
    used = used if used is not None else set()
    drafts, dropped = [], []
    for rank, article in enumerate(envelope.get("articles") or []):
        title = (article.get("title") or "").strip()
        url = clean_url(article.get("url"))
        if not title or not url:
            dropped.append(_dropped("techcrunch", article, "unusable",
                                    "no title or article URL"))
            continue
        item_id = _identify("techcrunch", article, date, title, used)
        if not item_id:
            dropped.append(_dropped("techcrunch", article, "unusable", "title does not slug"))
            continue

        image_url = clean_url(article.get("image"))
        drafts.append(Draft(
            _build(
                item_id,
                title=title,
                url=url,
                source="techcrunch",
                source_url=url,
                category="news",
                image={"type": "thumbnail", "url": image_url} if image_url else {"type": "none"},
                meta=_meta(author=article.get("author"),
                           reading_time=article.get("reading_time")),
                published_at=_timestamp(article.get("published_at")),
            ),
            text=" ".join(filter(None, [title, article.get("description")])),
            rank=rank,
            raw=article,
        ))
    return drafts, dropped


# --------------------------------------------------------------------------
# Hacker News -> hn, or launches for Show HN
# --------------------------------------------------------------------------

def from_hackernews(envelope, date, used=None):
    """HN stories. The thread is the source page and the article is the
    destination; for a self post the fetcher has already made them the same.

    Show HN and Launch HN are launches, not threads - the contract says so, and
    it is what keeps the Launches section the place where new things appear
    regardless of where they were announced.
    """
    used = used if used is not None else set()
    drafts, dropped = [], []
    for rank, story in enumerate(envelope.get("stories") or []):
        title = (story.get("title") or "").strip()
        thread = clean_url(story.get("hn_url"))
        url = clean_url(story.get("url")) or thread
        if not title or not thread:
            dropped.append(_dropped("hackernews", story, "unusable", "no title or thread URL"))
            continue
        item_id = _identify("hackernews", story, date, title, used)
        if not item_id:
            dropped.append(_dropped("hackernews", story, "unusable", "title does not slug"))
            continue

        drafts.append(Draft(
            _build(
                item_id,
                title=title,
                url=url,
                source="hackernews",
                source_url=thread,
                category="launches" if story.get("type") in ("show_hn", "launch_hn") else "hn",
                # No image by design: the card shows the HN mark in the same
                # 40px slot, so rows still align.
                image={"type": "none"},
                signals=_signals(points=story.get("points"),
                                 comments=story.get("num_comments")),
                meta=_meta(author=story.get("author")),
                published_at=_timestamp(story.get("created_at")),
            ),
            text=title,
            rank=rank,
            raw=story,
        ))
    return drafts, dropped


ADAPTERS = {
    "producthunt": from_producthunt,
    "github": from_github,
    "techcrunch": from_techcrunch,
    "hackernews": from_hackernews,
}

# The order sources are adapted in, which decides item order within a category
# and which copy of a cross-posted item survives dedup.
ORDER = ("producthunt", "github", "techcrunch", "hackernews")


def adapt_all(snapshots, date):
    """Every snapshot -> (drafts, dropped). `snapshots` is {source: envelope}."""
    used, drafts, dropped = set(), [], []
    for source in ORDER:
        envelope = snapshots.get(source)
        if not envelope:
            continue
        source_drafts, source_dropped = ADAPTERS[source](envelope, date, used)
        drafts += source_drafts
        dropped += source_dropped
    return drafts, dropped
