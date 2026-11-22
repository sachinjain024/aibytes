"""Tests for generate-newsletter-content/scripts/publish_gists.py.

Offline. The git, gists and gh commands go through a fake runner that records
them and answers `git status` with a canned porcelain listing, so the order of
the publish (fresh base, build, gists-only commit, PR, squash merge, cleanup,
sync) is checked without a remote. No network, no real PR.
"""

import importlib.util
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / ".claude" / "skills" / "generate-newsletter-content" / "scripts" / "publish_gists.py"


def load_script():
    spec = importlib.util.spec_from_file_location("publish_gists", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


pg = load_script()

PORCELAIN = (" M content/gists/index.json\n"
             " M content/gists/gh-minimind.json\n"
             "?? content/gists/ph-creatify-max.json\n"
             "?? content/gists/x-theo-with-yet-another-unexpectedly-good.json\n")


class FakeRun:
    """Records commands; answers the few whose output publish() reads."""

    def __init__(self, gist_changes=PORCELAIN, local_changes="", fail_on=None, branch_exists=True):
        self.calls = []
        self.gist_changes = gist_changes
        self.local_changes = local_changes
        self.fail_on = fail_on
        self.branch_exists = branch_exists
        self.worktree = None

    def __call__(self, cmd, cwd=None):
        cmd = [str(c) for c in cmd]
        self.calls.append(cmd)
        joined = " ".join(cmd)
        if self.fail_on and self.fail_on in joined:
            raise pg.PublishError(f"{self.fail_on} failed")
        if cmd[:2] == ["git", "-C"] and "worktree" in cmd and "add" in cmd:
            self.worktree = cmd[-2]
        if "status" in cmd and "--porcelain" in cmd:
            return self.gist_changes if cmd[2] == self.worktree else self.local_changes
        if cmd[:3] == ["gh", "pr", "create"]:
            return "https://github.com/owner/repo/pull/99\n"
        if "branch" in cmd and "--list" in cmd:
            return "  issue-19-gists\n" if self.branch_exists else ""
        return ""

    def ran(self, *needle):
        return [c for c in self.calls if all(n in c for n in needle)]


class TestParseChanges(unittest.TestCase):
    def test_new_and_updated(self):
        changed, new = pg.parse_changes(PORCELAIN)
        self.assertEqual(len(changed), 4)
        self.assertEqual(new, ["ph-creatify-max", "x-theo-with-yet-another-unexpectedly-good"])

    def test_index_is_never_a_new_slug(self):
        _, new = pg.parse_changes("A  content/gists/index.json\n")
        self.assertEqual(new, [])


OLD = '{"slug": "gh-minimind", "updated_at": "2026-11-22T04:36:39Z", "stats": {"stars": 1}, "stats_as_of": "2026-11-22T04:36:39Z"}'
BUMPED = '{"slug": "gh-minimind", "updated_at": "2026-11-22T05:10:45Z", "stats": {"stars": 1}, "stats_as_of": "2026-11-22T05:10:45Z"}'
REAL = '{"slug": "gh-minimind", "updated_at": "2026-11-22T05:10:45Z", "stats": {"stars": 2}, "stats_as_of": "2026-11-22T05:10:45Z"}'


class TestTimestampOnly(unittest.TestCase):
    def test_timestamps_alone_are_not_a_change(self):
        self.assertTrue(pg.timestamp_only(OLD, BUMPED))
        self.assertFalse(pg.timestamp_only(OLD, REAL))
        self.assertFalse(pg.timestamp_only(OLD, "not json"))

    def test_rerun_of_a_published_issue_has_nothing_to_publish(self):
        with tempfile.TemporaryDirectory() as tree:
            gists = pathlib.Path(tree) / "content" / "gists"
            gists.mkdir(parents=True)
            (gists / "gh-minimind.json").write_text(BUMPED)
            (gists / "gh-new.json").write_text(REAL)
            calls = []

            def run(cmd, cwd=None):
                calls.append([str(c) for c in cmd])
                return OLD if "show" in calls[-1] else ""
            left = pg.revert_timestamp_only(
                tree, " M content/gists/gh-minimind.json\n?? content/gists/gh-new.json\n", run=run)
            self.assertEqual(left, "?? content/gists/gh-new.json")
            self.assertEqual(calls[-1][-1], "content/gists/gh-minimind.json")
            self.assertIn("checkout", calls[-1])


class TestWaitLive(unittest.TestCase):
    def test_returns_what_never_came_up(self):
        live = {"a"}
        left = pg.wait_live(["a", "b"], 0, check=lambda s: s in live, sleep=lambda _: None)
        self.assertEqual(left, ["b"])

    def test_waits_until_live(self):
        seen = {"n": 0}

        def check(slug):
            seen["n"] += 1
            return seen["n"] > 2
        self.assertEqual(pg.wait_live(["a"], 60, check=check, sleep=lambda _: None), [])


class TestPublish(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = pathlib.Path(self.tmp.name)
        (self.repo / ".cache" / "gists" / "issue-19").mkdir(parents=True)
        (self.repo / ".cache" / "gists" / "issue-19" / "items.json").write_text("{}")

    def tearDown(self):
        self.tmp.cleanup()

    def publish(self, run, **kw):
        return pg.publish("issue-19", repo=self.repo, run=run, tmp_root=self.tmp.name, **kw)

    def test_full_publish_order(self):
        run = FakeRun()
        report = self.publish(run)
        order = [" ".join(c) for c in run.calls]

        def idx(fragment):
            return next(i for i, c in enumerate(order) if fragment in c)
        self.assertLess(idx("fetch --quiet origin main"), idx("worktree add"))
        self.assertIn("origin/main", run.ran("worktree", "add")[0])
        self.assertLess(idx("gists.py draft"), idx("gists.py build"))
        self.assertLess(idx("gists.py build"), idx("switch --quiet -c issue-19-gists"))
        self.assertEqual(run.ran("add", "--")[0][-1], "content/gists")
        self.assertLess(idx("commit"), idx("push --quiet --force"))
        self.assertLess(idx("gh pr create"), idx("gh pr merge"))
        self.assertIn("--squash", run.ran("gh", "merge")[0])
        self.assertLess(idx("gh pr merge"), idx("worktree remove"))
        self.assertTrue(run.ran("push", "--delete", "issue-19-gists"))
        self.assertTrue(run.ran("merge", "--no-edit", "origin/main"))
        self.assertEqual(report["pr"], "https://github.com/owner/repo/pull/99")
        self.assertTrue(report["merged"] and report["synced"])
        self.assertEqual(len(report["new"]), 2)

    def test_build_reads_this_checkout_and_writes_the_fresh_base(self):
        run = FakeRun()
        self.publish(run)
        build = run.ran("build")[0]
        self.assertEqual(build[build.index("--cache-root") + 1], str((self.repo / ".cache" / "gists").resolve()))
        self.assertTrue(build[build.index("--content-root") + 1].startswith(run.worktree))
        draft = run.ran("draft")[0]
        self.assertEqual(draft[draft.index("--data-root") + 1], str((self.repo / "newsletter" / "data").resolve()))

    def test_nothing_to_publish(self):
        run = FakeRun(gist_changes="")
        report = self.publish(run)
        self.assertEqual(report["changed"], [])
        self.assertFalse(run.ran("commit"))
        self.assertFalse(run.ran("gh", "pr", "create"))
        self.assertTrue(run.ran("worktree", "remove"))

    def test_dry_run_pushes_nothing(self):
        run = FakeRun()
        report = self.publish(run, dry_run=True)
        self.assertEqual(len(report["changed"]), 4)
        self.assertFalse(run.ran("push"))
        self.assertFalse(run.ran("gh"))

    def test_no_merge_leaves_the_pr_and_its_branch(self):
        run = FakeRun()
        report = self.publish(run, merge=False)
        self.assertEqual(report["pr"], "https://github.com/owner/repo/pull/99")
        self.assertFalse(run.ran("gh", "pr", "merge"))
        self.assertFalse(run.ran("push", "--delete"))

    def test_failed_build_still_removes_the_worktree(self):
        run = FakeRun(fail_on="gists.py build")
        with self.assertRaises(pg.PublishError):
            self.publish(run)
        self.assertTrue(run.ran("worktree", "remove"))
        self.assertFalse(run.ran("push"))

    def test_local_gist_changes_block_the_sync(self):
        run = FakeRun(local_changes=" M content/gists/index.json\n")
        report = self.publish(run)
        self.assertFalse(report["synced"])
        self.assertIn("sync_skipped", report)
        self.assertFalse(run.ran("merge", "--no-edit"))

    def test_missing_items_json_is_refused(self):
        (self.repo / ".cache" / "gists" / "issue-19" / "items.json").unlink()
        with self.assertRaises(pg.PublishError):
            self.publish(FakeRun())


if __name__ == "__main__":
    unittest.main()
