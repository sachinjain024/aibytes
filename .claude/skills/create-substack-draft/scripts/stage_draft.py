#!/usr/bin/env python3
"""Stage a finished aiBytes_ issue for a Substack draft.

Reads the issue HTML through the generate-newsletter-content export
(`substack_export.convert`), so the body is exactly what the review artifact
showed. Prints the title, subtitle and per-section counts as JSON for the
browser steps, and puts the body on the macOS clipboard as HTML, so a real
cmd+v in Substack's editor pastes it with its formatting.

    python3 .claude/skills/create-substack-draft/scripts/stage_draft.py \\
      --issue newsletter/issues/2026/week-47-Issue-18/aiBytes-issue-18.html

--no-clipboard skips the clipboard (for tests, or off macOS); --body-out
writes the body to a file as well.
"""

import argparse
import importlib.util
import json
import pathlib
import shutil
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
EXPORT = REPO_ROOT / ".claude" / "skills" / "generate-newsletter-content" / "scripts" / "substack_export.py"


def load_export():
    spec = importlib.util.spec_from_file_location("substack_export", EXPORT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def stage(issue_html):
    """{"title", "subtitle", "num", "counts", "body"} for one finished issue."""
    return load_export().convert(issue_html)


def osascript_html(body):
    """The AppleScript that sets the clipboard to `body` as HTML."""
    return f"set the clipboard to «data HTML{body.encode('utf-8').hex().upper()}»"


def copy_html(body):
    if not shutil.which("osascript"):
        raise RuntimeError("osascript not found: the clipboard step needs macOS; rerun with --no-clipboard")
    subprocess.run(["osascript", "-e", osascript_html(body)], check=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--issue", required=True, help="the finished aiBytes-issue-{num}.html")
    parser.add_argument("--no-clipboard", action="store_true", help="print the fields only; leave the clipboard alone")
    parser.add_argument("--body-out", help="also write the body HTML to this file")
    args = parser.parse_args(argv)

    issue = pathlib.Path(args.issue)
    try:
        result = stage(issue.read_text(encoding="utf-8"))
    except (ValueError, AttributeError) as err:
        print(f"error: {issue}: {err}", file=sys.stderr)
        return 1
    if args.body_out:
        pathlib.Path(args.body_out).write_text(result["body"], encoding="utf-8")
    if not args.no_clipboard:
        try:
            copy_html(result["body"])
        except (RuntimeError, subprocess.CalledProcessError) as err:
            print(f"error: {err}", file=sys.stderr)
            return 1
    fields = {k: result[k] for k in ("num", "title", "subtitle", "counts")}
    fields["clipboard"] = not args.no_clipboard
    print(json.dumps(fields, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
