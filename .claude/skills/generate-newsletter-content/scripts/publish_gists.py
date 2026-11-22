#!/usr/bin/env python3
"""Publish a weekly issue's gists to aibytes.io before the newsletter goes out.

GitHub Pages builds the site from `main` only, so a gist reaches
aibytes.io/gists/<slug> only once it is on `main`. Issue 19 went out on
Substack while its gist links still 404'd, because the gists rode in the issue
PR. This script ships them first, as soon as the issue's rows are chosen and
Claude has written gists.json:

1. Fetches `origin/main` and checks it out in a temporary worktree outside the
   repo, so a daily edition that landed meanwhile is the base (no conflicts in
   content/gists/index.json).
2. Runs `gists draft --issue` and `gists build --issue` there, reading the
   issue's snapshots and .cache/gists from this checkout.
3. Commits only content/gists/ on `issue-N-gists`, pushes it, opens a PR and
   squash-merges it. The merge is a push to main, which deploys Pages.
4. Removes the temporary worktree and the remote branch.
5. With --wait, polls aibytes.io until the gist pages answer 200.
6. Merges origin/main into the current (issue) branch, so the issue HTML is
   written against the published content/gists/index.json.

    python3 .claude/skills/generate-newsletter-content/scripts/publish_gists.py \\
      --issue issue-19 --wait 600

A rerun after a row changes publishes only what changed; with nothing to
publish it exits 0 without a PR. --dry-run builds and reports without pushing.
"""

import argparse
import json
import pathlib
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[4]
GIST_URL = "https://aibytes.io/gists/{slug}"
GISTS_DIR = "content/gists"


class PublishError(Exception):
    pass


def sh(cmd, cwd=None):
    """Run a command and return its stdout; raise PublishError on failure."""
    proc = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise PublishError(f"{' '.join(str(c) for c in cmd)} failed:\n{proc.stderr.strip() or proc.stdout.strip()}")
    return proc.stdout


def parse_changes(porcelain):
    """(changed paths, new slugs) from `git status --porcelain -uall content/gists`."""
    changed, new = [], []
    for line in porcelain.splitlines():
        if len(line) < 4:
            continue
        status, path = line[:2], line[3:].strip()
        if not path.endswith(".json"):
            continue
        changed.append(path)
        name = pathlib.PurePosixPath(path).name
        if status.strip() in ("??", "A") and name != "index.json":
            new.append(name[: -len(".json")])
    return changed, new


# A rebuild of an already-published gist bumps these and nothing else.
TIMESTAMP_KEYS = frozenset(("updated_at", "stats_as_of", "generated_at"))


def _without_timestamps(value):
    if isinstance(value, dict):
        return {k: _without_timestamps(v) for k, v in value.items() if k not in TIMESTAMP_KEYS}
    if isinstance(value, list):
        return [_without_timestamps(v) for v in value]
    return value


def timestamp_only(old_text, new_text):
    """True when two versions of a gist file differ only in their timestamps."""
    try:
        return _without_timestamps(json.loads(old_text)) == _without_timestamps(json.loads(new_text))
    except ValueError:
        return False


def revert_timestamp_only(tree, porcelain, run=sh):
    """Restore modified files whose only change is a timestamp, so a rerun of an
    already-published issue makes no PR. Returns the porcelain that is left."""
    kept, revert = [], []
    for line in porcelain.splitlines():
        if len(line) < 4:
            continue
        status, path = line[:2], line[3:].strip()
        if status.strip() == "M" and path.endswith(".json"):
            try:
                old = run(["git", "-C", tree, "show", f"HEAD:{path}"])
                new = (pathlib.Path(tree) / path).read_text(encoding="utf-8")
            except (PublishError, OSError):
                old = new = None
            if old is not None and timestamp_only(old, new):
                revert.append(path)
                continue
        kept.append((line, path))
    if revert:
        run(["git", "-C", tree, "checkout", "--", *revert])
    return "\n".join(line for line, _ in kept)


def gist_live(slug, timeout=10):
    try:
        with urllib.request.urlopen(GIST_URL.format(slug=slug), timeout=timeout) as resp:
            return resp.status == 200
    except (urllib.error.URLError, OSError):
        return False


def wait_live(slugs, seconds, poll=15, check=gist_live, sleep=time.sleep):
    """Wait until every slug answers 200, or give up after `seconds`."""
    deadline = time.monotonic() + seconds
    pending = list(slugs)
    while pending:
        pending = [s for s in pending if not check(s)]
        if not pending or time.monotonic() >= deadline:
            break
        sleep(poll)
    return pending


