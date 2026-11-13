"""Offline unit tests for the shared fetch package (packages/fetchers).

No network. Covers the parts the four source modules now share: window
resolution, snapshot layout, envelope shape, the source registry, and the
multi-source CLI's argument merging.
"""

import datetime as dt
import json
import pathlib
import sys
import tempfile
import os
import unittest
from unittest import mock

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import article, cli, envelope, hn_thread, http, layout, registry, runner, window as window_mod
from aibytes_fetchers.sources import github, hackernews, producthunt, techcrunch


class TestWindow(unittest.TestCase):
    def test_cadence_sets_the_default_length(self):
        self.assertEqual(window_mod.resolve("daily", date="2026-07-16").days, 1)
        self.assertEqual(window_mod.resolve("weekly", date="2026-07-16").days, 7)
        self.assertEqual(window_mod.resolve("monthly", date="2026-07-16").days, 30)

    def test_explicit_days_overrides_the_cadence_default(self):
        win = window_mod.resolve("daily", days=3, date="2026-07-16")
        self.assertEqual(win.days, 3)
        self.assertEqual(win.cadence, "daily")

    def test_window_is_half_open_and_includes_the_as_of_day(self):
        win = window_mod.resolve("weekly", date="2026-07-16")
        self.assertEqual(win.start, dt.date(2026, 7, 9))
        self.assertEqual(win.end, dt.date(2026, 7, 17))

    def test_weekly_window_matches_the_pre_refactor_behaviour(self):
        # The old scripts computed as_of - days .. as_of + 1 day.
        as_of = dt.date(2026, 8, 31)
        win = window_mod.resolve("weekly", date=as_of.isoformat())
        self.assertEqual(win.start, as_of - dt.timedelta(days=7))
        self.assertEqual(win.end, as_of + dt.timedelta(days=1))

    def test_producthunt_window_keys_differ_from_the_rest(self):
        win = window_mod.resolve("weekly", date="2026-07-16")
        self.assertEqual(sorted(win.as_dict()), ["after", "before"])
        self.assertEqual(sorted(win.as_rfc3339_dict()), ["postedAfter", "postedBefore"])
        self.assertTrue(win.as_rfc3339_dict()["postedAfter"].endswith("T00:00:00Z"))

    def test_unknown_cadence_is_rejected(self):
        with self.assertRaises(ValueError):
            window_mod.resolve("hourly")


class TestLayout(unittest.TestCase):
    def test_weekly_path_is_unchanged(self):
        # Two years of committed snapshots and the newsletter skills depend on
        # this exact shape.
        self.assertEqual(
            layout.snapshot_path("/tmp/x", dt.date(2026, 7, 16), "weekly",
                                 ("producthunt",), "ph_data.json"),
            pathlib.Path("/tmp/x/2026/07/weeks/week-29/producthunt/ph_data.json"),
        )

    def test_daily_and_monthly_get_their_own_period_folders(self):
        self.assertEqual(
            layout.snapshot_path("/tmp/x", dt.date(2026, 7, 16), "daily",
                                 ("github",), "gh_data.json"),
            pathlib.Path("/tmp/x/2026/07/days/2026-07-16/github/gh_data.json"),
        )
        self.assertEqual(
            layout.snapshot_path("/tmp/x", dt.date(2026, 7, 16), "monthly",
                                 ("github",), "gh_data.json"),
            pathlib.Path("/tmp/x/2026/07/months/2026-07/github/gh_data.json"),
        )

    def test_relative_output_root_resolves_against_the_repo(self):
        path = layout.snapshot_path("newsletter/data", dt.date(2026, 7, 16), "weekly",
                                    ("github",), "gh_data.json", repo_root="/repo")
        self.assertTrue(str(path).startswith("/repo/newsletter/data/"))

    def test_absolute_output_root_is_left_outside_the_repo(self):
        path = layout.snapshot_path("/elsewhere", dt.date(2026, 7, 16), "weekly",
                                    ("github",), "gh_data.json", repo_root="/repo")
        self.assertTrue(str(path).startswith("/elsewhere/"))


