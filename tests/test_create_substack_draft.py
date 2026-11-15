"""Tests for the create-substack-draft skill's staging script.

Offline. The issue fixture is the one test_substack_export builds from the real
template, so the draft carries exactly what the export does. The clipboard test
needs macOS `osascript` and skips without it.
"""

import importlib.util
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / ".claude" / "skills" / "create-substack-draft" / "scripts" / "stage_draft.py"
sys.path.insert(0, str(REPO_ROOT / "tests"))

from test_substack_export import issue_html, sx  # noqa: E402
from test_x_fetch_items import shortlisted_snapshot  # noqa: E402


def load_script():
    spec = importlib.util.spec_from_file_location("stage_draft", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sd = load_script()


class TestStage(unittest.TestCase):
    def setUp(self):
        self.html = issue_html(shortlisted_snapshot())

    def test_matches_the_substack_export(self):
        self.assertEqual(sd.stage(self.html), sx.convert(self.html))

    def test_unfilled_issue_is_refused(self):
        with self.assertRaises(ValueError):
            sd.stage("<title>{{EMAIL_SUBJECT}}</title>")

    def test_osascript_carries_the_body_as_hex_html(self):
        script = sd.osascript_html("<p>Hi ❤️</p>")
        self.assertTrue(script.startswith("set the clipboard to «data HTML"))
        hexpart = script[len("set the clipboard to «data HTML"):-1]
        self.assertEqual(bytes.fromhex(hexpart).decode("utf-8"), "<p>Hi ❤️</p>")


class TestScript(unittest.TestCase):
    def run_script(self, *args):
        return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True)

    def test_prints_fields_and_writes_the_body(self):
        with tempfile.TemporaryDirectory() as tmp:
            issue = pathlib.Path(tmp) / "aiBytes-issue-17.html"
            issue.write_text(issue_html(shortlisted_snapshot()), encoding="utf-8")
            body = pathlib.Path(tmp) / "body.html"
            proc = self.run_script("--issue", str(issue), "--no-clipboard", "--body-out", str(body))
            self.assertEqual(proc.returncode, 0, proc.stderr)
            fields = json.loads(proc.stdout)
            self.assertEqual(fields["num"], 17)
            self.assertEqual(fields["title"], "🪤 A backdoored extension & a world model")
            self.assertFalse(fields["clipboard"])
            self.assertEqual(fields["counts"]["AI News"], 2)
            self.assertEqual(body.read_text(encoding="utf-8"), sx.convert(issue.read_text(encoding="utf-8"))["body"])

    def test_unfilled_issue_exits_nonzero(self):
        with tempfile.TemporaryDirectory() as tmp:
            issue = pathlib.Path(tmp) / "aiBytes-issue-1.html"
            issue.write_text("<title>{{EMAIL_SUBJECT}}</title>", encoding="utf-8")
            proc = self.run_script("--issue", str(issue), "--no-clipboard")
            self.assertNotEqual(proc.returncode, 0)

    @unittest.skipUnless(shutil.which("osascript") and shutil.which("pbpaste"), "needs macOS osascript")
    def test_clipboard_holds_html(self):
        saved = subprocess.run(["pbpaste"], capture_output=True).stdout
        try:
            sd.copy_html("<p>clipboard check</p>")
            info = subprocess.run(["osascript", "-e", "clipboard info"], capture_output=True, text=True).stdout
            self.assertIn("HTML", info)
        finally:
            subprocess.run(["pbcopy"], input=saved)


if __name__ == "__main__":
    unittest.main()
