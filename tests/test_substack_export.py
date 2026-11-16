"""Tests for the generate-newsletter-content Substack export script.

Offline. The fixture issue is the real template with its tokens filled, so a
template change that the converter no longer reads fails here. The X rows come
from x_render, as the skill pastes them, and the export must carry them in
x_render's substack format.
"""

import html
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
GIST_UTM = "utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=issue-19"
GIST_NEWS = "\n      ".join([
    f'<p class="news-item">🪤 <b><a href="https://aibytes.io/gists/hn-backdoor-in-an-editor-extension?{GIST_UTM}">'
    'Backdoor in an editor extension</a></b> a compromised build opened a tunnel. '
    '<span class="hot">Story of the week</span> '
    '<span class="src">(<a href="https://lead.example/a">HackerNews</a>)</span></p>',
    f'<p class="news-item">🌐 <b><a href="https://aibytes.io/gists/tc-genie-4?{GIST_UTM}">Genie 4</a></b> '
    'a world model. <span class="src">(<a href="https://news.example/b">TechCrunch</a>)</span></p>',
    '<p class="news-item">📌 <b><a href="https://news.example/failed">No gist yet</a></b> '
    'still shipping. <span class="src">(<a href="https://news.example/failed">TechCrunch</a>)</span></p>',
])
GIST_LAUNCHES = (
    f'<div class="row"><span class="ico">🎬</span><span class="txt">'
    f'<b><a href="https://aibytes.io/gists/ph-cut?{GIST_UTM}">Cut</a></b>'
    ' - edits video. <span class="src">(<a href="https://www.producthunt.com/products/cut">ProductHunt</a>)</span>'
    '</span><span class="stat"><b>▲ 776</b></span></div>'
)
GIST_REPOS = (
    f'<div class="row"><span class="ico">📎</span><span class="txt">'
    f'<b><a href="https://aibytes.io/gists/gh-o-r?{GIST_UTM}">o/r</a></b>'
    ' - a repo. <span class="src">(<a href="https://github.com/o/r">GitHub</a>)</span>'
    '</span><span class="stat"><b>+6.4k</b> ★</span></div>'
)
GIST_HN = (
    f'<div class="row"><span class="ico">📊</span><span class="txt">'
    f'<b><a href="https://aibytes.io/gists/hn-a-deep-story?{GIST_UTM}">A deep story</a></b>'
    ' with context. <span class="src">(<a href="https://news.ycombinator.com/item?id=1">HackerNews</a>)</span>'
    '</span><span class="stat"><b>699</b> pts</span></div>'
)
TOC = "\n".join(f'<div class="r"><span class="m">{m}</span><span class="n">{n}</span><span class="d">{d}</span></div>'
                for m, n, d in (("🌍", "AI News", "2 stories"), ("📣", "Official Announcements", "Lab · Otherlab"),
                                ("0x02", "Viral on X", "5 posts"), ("0x03", "New AI Products", "1 launch"),
                                ("0x04", "Trending Github Projects", "1 repo"), ("0x05", "HN Deep Stories", "1 thread")))


def gist_urls_for(snap, issue=19):
    urls = {}
    for p in snap["posts"]:
        if p["url"] in snap["shortlist"]["insight"] + snap["shortlist"]["announcement"]:
            slug = "x-" + p["author_handle"].lstrip("@").lower() + "-preview"
            urls[p["url"]] = x_render.gist_newsletter_url(slug, issue)
    return urls


