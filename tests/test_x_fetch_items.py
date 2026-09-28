"""Offline tests for the x-fetch-items skill and aibytes_fetchers.x_paste.

No network: X data is pasted in from Grok, so every test builds its own paste.
The end-to-end tests run the skill script with --output-root in a temp dir, so
the committed newsletter/data tree is never touched.
"""

import copy
import datetime as dt
import html
import json
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

from aibytes_fetchers import x_paste, x_render

SCRIPT = REPO_ROOT / ".claude" / "skills" / "x-fetch-items" / "scripts" / "x_items.py"
AS_OF = dt.date(2026, 9, 26)


def post(bucket, handle, status, likes, **overrides):
    """One contract-valid post; tests override the field under test."""
    base = {
        "bucket": bucket,
        "rank": 1,
        "url": f"https://x.com/{handle}/status/{status}",
        "author_handle": f"@{handle}",
        "author_name": handle.title(),
        "author_type": "company" if bucket == "announcement" else "person",
        "posted_at": "2026-09-23",
        "kind": "post",
        "text": f"A post by {handle}.",
        "quoted_post": None,
        "media": "none",
        "link_url": None,
        "likes": likes,
        "reposts": likes // 10,
        "replies": likes // 20,
        "views": likes * 100,
        "category": "launch" if bucket == "announcement" else "dev-tool",
        "why_viral": "It spread.",
        "why_it_matters": "Builders care.",
        "also_covered": [],
    }
    base.update(overrides)
    return base


def paste():
    return {
        "announcements": [
            post("announcement", "lab", 1, 9000, rank=1),
            post("announcement", "otherlab", 2, 4000, rank=2),
        ],
        "insights": [
            post("insight", "alice", 3, 3000, rank=1),
            post("insight", "bob", 4, 2000, rank=2),
            post("insight", "carol", 5, 1500, rank=3),
            post("insight", "dave", 6, 1200, rank=4),
            post("insight", "erin", 7, 900, rank=5),
            post("insight", "labdevs", 8, 800, rank=6, author_type="company"),
        ],
    }


class TestWindowAndPrompt(unittest.TestCase):
    def test_window_is_the_seven_days_ending_on_the_snapshot_date(self):
        self.assertEqual(x_paste.window_for(AS_OF), {"after": "2026-09-20", "before": "2026-09-27"})

    def test_snapshot_goes_in_the_weekly_folder(self):
        path = x_paste.snapshot_path(AS_OF, "/tmp/root")
        self.assertEqual(path, pathlib.Path("/tmp/root/2026/09/weeks/week-39/x/x_data.json"))

    def test_prompt_fills_the_window(self):
        text = x_paste.prompt(AS_OF)
        self.assertIn("from 2026-09-20 up to (not including) 2026-09-27", text)
        self.assertNotIn("{{", text)

    def test_prompt_asks_for_every_contract_field(self):
        # Guards the prompt and the contract against drifting apart.
        text = x_paste.PROMPT_FILE.read_text()
        for field in x_paste.REQUIRED:
            self.assertIn(f'"{field}"', text, field)


class TestParsePaste(unittest.TestCase):
    def test_reads_a_fenced_block_followed_by_markdown_tables(self):
        raw = "```json\n" + json.dumps(paste()) + "\n```\n\n| rank | author |\n|---|---|\n| 1 | @lab |\n"
        self.assertEqual(len(x_paste.parse_paste(raw)["insights"]), 6)

    def test_reads_bare_json(self):
        self.assertEqual(len(x_paste.parse_paste(json.dumps(paste()))["announcements"]), 2)

    def test_rejects_the_old_single_array_shape(self):
        with self.assertRaises(ValueError):
            x_paste.parse_paste(json.dumps([post("insight", "alice", 3, 3000)]))


