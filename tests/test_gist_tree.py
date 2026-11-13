"""Offline tests for gists across files (AIB-145y T6): the index, the item
fields `gist` and `front_page`, and rules 11 to 17 of
docs/specs/AIB-145y-gist-contract.md.
"""

import copy
import json
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))
sys.path.insert(0, str(REPO_ROOT / "tests"))

import gist_contract as gc
import validate as contract
from test_gist_contract import hn_gist, repo_gist, x_gist

DATE = "2026-08-27"


def hn_item(**overrides):
    base = {
        "id": f"hn-show-hn-tinyeval-{DATE}",
        "title": "Show HN: TinyEval",
        "summary": "An eval harness in a single Python file.",
        "url": "https://github.com/mkrause/tinyeval",
        "source": "hackernews",
        "source_url": "https://news.ycombinator.com/item?id=50443587",
        "category": "hn",
        "tags": ["Evals"],
        "image": {"type": "none"},
        "signals": {"points": 212, "comments": 87},
        "hidden": False,
        "gist": "hn-show-hn-tinyeval",
        "front_page": True,
    }
    base.update(overrides)
    return base


def repo_item(**overrides):
    base = {
        "id": f"gh-officecli-{DATE}",
        "title": "OfficeCLI",
        "summary": "Create and edit Office files from the command line.",
        "url": "https://github.com/acme/officecli",
        "source": "github",
        "source_url": "https://github.com/acme/officecli",
        "category": "repos",
        "tags": [],
        "image": {"type": "avatar", "url": "https://avatars.githubusercontent.com/u/1"},
        "hidden": False,
        "gist": "gh-officecli",
    }
    base.update(overrides)
    return base


def the_gist():
    return hn_gist(tags=["Evals"], appearances=[
        {"item_id": f"hn-show-hn-tinyeval-{DATE}", "edition_date": DATE}])


def the_repo_gist():
    return repo_gist(tags=[], appearances=[
        {"item_id": f"gh-officecli-{DATE}", "edition_date": DATE}])


def index_entry(gist):
    return {"slug": gist["slug"], "source_key": gc.source_key(gist["source_url"]),
            "path": f"gists/{gist['slug']}.json", "created_at": gist["created_at"]}


def gist_index(*gists, **overrides):
    base = {"schema_version": 1, "generated_at": "2026-08-27T08:04:10Z",
            "gists": sorted((index_entry(g) for g in gists), key=lambda e: e["slug"])}
    base.update(overrides)
    return base


class Tree:
    """A small, fully valid content tree: one edition with an HN item and a
    repo item, both with gists."""

    def __init__(self, case):
        tmp = tempfile.TemporaryDirectory()
        case.addCleanup(tmp.cleanup)
        self.root = pathlib.Path(tmp.name)
        (self.root / "editions").mkdir()
        (self.root / "gists").mkdir()
        self.write("tags.json", {"schema_version": 1, "groups": [
            {"name": "Domain", "tags": [{"name": "Evals", "slug": "evals"},
                                        {"name": "Open Source", "slug": "open-source"}]}]})
        self.write("hidden.json", {"schema_version": 1, "hidden": []})
        self.items = [hn_item(), repo_item()]
        self.gists = {"hn-show-hn-tinyeval": the_gist(), "gh-officecli": the_repo_gist()}
        self.index = None
        self.save()

    def write(self, name, document):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document, indent=2) + "\n")

    def save(self):
        visible = [i for i in self.items if not i["hidden"]]
        counts = {c: sum(1 for i in visible if i["category"] == c) for c in contract.CATEGORIES}
        self.write(f"editions/{DATE}.json", {
            "schema_version": 1, "date": DATE, "generated_at": "2026-08-27T08:04:12Z",
            "counts": counts, "items": self.items})
        self.write("index.json", {"schema_version": 1, "generated_at": "2026-08-27T08:04:12Z",
                                  "editions": [{"date": DATE, "path": f"editions/{DATE}.json",
                                                "total": len(visible),
                                                "generated_at": "2026-08-27T08:04:12Z"}]})
        for path in (self.root / "gists").glob("*.json"):
            path.unlink()
        for slug, gist in self.gists.items():
            self.write(f"gists/{slug}.json", gist)
        index = self.index if self.index is not None else gist_index(*self.gists.values())
        if index != "absent":
            self.write("gists/index.json", index)

    def problems(self):
        try:
            contract.validate_content_root(self.root)
        except contract.FeedValidationError as exc:
            return str(exc).splitlines()
        return []


