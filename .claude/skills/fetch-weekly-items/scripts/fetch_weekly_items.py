#!/usr/bin/env python3
"""Run every weekly AIBytes source fetch skill and verify its snapshot."""

import argparse
import datetime as dt
import pathlib
import subprocess
import sys
from dataclasses import dataclass


REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
SKILLS_ROOT = REPO_ROOT / ".claude" / "skills"


@dataclass(frozen=True)
class SkillSpec:
    name: str
    script: str
    snapshot: str
    aliases: tuple
    supports_days: bool = False
    supports_github_since: bool = False
    supports_github_languages: bool = False
    supports_techcrunch_no_hn: bool = False


# Add new weekly source fetch skills here and update SKILL.md/tests together.
SKILLS = (
    SkillSpec(
        name="ph-fetch-items",
        script="fetch_ph_items.py",
        snapshot="producthunt/ph_data.json",
        aliases=("ph", "producthunt", "product-hunt"),
        supports_days=True,
    ),
    SkillSpec(
        name="hn-fetch-items",
        script="fetch_hn_items.py",
        snapshot="news/hackernews/hn_data.json",
        aliases=("hn", "hackernews", "hacker-news"),
        supports_days=True,
    ),
    SkillSpec(
        name="tc-fetch-items",
        script="fetch_tc_items.py",
        snapshot="news/techcrunch/tc_data.json",
        aliases=("tc", "techcrunch", "tech-crunch"),
        supports_days=True,
        supports_techcrunch_no_hn=True,
    ),
    SkillSpec(
        name="gh-fetch-items",
        script="fetch_gh_items.py",
        snapshot="github/gh_data.json",
        aliases=("gh", "github", "github-trending"),
        supports_github_since=True,
        supports_github_languages=True,
    ),
)


def parse_date(raw):
    if raw:
        return dt.date.fromisoformat(raw)
    return dt.date.today()


def source_lookup():
    lookup = {}
    for spec in SKILLS:
        lookup[spec.name] = spec.name
        for alias in spec.aliases:
            lookup[alias] = spec.name
    return lookup


def normalize_skips(raw_skips):
    lookup = source_lookup()
    skips = set()
    unknown = []
    for raw in raw_skips:
        key = raw.strip().lower()
        if key in lookup:
            skips.add(lookup[key])
        else:
            unknown.append(raw)
    if unknown:
        valid = sorted(lookup)
        raise SystemExit(
            "unknown --skip value(s): "
            + ", ".join(unknown)
            + "\nvalid values: "
            + ", ".join(valid)
        )
    return skips


def output_root_path(output_root):
    root = pathlib.Path(output_root)
    if root.is_absolute():
        return root
    return REPO_ROOT / root


def snapshot_path(output_root, as_of, spec):
    _, week, _ = as_of.isocalendar()
    return (
        output_root_path(output_root)
        / f"{as_of.year:04d}"
        / f"{as_of.month:02d}"
        / "weeks"
        / f"week-{week:02d}"
        / spec.snapshot
    )


def build_command(spec, args):
    script_path = SKILLS_ROOT / spec.name / "scripts" / spec.script
    cmd = [
        sys.executable,
        str(script_path),
        "--date",
        args.date,
        "--output-root",
        args.output_root,
    ]
    if args.count is not None:
        cmd.extend(["--count", str(args.count)])
    if spec.supports_days and args.days is not None:
        cmd.extend(["--days", str(args.days)])
    if spec.supports_github_since:
        cmd.extend(["--since", args.github_since])
    if spec.supports_github_languages and args.github_languages:
        cmd.append("--languages")
        cmd.extend(args.github_languages)
    if spec.supports_techcrunch_no_hn and args.techcrunch_no_hn:
        cmd.append("--no-hn")
    return cmd


def display_path(path):
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def run_skill(spec, args, as_of):
    expected = snapshot_path(args.output_root, as_of, spec)
    cmd = build_command(spec, args)

    print(f"==> {spec.name}")
    if args.dry_run:
        print(" ".join(cmd))
        print(f"would verify {display_path(expected)}")
        return True, expected

    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=REPO_ROOT)
    if proc.stdout:
        print(proc.stdout, end="" if proc.stdout.endswith("\n") else "\n")
    if proc.stderr:
        print(proc.stderr, file=sys.stderr, end="" if proc.stderr.endswith("\n") else "\n")

    if proc.returncode != 0:
        print(f"{spec.name} failed with exit code {proc.returncode}", file=sys.stderr)
        return False, expected
    if not expected.is_file():
        print(f"{spec.name} did not write expected snapshot: {expected}", file=sys.stderr)
        return False, expected
    return True, expected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", help="as-of date, YYYY-MM-DD (default today)")
    parser.add_argument("--output-root", default="data", help="root data directory (default data)")
    parser.add_argument("--count", type=int, help="override item count for every child skill")
    parser.add_argument(
        "--days",
        type=int,
        help="override date window for ProductHunt, HackerNews, and TechCrunch",
    )
    parser.add_argument(
        "--skip",
        action="append",
        default=[],
        metavar="SOURCE",
        help="skip a source; repeatable: producthunt, hackernews, techcrunch, github",
    )
    parser.add_argument(
        "--keep-going",
        action="store_true",
        help="continue after failures, then exit nonzero if any source failed",
    )
    parser.add_argument(
        "--github-since",
        choices=("daily", "weekly", "monthly"),
        default="weekly",
        help="GitHub trending window passed to gh-fetch-items (default weekly)",
    )
    parser.add_argument(
        "--github-languages",
        nargs="*",
        default=[],
        help="extra GitHub language trending pages to merge, e.g. python jupyter-notebook",
    )
    parser.add_argument(
        "--techcrunch-no-hn",
        action="store_true",
        help="pass --no-hn to tc-fetch-items",
    )
    parser.add_argument("--dry-run", action="store_true", help="print child commands without running")
    args = parser.parse_args()

    as_of = parse_date(args.date)
    args.date = as_of.isoformat()
    skips = normalize_skips(args.skip)

    selected = [spec for spec in SKILLS if spec.name not in skips]
    if not selected:
        raise SystemExit("no sources selected")

    print(f"fetching {len(selected)} source(s) for {args.date}")
    results = []
    for spec in selected:
        ok, expected = run_skill(spec, args, as_of)
        results.append((spec, ok, expected))
        if not ok and not args.keep_going:
            break

    print("\nsummary:")
    for spec, ok, expected in results:
        status = "ok" if ok else "failed"
        print(f"  {status:6} {spec.name:15} {display_path(expected)}")

    if not all(ok for _, ok, _ in results):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