class TestCheck(unittest.TestCase):
    def check(self, data):
        return x_paste.check(data, AS_OF)

    def test_a_valid_paste_has_no_errors_or_warnings(self):
        self.assertEqual(self.check(paste()), ([], []))

    def test_missing_field_is_an_error(self):
        data = paste()
        del data["insights"][0]["link_url"]
        errors, _ = self.check(data)
        self.assertTrue(any("missing link_url" in e for e in errors), errors)

    def test_value_outside_an_enum_is_an_error(self):
        data = paste()
        data["insights"][0]["category"] = "humor"
        errors, _ = self.check(data)
        self.assertTrue(any("category='humor'" in e for e in errors), errors)

    def test_url_must_match_the_author(self):
        data = paste()
        data["insights"][0]["url"] = "https://x.com/someoneelse/status/3"
        errors, _ = self.check(data)
        self.assertTrue(any("doesn't match" in e for e in errors), errors)

    def test_quote_needs_quoted_post(self):
        data = paste()
        data["insights"][0]["kind"] = "quote"
        errors, _ = self.check(data)
        self.assertTrue(any("quoted_post is null" in e for e in errors), errors)

    def test_post_in_the_wrong_list_is_an_error(self):
        data = paste()
        data["insights"][0]["bucket"] = "announcement"
        errors, _ = self.check(data)
        self.assertTrue(any("in the insights list" in e for e in errors), errors)

    def test_content_problems_are_warnings(self):
        data = paste()
        data["insights"][0].update(posted_at="2026-09-19", text="see https://t.co/abc")
        data["insights"][1].update(likes=100, text="full prompt:")
        _, warnings = self.check(data)
        joined = "\n".join(warnings)
        for expected in ("outside 2026-09-20", "under 500", "t.co", "no link_url", "not in likes order"):
            self.assertIn(expected, joined)

    def test_post_listed_twice_is_a_warning(self):
        data = paste()
        data["insights"][0]["also_covered"] = [data["insights"][1]["url"]]
        _, warnings = self.check(data)
        self.assertTrue(any("also_covered" in w for w in warnings), warnings)


class TestBuildMoveShortlist(unittest.TestCase):
    def test_build_flattens_both_lists_behind_the_envelope(self):
        snap = x_paste.build(paste(), AS_OF)
        self.assertEqual(list(snap), ["source", "section", "fetched_at", "fetched_via", "window", "ranking", "posts"])
        self.assertEqual([p["bucket"] for p in snap["posts"][:2]], ["announcement", "announcement"])
        self.assertEqual(len(snap["posts"]), 8)

    def test_build_reranks_by_likes_within_each_bucket(self):
        data = paste()
        data["insights"].reverse()
        snap = x_paste.build(data, AS_OF)
        insights = [p for p in snap["posts"] if p["bucket"] == "insight"]
        self.assertEqual([p["author_handle"] for p in insights[:2]], ["@alice", "@bob"])
        self.assertEqual([p["rank"] for p in insights], list(range(1, 7)))

    def test_build_never_touches_post_text(self):
        data = paste()
        data["insights"][0]["text"] = "  odd   spacing\n\nkept 🤖  "
        snap = x_paste.build(copy.deepcopy(data), AS_OF)
        self.assertIn("  odd   spacing\n\nkept 🤖  ", [p["text"] for p in snap["posts"]])

    def test_move_refiles_and_reranks(self):
        snap = x_paste.build(paste(), AS_OF)
        x_paste.move(snap, ["https://x.com/alice/status/3"], "announcement")
        announcements = [p["author_handle"] for p in snap["posts"] if p["bucket"] == "announcement"]
        self.assertEqual(announcements, ["@lab", "@otherlab", "@alice"])

    def test_move_rejects_unknown_urls(self):
        with self.assertRaises(ValueError):
            x_paste.move(x_paste.build(paste(), AS_OF), ["https://x.com/nobody/status/9"], "insight")

    def test_shortlist_sits_before_posts(self):
        snap = x_paste.build(paste(), AS_OF)
        insight = [f"https://x.com/{h}/status/{s}" for h, s in (("alice", 3), ("bob", 4), ("carol", 5), ("dave", 6), ("erin", 7))]
        announcement = ["https://x.com/lab/status/1", "https://x.com/otherlab/status/2"]
        warnings = x_paste.set_shortlist(snap, insight, announcement)
        self.assertEqual(list(snap)[-2:], ["shortlist", "posts"])
        self.assertEqual(snap["shortlist"]["insight"], insight)
        self.assertEqual(warnings, ["announcement: 2 picks, expected 3-5"])

    def test_shortlist_rule_breaks_are_warnings(self):
        snap = x_paste.build(paste(), AS_OF)
        x_paste.move(snap, ["https://x.com/alice/status/3"], "announcement")
        warnings = x_paste.set_shortlist(
            snap,
            ["https://x.com/alice/status/3", "https://x.com/labdevs/status/8"],
            ["https://x.com/lab/status/1"] * 2 + ["https://x.com/otherlab/status/2"],
        )
        joined = "\n".join(warnings)
        self.assertIn("insight: 2 picks, expected 5", joined)
        self.assertIn("filed as 'announcement'", joined)
        self.assertIn("same account", joined)

    def test_shortlist_rejects_unknown_urls(self):
        with self.assertRaises(ValueError):
            x_paste.set_shortlist(x_paste.build(paste(), AS_OF), ["https://x.com/nobody/status/9"], [])


