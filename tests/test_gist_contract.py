"""Offline tests for the gist contract (AIB-145y T5).

docs/specs/AIB-145y-gist-contract.md is the source. These cover one gist file
on its own: its fields, its sections and caps, its stats, links, appearances,
the source key, and slugs. The index and the checks across files are T6.
"""

import copy
import json
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))

import gist_contract as gc
import validate as contract

try:
    from jsonschema import Draft202012Validator
except ImportError:  # not a dependency - this repo's Python is stdlib only
    Draft202012Validator = None

TAG_NAMES = {"Evals", "Open Source", "Video"}

KEY_POINTS = {"key": "key_points", "points": [
    "One file you copy into a project; test cases are plain Python dicts.",
    "Scores by exact match, a regular expression, or a second model as judge.",
    "Prints a table and exits non-zero on a regression, so it drops into CI.",
]}
DISCUSSION = {"key": "discussion", "points": [
    {"stance": "agreed", "text": "Most commenters like that it can be read in one sitting.",
     "url": "https://news.ycombinator.com/item?id=50443901"},
    {"stance": "disputed", "text": "Whether a model-as-judge score means much without a baseline.",
     "url": "https://news.ycombinator.com/item?id=50443902"},
    {"stance": "counterpoint", "text": "One reply argues the single-file rule will not survive.",
     "url": "https://news.ycombinator.com/item?id=50443903"},
]}
LEDE = ("TinyEval is a 300-line Python file that runs prompt evaluations against "
        "any OpenAI-compatible endpoint, with no dependencies to install.")


def hn_gist(**overrides):
    base = {
        "schema_version": 1,
        "slug": "hn-show-hn-tinyeval",
        "kind": "hn",
        "source": "hackernews",
        "category": "hn",
        "title": "Show HN: TinyEval - an eval harness in a single Python file",
        "url": "https://github.com/mkrause/tinyeval",
        "source_url": "https://news.ycombinator.com/item?id=50443587",
        "tags": ["Evals", "Open Source"],
        "image": {"type": "none"},
        "depth": "full",
        "lede": LEDE,
        "sections": [copy.deepcopy(KEY_POINTS), copy.deepcopy(DISCUSSION)],
        "stats": {"points": 212, "comments": 87, "submitted_by": "mkrause",
                  "posted_at": "2026-08-26T18:02:00Z"},
        "stats_as_of": "2026-08-27T08:04:10Z",
        "front_page": True,
        "links": [
            {"role": "destination", "title": "mkrause/tinyeval on GitHub",
             "url": "https://github.com/mkrause/tinyeval"},
            {"role": "discussion", "title": "Show HN: TinyEval",
             "url": "https://news.ycombinator.com/item?id=50443587"},
        ],
        "appearances": [
            {"item_id": "hn-show-hn-tinyeval-2026-08-27", "edition_date": "2026-08-27"},
            {"item_id": "hn-show-hn-tinyeval-issue-9", "issue_slug": "issue-9"},
        ],
        "created_at": "2026-08-27T08:04:10Z",
        "updated_at": "2026-08-31T05:12:00Z",
    }
    base.update(overrides)
    return base


def repo_gist(**overrides):
    base = hn_gist(
        slug="gh-officecli", kind="repo", source="github", category="repos",
        title="OfficeCLI", url="https://github.com/acme/officecli",
        source_url="https://github.com/acme/officecli",
        sections=[copy.deepcopy(KEY_POINTS),
                  {"key": "try_it", "command": "pipx install officecli"},
                  {"key": "whats_open", "points": [
                      {"text": "Requests for .odt support.", "url": "https://github.com/acme/officecli/issues/12"},
                      {"text": "Fonts render wrong in exported PDFs."}]}],
        stats={"stars": 6400, "stars_gained": 2100, "forks": 210, "language": "Go",
               "license": "MIT", "created_on": "2026-05-02", "contributors": 14,
               "open_issues": 37, "last_release": {"tag": "v0.4.0", "published_on": "2026-08-20"}},
        links=[{"role": "destination", "title": "acme/officecli",
                "url": "https://github.com/acme/officecli"},
               {"role": "source", "title": "Open issues",
                "url": "https://github.com/acme/officecli/issues"}],
        appearances=[{"item_id": "gh-officecli-2026-08-27", "edition_date": "2026-08-27"}],
    )
    del base["front_page"]
    base.update(overrides)
    return base