class TestEnvelope(unittest.TestCase):
    def test_key_order_matches_the_committed_snapshots(self):
        body = envelope.build(
            "hackernews", "stories", [], as_of=dt.date(2026, 7, 16),
            section="ai-news", window={"after": "a", "before": "b"},
            query_params={}, total_count=3, pool_count=9,
        )
        self.assertEqual(
            list(body),
            ["source", "section", "fetched_at", "window", "query_params",
             "totalCount", "poolCount", "stories"],
        )

    def test_optional_keys_are_omitted_not_nulled(self):
        body = envelope.build(
            "producthunt", "posts", [], as_of=dt.date(2026, 7, 16),
            query_params={}, total_count=0,
        )
        self.assertEqual(list(body), ["source", "fetched_at", "query_params", "totalCount", "posts"])
        self.assertNotIn("section", body)
        self.assertNotIn("poolCount", body)

    def test_write_creates_parents_and_trailing_newline(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = pathlib.Path(tmp) / "a" / "b" / "out.json"
            envelope.write(path, {"source": "x"})
            text = path.read_text()
            self.assertTrue(text.endswith("\n"))
            self.assertEqual(json.loads(text), {"source": "x"})


class TestRegistry(unittest.TestCase):
    def test_every_source_declares_the_required_contract(self):
        for name, source in registry.SOURCES.items():
            with self.subTest(source=name):
                for attr in ("NAME", "SOURCE", "SUBPATH", "FILENAME", "ITEMS_KEY", "DEFAULT_COUNT"):
                    self.assertTrue(hasattr(source, attr), f"{name} missing {attr}")
                for fn in ("add_arguments", "fetch", "format_line"):
                    self.assertTrue(callable(getattr(source, fn, None)), f"{name} missing {fn}()")

    def test_aliases_resolve_to_the_same_module(self):
        self.assertIs(registry.resolve("hn"), hackernews)
        self.assertIs(registry.resolve("hacker-news"), hackernews)
        self.assertIs(registry.resolve("gh"), github)
        self.assertIs(registry.resolve("product-hunt"), producthunt)
        self.assertIs(registry.resolve("tc"), techcrunch)

    def test_unknown_source_raises(self):
        with self.assertRaises(KeyError):
            registry.resolve("reddit")


class TestGithubParsing(unittest.TestCase):
    ARTICLE = (
        '<article class="Box-row">'
        '<h2><a href="/acme/llm-tool"></a></h2>'
        '<p class="col-9 color-fg-muted">An LLM tool</p>'
        '<span itemprop="programmingLanguage">Python</span>'
        '<a href="/acme/llm-tool/stargazers"><svg></svg> 1,234</a>'
        '<a href="/acme/llm-tool/forks"><svg></svg> 56</a>'
        "<span>{period}</span>"
        "</article>"
    )

    def test_period_stars_parse_for_every_cadence_wording(self):
        # GitHub says "stars today" on the daily page and "stars this week" /
        # "stars this month" on the others. Matching only "this <period>" made
        # every daily snapshot rank on zeroes.
        for phrase, expected in (
            ("3,722 stars today", 3722),
            ("13,413 stars this week", 13413),
            ("11,259 stars this month", 11259),
        ):
            with self.subTest(phrase=phrase):
                repos = github.parse_trending(self.ARTICLE.format(period=phrase))
                self.assertEqual(repos[0]["period_stars"], expected)

    def test_card_fields_are_parsed(self):
        repo = github.parse_trending(self.ARTICLE.format(period="10 stars today"))[0]
        self.assertEqual(repo["name"], "acme/llm-tool")
        self.assertEqual(repo["url"], "https://github.com/acme/llm-tool")
        self.assertEqual(repo["language"], "Python")
        self.assertEqual(repo["stars"], 1234)
        self.assertEqual(repo["forks"], 56)


class TestCli(unittest.TestCase):
    def test_defaults_to_every_source(self):
        args = cli.build_parser().parse_args([])
        self.assertEqual([s.NAME for s in cli.selected_sources(args)], registry.names())

    def test_skip_accepts_aliases(self):
        args = cli.build_parser().parse_args(["--skip", "ph", "--skip", "hacker-news"])
        self.assertEqual([s.NAME for s in cli.selected_sources(args)], ["techcrunch", "github"])

    def test_explicit_sources_win(self):
        args = cli.build_parser().parse_args(["--sources", "gh"])
        self.assertEqual([s.NAME for s in cli.selected_sources(args)], ["github"])

    def test_source_defaults_survive_when_shared_flags_are_unset(self):
        args = cli.build_parser().parse_args(["--cadence", "daily"])
        merged = cli.source_args(hackernews, args)
        self.assertEqual(merged.count, hackernews.DEFAULT_COUNT)  # source default kept
        self.assertEqual(merged.min_points, 50)                   # source-specific default kept
        self.assertEqual(merged.cadence, "daily")                 # shared flag applied

    def test_explicit_count_overrides_every_source_default(self):
        args = cli.build_parser().parse_args(["--count", "2"])
        for source in registry.SOURCES.values():
            with self.subTest(source=source.NAME):
                self.assertEqual(cli.source_args(source, args).count, 2)

    def test_github_since_follows_the_cadence(self):
        args = runner.defaults_for(github)
        self.assertIsNone(args.since)  # unset means "follow the cadence"



class TestHackerNewsFrontPage(unittest.TestCase):
    """AIB-145y T8: Algolia tags a story front_page while it is on HN's front
    page. The fetcher keeps that, so a gist and its card can show the badge."""

    def hit(self, tags):
        return {"objectID": "50443587", "title": "Show HN: TinyEval", "url": "https://example.com",
                "points": 212, "num_comments": 87, "author": "mkrause",
                "created_at": "2026-08-26T18:02:00Z", "_tags": tags}

    def test_a_front_page_story_says_so(self):
        story = hackernews.to_story(self.hit(["story", "author_mkrause", "show_hn", "front_page"]))
        self.assertIs(story["front_page"], True)
        self.assertEqual(story["type"], "show_hn")

    def test_any_other_story_does_not(self):
        for tags in (["story"], [], None):
            with self.subTest(tags=tags):
                hit = self.hit(tags)
                if tags is None:
                    del hit["_tags"]
                self.assertIs(hackernews.to_story(hit)["front_page"], False)


FIXTURES = REPO_ROOT / "tests" / "fixtures" / "gists"
SKIP_LIVE = os.environ.get("AIBYTES_SKIP_LIVE") == "1"


def fixture(name):
    return (FIXTURES / name).read_text()


def fake_fetch(pages):
    """A stand-in for http.fetch: url -> Response, 404 for anything else."""
    calls = []

    def fetch(url, headers=None, data=None, **_):
        calls.append(url)
        return pages.get(url) or http.Response(404, error="HTTP 404")
    fetch.calls = calls
    return fetch


def html_page(body, status=200, kind="text/html; charset=utf-8"):
    return http.Response(status, {"Content-Type": kind}, body.encode("utf-8"))


class TestArticleText(unittest.TestCase):
    """AIB-145y T10: a gist is written only from text the run read, so a page
    that is not an article must say so, never pass as one."""

    def read(self, response):
        with mock.patch.object(http, "fetch", fake_fetch({"https://example.com/a": response})):
            return article.article_text("https://example.com/a")

    def test_a_readable_page_gives_title_byline_and_paragraphs(self):
        got = self.read(html_page(fixture("article_readable.html")))
        self.assertTrue(got["readable"])
        self.assertIsNone(got["reason"])
        self.assertEqual(got["title"], "Fixture Labs ships a smaller model")
        self.assertEqual(got["byline"], "Ada Example")
        self.assertGreaterEqual(got["words"], article.MIN_WORDS)
        self.assertIn("What it costs", got["text"])
        self.assertIn("\u00a35 & up. Per month.", got["text"])

    def test_page_furniture_is_left_out(self):
        text = self.read(html_page(fixture("article_readable.html")))["text"]
        for noise in ("Home Latest", "newsletter", "Copyright", "not text", "enable JavaScript"):
            self.assertNotIn(noise, text)

    def test_the_text_is_capped_at_a_word(self):
        with mock.patch.object(http, "fetch", fake_fetch({"https://example.com/a":
                                                          html_page(fixture("article_readable.html"))})):
            got = article.article_text("https://example.com/a", max_chars=300)
        self.assertLessEqual(len(got["text"]), 300)
        self.assertTrue(got["text"].endswith("\u2026"))

    def test_a_bot_check_is_named(self):
        for status in (200, 403):
            with self.subTest(status=status):
                got = self.read(html_page(fixture("article_bot_check.html"), status=status))
                self.assertFalse(got["readable"])
                self.assertEqual(got["reason"], "bot_check")
                self.assertEqual(got["text"], "")

    def test_a_paywall_is_named(self):
        got = self.read(html_page(fixture("article_paywall.html")))
        self.assertEqual((got["readable"], got["reason"]), (False, "paywall"))

    def test_a_short_page_is_too_short(self):
        got = self.read(html_page("<html><body><p>Only a few words here.</p></body></html>"))
        self.assertEqual(got["reason"], "too_short")

    def test_a_noscript_line_does_not_sink_a_real_article(self):
        # The readable fixture says "enable JavaScript" in <noscript>.
        self.assertTrue(self.read(html_page(fixture("article_readable.html")))["readable"])

    def test_http_errors_network_and_non_html_are_reported_not_raised(self):
        cases = [(http.Response(403, error="HTTP 403"), "http_error"),
                 (http.Response(0, error="timed out"), "network"),
                 (html_page("%PDF-1.7", kind="application/pdf"), "not_html")]
        for response, reason in cases:
            with self.subTest(reason=reason):
                self.assertEqual(self.read(response)["reason"], reason)

    def test_every_reason_is_a_known_one(self):
        for name in ("article_readable.html", "article_bot_check.html", "article_paywall.html"):
            reason = self.read(html_page(fixture(name)))["reason"]
            self.assertTrue(reason is None or reason in article.UNREADABLE)

    @unittest.skipIf(SKIP_LIVE, "AIBYTES_SKIP_LIVE=1")
    def test_live_a_real_page_is_read(self):
        got = article.article_text("https://www.python.org/about/")
        self.assertIn(got["reason"], (None,) + article.UNREADABLE)
        self.assertIsInstance(got["text"], str)


class TestHnThread(unittest.TestCase):
    """AIB-145y T10: the ranking comes from HN, the text from Algolia."""

    def pages(self, story=True, tree=True):
        pages = {}
        if story:
            pages[hn_thread.FIREBASE_ITEM.format(id=9001)] = http.Response(200, {}, fixture("hn_story.json").encode())
        if tree:
            pages[hn_thread.ALGOLIA_ITEM.format(id=9001)] = http.Response(200, {}, fixture("hn_tree.json").encode())
        return pages

    def get(self, **kw):
        with mock.patch.object(http, "fetch", fake_fetch(self.pages(**kw))):
            return hn_thread.hn_thread(9001)

    def test_comments_follow_hns_rank_not_algolias_time_order(self):
        got = self.get()
        self.assertEqual([c["by"] for c in got["comments"]], ["ranked_top", "early", "long"])
        self.assertEqual([c["id"] for c in got["comments"]], ["c1", "c2", "c3"])
        self.assertTrue(got["ranked"])

    def test_deleted_comments_and_replies_are_skipped(self):
        first = self.get()["comments"][0]
        self.assertEqual(first["reply"], {"by": "second_replier", "text": "Live reply."})
        self.assertEqual(first["url"], "https://news.ycombinator.com/item?id=9004")

    def test_comment_html_becomes_plain_text(self):
        got = self.get()["comments"]
        self.assertEqual(got[0]["text"], "Top ranked comment.\nSecond paragraph with a link.")
        self.assertEqual(got[1]["reply"]["text"], 'A reply with "quotes".')

    def test_long_comments_are_trimmed(self):
        long = self.get()["comments"][2]["text"]
        self.assertLessEqual(len(long), hn_thread.COMMENT_CHARS)
        self.assertTrue(long.endswith("\u2026"))

    def test_story_facts_come_from_hn(self):
        got = self.get()
        self.assertEqual((got["points"], got["descendants"], got["by"]), (321, 5, "fixture_user"))
        self.assertEqual(got["posted_at"], "2025-11-11T12:00:00Z")
        self.assertEqual(got["discussion_url"], "https://news.ycombinator.com/item?id=9001")
        self.assertIsNone(got["error"])

    def test_top_caps_the_count(self):
        with mock.patch.object(http, "fetch", fake_fetch(self.pages())):
            self.assertEqual(len(hn_thread.hn_thread(9001, top=1)["comments"]), 1)

    def test_without_hn_the_order_falls_back_to_time(self):
        got = self.get(story=False)
        self.assertEqual([c["by"] for c in got["comments"]], ["early", "ranked_top", "long"])
        self.assertFalse(got["ranked"])
        self.assertIn("firebase", got["error"])
        self.assertEqual(got["points"], 300)

    def test_without_algolia_there_are_no_comments_and_no_exception(self):
        got = self.get(tree=False)
        self.assertEqual(got["comments"], [])
        self.assertIn("algolia", got["error"])

    @unittest.skipIf(SKIP_LIVE, "AIBYTES_SKIP_LIVE=1")
    def test_live_a_known_story(self):
        got = hn_thread.hn_thread(1)  # HN's first story, stable forever
        self.assertEqual(got["by"], "pg")
        self.assertIsNone(got["error"])


if __name__ == "__main__":
    unittest.main()
