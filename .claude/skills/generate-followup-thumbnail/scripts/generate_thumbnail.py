#!/usr/bin/env python3
"""Render the 1200x630 Beehiiv thumbnails for one aiBytes_ issue.

Reads a generated issue HTML, pulls the issue number, hex tag, date and
subject line out of it, fills assets/thumbnail.html once per background
variant, and screenshots each with headless Chrome at 2x before downsampling
to exactly 1200x630. Every run writes all three variants into the issue's
thumbnails/ folder; the pick happens at upload time in Beehiiv.

Stdlib only. The only external dependency is Google Chrome, which every macOS
box running this repo already has; --html-only skips it entirely.
"""

import argparse
import html
import os
import pathlib
import re
import shutil
import struct
import subprocess
import sys
import tempfile

WIDTH, HEIGHT = 1200, 630
SCALE = 2

# One card, three backgrounds - all rendered every run, chosen at upload time.
# Each name is a class on <body> gating its .card::before rule in the template.
VARIANTS = ("dot-grid", "cobalt-wash", "graph-grid")

SKILL_DIR = pathlib.Path(__file__).resolve().parents[1]
TEMPLATE = SKILL_DIR / "assets" / "thumbnail.html"

CHROME_CANDIDATES = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
)


# --------------------------------------------------------------- issue parsing

def find_chrome():
    for path in CHROME_CANDIDATES:
        if os.path.isfile(path):
            return path
    for name in ("google-chrome", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            return found
    return None


def strip_brand(subject):
    """'aiBytes_ 04: DeepMind's shake-up ...' -> 'DeepMind's shake-up ...'

    Only the wordmark comes off, in the older 'aiBytes_ 04: hook' and
    'aiBytes_ #4 - hook' forms, because it is already set on the card.

    The subject emoji deliberately stays (decided 2026-08-23). It is the same
    glyph the reader sees in their inbox, it makes the headline balance onto
    three lines instead of two, and it gives the card the one bit of colour
    the type cannot. Do not "fix" this by stripping it.
    """
    cleaned = re.sub(r"^\s*aiBytes_\s*#?\d*\s*[:\-]\s*", "", subject).strip()
    return cleaned or subject.strip()


def parse_issue(doc):
    """Pull the thumbnail's content out of a generated issue HTML."""
    def grab(pattern, default=""):
        match = re.search(pattern, doc, re.S)
        return html.unescape(match.group(1)).strip() if match else default

    subject = grab(r"<title>(.*?)</title>")
    tag = grab(r'<div class="issue-tag">(.*?)</div>')
    tag_text = re.sub(r"<[^>]+>", " ", tag)

    num = grab(r'<div class="logo">.*?#(\d+)\s*</div>')
    hex_num = grab(r"ISSUE\s+0x([0-9A-Fa-f]{2})")
    date = ""
    date_match = re.search(r"(\d{4}-\d{2}-\d{2})", tag_text)
    if date_match:
        date = date_match.group(1)

    if not num and hex_num:
        num = str(int(hex_num, 16))
    if not hex_num and num:
        hex_num = f"{int(num):02X}"

    # The card has no foot, so the section list and read time are not read here.
    return {
        "subject": subject,
        "headline": strip_brand(subject),
        "num": num,
        "hex": hex_num,
        "date": date,
    }


def highlight(headline, phrase):
    """Wrap the chosen phrase in <mark>, matched case-insensitively."""
    if not phrase:
        return html.escape(headline)
    match = re.search(re.escape(phrase), headline, re.I)
    if not match:
        raise SystemExit(
            f"--highlight {phrase!r} does not appear in the headline {headline!r}"
        )
    start, end = match.span()
    return (
        html.escape(headline[:start])
        + "<mark>"
        + html.escape(headline[start:end])
        + "</mark>"
        + html.escape(headline[end:])
    )


def build_html(issue, phrase=None, variant=VARIANTS[0], template=None):
    doc = (template or TEMPLATE.read_text())
    tokens = {
        "{{HEADLINE_HTML}}": highlight(issue["headline"], phrase),
        "{{ISSUE_HEX}}": issue["hex"],
        "{{ISSUE_NUM}}": issue["num"],
        "{{DATE_ISO}}": issue["date"],
        "{{VARIANT}}": variant,
    }
    for token, value in tokens.items():
        doc = doc.replace(token, value)
    leftover = re.findall(r"\{\{[A-Z_]+\}\}", doc)
    if leftover:
        raise SystemExit(f"unfilled tokens in thumbnail template: {sorted(set(leftover))}")
    return doc


# ------------------------------------------------------------------ rendering

def png_size(path):
    """Read width/height straight out of the PNG IHDR chunk."""
    with open(path, "rb") as handle:
        header = handle.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise SystemExit(f"{path} is not a PNG")
    return struct.unpack(">II", header[16:24])


def render_png(doc, out_path, chrome):
    with tempfile.TemporaryDirectory(prefix="aibytes-thumb-") as tmp:
        page = pathlib.Path(tmp) / "thumbnail.html"
        page.write_text(doc)
        shot = pathlib.Path(tmp) / "shot.png"
        subprocess.run(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                "--default-background-color=00000000",
                f"--force-device-scale-factor={SCALE}",
                f"--window-size={WIDTH},{HEIGHT}",
                f"--screenshot={shot}",
                "--virtual-time-budget=10000",
                page.as_uri(),
            ],
            check=True,
            capture_output=True,
            timeout=180,
        )
        if not shot.is_file():
            raise SystemExit("Chrome produced no screenshot")
        # Rendered at 2x for crisp type, then downsampled to the exact target.
        subprocess.run(
            ["sips", "-z", str(HEIGHT), str(WIDTH), str(shot), "--out", str(out_path)],
            check=True,
            capture_output=True,
        )
    return png_size(out_path)