def news_gist(**overrides):
    base = hn_gist(
        slug="tc-nvidia-earnings", kind="news", source="techcrunch", category="news",
        title="Nvidia earnings: data-center revenue up 64%",
        url="https://techcrunch.com/2026/08/27/nvidia-earnings/",
        source_url="https://techcrunch.com/2026/08/27/nvidia-earnings/",
        sections=[copy.deepcopy(KEY_POINTS),
                  {"key": "why_it_matters", "text": "Inference demand is now the main driver of GPU sales."}],
        links=[{"role": "destination", "title": "Nvidia earnings",
                "url": "https://techcrunch.com/2026/08/27/nvidia-earnings/"}],
        appearances=[{"item_id": "tc-nvidia-earnings-2026-08-27", "edition_date": "2026-08-27"}],
    )
    for key in ("front_page", "stats", "stats_as_of"):
        del base[key]
    base.update(overrides)
    return base


def launch_gist(**overrides):
    base = hn_gist(
        slug="ph-chatcut", kind="launch", source="producthunt", category="launches",
        title="ChatCut", url="https://chatcut.ai",
        source_url="https://www.producthunt.com/products/chatcut",
        sections=[copy.deepcopy(KEY_POINTS),
                  {"key": "who_its_for", "text": "Creators who already edit inside ChatGPT."},
                  {"key": "pricing", "text": "Free tier; Pro is $12 a month."}],
        stats={"upvotes": 776, "comments": 42},
        links=[{"role": "destination", "title": "ChatCut", "url": "https://chatcut.ai"},
               {"role": "discussion", "title": "ChatCut on Product Hunt",
                "url": "https://www.producthunt.com/products/chatcut"}],
        appearances=[{"item_id": "ph-chatcut-2026-08-27", "edition_date": "2026-08-27"}],
    )
    del base["front_page"]
    base.update(overrides)
    return base


def x_gist(**overrides):
    post = "https://x.com/AnthropicAI/status/2117343929960112486"
    base = {
        "schema_version": 1,
        "slug": "x-anthropicai-applications-are-now-open-for",
        "kind": "x_post",
        "title": "Anthropic: Applications are now open for the Anthropic Residency",
        "url": post,
        "source_url": post,
        "tags": [],
        "image": {"type": "none"},
        "depth": "preview",
        "sections": [],
        "stats": {"likes": 40500, "reposts": 3200, "replies": 1229, "views": 14766946},
        "stats_as_of": "2026-11-09T10:00:00Z",
        "preview": {"bucket": "announcement", "author_name": "Anthropic",
                    "author_handle": "@AnthropicAI", "posted_on": "2026-11-02",
                    "text": "Applications are now open for the Anthropic Residency.",
                    "media": "link"},
        "links": [{"role": "discussion", "title": "The post on X", "url": post}],
        "appearances": [{"item_id": "x-anthropicai-applications-issue-19", "issue_slug": "issue-19"}],
        "created_at": "2026-11-09T10:00:00Z",
        "updated_at": "2026-11-09T10:00:00Z",
    }
    base.update(overrides)
    return base


def problems(gist):
    try:
        gc.validate_gist(gist, tag_names=TAG_NAMES)
    except contract.FeedValidationError as exc:
        return str(exc).splitlines()
    return []


class TestValidGists(unittest.TestCase):
    def test_one_of_each_kind_is_valid(self):
        for make in (hn_gist, repo_gist, news_gist, launch_gist, x_gist):
            with self.subTest(kind=make().get("kind")):
                self.assertEqual(problems(make()), [])

    def test_a_brief_gist_needs_only_a_lede(self):
        self.assertEqual(problems(news_gist(depth="brief", sections=[])), [])

    def test_optional_keys_may_be_absent(self):
        gist = hn_gist()
        for key in ("stats", "stats_as_of", "front_page"):
            del gist[key]
        self.assertEqual(problems(gist), [])

    def test_tags_are_only_checked_against_the_list_when_it_is_given(self):
        gc.validate_gist(hn_gist(tags=["Not A Tag"]))


