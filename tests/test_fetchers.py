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
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import cli, envelope, layout, registry, runner, window as window_mod
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


if __name__ == "__main__":
    unittest.main()