# ----------------------------------------------------------------------- main

def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--issue-dir", required=True,
                        help="newsletter/{yyyy}/week-NN-Issue-N containing the issue HTML")
    parser.add_argument("--output-root",
                        help="write the PNG here instead of alongside the issue (tests)")
    parser.add_argument("--highlight",
                        help="phrase in the headline to mark in signal yellow")
    parser.add_argument("--headline", help="override the headline text")
    parser.add_argument("--html-only", action="store_true",
                        help="write the HTML and skip rendering (no Chrome needed)")
    args = parser.parse_args(argv)

    issue_dir = pathlib.Path(args.issue_dir)
    matches = sorted(issue_dir.glob("aiBytes-issue-*.html"))
    if not matches:
        raise SystemExit(f"no aiBytes-issue-*.html in {issue_dir}")

    issue = parse_issue(matches[0].read_text())
    if args.headline:
        issue["headline"] = args.headline
    if not issue["num"]:
        raise SystemExit(f"could not read an issue number from {matches[0]}")

    root = pathlib.Path(args.output_root) if args.output_root else issue_dir
    out_dir = root / "thumbnails"
    out_dir.mkdir(parents=True, exist_ok=True)

    docs = {v: build_html(issue, args.highlight, v) for v in VARIANTS}

    if args.html_only:
        for variant, doc in docs.items():
            out = out_dir / f"issue-{issue['num']}-thumbnail-{variant}.html"
            out.write_text(doc)
            print(f"wrote {out} (html only, not rendered)")
        return 0

    chrome = find_chrome()
    if not chrome:
        raise SystemExit(
            "Chrome not found. Install Google Chrome, or rerun with --html-only "
            "and screenshot the pages at 1200x630 by hand."
        )

    for variant, doc in docs.items():
        out = out_dir / f"issue-{issue['num']}-thumbnail-{variant}.png"
        width, height = render_png(doc, out, chrome)
        if (width, height) != (WIDTH, HEIGHT):
            raise SystemExit(f"{variant}: expected {WIDTH}x{HEIGHT}, got {width}x{height}")
        print(f"wrote {out} ({width}x{height}, {out.stat().st_size // 1024} KB)")
    print(f"  headline: {issue['headline']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
