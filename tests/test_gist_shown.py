"""gist_is_shown (AIB-145y T7): hiding is derived from the items, never stored.

The cases live in packages/feed-schema/fixtures/gist-shown.json and are shared
with the JavaScript copy in apps/web/src/gistShown.js, so the build, the app
and the Python side cannot disagree about which gists have a page.
"""

import json
import pathlib
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))

import gist_contract as gc

CASES = json.loads((REPO_ROOT / "packages" / "feed-schema" / "fixtures" / "gist-shown.json").read_text())["cases"]


class TestGistIsShown(unittest.TestCase):
    def test_every_shared_case(self):
        self.assertGreaterEqual(len(CASES), 8)
        for case in CASES:
            with self.subTest(case=case["name"]):
                self.assertIs(gc.gist_is_shown(case["gist"], case["items"]), case["shown"])

    def test_hide_py_is_untouched_by_gists(self):
        # D4: hiding needs no change to hide.py; it never mentions gists.
        source = (REPO_ROOT / "packages" / "feed-schema" / "hide.py").read_text()
        self.assertNotIn("gist", source)


if __name__ == "__main__":
    unittest.main()
