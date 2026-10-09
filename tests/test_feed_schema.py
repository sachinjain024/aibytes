"""Offline unit tests for the published content contract (packages/feed-schema).

The contract is the boundary between this repo's curate step and its consumers:
the aiBytes_ web app, the Chrome extension, and the weekly newsletter skill. A
shipped extension cannot be hotfixed, so these tests guard what would break it -
the hand-written validator drifting from the schema files, the source list
drifting from the fetchers that produce it, a breaking change slipping through
unversioned, and a content tree whose four files disagree with each other.
"""

import io
import json
import pathlib
import sys
import tempfile
import unittest
from contextlib import redirect_stdout

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

import validate as contract
from aibytes_fetchers import registry

try:
    from jsonschema import Draft202012Validator
except ImportError:  # not a dependency - this repo's Python is stdlib only
    Draft202012Validator = None

# aibytes.io, served from GitHub Pages; the build copies the schemas into content/.
PUBLISHED_URL = "https://aibytes.io/"


def item(**overrides):
    base = {
        "id": "ph-chatcut-2026-08-27",
        "title": "ChatCut",
        "summary": "AI video editor inside ChatGPT with a real timeline and XML export.",
        "url": "https://chatcut.ai",
        "source": "producthunt",
        "source_url": "https://www.producthunt.com/products/chatcut",
        "category": "launches",
        "tags": ["Video", "Dev Tool", "Launch"],
        "image": {"type": "logo", "url": "https://ph-files.imgix.net/abc.png"},
        "signals": {"upvotes": 776, "comments": 42},
        "published_at": "2026-08-26T15:02:00Z",
        "hidden": False,
    }
    base.update(overrides)
    return base


def edition(**overrides):
    base = {
        "schema_version": 1,
        "date": "2026-08-27",
        "generated_at": "2026-08-27T08:04:12Z",
        "counts": {"launches": 1, "repos": 0, "news": 0, "hn": 0},
        "items": [item()],
    }
    base.update(overrides)
    return base


def index(**overrides):
    base = {
        "schema_version": 1,
        "generated_at": "2026-08-27T08:04:12Z",
        "editions": [{
            "date": "2026-08-27",
            "path": "editions/2026-08-27.json",
            "total": 1,
            "generated_at": "2026-08-27T08:04:12Z",
        }],
    }
    base.update(overrides)
    return base


def tags(**overrides):
    base = {
        "schema_version": 1,
        "groups": [
            {"name": "Domain", "tags": [{"name": "Video", "slug": "video"}]},
            {"name": "What it is", "tags": [{"name": "Dev Tool", "slug": "dev-tool"}]},
            {"name": "Business", "tags": [{"name": "Launch", "slug": "launch"}]},
        ],
    }
    base.update(overrides)
    return base


def hidden(**overrides):
    base = {"schema_version": 1, "hidden": []}
    base.update(overrides)
    return base


