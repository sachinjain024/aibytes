"""Offline tests for packages/gists: the draft and build steps (AIB-145y T13, T15).

No network: every fetcher the draft calls is replaced. The spec is
docs/specs/AIB-145y-gist-generate.md.
"""

import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "gists"))

from aibytes_gists import build as build_mod, draft as draft_mod  # noqa: E402  (sets up the sibling paths)
import gist_contract  # noqa: E402
import validate as contract  # noqa: E402

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

    def __init__(self, page=READABLE, thread=THREAD, repo=REPO, launch=LAUNCH, story=None):
        self.calls = []
        self.page, self.thread, self.repo, self.launch = page, thread, repo, launch
        self.story = story

    def __enter__(self):
        def record(name, value):
            def call(*args, **kwargs):
                self.calls.append((name, args))
                return value(*args) if callable(value) else value
            return call
        self.patches = [
            mock.patch.object(draft_mod.article, "article_text", record("article", self.page)),
            mock.patch.object(draft_mod.hn_thread, "hn_thread", record("hn", self.thread)),
            mock.patch.object(draft_mod.hn_thread, "find_story", record("find_story", self.story)),
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



SKILL = REPO_ROOT / ".claude" / "skills" / "write-gists" / "SKILL.md"


def skill_examples():
    """{kind or 'brief': gist entry} from the skill's worked examples."""
    text = SKILL.read_text()
    found = {}
    for heading, block in re.findall(r"\*\*(\w+)(?:, full)?\*\*[^\n]*\n\n```json\n(.*?)```", text, re.S):
        found[heading] = json.loads(block)
    return found


class TestWriteGistsSkill(unittest.TestCase):
    """AIB-145y T14: the skill names the contract's keys and caps, and never
    restates a number that could drift from it."""

    def test_every_constant_it_names_exists_in_the_contract(self):
        names = set(re.findall(r"`([A-Z][A-Z_]+[A-Z])(?:\[|`)", SKILL.read_text()))
        self.assertTrue(names)
        missing = sorted(name for name in names if not hasattr(gist_contract, name))
        self.assertEqual(missing, [])

    def test_every_section_key_and_written_kind_is_covered(self):
        text = SKILL.read_text()
        for key in gist_contract.SECTION_KEYS:
            self.assertIn(f"`{key}`", text)
        for kind in gist_contract.KINDS:
            if kind != "x_post":  # previews are copied by build, never written
                self.assertIn(f"`{kind}`", text)
        for stance in gist_contract.STANCES:
            self.assertIn(f"`{stance}`", text)

    def test_no_cap_is_restated_as_a_number(self):
        text = SKILL.read_text()
        prose = re.sub(r"```.*?```", "", text, flags=re.S)
        self.assertEqual(re.findall(r"\b\d+\s*(?:chars|characters)\b", prose), [])
        caps = {gist_contract.POINT_MAX, gist_contract.LEDE_MAX, gist_contract.TRY_IT_MAX,
                gist_contract.DISCUSSION_TEXT_MAX, *gist_contract.TEXT_CAPS.values()}
        for cap in caps:
            self.assertNotRegex(prose, rf"\b{cap}\b", f"{cap} is a contract cap; name it instead")

    def test_there_is_a_worked_example_per_kind_and_for_brief(self):
        self.assertEqual(sorted(skill_examples()), ["brief", "hn", "launch", "news", "repo"])

    def test_the_worked_examples_pass_the_contracts_section_checks(self):
        for name, entry in skill_examples().items():
            kind = "news" if name == "brief" else name
            with self.subTest(example=name):
                sections = json.loads(json.dumps(entry["sections"]))
                for section in sections:  # build swaps ids for links; do the same here
                    for point in section.get("points") or []:
                        if isinstance(point, dict):
                            ref = point.pop("comment", None) or point.pop("issue", None)
                            if ref:
                                point["url"] = f"https://example.com/{ref}"
                self.assertEqual(gist_contract._sections_problems(sections, kind, entry["depth"]), [])
                self.assertTrue(gist_contract.LEDE_MIN <= len(entry["lede"]) <= gist_contract.LEDE_MAX)
                self.assertNotRegex(json.dumps(entry, ensure_ascii=False), "[\u2013\u2014]")



NOW = "2026-11-11T08:30:00Z"
REAL_EDITION = REPO_ROOT / "content" / "editions" / f"{DATE}.json"
COMMENTS = [{"id": f"c{n}", "text": f"comment number {n}", "url": f"https://news.ycombinator.com/item?id={n}"}
            for n in range(1, 5)]
ISSUES = [{"id": f"i{n}", "title": f"issue {n}", "url": f"https://github.com/a/b/issues/{n}"} for n in range(1, 4)]
SOURCE = ("The quick model release from the fixture lab includes open weights a hosted API "
          "and a new evaluation harness that the team says will ship to every customer next month")


def lede(kind):
    return f"A {kind} item described in fresh words for the build tests, long enough for the contract."


def points(n=3):
    return [f"Point {i} about what is new, said plainly for the reader." for i in range(1, n + 1)]


def good_sections(kind):
    sections = [{"key": "key_points", "points": points()}]
    if kind == "news":
        sections.append({"key": "why_it_matters", "text": "Builders get a smaller model to run locally."})
    if kind == "hn":
        sections.append({"key": "discussion", "points": [
            {"stance": "agreed", "text": "Most agree on the main claim.", "comment": "c1"},
            {"stance": "disputed", "text": "They split on cost.", "comment": "c2"},
            {"stance": "counterpoint", "text": "One argues the opposite.", "comment": "c3"}]})
    if kind == "repo":
        sections += [{"key": "try_it", "command": "pip install fixture"},
                     {"key": "whats_open", "points": [{"text": "Windows support.", "issue": "i1"},
                                                     {"text": "A v2 roadmap.", "issue": "i2"}]}]
    if kind == "launch":
        sections.append({"key": "who_its_for", "text": "Small sales teams."})
    return sections


class BuildTree:
    """A copy of the real content tree with a draft for the 11 Nov edition:
    every item new, with fake material."""

    def __init__(self, test):
        self.tmp = tempfile.TemporaryDirectory()
        test.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.content = self.root / "content"
        shutil.copytree(REPO_ROOT / "content", self.content,
                        ignore=shutil.ignore_patterns("gists"))
        # The copy has no gists, so editions and weekly issues that already carry a
        # `gist` (the daily runs since launch, Issue 18's backfill) would not
        # validate: the fixture starts gist-free.
        for path in [*(self.content / "editions").glob("*.json"),
                     *(self.content / "weekly" / "issues").glob("*.json")]:
            edition = json.loads(path.read_text())
            if any("gist" in it for it in edition["items"]):
                for it in edition["items"]:
                    it.pop("gist", None)
                path.write_text(json.dumps(edition, indent=2, ensure_ascii=False) + "\n")
        build_mod.copy_weekly_sources(REPO_ROOT / "content", self.root)
        self.cache = self.root / "cache"
        self.items = json.loads(REAL_EDITION.read_text())["items"]
        self.new = []
        for it in self.items:
            kind = draft_mod.KIND_BY_SOURCE[it["source"]]
            material = {"article": {"title": "t", "byline": None, "text": SOURCE}}
            if kind == "hn":
                material["comments"] = COMMENTS
            if kind == "repo":
                material = {"readme": SOURCE, "issues": ISSUES}
            if kind == "launch":
                material = {"description": SOURCE, "comments": COMMENTS[:1]}
            self.new.append({"item_id": it["id"], "slug": gist_contract.slug_from_item_id(it["id"]),
                             "kind": kind, "depth": "full", "title": it["title"], "summary": it["summary"],
                             "tags": it["tags"], "material": material,
                             "facts": {"stats": {"license": "MIT"}} if kind == "repo" else {},
                             "unreadable": None})
        self.written = {e["item_id"]: {"depth": "full", "lede": lede(e["kind"]),
                                       "sections": good_sections(e["kind"])} for e in self.new}
        self.repeats = []

    def build(self, **kw):
        folder = self.cache / DATE
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "draft.json").write_text(json.dumps({"date": DATE, "new": self.new, "repeats": self.repeats,
                                                       "skipped": []}))
        (folder / "gists.json").write_text(json.dumps({"date": DATE, "gists": self.written}))
        kw.setdefault("now", NOW)
        kw.setdefault("log", lambda line: None)
        return build_mod.build(DATE, content_root=self.content, cache_root=self.cache, **kw)

    def snapshot(self):
        return {str(p.relative_to(self.content)): p.read_bytes() for p in sorted(self.content.rglob("*"))
                if p.is_file()}

    def gist(self, slug):
        return json.loads((self.content / "gists" / f"{slug}.json").read_text())

    def edition(self):
        return json.loads((self.content / "editions" / f"{DATE}.json").read_text())


