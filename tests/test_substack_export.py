"""Tests for the generate-newsletter-content Substack export script.

Offline. The fixture issue is the real template with its tokens filled, so a
template change that the converter no longer reads fails here. The X rows come
from x_render, as the skill pastes them, and the export must carry them in
x_render's substack format.
"""

import importlib.util
import pathlib
import re
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SKILL = REPO_ROOT / ".claude" / "skills" / "generate-newsletter-content"
SCRIPT = SKILL / "scripts" / "substack_export.py"
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))
sys.path.insert(0, str(REPO_ROOT / "tests"))

from aibytes_fetchers import x_render  # noqa: E402
from test_x_fetch_items import shortlisted_snapshot  # noqa: E402


def load_script():
    spec = importlib.util.spec_from_file_location("substack_export", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sx = load_script()

NEWS = "\n      ".join([
    '<p class="news-item">🪤 <b><a href="https://lead.example/a">Backdoor in an editor extension</a></b> '
    'a compromised build opened a tunnel. <span class="hot">Story of the week</span> <span class="src">(HackerNews)</span></p>',
    '<p class="news-item">🌐 <b><a href="https://news.example/b">Genie 4</a></b> a world model. <span class="src">(TechCrunch)</span></p>',
])
LAUNCHES = ('<div class="row"><span class="ico">🎬</span><span class="txt"><b><a href="https://cut.example/">Cut</a></b>'
            ' - edits video. <span class="src">(<a href="https://www.producthunt.com/products/cut">ProductHunt</a>)</span></span>'
            '<span class="stat"><b>▲ 776</b></span></div>')
REPOS = ('<div class="row"><span class="ico">📎</span><span class="txt"><b><a href="https://github.com/o/r">o/r</a></b>'
         ' - a repo.</span><span class="stat"><b>+6.4k</b> ★</span></div>')
HN = ('<div class="row"><span class="ico">📊</span><span class="txt"><b><a href="https://article.example/">A deep story</a></b>'
      ' with context. <span class="src">(<a href="https://news.ycombinator.com/item?id=1">HackerNews</a>)</span></span>'
      '<span class="stat"><b>699</b> pts</span></div>')
TOC = "\n".join(f'<div class="r"><span class="m">{m}</span><span class="n">{n}</span><span class="d">{d}</span></div>'
                for m, n, d in (("🌍", "AI News", "2 stories"), ("📣", "Official Announcements", "Lab · Otherlab"),
                                ("0x02", "Viral on X", "5 posts"), ("0x03", "New AI Products", "1 launch"),
                                ("0x04", "Trending Github Projects", "1 repo"), ("0x05", "HN Deep Stories", "1 thread")))


def issue_html(snap):
    blocks, _ = x_render.render(snap)
    fill = {
        "EMAIL_SUBJECT": "🪤 A backdoored extension &amp; a world model", "EMAIL_DESCRIPTION": "Plus a repo and a deep story.",
        "ISSUE_NUM": "17", "ISSUE_HEX": "11", "DATE_ISO": "2026-11-09", "READ_MIN": "5",
        "INTRO_HOOK": "I did not expect this 🪤", "INTRO_STORYLINE_LEAD": "Trust is the story",
        "INTRO_STORYLINE": 'read <a href="https://gist.example/">the gist</a>.', "TOC_ROWS": TOC,
        "NEWS_ITEMS": NEWS, "QUOTE_TEXT": "The extension you install is code you run.",
        "ANNOUNCEMENT_ITEMS": blocks["announcements"], "X_ROWS": blocks["viral"],
        "LAUNCH_ROWS": LAUNCHES, "REPO_ROWS": REPOS, "HN_ROWS": HN,
    }
    text = (SKILL / "assets" / "template.html").read_text(encoding="utf-8")
    for token, value in fill.items():
        text = text.replace("{{" + token + "}}", value)
    return text


class TestConvert(unittest.TestCase):
    def setUp(self):
        self.snap = shortlisted_snapshot()
        self.result = sx.convert(issue_html(self.snap))
        self.body = self.result["body"]

    def test_fields_outside_the_body(self):
        self.assertEqual(self.result["title"], "🪤 A backdoored extension & a world model")
        self.assertEqual(self.result["subtitle"], "Plus a repo and a deep story.")
        self.assertEqual(self.result["num"], 17)

    def test_x_sections_match_the_substack_render(self):
        self.assertEqual(x_render.verify(self.snap, self.body, "substack"), [])
        self.assertNotEqual(x_render.verify(self.snap, self.body, "html"), [])

    def test_only_the_editor_blocks_survive(self):
        self.assertNotIn("style=", self.body)
        self.assertEqual(re.findall(r'class="([^"]+)"', self.body), ["pullquote"])
        self.assertNotIn("<table", self.body)
        self.assertNotIn("{{", self.body)
        self.assertNotIn("<!--", self.body)

    def test_section_order_and_names(self):
        heads = re.findall(r"<h2>(.*?)</h2>", self.body)
        self.assertEqual(heads, ["🌍 AI News", "📣 Official announcements", "🔥 Viral on X",
                                 "🚀 New AI products", "⭐ Trending GitHub projects", "🧵 HN deep stories"])
        self.assertNotIn("0x0", self.body)

    def test_table_of_contents_follows_the_intro(self):
        self.assertTrue(self.body.startswith("<p>Hello, builders 👋</p>"))
        toc = re.search(r"<p><b>In this issue</b></p><ul>\n(.*?)\n</ul>", self.body, re.S).group(1)
        self.assertEqual(toc.splitlines()[:3], ["<li>AI News - 2 stories</li>",
                                                 "<li>Official announcements - Lab · Otherlab</li>",
                                                 "<li>Viral on X - 5 posts</li>"])
        self.assertLess(self.body.find("In this issue"), self.body.find("<h2>"))

    def test_story_of_the_week_leads_with_no_label_or_divider(self):
        self.assertIn('<h3>🪤 <a href="https://lead.example/a">Backdoor in an editor extension</a></h3>'
                      "<p>A compromised build opened a tunnel. (HackerNews)</p>", self.body)
        self.assertNotIn("Story of the week", self.body)
        self.assertEqual(self.body.count("<hr>"), 1)
        self.assertLess(self.body.find("<hr>"), self.body.find("Made for builders"))

    def test_pull_quote_closes_ai_news(self):
        self.assertIn('<div class="pullquote"><p>"The extension you install is code you run."</p></div>', self.body)

    def test_ranked_rows(self):
        self.assertIn('<li>🎬 <a href="https://cut.example/"><b>Cut</b></a> - edits video. '
                      '(<a href="https://www.producthunt.com/products/cut">Product Hunt</a>) ▲ 776</li>', self.body)
        self.assertIn('<li>📎 <a href="https://github.com/o/r"><b>o/r</b></a> - a repo. +6.4k ★</li>', self.body)
        # HN: the title is plain bold and the thread is the only link.
        self.assertIn('<li>📊 <b>A deep story</b> with context. '
                      '(<a href="https://news.ycombinator.com/item?id=1">HN thread</a>) 699 pts</li>', self.body)
        self.assertNotIn("article.example", self.body)
        self.assertEqual(self.body.count("<ol>"), 4)

    def test_viral_on_x_links_only_the_handle_to_the_post(self):
        self.assertIn('<li>🔬 <a href="https://x.com/alice/status/3"><b>@alice</b></a> I asked Lab 2', self.body)
        self.assertNotIn('href="https://x.com/alice"', self.body)

    def test_counts(self):
        self.assertEqual(self.result["counts"], {"AI News": 2, "Viral on X": 5, "New AI products": 1,
                                                 "Trending GitHub projects": 1, "HN deep stories": 1})

    def test_issue_without_announcements(self):
        snap = shortlisted_snapshot()
        snap["shortlist"]["announcement"] = []
        # The skill drops the whole card when the issue doesn't carry it.
        src = re.sub(r'\n\s*<div class="oa-card">.*?\n    </div>\n', "\n", issue_html(snap), flags=re.S)
        self.assertNotIn("oa-card", src[src.find("<body"):])
        body = sx.convert(src)["body"]
        self.assertNotIn("Official announcements</h2>", body)
        self.assertEqual(x_render.verify(snap, body, "substack", ("viral",)), [])

    def test_unfilled_template_is_refused(self):
        with self.assertRaises(ValueError):
            sx.convert((SKILL / "assets" / "template.html").read_text(encoding="utf-8"))


class TestPage(unittest.TestCase):
    def test_page_carries_the_body_raw_and_the_fields_escaped(self):
        snap = shortlisted_snapshot()
        result = sx.convert(issue_html(snap))
        text = sx.page(result)
        self.assertNotIn("{{", text)
        self.assertIn(f'<textarea class="code" spellcheck="false">{result["body"]}</textarea>', text)
        self.assertIn("🪤 A backdoored extension &amp; a world model", text)
        self.assertEqual(x_render.verify(snap, text, "substack"), [])

    def test_body_with_a_textarea_close_is_refused(self):
        with self.assertRaises(ValueError):
            sx.page({"title": "t", "subtitle": "s", "num": 1, "counts": {}, "body": "<p></textarea></p>"})


class TestScript(unittest.TestCase):
    def test_writes_the_page_beside_the_issue(self):
        with tempfile.TemporaryDirectory() as tmp:
            issue = pathlib.Path(tmp) / "aiBytes-issue-17.html"
            issue.write_text(issue_html(shortlisted_snapshot()), encoding="utf-8")
            run = subprocess.run([sys.executable, str(SCRIPT), "--issue", str(issue)],
                                 capture_output=True, text=True, check=True)
            out = pathlib.Path(tmp) / "aiBytes-substack-export-issue-17.html"
            self.assertTrue(out.exists(), run.stdout)
            self.assertIn("Viral on X: 5", run.stdout)

    def test_body_only_prints_and_writes_nothing(self):
        with tempfile.TemporaryDirectory() as tmp:
            issue = pathlib.Path(tmp) / "aiBytes-issue-17.html"
            issue.write_text(issue_html(shortlisted_snapshot()), encoding="utf-8")
            run = subprocess.run([sys.executable, str(SCRIPT), "--issue", str(issue), "--body-only"],
                                 capture_output=True, text=True, check=True)
            self.assertTrue(run.stdout.startswith("<p>Hello, builders 👋</p>"))
            self.assertEqual([p.name for p in pathlib.Path(tmp).iterdir()], ["aiBytes-issue-17.html"])


if __name__ == "__main__":
    unittest.main()
