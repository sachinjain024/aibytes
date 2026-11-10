#!/usr/bin/env python3
"""Build the page published as an aiBytes_ issue's review artifact on claude.ai.

The publisher reviews each issue as a Claude artifact, where they can leave
comments and ask for edits. The artifact is the Substack export page itself -
the title, the subtitle and the body as Substack will show them, with the same
copy buttons - so what gets reviewed is what gets pasted. The artifact host
wraps the page in its own doctype, <head> and <body>, so this keeps only what
the page brings: a <title> naming the issue, the font links, the <style>, and
the body's content, script included.

    issue_artifact.py --issue newsletter/issues/2026/week-46-Issue-17/aiBytes-issue-17.html \
        --out /path/to/scratch/aiBytes-issue-17-artifact.html

The issue HTML stays the source of truth: every edit lands there first, then
this page and the Substack export are rebuilt from it.
"""

import argparse
import importlib.util
import pathlib
import re
import sys

_SPEC = importlib.util.spec_from_file_location(
    "substack_export", pathlib.Path(__file__).resolve().parent / "substack_export.py")
substack_export = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(substack_export)


def strip_skeleton(doc, num):
    """The parts of a full HTML document an artifact page carries itself."""
    head = re.search(r"<head>(.*?)</head>", doc, re.S)
    body = re.search(r"<body>(.*?)</body>", doc, re.S)
    if not head or not body:
        raise ValueError("page has no <head> or <body>")
    links = re.findall(r'<link [^>]*href="https://fonts\.googleapis\.com[^>]*>', head.group(1))
    styles = re.findall(r"<style>.*?</style>", head.group(1), re.S)
    return "\n".join([f"<title>aiBytes_ Issue #{num}</title>", *links, *styles, body.group(1).strip()]) + "\n"


def build(issue_html):
    result = substack_export.convert(issue_html)
    return strip_skeleton(substack_export.page(result), result["num"])


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--issue", required=True, help="the finished aiBytes-issue-{num}.html")
    p.add_argument("--out", required=True, help="where to write the artifact page")
    args = p.parse_args(argv)
    try:
        page = build(pathlib.Path(args.issue).read_text(encoding="utf-8"))
    except (ValueError, AttributeError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