class TestBuild(unittest.TestCase):
    def setUp(self):
        self.tree = BuildTree(self)

    def test_thirty_good_gists_are_all_written_and_the_tree_validates(self):
        report = self.tree.build()
        self.assertEqual(len(report["written"]), 30)
        self.assertEqual(report["failed"], {})
        self.assertTrue(contract.validate_content_root(self.tree.content))
        items = self.tree.edition()["items"]
        self.assertTrue(all(it["gist"] == gist_contract.slug_from_item_id(it["id"]) for it in items))

    def test_one_bad_gist_of_thirty_leaves_twenty_nine_and_one_failure(self):
        bad = self.tree.new[3]["item_id"]
        self.tree.written[bad]["lede"] = "too short"
        report = self.tree.build()
        self.assertEqual(len(report["written"]), 29)
        self.assertEqual(list(report["failed"]), [bad])
        item = next(it for it in self.tree.edition()["items"] if it["id"] == bad)
        self.assertNotIn("gist", item)
        self.assertTrue(contract.validate_content_root(self.tree.content))

    def test_nothing_changes_if_the_whole_tree_would_not_validate(self):
        before = self.tree.snapshot()
        broken = contract.FeedValidationError("index.json: total is wrong")
        with mock.patch.object(build_mod.contract, "validate_content_root", side_effect=broken):
            with self.assertRaises(build_mod.BuildError):
                self.tree.build()
        self.assertEqual(self.tree.snapshot(), before)

    def test_every_gist_rejected_writes_nothing(self):
        before = self.tree.snapshot()
        for entry in self.tree.written.values():
            entry["lede"] = ""
        report = self.tree.build()
        self.assertEqual((report["written"], len(report["failed"])), ([], 30))
        self.assertEqual(self.tree.snapshot(), before)

    def test_the_script_writes_every_fact(self):
        self.tree.build()
        hn_item = next(it for it in self.tree.items if it["source"] == "hackernews")
        gist = self.tree.gist(gist_contract.slug_from_item_id(hn_item["id"]))
        self.assertEqual((gist["title"], gist["url"], gist["source_url"], gist["tags"]),
                         (hn_item["title"], hn_item["url"], hn_item["source_url"], hn_item["tags"]))
        self.assertEqual(gist["stats"], {"points": hn_item["signals"]["points"],
                                         "comments": hn_item["signals"]["comments"],
                                         "submitted_by": hn_item["meta"]["author"],
                                         "posted_at": hn_item["published_at"]})
        self.assertEqual(gist["stats_as_of"], self.tree.edition()["generated_at"])
        self.assertEqual([link["role"] for link in gist["links"]], ["destination", "discussion"])
        self.assertEqual(gist["appearances"], [{"item_id": hn_item["id"], "edition_date": DATE}])
        self.assertEqual(gist["sections"][1]["points"][0]["url"], "https://news.ycombinator.com/item?id=1")

    def test_repo_stats_join_the_fetch_and_the_edition(self):
        self.tree.build()
        gh = next(it for it in self.tree.items if it["source"] == "github")
        stats = self.tree.gist(gist_contract.slug_from_item_id(gh["id"]))["stats"]
        self.assertEqual(stats["license"], "MIT")
        self.assertEqual(stats["stars_gained"], gh["signals"]["stars_gained"])
        whats_open = self.tree.gist(gist_contract.slug_from_item_id(gh["id"]))["sections"][2]
        self.assertEqual(whats_open["points"][1]["url"], "https://github.com/a/b/issues/2")

    def test_a_launch_links_to_the_product_hunt_page_as_its_discussion(self):
        self.tree.build()
        ph = next(it for it in self.tree.items if it["source"] == "producthunt")
        gist = self.tree.gist(gist_contract.slug_from_item_id(ph["id"]))
        self.assertEqual(gist["links"][-1], {"role": "discussion", "title": f"{ph['title']} on Product Hunt",
                                             "url": ph["source_url"]})

    def fails_with(self, change, expected):
        entry = next(e for e in self.tree.new if e["kind"] == "hn")
        item_id = entry["item_id"]
        change(self.tree.written[item_id], entry)
        report = self.tree.build()
        self.assertIn(item_id, report["failed"])
        self.assertTrue(any(expected in problem for problem in report["failed"][item_id]),
                        report["failed"][item_id])

    def test_fatal_depth_raised(self):
        def change(written, entry):
            entry["depth"] = "brief"
        self.fails_with(change, "depth raised")

    def test_fatal_an_id_not_in_the_material(self):
        def change(written, entry):
            written["sections"][1]["points"][0]["comment"] = "c9"
        self.fails_with(change, "'c9' is not in this item's material")

    def test_fatal_a_url_instead_of_an_id(self):
        def change(written, entry):
            point = written["sections"][1]["points"][0]
            del point["comment"]
            point["url"] = "https://example.com/made-up"
        self.fails_with(change, "must name a comment or issue id")

    def test_fatal_twenty_copied_words(self):
        def change(written, entry):
            written["lede"] = "Reportedly, " + " ".join(SOURCE.split()[:20]) + "."
        self.fails_with(change, "copies 20 words")

    def test_fatal_an_item_claude_invented(self):
        self.tree.written["tc-not-in-the-draft-2026-11-11"] = self.tree.written[self.tree.new[0]["item_id"]]
        report = self.tree.build()
        self.assertIn("tc-not-in-the-draft-2026-11-11", report["failed"])
        self.assertEqual(len(report["written"]), 30)

    def test_warnings_are_published(self):
        item_id = self.tree.new[0]["item_id"]
        written = self.tree.written[item_id]
        written["lede"] = ("Reportedly " + " ".join(SOURCE.split()[:13]) + " and a seamless upgrade \u2014 soon.")
        report = self.tree.build()
        self.assertIn(item_id, report["written"] and [e["item_id"] for e in self.tree.new
                                                       if e["slug"] in report["written"]])
        warnings = " | ".join(report["warnings"][item_id])
        for expected in ("copies 13 words", "'seamless'", "em dash", "words; a full gist is"):
            self.assertIn(expected, warnings)

    def test_an_item_claude_skipped_ships_without_a_gist(self):
        item_id = self.tree.new[0]["item_id"]
        del self.tree.written[item_id]
        report = self.tree.build()
        self.assertEqual(report["missing"], [item_id])
        self.assertIn("not written", build_mod.summary_line(report))

    def test_a_brief_gist_has_a_lede_and_no_sections(self):
        entry = self.tree.new[0]
        entry["depth"], entry["material"] = "brief", {}
        self.tree.written[entry["item_id"]] = {"depth": "brief", "lede": lede("news"), "sections": []}
        report = self.tree.build()
        self.assertEqual(report["brief"], [entry["slug"]])
        self.assertTrue(build_mod.summary_line(report).startswith("30 new (1 brief), 0 updated, 0 failed"))

    def test_a_rerun_updates_without_a_second_appearance(self):
        self.tree.build()
        slug = next(e["slug"] for e in self.tree.new if e["kind"] == "hn")
        self.tree.repeats = [{"item_id": e["item_id"], "slug": e["slug"]} for e in self.tree.new]
        self.tree.new, self.tree.written = [], {}
        report = self.tree.build(now="2026-11-12T08:30:00Z")
        self.assertEqual(len(report["updated"]), 30)
        gist = self.tree.gist(slug)
        self.assertEqual(len(gist["appearances"]), 1)
        self.assertEqual((gist["created_at"], gist["updated_at"]), (NOW, "2026-11-12T08:30:00Z"))
        self.assertTrue(contract.validate_content_root(self.tree.content))

    def test_refresh_adds_a_later_appearance_and_new_stats(self):
        gist = {"kind": "hn", "appearances": [{"item_id": "hn-x-2026-11-10", "edition_date": "2026-11-10"}],
                "stats": {"points": 1}, "stats_as_of": "2026-11-10T08:00:00Z", "updated_at": NOW}
        later = {"id": "hn-x-2026-11-11", "signals": {"points": 50, "comments": 9}, "front_page": True,
                 "meta": {"author": "a"}, "published_at": "2026-11-10T07:00:00Z"}
        got = build_mod.refresh(gist, later, "hn", DATE, "2026-11-11T09:00:00Z", "2026-11-11T08:30:00Z")
        self.assertEqual([a["edition_date"] for a in got["appearances"]], ["2026-11-10", DATE])
        self.assertEqual(got["stats"]["points"], 50)
        self.assertTrue(got["front_page"])
        self.assertEqual(gist["stats"], {"points": 1})  # the input is not mutated

    def test_a_missing_draft_is_a_build_error(self):
        with self.assertRaises(build_mod.BuildError):
            build_mod.build(DATE, content_root=self.tree.content, cache_root=self.tree.root / "nowhere",
                            log=lambda line: None)


