"""The subscriber export, offline. Emails stay in the temp CSV, never in stdout."""

import io
import os
import pathlib
import shutil
import sys
import tempfile
import unittest
from datetime import datetime, timezone

REPO = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "packages" / "subscribers"))

from aibytes_subscribers.firestore import AUTH_FIX, AuthError, gcloud_token
from aibytes_subscribers.select import cutoff, select_pending
from subscribers import main

SKILL = REPO / ".claude" / "skills" / "export-subscribers" / "scripts"
sys.path.insert(0, str(SKILL))
import export_subscribers  # noqa: E402


def doc(name, email, created_at, imported_at=None, imported_until=None):
    return {
        "name": "projects/ai-bytes-b42d2/databases/aibytes/documents/subscribers/" + name,
        "email": email,
        "created_at": created_at,
        "imported_at": imported_at,
        "imported_until": imported_until,
    }


# 23:59 IST on 30 Nov is 18:29 UTC. 00:00 IST on 1 Dec is 18:30 UTC.
IN_DAY = "2026-11-30T18:29:00Z"
NEXT_MIDNIGHT = "2026-11-30T18:30:00Z"
EARLIER = "2026-11-11T08:00:00Z"


class Store:
    def __init__(self, docs, status=200):
        self.docs = docs
        self.status = status
        self.patches = []

    def __call__(self, method, url, body=None, headers=None):
        if self.status != 200:
            return self.status, {}
        if method == "GET":
            return 200, {"documents": [self._rest(doc) for doc in self.docs]}
        if method == "PATCH":
            self.patches.append((url, body))
            uid = url.split("/subscribers/")[1].split("?")[0]
            for item in self.docs:
                if item["name"].endswith("/" + uid):
                    fields = body["fields"]
                    item["imported_at"] = fields["imported_at"]["timestampValue"]
                    item["imported_until"] = fields["imported_until"]["stringValue"]
            return 200, {}
        return 500, {}

    @staticmethod
    def _rest(item):
        fields = {
            "email": {"stringValue": item["email"]},
            "created_at": {"timestampValue": item["created_at"]},
        }
        if item.get("imported_at"):
            fields["imported_at"] = {"timestampValue": item["imported_at"]}
        if item.get("imported_until"):
            fields["imported_until"] = {"stringValue": item["imported_until"]}
        return {"name": item["name"], "fields": fields}


class SelectTests(unittest.TestCase):
    def test_the_ist_day_is_inclusive_and_imported_rows_are_out(self):
        end = cutoff("2026-11-30")
        self.assertEqual(end.isoformat(), "2026-11-30T18:30:00+00:00")
        docs = [
            doc("late", "late@example.com", IN_DAY),
            doc("next", "next@example.com", NEXT_MIDNIGHT),
            doc("done", "done@example.com", EARLIER, imported_at="2026-11-12T00:00:00Z", imported_until="2026-11-11"),
            doc("early", "early@example.com", EARLIER),
        ]
        chosen = select_pending(docs, "2026-11-30")
        self.assertEqual([item["email"] for item in chosen], ["early@example.com", "late@example.com"])


class CommandTests(unittest.TestCase):
    def setUp(self):
        self.store = Store([
            doc("late", "late@example.com", IN_DAY),
            doc("next", "next@example.com", NEXT_MIDNIGHT),
            doc("done", "done@example.com", EARLIER, imported_at="2026-11-12T00:00:00Z", imported_until="2026-11-11"),
            doc("early", "early@example.com", EARLIER),
        ])
        self.out = io.StringIO()
        self.tmp = tempfile.TemporaryDirectory()
        self.output = str(pathlib.Path(self.tmp.name) / "subscribers.csv")

    def tearDown(self):
        self.tmp.cleanup()

    def run_cli(self, argv):
        return main(argv, token="test-token", transport=self.store, now=datetime(2026, 12, 1, tzinfo=timezone.utc), repo=REPO, stdout=self.out)

    def test_export_writes_the_pending_set_and_prints_no_email(self):
        code = self.run_cli(["export", "--until", "2026-11-30", "--output", self.output])
        self.assertEqual(code, 0)
        text = self.out.getvalue()
        self.assertIn("exported: 2", text)
        self.assertIn(self.output, text)
        self.assertNotIn("example.com", text)
        rows = pathlib.Path(self.output).read_text().splitlines()
        self.assertEqual(rows[0], "email,subscribed_at")
        self.assertEqual(rows[1:], ["early@example.com," + EARLIER, "late@example.com," + IN_DAY])

    def test_a_path_inside_the_repository_is_refused(self):
        inside = str(REPO / "tmp-subscribers.csv")
        code = self.run_cli(["export", "--until", "2026-11-30", "--output", inside])
        self.assertEqual(code, 1)
        self.assertIn("inside the repository", self.out.getvalue())
        self.assertFalse(pathlib.Path(inside).exists())
        self.assertNotIn("example.com", self.out.getvalue())

    def test_mark_needs_yes_and_then_a_second_export_is_empty(self):
        self.assertEqual(self.run_cli(["mark-imported", "--until", "2026-11-30"]), 1)
        self.assertEqual(self.store.patches, [])
        self.assertIn("without --yes", self.out.getvalue())
        self.out.seek(0)
        self.out.truncate()
        self.assertEqual(self.run_cli(["mark-imported", "--until", "2026-11-30", "--yes"]), 0)
        self.assertIn("marked: 2", self.out.getvalue())
        marked = {url.split("/subscribers/")[1].split("?")[0] for url, _body in self.store.patches}
        self.assertEqual(marked, {"early", "late"})
        self.assertTrue(all("currentDocument.exists=true" in url for url, _body in self.store.patches))
        for _url, body in self.store.patches:
            self.assertEqual(body["fields"]["imported_until"]["stringValue"], "2026-11-30")
        self.out.seek(0)
        self.out.truncate()
        self.assertEqual(self.run_cli(["export", "--until", "2026-11-30", "--output", self.output]), 0)
        self.assertIn("exported: 0", self.out.getvalue())
        self.assertEqual(pathlib.Path(self.output).read_text().splitlines(), ["email,subscribed_at"])

    def test_an_open_day_is_refused_so_a_later_subscriber_is_not_marked(self):
        late = doc("after", "after@example.com", "2026-11-12T04:00:00Z")
        self.store.docs.append(late)
        during = datetime(2026, 11, 12, 6, tzinfo=timezone.utc)
        code = main(
            ["mark-imported", "--until", "2026-11-30", "--yes"],
            token="test-token", transport=self.store, now=during, repo=REPO, stdout=self.out,
        )
        self.assertEqual(code, 1)
        self.assertEqual(self.store.patches, [])
        self.assertIn("has not ended", self.out.getvalue())
        self.assertNotIn("after@example.com", self.out.getvalue())
        self.out.seek(0)
        self.out.truncate()
        finished = datetime(2026, 11, 12, tzinfo=timezone.utc)
        self.assertEqual(self.run_cli(["export", "--until", "2026-11-11", "--output", self.output]), 0)
        # run_cli uses 1 Dec, which is after 11 Nov. The 12 Nov subscriber is out.
        rows = pathlib.Path(self.output).read_text()
        self.assertNotIn("after@example.com", rows)

    def test_status_prints_counts_only(self):
        self.assertEqual(self.run_cli(["status"]), 0)
        text = self.out.getvalue()
        self.assertEqual(text.splitlines(), [
            "imported: 1",
            "pending: 3",
            "latest imported_until: 2026-11-11",
            "oldest pending: " + EARLIER,
        ])
        self.assertNotIn("example.com", text)