class TestFields(unittest.TestCase):
    def test_rejects_a_missing_required_key_and_an_unknown_one(self):
        gist = hn_gist(extra=1)
        del gist["lede"]
        found = problems(gist)
        self.assertIn("unknown key: extra", found)
        self.assertTrue(any("lede" in line for line in found), found)

    def test_rejects_a_wrong_schema_version(self):
        self.assertTrue(any("schema_version" in p for p in problems(hn_gist(schema_version=2))))

    def test_rejects_an_unknown_kind_or_depth(self):
        self.assertTrue(any("kind" in p for p in problems(hn_gist(kind="thread"))))
        self.assertTrue(any("depth" in p for p in problems(hn_gist(depth="deep"))))

    def test_rejects_a_bad_slug(self):
        for slug in ("HN-Tiny", "hn--tiny", "-hn", "a" * 81, "hn tiny"):
            with self.subTest(slug=slug):
                self.assertTrue(any("slug" in p for p in problems(hn_gist(slug=slug))))

    def test_rejects_non_http_links_anywhere(self):
        self.assertTrue(problems(hn_gist(url="javascript:alert(1)")))
        self.assertTrue(problems(hn_gist(source_url="ftp://x.example/a")))
        gist = hn_gist()
        gist["links"][0]["url"] = "mailto:a@example.com"
        self.assertTrue(problems(gist))
        gist = hn_gist()
        gist["sections"][1]["points"][0]["url"] = "data:text/html,hi"
        self.assertTrue(problems(gist))

    def test_title_and_lede_caps(self):
        self.assertTrue(any("title" in p for p in problems(hn_gist(title="x" * (gc.TITLE_MAX + 1)))))
        self.assertTrue(any("lede" in p for p in problems(hn_gist(lede="Too short."))))
        self.assertTrue(any("lede" in p for p in problems(hn_gist(lede="x" * (gc.LEDE_MAX + 1)))))

    def test_rejects_unknown_or_too_many_tags(self):
        self.assertTrue(any("tag" in p for p in problems(hn_gist(tags=["Nope"]))))
        self.assertTrue(problems(hn_gist(tags=["Evals"] * 5)))

    def test_updated_at_cannot_precede_created_at(self):
        found = problems(hn_gist(updated_at="2026-08-26T00:00:00Z"))
        self.assertTrue(any("updated_at" in p for p in found), found)

    def test_timestamps_must_parse(self):
        self.assertTrue(any("created_at" in p for p in problems(hn_gist(created_at="yesterday"))))


class TestKindAgreement(unittest.TestCase):
    def test_kind_must_match_source_and_category(self):
        self.assertTrue(problems(hn_gist(source="github")))
        self.assertTrue(problems(hn_gist(category="news")))

    def test_only_x_posts_drop_source_and_category(self):
        gist = hn_gist()
        del gist["source"]
        self.assertTrue(any("source" in p for p in problems(gist)))
        self.assertTrue(any("source" in p for p in problems(x_gist(source="hackernews"))))

    def test_preview_depth_belongs_to_x_posts_only(self):
        self.assertTrue(any("preview" in p for p in problems(hn_gist(depth="preview"))))
        self.assertTrue(any("preview" in p for p in problems(x_gist(depth="full"))))

    def test_an_x_post_needs_its_preview_and_nothing_else_has_one(self):
        gist = x_gist()
        del gist["preview"]
        self.assertTrue(any("preview" in p for p in problems(gist)))
        self.assertTrue(any("preview" in p for p in problems(hn_gist(preview=x_gist()["preview"]))))

    def test_an_x_post_points_at_itself(self):
        self.assertTrue(problems(x_gist(source_url="https://x.com/someone")))

    def test_lede_is_required_except_on_a_preview(self):
        gist = news_gist()
        del gist["lede"]
        self.assertTrue(any("lede" in p for p in problems(gist)))
        self.assertEqual(problems(x_gist(lede="The newsletter's one line about this post, kept short.")), [])

    def test_front_page_is_true_on_hn_only(self):
        self.assertTrue(any("front_page" in p for p in problems(hn_gist(front_page=False))))
        self.assertTrue(any("front_page" in p for p in problems(repo_gist(front_page=True))))


