"""Offline tests for packages/feed-schema/build_weekly_issues.py (AIB-105j).

The builder scrapes a newsletter issue's HTML into the edition-shaped feed that
/weekly/issue-N renders. The fixture carries the traps the real issues hold:
the template's commented-out example rows, stat spans next to each summary, a
`+6.4k` star count, an HN story with no context line, and an HN story that
links to a tweet.
"""

import json
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))

import build_weekly_issues as builder
import validate as contract

ISSUE_HTML = """<html><head><title>aiBytes_ #16</title></head><body>
<div class="news-card">
  <div class="card-title">🌍 NEWS</div>
  <!-- Repeat per news item. Pattern:
  <p class="news-item">🔥 <b><a href="URL">Headline</a></b> one-line context <span class="src">(Source)</span></p>
  -->
  <p class="news-item">🔥 <b><a href="https://deepmind.google/genie-4">Genie 4</a></b> A world model you can steer. <span class="hot">Story of the week</span> <span class="src">(HackerNews)</span></p>
  <p class="news-item">💸 <b><a href="https://techcrunch.com/2026/11/02/s-1">Anthropic files its S-1</a></b> The filing is public. <span class="src">(TechCrunch)</span></p>
</div>
<div class="sec-head"><span class="sec-title">Viral on X</span></div>
<div class="row"><span class="txt"><b><a href="https://x.com/someone/status/1">@someone</a></b> a post</span></div>
<div class="sec-head"><span class="sec-title">New AI Products</span></div>
<!-- <div class="row"><span class="txt"><b><a href="URL">Name</a></b> — one-line description.</span><span class="stat"><b>▲ 776</b></span></div> -->
<div class="row"><span class="ico">🎬</span><span class="txt"><b><a href="https://chatcut.ai">ChatCut</a></b> - AI video editor. <span class="src">(<a href="https://www.producthunt.com/products/chatcut">ProductHunt</a>)</span></span><span class="stat"><b>▲ 776</b></span></div>
<div class="sec-head"><span class="sec-title">Trending Github Projects</span></div>
<div class="row"><span class="ico">📎</span><span class="txt"><b><a href="https://github.com/acme/graph">acme/graph</a></b> — Codebase to knowledge graph.</span><span class="stat"><b>+6.4k</b> ★</span></div>
<div class="row"><span class="ico">📎</span><span class="txt"><b><a href="https://github.com/acme/tool">acme/tool</a></b> — A small tool.</span><span class="stat"><b>+812</b> ★</span></div>
<div class="sec-head"><span class="sec-title">HN Deep Stories</span></div>
<div class="row"><span class="ico">🩺</span><span class="txt"><b><a href="https://lynchlab.net/cnn">A CNN beats LLMs</a></b> <span class="src">(<a href="https://news.ycombinator.com/item?id=50233779">HackerNews</a>)</span></span><span class="stat"><b>670</b> pts · 1,204 💬</span></div>
<div class="row"><span class="ico">🐦</span><span class="txt"><b><a href="https://twitter.com/karpathy/status/2">The capability gap</a></b> on shared understanding. <span class="src">(<a href="https://news.ycombinator.com/item?id=50233780">HackerNews</a>)</span></span><span class="stat"><b>301</b> pts</span></div>
</body></html>
"""

ENTRY = {
    "number": 16,
    "slug": "issue-16",
    "title": "A backdoored Claude Code extension",
    "description": "Plus Genie 4.",
    "published_on": "2026-11-02",
    "source": "newsletter/issues/2026/week-45-Issue-16/aiBytes-issue-16.html",
    "path": "weekly/issues/issue-16.json",
}