ISSUE = "issue-19"
X_POST = {
    "bucket": "announcement",
    "url": "https://x.com/AnthropicAI/status/2117343929960112486",
    "author_handle": "@AnthropicAI",
    "author_name": "Anthropic",
    "posted_at": "2026-11-02",
    "text": "Applications are now open for the Anthropic Residency, a paid program",
    "media": "link",
    "likes": 40500, "reposts": 3200, "replies": 1229, "views": 14766946,
}


def x_row(**extra):
    row = {"kind": "x_post", "url": X_POST["url"], "source_url": X_POST["url"], "post": dict(X_POST)}
    row.update(extra)
    return row


def weekly_hn(item_id, title, url, hn_id="50443999"):
    return {
        "id": item_id, "title": title, "summary": "One line about the post.",
        "url": url, "source_url": f"https://news.ycombinator.com/item?id={hn_id}",
        "source": "hackernews", "category": "hn", "tags": ["Agents"],
        "image": {"type": "none"}, "hidden": False,
        "signals": {"points": 412, "comments": 198},
    }


class WeeklyTree:
    """Real content/ plus a weekly items.json under a temp cache."""

    def __init__(self, test, items, issue=ISSUE):
        self.issue = issue
        self.tmp = tempfile.TemporaryDirectory()
        test.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        self.content = self.root / "content"
        shutil.copytree(REPO_ROOT / "content", self.content)
        build_mod.copy_weekly_sources(REPO_ROOT / "content", self.root)
        self.cache = self.root / "cache"
        folder = self.cache / issue
        folder.mkdir(parents=True)
        (folder / "items.json").write_text(json.dumps({"issue_slug": issue, "items": items}))
        self.items = items

    def draft(self, **kw):
        kw.setdefault("ph_token", "tok")
        kw.setdefault("log", lambda line: None)
        return draft_mod.draft(issue=self.issue, content_root=self.content,
                               data_root=self.root / "data", cache_root=self.cache, **kw)

    def write_gists(self, written):
        folder = self.cache / self.issue
        folder.mkdir(parents=True, exist_ok=True)
        (folder / "gists.json").write_text(json.dumps({"gists": written}))

    def build(self, **kw):
        kw.setdefault("now", "2026-11-16T12:00:00Z")
        kw.setdefault("log", lambda line: None)
        return build_mod.build(issue=self.issue, content_root=self.content, cache_root=self.cache, **kw)

    def gist(self, slug):
        return json.loads((self.content / "gists" / f"{slug}.json").read_text())

    def index_slugs(self):
        return {e["slug"] for e in json.loads((self.content / "gists" / "index.json").read_text())["gists"]}


