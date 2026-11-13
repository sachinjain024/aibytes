"""Offline tests for packages/gists: the draft and build steps (AIB-145y T13, T15).

No network: every fetcher the draft calls is replaced. The spec is
docs/specs/AIB-145y-gist-generate.md.
"""

import json
import pathlib
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "gists"))

from aibytes_gists import draft as draft_mod  # noqa: E402  (sets up the sibling paths)
import gist_contract  # noqa: E402

DATE = "2026-11-11"


def item(item_id, source, url, source_url=None, **extra):
    category = {"techcrunch": "news", "hackernews": "hn", "github": "repos",
                "producthunt": "launches"}[source]
    return dict({"id": item_id, "title": item_id.rsplit("-", 3)[0].title(), "summary": "One line.",
                 "url": url, "source": source, "source_url": source_url or url,
                 "category": category, "tags": ["Agents"], "image": {"type": "none"},
                 "hidden": False}, **extra)


ITEMS = [
    item("tc-model-ships-2026-11-11", "techcrunch", "https://techcrunch.com/2026/11/11/model-ships/"),
    item("hn-alphaproof-code-2026-11-11", "hackernews", "https://deepmind.example/alphaproof",
         "https://news.ycombinator.com/item?id=50439193",
         signals={"points": 662, "comments": 187}, meta={"author": "ilreb"},
         published_at="2026-11-10T12:11:12Z"),
    item("gh-agent-skills-2026-11-11", "github", "https://github.com/addyosmani/agent-skills",
         signals={"stars": 100, "stars_gained": 7, "forks": 3}),
    item("ph-alsona-2026-11-11", "producthunt", "https://www.producthunt.com/products/alsona",
         signals={"upvotes": 477, "comments": 106}),
    item("tc-old-news-2026-11-11", "techcrunch", "https://techcrunch.com/2026/11/01/old-news/?utm_source=x"),
    item("tc-hidden-one-2026-11-11", "techcrunch", "https://techcrunch.com/2026/11/11/hidden/", hidden=True),
]

READABLE = {"readable": True, "reason": None, "detail": None, "title": "A page", "byline": "Ada",
            "text": "words " * 200, "words": 200}
UNREADABLE = {"readable": False, "reason": "bot_check", "detail": "", "title": None, "byline": None,
              "text": "", "words": 0}
THREAD = {"title": "AlphaProof Code", "self_text": "", "comments": [
    {"id": "c1", "hn_id": 1, "by": "a", "text": "A comment.", "url": "https://news.ycombinator.com/item?id=1",
     "reply": None}], "error": None}
REPO = {"ok": True, "error": None, "rate_limited": False, "description": "Skills.", "topics": ["agents"],
        "homepage": None, "readme": "readme " * 150, "readme_words": 150,
        "issues": [{"id": "i1", "number": 1, "title": "Bug", "url": "https://github.com/a/b/issues/1",
                    "labels": [], "comments": 3}],
        "stats": {"stars": 101, "forks": 3, "license": "MIT"}}
LAUNCH = {"tagline": "Outreach agents", "description": "Alsona scores companies.", "topics": ["Sales"],
          "comments": [{"id": "c1", "launch": True, "votes": 9, "url": "https://www.producthunt.com/c/1",
                        "text": "Hi PH"}],
          "comments_error": None, "site": None, "site_unreadable": None, "words": 130}


class Tree:
    """A temp repo layout: content/, newsletter/data/, .cache/gists/."""

    def __init__(self, items=ITEMS, index_entries=()):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        self.content = self.root / "content"
        (self.content / "editions").mkdir(parents=True)
        (self.content / "editions" / f"{DATE}.json").write_text(json.dumps({"date": DATE, "items": list(items)}))
        if index_entries:
            (self.content / "gists").mkdir()
            (self.content / "gists" / "index.json").write_text(json.dumps(
                {"schema_version": 1, "generated_at": "2026-11-10T08:30:00Z", "gists": list(index_entries)}))
        ph = self.root / "data" / "2026" / "11" / "days" / DATE / "producthunt"
        ph.mkdir(parents=True)
        (ph / "ph_data.json").write_text(json.dumps({"posts": [
            {"id": "1288148", "name": "Alsona", "createdAt": "2026-11-10T08:01:00Z",
             "url": "https://www.producthunt.com/products/alsona?utm_campaign=producthunt-api"}]}))
        self.cache = self.root / ".cache" / "gists"

    def draft(self, **kw):
        kw.setdefault("ph_token", "tok")
        kw.setdefault("log", lambda line: None)
        return draft_mod.draft(DATE, content_root=self.content, data_root=self.root / "data",
                               cache_root=self.cache, **kw)

    def close(self):
        self.tmp.cleanup()