class TestAValidTree(unittest.TestCase):
    def test_the_fixture_tree_is_valid(self):
        self.assertEqual(Tree(self).problems(), [])

    def test_todays_content_is_still_valid(self):
        self.assertTrue(contract.validate_content_root(REPO_ROOT / "content"))

    def test_items_without_gists_and_no_gists_folder_are_valid(self):
        tree = Tree(self)
        for item in tree.items:
            del item["gist"]
        tree.gists = {}
        tree.index = "absent"
        tree.save()
        (tree.root / "gists").rmdir()
        self.assertEqual(tree.problems(), [])


class TestItemFields(unittest.TestCase):
    def test_gist_must_be_a_slug(self):
        for value in ("HN Tiny", "", 3, None):
            with self.subTest(value=value):
                self.assertTrue(any("gist" in p for p in
                                    contract._item_problems(hn_item(gist=value), DATE, None)))

    def test_front_page_is_true_and_on_hacker_news_items_only(self):
        self.assertTrue(any("front_page" in p for p in
                            contract._item_problems(hn_item(front_page=False), DATE, None)))
        self.assertTrue(any("front_page" in p for p in
                            contract._item_problems(repo_item(front_page=True), DATE, None)))
        self.assertEqual(contract._item_problems(hn_item(), DATE, None), [])

    def test_weekly_items_take_the_same_fields(self):
        item = hn_item(id="hn-show-hn-tinyeval-issue-9")
        self.assertEqual(contract._item_problems(item, None, None, issue_number=9), [])


class TestIndex(unittest.TestCase):
    def test_must_be_sorted_by_slug_with_unique_slugs_and_keys(self):
        tree = Tree(self)
        entries = gist_index(*tree.gists.values())["gists"]
        tree.index = gist_index(); tree.index["gists"] = list(reversed(entries))
        tree.save()
        self.assertTrue(any("sorted" in p for p in tree.problems()))

        tree.index = gist_index(); tree.index["gists"] = entries + entries[:1]
        tree.save()
        self.assertTrue(any("twice" in p for p in tree.problems()))

    def test_an_entry_without_its_file_and_a_file_without_its_entry(self):
        tree = Tree(self)
        tree.index = gist_index(tree.gists["hn-show-hn-tinyeval"])
        tree.save()
        self.assertTrue(any("gh-officecli" in p and "index" in p for p in tree.problems()))

        tree = Tree(self)
        extra = copy.deepcopy(tree.gists["gh-officecli"])
        extra.update(slug="gh-ghost", source_url="https://github.com/acme/ghost", url="https://github.com/acme/ghost")
        tree.index = gist_index(*tree.gists.values(), extra)
        tree.save()
        self.assertTrue(any("gh-ghost" in p and "missing" in p for p in tree.problems()))

    def test_gists_without_an_index_are_caught(self):
        tree = Tree(self)
        tree.index = "absent"
        tree.save()
        self.assertTrue(any("gists/index.json" in p for p in tree.problems()))

    def test_the_source_key_must_match_the_gist(self):
        tree = Tree(self)
        tree.index = gist_index(*tree.gists.values())
        tree.index["gists"][0]["source_key"] = "example.com/elsewhere"
        tree.save()
        self.assertTrue(any("source_key" in p for p in tree.problems()))

    def test_entry_fields(self):
        tree = Tree(self)
        tree.index = gist_index(*tree.gists.values())
        tree.index["gists"][0]["path"] = "../escape.json"
        tree.index["gists"][1]["extra"] = 1
        tree.save()
        found = tree.problems()
        self.assertTrue(any("path" in p for p in found), found)
        self.assertTrue(any("unknown key: extra" in p for p in found), found)

    def test_schema_version_and_generated_at(self):
        tree = Tree(self)
        tree.index = gist_index(*tree.gists.values(), schema_version=2, generated_at="soon")
        tree.save()
        found = tree.problems()
        self.assertTrue(any("schema_version" in p for p in found))
        self.assertTrue(any("generated_at" in p for p in found))


