"""Resolving a Product Hunt launch to the product's own website.

The PH API never returns a product's real URL. Its `website` and `productLinks`
fields are always a `producthunt.com/r/<code>` redirect, so a card built
straight from the API sends the reader back to Product Hunt instead of to the
thing that launched.

The redirect itself answers the question: one request with redirects
suppressed, read `Location`, done. No page to scrape and no HTML to parse.

This is the only part of curate that touches the network, so it is isolated
here and skippable. When it is off, or when a lookup fails, the item keeps the
launch page as its `url` - a correct destination, just not the best one.
"""

import urllib.error
import urllib.parse
import urllib.request

from .adapters import clean_url

REDIRECT_HOSTS = ("producthunt.com", "www.producthunt.com")
TIMEOUT = 10


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    """Stop at the redirect instead of following it - the Location is the answer."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def is_redirect(url):
    """True for the producthunt.com/r/<code> form, which is never a real site."""
    if not isinstance(url, str):
        return False
    parts = urllib.parse.urlsplit(url)
    return parts.netloc.lower() in REDIRECT_HOSTS and parts.path.startswith("/r/")


def follow(url, timeout=TIMEOUT, user_agent=None):
    """The URL a redirect points at, or None if it does not resolve to one."""
    if not is_redirect(url):
        return None
    if user_agent is None:
        from aibytes_fetchers import http as fetch_http
        user_agent = fetch_http.USER_AGENT

    opener = urllib.request.build_opener(_NoRedirect)
    request = urllib.request.Request(url, headers={"User-Agent": user_agent})
    try:
        with opener.open(request, timeout=timeout) as response:
            location = response.headers.get("Location")
    except urllib.error.HTTPError as exc:
        # Suppressing the redirect is what raises this; the header is the point.
        location = exc.headers.get("Location") if exc.headers else None
    except (urllib.error.URLError, OSError, ValueError):
        return None

    resolved = clean_url(location)
    if not resolved:
        return None
    host = urllib.parse.urlsplit(resolved).netloc.lower()
    return None if host in REDIRECT_HOSTS else resolved


def resolve(drafts, follow_fn=None):
    """Upgrade each draft's `url` to the product's own site where it resolves.

    Returns the number upgraded. `follow_fn` is the seam the tests use; the
    default is the real request.
    """
    follow_fn = follow_fn or follow
    upgraded = 0
    for draft in drafts:
        if not draft.link_hint:
            continue
        resolved = follow_fn(draft.link_hint)
        if resolved and resolved != draft.item["url"]:
            draft.item["url"] = resolved
            upgraded += 1
    return upgraded
