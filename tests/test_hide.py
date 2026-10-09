"""Offline unit tests for the admin hide script (packages/feed-schema/hide.py).

Hiding an item touches three files at once, and a half-applied hide leaves the
published tree lying about itself - the site skipping an item the edition bar
still counts. These tests cover that all three move together, that a rejected
request writes nothing at all, and that a hide can be taken back.
"""

import datetime as dt
import io
import json
import pathlib
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))

import hide as hide_mod
import validate as contract

FROZEN_NOW = dt.datetime(2026, 8, 27, 9, 30, tzinfo=dt.timezone.utc)


def item(item_id, category, **overrides):
    base = {
        "id": item_id,
        "title": "ChatCut",
        "summary": "AI video editor inside ChatGPT with a real timeline and XML export.",
        "url": "https://chatcut.ai",
        "source": "producthunt",
        "source_url": "https://www.producthunt.com/products/chatcut",
        "category": category,
        "tags": ["Video"],
        "image": {"type": "logo", "url": "https://ph-files.imgix.net/abc.png"},
        "hidden": False,
    }
    base.update(overrides)
    return base


class HideTestCase(unittest.TestCase):
    """A two-item edition with a matching index and an empty hide log."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        (self.root / "editions").mkdir()
        self.addCleanup(self.tmp.cleanup)

        self.write("tags.json", {
            "schema_version": 1,
            "groups": [{"name": "Domain", "tags": [{"name": "Video", "slug": "video"}]}],
        })
        self.write("editions/2026-08-27.json", {
            "schema_version": 1,
            "date": "2026-08-27",
            "generated_at": "2026-08-27T08:04:12Z",
            "counts": {"launches": 1, "repos": 1, "news": 0, "hn": 0},
            "items": [
                item("ph-chatcut-2026-08-27", "launches"),
                item("gh-ai-agent-book-2026-08-27", "repos"),
            ],
        })
        self.write("index.json", {
            "schema_version": 1,
            "generated_at": "2026-08-27T08:04:12Z",
            "editions": [{
                "date": "2026-08-27",
                "path": "editions/2026-08-27.json",
                "total": 2,
                "generated_at": "2026-08-27T08:04:12Z",
            }],
        })
        self.write("hidden.json", {"schema_version": 1, "hidden": []})

    def write(self, name, document):
        (self.root / name).write_text(json.dumps(document, indent=2) + "\n")

    def read(self, name):
        return json.loads((self.root / name).read_text())

    def hide(self, item_id, **kwargs):
        kwargs.setdefault("now", FROZEN_NOW)
        return hide_mod.hide(item_id, content_root=self.root, **kwargs)

    def snapshot(self):
        return {
            name: (self.root / name).read_text()
            for name in ("index.json", "hidden.json", "editions/2026-08-27.json")
        }


class TestHide(HideTestCase):
    def test_a_hide_moves_the_item_the_counts_the_total_and_the_log_together(self):
        summary = self.hide("ph-chatcut-2026-08-27", reason="duplicate launch")
        self.assertIn("1 visible item(s)", summary)

        edition = self.read("editions/2026-08-27.json")
        hidden_item = next(i for i in edition["items"] if i["id"] == "ph-chatcut-2026-08-27")
        self.assertTrue(hidden_item["hidden"])
        self.assertEqual(edition["counts"], {"launches": 0, "repos": 1, "news": 0, "hn": 0})

        self.assertEqual(self.read("index.json")["editions"][0]["total"], 1)

        log = self.read("hidden.json")["hidden"]
        self.assertEqual(len(log), 1)
        self.assertEqual(log[0]["id"], "ph-chatcut-2026-08-27")
        self.assertEqual(log[0]["edition_date"], "2026-08-27")
        self.assertEqual(log[0]["hidden_at"], "2026-08-27T09:30:00Z")
        self.assertEqual(log[0]["reason"], "duplicate launch")

    def test_the_tree_still_validates_after_a_hide(self):
        self.hide("ph-chatcut-2026-08-27")
        self.assertTrue(contract.validate_content_root(self.root))

    def test_a_ranked_edition_keeps_its_ranks_and_stays_valid(self):
        # rank covers hidden items too, so a hide must not renumber anything.
        edition = self.read("editions/2026-08-27.json")
        for rank, one in enumerate(edition["items"], start=1):
            one["rank"] = rank
        self.write("editions/2026-08-27.json", edition)
        self.hide("ph-chatcut-2026-08-27")
        after = self.read("editions/2026-08-27.json")["items"]
        self.assertEqual([one["rank"] for one in after], [1, 2])
        self.assertIsNotNone(contract.validate_content_root(self.root))

    def test_no_generated_at_is_touched(self):
        # A hide is not a curate run: "updated 4h ago" must not reset, and the
        # index's own timestamp tracks which editions exist, which is unchanged.
        self.hide("ph-chatcut-2026-08-27")
        self.assertEqual(self.read("editions/2026-08-27.json")["generated_at"],
                         "2026-08-27T08:04:12Z")
        self.assertEqual(self.read("index.json")["editions"][0]["generated_at"],
                         "2026-08-27T08:04:12Z")
        self.assertEqual(self.read("index.json")["generated_at"], "2026-08-27T08:04:12Z")

    def test_a_reason_is_optional(self):
        self.hide("ph-chatcut-2026-08-27")
        self.assertNotIn("reason", self.read("hidden.json")["hidden"][0])

    def test_hiding_twice_changes_nothing(self):
        self.hide("ph-chatcut-2026-08-27")
        before = self.snapshot()
        self.assertIn("already hidden", self.hide("ph-chatcut-2026-08-27"))
        self.assertEqual(self.snapshot(), before)

    def test_the_newest_hide_is_logged_first(self):
        self.hide("ph-chatcut-2026-08-27")
        self.hide("gh-ai-agent-book-2026-08-27",
                  now=FROZEN_NOW + dt.timedelta(hours=1))
        log = self.read("hidden.json")["hidden"]
        self.assertEqual([entry["id"] for entry in log],
                         ["gh-ai-agent-book-2026-08-27", "ph-chatcut-2026-08-27"])
        self.assertEqual(self.read("index.json")["editions"][0]["total"], 0)


class TestUnhide(HideTestCase):
    def test_unhide_restores_the_item_and_drops_the_log_entry(self):
        self.hide("ph-chatcut-2026-08-27", reason="duplicate launch")
        summary = self.hide("ph-chatcut-2026-08-27", unhide=True)
        self.assertIn("unhidden", summary)

        edition = self.read("editions/2026-08-27.json")
        self.assertFalse(edition["items"][0]["hidden"])
        self.assertEqual(edition["counts"]["launches"], 1)
        self.assertEqual(self.read("index.json")["editions"][0]["total"], 2)
        self.assertEqual(self.read("hidden.json")["hidden"], [])
        self.assertTrue(contract.validate_content_root(self.root))

    def test_unhiding_a_visible_item_changes_nothing(self):
        before = self.snapshot()
        self.assertIn("already visible", self.hide("ph-chatcut-2026-08-27", unhide=True))
        self.assertEqual(self.snapshot(), before)


class TestRejectedRequestsWriteNothing(HideTestCase):
    def assert_untouched(self, item_id, expected, **kwargs):
        before = self.snapshot()
        with self.assertRaises(hide_mod.HideError) as ctx:
            self.hide(item_id, **kwargs)
        self.assertIn(expected, str(ctx.exception))
        self.assertEqual(self.snapshot(), before)

    def test_an_id_that_is_not_shaped_like_one(self):
        self.assert_untouched("ChatCut", "is not an item id")

    def test_an_id_no_edition_contains(self):
        self.assert_untouched("ph-nothing-2026-08-27", "no item")

    def test_an_edition_that_does_not_exist(self):
        self.assert_untouched("ph-chatcut-2026-08-25", "is missing")

    def test_an_edition_the_index_has_not_caught_up_with(self):
        self.write("index.json", {
            "schema_version": 1,
            "generated_at": "2026-08-27T08:04:12Z",
            "editions": [],
        })
        self.assert_untouched("ph-chatcut-2026-08-27", "does not list 2026-08-27")

    def test_an_edition_that_is_already_invalid(self):
        # Nothing is written, so the operator fixes the real problem rather
        # than layering a hide on top of it.
        broken = self.read("editions/2026-08-27.json")
        broken["items"][1]["source"] = "reddit"
        self.write("editions/2026-08-27.json", broken)
        self.assert_untouched("ph-chatcut-2026-08-27", "would be invalid")

    def test_malformed_json(self):
        (self.root / "hidden.json").write_text("{ not json")
        self.assert_untouched("ph-chatcut-2026-08-27", "not valid JSON")


class TestPreExistingBreakage(HideTestCase):
    def test_a_problem_elsewhere_in_the_tree_is_reported_and_not_blamed_on_the_hide(self):
        # An edition the index never picked up. The hide itself is fine, so it
        # lands - but the operator has to hear that the tree is still wrong.
        self.write("editions/2026-08-26.json", {
            "schema_version": 1,
            "date": "2026-08-26",
            "generated_at": "2026-08-26T08:04:12Z",
            "counts": {"launches": 0, "repos": 0, "news": 0, "hn": 0},
            "items": [],
        })
        with self.assertRaises(hide_mod.HideError) as ctx:
            self.hide("ph-chatcut-2026-08-27")
        message = str(ctx.exception)
        self.assertIn("was written", message)
        self.assertIn("this hide did not cause", message)
        self.assertIn("does not list editions/2026-08-26.json", message)
        self.assertTrue(self.read("editions/2026-08-27.json")["items"][0]["hidden"])


class TestCli(HideTestCase):
    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = hide_mod.main([*argv, "--content-root", str(self.root)])
        return code, out.getvalue() + err.getvalue()

    def test_a_successful_hide_exits_zero(self):
        code, output = self.run_cli("ph-chatcut-2026-08-27", "--reason", "spam")
        self.assertEqual(code, 0)
        self.assertIn("hidden", output)
        self.assertEqual(self.read("index.json")["editions"][0]["total"], 1)

    def test_a_failure_exits_nonzero_without_a_traceback(self):
        code, output = self.run_cli("ph-nothing-2026-08-27")
        self.assertEqual(code, 1)
        self.assertIn("no item", output)

    def test_a_reason_with_unhide_is_refused(self):
        code, output = self.run_cli("ph-chatcut-2026-08-27", "--unhide", "--reason", "oops")
        self.assertEqual(code, 2)
        self.assertIn("--reason applies to a hide", output)


if __name__ == "__main__":
    unittest.main()
