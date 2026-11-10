"""Tests for the generate-newsletter-content issue artifact script. Offline."""

import importlib.util
import pathlib
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPTS = REPO_ROOT / ".claude" / "skills" / "generate-newsletter-content" / "scripts"
SCRIPT = SCRIPTS / "issue_artifact.py"
ISSUE = REPO_ROOT / "newsletter" / "issues" / "2026" / "week-45-Issue-16" / "aiBytes-issue-16.html"


def load(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


ia = load("issue_artifact")
sx = load("substack_export")


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.issue = ISSUE.read_text(encoding="utf-8")
        self.page = ia.build(self.issue)
        self.export = sx.convert(self.issue)

    def test_drops_the_document_skeleton(self):
        for tag in ("<!DOCTYPE", "<html", "<head>", "</head>", "<body>", "</body>", "</html>", "<meta "):
            self.assertNotIn(tag, self.page)

    def test_titles_the_page_by_issue_number(self):
        self.assertTrue(self.page.startswith("<title>aiBytes_ Issue #16</title>\n"))

    def test_carries_the_substack_title_subtitle_and_body(self):
        full = sx.page(self.export)
        body = full.split("<body>", 1)[1].split("</body>", 1)[0].strip()
        self.assertIn(body, self.page)
        self.assertIn(self.export["body"], self.page)
        self.assertIn('<div class="title">', self.page)
        self.assertIn('<div class="desc">', self.page)
        self.assertIn("<script>", self.page)

    def test_refuses_unfilled_template(self):
        with self.assertRaises(ValueError):
            ia.build(self.issue.replace("ISSUE 0x10", "ISSUE 0x{{ISSUE_HEX}}"))

    def test_cli_writes_the_page(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp) / "nested" / "page.html"
            r = subprocess.run([sys.executable, str(SCRIPT), "--issue", str(ISSUE), "--out", str(out)],
                               capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertEqual(out.read_text(encoding="utf-8"), self.page)


if __name__ == "__main__":
    unittest.main()