class TestItemsAndGistsAgree(unittest.TestCase):
    def test_an_items_gist_must_exist(self):
        tree = Tree(self)
        tree.items[1]["gist"] = "gh-nothing"
        tree.save()
        self.assertTrue(any("gh-nothing" in p for p in tree.problems()))

    def test_an_appearance_must_name_a_real_item_in_that_edition(self):
        tree = Tree(self)
        tree.gists["gh-officecli"]["appearances"] = [
            {"item_id": "gh-officecli-2026-08-28", "edition_date": "2026-08-28"}]
        tree.save()
        self.assertTrue(any("gh-officecli-2026-08-28" in p for p in tree.problems()))

    def test_the_item_must_point_back(self):
        tree = Tree(self)
        del tree.items[1]["gist"]
        tree.save()
        self.assertTrue(any("gh-officecli" in p and "point" in p for p in tree.problems()))

    def test_an_item_with_a_gist_must_be_one_of_its_appearances(self):
        tree = Tree(self)
        tree.items.append(repo_item(id=f"gh-officecli-two-{DATE}",
                                    source_url="https://github.com/acme/officecli-two",
                                    url="https://github.com/acme/officecli-two"))
        tree.save()
        self.assertTrue(any(f"gh-officecli-two-{DATE}" in p for p in tree.problems()))

    def test_front_page_on_an_item_reaches_its_gist(self):
        tree = Tree(self)
        del tree.gists["hn-show-hn-tinyeval"]["front_page"]
        tree.save()
        self.assertTrue(any("front_page" in p for p in tree.problems()))

    def test_a_weekly_appearance_must_name_an_issue_item(self):
        tree = Tree(self)
        tree.gists["hn-show-hn-tinyeval"]["appearances"].append(
            {"item_id": "hn-show-hn-tinyeval-issue-9", "issue_slug": "issue-9"})
        tree.save()
        self.assertTrue(any("issue-9" in p for p in tree.problems()))

    def test_a_weekly_appearance_that_points_back_is_valid(self):
        tree = Tree(self)
        tree.gists["hn-show-hn-tinyeval"]["appearances"].append(
            {"item_id": "hn-show-hn-tinyeval-issue-9", "issue_slug": "issue-9"})
        tree.save()
        weekly_item = hn_item(id="hn-show-hn-tinyeval-issue-9", rank=1)
        tree.write("weekly/issues/issue-9.json", {
            "schema_version": 1, "number": 9, "slug": "issue-9", "title": "Issue #9",
            "description": "", "published_on": "2026-08-31", "generated_at": "2026-08-31T05:00:00Z",
            "counts": {"launches": 0, "repos": 0, "news": 0, "hn": 1}, "items": [weekly_item]})
        # The issue file is read for items whether or not the weekly index lists it.
        self.assertEqual([p for p in tree.problems() if "issue-9" in p], [])

    def test_an_x_post_gist_needs_no_item(self):
        tree = Tree(self)
        tree.gists["x-anthropicai-applications-are-now-open-for"] = x_gist(appearances=[
            {"item_id": "x-anthropicai-applications-issue-19", "issue_slug": "issue-19"}])
        tree.save()
        self.assertEqual(tree.problems(), [])


class TestIndexSchema(unittest.TestCase):
    def setUp(self):
        self.schema = contract.load_schema("gist-index")

    def test_keys_agree(self):
        self.assertEqual(sorted(self.schema["required"]), sorted(gc.GIST_INDEX_REQUIRED))
        entry = self.schema["properties"]["gists"]["items"]
        self.assertEqual(sorted(entry["required"]), sorted(gc.GIST_INDEX_ENTRY_REQUIRED))
        self.assertEqual(sorted(entry["properties"]), sorted(gc.GIST_INDEX_ENTRY_REQUIRED))
        self.assertEqual(entry["properties"]["slug"]["pattern"], gc.GIST_SLUG_RE.pattern)
        self.assertEqual(entry["properties"]["path"]["pattern"], gc.GIST_PATH_RE.pattern)

    def test_published_id(self):
        self.assertEqual(self.schema["$id"], "https://aibytes.io/content/gist-index.schema.json")

    def test_item_schema_has_the_new_fields(self):
        item = contract.load_schema("edition")["$defs"]["item"]["properties"]
        self.assertEqual(item["gist"]["pattern"], gc.GIST_SLUG_RE.pattern)
        self.assertEqual(item["front_page"], {"const": True, "description": item["front_page"]["description"]})


if __name__ == "__main__":
    unittest.main()