class TestSections(unittest.TestCase):
    def test_full_gists_need_key_points(self):
        found = problems(hn_gist(sections=[copy.deepcopy(DISCUSSION)]))
        self.assertTrue(any("key_points" in p for p in found), found)

    def test_x_posts_have_no_sections(self):
        self.assertTrue(problems(x_gist(sections=[copy.deepcopy(KEY_POINTS)])))

    def test_a_section_must_belong_to_the_kind(self):
        found = problems(hn_gist(sections=[copy.deepcopy(KEY_POINTS),
                                           {"key": "try_it", "command": "pip install x"}]))
        self.assertTrue(any("try_it" in p for p in found), found)

    def test_unknown_repeated_or_out_of_order_sections(self):
        self.assertTrue(problems(hn_gist(sections=[copy.deepcopy(KEY_POINTS), {"key": "faq", "text": "x"}])))
        self.assertTrue(problems(hn_gist(sections=[copy.deepcopy(KEY_POINTS)] * 2)))
        self.assertTrue(problems(hn_gist(sections=[copy.deepcopy(DISCUSSION), copy.deepcopy(KEY_POINTS)])))

    def test_key_point_counts_and_caps(self):
        two = {"key": "key_points", "points": KEY_POINTS["points"][:2]}
        six = {"key": "key_points", "points": KEY_POINTS["points"] * 2}
        long = {"key": "key_points", "points": KEY_POINTS["points"][:2] + ["x" * (gc.POINT_MAX + 1)]}
        for section in (two, six, long):
            with self.subTest(n=len(section["points"])):
                self.assertTrue(problems(hn_gist(sections=[section, copy.deepcopy(DISCUSSION)])))

    def test_discussion_points_need_a_known_stance_and_a_link(self):
        gist = hn_gist()
        gist["sections"][1]["points"][0]["stance"] = "angry"
        self.assertTrue(any("stance" in p for p in problems(gist)))
        gist = hn_gist()
        del gist["sections"][1]["points"][0]["url"]
        self.assertTrue(problems(gist))

    def test_text_sections_have_caps(self):
        too_long = {"key": "why_it_matters", "text": "x" * (gc.TEXT_CAPS["why_it_matters"] + 1)}
        self.assertTrue(problems(news_gist(sections=[copy.deepcopy(KEY_POINTS), too_long])))
        empty = {"key": "pricing", "text": "  "}
        self.assertTrue(problems(launch_gist(sections=[copy.deepcopy(KEY_POINTS), empty])))

    def test_try_it_is_one_line(self):
        section = {"key": "try_it", "command": "pip install a\nrm -rf /"}
        self.assertTrue(problems(repo_gist(sections=[copy.deepcopy(KEY_POINTS), section])))

    def test_whats_open_needs_two_to_five_points(self):
        one = {"key": "whats_open", "points": [{"text": "Only one theme."}]}
        self.assertTrue(problems(repo_gist(sections=[copy.deepcopy(KEY_POINTS), one])))


