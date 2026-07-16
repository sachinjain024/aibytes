"""Live smoke tests: invoke each fetch-skill script end-to-end.

Each script runs exactly as a user would run it, except --output-root points
at a per-test temporary directory (the skills' test mode), so the committed
data/ tree is never touched; the temp dir is removed when the test ends.
These tests hit the real APIs — set AIBYTES_SKIP_LIVE=1 to skip the module
when offline.

When adding a new fetch skill, register it here as a test_* method asserting
its snapshot path, source name, and items key.
"""

import datetime as dt
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SKILLS = REPO_ROOT / ".claude" / "skills"
TIMEOUT = 300


def has_ph_key():
    env_file = REPO_ROOT / ".env"
    return env_file.is_file() and "PH_API_KEY" in env_file.read_text()


@unittest.skipIf(os.environ.get("AIBYTES_SKIP_LIVE") == "1", "AIBYTES_SKIP_LIVE=1")
class TestFetchSkillScripts(unittest.TestCase):
    def snapshot_path(self, root, as_of, rel_snapshot):
        _, week, _ = as_of.isocalendar()
        return (
            pathlib.Path(root)
            / f"{as_of.year:04d}"
            / f"{as_of.month:02d}"
            / "weeks"
            / f"week-{week:02d}"
            / rel_snapshot
        )

    def run_skill(self, skill, script, rel_snapshot, source, items_key, extra_args=()):
        """Run a skill script into a temp root and return the parsed snapshot."""
        tmp = tempfile.TemporaryDirectory(prefix=f"{skill}-test-")
        self.addCleanup(tmp.cleanup)
        as_of = dt.date.today()
        proc = subprocess.run(
            [
                sys.executable,
                str(SKILLS / skill / "scripts" / script),
                "--output-root",
                tmp.name,
                "--date",
                as_of.isoformat(),
                "--count",
                "3",
                *extra_args,
            ],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
            timeout=TIMEOUT,
        )
        self.assertEqual(proc.returncode, 0, f"{skill} failed:\n{proc.stderr}")

        snapshot = self.snapshot_path(tmp.name, as_of, rel_snapshot)
        self.assertTrue(snapshot.is_file(), f"missing snapshot {snapshot}\n{proc.stdout}")

        data = json.loads(snapshot.read_text())
        self.assertEqual(data["source"], source)
        self.assertEqual(data["fetched_at"], as_of.isoformat())
        items = data[items_key]
        self.assertIsInstance(items, list)
        self.assertGreater(len(items), 0, f"{skill} returned no items")
        self.assertLessEqual(len(items), 3)
        return data

    def assert_snapshot(self, root, as_of, rel_snapshot, source, items_key, max_items=3):
        snapshot = self.snapshot_path(root, as_of, rel_snapshot)
        self.assertTrue(snapshot.is_file(), f"missing snapshot {snapshot}")
        data = json.loads(snapshot.read_text())
        self.assertEqual(data["source"], source)
        self.assertEqual(data["fetched_at"], as_of.isoformat())
        items = data[items_key]
        self.assertIsInstance(items, list)
        self.assertGreater(len(items), 0)
        self.assertLessEqual(len(items), max_items)
        return data

    def test_gh_fetch_items(self):
        data = self.run_skill(
            "gh-fetch-items",
            "fetch_gh_items.py",
            "github/gh_data.json",
            "github-trending",
            "repos",
        )
        for repo in data["repos"]:
            self.assertRegex(repo["name"], r"^[^/]+/[^/]+")
            self.assertTrue(repo["url"].startswith("https://github.com/"))

    def test_hn_fetch_items(self):
        data = self.run_skill(
            "hn-fetch-items",
            "fetch_hn_items.py",
            "news/hackernews/hn_data.json",
            "hackernews",
            "stories",
        )
        for story in data["stories"]:
            self.assertGreaterEqual(story["points"], 50)

    def test_tc_fetch_items(self):
        # --no-hn skips the per-article HackerNews ranking round-trips to keep
        # the smoke test to one API; the offline default ranking is recency.
        self.run_skill(
            "tc-fetch-items",
            "fetch_tc_items.py",
            "news/techcrunch/tc_data.json",
            "techcrunch",
            "articles",
            extra_args=("--no-hn",),
        )

    @unittest.skipUnless(has_ph_key(), "PH_API_KEY not present in .env")
    def test_ph_fetch_items(self):
        self.run_skill(
            "ph-fetch-items",
            "fetch_ph_items.py",
            "producthunt/ph_data.json",
            "producthunt",
            "posts",
        )

    def test_fetch_weekly_items(self):
        tmp = tempfile.TemporaryDirectory(prefix="fetch-weekly-items-test-")
        self.addCleanup(tmp.cleanup)
        as_of = dt.date.today()
        cmd = [
            sys.executable,
            str(SKILLS / "fetch-weekly-items" / "scripts" / "fetch_weekly_items.py"),
            "--output-root",
            tmp.name,
            "--date",
            as_of.isoformat(),
            "--count",
            "3",
            "--techcrunch-no-hn",
        ]
        expected = [
            ("github/gh_data.json", "github-trending", "repos"),
            ("news/hackernews/hn_data.json", "hackernews", "stories"),
            ("news/techcrunch/tc_data.json", "techcrunch", "articles"),
        ]
        if has_ph_key():
            expected.append(("producthunt/ph_data.json", "producthunt", "posts"))
        else:
            cmd.extend(["--skip", "producthunt"])

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
            timeout=TIMEOUT,
        )
        self.assertEqual(proc.returncode, 0, f"fetch-weekly-items failed:\n{proc.stderr}")

        for rel_snapshot, source, items_key in expected:
            self.assert_snapshot(tmp.name, as_of, rel_snapshot, source, items_key)


if __name__ == "__main__":
    unittest.main()