def shortlisted_snapshot():
    """A built snapshot with a full shortlist and real-looking post text."""
    data = paste()
    data["announcements"][0].update(
        text="Introducing Lab 2, our new model.\n\nIt costs 40% less — and it's faster.\n\n- one\n- two",
        link_url="https://www.lab.example/lab-2")
    data["insights"][0]["text"] = ("I asked Lab 2 to build an interactive lens lab\n\nHere's what it came up with "
                                   "after 1 hour 26 minutes in one shot, $25.66 API cost and it keeps going for a while")
    snap = x_paste.build(data, AS_OF)
    x_paste.set_shortlist(
        snap,
        [f"https://x.com/{h}/status/{s}" for h, s in (("alice", 3), ("bob", 4), ("carol", 5), ("dave", 6), ("erin", 7))],
        ["https://x.com/lab/status/1", "https://x.com/otherlab/status/2"],
    )
    x_paste.set_emoji(snap, list(zip(snap["shortlist"]["insight"], ["🔬", "🎞️", "💸", "🏷️", "🛠️"])))
    return snap


def untag(fragment):
    """Text a reader sees in a rendered post: paragraphs and <br>s back to newlines."""
    fragment = re.sub(r"</p>\s*<p[^>]*>", "\n\n", fragment)
    fragment = re.sub(r"<br>", "\n", fragment)
    return html.unescape(re.sub(r"<[^>]+>", "", fragment))


class TestExcerpt(unittest.TestCase):
    def test_short_post_is_whole_and_not_cut(self):
        self.assertEqual(x_render.excerpt("Short post."), (["Short post."], False))

    def test_long_post_cuts_on_a_word_break_within_the_limit(self):
        text = "word " * 60
        lines, cut = x_render.excerpt(text)
        self.assertTrue(cut)
        self.assertLessEqual(len(lines[0]), x_render.EXCERPT_LIMIT)
        self.assertTrue(lines[0].endswith("word"))

    def test_line_breaks_are_kept_as_separate_lines(self):
        lines, cut = x_render.excerpt("First line\n\nSecond line")
        self.assertEqual((lines, cut), (["First line", "Second line"], False))

    def test_cut_drops_trailing_punctuation_before_the_ellipsis(self):
        lines, cut = x_render.excerpt("a" * 130 + " bb, " + "c" * 40)
        self.assertTrue(cut)
        self.assertEqual(lines[-1], "a" * 130 + " bb")

    def test_a_single_overlong_word_is_hard_cut(self):
        lines, cut = x_render.excerpt("x" * 200)
        self.assertEqual((len(lines[0]), cut), (x_render.EXCERPT_LIMIT, True))


class TestRenderHelpers(unittest.TestCase):
    def test_likes_format(self):
        self.assertEqual([x_render.likes(n) for n in (870, 3926, 13309, 95704, 123456, 1_250_000)],
                         ["870", "3.9k", "13.3k", "95.7k", "123k", "1.2M"])

    def test_day_is_weekday_and_date(self):
        self.assertEqual(x_render.day("2026-09-22"), "TUE 22")
        self.assertEqual(x_render.day("2026-10-05"), "MON 5")

    def test_company_accounts_and_staff_file_under_the_company(self):
        for handle, name in (("@ClaudeDevs", "Anthropic"), ("@SpaceXAI", "xAI"), ("@OfficialLoganK", "Google")):
            self.assertEqual(x_render.company({"author_handle": handle, "author_name": "x"}), (name, True))
        self.assertEqual(x_render.company({"author_handle": "@newlab", "author_name": "New Lab"}), ("New Lab", False))

    def test_long_announcement_keeps_whole_paragraphs(self):
        paras = x_render.paragraphs("\n\n".join(["p" * 150] * 6))
        kept, cut = x_render.trim_long(paras)
        self.assertTrue(cut)
        self.assertEqual(len(kept), 2)
        self.assertEqual(x_render.trim_long(x_render.paragraphs("short\n\npost")), ([["short"], ["post"]], False))