class AuthTests(unittest.TestCase):
    def test_a_missing_gcloud_names_the_fix(self):
        with self.assertRaises(AuthError) as caught:
            gcloud_token(which=lambda _name: None)
        self.assertIn("gcloud auth login", str(caught.exception))
        self.assertIn("ai-bytes-b42d2", str(caught.exception))
        self.assertIn("aibytes", str(caught.exception))
        self.assertEqual(str(caught.exception).count("\n"), 0)

    def test_a_refused_token_names_the_fix(self):
        out = io.StringIO()
        code = main(["status"], token="nope", transport=lambda *_a, **_k: (403, {}), stdout=out)
        self.assertEqual(code, 1)
        self.assertIn(AUTH_FIX, out.getvalue())
        self.assertEqual(out.getvalue().count("\n"), 1)


class SkillTests(unittest.TestCase):
    def test_the_script_exports_marks_and_reports_status(self):
        store = Store([
            doc("late", "late@example.com", IN_DAY),
            doc("next", "next@example.com", NEXT_MIDNIGHT),
            doc("done", "done@example.com", EARLIER, imported_at="2026-11-12T00:00:00Z", imported_until="2026-11-11"),
            doc("early", "early@example.com", EARLIER),
        ])
        out = io.StringIO()
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        output = str(pathlib.Path(tmp.name) / "subscribers.csv")
        common = dict(token="test-token", transport=store, now=datetime(2026, 12, 1, tzinfo=timezone.utc), repo=REPO, stdout=out)
        self.assertEqual(export_subscribers.main(["export", "--until", "2026-11-30", "--output", output], **common), 0)
        self.assertEqual(export_subscribers.main(["mark-imported", "--until", "2026-11-30", "--yes"], **common), 0)
        self.assertEqual(export_subscribers.main(["status"], **common), 0)
        text = out.getvalue()
        self.assertIn("exported: 2", text)
        self.assertIn("marked: 2", text)
        self.assertIn("imported: 3", text)
        self.assertIn("pending: 1", text)
        self.assertNotIn("example.com", text)
        self.assertTrue(pathlib.Path(output).is_file())

    def test_the_skill_is_the_agents_symlink_and_keeps_emails_out_of_the_routine(self):
        link = REPO / ".agents" / "skills"
        self.assertTrue(link.is_symlink())
        text = (link / "export-subscribers" / "SKILL.md").read_text()
        self.assertIn("name: export-subscribers", text)
        self.assertIn("description:", text)
        self.assertIn("outside the repository", text)
        self.assertIn("Never print", text)
        self.assertFalse((REPO / ".agents" / "skills" / "export-subscribers").is_symlink())
        self.assertEqual((link / "export-subscribers" / "SKILL.md").resolve(), (REPO / ".claude" / "skills" / "export-subscribers" / "SKILL.md").resolve())


@unittest.skipIf(os.environ.get("AIBYTES_SKIP_LIVE") == "1" or shutil.which("gcloud") is None, "needs gcloud and a live project")
class LiveTests(unittest.TestCase):
    def test_status_reaches_the_project(self):
        out = io.StringIO()
        code = main(["status"], stdout=out)
        self.assertEqual(code, 0)
        self.assertIn("imported:", out.getvalue())
        self.assertNotIn("@", out.getvalue())


if __name__ == "__main__":
    unittest.main()
