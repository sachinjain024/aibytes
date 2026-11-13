"""Tiny stdlib HTTP helpers shared by the source modules."""

import json
import urllib.error
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


TIMEOUT = 15
MAX_BYTES = 2 * 1024 * 1024


class Response:
    """What `fetch` saw. `status` is 0 when no HTTP answer came back at all
    (a timeout, DNS, a refused connection); `error` then says which."""

    def __init__(self, status, headers=None, body=b"", error=None, truncated=False):
        self.status = status
        self.headers = headers or {}
        self.body = body
        self.error = error
        self.truncated = truncated

    @property
    def ok(self):
        return 200 <= self.status < 300

    def header(self, name):
        for key, value in self.headers.items():
            if key.lower() == name.lower():
                return value
        return None

    def json(self):
        return json.loads(self.body.decode("utf-8"))

    def text(self):
        charset = "utf-8"
        kind = self.header("Content-Type") or ""
        if "charset=" in kind:
            charset = kind.split("charset=", 1)[1].split(";")[0].strip() or charset
        try:
            return self.body.decode(charset, errors="replace")
        except LookupError:
            return self.body.decode("utf-8", errors="replace")


def fetch(url, headers=None, data=None, timeout=TIMEOUT, max_bytes=MAX_BYTES):
    """One request with a time limit and a size cap, for the gist material
    fetchers. Never raises for an HTTP error or a dead network: the caller
    decides what a 403 or a timeout means, and one bad page must not stop a run.
    `data` (a dict) makes it a JSON POST."""
    sent = {"User-Agent": USER_AGENT, **(headers or {})}
    body = None
    if data is not None:
        body = json.dumps(data).encode()
        sent.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(url, data=body, headers=sent)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            read = resp.read(max_bytes + 1)
            return Response(resp.status, dict(resp.headers.items()), read[:max_bytes],
                            truncated=len(read) > max_bytes)
    except urllib.error.HTTPError as err:
        return Response(err.code, dict(err.headers.items()) if err.headers else {},
                        error=f"HTTP {err.code}")
    except (urllib.error.URLError, OSError, ValueError) as err:
        return Response(0, error=str(getattr(err, "reason", err)) or type(err).__name__)


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