class TestStats(unittest.TestCase):
    def test_stats_keys_belong_to_the_kind(self):
        self.assertTrue(any("stars" in p for p in problems(hn_gist(stats={"stars": 3}))))

    def test_news_has_no_stats(self):
        self.assertTrue(problems(news_gist(stats={"points": 1}, stats_as_of="2026-08-27T08:04:10Z")))

    def test_stats_and_stats_as_of_come_together(self):
        gist = hn_gist()
        del gist["stats_as_of"]
        self.assertTrue(any("stats_as_of" in p for p in problems(gist)))
        gist = hn_gist()
        del gist["stats"]
        self.assertTrue(any("stats_as_of" in p for p in problems(gist)))

    def test_stats_are_never_empty(self):
        self.assertTrue(problems(hn_gist(stats={})))

    def test_stat_types(self):
        for stats in ({"points": -1}, {"points": True}, {"points": 1.5},
                      {"submitted_by": 3}, {"posted_at": "19h ago"}):
            with self.subTest(stats=stats):
                self.assertTrue(problems(hn_gist(stats=stats)))
        for stats in ({"created_on": "2026-13-01"}, {"last_release": {"tag": "v1"}},
                      {"last_release": {"tag": "v1", "published_on": "2026-08-20", "x": 1}}):
            with self.subTest(stats=stats):
                self.assertTrue(problems(repo_gist(stats=stats)))


class TestLinks(unittest.TestCase):
    def test_one_destination_and_one_discussion_at_most(self):
        gist = hn_gist()
        gist["links"].append({"role": "destination", "title": "Mirror", "url": "https://example.com/m"})
        self.assertTrue(any("destination" in p for p in problems(gist)))

    def test_needs_a_destination_or_a_discussion(self):
        only_sources = [{"role": "source", "title": "README", "url": "https://github.com/a/b#readme"}]
        self.assertTrue(problems(hn_gist(links=only_sources)))

    def test_unique_urls_known_roles_and_a_cap(self):
        gist = hn_gist()
        gist["links"].append({"role": "source", "title": "Again", "url": gist["links"][0]["url"]})
        self.assertTrue(any("url" in p for p in problems(gist)))
        gist = hn_gist()
        gist["links"][1]["role"] = "mirror"
        self.assertTrue(any("role" in p for p in problems(gist)))
        many = [{"role": "source", "title": f"S{i}", "url": f"https://example.com/{i}"}
                for i in range(gc.LINKS_MAX)]
        self.assertTrue(problems(hn_gist(links=hn_gist()["links"][:1] + many)))


class TestAppearances(unittest.TestCase):
    def test_at_least_one(self):
        self.assertTrue(problems(hn_gist(appearances=[])))

    def test_each_names_one_edition_or_one_issue_that_matches_its_id(self):
        bad = [
            {"item_id": "hn-a-2026-08-27"},
            {"item_id": "hn-a-2026-08-27", "edition_date": "2026-08-27", "issue_slug": "issue-9"},
            {"item_id": "hn-a-2026-08-27", "edition_date": "2026-08-28"},
            {"item_id": "hn-a-issue-9", "issue_slug": "issue-10"},
            {"item_id": "Not An Id", "edition_date": "2026-08-27"},
        ]
        for appearance in bad:
            with self.subTest(appearance=appearance):
                self.assertTrue(problems(hn_gist(appearances=[appearance])))

    def test_no_repeats_and_oldest_first(self):
        first = {"item_id": "hn-a-2026-08-27", "edition_date": "2026-08-27"}
        later = {"item_id": "hn-a-2026-08-29", "edition_date": "2026-08-29"}
        self.assertTrue(problems(hn_gist(appearances=[first, first])))
        self.assertTrue(problems(hn_gist(appearances=[later, first])))
        issue_9 = {"item_id": "hn-a-issue-9", "issue_slug": "issue-9"}
        issue_8 = {"item_id": "hn-a-issue-8", "issue_slug": "issue-8"}
        self.assertTrue(problems(hn_gist(appearances=[first, issue_9, issue_8])))


class TestPreview(unittest.TestCase):
    def test_required_fields_and_enums(self):
        for key in ("bucket", "author_handle", "text"):
            with self.subTest(missing=key):
                gist = x_gist()
                del gist["preview"][key]
                self.assertTrue(problems(gist))
        gist = x_gist()
        gist["preview"]["bucket"] = "viral"
        self.assertTrue(any("bucket" in p for p in problems(gist)))
        gist = x_gist()
        gist["preview"]["media"] = "audio"
        self.assertTrue(any("media" in p for p in problems(gist)))
        gist = x_gist()
        gist["preview"]["text"] = "x" * (gc.PREVIEW_TEXT_MAX + 1)
        self.assertTrue(problems(gist))

    def test_media_matches_the_x_snapshot_contract(self):
        sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))
        from aibytes_fetchers import x_paste
        self.assertEqual(set(gc.X_MEDIA), x_paste.ENUMS["media"])
        self.assertEqual(set(gc.X_BUCKETS), set(x_paste.BUCKETS))


