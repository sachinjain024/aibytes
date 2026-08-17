"""Tests for the generate-followup-thumbnail skill script.

The parsing and templating tests are offline and always run. The render test
drives real headless Chrome, so it skips when Chrome is not installed.
"""

import importlib.util
import pathlib
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = (
    REPO_ROOT
    / ".claude"
    / "skills"
    / "generate-followup-thumbnail"
    / "scripts"
    / "generate_thumbnail.py"
)


def load_script():
    spec = importlib.util.spec_from_file_location("generate_thumbnail", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


thumb = load_script()


ISSUE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<title>aiBytes_ 04: DeepMind's shake-up and the week Oracle said no</title>
</head>
<body>
  <header>
    <div class="issue-tag"><span>ISSUE 0x04 &middot; TL;DR</span><span>2026-08-10 &middot; ~5 MIN</span></div>
    <div class="logo">&#9889; aiBytes<em>_</em> #4</div>
  </header>
  <div class="news-card"><div class="card-title">&#127757; NEWS FOR DEVS</div></div>
  <div class="sec-head"><span class="sec-hex">0x02</span><h2 class="sec-title">Launches</h2></div>
  <div class="sec-head"><span class="sec-hex">0x03</span><h2 class="sec-title">Trending on GitHub</h2></div>
  <div class="sec-head"><span class="sec-hex">0x04</span><h2 class="sec-title">HN Deep Cuts</h2></div>
</body>
</html>
"""


class TestParseIssue(unittest.TestCase):
    def setUp(self):
        self.issue = thumb.parse_issue(ISSUE_HTML)

    def test_reads_issue_identity(self):
        self.assertEqual(self.issue["num"], "4")
        self.assertEqual(self.issue["hex"], "04")
        self.assertEqual(self.issue["date"], "2026-08-10")
        self.assertEqual(self.issue["read_min"], "5")

    def test_headline_drops_the_brand_prefix(self):
        # The wordmark is already on the image; repeating it wastes the big type.
        self.assertEqual(
            self.issue["headline"],
            "DeepMind's shake-up and the week Oracle said no",
        )

    def test_sections_lead_with_news(self):
        self.assertEqual(
            self.issue["sections"],
            ["NEWS FOR DEVS", "LAUNCHES", "TRENDING ON GITHUB", "HN DEEP CUTS"],
        )


class TestStripBrand(unittest.TestCase):
    def test_current_colon_format(self):
        self.assertEqual(thumb.strip_brand("aiBytes_ 04: Hooks here"), "Hooks here")

    def test_legacy_hash_dash_format(self):
        self.assertEqual(thumb.strip_brand("aiBytes_ #3 - Hooks here"), "Hooks here")

    def test_untitled_subject_survives(self):
        self.assertEqual(thumb.strip_brand("Just a headline"), "Just a headline")

    def test_never_returns_empty(self):
        self.assertEqual(thumb.strip_brand("aiBytes_ 04:"), "aiBytes_ 04:")


class TestHighlight(unittest.TestCase):
    def test_wraps_the_phrase(self):
        out = thumb.highlight("the week Oracle said no", "Oracle said no")
        self.assertEqual(out, "the week <mark>Oracle said no</mark>")

    def test_case_insensitive(self):
        self.assertIn("<mark>Oracle</mark>", thumb.highlight("An Oracle ban", "oracle"))

    def test_escapes_around_the_mark(self):
        out = thumb.highlight("A & B ban", "ban")
        self.assertIn("&amp;", out)
        self.assertIn("<mark>ban</mark>", out)

    def test_absent_phrase_is_an_error(self):
        with self.assertRaises(SystemExit):
            thumb.highlight("the week Oracle said no", "Anthropic")

    def test_no_phrase_escapes_everything(self):
        self.assertEqual(thumb.highlight("A & B", None), "A &amp; B")


class TestBuildHtml(unittest.TestCase):
    def test_fills_every_token(self):
        doc = thumb.build_html(thumb.parse_issue(ISSUE_HTML), "Oracle said no")
        self.assertNotIn("{{", doc)
        self.assertIn("<mark>Oracle said no</mark>", doc)
        self.assertIn("ISSUE 0x04", doc)
        self.assertIn("~5 MIN", doc)

    def test_unfilled_token_is_an_error(self):
        with self.assertRaises(SystemExit):
            thumb.build_html(
                thumb.parse_issue(ISSUE_HTML), None, template="{{NOT_A_REAL_TOKEN}}"
            )


@unittest.skipIf(thumb.find_chrome() is None, "Chrome not installed")
class TestRender(unittest.TestCase):
    def test_renders_exactly_1200x630(self):
        tmp = tempfile.TemporaryDirectory(prefix="thumbnail-test-")
        self.addCleanup(tmp.cleanup)
        issue_dir = pathlib.Path(tmp.name) / "issue"
        issue_dir.mkdir()
        (issue_dir / "aiBytes-issue-4.html").write_text(ISSUE_HTML)
        out_root = pathlib.Path(tmp.name) / "out"

        proc = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--issue-dir",
                str(issue_dir),
                "--output-root",
                str(out_root),
                "--highlight",
                "Oracle said no",
            ],
            capture_output=True,
            text=True,
            timeout=300,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)

        png = out_root / "issue-4-thumbnail.png"
        self.assertTrue(png.is_file(), f"missing {png}")
        self.assertEqual(thumb.png_size(png), (1200, 630))
        # Beehiiv rejects oversized uploads; flat-colour PNGs land far under this.
        self.assertLess(png.stat().st_size, 2 * 1024 * 1024)


class TestHtmlOnly(unittest.TestCase):
    def test_runs_without_chrome(self):
        tmp = tempfile.TemporaryDirectory(prefix="thumbnail-html-")
        self.addCleanup(tmp.cleanup)
        issue_dir = pathlib.Path(tmp.name) / "issue"
        issue_dir.mkdir()
        (issue_dir / "aiBytes-issue-4.html").write_text(ISSUE_HTML)

        proc = subprocess.run(
            [sys.executable, str(SCRIPT), "--issue-dir", str(issue_dir), "--html-only"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertTrue((issue_dir / "issue-4-thumbnail.html").is_file())

    def test_missing_issue_html_is_an_error(self):
        tmp = tempfile.TemporaryDirectory(prefix="thumbnail-empty-")
        self.addCleanup(tmp.cleanup)
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), "--issue-dir", tmp.name, "--html-only"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        self.assertNotEqual(proc.returncode, 0)


if __name__ == "__main__":
    unittest.main()