class TestRender(unittest.TestCase):
    def setUp(self):
        self.snap = shortlisted_snapshot()
        self.by_url = {p["url"]: p for p in self.snap["posts"]}

    def test_announcement_shows_the_whole_post_verbatim(self):
        post = self.by_url["https://x.com/lab/status/1"]
        rendered = x_render.announcement_html(post)
        inner = re.search(r'<div class="oa-post">(.*?)</div>', rendered).group(1)
        self.assertEqual(untag(inner), post["text"])
        self.assertIn("lab.example ↗", rendered)
        self.assertNotIn("♥", rendered)

    def test_beehiiv_announcement_is_verbatim_too(self):
        post = self.by_url["https://x.com/lab/status/1"]
        inner = re.search(r'border-radius:10px;[^>]*>(.*?)</div>', x_render.announcement_beehiiv(post)).group(1)
        self.assertEqual(untag(inner), post["text"])

    def test_x_row_is_the_start_of_the_post_with_an_ellipsis(self):
        post = self.by_url["https://x.com/alice/status/3"]
        row = x_render.x_row_html(post)
        words = untag(re.search(r'<a class="post"[^>]*>(.*?)</a>', row).group(1))
        flat = re.sub(r"\s+", " ", post["text"])
        self.assertTrue(flat.startswith(words.replace(" / ", " ")), words)
        self.assertIn('<span class="cut">/</span>', row)
        self.assertIn("…", row)
        self.assertIn(x_render.HEART + " 3.0k", row)

    def test_x_row_opens_with_emoji_and_linked_handle(self):
        post = self.by_url["https://x.com/alice/status/3"]
        row = x_render.x_row_html(post)
        self.assertTrue(row.startswith('<div class="row"><span class="ico">🔬</span>'), row)
        self.assertIn('<b><a href="https://x.com/alice">@alice</a></b>', row)
        self.assertNotIn(post["author_name"], row)
        row = x_render.x_row_beehiiv(post)
        self.assertIn('text-align:center;">🔬</span>', row)
        self.assertIn(f'<a href="https://x.com/alice" style="color:{x_render.COBALT};text-decoration:none;font-weight:600;">@alice</a>', row)

    def test_missing_emoji_warns(self):
        del self.by_url["https://x.com/bob/status/4"]["emoji"]
        _, warnings = x_render.render(self.snap)
        self.assertEqual(warnings, ["https://x.com/bob/status/4: no emoji; set one with x_items.py emoji"])

    def test_emoji_only_for_shortlisted_insights(self):
        with self.assertRaises(ValueError):
            x_paste.set_emoji(self.snap, [("https://x.com/lab/status/1", "🚀")])

    def test_short_x_row_has_no_ellipsis(self):
        self.assertNotIn("…", x_render.x_row_html(self.by_url["https://x.com/bob/status/4"]))

    def test_beehiiv_has_no_classes_or_style_blocks(self):
        blocks, _ = x_render.render(self.snap, "beehiiv")
        for block in blocks.values():
            self.assertNotIn("class=", block)
            self.assertNotIn("<style", block)
        self.assertIn("0x02", blocks["viral"])
        self.assertIn("VIRAL ON X", blocks["viral"])
        # The last row of each table drops its hairline.
        self.assertEqual(blocks["viral"].count("border-bottom"), 2 * 4)

    def test_render_keeps_shortlist_order(self):
        blocks, warnings = x_render.render(self.snap)
        order = [blocks["viral"].find(f"/{h}/status/") for h in ("alice", "bob", "carol", "dave", "erin")]
        self.assertEqual(order, sorted(order))
        self.assertEqual(warnings, [])

    def test_unknown_staff_account_warns(self):
        self.by_url["https://x.com/lab/status/1"]["author_type"] = "person"
        _, warnings = x_render.render(self.snap)
        self.assertTrue(any("COMPANIES" in w for w in warnings), warnings)


class TestVerify(unittest.TestCase):
    def setUp(self):
        self.snap = shortlisted_snapshot()
        blocks, _ = x_render.render(self.snap)
        self.page = f"<main>{blocks['announcements']}<section>{blocks['viral']}</section></main>"

    def test_a_page_built_from_render_passes(self):
        self.assertEqual(x_render.verify(self.snap, self.page), [])

    def test_a_retyped_post_fails(self):
        page = self.page.replace("40% less", "40 percent less")
        self.assertEqual(x_render.verify(self.snap, page),
                         ["Official Announcements: https://x.com/lab/status/1 is missing or was changed"])

    def test_reordered_rows_fail(self):
        rows = [x_render.x_row_html(p) for p in x_render.shortlisted(self.snap, "insight")]
        page = self.page.replace(rows[0], "").replace(rows[2], rows[2] + rows[0])
        self.assertTrue(any("out of shortlist order" in p for p in x_render.verify(self.snap, page)))

    def test_beehiiv_export_is_checked_against_the_beehiiv_format(self):
        blocks, _ = x_render.render(self.snap, "beehiiv")
        export = f"<textarea>{blocks['announcements']}\n\n{blocks['viral']}</textarea>"
        self.assertEqual(x_render.verify(self.snap, export, "beehiiv"), [])
        self.assertNotEqual(x_render.verify(self.snap, export, "html"), [])

    def test_an_issue_without_announcements_checks_viral_only(self):
        blocks, _ = x_render.render(self.snap)
        page = f"<section>{blocks['viral']}</section>"
        self.assertTrue(x_render.verify(self.snap, page))
        self.assertEqual(x_render.verify(self.snap, page, sections=("viral",)), [])

    def test_two_launches_from_one_company_warn_at_shortlist(self):
        snap = x_paste.build(paste(), AS_OF)
        snap["posts"][1]["author_handle"] = "@ClaudeDevs"
        snap["posts"][0]["author_handle"] = "@claudeai"
        snap["posts"][1]["url"] = "https://x.com/ClaudeDevs/status/2"
        snap["posts"][0]["url"] = "https://x.com/claudeai/status/1"
        warnings = x_paste.set_shortlist(snap, [], ["https://x.com/claudeai/status/1", "https://x.com/ClaudeDevs/status/2"])
        self.assertIn("announcement: more than one launch from the same company", warnings)