class TestReportsEverythingAtOnce(unittest.TestCase):
    def test_several_problems_in_one_error(self):
        gist = hn_gist(kind="thread", depth="deep", url="nope")
        self.assertGreaterEqual(len(problems(gist)), 3)


class TestSourceKey(unittest.TestCase):
    def test_the_spec_example(self):
        self.assertEqual(gc.source_key("https://www.GitHub.com/owner/Repo/?utm_source=x#readme"),
                         "github.com/owner/Repo")

    def test_hn_keeps_its_id(self):
        self.assertEqual(gc.source_key("https://news.ycombinator.com/item?id=50443587"),
                         "news.ycombinator.com/item?id=50443587")

    def test_tracking_parameters_go_and_others_stay_in_order(self):
        self.assertEqual(
            gc.source_key("https://example.com/a?b=2&utm_campaign=x&ref=aiBytes_&a=1&fbclid=z&gclid=q"),
            "example.com/a?b=2&a=1")
        for name in ("ref_src", "mc_cid", "mc_eid", "UTM_Source"):
            with self.subTest(name=name):
                self.assertEqual(gc.source_key(f"https://example.com/a?{name}=1"), "example.com/a")

    def test_scheme_and_host_case_and_trailing_slash(self):
        self.assertEqual(gc.source_key("HTTP://Example.COM/Path/"), "example.com/Path")
        self.assertEqual(gc.source_key("https://example.com/"), "example.com/")
        self.assertEqual(gc.source_key("https://example.com"), "example.com/")
        self.assertEqual(gc.source_key("http://example.com/a"), gc.source_key("https://example.com/a"))

    def test_only_a_leading_www_is_dropped(self):
        self.assertEqual(gc.source_key("https://www2.example.com/a"), "www2.example.com/a")
        self.assertEqual(gc.source_key("https://news.www.example.com/a"), "news.www.example.com/a")

    def test_the_same_story_on_two_days_has_one_key(self):
        day_one = "https://techcrunch.com/2026/08/27/nvidia/?utm_source=feed"
        day_two = "https://www.techcrunch.com/2026/08/27/nvidia/#comments"
        self.assertEqual(gc.source_key(day_one), gc.source_key(day_two))

    def test_rejects_what_is_not_an_http_url(self):
        for value in ("ftp://a.example/x", "news.ycombinator.com", "", None):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    gc.source_key(value)


class TestSlugs(unittest.TestCase):
    def test_item_ids_lose_their_date_or_issue(self):
        self.assertEqual(gc.slug_from_item_id("hn-show-hn-tinyeval-2026-08-27"), "hn-show-hn-tinyeval")
        self.assertEqual(gc.slug_from_item_id("hn-genie-4-issue-16"), "hn-genie-4")

    def test_long_slugs_are_trimmed_at_a_hyphen(self):
        item_id = "tc-" + "-".join(["word"] * 30) + "-2026-08-27"
        slug = gc.slug_from_item_id(item_id)
        self.assertLessEqual(len(slug), gc.GIST_SLUG_MAX)
        self.assertFalse(slug.endswith("-"))
        self.assertTrue(gc.GIST_SLUG_RE.match(slug))

    def test_an_x_post_slug_is_handle_plus_five_words(self):
        self.assertEqual(
            gc.x_post_slug("@AnthropicAI", "Applications are now open for the Anthropic Residency, a paid program"),
            "x-anthropicai-applications-are-now-open-for")
        self.assertEqual(gc.x_post_slug("@a_b", "Ship it! 🚀 Today: v2.0"), "x-a-b-ship-it-today-v2-0")

    def test_a_clash_gets_the_next_free_number(self):
        self.assertEqual(gc.unique_slug("hn-a", set()), "hn-a")
        self.assertEqual(gc.unique_slug("hn-a", {"hn-a"}), "hn-a-2")
        self.assertEqual(gc.unique_slug("hn-a", {"hn-a", "hn-a-2"}), "hn-a-3")

    def test_rejects_an_id_that_is_not_an_item_id(self):
        with self.assertRaises(ValueError):
            gc.slug_from_item_id("hn-no-date")