def issue_html(snap, *, gist_urls=None, news=NEWS, launches=LAUNCHES, repos=REPOS, hn=HN):
    blocks, _ = x_render.render(snap, gist_urls=gist_urls)
    fill = {
        "EMAIL_SUBJECT": "🪤 A backdoored extension &amp; a world model", "EMAIL_DESCRIPTION": "Plus a repo and a deep story.",
        "ISSUE_NUM": "17", "ISSUE_HEX": "11", "DATE_ISO": "2026-11-09", "READ_MIN": "5",
        "INTRO_HOOK": "I did not expect this 🪤", "INTRO_STORYLINE_LEAD": "Trust is the story",
        "INTRO_STORYLINE": 'read <a href="https://gist.example/">the gist</a>.', "TOC_ROWS": TOC,
        "NEWS_ITEMS": news, "QUOTE_TEXT": "The extension you install is code you run.",
        "ANNOUNCEMENT_ITEMS": blocks["announcements"], "X_ROWS": blocks["viral"],
        "LAUNCH_ROWS": launches, "REPO_ROWS": repos, "HN_ROWS": hn,
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
        # HN: the title is plain text and the thread is the only link.
        self.assertIn('<li>📊 A deep story with context. '
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


class TestConvertGistLinks(unittest.TestCase):
    """F2: titles are gist URLs with UTM; trailing source links stay clean."""

    def setUp(self):
        self.snap = shortlisted_snapshot()
        self.gist_urls = gist_urls_for(self.snap)
        self.src = issue_html(
            self.snap, gist_urls=self.gist_urls,
            news=GIST_NEWS, launches=GIST_LAUNCHES, repos=GIST_REPOS, hn=GIST_HN,
        )
        self.body = sx.convert(self.src)["body"]

    def test_issue_html_titles_are_gists_with_utm_and_clean_sources(self):
        body = re.sub(r"<!--.*?-->", "", self.src, flags=re.S)
        hrefs = [html.unescape(h) for h in re.findall(r'href="([^"]+)"', body)]
        gists = [h for h in hrefs if "/gists/" in h]
        sources = [h for h in hrefs if h.startswith("http") and "/gists/" not in h]
        self.assertGreaterEqual(len(gists), 5)
        for gist in gists:
            self.assertIn("utm_source=newsletter", gist)
            self.assertIn("utm_medium=email", gist)
            self.assertIn("utm_campaign=issue-19", gist)
        for source in sources:
            self.assertNotIn("utm_", source)
            self.assertNotIn("ref=", source)
        for slug, source in (
            ("hn-backdoor-in-an-editor-extension", "https://lead.example/a"),
            ("tc-genie-4", "https://news.example/b"),
            ("ph-cut", "https://www.producthunt.com/products/cut"),
            ("gh-o-r", "https://github.com/o/r"),
            ("hn-a-deep-story", "https://news.ycombinator.com/item?id=1"),
        ):
            self.assertIn(x_render.gist_newsletter_url(slug, 19), gists)
            self.assertIn(source, sources)
        self.assertIn("https://news.example/failed", sources)
        self.assertTrue(any(h.endswith("/failed") for h in hrefs if "/gists/" not in h))

    def test_substack_news_and_products_keep_gist_and_source(self):
        gist = html.escape(x_render.gist_newsletter_url("hn-backdoor-in-an-editor-extension", 19), quote=True)
        self.assertIn(f'<h3>🪤 <a href="{gist}">Backdoor in an editor extension</a></h3>', self.body)
        self.assertIn('(<a href="https://lead.example/a">HackerNews</a>)', self.body)
        self.assertIn(
            f'<li>🎬 <a href="{html.escape(x_render.gist_newsletter_url("ph-cut", 19), quote=True)}">'
            '<b>Cut</b></a> - edits video. '
            '(<a href="https://www.producthunt.com/products/cut">Product Hunt</a>) ▲ 776</li>',
            self.body,
        )
        self.assertIn(
            f'<li>📎 <a href="{html.escape(x_render.gist_newsletter_url("gh-o-r", 19), quote=True)}">'
            '<b>o/r</b></a> - a repo. (<a href="https://github.com/o/r">GitHub</a>) +6.4k ★</li>',
            self.body,
        )

    def test_substack_hn_title_is_linked_to_the_gist_and_not_bold(self):
        gist = html.escape(x_render.gist_newsletter_url("hn-a-deep-story", 19), quote=True)
        self.assertIn(
            f'<li>📊 <a href="{gist}">A deep story</a> with context. '
            '(<a href="https://news.ycombinator.com/item?id=1">HN thread</a>) 699 pts</li>',
            self.body,
        )
        self.assertNotIn(f'<a href="{gist}"><b>A deep story</b></a>', self.body)

    def test_substack_viral_handle_goes_to_the_gist_and_trails_the_post(self):
        self.assertEqual(x_render.verify(self.snap, self.body, "substack", gist_urls=self.gist_urls), [])
        alice = html.escape(self.gist_urls["https://x.com/alice/status/3"], quote=True)
        self.assertIn(f'<a href="{alice}"><b>@alice</b></a>', self.body)
        self.assertIn('<a href="https://x.com/alice/status/3">Post on X</a>', self.body)
        self.assertNotIn('href="https://x.com/alice"', self.body)

    def test_substack_oa_gist_link_leads(self):
        lab = html.escape(self.gist_urls["https://x.com/lab/status/1"], quote=True)
        self.assertIn(f'<a href="{lab}">Gist ↗</a>', self.body)
        self.assertLess(self.body.find("Gist ↗"), self.body.find("Post on X ↗"))


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