class TestValidatorMatchesSchemas(unittest.TestCase):
    """The validator is hand-written; the schema files are the contract of record."""

    def setUp(self):
        self.edition = contract.load_schema("edition")
        self.item = self.edition["$defs"]["item"]
        self.index = contract.load_schema("index")
        self.tags = contract.load_schema("tags")
        self.hidden = contract.load_schema("hidden")

    def test_required_keys_agree(self):
        pairs = [
            (self.edition["required"], contract.EDITION_REQUIRED),
            (self.item["required"], contract.ITEM_REQUIRED),
            (self.index["required"], contract.INDEX_REQUIRED),
            (self.index["properties"]["editions"]["items"]["required"],
             contract.INDEX_ENTRY_REQUIRED),
            (self.tags["required"], contract.TAGS_REQUIRED),
            (self.hidden["required"], contract.HIDDEN_REQUIRED),
            (self.hidden["properties"]["hidden"]["items"]["required"],
             contract.HIDDEN_ENTRY_REQUIRED),
        ]
        for schema_required, validator_required in pairs:
            with self.subTest(required=sorted(schema_required)):
                self.assertEqual(sorted(schema_required), sorted(validator_required))

    def test_item_keys_agree(self):
        # The validator rejects any key it does not know, so an optional key
        # the schema gains without the validator would make every producer
        # that writes it fail validation.
        self.assertEqual(sorted(self.item["properties"]),
                         sorted(contract.ITEM_REQUIRED + contract.ITEM_OPTIONAL))

    def test_rank_is_an_optional_integer_from_one(self):
        rank = self.item["properties"]["rank"]
        self.assertEqual(rank["type"], "integer")
        self.assertEqual(rank["minimum"], contract.RANK_MIN)
        self.assertNotIn("rank", self.item["required"])

    def test_enums_agree(self):
        properties = self.item["properties"]
        pairs = [
            (properties["category"]["enum"], contract.CATEGORIES),
            (properties["source"]["enum"], contract.SOURCES),
            (self.edition["$defs"]["image"]["properties"]["type"]["enum"],
             contract.IMAGE_TYPES),
        ]
        for schema_enum, validator_enum in pairs:
            with self.subTest(enum=sorted(schema_enum)):
                self.assertEqual(sorted(schema_enum), sorted(validator_enum))

    def test_count_and_signal_and_meta_keys_agree(self):
        properties = self.item["properties"]
        self.assertEqual(
            sorted(self.edition["properties"]["counts"]["properties"]),
            sorted(contract.CATEGORIES),
        )
        self.assertEqual(
            sorted(self.edition["properties"]["counts"]["required"]),
            sorted(contract.CATEGORIES),
        )
        self.assertEqual(sorted(properties["signals"]["properties"]), sorted(contract.SIGNAL_KEYS))
        self.assertEqual(sorted(properties["meta"]["properties"]), sorted(contract.META_KEYS))

    def test_patterns_agree(self):
        properties = self.item["properties"]
        self.assertEqual(properties["id"]["pattern"], contract.ID_RE.pattern)
        self.assertEqual(
            self.index["properties"]["editions"]["items"]["properties"]["path"]["pattern"],
            contract.PATH_RE.pattern,
        )
        group = self.tags["properties"]["groups"]["items"]["properties"]["tags"]["items"]
        self.assertEqual(group["properties"]["slug"]["pattern"], contract.SLUG_RE.pattern)
        self.assertEqual(
            self.hidden["properties"]["hidden"]["items"]["properties"]["id"]["pattern"],
            contract.ID_RE.pattern,
        )
        self.assertEqual(self.edition["$defs"]["httpUrl"]["pattern"], contract.URL_RE.pattern)

    def test_every_date_pattern_agrees(self):
        # Three files carry a date, and all three must mean the same thing.
        for schema, pattern in (
            (self.edition, self.edition["properties"]["date"]["pattern"]),
            (self.index,
             self.index["properties"]["editions"]["items"]["properties"]["date"]["pattern"]),
            (self.hidden,
             self.hidden["properties"]["hidden"]["items"]["properties"]["edition_date"]["pattern"]),
        ):
            with self.subTest(schema=schema["title"]):
                self.assertEqual(pattern, contract.DATE_RE.pattern)

    def test_caps_agree(self):
        properties = self.item["properties"]
        self.assertEqual(properties["tags"]["maxItems"], contract.MAX_TAGS)
        self.assertEqual(properties["summary"]["maxLength"], contract.SUMMARY_MAX)

    def test_every_schema_id_points_at_the_published_url(self):
        for name in ("edition", "index", "tags", "hidden"):
            with self.subTest(schema=name):
                self.assertEqual(contract.load_schema(name)["$id"],
                                 PUBLISHED_URL + "content/" + name + ".schema.json")

    def test_source_enum_matches_the_fetchers_that_produce_it(self):
        # The contract names the producers. If a source is added to
        # packages/fetchers without landing here, the app cannot render it.
        self.assertEqual(sorted(contract.SOURCES), sorted(registry.names()))


