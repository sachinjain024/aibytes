#!/usr/bin/env python3
"""Run every AIBytes source fetch skill and verify its snapshot.

Defaults to the weekly newsletter cadence. Pass --cadence daily to drive the
same child skills for the app feed; the cadence is forwarded to every child, so
the snapshots land under the matching period folder.

The source list, aliases and snapshot layout all come from packages/fetchers -
this script only orchestrates the child processes.
"""

import argparse
import datetime as dt
import pathlib
import subprocess
import sys
from dataclasses import dataclass


REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
SKILLS_ROOT = REPO_ROOT / ".claude" / "skills"
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import layout, registry, window as window_mod


@dataclass(frozen=True)
class SkillSpec:
    """A child skill paired with the packages/fetchers source it wraps."""

    name: str
    script: str
    source_name: str
    supports_days: bool = False
    supports_github_since: bool = False
    supports_github_languages: bool = False
    supports_techcrunch_no_hn: bool = False

    @property
    def source(self):
        return registry.resolve(self.source_name)

    @property
    def snapshot(self):
        """Path fragment below the period folder, e.g. news/hackernews/hn_data.json."""
        return "/".join((*self.source.SUBPATH, self.source.FILENAME))

    @property
    def aliases(self):
        source = self.source
        return tuple(
            sorted(
                {source.NAME}
                | {a for a, canonical in registry.ALIASES.items() if canonical == source.NAME}
            )
        )


# Add new source fetch skills here and update SKILL.md/tests together. The
# snapshot path and aliases are derived from the source module, so a new source
# only needs its name and script here.
SKILLS = (
    SkillSpec(
        name="ph-fetch-items",
        script="fetch_ph_items.py",
        source_name="producthunt",
        supports_days=True,
    ),
    SkillSpec(
        name="hn-fetch-items",
        script="fetch_hn_items.py",
        source_name="hackernews",
        supports_days=True,
    ),
    SkillSpec(
        name="tc-fetch-items",
        script="fetch_tc_items.py",
        source_name="techcrunch",
        supports_days=True,
        supports_techcrunch_no_hn=True,
    ),
    SkillSpec(
        name="gh-fetch-items",
        script="fetch_gh_items.py",
        source_name="github",
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


def snapshot_path(output_root, as_of, spec, cadence=window_mod.DEFAULT_CADENCE):
    source = spec.source
    return layout.snapshot_path(
        output_root, as_of, cadence, source.SUBPATH, source.FILENAME, repo_root=REPO_ROOT
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
    cadence = getattr(args, "cadence", None)
    if cadence:
        cmd.extend(["--cadence", cadence])
    if args.count is not None:
        cmd.extend(["--count", str(args.count)])
    if spec.supports_days and args.days is not None:
        cmd.extend(["--days", str(args.days)])
    # Unset means "follow the cadence", which the child resolves itself.
    if spec.supports_github_since and args.github_since:
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
    expected = snapshot_path(args.output_root, as_of, spec, getattr(args, "cadence", None)
                             or window_mod.DEFAULT_CADENCE)
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
    parser.add_argument(
        "--cadence",
        choices=sorted(window_mod.CADENCES),
        default=window_mod.DEFAULT_CADENCE,
        help=f"cadence forwarded to every child skill (default {window_mod.DEFAULT_CADENCE})",
    )
    parser.add_argument("--output-root", default="newsletter/data", help="root data directory (default newsletter/data)")
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
        default=None,
        help="GitHub trending window passed to gh-fetch-items (default: follows --cadence)",
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

    print(f"fetching {len(selected)} source(s) for {args.date} ({args.cadence})")
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