class TestScript(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory(prefix="x-fetch-items-test-")
        self.addCleanup(tmp.cleanup)
        self.root = pathlib.Path(tmp.name)
        self.snapshot = self.root / "2026/09/weeks/week-39/x/x_data.json"

    def run_script(self, *args, stdin=None):
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args, "--date", AS_OF.isoformat(), "--output-root", str(self.root)],
            input=stdin, capture_output=True, text=True, cwd=REPO_ROOT, timeout=60,
        )

    def test_save_then_shortlist(self):
        raw = "```json\n" + json.dumps(paste()) + "\n```\n"
        proc = self.run_script("save", "--input", "-", stdin=raw)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertTrue(self.snapshot.is_file())

        proc = self.run_script(
            "shortlist",
            "--insight", *[f"https://x.com/{h}/status/{s}" for h, s in (("alice", 3), ("bob", 4), ("carol", 5), ("dave", 6), ("erin", 7))],
            "--announcement", "https://x.com/lab/status/1", "https://x.com/otherlab/status/2",
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        data = json.loads(self.snapshot.read_text())
        self.assertEqual(data["source"], "x")
        self.assertEqual(data["fetched_at"], "2026-09-26")
        self.assertEqual(len(data["shortlist"]["insight"]), 5)

    def test_save_refuses_a_paste_with_errors(self):
        data = paste()
        del data["insights"][0]["text"]
        proc = self.run_script("save", "--input", "-", stdin=json.dumps(data))
        self.assertEqual(proc.returncode, 1)
        self.assertIn("missing text", proc.stderr)
        self.assertFalse(self.snapshot.exists())

    def test_shortlist_needs_a_saved_snapshot(self):
        proc = self.run_script("shortlist", "--insight", "https://x.com/a/status/1", "--announcement", "https://x.com/b/status/2")
        self.assertEqual(proc.returncode, 1)
        self.assertIn("run save first", proc.stderr)

    def test_render_then_verify(self):
        self.run_script("save", "--input", "-", stdin=json.dumps(paste()))
        insight = [f"https://x.com/{h}/status/{s}" for h, s in (("alice", 3), ("bob", 4), ("carol", 5), ("dave", 6), ("erin", 7))]
        self.run_script("shortlist", "--insight", *insight, "--announcement", "https://x.com/lab/status/1", "https://x.com/otherlab/status/2")
        proc = self.run_script("emoji", "https://x.com/alice/status/3", "🔬", "https://x.com/bob/status/4")
        self.assertEqual(proc.returncode, 1)
        self.assertIn("give each url its emoji", proc.stderr)
        proc = self.run_script("emoji", "https://x.com/alice/status/3", "🔬")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(self.snapshot.read_text())["posts"][2]["emoji"], "🔬")
        proc = self.run_script("render", "--section", "both")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("<!-- x_render: announcements -->", proc.stdout)
        issue = self.root / "issue.html"
        issue.write_text("<html>" + proc.stdout + "</html>")
        proc = self.run_script("verify", "--issue", str(issue))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        issue.write_text(issue.read_text().replace("A post by alice.", "A post by Alice."))
        proc = self.run_script("verify", "--issue", str(issue))
        self.assertEqual(proc.returncode, 1)
        self.assertIn("alice/status/3 is missing or was changed", proc.stderr)

    def test_render_needs_a_shortlist(self):
        self.run_script("save", "--input", "-", stdin=json.dumps(paste()))
        proc = self.run_script("render")
        self.assertEqual(proc.returncode, 1)
        self.assertIn("no shortlist", proc.stderr)


if __name__ == "__main__":
    unittest.main()
