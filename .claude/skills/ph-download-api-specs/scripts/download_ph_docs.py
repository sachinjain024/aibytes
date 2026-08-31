#!/usr/bin/env python3
"""Mirror the ProductHunt GraphQL v2 API docs site for offline hosting.

Crawls the static docs site (graphql-docs generated), downloads every page
and asset, localizes the one external CDN script, and rewrites all internal
absolute links to relative ones so the copy works from file:// or when
hosted under any subpath.

Usage: python3 download_ph_docs.py [output_dir]
Default output_dir: newsletter/sources/producthunt/graphql-v2/specs (relative to CWD)
"""

import os
import re
import sys
import posixpath
import urllib.request
from urllib.parse import urlsplit, urljoin

BASE = "http://api-v2-docs.producthunt.com.s3-website-us-east-1.amazonaws.com"
DEFAULT_OUT = os.path.join("newsletter", "sources", "producthunt", "graphql-v2", "specs")

LINK_RE = re.compile(r'(href|src)="([^"]+)"')
CSS_URL_RE = re.compile(r'url\((["\']?)([^)"\']+)\1\)')

EXTERNAL_SCRIPTS = {
    # CDN scripts referenced by the pages, localized under assets/vendor/
    "https://cdnjs.cloudflare.com/ajax/libs/anchor-js/3.2.2/anchor.min.js":
        "/assets/vendor/anchor.min.js",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "ph-docs-mirror/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def is_page(path):
    """Directory-style doc page (no file extension in last segment)."""
    last = path.rstrip("/").rsplit("/", 1)[-1]
    return "." not in last


def normalize(path):
    """Normalize an internal URL path: strip query/fragment, ensure pages end in /."""
    path = urlsplit(path).path or "/"
    if is_page(path) and not path.endswith("/"):
        path += "/"
    return path


def local_file(path):
    """Local file path (relative, posix) for a normalized URL path."""
    if path.endswith("/"):
        return path.lstrip("/") + "index.html"
    return path.lstrip("/")


def rel_link(from_page, to_path):
    """Relative href from a page's URL path to another normalized URL path."""
    target = local_file(to_path)
    from_dir = posixpath.dirname(local_file(from_page))
    rel = posixpath.relpath(target, from_dir or ".")
    return rel


def internal_path(url, page_path):
    """Return the site-internal path for a link, or None if external."""
    if url.startswith(("#", "mailto:", "javascript:")):
        return None
    parts = urlsplit(url)
    if parts.scheme or parts.netloc:
        full = url if parts.scheme else "http:" + url
        host = urlsplit(full).netloc
        if host == urlsplit(BASE).netloc:
            return parts.path or "/"
        return None
    if url.startswith("/"):
        return url
    # relative link: resolve against the current page
    return urlsplit(urljoin(page_path, url)).path


def main():
    out_dir = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    queue = ["/"]
    seen = set(queue)
    pages, assets = {}, set()

    # 1. Crawl: discover all pages and assets
    while queue:
        path = queue.pop(0)
        url = BASE + path
        try:
            body = fetch(url)
        except Exception as e:
            print(f"WARN: failed {url}: {e}", file=sys.stderr)
            continue
        if is_page(path):
            html = body.decode("utf-8", errors="replace")
            pages[path] = html
            for _, link in LINK_RE.findall(html):
                frag_split = link.split("#", 1)[0]
                if not frag_split:
                    continue
                ipath = internal_path(frag_split, path)
                if ipath is None:
                    continue
                ipath = normalize(ipath)
                if ipath in seen:
                    continue
                seen.add(ipath)
                if is_page(ipath):
                    queue.append(ipath)
                else:
                    assets.add(ipath)
        else:
            assets.add(path)
        print(f"crawled {path}  (queue={len(queue)})")

    # 2. Download assets (and assets referenced from CSS)
    asset_bodies = {}
    asset_queue = sorted(assets)
    while asset_queue:
        path = asset_queue.pop(0)
        try:
            body = fetch(BASE + path)
        except Exception as e:
            print(f"WARN: failed asset {path}: {e}", file=sys.stderr)
            continue
        asset_bodies[path] = body
        if path.endswith(".css"):
            css = body.decode("utf-8", errors="replace")
            for _, ref in CSS_URL_RE.findall(css):
                if ref.startswith("data:"):
                    continue
                ipath = internal_path(ref, path)
                if ipath and ipath not in asset_bodies and ipath not in asset_queue:
                    asset_queue.append(ipath)
        print(f"asset   {path}")

    # 3. Localize external CDN scripts
    for ext_url, local_path in EXTERNAL_SCRIPTS.items():
        try:
            asset_bodies[local_path] = fetch(ext_url)
            print(f"vendor  {ext_url} -> {local_path}")
        except Exception as e:
            print(f"WARN: failed vendor {ext_url}: {e}", file=sys.stderr)

    # 4. Rewrite links in every page and write files
    def make_rewriter(page_path):
        def sub(m):
            attr, link = m.group(1), m.group(2)
            for ext_url, local_path in EXTERNAL_SCRIPTS.items():
                if link == ext_url:
                    return f'{attr}="{rel_link(page_path, local_path)}"'
            url_part, _, frag = link.partition("#")
            if not url_part:  # pure fragment
                return m.group(0)
            ipath = internal_path(url_part, page_path)
            if ipath is None:
                return m.group(0)
            new = rel_link(page_path, normalize(ipath))
            if frag:
                new += "#" + frag
            return f'{attr}="{new}"'
        return sub

    for path, html in pages.items():
        html = LINK_RE.sub(make_rewriter(path), html)
        dest = os.path.join(out_dir, local_file(path))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            f.write(html)

    for path, body in asset_bodies.items():
        dest = os.path.join(out_dir, local_file(path))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(body)

    print(f"\nDone: {len(pages)} pages, {len(asset_bodies)} assets -> {out_dir}")


if __name__ == "__main__":
    main()