def publish(issue, repo=REPO_ROOT, data_root=None, cache_root=None, base="main", remote="origin",
            merge=True, dry_run=False, sync=True, run=sh, tmp_root=None):
    """Build the issue's gists on a fresh base and ship them. Returns a report dict."""
    repo = pathlib.Path(repo).resolve()
    data_root = pathlib.Path(data_root or repo / "newsletter" / "data").resolve()
    cache_root = pathlib.Path(cache_root or repo / ".cache" / "gists").resolve()
    if not (cache_root / issue / "items.json").is_file():
        raise PublishError(f"{cache_root / issue / 'items.json'} is missing: write the issue's items.json first")

    num = issue.split("-")[-1]
    branch = f"{issue}-gists"
    report = {"issue": issue, "branch": branch, "changed": [], "new": [], "pr": None,
              "merged": False, "synced": False}

    run(["git", "-C", repo, "fetch", "--quiet", remote, base])
    tmp = pathlib.Path(tempfile.mkdtemp(prefix=f"gists-{issue}-", dir=tmp_root))
    run(["git", "-C", repo, "worktree", "add", "--quiet", "--detach", tmp, f"{remote}/{base}"])
    pushed = False
    try:
        gists = tmp / "packages" / "gists" / "gists.py"
        common = ["--issue", issue, "--content-root", tmp / "content", "--cache-root", cache_root]
        run([sys.executable, gists, "draft", *common, "--data-root", data_root], cwd=tmp)
        print(run([sys.executable, gists, "build", *common], cwd=tmp).strip(), file=sys.stderr)

        porcelain = run(["git", "-C", tmp, "status", "--porcelain", "-uall", GISTS_DIR])
        changed, new = parse_changes(revert_timestamp_only(tmp, porcelain, run=run))
        report["changed"], report["new"] = changed, new
        if not changed or dry_run:
            return report

        run(["git", "-C", tmp, "switch", "--quiet", "-c", branch])
        run(["git", "-C", tmp, "add", "--", GISTS_DIR])
        run(["git", "-C", tmp, "commit", "--quiet", "-m",
             f"Issue #{num} gists: {len(new)} new, {len(changed) - len(new)} updated\n\n"
             f"Published before the send so the email's gist links resolve. Built on {remote}/{base} "
             f"by generate-newsletter-content/scripts/publish_gists.py; {GISTS_DIR} only."])
        run(["git", "-C", tmp, "push", "--quiet", "--force", remote, f"{branch}:{branch}"])
        pushed = True
        body = (f"Gists for Issue #{num}, published before the newsletter so every gist link in the email "
                f"resolves.\n\n- {len(new)} new, {len(changed) - len(new)} updated, {GISTS_DIR} only\n"
                f"- Built on `{remote}/{base}` by `publish_gists.py`; merging deploys aibytes.io/gists\n\n"
                f"🤖 Generated with [Claude Code](https://claude.com/claude-code)")
        report["pr"] = run(["gh", "pr", "create", "--base", base, "--head", branch,
                            "--title", f"Issue #{num} gists", "--body", body], cwd=tmp).strip().splitlines()[-1]
        if not merge:
            pushed = False  # leave the branch for the open PR
            return report
        run(["gh", "pr", "merge", report["pr"], "--squash"], cwd=tmp)
        report["merged"] = True
    finally:
        run(["git", "-C", repo, "worktree", "remove", "--force", tmp])
        if _has_branch(run, repo, branch):
            run(["git", "-C", repo, "branch", "-D", branch])
        if pushed:
            run(["git", "-C", repo, "push", "--quiet", remote, "--delete", branch])

    if sync:
        local = run(["git", "-C", repo, "status", "--porcelain", "-uall", GISTS_DIR]).strip()
        if local:
            report["sync_skipped"] = (f"{GISTS_DIR} has local changes in this checkout; discard them "
                                      f"(git checkout -- {GISTS_DIR} && git clean -fd {GISTS_DIR}) and merge {remote}/{base}")
        else:
            run(["git", "-C", repo, "fetch", "--quiet", remote, base])
            run(["git", "-C", repo, "merge", "--quiet", "--no-edit", f"{remote}/{base}"])
            report["synced"] = True
    return report


def _has_branch(run, repo, branch):
    return bool(run(["git", "-C", repo, "branch", "--list", branch]).strip())


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--issue", required=True, help="the issue slug, issue-N")
    parser.add_argument("--data-root", help="the snapshots (default newsletter/data in this checkout)")
    parser.add_argument("--cache-root", help="the gists cache (default .cache/gists in this checkout)")
    parser.add_argument("--base", default="main")
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--no-merge", action="store_true", help="open the PR but leave it unmerged")
    parser.add_argument("--no-sync", action="store_true", help="do not merge the base into this branch afterwards")
    parser.add_argument("--dry-run", action="store_true", help="build on the fresh base and report; push nothing")
    parser.add_argument("--wait", type=int, default=0, metavar="SECONDS",
                        help="after merging, wait up to this long for the new gist pages to go live")
    args = parser.parse_args(argv)

    try:
        report = publish(args.issue, data_root=args.data_root, cache_root=args.cache_root, base=args.base,
                         remote=args.remote, merge=not args.no_merge, dry_run=args.dry_run,
                         sync=not args.no_sync)
    except PublishError as err:
        print(f"error: {err}", file=sys.stderr)
        return 1
    if report["merged"] and args.wait:
        slugs = report["new"] or [pathlib.PurePosixPath(p).stem for p in report["changed"]
                                  if not p.endswith("index.json")][:3]
        report["not_live"] = wait_live(slugs, args.wait)
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