class TestValidateEdition(unittest.TestCase):
    def test_accepts_a_well_formed_edition(self):
        self.assertIsNotNone(contract.validate_edition(edition()))

    def test_optional_item_keys_may_be_absent(self):
        bare = item()
        for key in ("signals", "published_at"):
            del bare[key]
        self.assertIsNotNone(contract.validate_edition(edition(items=[bare])))

    def test_rejects_unknown_schema_version(self):
        # A consumer must never be handed a version it cannot read.
        with self.assertRaises(contract.FeedValidationError):
            contract.validate_edition(edition(schema_version=2))

    def test_rejects_a_bad_date(self):
        for bad in ("2026-13-45", "27-08-2026", "2026-8-27"):
            with self.subTest(date=bad):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(date=bad))

    def test_rejects_an_id_that_is_not_shaped_like_one(self):
        for bad in ("ChatCut", "ph-chatcut", "ph_chatcut-2026-08-27", "-ph-2026-08-27"):
            with self.subTest(item_id=bad):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(id=bad)]))

    def test_rejects_an_id_from_another_edition(self):
        # Catches an item carried forward from yesterday, and keeps ids global
        # so a save (item_id + edition_date) always resolves.
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(items=[item(id="ph-chatcut-2026-08-26")]))
        self.assertIn("must end with the edition date", str(ctx.exception))

    def test_rejects_duplicate_item_ids(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(
                counts={"launches": 2, "repos": 0, "news": 0, "hn": 0},
                items=[item(), item()],
            ))
        self.assertIn("duplicate", str(ctx.exception))

    def test_counts_must_be_the_visible_tally(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(
                counts={"launches": 5, "repos": 0, "news": 0, "hn": 0}))
        self.assertIn("counts.launches is 5 but 1 visible", str(ctx.exception))

    def test_hidden_items_are_not_counted(self):
        # This is the invariant hide.py maintains: hiding decrements counts.
        payload = edition(counts={"launches": 0, "repos": 0, "news": 0, "hn": 0},
                          items=[item(hidden=True)])
        self.assertIsNotNone(contract.validate_edition(payload))

    def test_counts_must_carry_every_category(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(counts={"launches": 1}))
        self.assertIn("missing category", str(ctx.exception))

    def test_rejects_an_unknown_category_in_counts(self):
        # v1.1 categories are a deliberate change here, not something a
        # producer can introduce on its own.
        counts = {"launches": 1, "repos": 0, "news": 0, "hn": 0, "discussions": 3}
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(counts=counts))
        self.assertIn("unknown category", str(ctx.exception))

    def test_rejects_unknown_category_or_source_on_an_item(self):
        for field, bad in (("category", "discussions"), ("source", "reddit")):
            with self.subTest(field=field):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(**{field: bad})]))

    def test_rejects_an_unknown_item_key(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(items=[item(score=9)]))
        self.assertIn("unknown key: score", str(ctx.exception))

    def test_rejects_a_summary_over_the_cap(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(edition(items=[item(summary="x" * 201)]))
        self.assertIn("over the 200 cap", str(ctx.exception))

    def test_rejects_a_non_http_url(self):
        for field in ("url", "source_url"):
            with self.subTest(field=field):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(**{field: "javascript:alert(1)"})]))

    def test_rejects_too_many_or_repeated_tags(self):
        for bad in (["A", "B", "C", "D", "E"], ["A", "A"]):
            with self.subTest(tags=bad):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(tags=bad)]))

    def test_tags_are_only_checked_against_the_list_when_it_is_given(self):
        # The schema deliberately does not enumerate tags, so tags.json can
        # grow without a schema change.
        payload = edition(items=[item(tags=["Nonsense"])])
        self.assertIsNotNone(contract.validate_edition(payload))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(payload, tag_names=contract.tag_names(tags()))
        self.assertIn("not in tags.json", str(ctx.exception))

    def test_image_none_carries_no_url_and_the_others_require_one(self):
        # Hacker News is the no-image case: the source mark fills the slot.
        story = item(image={"type": "none"}, source="hackernews",
                     category="hn", id="hn-claude-opus-5-2026-08-27")
        payload = edition(counts={"launches": 0, "repos": 0, "news": 0, "hn": 1},
                          items=[story])
        self.assertIsNotNone(contract.validate_edition(payload))

        for bad in ({"type": "none", "url": "https://example.com/x.png"},
                    {"type": "logo"},
                    {"type": "hero", "url": "https://example.com/x.png"}):
            with self.subTest(image=bad):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(image=bad)]))

    def test_signals_and_meta_are_omitted_rather_than_empty(self):
        # Both are optional, so an empty object is a producer slip that would
        # show up as noise in the diff on every re-run.
        for key in ("signals", "meta"):
            with self.subTest(key=key):
                with self.assertRaises(contract.FeedValidationError) as ctx:
                    contract.validate_edition(edition(items=[item(**{key: {}})]))
                self.assertIn(f"{key} must be omitted rather than empty", str(ctx.exception))

    def test_rejects_unknown_signal_and_meta_keys(self):
        with self.assertRaises(contract.FeedValidationError):
            contract.validate_edition(edition(items=[item(signals={"claps": 3})]))
        with self.assertRaises(contract.FeedValidationError):
            contract.validate_edition(edition(items=[item(meta={"editor": "sachin"})]))

    def test_meta_accepts_null(self):
        payload = edition(items=[item(meta={"language": None, "author": "alvis"})])
        self.assertIsNotNone(contract.validate_edition(payload))

    def test_signal_values_must_be_non_negative_ints_not_bools(self):
        for bad in (-1, True, "776"):
            with self.subTest(upvotes=bad):
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_edition(edition(items=[item(signals={"upvotes": bad})]))

    def test_reports_every_problem_at_once(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition({"schema_version": 9, "date": "nope", "items": []})
        message = str(ctx.exception)
        for expected in ("schema_version", "date", "generated_at", "counts"):
            self.assertIn(expected, message)


def ranked(*ranks, hidden_at=()):
    """An edition of len(ranks) launches; ranks[i] is item i's rank, None to omit it."""
    items = []
    for i, rank in enumerate(ranks):
        one = item(id=f"ph-item{i}-2026-08-27", hidden=i in hidden_at)
        if rank is not None:
            one["rank"] = rank
        items.append(one)
    visible = len(ranks) - len(hidden_at)
    return edition(counts={"launches": visible, "repos": 0, "news": 0, "hn": 0}, items=items)


class TestRank(unittest.TestCase):
    """rank is optional, but all-or-none: 1..N over every item, hidden ones included."""

    def test_an_edition_without_ranks_is_valid(self):
        # Every edition published before rank existed looks like this.
        self.assertIsNotNone(contract.validate_edition(ranked(None, None, None)))

    def test_a_full_set_of_ranks_is_valid_in_any_order(self):
        # File order is the reading order by category; rank is a separate order.
        self.assertIsNotNone(contract.validate_edition(ranked(2, 3, 1)))

    def test_hidden_items_keep_their_rank(self):
        # So hide.py never renumbers, and an unhide puts the item back in place.
        self.assertIsNotNone(contract.validate_edition(ranked(1, 2, 3, hidden_at=(1,))))

    def test_ranks_must_be_on_every_item_or_none(self):
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_edition(ranked(1, None, 2))
        self.assertIn("rank must be on every item or none: 1 of 3 item(s) lack it",
                      str(ctx.exception))

    def test_ranks_must_be_one_to_n_without_repeats_or_gaps(self):
        for ranks, detail in (((1, 1, 2), "missing 3, repeated 1"),
                              ((1, 2, 4), "missing 3"),
                              ((2, 3, 4), "missing 1")):
            with self.subTest(ranks=ranks):
                with self.assertRaises(contract.FeedValidationError) as ctx:
                    contract.validate_edition(ranked(*ranks))
                self.assertIn(f"ranks must be 1..3 with no repeats; {detail}", str(ctx.exception))

    def test_a_rank_must_be_an_integer_of_at_least_one(self):
        for bad in (0, -1, 1.5, 1.0, True, "1"):
            with self.subTest(rank=bad):
                with self.assertRaises(contract.FeedValidationError) as ctx:
                    contract.validate_edition(ranked(bad))
                self.assertIn(f"rank {bad!r} must be an integer of at least 1", str(ctx.exception))


class TestValidateIndex(unittest.TestCase):
    def test_accepts_a_well_formed_index(self):
        self.assertIsNotNone(contract.validate_index(index()))

    def test_accepts_an_empty_index(self):
        # What the file says before the first edition is generated.
        self.assertIsNotNone(contract.validate_index(index(editions=[])))

    def test_editions_must_be_newest_first(self):
        entry = index()["editions"][0]
        older = dict(entry, date="2026-08-26", path="editions/2026-08-26.json")
        self.assertIsNotNone(contract.validate_index(index(editions=[entry, older])))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_index(index(editions=[older, entry]))
        self.assertIn("newest first", str(ctx.exception))

    def test_rejects_a_repeated_edition_date(self):
        entry = index()["editions"][0]
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_index(index(editions=[entry, dict(entry)]))
        self.assertIn("older than the entry before it", str(ctx.exception))

    def test_rejects_absolute_or_escaping_paths(self):
        # A consumer resolves these against the index URL, so an escaping path
        # points off the site.
        for bad in ("/etc/passwd.json", "editions/2026-08-27.txt",
                    "../secrets.json", "editions/../../secrets.json"):
            with self.subTest(path=bad):
                entry = dict(index()["editions"][0], path=bad)
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_index(index(editions=[entry]))

    def test_total_must_be_a_non_negative_int_not_a_bool(self):
        for bad in (-1, True, "39"):
            with self.subTest(total=bad):
                entry = dict(index()["editions"][0], total=bad)
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_index(index(editions=[entry]))

    def test_rejects_an_unknown_entry_key(self):
        entry = dict(index()["editions"][0], counts={"launches": 1})
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_index(index(editions=[entry]))
        self.assertIn("unknown key: counts", str(ctx.exception))


class TestValidateTags(unittest.TestCase):
    def test_accepts_a_well_formed_list(self):
        self.assertIsNotNone(contract.validate_tags(tags()))

    def test_rejects_a_tag_in_two_groups(self):
        # A tag in two groups would make the filter ambiguous.
        groups = tags()["groups"] + [{"name": "Format", "tags": [{"name": "Video", "slug": "vid"}]}]
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_tags(tags(groups=groups))
        self.assertIn("duplicate tag name", str(ctx.exception))

    def test_rejects_a_repeated_slug(self):
        groups = tags()["groups"] + [{"name": "Format", "tags": [{"name": "Clip", "slug": "video"}]}]
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_tags(tags(groups=groups))
        self.assertIn("duplicate tag slug", str(ctx.exception))

    def test_rejects_a_slug_that_is_not_url_safe(self):
        for bad in ("Voice / Speech", "voice_speech", "-video", "video-"):
            with self.subTest(slug=bad):
                groups = [{"name": "Domain", "tags": [{"name": "X", "slug": bad}]}]
                with self.assertRaises(contract.FeedValidationError):
                    contract.validate_tags(tags(groups=groups))

    def test_rejects_an_empty_group(self):
        with self.assertRaises(contract.FeedValidationError):
            contract.validate_tags(tags(groups=[{"name": "Domain", "tags": []}]))

    def test_tag_names_collects_every_display_name(self):
        self.assertEqual(contract.tag_names(tags()), {"Video", "Dev Tool", "Launch"})


class TestValidateHidden(unittest.TestCase):
    def test_accepts_an_empty_log(self):
        self.assertIsNotNone(contract.validate_hidden(hidden()))

    def test_accepts_an_entry_with_a_reason(self):
        entry = {"id": "ph-chatcut-2026-08-27", "edition_date": "2026-08-27",
                 "hidden_at": "2026-08-27T09:00:00Z", "reason": "duplicate launch"}
        self.assertIsNotNone(contract.validate_hidden(hidden(hidden=[entry])))

    def test_the_id_must_agree_with_the_edition_date(self):
        entry = {"id": "ph-chatcut-2026-08-27", "edition_date": "2026-08-26",
                 "hidden_at": "2026-08-27T09:00:00Z"}
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_hidden(hidden(hidden=[entry]))
        self.assertIn("does not end with edition_date", str(ctx.exception))

    def test_rejects_a_repeated_id(self):
        entry = {"id": "ph-chatcut-2026-08-27", "edition_date": "2026-08-27",
                 "hidden_at": "2026-08-27T09:00:00Z"}
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_hidden(hidden(hidden=[entry, dict(entry)]))
        self.assertIn("duplicate id", str(ctx.exception))


class TestValidateContentRoot(unittest.TestCase):
    """The four files must also agree with each other."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        (self.root / "editions").mkdir()
        self.write("tags.json", tags())
        self.write("index.json", index())
        self.write("hidden.json", hidden())
        self.write("editions/2026-08-27.json", edition())
        self.addCleanup(self.tmp.cleanup)

    def write(self, name, document):
        (self.root / name).write_text(json.dumps(document, indent=2) + "\n")

    def test_accepts_a_consistent_tree(self):
        self.assertTrue(contract.validate_content_root(self.root))

    def test_an_index_entry_without_its_edition_is_caught(self):
        entry = index()["editions"][0]
        missing = dict(entry, date="2026-08-26", path="editions/2026-08-26.json")
        self.write("index.json", index(editions=[entry, missing]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("2026-08-26.json is missing", str(ctx.exception))

    def test_an_edition_the_index_forgot_is_caught(self):
        self.write("index.json", index(editions=[]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("does not list editions/2026-08-27.json", str(ctx.exception))

    def test_a_stale_total_is_caught(self):
        entry = dict(index()["editions"][0], total=39)
        self.write("index.json", index(editions=[entry]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("counts sum to 1", str(ctx.exception))

    def test_a_path_pointing_at_the_wrong_edition_is_caught(self):
        # `path` is what a consumer dereferences, so a wrong one is a 404 in
        # the app even though every file is individually valid.
        self.write("editions/2026-08-26.json", edition(
            date="2026-08-26",
            generated_at="2026-08-26T08:04:12Z",
            items=[item(id="ph-chatcut-2026-08-26")]))
        newer = dict(index()["editions"][0], path="editions/2026-08-26.json")
        older = {"date": "2026-08-26", "path": "editions/2026-08-26.json",
                 "total": 1, "generated_at": "2026-08-26T08:04:12Z"}
        self.write("index.json", index(editions=[newer, older]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("that edition is at editions/2026-08-27.json", str(ctx.exception))

    def test_a_path_pointing_at_nothing_is_caught(self):
        entry = dict(index()["editions"][0], path="editions/nope.json")
        self.write("index.json", index(editions=[entry]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("path is 'editions/nope.json'", str(ctx.exception))

    def test_a_stale_generated_at_is_caught(self):
        entry = dict(index()["editions"][0], generated_at="2026-08-27T23:59:00Z")
        self.write("index.json", index(editions=[entry]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("generated_at does not match", str(ctx.exception))

    def test_a_filename_that_disagrees_with_the_edition_is_caught(self):
        self.write("editions/2026-08-28.json", edition())
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("does not match the filename", str(ctx.exception))

    def test_an_unlogged_hide_is_caught(self):
        self.write("editions/2026-08-27.json", edition(
            counts={"launches": 0, "repos": 0, "news": 0, "hn": 0},
            items=[item(hidden=True)]))
        entry = dict(index()["editions"][0], total=0)
        self.write("index.json", index(editions=[entry]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("hidden in its edition but not logged", str(ctx.exception))

    def test_a_log_entry_whose_item_is_still_visible_is_caught(self):
        self.write("hidden.json", hidden(hidden=[{
            "id": "ph-chatcut-2026-08-27", "edition_date": "2026-08-27",
            "hidden_at": "2026-08-27T09:00:00Z",
        }]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("is logged but that item is not hidden", str(ctx.exception))

    def test_a_tag_outside_tags_json_is_caught(self):
        self.write("editions/2026-08-27.json", edition(items=[item(tags=["Telepathy"])]))
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("not in tags.json", str(ctx.exception))

    def test_a_missing_file_is_caught(self):
        (self.root / "tags.json").unlink()
        with self.assertRaises(contract.FeedValidationError) as ctx:
            contract.validate_content_root(self.root)
        self.assertIn("tags.json: missing", str(ctx.exception))


@unittest.skipUnless(Draft202012Validator, "jsonschema is not installed")
class TestSchemasAgainstARealEngine(unittest.TestCase):
    """Everything else here exercises the hand-written validator.

    jsonschema is deliberately not a dependency, so these skip when it is
    absent. They cover the two things the hand-written validator cannot tell us
    about itself: that the schema files are well-formed at all, and that the
    validator is never *laxer* than the contract of record. Stricter is fine and
    expected - the cross-field invariants are the whole reason it exists.
    """

    def cases(self):
        """(label, schema, validator, document, is_valid) - documents of both kinds."""
        return [
            ("a well-formed edition", "edition", contract.validate_edition,
             edition(), True),
            ("an item missing a key", "edition", contract.validate_edition,
             edition(items=[{k: v for k, v in item().items() if k != "url"}]), False),
            ("an unknown item key", "edition", contract.validate_edition,
             edition(items=[item(score=9)]), False),
            ("an id that is not shaped like one", "edition", contract.validate_edition,
             edition(items=[item(id="ChatCut")]), False),
            ("a summary over the cap", "edition", contract.validate_edition,
             edition(items=[item(summary="x" * 201)]), False),
            ("five tags", "edition", contract.validate_edition,
             edition(items=[item(tags=["A", "B", "C", "D", "E"])]), False),
            ("repeated tags", "edition", contract.validate_edition,
             edition(items=[item(tags=["A", "A"])]), False),
            ("image none carrying a url", "edition", contract.validate_edition,
             edition(items=[item(image={"type": "none", "url": "https://a/b.png"})]), False),
            ("image logo without a url", "edition", contract.validate_edition,
             edition(items=[item(image={"type": "logo"})]), False),
            ("empty signals", "edition", contract.validate_edition,
             edition(items=[item(signals={})]), False),
            ("empty meta", "edition", contract.validate_edition,
             edition(items=[item(meta={})]), False),
            ("an unknown signal key", "edition", contract.validate_edition,
             edition(items=[item(signals={"claps": 3})]), False),
            ("an unknown category", "edition", contract.validate_edition,
             edition(items=[item(category="discussions")]), False),
            ("an unknown source", "edition", contract.validate_edition,
             edition(items=[item(source="reddit")]), False),
            ("a negative count", "edition", contract.validate_edition,
             edition(counts={"launches": -1, "repos": 0, "news": 0, "hn": 0}), False),
            ("a ranked edition", "edition", contract.validate_edition, ranked(2, 1), True),
            ("a rank of zero", "edition", contract.validate_edition, ranked(0), False),
            ("a fractional rank", "edition", contract.validate_edition, ranked(1.5), False),
            ("a rank that is a string", "edition", contract.validate_edition, ranked("1"), False),
            ("a rank that is a bool", "edition", contract.validate_edition, ranked(True), False),
            ("a well-formed index", "index", contract.validate_index, index(), True),
            ("an empty index", "index", contract.validate_index, index(editions=[]), True),
            ("an escaping edition path", "index", contract.validate_index,
             index(editions=[dict(index()["editions"][0], path="../secrets.json")]), False),
            ("an unknown index entry key", "index", contract.validate_index,
             index(editions=[dict(index()["editions"][0], counts={})]), False),
            ("a well-formed tag list", "tags", contract.validate_tags, tags(), True),
            ("a slug that is not url-safe", "tags", contract.validate_tags,
             tags(groups=[{"name": "Domain",
                           "tags": [{"name": "X", "slug": "Voice / Speech"}]}]), False),
            ("an empty tag group", "tags", contract.validate_tags,
             tags(groups=[{"name": "Domain", "tags": []}]), False),
            ("an empty hide log", "hidden", contract.validate_hidden, hidden(), True),
            ("a hide entry missing its timestamp", "hidden", contract.validate_hidden,
             hidden(hidden=[{"id": "ph-x-2026-08-27", "edition_date": "2026-08-27"}]), False),
        ]

    def test_every_schema_is_well_formed(self):
        # A malformed schema would otherwise ship silently, since nothing else
        # here reads the schema files as schemas.
        for name in ("edition", "index", "tags", "hidden"):
            with self.subTest(schema=name):
                Draft202012Validator.check_schema(contract.load_schema(name))

    def test_the_validator_is_never_laxer_than_the_schema(self):
        for label, name, validate, document, _ in self.cases():
            with self.subTest(case=label):
                engine_ok = Draft202012Validator(contract.load_schema(name)).is_valid(document)
                try:
                    validate(document)
                    validator_ok = True
                except contract.FeedValidationError:
                    validator_ok = False
                if not engine_ok:
                    self.assertFalse(
                        validator_ok,
                        f"the schema rejects {label} but validate.py accepts it",
                    )

    def test_both_accept_the_well_formed_documents(self):
        for label, name, validate, document, is_valid in self.cases():
            if not is_valid:
                continue
            with self.subTest(case=label):
                Draft202012Validator(contract.load_schema(name)).validate(document)
                self.assertIsNotNone(validate(document))


class TestCommittedContent(unittest.TestCase):
    """The tree this repo actually publishes has to be valid."""

    def test_the_repo_content_tree_validates(self):
        self.assertTrue(contract.validate_content_root(REPO_ROOT / "content"))

    def test_the_cli_reports_a_clean_tree(self):
        out = io.StringIO()
        with redirect_stdout(out):
            code = contract.main(["--content-root", str(REPO_ROOT / "content")])
        self.assertEqual(code, 0)
        self.assertIn("is valid", out.getvalue())

    def test_the_shipped_tag_list_is_the_one_the_curate_step_will_use(self):
        names = contract.tag_names(json.loads((REPO_ROOT / "content" / "tags.json").read_text()))
        # A spot check across the groups, so a careless edit is loud.
        for expected in ("Model Release", "Agents", "Anthropic", "Funding", "Show HN"):
            self.assertIn(expected, names)
        self.assertEqual(len(names), 49)


if __name__ == "__main__":
    unittest.main()