class TestSchemaAgrees(unittest.TestCase):
    """gist.schema.json and gist_contract.py must say the same thing."""

    def setUp(self):
        self.schema = contract.load_schema("gist")
        self.defs = self.schema["$defs"]

    def test_required_and_optional_keys(self):
        self.assertEqual(sorted(self.schema["required"]), sorted(gc.GIST_REQUIRED))
        self.assertEqual(sorted(self.schema["properties"]),
                         sorted(gc.GIST_REQUIRED + gc.GIST_OPTIONAL))

    def test_enums(self):
        props = self.schema["properties"]
        self.assertEqual(sorted(props["kind"]["enum"]), sorted(gc.KINDS))
        self.assertEqual(sorted(props["depth"]["enum"]), sorted(gc.DEPTHS))
        self.assertEqual(sorted(self.defs["link"]["properties"]["role"]["enum"]), sorted(gc.LINK_ROLES))
        self.assertEqual(sorted(self.defs["preview"]["properties"]["bucket"]["enum"]), sorted(gc.X_BUCKETS))
        self.assertEqual(sorted(self.defs["preview"]["properties"]["media"]["enum"]), sorted(gc.X_MEDIA))
        stance = self.defs["section_discussion"]["properties"]["points"]["items"]["properties"]["stance"]
        self.assertEqual(sorted(stance["enum"]), sorted(gc.STANCES))

    def test_section_keys(self):
        keys = [self.defs[ref["$ref"].split("/")[-1]]["properties"]["key"]["const"]
                for ref in self.defs["section"]["oneOf"]]
        self.assertEqual(sorted(keys), sorted(gc.SECTION_KEYS))

    def test_stats_keys_per_kind(self):
        self.assertEqual(sorted(self.defs["stats"]["properties"]),
                         sorted({key for keys in gc.STATS_TYPES.values() for key in keys}))

    def test_caps_and_patterns(self):
        props = self.schema["properties"]
        self.assertEqual(props["slug"]["pattern"], gc.GIST_SLUG_RE.pattern)
        self.assertEqual(props["slug"]["maxLength"], gc.GIST_SLUG_MAX)
        self.assertEqual(props["title"]["maxLength"], gc.TITLE_MAX)
        self.assertEqual(props["lede"]["minLength"], gc.LEDE_MIN)
        self.assertEqual(props["lede"]["maxLength"], gc.LEDE_MAX)
        self.assertEqual(props["links"]["maxItems"], gc.LINKS_MAX)
        self.assertEqual(props["tags"]["maxItems"], contract.MAX_TAGS)
        self.assertEqual(self.defs["httpUrl"]["pattern"], contract.URL_RE.pattern)
        self.assertEqual(self.defs["preview"]["properties"]["text"]["maxLength"], gc.PREVIEW_TEXT_MAX)
        points = self.defs["section_key_points"]["properties"]["points"]
        self.assertEqual((points["minItems"], points["maxItems"], points["items"]["maxLength"]),
                         (gc.KEY_POINTS_MIN, gc.KEY_POINTS_MAX, gc.POINT_MAX))
        for key, cap in gc.TEXT_CAPS.items():
            with self.subTest(section=key):
                self.assertEqual(self.defs["section_" + key]["properties"]["text"]["maxLength"], cap)

    def test_shared_definitions_match_the_edition_schema(self):
        # Inlined rather than $ref'd across files, so a schema engine never
        # goes to the network to resolve them.
        edition = contract.load_schema("edition")
        item = edition["$defs"]["item"]["properties"]
        props = self.schema["properties"]
        self.assertEqual(props["source"]["enum"], item["source"]["enum"])
        self.assertEqual(sorted(props["source"]["enum"]), sorted(contract.SOURCES))
        self.assertEqual(props["category"]["enum"], item["category"]["enum"])
        self.assertEqual(self.defs["image"], edition["$defs"]["image"])
        self.assertEqual(self.defs["httpUrl"]["pattern"], edition["$defs"]["httpUrl"]["pattern"])
        refs = [ref for ref in json.dumps(self.schema).split('"$ref": ')[1:]]
        self.assertTrue(all(ref.startswith('"#/') for ref in refs), "every $ref stays in this file")

    def test_published_id(self):
        self.assertEqual(self.schema["$id"], "https://aibytes.io/content/gist.schema.json")

    @unittest.skipIf(Draft202012Validator is None, "jsonschema is not installed")
    def test_the_schema_accepts_every_valid_fixture(self):
        Draft202012Validator.check_schema(self.schema)
        validator = Draft202012Validator(self.schema)
        for make in (hn_gist, repo_gist, news_gist, launch_gist, x_gist):
            with self.subTest(kind=make().get("kind")):
                self.assertEqual([e.message for e in validator.iter_errors(make())], [])