def _repeat_from_content():
    """One published gist, as a weekly row that should reuse it."""
    index = json.loads((REPO_ROOT / "content" / "gists" / "index.json").read_text())
    entry = next(e for e in index["gists"] if not e["slug"].startswith("x-"))
    gist = json.loads((REPO_ROOT / "content" / "gists" / f"{entry['slug']}.json").read_text())
    item = {
        "id": f"{gist['source'][:2] if gist.get('source') else 'xx'}-weekly-repeat-issue-19",
        "title": gist["title"], "summary": "A repeat from the week.",
        "url": gist["url"], "source_url": gist["source_url"],
        "source": gist["source"], "category": gist["category"],
        "tags": gist.get("tags") or [], "image": gist.get("image") or {"type": "none"},
        "hidden": False,
    }
    # ids must match the contract prefix, not a slice of the source name
    prefix = {"producthunt": "ph", "github": "gh", "hackernews": "hn", "techcrunch": "tc"}[gist["source"]]
    item["id"] = f"{prefix}-weekly-repeat-issue-19"
    return item, entry["slug"]


class TestWeeklyDraft(unittest.TestCase):
    def test_a_repeat_is_not_fetched_and_an_x_post_is_preview(self):
        repeat, slug = _repeat_from_content()
        hn = weekly_hn("hn-weekly-fixture-life-issue-19", "Life on Claude Nine",
                       "https://babuschk.example/life-on-claude-nine")
        tree = WeeklyTree(self, [repeat, hn, x_row()])
        with Fetchers() as fetchers:
            result = tree.draft()
        by_id = {e["item_id"]: e for e in result["new"]}
        self.assertEqual(result["repeats"], [{"item_id": repeat["id"], "slug": slug}])
        self.assertNotIn(repeat["id"], by_id)
        self.assertEqual(by_id[hn["id"]]["kind"], "hn")
        x_id = "x-anthropicai-applications-are-now-open-for-issue-19"
        self.assertEqual(by_id[x_id]["kind"], "x_post")
        self.assertEqual(by_id[x_id]["depth"], "preview")
        self.assertEqual(by_id[x_id]["slug"], "x-anthropicai-applications-are-now-open-for")
        self.assertFalse(any(name == "article" and "old" in str(args) for name, args in fetchers.calls))
        self.assertTrue(any(name == "hn" for name, _ in fetchers.calls))
        self.assertEqual(json.loads((tree.cache / ISSUE / "draft.json").read_text()), result)

    def test_an_ai_news_row_credited_to_hn_gets_its_thread_when_hn_has_one(self):
        row = dict(weekly_hn("hn-weekly-fixture-article-issue-19", "An article HN discussed",
                             "https://news.example/article"),
                   category="news", source_url="https://news.example/article")
        del row["signals"]
        tree = self.tree = WeeklyTree(self, [row, x_row()])
        before = json.loads((tree.cache / ISSUE / "items.json").read_text())
        story = {"id": 9900001, "points": 905, "comments": 497}
        with Fetchers(story=story, thread=dict(THREAD, comments=COMMENTS)) as fetchers:
            result = tree.draft()
        entry = {e["item_id"]: e for e in result["new"]}[row["id"]]
        self.assertEqual(entry["kind"], "hn")
        self.assertIn("comments", entry["material"])
        self.assertIn(("find_story", ("https://news.example/article",)), fetchers.calls)
        self.assertTrue(any(name == "hn" and 9900001 in args for name, args in fetchers.calls))
        # build reads items.json, so the thread is written back there, and nothing else is.
        after = json.loads((tree.cache / ISSUE / "items.json").read_text())
        linked = next(r for r in after["items"] if r.get("id") == row["id"])
        self.assertEqual(linked["source_url"], "https://news.ycombinator.com/item?id=9900001")
        self.assertEqual(linked["signals"], {"points": 905, "comments": 497})
        self.assertEqual([r for r in after["items"] if r.get("id") != row["id"]],
                         [r for r in before["items"] if r.get("id") != row["id"]])
        # ...and build publishes an hn gist filed under news, linking the thread.
        self.tree.write_gists({entry["item_id"]: {"depth": "full", "lede": lede("hn"),
                                                  "sections": good_sections("hn")}})
        report = self.tree.build()
        self.assertEqual(report["failed"], {})
        gist = self.tree.gist(entry["slug"])
        self.assertEqual((gist["kind"], gist["category"]), ("hn", "news"))
        self.assertEqual(gist["source_url"], "https://news.ycombinator.com/item?id=9900001")
        self.assertIn({"role": "discussion", "title": gist["links"][-1]["title"],
                       "url": "https://news.ycombinator.com/item?id=9900001"}, gist["links"])
        self.assertEqual(gist["links"][0]["url"], "https://news.example/article")
        self.assertEqual(gist["stats"], {"points": 905, "comments": 497})

    def test_the_thread_lookup_is_weekly_only_and_inside_the_fetch_budget(self):
        def classify(weekly, elapsed=0):
            row = dict(weekly_hn("hn-fixture-article-2026-11-16", "An article", "https://news.example/a"),
                       category="news", source_url="https://news.example/a")
            new = []
            with Fetchers(story={"id": 9900002, "points": 5, "comments": 1}) as fetchers:
                draft_mod._classify_item(row, {}, set(), {}, new, [], [], {}, None, 100,
                                         lambda: elapsed, 0, lambda *_: None, weekly=weekly)
            return new[0]["kind"], fetchers.names()
        kind, calls = classify(weekly=False)  # a daily run cannot save what it found
        self.assertEqual(kind, "news")
        self.assertNotIn("find_story", calls)
        kind, calls = classify(weekly=True, elapsed=100)  # out of budget
        self.assertEqual(kind, "news")
        self.assertNotIn("find_story", calls)
        kind, calls = classify(weekly=True)
        self.assertEqual(kind, "hn")
        self.assertIn("find_story", calls)

    def test_an_ai_news_row_credited_to_hn_with_no_thread_is_a_news_gist(self):
        row = dict(weekly_hn("hn-weekly-fixture-article-issue-19", "An article HN discussed",
                             "https://news.example/article"),
                   category="news", source_url="https://news.example/article", signals={})
        thread = weekly_hn("hn-weekly-fixture-thread-issue-19", "A real thread",
                           "https://babuschk.example/thread")
        tree = WeeklyTree(self, [row, thread])
        with Fetchers() as fetchers:
            result = tree.draft()
        by_id = {e["item_id"]: e for e in result["new"]}
        self.assertEqual(by_id[row["id"]]["kind"], "news")
        self.assertEqual(by_id[row["id"]]["depth"], "full")
        self.assertIn("article", by_id[row["id"]]["material"])
        self.assertEqual(by_id[thread["id"]]["kind"], "hn")
        self.assertTrue(any(name == "article" and "news.example" in str(args) for name, args in fetchers.calls))

    def test_ph_posts_under_later_path_wins(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            url = "https://www.producthunt.com/posts/foo"
            def write(rel, name):
                path = root / rel
                path.parent.mkdir(parents=True)
                path.write_text(json.dumps({"posts": [{"url": url, "name": name}]}))
            write("2026/10/weeks/week-40/producthunt/ph_data.json", "old")
            write("2026/11/weeks/week-47/producthunt/ph_data.json", "new")
            posts = draft_mod.ph_posts_under(root)
            self.assertEqual(posts[url]["name"], "new")

    def test_missing_items_json_is_fatal(self):
        with tempfile.TemporaryDirectory() as tmp:
            done = subprocess.run(
                [sys.executable, str(REPO_ROOT / "packages" / "gists" / "gists.py"),
                 "draft", "--issue", ISSUE, "--content-root", tmp, "--cache-root", tmp],
                capture_output=True, text=True)
        self.assertEqual(done.returncode, 1)
        self.assertIn("no items.json", done.stderr)


class TestWeeklyBuild(unittest.TestCase):
    def setUp(self):
        self.repeat, self.repeat_slug = _repeat_from_content()
        self.hn = weekly_hn("hn-weekly-fixture-life-issue-19", "Life on Claude Nine",
                            "https://babuschk.example/life-on-claude-nine")
        self.hn_bad = weekly_hn("hn-weekly-fixture-other-issue-19", "Other weekly HN",
                                "https://babuschk.example/other-weekly", hn_id="50444000")
        self.tree = WeeklyTree(self, [self.repeat, self.hn, self.hn_bad, x_row()])

    def _draft_and_write(self, mutate=None):
        with Fetchers(thread=dict(THREAD, comments=COMMENTS)):
            draft = self.tree.draft()
        written = {}
        for entry in draft["new"]:
            if entry["kind"] == "x_post":
                continue
            written[entry["item_id"]] = {
                "depth": "full", "lede": lede(entry["kind"]),
                "sections": good_sections(entry["kind"]),
            }
        if mutate:
            mutate(written, draft)
        self.tree.write_gists(written)
        return draft

    def test_writes_missing_gists_reuses_existing_and_copies_x_with_no_claude_file(self):
        draft = self._draft_and_write()
        x_entry = next(e for e in draft["new"] if e["kind"] == "x_post")
        self.assertNotIn(x_entry["item_id"], json.loads((self.tree.cache / ISSUE / "gists.json").read_text())["gists"])
        report = self.tree.build()
        self.assertIn(x_entry["slug"], report["written"])
        self.assertIn(self.repeat_slug, report["updated"])
        hn_slug = next(e["slug"] for e in draft["new"] if e["item_id"] == self.hn["id"])
        self.assertIn(hn_slug, report["written"])
        gist = self.tree.gist(x_entry["slug"])
        self.assertEqual(gist["kind"], "x_post")
        self.assertEqual(gist["depth"], "preview")
        self.assertEqual(gist["preview"]["author_handle"], "@AnthropicAI")
        self.assertEqual(gist["appearances"],
                         [{"item_id": x_entry["item_id"], "issue_slug": ISSUE}])
        repeat = self.tree.gist(self.repeat_slug)
        self.assertTrue(any(a.get("issue_slug") == ISSUE for a in repeat["appearances"]))
        self.assertTrue(contract.validate_content_root(self.tree.content))
        self.assertIn(x_entry["slug"], self.tree.index_slugs())

    def test_one_failed_gist_leaves_the_others_written(self):
        def mutate(written, draft):
            written[self.hn_bad["id"]]["lede"] = "too short"
        self._draft_and_write(mutate)
        report = self.tree.build()
        self.assertIn(self.hn_bad["id"], report["failed"])
        self.assertTrue(report["written"])
        self.assertNotIn(next(e["slug"] for e in json.loads((self.tree.cache / ISSUE / "draft.json").read_text())["new"]
                              if e["item_id"] == self.hn_bad["id"]), report["written"])
        self.assertTrue(contract.validate_content_root(self.tree.content))

    def test_missing_gists_json_is_fatal_when_a_new_row_needs_claude(self):
        with Fetchers(thread=dict(THREAD, comments=COMMENTS)):
            self.tree.draft()
        self.assertFalse((self.tree.cache / ISSUE / "gists.json").exists())
        with self.assertRaises(build_mod.BuildError) as ctx:
            self.tree.build()
        self.assertIn("gists.json", str(ctx.exception))

    def test_x_previews_build_without_a_claude_file(self):
        tree = WeeklyTree(self, [x_row()])
        tree.draft()
        self.assertFalse((tree.cache / ISSUE / "gists.json").exists())
        report = tree.build()
        self.assertEqual(len(report["written"]), 1)
        self.assertEqual(report["failed"], {})
        self.assertTrue(contract.validate_content_root(tree.content))


class TestCopying(unittest.TestCase):
    def test_runs_ignore_case_and_punctuation(self):
        from aibytes_gists import copying
        source = {"article": {"text": "One, two; three four five six seven eight nine ten eleven twelve."}}
        self.assertEqual(len(copying.copied("ONE two three four five six seven eight nine ten eleven twelve",
                                            source).split()), 12)
        self.assertEqual(copying.copied("one two three four five six seven eight nine ten eleven", source), "")

    def test_a_run_does_not_span_two_sources(self):
        from aibytes_gists import copying
        source = {"a": "alpha beta gamma delta epsilon zeta", "b": "eta theta iota kappa lambda mu"}
        text = "alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu"
        self.assertEqual(copying.copied(text, source), "")


class TestRefreshStats(unittest.TestCase):
    """A repeat refreshes what the item carries and keeps the rest (Grok review)."""

    def refresh(self, kind, old, item):
        gist = {"appearances": [], "stats": old}
        return build_mod.refresh(gist, dict(item, id="row-issue-18"), kind, None,
                                 "2026-11-16T00:00:00Z", "2026-11-16T00:00:00Z", issue_slug="issue-18")["stats"]

    def test_an_hn_repeat_from_a_weekly_row_keeps_submitter_and_post_time(self):
        old = {"points": 900, "comments": 600, "submitted_by": "someone", "posted_at": "2026-11-14T02:52:59Z"}
        got = self.refresh("hn", old, {"signals": {"points": 1103, "comments": 649}})
        self.assertEqual(got, {"points": 1103, "comments": 649, "submitted_by": "someone",
                               "posted_at": "2026-11-14T02:52:59Z"})

    def test_a_launch_repeat_keeps_comments_the_weekly_row_lacks(self):
        got = self.refresh("launch", {"upvotes": 300, "comments": 40}, {"signals": {"upvotes": 512}})
        self.assertEqual(got, {"upvotes": 512, "comments": 40})


class TestWeeklyBackfill(unittest.TestCase):
    """Issue 18 was sent before gist links. Its weekly file already exists, so
    build must make its items point back, and a rebuild must keep them."""

    def setUp(self):
        issue = json.loads((REPO_ROOT / "content" / "weekly" / "issues" / "issue-18.json").read_text())
        hn = [item for item in issue["items"] if item["category"] == "hn"][:2]
        self.ids = [item["id"] for item in hn]
        self.tree = WeeklyTree(self, [{k: v for k, v in item.items() if k != "gist"} for item in hn], issue="issue-18")
        # The copy is today's content/, where Issue 18 already points at its
        # gists. Undo that for these two so build has to write the links: the
        # first loses its gist too (a new gist), the second keeps it (a repeat).
        content = self.tree.content
        weekly_path = content / "weekly" / "issues" / "issue-18.json"
        weekly_doc = json.loads(weekly_path.read_text())
        for item in weekly_doc["items"]:
            if item["id"] in self.ids:
                item.pop("gist", None)
        weekly_path.write_text(json.dumps(weekly_doc, indent=2, ensure_ascii=False) + "\n")
        new_slug = hn[0]["gist"]
        (content / "gists" / f"{new_slug}.json").unlink()
        index_path = content / "gists" / "index.json"
        index_doc = json.loads(index_path.read_text())
        index_doc["gists"] = [g for g in index_doc["gists"] if g["slug"] != new_slug]
        index_path.write_text(json.dumps(index_doc, indent=2, ensure_ascii=False) + "\n")

    def _weekly(self):
        return json.loads((self.tree.content / "weekly" / "issues" / "issue-18.json").read_text())

    def test_build_points_existing_weekly_items_at_their_gists_and_a_rebuild_keeps_them(self):
        with Fetchers(thread=dict(THREAD, comments=COMMENTS)):
            draft = self.tree.draft()
        self.assertEqual([e["item_id"] for e in draft["new"]], self.ids[:1])
        self.assertEqual([r["item_id"] for r in draft["repeats"]], self.ids[1:])
        written = {e["item_id"]: {"depth": "full", "lede": lede(e["kind"]), "sections": good_sections(e["kind"])}
                   for e in draft["new"]}
        self.tree.write_gists(written)
        self.tree.build()
        by_id = {item["id"]: item for item in self._weekly()["items"]}
        slugs = {item_id: by_id[item_id].get("gist") for item_id in self.ids}
        for item_id, slug in slugs.items():
            self.assertIsInstance(slug, str, item_id)
            self.assertIn({"item_id": item_id, "issue_slug": "issue-18"}, self.tree.gist(slug)["appearances"])
        self.assertTrue(contract.validate_content_root(self.tree.content))

        # The weekly builder rebuilds every issue from its HTML, which for
        # Issue 18 has no gist hrefs. The links come back from the gists.
        sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))
        import build_weekly_issues as weekly
        entry = next(e for e in json.loads((self.tree.content / "weekly" / "index.json").read_text())["issues"]
                     if e["slug"] == "issue-18")
        html = (REPO_ROOT / entry["source"]).read_text(encoding="utf-8")
        rebuilt = weekly.build_issue(html, entry, content_root=self.tree.content)
        again = {item["id"]: item.get("gist") for item in rebuilt["items"]}
        for item_id, slug in slugs.items():
            self.assertEqual(again[item_id], slug)

if __name__ == "__main__":
    unittest.main()

