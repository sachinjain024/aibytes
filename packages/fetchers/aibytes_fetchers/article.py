"""Readable text from one web page, for gists (AIB-145y T10).

`article_text(url)` returns the title, byline and paragraphs of a page, or says
plainly why it could not: a gist is only ever written from text the run
actually read, so junk must never pass as an article. Stdlib `html.parser`,
no readability library.

The text is other people's writing. Callers keep it in the git-ignored
`.cache/gists/` folder and never commit it.
"""

import html
import re
from html.parser import HTMLParser

from . import http

MAX_CHARS = 12000
MIN_WORDS = 150

# Why a page was not used. `None` means it was.
UNREADABLE = ("http_error", "network", "not_html", "bot_check", "paywall", "too_short")

# Seen only on a challenge page, so they count however long the page is.
_BOT_ALWAYS = ("cf-chl", "challenge-platform", "cf_chl_opt", "captcha-delivery")
# Normal pages carry these too (a <noscript> line, a newsletter box), so they
# only explain a page that is already too short to use.
_BOT_SHORT = ("enable javascript", "verify you are human", "checking your browser")
_PAYWALL_SHORT = ("subscribe to continue", "subscribe to read", "to continue reading",
                  "already a subscriber", "this article is for subscribers")

_SKIP = {"script", "style", "noscript", "nav", "header", "footer", "aside", "form",
         "svg", "button", "figcaption", "template"}
_BLOCKS = {"p", "li", "h2", "h3", "blockquote", "pre"}


class _Reader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta = {}
        self.blocks = []          # (inside_article, text)
        self._skip = 0
        self._article = 0
        self._in_title = False
        self._block = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            key = (attrs.get("property") or attrs.get("name") or "").lower()
            if key and attrs.get("content"):
                self.meta.setdefault(key, attrs["content"].strip())
            return
        if tag in _SKIP:
            self._skip += 1
        elif tag == "article" or attrs.get("role") == "article":
            self._article += 1
        elif tag == "title":
            self._in_title = True
        elif tag in _BLOCKS and not self._skip and self._block is None:
            self._block = (tag, [])
        elif tag == "br" and self._block is not None:
            self._block[1].append(" ")

    def handle_endtag(self, tag):
        if tag in _SKIP:
            self._skip = max(0, self._skip - 1)
        elif tag == "article":
            self._article = max(0, self._article - 1)
        elif tag == "title":
            self._in_title = False
        elif self._block is not None and tag == self._block[0]:
            text = _squash("".join(self._block[1]))
            if text:
                self.blocks.append((self._article > 0, text))
            self._block = None

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        elif self._block is not None and not self._skip:
            self._block[1].append(data)


def _squash(text):
    return re.sub(r"\s+", " ", text).strip()


def words(text):
    return len(text.split()) if text else 0


def html_to_text(markup):
    """Plain text from a fragment of HTML (an HN or PH comment): paragraphs
    become blank-line breaks, tags go, entities are decoded."""
    if not markup:
        return ""
    text = re.sub(r"(?i)<\s*(p|br|/p|li)\b[^>]*>", "\n", markup)
    text = html.unescape(re.sub(r"<[^>]+>", "", text))
    lines = [_squash(line) for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


def trim(text, limit):
    """Cut at a word boundary, marking the cut with an ellipsis."""
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:.")
    return cut + "…"


def parse(markup, max_chars=MAX_CHARS, min_words=MIN_WORDS):
    """The readable part of a page already fetched. Returns the same shape as
    `article_text`, without the fetch."""
    reader = _Reader()
    try:
        reader.feed(markup)
        reader.close()
    except Exception:  # html.parser is lenient; anything else is a broken page
        pass
    inside = [text for in_article, text in reader.blocks if in_article]
    blocks = inside if words(" ".join(inside)) >= min_words else [t for _, t in reader.blocks]
    body = "\n\n".join(blocks)
    lower = markup.lower()
    title = reader.meta.get("og:title") or _squash(reader.title)
    byline = reader.meta.get("author") or reader.meta.get("article:author") or None
    if byline and byline.startswith("http"):
        byline = None
    count = words(body)

    reason = None
    if any(mark in lower for mark in _BOT_ALWAYS):
        reason = "bot_check"
    elif count < min_words:
        if any(mark in lower for mark in _PAYWALL_SHORT):
            reason = "paywall"
        elif any(mark in lower for mark in _BOT_SHORT):
            reason = "bot_check"
        else:
            reason = "too_short"
    if reason:
        return _unreadable(reason, f"{count} words of paragraph text", title=title)
    return {"readable": True, "reason": None, "detail": None, "title": title or None,
            "byline": byline, "text": trim(body, max_chars), "words": count}


def _unreadable(reason, detail, title=None):
    return {"readable": False, "reason": reason, "detail": detail, "title": title or None,
            "byline": None, "text": "", "words": 0}


def article_text(url, max_chars=MAX_CHARS, min_words=MIN_WORDS):
    """Fetch `url` and return {readable, reason, detail, title, byline, text,
    words}. `reason` is one of UNREADABLE when `readable` is false."""
    resp = http.fetch(url, headers={"Accept": "text/html,application/xhtml+xml"})
    if resp.status == 0:
        return _unreadable("network", resp.error)
    if not resp.ok:
        body = resp.text().lower()
        if resp.status in (403, 429, 503) and any(m in body for m in _BOT_ALWAYS + _BOT_SHORT):
            return _unreadable("bot_check", f"HTTP {resp.status}")
        return _unreadable("http_error", f"HTTP {resp.status}")
    kind = (resp.header("Content-Type") or "").lower()
    if kind and "html" not in kind:
        return _unreadable("not_html", kind.split(";")[0])
    return parse(resp.text(), max_chars, min_words)