class TestContentRoot(unittest.TestCase):
    """Each gist file under content/gists/ is checked on its own (T5)."""

    def tree(self, gists):
        root = pathlib.Path(self._tmp())
        minimal_content(root)
        (root / "gists").mkdir()
        for name, gist in gists.items():
            (root / "gists" / name).write_text(json.dumps(gist))
        return root

    def _tmp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        return tmp.name

    def test_todays_content_is_still_valid(self):
        self.assertTrue(contract.validate_content_root(REPO_ROOT / "content"))

    def test_a_valid_gist_file_passes_on_its_own(self):
        root = self.tree({"hn-show-hn-tinyeval.json": hn_gist(tags=[])})
        problems_in = per_gist_problems(root)
        self.assertEqual(problems_in, [])

    def test_a_bad_gist_file_is_reported_by_name(self):
        root = self.tree({"hn-show-hn-tinyeval.json": hn_gist(tags=[], kind="thread")})
        self.assertTrue(any(p.startswith("gists/hn-show-hn-tinyeval.json:") for p in per_gist_problems(root)))

    def test_the_slug_must_match_the_file_name(self):
        root = self.tree({"hn-other.json": hn_gist(tags=[])})
        self.assertTrue(any("file name" in p for p in per_gist_problems(root)))

    def test_validate_content_root_runs_the_gist_checks(self):
        root = self.tree({"hn-show-hn-tinyeval.json": hn_gist(tags=["Not In Tags"])})
        with self.assertRaises(contract.FeedValidationError) as caught:
            contract.validate_content_root(root)
        self.assertIn("gists/hn-show-hn-tinyeval.json: tag 'Not In Tags' is not in tags.json",
                      str(caught.exception))

    def test_a_tree_without_gists_is_valid(self):
        root = pathlib.Path(self._tmp())
        minimal_content(root)
        self.assertTrue(contract.validate_content_root(root))

    def test_a_file_that_is_not_json_is_reported(self):
        root = self.tree({})
        (root / "gists" / "hn-broken.json").write_text("{not json")
        self.assertTrue(any("not valid JSON" in p for p in per_gist_problems(root)))


def minimal_content(root):
    """A minimal valid content tree: tags, an empty index, an empty log."""
    (root / "editions").mkdir(parents=True)
    tags = {"schema_version": 1, "groups": [{"name": "Domain", "tags": [
        {"name": "Evals", "slug": "evals"}, {"name": "Open Source", "slug": "open-source"}]}]}
    (root / "tags.json").write_text(json.dumps(tags))
    (root / "index.json").write_text(json.dumps(
        {"schema_version": 1, "generated_at": "2026-08-27T08:04:12Z", "editions": []}))
    (root / "hidden.json").write_text(json.dumps({"schema_version": 1, "hidden": []}))


def per_gist_problems(root):
    """Problems from the per-file gist checks only (T6 adds the cross-file ones)."""
    return gc.gist_file_problems(pathlib.Path(root), tag_names=None)


if __name__ == "__main__":
    unittest.main()