class TestExtract(unittest.TestCase):
    def setUp(self):
        self.items = builder.extract_items(ISSUE_HTML, 16)
        self.by_title = {item["title"]: item for item in self.items}

    def test_commented_template_rows_are_not_items(self):
        self.assertNotIn("Headline", self.by_title)
        self.assertNotIn("Name", self.by_title)
        self.assertTrue(all(item["url"] != "URL" for item in self.items))

    def test_viral_on_x_is_skipped_but_a_tweet_under_hn_is_kept(self):
        self.assertNotIn("@someone", self.by_title)
        self.assertEqual(self.by_title["The capability gap"]["category"], "hn")

    def test_every_section_lands_in_reading_order(self):
        self.assertEqual([item["category"] for item in self.items],
                         ["news", "news", "launches", "repos", "repos", "hn", "hn"])
        self.assertEqual([item["rank"] for item in self.items], list(range(1, 8)))

    def test_summaries_drop_badges_source_labels_and_stats(self):
        self.assertEqual(self.by_title["Genie 4"]["summary"], "A world model you can steer.")
        self.assertEqual(self.by_title["ChatCut"]["summary"], "AI video editor.")
        self.assertEqual(self.by_title["acme/graph"]["summary"], "Codebase to knowledge graph.")
        self.assertEqual(self.by_title["The capability gap"]["summary"], "on shared understanding.")

    def test_a_bare_hn_title_gets_a_summary_naming_the_site(self):
        self.assertEqual(self.by_title["A CNN beats LLMs"]["summary"],
                         "A post on lynchlab.net, discussed on Hacker News.")

    def test_signals_parse_from_the_stat(self):
        self.assertEqual(self.by_title["ChatCut"]["signals"], {"upvotes": 776})
        self.assertEqual(self.by_title["acme/graph"]["signals"], {"stars_gained": 6400})
        self.assertEqual(self.by_title["acme/tool"]["signals"], {"stars_gained": 812})
        self.assertEqual(self.by_title["A CNN beats LLMs"]["signals"], {"points": 670, "comments": 1204})
        self.assertNotIn("signals", self.by_title["Genie 4"])

    def test_sources_and_source_links(self):
        self.assertEqual(self.by_title["Anthropic files its S-1"]["source"], "techcrunch")
        chatcut = self.by_title["ChatCut"]
        self.assertEqual(chatcut["source_url"], "https://www.producthunt.com/products/chatcut")
        cnn = self.by_title["A CNN beats LLMs"]
        self.assertEqual((cnn["url"], cnn["source_url"]),
                         ("https://lynchlab.net/cnn", "https://news.ycombinator.com/item?id=50233779"))
        self.assertEqual(self.by_title["acme/graph"]["image"],
                         {"type": "avatar", "url": "https://github.com/acme.png?size=80"})

    def test_ids_carry_the_source_prefix_and_the_issue(self):
        self.assertEqual(self.by_title["ChatCut"]["id"], "ph-chatcut-issue-16")
        self.assertEqual(self.by_title["acme/graph"]["id"], "gh-acme-graph-issue-16")

    def test_a_repeated_title_gets_a_distinct_id(self):
        html = ISSUE_HTML.replace("acme/tool</a>", "acme/graph</a>")
        ids = [item["id"] for item in builder.extract_items(html, 16)]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("gh-acme-graph-2-issue-16", ids)

    def test_the_built_issue_passes_the_contract(self):
        issue = builder.build_issue(ISSUE_HTML, ENTRY, now="2026-11-06T10:00:00Z")
        self.assertTrue(contract.validate_weekly_issue(issue))
        self.assertEqual(issue["counts"], {"launches": 1, "repos": 2, "news": 2, "hn": 2})


class TestBuild(unittest.TestCase):
    """The command, end to end, against a temp repo root."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name)
        source = self.root / ENTRY["source"]
        source.parent.mkdir(parents=True)
        source.write_text(ISSUE_HTML)
        weekly = self.root / "content" / "weekly"
        weekly.mkdir(parents=True)
        entry = {key: value for key, value in ENTRY.items() if key != "path"}
        (weekly / "index.json").write_text(json.dumps({"schema_version": 1, "issues": [entry]}))
        self.issue_path = weekly / "issues" / "issue-16.json"

    def run_builder(self):
        with open(self.root / "stdout.txt", "w") as out:
            stdout, sys.stdout = sys.stdout, out
            try:
                return builder.main(["--root", str(self.root)])
            finally:
                sys.stdout = stdout

    def test_writes_the_issue_and_links_it_from_the_index(self):
        self.assertEqual(self.run_builder(), 0)
        issue = json.loads(self.issue_path.read_text())
        self.assertEqual(len(issue["items"]), 7)
        index = json.loads((self.root / "content" / "weekly" / "index.json").read_text())
        self.assertEqual(index["issues"][0]["path"], "weekly/issues/issue-16.json")

    def test_an_unchanged_issue_keeps_its_generated_at(self):
        self.run_builder()
        issue = json.loads(self.issue_path.read_text())
        issue["generated_at"] = "2026-01-01T00:00:00Z"
        self.issue_path.write_text(json.dumps(issue, indent=2, ensure_ascii=False) + "\n")
        before = self.issue_path.read_text()
        self.run_builder()
        self.assertEqual(self.issue_path.read_text(), before)

    def test_a_changed_issue_gets_a_new_generated_at(self):
        self.run_builder()
        issue = json.loads(self.issue_path.read_text())
        issue["generated_at"] = "2026-01-01T00:00:00Z"
        issue["items"][0]["title"] = "Stale"
        self.issue_path.write_text(json.dumps(issue))
        self.run_builder()
        self.assertNotEqual(json.loads(self.issue_path.read_text())["generated_at"], "2026-01-01T00:00:00Z")

    def test_a_missing_source_fails_loudly(self):
        (self.root / ENTRY["source"]).unlink()
        with open(self.root / "stderr.txt", "w") as err:
            stderr, sys.stderr = sys.stderr, err
            try:
                self.assertEqual(self.run_builder(), 1)
            finally:
                sys.stderr = stderr
        self.assertIn("issue-16: missing source", (self.root / "stderr.txt").read_text())


if __name__ == "__main__":
    unittest.main()
