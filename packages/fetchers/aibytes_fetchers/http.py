"""Tiny stdlib HTTP helpers shared by the source modules."""

import json
import urllib.parse
import urllib.request

USER_AGENT = "aibytes-agents/1.0 (+https://github.com/sachinjain024/aibytes)"


def _request(url, params=None, headers=None):
    query = f"?{urllib.parse.urlencode(params)}" if params else ""
    return urllib.request.Request(
        f"{url}{query}", headers={"User-Agent": USER_AGENT, **(headers or {})}
    )


def get_json(url, params=None, headers=None):
    """Decoded JSON body."""
    with urllib.request.urlopen(_request(url, params, headers)) as resp:
        return json.load(resp)


def get_json_with_headers(url, params=None, headers=None):
    """Decoded JSON body plus response headers, for paginated APIs that put the
    page count in a header (TechCrunch's WordPress API uses X-WP-TotalPages)."""
    with urllib.request.urlopen(_request(url, params, headers)) as resp:
        return json.load(resp), resp.headers


def get_html(url, params=None, headers=None):
    """Decoded text body, for the sources with no API (GitHub trending)."""
    with urllib.request.urlopen(_request(url, params, headers)) as resp:
        return resp.read().decode("utf-8")


def post_json(url, payload, headers=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
            **(headers or {}),
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)
