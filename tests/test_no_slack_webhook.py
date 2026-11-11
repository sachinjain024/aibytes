"""No Slack incoming-webhook URL is committed. The host name appears in the
runner's docs as a placeholder; a real services/<id> path must not."""
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# A placeholder (services/...) is not a credential. A real path is.
REAL = re.compile(r"hooks\.slack\.com/services/(?!\.\.\.)\S+")


def files():
    listed = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    for name in listed.decode().split("\0"):
        if not name:
            continue
        path = ROOT / name
        if path.suffix in {".png", ".jpg", ".webp", ".zip", ".woff2"}:
            continue
        if path.is_file():
            yield path


class SlackWebhookTests(unittest.TestCase):
    def test_no_file_contains_a_webhook_url(self):
        found = []
        for path in files():
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeError:
                continue
            if REAL.search(text):
                found.append(str(path.relative_to(ROOT)))
        self.assertEqual(found, [])


if __name__ == "__main__":
    unittest.main()
