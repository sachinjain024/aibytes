"""Offline unit tests for the published feed contract (packages/feed-schema).

The feed is the boundary between this repo's producer and the aibytes-hub
extension, which cannot be hotfixed once shipped. These tests guard the two
things that would break it: the hand-written validator drifting from
feed.schema.json, and a breaking change slipping through unversioned.
"""

import pathlib
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))

import validate as feed


def index(**overrides):
    base = {
        "schemaVersion": 1,
        "generatedAt": "2026-08-31T06:00:00Z",
        "asOf": "2026-08-31",
        "cadence": "daily",
        "sources": [{"name": "hackernews", "path": "latest/hackernews.json", "count": 10}],
    }
    base.update(overrides)
    return base


class TestValidatorMatchesSchema(unittest.TestCase):
    """The validator is hand-written; the schema file is the contract of record."""

    def setUp(self):
        self.schema = feed.load_schema()

    def test_required_index_keys_agree(self):
        self.assertEqual(sorted(self.schema["required"]), sorted(feed.INDEX_REQUIRED))

    def test_required_source_keys_agree(self):
        source_schema = self.schema["properties"]["sources"]["items"]
        self.assertEqual(sorted(source_schema["required"]), sorted(feed.SOURCE_REQUIRED))

    def test_cadence_enum_agrees(self):
        self.assertEqual(
            sorted(self.schema["properties"]["cadence"]["enum"]), sorted(feed.CADENCES)
        )

    def test_patterns_agree(self):
        source_schema = self.schema["properties"]["sources"]["items"]["properties"]
        self.assertEqual(source_schema["name"]["pattern"], feed.NAME_RE.pattern)
        self.assertEqual(source_schema["path"]["pattern"], feed.PATH_RE.pattern)

    def test_schema_id_points_at_the_published_url(self):
        self.assertTrue(self.schema["$id"].startswith("https://sachinjain024.github.io/aibytes/"))


class TestValidateIndex(unittest.TestCase):
    def test_accepts_a_well_formed_index(self):
        self.assertIsNotNone(feed.validate_index(index()))

    def test_as_of_is_optional(self):
        payload = index()
        del payload["asOf"]
        self.assertIsNotNone(feed.validate_index(payload))

    def test_rejects_unknown_schema_version(self):
        # A consumer must never be handed a version it cannot read.
        with self.assertRaises(feed.FeedValidationError):
            feed.validate_index(index(schemaVersion=2))

    def test_rejects_unknown_cadence(self):
        with self.assertRaises(feed.FeedValidationError):
            feed.validate_index(index(cadence="hourly"))

    def test_rejects_bad_timestamps(self):
        with self.assertRaises(feed.FeedValidationError):
            feed.validate_index(index(generatedAt="last tuesday"))
        with self.assertRaises(feed.FeedValidationError):
            feed.validate_index(index(asOf="2026-13-45"))

    def test_rejects_duplicate_source_names(self):
        dupe = {"name": "hackernews", "path": "latest/other.json", "count": 1}
        with self.assertRaises(feed.FeedValidationError) as ctx:
            feed.validate_index(index(sources=[index()["sources"][0], dupe]))
        self.assertIn("duplicate", str(ctx.exception))

    def test_rejects_absolute_or_non_json_paths(self):
        for bad in ("/etc/passwd.json", "latest/hackernews.txt",
                    "../secrets.json", "latest/../../secrets.json"):
            with self.subTest(path=bad):
                with self.assertRaises(feed.FeedValidationError):
                    feed.validate_index(
                        index(sources=[{"name": "hn", "path": bad, "count": 1}])
                    )

    def test_count_must_be_a_non_negative_int_not_a_bool(self):
        for bad in (-1, True, "3"):
            with self.subTest(count=bad):
                with self.assertRaises(feed.FeedValidationError):
                    feed.validate_index(
                        index(sources=[{"name": "hn", "path": "a.json", "count": bad}])
                    )

    def test_reports_every_problem_at_once(self):
        with self.assertRaises(feed.FeedValidationError) as ctx:
            feed.validate_index({"schemaVersion": 9, "cadence": "hourly", "sources": []})
        message = str(ctx.exception)
        self.assertIn("generatedAt", message)
        self.assertIn("schemaVersion", message)
        self.assertIn("cadence", message)

    def test_a_failed_source_still_validates(self):
        # A source that failed must not invalidate the whole feed - consumers
        # render what they can.
        payload = index(sources=[{
            "name": "producthunt", "path": "latest/producthunt.json",
            "count": 0, "error": "401 from the API",
        }])
        self.assertIsNotNone(feed.validate_index(payload))


if __name__ == "__main__":
    unittest.main()