def index_entry(slug, url):
    return {"slug": slug, "source_key": gist_contract.source_key(url), "path": f"gists/{slug}.json",
            "created_at": "2026-11-01T08:30:00Z"}


class Fetchers:
    """Replaces every fetcher the draft can reach, and records the calls."""

    def __init__(self, page=READABLE, thread=THREAD, repo=REPO, launch=LAUNCH):
        self.calls = []
        self.page, self.thread, self.repo, self.launch = page, thread, repo, launch

    def __enter__(self):
        def record(name, value):
            def call(*args, **kwargs):
                self.calls.append((name, args))
                return value(*args) if callable(value) else value
            return call
        self.patches = [
            mock.patch.object(draft_mod.article, "article_text", record("article", self.page)),
            mock.patch.object(draft_mod.hn_thread, "hn_thread", record("hn", self.thread)),
            mock.patch.object(draft_mod.github_repo, "repo_details", record("repo", self.repo)),
            mock.patch.object(draft_mod.ph_launch, "launch_material", record("launch", self.launch)),
        ]
        for patch in self.patches:
            patch.start()
        return self

    def __exit__(self, *exc):
        for patch in self.patches:
            patch.stop()

    def names(self):
        return [name for name, _ in self.calls]


class TestDraft(unittest.TestCase):
    def setUp(self):
        self.tree = Tree(index_entries=[
            index_entry("tc-old-news", "https://techcrunch.com/2026/11/01/old-news/"),
            # Another source already holds the slug this edition's TC item wants.
            index_entry("tc-model-ships", "https://techcrunch.com/2026/10/01/a-different-story/"),
        ])
        self.addCleanup(self.tree.close)

    def run_draft(self, fetchers=None, **kw):
        with (fetchers or Fetchers()) as f:
            return self.tree.draft(**kw), f

    def by_id(self, result):
        return {entry["item_id"]: entry for entry in result["new"]}

    def test_a_repeat_is_not_fetched_and_resolves_to_its_slug(self):
        result, fetchers = self.run_draft()
        self.assertEqual(result["repeats"], [{"item_id": "tc-old-news-2026-11-11", "slug": "tc-old-news"}])
        self.assertNotIn("tc-old-news-2026-11-11", self.by_id(result))
        urls = [args[0] for name, args in fetchers.calls if name == "article"]
        self.assertFalse(any("old-news" in url for url in urls))

    def test_slugs_drop_the_date_and_a_clash_gets_dash_two(self):
        new = self.by_id(self.run_draft()[0])
        self.assertEqual(new["hn-alphaproof-code-2026-11-11"]["slug"], "hn-alphaproof-code")
        self.assertEqual(new["tc-model-ships-2026-11-11"]["slug"], "tc-model-ships-2")

    def test_hidden_items_get_no_gist(self):
        result = self.run_draft()[0]
        self.assertIn({"item_id": "tc-hidden-one-2026-11-11", "reason": "hidden"}, result["skipped"])

    def test_each_kind_reads_its_own_material(self):
        new = self.by_id(self.run_draft()[0])
        kinds = {entry["slug"]: (entry["kind"], entry["depth"]) for entry in new.values()}
        self.assertEqual(kinds, {"tc-model-ships-2": ("news", "full"), "hn-alphaproof-code": ("hn", "full"),
                                 "gh-agent-skills": ("repo", "full"), "ph-alsona": ("launch", "full")})
        hn = new["hn-alphaproof-code-2026-11-11"]
        self.assertEqual(hn["material"]["comments"][0]["id"], "c1")
        self.assertIn("article", hn["material"])
        repo = new["gh-agent-skills-2026-11-11"]
        self.assertEqual(repo["material"]["issues"][0]["id"], "i1")
        self.assertEqual(repo["facts"]["stats"]["license"], "MIT")

    def test_the_launch_is_matched_to_its_snapshot_post(self):
        _, fetchers = self.run_draft()
        launch_args = [args for name, args in fetchers.calls if name == "launch"]
        self.assertEqual(launch_args[0][0]["id"], "1288148")
        self.assertEqual(launch_args[0][1], "tok")

    def test_an_unreadable_source_is_marked_brief_with_no_material(self):
        new = self.by_id(self.run_draft(Fetchers(page=UNREADABLE))[0])
        news = new["tc-model-ships-2026-11-11"]
        self.assertEqual((news["depth"], news["material"], news["unreadable"]), ("brief", {}, "bot_check"))
        # The HN link post's article is unreadable and it has no self text.
        self.assertEqual(new["hn-alphaproof-code-2026-11-11"]["depth"], "brief")

    def test_the_brief_rules_per_kind(self):
        thin_repo = dict(REPO, readme_words=99)
        limited = dict(REPO, ok=False, rate_limited=True)
        short_launch = dict(LAUNCH, words=119)
        for fetchers, item_id, reason in (
                (Fetchers(repo=thin_repo), "gh-agent-skills-2026-11-11", "too_short"),
                (Fetchers(repo=limited), "gh-agent-skills-2026-11-11", "rate_limited"),
                (Fetchers(launch=short_launch), "ph-alsona-2026-11-11", "too_short")):
            with self.subTest(reason=reason, item=item_id):
                entry = self.by_id(self.run_draft(fetchers)[0])[item_id]
                self.assertEqual((entry["depth"], entry["unreadable"]), ("brief", reason))

    def test_a_long_self_post_is_full_without_an_article(self):
        ask = item("hn-ask-hn-x-2026-11-11", "hackernews", "https://news.ycombinator.com/item?id=7")
        tree = Tree(items=[ask])
        self.addCleanup(tree.close)
        with Fetchers(thread=dict(THREAD, self_text="word " * 150)) as fetchers:
            entry = tree.draft()["new"][0]
        self.assertEqual(entry["depth"], "full")
        self.assertNotIn("article", fetchers.names())

    def test_fetching_stops_at_the_budget_and_the_rest_are_brief(self):
        ticks = iter([0, 0, 10, 241, 300, 400, 500])
        new = self.by_id(self.run_draft(clock=lambda: next(ticks))[0])
        depths = [(entry["item_id"].split("-")[0], entry["depth"], entry["unreadable"]) for entry in new.values()]
        self.assertEqual(depths, [("tc", "full", None), ("hn", "full", None),
                                  ("gh", "brief", "time_limit"), ("ph", "brief", "time_limit")])

    def test_a_fetcher_exception_makes_that_item_brief_not_the_run_fail(self):
        def boom(*_):
            raise RuntimeError("unexpected")
        new = self.by_id(self.run_draft(Fetchers(repo=boom))[0])
        self.assertEqual(new["gh-agent-skills-2026-11-11"]["unreadable"], "error: RuntimeError")

    def test_the_draft_file_is_written_under_the_cache(self):
        result = self.run_draft()[0]
        written = json.loads((self.tree.cache / DATE / "draft.json").read_text())
        self.assertEqual(written, result)

    def test_same_source_twice_in_one_edition_gets_one_gist(self):
        twin = item("tc-model-ships-again-2026-11-11", "techcrunch", "https://techcrunch.com/2026/11/11/model-ships")
        tree = Tree(items=[ITEMS[0], twin])
        self.addCleanup(tree.close)
        with Fetchers():
            result = tree.draft()
        self.assertEqual(len(result["new"]), 1)
        self.assertEqual(result["skipped"][0]["item_id"], "tc-model-ships-again-2026-11-11")


class TestCli(unittest.TestCase):
    def test_a_missing_edition_is_an_error_not_a_traceback(self):
        with tempfile.TemporaryDirectory() as tmp:
            done = subprocess.run([sys.executable, str(REPO_ROOT / "packages" / "gists" / "gists.py"),
                                   "draft", "--date", DATE, "--content-root", tmp, "--cache-root", tmp],
                                  capture_output=True, text=True)
        self.assertEqual(done.returncode, 1)
        self.assertIn("no edition for 2026-11-11", done.stderr)


class TestCacheIsIgnored(unittest.TestCase):
    def test_fetched_material_can_never_be_committed(self):
        done = subprocess.run(["git", "check-ignore", "-q", ".cache/gists/2026-11-11/draft.json"],
                              cwd=REPO_ROOT)
        self.assertEqual(done.returncode, 0, ".cache/ must be in .gitignore (spec G2)")


if __name__ == "__main__":
    unittest.main()
