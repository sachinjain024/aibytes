"""Offline unit tests for the curate step (packages/curate, curate-edition skill).

Curate is the only writer of content/editions/, so it is where a bad edition
would come from. These tests cover the three ways that happens: an item shaped
wrongly for the contract, an item that should never have been in the edition
(or should have been and was dropped), and the published tree left disagreeing
with itself - a hide undone by a re-run, an index that has fallen behind.

Nothing here touches the network. The one call that does - resolving a Product
Hunt launch to its real website - goes through a seam the tests substitute.
"""

import io
import json
import pathlib
import re
import shutil
import sys
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "curate"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "fetchers"))

import validate as contract
from aibytes_curate import adapters, cli, edition as edition_mod, links, rank, relevance
from aibytes_curate import summaries as summaries_mod
from aibytes_fetchers import registry

DATE = "2026-08-31"


# --------------------------------------------------------------------------
# Fixtures: the four snapshot shapes, as the fetchers write them
# --------------------------------------------------------------------------

def ph_post(**overrides):
    post = {
        "id": "1231551",
        "name": "ChatCut",
        "tagline": "AI video editor inside ChatGPT",
        "description": "ChatCut is an AI video editor with a real timeline and XML export.",
        "slug": "chatcut",
        "votesCount": 776,
        "commentsCount": 42,
        "url": "https://www.producthunt.com/products/chatcut?utm_campaign=producthunt-api",
        "website": "https://www.producthunt.com/r/ABC123?utm_medium=api-v2",
        "featuredAt": "2026-08-26T15:02:00Z",
        "thumbnail": {"type": "image", "url": "https://ph-files.imgix.net/abc.png?auto=format"},
        "topics": {"nodes": [{"name": "Video", "slug": "video"}]},
    }
    post.update(overrides)
    return post


def gh_repo(**overrides):
    repo = {
        "name": "openai/codex",
        "url": "https://github.com/openai/codex",
        "description": "Lightweight coding agent that runs in your terminal",
        "language": "Rust",
        "stars": 51000,
        "forks": 6100,
        "period_stars": 2400,
    }
    repo.update(overrides)
    return repo


def tc_article(**overrides):
    article = {
        "title": "OpenAI to start showing ads on ChatGPT free tiers",
        "description": "OpenAI has more than 100 million weekly active users in India.",
        "url": "https://techcrunch.com/2026/08/27/openai-ads/",
        "published_at": "2026-08-27T11:35:59Z",
        "author": "Ivan Mehta",
        "image": "https://techcrunch.com/wp-content/uploads/chatgpt.jpg?resize=1200,800",
        "reading_time": "2 minutes",
        "hackernews": {"points": 7, "num_comments": 0},
    }
    article.update(overrides)
    return article


def hn_story(**overrides):
    story = {
        "title": "Nvidia agrees to acquire Hugging Face for $13B",
        "url": "https://www.businessinsider.com/nvidia-hugging-face",
        "type": "story",
        "points": 1965,
        "num_comments": 905,
        "author": "mfiguiere",
        "created_at": "2026-08-27T01:12:55Z",
        "hn_url": "https://news.ycombinator.com/item?id=49458161",
    }
    story.update(overrides)
    return story


def snapshots(ph=(), gh=(), tc=(), hn=()):
    return {
        "producthunt": {"source": "producthunt", "posts": list(ph)},
        "github": {"source": "github-trending", "repos": list(gh)},
        "techcrunch": {"source": "techcrunch", "articles": list(tc)},
        "hackernews": {"source": "hackernews", "stories": list(hn)},
    }


def drafts_from(**kwargs):
    return adapters.adapt_all(snapshots(**kwargs), DATE)[0]


# --------------------------------------------------------------------------
# Adapters
# --------------------------------------------------------------------------

class AdapterTests(unittest.TestCase):
    """Four source shapes into one contract shape."""

    def test_producthunt_item(self):
        item = drafts_from(ph=[ph_post()])[0].item
        self.assertEqual(item["id"], f"ph-chatcut-{DATE}")
        self.assertEqual(item["category"], "launches")
        self.assertEqual(item["source"], "producthunt")
        self.assertEqual(item["image"], {"type": "logo",
                                         "url": "https://ph-files.imgix.net/abc.png?auto=format"})
        self.assertEqual(item["signals"], {"upvotes": 776, "comments": 42})
        self.assertEqual(item["published_at"], "2026-08-26T15:02:00Z")
        self.assertFalse(item["hidden"])
        # Until links.resolve runs, the launch page is the destination; it is
        # always the source page.
        self.assertEqual(item["url"], "https://www.producthunt.com/products/chatcut")
        self.assertEqual(item["source_url"], "https://www.producthunt.com/products/chatcut")

    def test_github_item(self):
        item = drafts_from(gh=[gh_repo()])[0].item
        self.assertEqual(item["id"], f"gh-codex-{DATE}")
        self.assertEqual(item["category"], "repos")
        self.assertEqual(item["title"], "openai/codex")
        self.assertEqual(item["image"], {"type": "avatar",
                                         "url": "https://github.com/openai.png?size=80"})
        self.assertEqual(item["signals"], {"stars": 51000, "stars_gained": 2400, "forks": 6100})
        self.assertEqual(item["meta"], {"language": "Rust"})
        # GitHub trending reports a window, not a publish date.
        self.assertNotIn("published_at", item)

    def test_techcrunch_item(self):
        item = drafts_from(tc=[tc_article()])[0].item
        self.assertEqual(item["category"], "news")
        self.assertEqual(item["image"]["type"], "thumbnail")
        self.assertEqual(item["url"], item["source_url"])
        self.assertEqual(item["meta"], {"author": "Ivan Mehta", "reading_time": "2 minutes"})
        # The snapshot's hackernews block is a ranking aid, not a shown signal.
        self.assertNotIn("signals", item)

    def test_techcrunch_without_og_image_falls_back_to_the_mark(self):
        item = drafts_from(tc=[tc_article(image=None)])[0].item
        self.assertEqual(item["image"], {"type": "none"})

    def test_hackernews_item(self):
        item = drafts_from(hn=[hn_story()])[0].item
        self.assertEqual(item["category"], "hn")
        self.assertEqual(item["image"], {"type": "none"})
        self.assertEqual(item["url"], "https://www.businessinsider.com/nvidia-hugging-face")
        self.assertEqual(item["source_url"], "https://news.ycombinator.com/item?id=49458161")
        self.assertEqual(item["signals"], {"points": 1965, "comments": 905})

    def test_show_hn_is_a_launch_not_a_thread(self):
        for kind in ("show_hn", "launch_hn"):
            with self.subTest(kind=kind):
                item = drafts_from(hn=[hn_story(type=kind)])[0].item
                self.assertEqual(item["category"], "launches")

    def test_ids_match_the_contract_and_carry_the_edition_date(self):
        for draft in drafts_from(ph=[ph_post()], gh=[gh_repo()],
                                 tc=[tc_article()], hn=[hn_story()]):
            with self.subTest(item=draft.id):
                self.assertRegex(draft.id, contract.ID_RE)
                self.assertTrue(draft.id.endswith(f"-{DATE}"))

    def test_two_items_with_the_same_name_get_distinct_ids(self):
        ids = [d.id for d in drafts_from(ph=[ph_post(), ph_post(id="2")])]
        self.assertEqual(ids, [f"ph-chatcut-{DATE}", f"ph-chatcut-2-{DATE}"])
        self.assertRegex(ids[1], contract.ID_RE)

    def test_an_item_with_no_usable_url_is_reported_not_dropped_silently(self):
        drafts, unusable = adapters.adapt_all(snapshots(gh=[gh_repo(url=None)]), DATE)
        self.assertEqual(drafts, [])
        self.assertEqual(unusable[0]["reason"], "unusable")
        self.assertEqual(unusable[0]["source"], "github")

    def test_zero_signals_are_omitted_rather_than_written(self):
        # The contract omits `signals` rather than emitting it empty, and a
        # zero is the source saying nothing happened.
        item = drafts_from(hn=[hn_story(points=0, num_comments=0)])[0].item
        self.assertNotIn("signals", item)

    def test_every_adapted_item_satisfies_the_contract_once_it_has_copy(self):
        drafts = drafts_from(ph=[ph_post()], gh=[gh_repo()],
                             tc=[tc_article()], hn=[hn_story()])
        items = summaries_mod.merge(
            drafts, {d.id: {"summary": "A one line summary.", "tags": ["Agents"]}
                     for d in drafts})
        contract.validate_edition(edition_mod.build(items, DATE, "2026-08-31T08:00:00Z"),
                                  tag_names={"Agents"})


class UrlAndSlugTests(unittest.TestCase):

    def test_tracking_params_are_stripped_and_real_ones_kept(self):
        self.assertEqual(
            adapters.clean_url("https://x.com/a?utm_source=ph&ref=hn&id=7"),
            "https://x.com/a?id=7")
        # `source` is a genuine parameter often enough that it is not stripped.
        self.assertEqual(adapters.clean_url("https://x.com/a?source=rss"),
                         "https://x.com/a?source=rss")

    def test_a_query_with_nothing_to_strip_is_left_byte_for_byte(self):
        # These end up in published `url` and `image.url` values, read by an
        # extension that cannot be hotfixed, so re-encoding them is a contract
        # change with no upside. The comma is the real TechCrunch og:image
        # shape; "?flag" and "?flag=" are genuinely different queries.
        for url in (
            "https://techcrunch.com/a.jpg?resize=1200,800",
            "https://x.com/s?q=hello%20world",
            "https://x.com/a?flag",
            "https://x.com/a?b=1&c=2",
        ):
            with self.subTest(url=url):
                self.assertEqual(adapters.clean_url(url), url)

    def test_a_stray_trailing_backslash_is_dropped(self):
        self.assertEqual(
            adapters.clean_url("https://mistral.ai/news/mistral-large-4/\\"),
            "https://mistral.ai/news/mistral-large-4/")

    def test_non_http_urls_are_refused(self):
        for bad in ("javascript:alert(1)", "", None, "ftp://x.com/a", "not a url"):
            with self.subTest(url=bad):
                self.assertIsNone(adapters.clean_url(bad))

    def test_slugs_cut_at_a_word_boundary_and_stay_id_safe(self):
        slug = adapters.slugify("Nvidia agrees to acquire Hugging Face for $13B in cash")
        self.assertLessEqual(len(slug), adapters.SLUG_MAX)
        self.assertFalse(slug.endswith("-"))
        self.assertRegex(f"hn-{slug}-{DATE}", contract.ID_RE)

    def test_a_title_with_no_ascii_still_produces_a_usable_id(self):
        drafts, unusable = adapters.adapt_all(snapshots(tc=[tc_article(title="日本語")]), DATE)
        self.assertEqual(drafts, [])
        self.assertEqual(unusable[0]["reason"], "unusable")


# --------------------------------------------------------------------------
# The relevance filter and dedup
# --------------------------------------------------------------------------

class RelevanceTests(unittest.TestCase):

    def test_a_non_ai_product_hunt_launch_is_rejected(self):
        # PH is fetched with `featured: true` and no topic filter, so this is
        # the one source where the filter does real work.
        billing = ph_post(name="PaymentKit", tagline="Billing that survives a shutdown",
                          description="Multi-processor billing for SaaS.",
                          topics={"nodes": []}, slug="paymentkit")
        kept, rejected = relevance.apply(drafts_from(ph=[billing]))
        self.assertEqual(kept, [])
        self.assertEqual(rejected[0]["reason"], "not-ai")

    def test_an_ai_product_hunt_launch_is_kept(self):
        kept, rejected = relevance.apply(drafts_from(ph=[ph_post()]))
        self.assertEqual(len(kept), 1)
        self.assertEqual(rejected, [])

    def test_techcrunch_is_never_keyword_filtered(self):
        # The feed is TechCrunch's own artificial-intelligence category, so the
        # source has already made the call. Overruling it with our vocabulary
        # drops real AI stories whose headline does not use our words.
        kept, rejected = relevance.apply(drafts_from(
            tc=[tc_article(title="Amazon triples its order of Nvidia chips",
                           description="Surging demand, the company said.")]))
        self.assertEqual(len(kept), 1)
        self.assertEqual(rejected, [])

    def test_lowercase_repo_names_are_matched_as_github_matches_them(self):
        # github.is_ai_repo compiles the acronyms case-insensitively because
        # repo names are systematically lowercase. Curate must not be stricter
        # than the fetcher that produced the snapshot.
        kept, _ = relevance.apply(drafts_from(
            gh=[gh_repo(name="rohitg00/ai-engineering-from-scratch",
                        description="Build it from scratch")]))
        self.assertEqual(len(kept), 1)

    def test_the_same_article_from_two_sources_is_deduped_once(self):
        shared = "https://techcrunch.com/2026/08/27/openai-ads/"
        kept, rejected = relevance.apply(drafts_from(
            tc=[tc_article(url=shared)],
            hn=[hn_story(url=shared + "?utm_source=hn", title="OpenAI to show ads")]))
        self.assertEqual(len(kept), 1)
        # TechCrunch survives: it is the article, and it carries the image,
        # byline and reading time the HN row does not have.
        self.assertEqual(kept[0].source, "techcrunch")
        self.assertEqual(rejected[0]["reason"], "duplicate")
        self.assertIn(kept[0].id, rejected[0]["detail"])

    def test_dedup_sees_through_www_trailing_slashes_and_query_order(self):
        pairs = [
            ("https://x.com/a", "https://www.x.com/a/"),
            ("https://x.com/a?b=1&c=2", "https://x.com/a?c=2&b=1"),
        ]
        for first, second in pairs:
            with self.subTest(second=second):
                self.assertEqual(relevance.dedup_key(first), relevance.dedup_key(second))

    def test_a_resubmission_with_a_trailing_backslash_is_a_duplicate(self):
        # 2026-10-07: the same Mistral post reached HN twice, once with a
        # stray "\" on the end, and both landed in the edition.
        url = "https://mistral.ai/news/mistral-large-4/"
        kept, rejected = relevance.apply(drafts_from(hn=[
            hn_story(url=url + "\\", title="Mistral Large 4", points=1862),
            hn_story(url=url, title='Mistral Large 4: "Le Chonk"', points=519),
        ]))
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0].url, url)
        self.assertEqual(rejected[0]["reason"], "duplicate")

    def test_different_articles_are_not_deduped(self):
        self.assertNotEqual(relevance.dedup_key("https://x.com/a"),
                            relevance.dedup_key("https://x.com/b"))

    def test_items_come_out_in_the_apps_reading_order(self):
        kept, _ = relevance.apply(drafts_from(
            ph=[ph_post()], gh=[gh_repo()], tc=[tc_article()], hn=[hn_story()]))
        self.assertEqual([d.item["category"] for d in kept],
                         ["launches", "repos", "news", "hn"])

    def test_show_hn_sorts_after_product_hunt_inside_launches(self):
        kept, _ = relevance.apply(drafts_from(
            hn=[hn_story(type="show_hn", title="Show HN: an AI agent runner")],
            ph=[ph_post()]))
        self.assertEqual([d.source for d in kept], ["producthunt", "hackernews"])


# --------------------------------------------------------------------------
# Rank: one reading order across every source
# --------------------------------------------------------------------------

def ranked_drafts(ph=0, gh=0, tc=0, hn=0, show_hn=0):
    """n items per source, each in its fetcher's order, titles unique per source."""
    return drafts_from(
        ph=[ph_post(name=f"Launch {i}", slug=f"launch-{i}", votesCount=500 - i)
            for i in range(ph)],
        gh=[gh_repo(name=f"owner/repo-{i}", url=f"https://github.com/owner/repo-{i}",
                    period_stars=900 - i) for i in range(gh)],
        tc=[tc_article(title=f"Article {i}", url=f"https://techcrunch.com/a-{i}/")
            for i in range(tc)],
        hn=[hn_story(title=f"Story {i}", url=f"https://example.com/s-{i}",
                     hn_url=f"https://news.ycombinator.com/item?id={i}",
                     points=1000 - i) for i in range(hn)]
           + [hn_story(type="show_hn", title=f"Show HN: tool {i}",
                       url=f"https://example.com/show-{i}",
                       hn_url=f"https://news.ycombinator.com/item?id={100 + i}",
                       points=995 - 2 * i) for i in range(show_hn)],
    )


def reading_order(drafts):
    """[(source, position within source)] in rank order."""
    ranks = rank.assign(drafts)
    by_source = {}
    for draft in sorted(drafts, key=lambda d: (d.rank, d.id)):
        by_source.setdefault(draft.source, []).append(draft.id)
    position = {i: (source, n) for source, ids in by_source.items()
                for n, i in enumerate(ids)}
    return [position[i] for i in sorted(ranks, key=ranks.get)]


class RankTests(unittest.TestCase):

    def test_each_sources_leader_takes_the_top_four_in_tie_order(self):
        order = reading_order(ranked_drafts(ph=3, gh=3, tc=3, hn=3))
        self.assertEqual(order[:4], [("github", 0), ("hackernews", 0),
                                     ("techcrunch", 0), ("producthunt", 0)])

    def test_the_specs_worked_example_reproduces(self):
        # 2026-10-09: PH 5, GitHub 3, TC 10, HN 10 - docs/specs/AIB-77u-edition-rank.md
        order = reading_order(ranked_drafts(ph=5, gh=3, tc=10, hn=10))
        self.assertEqual(order[:12], [
            ("github", 0), ("hackernews", 0), ("techcrunch", 0), ("producthunt", 0),
            ("hackernews", 1), ("techcrunch", 1), ("hackernews", 2), ("techcrunch", 2),
            ("producthunt", 1), ("hackernews", 3), ("techcrunch", 3), ("github", 1)])

    def test_ranks_are_one_to_n_with_no_repeats(self):
        drafts = ranked_drafts(ph=5, gh=3, tc=10, hn=10)
        self.assertEqual(sorted(rank.assign(drafts).values()), list(range(1, 29)))
        self.assertEqual(set(rank.assign(drafts)), {d.id for d in drafts})

    def test_a_single_source_ranks_in_the_fetchers_order(self):
        drafts = ranked_drafts(hn=4)
        ranks = rank.assign(drafts)
        self.assertEqual([ranks[d.id] for d in drafts], [1, 2, 3, 4])

    def test_show_hn_and_hn_threads_are_one_group(self):
        # Show HN is category launches, but it is ranked against the HN threads
        # by points, not against Product Hunt.
        drafts = ranked_drafts(hn=2, show_hn=1)
        self.assertEqual({d.item["category"] for d in drafts}, {"launches", "hn"})
        ranks = rank.assign(drafts)
        self.assertEqual(sorted(ranks.values()), [1, 2, 3])
        show = next(d for d in drafts if d.item["category"] == "launches")
        # The fetcher order puts the Show HN after both threads.
        self.assertEqual(ranks[show.id], 3)

    def test_techcrunch_without_signals_follows_fetch_order(self):
        drafts = ranked_drafts(tc=3)
        # Nothing to score on: the fetcher's own position is all there is.
        self.assertFalse(any("signals" in d.item for d in drafts))
        ranks = rank.assign(drafts)
        self.assertEqual([ranks[d.id] for d in drafts], [1, 2, 3])

    def test_the_result_does_not_depend_on_input_order_or_the_run(self):
        drafts = ranked_drafts(ph=5, gh=3, tc=10, hn=10)
        first = rank.assign(drafts)
        self.assertEqual(rank.assign(list(reversed(drafts))), first)
        self.assertEqual(rank.assign(drafts), first)

    def test_tie_order_covers_every_source_exactly_once(self):
        self.assertEqual(sorted(rank.TIE_ORDER), sorted(registry.names()))
        self.assertEqual(len(set(rank.TIE_ORDER)), len(rank.TIE_ORDER))

    def test_the_files_reading_order_is_unchanged(self):
        # TIE_ORDER is the rank tie-break only; adapters.ORDER stays the file's.
        self.assertEqual(adapters.ORDER, ("producthunt", "github", "techcrunch", "hackernews"))
        self.assertNotEqual(rank.TIE_ORDER, adapters.ORDER)


# --------------------------------------------------------------------------
# The handover to Claude
# --------------------------------------------------------------------------

class SummariesTests(unittest.TestCase):

    def setUp(self):
        self.drafts = drafts_from(ph=[ph_post()])
        self.item_id = self.drafts[0].id
        self.tag_names = {"Video", "Dev Tool", "Launch", "Agents"}

    def written(self, **overrides):
        entry = {"summary": "AI video editor with a real timeline and XML export.",
                 "tags": ["Video"]}
        entry.update(overrides)
        return {self.item_id: entry}

    def check(self, summaries):
        return summaries_mod.check(summaries, self.drafts, self.tag_names)

    def test_a_clean_answer_passes_with_nothing_to_say(self):
        self.assertEqual(self.check(self.written()), ([], []))

    def test_every_accepted_file_shape_normalises_to_the_same_thing(self):
        entry = {"summary": "x", "tags": ["Video"]}
        for document in (
            {"items": {"a": entry}},
            {"items": [{"id": "a", **entry}]},
            {"a": entry},
            [{"id": "a", **entry}],
        ):
            with self.subTest(document=document):
                self.assertEqual(summaries_mod.load(document)["a"]["summary"], "x")

    def test_an_entry_written_as_null_is_fatal(self):
        # It is present, so the missing-item scan does not see it; it must
        # still be validated rather than skipped, or merge() crashes on it.
        problems, _ = self.check({self.item_id: None})
        self.assertTrue(any("must be an object" in p for p in problems), problems)

    def test_a_missing_item_is_fatal(self):
        problems, _ = self.check({})
        self.assertIn(f"{self.item_id}: no summary written", problems)

    def test_an_item_that_is_not_in_this_edition_is_fatal(self):
        problems, _ = self.check({**self.written(), f"ph-ghost-{DATE}": {
            "summary": "x", "tags": ["Video"]}})
        self.assertTrue(any("not an item in this edition" in p for p in problems))

    def test_a_summary_over_the_contract_cap_is_fatal(self):
        problems, _ = self.check(self.written(summary="x" * 201))
        self.assertTrue(any("over the 200 cap" in p for p in problems))

    def test_a_tag_outside_tags_json_is_fatal(self):
        problems, _ = self.check(self.written(tags=["Vidio"]))
        self.assertTrue(any("not a display name in tags.json" in p for p in problems))

    def test_tag_count_is_held_between_one_and_four(self):
        for tags in ([], ["Video", "Dev Tool", "Launch", "Agents", "Video"]):
            with self.subTest(tags=tags):
                problems, _ = self.check(self.written(tags=tags))
                self.assertTrue(any("expected 1 to 4" in p for p in problems))

    def test_duplicate_tags_are_fatal(self):
        problems, _ = self.check(self.written(tags=["Video", "Video"]))
        self.assertTrue(any("unique" in p for p in problems))

    def test_hype_and_dashes_are_warnings_not_failures(self):
        # A script should not be the judge of a sentence, but the writer should
        # hear about it.
        problems, warnings = self.check(
            self.written(summary="A seamless editor - powerful and effortless."))
        self.assertEqual(problems, [])
        self.assertTrue(any("asserts value" in w for w in warnings))

        problems, warnings = self.check(self.written(summary="An editor — with a timeline."))
        self.assertEqual(problems, [])
        self.assertTrue(any("em or en dash" in w for w in warnings))

    def test_merge_writes_the_contracts_key_order(self):
        items = summaries_mod.merge(self.drafts, self.written())
        self.assertEqual(list(items[0])[:8],
                         ["id", "title", "summary", "url", "source", "source_url",
                          "category", "tags"])
        self.assertEqual(list(items[0])[-1], "hidden")

    def test_the_curation_request_carries_the_vocabulary_and_the_source_text(self):
        request = summaries_mod.curation_request(
            self.drafts, {"groups": [{"name": "Domain", "tags": [{"name": "Video",
                                                                  "slug": "video"}]}]},
            DATE, "2026-08-31T08:00:00Z")
        self.assertEqual(request["items"][0]["id"], self.item_id)
        self.assertIn("XML export", request["items"][0]["source_text"])
        self.assertEqual(request["tags"][0]["tags"][0]["name"], "Video")


# --------------------------------------------------------------------------
# Product Hunt link resolution, the one call that needs the network
# --------------------------------------------------------------------------

class LinkTests(unittest.TestCase):

    def test_only_the_redirect_form_is_followed(self):
        self.assertTrue(links.is_redirect("https://www.producthunt.com/r/ABC123"))
        self.assertFalse(links.is_redirect("https://www.producthunt.com/products/chatcut"))
        self.assertFalse(links.is_redirect("https://chatcut.ai"))

    def test_a_resolved_launch_points_at_the_product(self):
        drafts = drafts_from(ph=[ph_post()])
        upgraded = links.resolve(drafts, follow_fn=lambda url: "https://chatcut.ai/")
        self.assertEqual(upgraded, 1)
        self.assertEqual(drafts[0].item["url"], "https://chatcut.ai/")
        # The source page is unchanged: the card's source name still links to PH.
        self.assertEqual(drafts[0].item["source_url"],
                         "https://www.producthunt.com/products/chatcut")

    def test_a_failed_lookup_leaves_the_launch_page_as_the_destination(self):
        drafts = drafts_from(ph=[ph_post()])
        self.assertEqual(links.resolve(drafts, follow_fn=lambda url: None), 0)
        self.assertEqual(drafts[0].item["url"], "https://www.producthunt.com/products/chatcut")


# --------------------------------------------------------------------------
# Counts, hides, and the index
# --------------------------------------------------------------------------

class AssemblyTests(unittest.TestCase):

    def items(self, *categories, hidden=()):
        return [
            {"id": f"ph-item-{i}-{DATE}", "category": category,
             "hidden": i in hidden}
            for i, category in enumerate(categories)
        ]

    def test_counts_are_the_visible_tally_with_all_four_keys(self):
        counts = edition_mod.tally(self.items("launches", "launches", "repos", hidden=(1,)))
        self.assertEqual(counts, {"launches": 1, "repos": 1, "news": 0, "hn": 0})

    def test_a_hidden_item_stays_hidden_when_the_date_is_re_curated(self):
        items = self.items("launches")
        hidden_doc = {"schema_version": 1, "hidden": [
            {"id": f"ph-item-0-{DATE}", "edition_date": DATE, "hidden_at": "2026-08-31T09:00:00Z"}]}
        items, orphans = edition_mod.apply_hidden(items, hidden_doc, DATE)
        self.assertTrue(items[0]["hidden"])
        self.assertEqual(orphans, [])
        self.assertEqual(edition_mod.tally(items)["launches"], 0)

    def test_a_hide_for_another_date_is_left_alone(self):
        hidden_doc = {"schema_version": 1, "hidden": [
            {"id": "ph-item-0-2026-08-30", "edition_date": "2026-08-30",
             "hidden_at": "2026-08-30T09:00:00Z"}]}
        items, orphans = edition_mod.apply_hidden(self.items("launches"), hidden_doc, DATE)
        self.assertFalse(items[0]["hidden"])
        self.assertEqual(orphans, [])

    def test_a_hide_whose_item_has_vanished_is_reported(self):
        hidden_doc = {"schema_version": 1, "hidden": [
            {"id": f"ph-gone-{DATE}", "edition_date": DATE, "hidden_at": "2026-08-31T09:00:00Z"}]}
        _, orphans = edition_mod.apply_hidden(self.items("launches"), hidden_doc, DATE)
        self.assertEqual(orphans, [f"ph-gone-{DATE}"])

    def test_the_index_stays_newest_first_and_replaces_rather_than_repeats(self):
        index = {"schema_version": 1, "generated_at": "2026-08-30T08:00:00Z", "editions": [
            {"date": "2026-08-30", "path": "editions/2026-08-30.json", "total": 3,
             "generated_at": "2026-08-30T08:00:00Z"}]}
        document = edition_mod.build([], DATE, "2026-08-31T08:00:00Z")
        index = edition_mod.update_index(index, document)
        self.assertEqual([e["date"] for e in index["editions"]], [DATE, "2026-08-30"])

        again = edition_mod.update_index(index, edition_mod.build([], DATE, "2026-08-31T09:00:00Z"))
        self.assertEqual([e["date"] for e in again["editions"]], [DATE, "2026-08-30"])
        # The index's own timestamp moves, because this run did curate.
        self.assertEqual(again["generated_at"], "2026-08-31T09:00:00Z")

    def test_an_index_entry_with_no_date_does_not_crash_the_sort(self):
        # A hand-edited index.json should be refused by the validator, which it
        # cannot do if update_index raises while sorting first.
        index = {"schema_version": 1, "generated_at": "x",
                 "editions": [{"path": "editions/2026-08-30.json"}]}
        updated = edition_mod.update_index(
            index, edition_mod.build([], DATE, "2026-08-31T08:00:00Z"))
        self.assertEqual(updated["editions"][0]["date"], DATE)

    def test_a_malformed_date_is_refused_by_name(self):
        for bad in ("31-08-2026", "20260824", "2026-13-01", "", None):
            with self.subTest(date=bad):
                with self.assertRaises(edition_mod.CurateError):
                    edition_mod.parse_date(bad)

    def test_two_dates_in_one_week_get_their_own_curation_request(self):
        # Only the daily layout has a folder per date; under any other cadence
        # the period folder covers a range, so the date must be in the name.
        for cadence, expect_same in (("daily", False), ("weekly", True)):
            with self.subTest(cadence=cadence):
                first = edition_mod.day_path("d", "2026-08-24", "curation.json", cadence)
                second = edition_mod.day_path("d", "2026-08-26", "curation.json", cadence)
                self.assertNotEqual(first, second)
                self.assertEqual(first.parent == second.parent, expect_same)

    def test_the_index_entry_points_at_the_file_it_names(self):
        document = edition_mod.build(
            [{"id": f"ph-a-{DATE}", "category": "launches", "hidden": False}],
            DATE, "2026-08-31T08:00:00Z")
        entry = edition_mod.update_index(
            {"schema_version": 1, "generated_at": "x", "editions": []}, document)["editions"][0]
        self.assertEqual(entry["path"], f"editions/{DATE}.json")
        self.assertEqual(entry["total"], 1)
        self.assertEqual(entry["generated_at"], document["generated_at"])


# --------------------------------------------------------------------------
# The two commands, end to end
# --------------------------------------------------------------------------

class LinkCacheTests(unittest.TestCase):
    """Resolution runs before dedup, so the cache is what keeps it honest."""

    def test_a_launch_and_its_show_hn_dedup_once_the_launch_is_resolved(self):
        # Unresolved, the launch points at producthunt.com and the two look
        # like different things. This is why resolution comes first.
        raw = dict(ph=[ph_post()],
                   hn=[hn_story(type="show_hn",
                                title="Show HN: ChatCut, an AI video editor",
                                url="https://chatcut.ai")])
        offline, _ = relevance.apply(drafts_from(**raw))
        self.assertEqual(len(offline), 2)

        resolved = drafts_from(**raw)
        links.resolve(resolved, follow_fn=lambda url: "https://chatcut.ai")
        kept, rejected = relevance.apply(resolved)
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0].source, "producthunt")
        self.assertEqual(rejected[0]["reason"], "duplicate")

    def test_a_cached_lookup_is_not_repeated(self):
        drafts = drafts_from(ph=[ph_post()])
        cache = {drafts[0].link_hint: "https://chatcut.ai"}

        def explode(url):
            raise AssertionError("the network was called for a cached hint")

        self.assertEqual(links.resolve(drafts, cache, follow_fn=explode), 1)
        self.assertEqual(drafts[0].item["url"], "https://chatcut.ai")

    def test_a_failed_lookup_is_not_cached(self):
        # A failure is a network condition, not a fact about the launch, so the
        # next run should try again rather than inherit it.
        drafts = drafts_from(ph=[ph_post()])
        cache = {}
        links.resolve(drafts, cache, follow_fn=lambda url: None)
        self.assertEqual(cache, {})

    def test_a_corrupt_cache_entry_is_dropped_rather_than_published(self):
        # Every value in the cache becomes a published `url`. A hand-edited or
        # half-written file must not crash dedup on its way to the contract
        # check, and must never put a non-URL on a card.
        import tempfile
        root = pathlib.Path(tempfile.mkdtemp())
        path = root / "links.json"
        path.write_text(json.dumps({"generated_at": "2026-08-31T08:00:00Z", "resolved": {
            "https://www.producthunt.com/r/GOOD": "https://chatcut.ai",
            "https://www.producthunt.com/r/INT": 123,
            "https://www.producthunt.com/r/SCHEME": "javascript:alert(1)",
            "https://www.producthunt.com/r/NULL": None,
        }}))
        self.assertEqual(edition_mod.read_links(path),
                         {"https://www.producthunt.com/r/GOOD": "https://chatcut.ai"})

    def test_a_cache_that_is_not_json_is_ignored_not_fatal(self):
        import tempfile
        path = pathlib.Path(tempfile.mkdtemp()) / "links.json"
        path.write_text("{not json")
        self.assertEqual(edition_mod.read_links(path), {})

    def test_an_unknown_source_is_filtered_rather_than_waved_through(self):
        # The drift test below is the real guard, but if a source ever slips
        # past it, the strict vocabulary must be what it falls back to.
        draft = drafts_from(gh=[gh_repo()])[0]
        draft.item["source"] = "reddit"
        draft.text = "a thread about sourdough starters"
        self.assertNotIn("reddit", relevance.PREDICATES)
        self.assertFalse(relevance.is_ai(draft))


class CurateRunTestCase(unittest.TestCase):
    """A day's snapshots and a content tree in temp roots: no network, no repo writes."""

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = pathlib.Path(self.tmp.name)
        self.data_root = root / "data"
        self.content_root = root / "content"
        (self.content_root / "editions").mkdir(parents=True)

        # The real vocabulary, so a renamed tag fails here too.
        shutil.copy(REPO_ROOT / "content" / "tags.json", self.content_root / "tags.json")
        self.tag_names = contract.tag_names(
            json.loads((self.content_root / "tags.json").read_text()))
        self.write(self.content_root / "index.json",
                   {"schema_version": 1, "generated_at": "2026-08-30T08:00:00Z",
                    "editions": []})
        self.write(self.content_root / "hidden.json", {"schema_version": 1, "hidden": []})
        self.write_snapshots()

    def write(self, path, document):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document, indent=2) + "\n")

    def write_snapshots(self, **kwargs):
        payload = snapshots(**(kwargs or dict(ph=[ph_post()], gh=[gh_repo()],
                                              tc=[tc_article()], hn=[hn_story()])))
        for name, path in edition_mod.snapshot_paths(self.data_root, DATE, "daily").items():
            self.write(path, payload[name])

    def run_cli(self, *argv, expect=0, resolve_links=False):
        out, err = io.StringIO(), io.StringIO()
        flags = [] if resolve_links else ["--no-resolve-links"]
        with redirect_stdout(out), redirect_stderr(err):
            code = cli.main(list(argv) + flags + [
                "--data-root", str(self.data_root),
                "--content-root", str(self.content_root),
            ])
        self.assertEqual(code, expect, msg=out.getvalue() + err.getvalue())
        return out.getvalue() + err.getvalue()

    def curation(self):
        return json.loads(edition_mod.day_path(
            self.data_root, DATE, "curation.json", "daily").read_text())

    def summaries_for(self, ids, **overrides):
        written = {i: {"summary": "One line about the thing it does.",
                       "tags": ["Agents"]} for i in ids}
        written.update(overrides)
        path = pathlib.Path(self.tmp.name) / "summaries.json"
        self.write(path, {"date": DATE, "items": written})
        return str(path)

    def edition(self):
        return json.loads((self.content_root / "editions" / f"{DATE}.json").read_text())


class CommandTests(CurateRunTestCase):
    """A whole run of draft and build."""

    # -- draft ------------------------------------------------------------

    def test_draft_writes_the_request_and_the_rejection_log(self):
        self.run_cli("draft", "--date", DATE)
        request = self.curation()
        self.assertEqual(len(request["items"]), 4)
        self.assertTrue(request["tags"])
        rejected = json.loads(edition_mod.day_path(
            self.data_root, DATE, "rejected.json", "daily").read_text())
        self.assertEqual(rejected["counts"], {"kept": 4, "rejected": 0})

    def test_a_rejected_item_is_logged_with_a_reason(self):
        self.write_snapshots(ph=[ph_post(name="PaymentKit", slug="paymentkit",
                                         tagline="Billing that survives a shutdown",
                                         description="Multi-processor billing.",
                                         topics={"nodes": []})])
        self.run_cli("draft", "--date", DATE)
        rejected = json.loads(edition_mod.day_path(
            self.data_root, DATE, "rejected.json", "daily").read_text())
        self.assertEqual(rejected["rejected"][0]["reason"], "not-ai")
        self.assertIn("detail", rejected["rejected"][0])

    def test_a_missing_snapshot_still_produces_an_edition_and_says_so(self):
        for path in edition_mod.snapshot_paths(self.data_root, DATE, "daily").values():
            if "producthunt" in str(path):
                path.unlink()
        output = self.run_cli("draft", "--date", DATE)
        self.assertIn("no snapshot for producthunt", output)
        self.assertEqual(len(self.curation()["items"]), 3)

    def test_no_snapshots_at_all_is_an_error_not_an_empty_edition(self):
        output = self.run_cli("draft", "--date", "2026-01-01", expect=1)
        self.assertIn("run the fetchers first", output)

    # -- build ------------------------------------------------------------

    def test_build_publishes_an_edition_that_validates(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))

        document = self.edition()
        self.assertEqual(document["counts"], {"launches": 1, "repos": 1, "news": 1, "hn": 1})
        self.assertEqual(len(document["items"]), 4)
        contract.validate_content_root(self.content_root)

    def test_build_does_not_need_draft_to_have_run(self):
        # `build` re-derives from the snapshots, so curation.json is an
        # artifact for the writer, never state the publish depends on.
        drafts, _ = relevance.apply(adapters.adapt_all(
            snapshots(ph=[ph_post()], gh=[gh_repo()], tc=[tc_article()], hn=[hn_story()]), DATE)[0])
        self.run_cli("build", "--date", DATE,
                     "--summaries", self.summaries_for([d.id for d in drafts]))
        self.assertEqual(len(self.edition()["items"]), 4)

    def test_a_launch_and_its_show_hn_dedup_through_the_cache(self):
        # Pins the order inside prepare(): links are resolved before dedup, or
        # the two never collide and the edition ships the same product twice.
        # Only the cache is applied here, so this needs no network.
        self.write_snapshots(
            ph=[ph_post()],
            hn=[hn_story(type="show_hn", title="Show HN: ChatCut, an AI video editor",
                         url="https://chatcut.ai")])
        self.write(edition_mod.day_path(self.data_root, DATE, "links.json", "daily"),
                   {"generated_at": "2026-08-31T08:00:00Z",
                    "resolved": {"https://www.producthunt.com/r/ABC123":
                                 "https://chatcut.ai"}})

        self.run_cli("draft", "--date", DATE)
        items = self.curation()["items"]
        self.assertEqual([i["source"] for i in items], ["producthunt"])
        self.assertEqual(items[0]["url"], "https://chatcut.ai")

        rejected = json.loads(edition_mod.day_path(
            self.data_root, DATE, "rejected.json", "daily").read_text())["rejected"]
        self.assertEqual(rejected[0]["reason"], "duplicate")

    def test_no_resolve_links_really_makes_no_request(self):
        # Every other CLI test relies on this flag to stay offline, so if it
        # ever stops working the suite would quietly start calling Product Hunt.
        real_follow = links.follow
        self.addCleanup(setattr, links, "follow", real_follow)

        def explode(url, **kwargs):
            raise AssertionError("--no-resolve-links still went to the network")

        links.follow = explode
        self.run_cli("draft", "--date", DATE)
        published = next(i for i in self.curation()["items"] if i["source"] == "producthunt")
        self.assertEqual(published["url"], "https://www.producthunt.com/products/chatcut")

    def test_draft_fills_the_link_cache_and_build_spends_no_network(self):
        # The whole point of the cache: build publishes the URL the writer saw
        # in curation.json, without asking the network again and maybe getting
        # a different answer.
        real_follow = links.follow
        self.addCleanup(setattr, links, "follow", real_follow)

        links.follow = lambda url, **kwargs: "https://chatcut.ai"
        self.run_cli("draft", "--date", DATE, resolve_links=True)

        cache_path = edition_mod.day_path(self.data_root, DATE, "links.json", "daily")
        self.assertTrue(cache_path.exists())
        self.assertIn("https://chatcut.ai",
                      json.loads(cache_path.read_text())["resolved"].values())

        def explode(url, **kwargs):
            raise AssertionError("build went to the network for a cached hint")

        links.follow = explode
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids),
                     resolve_links=True)
        published = next(i for i in self.edition()["items"] if i["source"] == "producthunt")
        self.assertEqual(published["url"], "https://chatcut.ai")

    def test_a_malformed_date_is_reported_not_raised(self):
        output = self.run_cli("draft", "--date", "31-08-2026", expect=1)
        self.assertIn("not a YYYY-MM-DD date", output)

    def test_an_entry_written_as_null_publishes_nothing(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        output = self.run_cli("build", "--date", DATE,
                              "--summaries", self.summaries_for(ids, **{ids[0]: None}),
                              expect=1)
        self.assertIn("must be an object", output)
        self.assertFalse((self.content_root / "editions" / f"{DATE}.json").exists())

    def test_the_index_is_updated_to_match(self):
        self.run_cli("draft", "--date", DATE)
        self.run_cli("build", "--date", DATE,
                     "--summaries", self.summaries_for([i["id"] for i in self.curation()["items"]]))
        index = json.loads((self.content_root / "index.json").read_text())
        entry = index["editions"][0]
        self.assertEqual(entry["date"], DATE)
        self.assertEqual(entry["total"], 4)
        self.assertEqual(entry["generated_at"], self.edition()["generated_at"])

    def test_a_bad_summaries_file_publishes_nothing(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        bad = self.summaries_for(ids, **{ids[0]: {"summary": "x" * 300, "tags": ["Nope"]}})
        output = self.run_cli("build", "--date", DATE, "--summaries", bad, expect=1)

        self.assertIn("over the 200 cap", output)
        self.assertIn("not a display name in tags.json", output)
        self.assertFalse((self.content_root / "editions" / f"{DATE}.json").exists())
        # The index is untouched, so a failed run leaves no trace at all.
        self.assertEqual(json.loads((self.content_root / "index.json").read_text())["editions"], [])

    def test_warnings_are_printed_but_do_not_stop_the_publish(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        loud = self.summaries_for(ids, **{ids[0]: {
            "summary": "A seamless, revolutionary editor.", "tags": ["Agents"]}})
        output = self.run_cli("build", "--date", DATE, "--summaries", loud)
        self.assertIn("asserts value", output)
        self.assertTrue((self.content_root / "editions" / f"{DATE}.json").exists())

    def test_re_running_a_date_carries_a_hide_forward(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))

        sys.path.insert(0, str(REPO_ROOT / "packages" / "feed-schema"))
        import hide as hide_mod
        hide_mod.hide(ids[0], content_root=self.content_root, reason="duplicate launch")

        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))
        document = self.edition()
        hidden = [i for i in document["items"] if i["hidden"]]
        self.assertEqual([i["id"] for i in hidden], [ids[0]])
        # counts is the visible tally, so the hidden one is not in it.
        self.assertEqual(sum(document["counts"].values()), 3)
        contract.validate_content_root(self.content_root)

    def test_the_printed_counts_are_what_was_published(self):
        # The tally printed after a build must be the edition's counts, not the
        # pre-hide one: an operator reading "hn 9" while the file says 8 has no
        # way to tell which is true.
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))

        import hide as hide_mod
        hidden_id = next(i for i in ids if i.startswith("hn-"))
        hide_mod.hide(hidden_id, content_root=self.content_root)

        output = self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))
        counts = self.edition()["counts"]
        self.assertEqual(counts["hn"], 0)
        self.assertIn("  ".join(f"{name} {counts[name]}" for name in counts), output)

    def test_a_hide_the_new_run_cannot_honour_stops_the_publish(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))

        self.write(self.content_root / "hidden.json", {"schema_version": 1, "hidden": [
            {"id": f"ph-vanished-{DATE}", "edition_date": DATE,
             "hidden_at": "2026-08-31T09:00:00Z"}]})
        output = self.run_cli("build", "--date", DATE,
                              "--summaries", self.summaries_for(ids), expect=1)
        self.assertIn("no longer produces", output)
        self.assertIn(f"ph-vanished-{DATE}", output)

    def test_build_writes_a_rank_on_every_item_as_its_last_key(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(ids))

        items = self.edition()["items"]
        self.assertEqual(sorted(i["rank"] for i in items), [1, 2, 3, 4])
        for item in items:
            self.assertEqual(list(item)[-1], "rank")
        # Leaders in TIE_ORDER: GitHub, Hacker News, TechCrunch, Product Hunt.
        by_rank = sorted(items, key=lambda i: i["rank"])
        self.assertEqual([i["source"] for i in by_rank],
                         ["github", "hackernews", "techcrunch", "producthunt"])
        # The file's own order stays grouped by category.
        self.assertEqual([i["category"] for i in items], ["launches", "repos", "news", "hn"])

    def test_a_hidden_item_keeps_its_rank_through_a_re_run(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        path = self.summaries_for(ids)
        self.run_cli("build", "--date", DATE, "--summaries", path)
        before = {i["id"]: i["rank"] for i in self.edition()["items"]}

        import hide as hide_mod
        hide_mod.hide(ids[0], content_root=self.content_root)
        self.run_cli("build", "--date", DATE, "--summaries", path)

        after = self.edition()["items"]
        self.assertEqual({i["id"]: i["rank"] for i in after}, before)
        self.assertTrue(next(i for i in after if i["id"] == ids[0])["hidden"])
        contract.validate_content_root(self.content_root)

    def test_the_same_inputs_produce_the_same_file(self):
        self.run_cli("draft", "--date", DATE)
        ids = [i["id"] for i in self.curation()["items"]]
        path = self.summaries_for(ids)

        self.run_cli("build", "--date", DATE, "--summaries", path)
        first = self.edition()
        self.run_cli("build", "--date", DATE, "--summaries", path)
        second = self.edition()

        # generated_at is the run, everything else is the inputs.
        first.pop("generated_at"), second.pop("generated_at")
        self.assertEqual(first, second)


class RankBackfillTests(CurateRunTestCase):
    """`rank` adds ranks to an edition published before they existed, and nothing else."""

    def setUp(self):
        super().setUp()
        self.run_cli("draft", "--date", DATE)
        self.ids = [i["id"] for i in self.curation()["items"]]
        self.run_cli("build", "--date", DATE, "--summaries", self.summaries_for(self.ids))
        self.ranks = {i["id"]: i["rank"] for i in self.edition()["items"]}
        self.strip_ranks()

    def edition_file(self):
        return self.content_root / "editions" / f"{DATE}.json"

    def strip_ranks(self):
        # What an edition built before edition-rank looks like, byte for byte.
        document = self.edition()
        for item in document["items"]:
            item.pop("rank", None)
        edition_mod.write_json(self.edition_file(), document)

    def snapshot(self):
        day = edition_mod.day_path(self.data_root, DATE, "x", "daily").parent
        files = [self.content_root / "index.json", self.content_root / "hidden.json",
                 day / "links.json", day / "rejected.json", day / "curation.json"]
        return {str(f): f.read_bytes() for f in files if f.exists()}

    def rank(self, *extra, expect=0):
        # No --no-resolve-links: rank is offline whatever it is given.
        return self.run_cli("rank", "--date", DATE, *extra, expect=expect,
                            resolve_links=True)

    def test_a_rank_less_edition_gains_the_ranks_build_would_have_written(self):
        before = self.edition_file().read_text()
        self.rank()
        items = self.edition()["items"]
        self.assertEqual({i["id"]: i["rank"] for i in items}, self.ranks)
        for item in items:
            self.assertEqual(list(item)[-1], "rank")
        # Take the ranks back out and the file is exactly what it was.
        self.strip_ranks()
        self.assertEqual(self.edition_file().read_text(), before)

    def test_the_diff_is_only_rank_lines(self):
        before = self.edition_file().read_text().splitlines()
        self.rank()
        after = self.edition_file().read_text().splitlines()
        added = [line for line in after if '"rank"' in line]
        self.assertEqual(len(added), len(self.ids))
        rest = [line for line in after if '"rank"' not in line]
        # The only other change is the comma `hidden` gains before `rank`.
        self.assertEqual([line.rstrip(",") for line in rest],
                         [line.rstrip(",") for line in before])

    def test_every_other_file_is_untouched(self):
        before = self.snapshot()
        generated_at = self.edition()["generated_at"]
        self.rank()
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.edition()["generated_at"], generated_at)

    def test_a_hidden_item_stays_hidden_and_is_still_ranked(self):
        import hide as hide_mod
        hide_mod.hide(self.ids[0], content_root=self.content_root)
        self.rank()
        hidden = next(i for i in self.edition()["items"] if i["id"] == self.ids[0])
        self.assertTrue(hidden["hidden"])
        self.assertEqual(hidden["rank"], self.ranks[self.ids[0]])
        contract.validate_content_root(self.content_root)

    def test_an_ascii_escaped_file_keeps_its_escaping(self):
        # hide.py writes with ensure_ascii, so a hidden item's edition may carry
        # \u escapes. Re-encoding them would put lines in the diff that are not rank.
        document = self.edition()
        document["items"][0]["summary"] = "An editor \u2014 with a timeline."
        self.edition_file().write_text(json.dumps(document, indent=2) + "\n")
        before = self.edition_file().read_text()
        self.rank()
        text = self.edition_file().read_text()
        self.assertIn("\\u2014", text)
        self.assertEqual(len(text.splitlines()), len(before.splitlines()) + len(self.ids))

    def test_snapshots_that_produce_other_items_write_nothing(self):
        self.write_snapshots(gh=[gh_repo()], tc=[tc_article()], hn=[hn_story()])
        before = self.edition_file().read_bytes()
        output = self.rank(expect=1)
        self.assertIn("nothing was written", output)
        self.assertIn(next(i for i in self.ids if i.startswith("ph-")), output)
        self.assertEqual(self.edition_file().read_bytes(), before)

    def test_a_link_cache_miss_never_reaches_the_network(self):
        real_follow = links.follow
        self.addCleanup(setattr, links, "follow", real_follow)

        def explode(url, **kwargs):
            raise AssertionError("rank went to the network")

        links.follow = explode
        self.rank()
        self.assertEqual(sorted(i["rank"] for i in self.edition()["items"]),
                         list(range(1, len(self.ids) + 1)))

    def test_a_second_run_changes_nothing(self):
        self.rank()
        before = self.edition_file().read_bytes()
        output = self.rank()
        self.assertIn("unchanged", output)
        self.assertEqual(self.edition_file().read_bytes(), before)

    def test_different_ranks_are_refused_without_force(self):
        document = self.edition()
        for n, item in enumerate(reversed(document["items"]), start=1):
            item["rank"] = n
        edition_mod.write_json(self.edition_file(), document)
        before = self.edition_file().read_bytes()

        output = self.rank(expect=1)
        self.assertIn("--force", output)
        self.assertEqual(self.edition_file().read_bytes(), before)

        self.rank("--force")
        self.assertEqual({i["id"]: i["rank"] for i in self.edition()["items"]}, self.ranks)

    def test_a_missing_edition_is_an_error(self):
        self.edition_file().unlink()
        output = self.rank(expect=1)
        self.assertIn("is missing", output)

    def test_the_result_validates(self):
        self.rank()
        contract.validate_content_root(self.content_root)


# --------------------------------------------------------------------------
# Drift: curate against the contract and the fetchers it sits between
# --------------------------------------------------------------------------

class DriftTests(unittest.TestCase):
    """Curate is the join between two contracts, so it is where they can drift."""

    def test_every_fetched_source_has_an_adapter(self):
        # Adding a source to packages/fetchers without one here would mean its
        # items silently never reach an edition.
        self.assertEqual(set(registry.names()), set(adapters.ADAPTERS))
        self.assertEqual(set(registry.names()), set(adapters.ORDER))

    def test_every_source_has_a_relevance_predicate(self):
        # A source with no entry would skip the editorial line entirely, and
        # nothing would be logged to rejected.json to say so.
        self.assertEqual(set(relevance.PREDICATES), set(registry.names()))

    def test_the_source_names_are_the_contracts_source_names(self):
        self.assertEqual(set(adapters.PREFIXES), set(contract.SOURCES))
        self.assertEqual(set(adapters.SOURCE_NAMES.values()), set(contract.SOURCES))

    def test_every_snapshot_envelopes_source_value_is_mapped(self):
        for module in registry.SOURCES.values():
            with self.subTest(source=module.NAME):
                self.assertEqual(adapters.SOURCE_NAMES[module.SOURCE], module.NAME)

    def test_category_order_is_the_contracts_category_list(self):
        self.assertEqual(relevance.CATEGORY_ORDER, contract.CATEGORIES)

    def test_every_category_an_adapter_can_write_is_in_the_contract(self):
        drafts = drafts_from(ph=[ph_post()], gh=[gh_repo()], tc=[tc_article()],
                             hn=[hn_story(), hn_story(type="show_hn")])
        for draft in drafts:
            with self.subTest(item=draft.id):
                self.assertIn(draft.item["category"], contract.CATEGORIES)
                self.assertIn(draft.item["image"]["type"], contract.IMAGE_TYPES)

    def test_every_signal_and_meta_key_an_adapter_writes_is_in_the_contract(self):
        drafts = drafts_from(ph=[ph_post()], gh=[gh_repo()], tc=[tc_article()], hn=[hn_story()])
        for draft in drafts:
            with self.subTest(item=draft.id):
                self.assertLessEqual(set(draft.item.get("signals", {})), set(contract.SIGNAL_KEYS))
                self.assertLessEqual(set(draft.item.get("meta", {})), set(contract.META_KEYS))

    def test_the_summary_and_tag_limits_come_from_the_contract(self):
        self.assertEqual(summaries_mod.SUMMARY_MAX, contract.SUMMARY_MAX)
        self.assertEqual(summaries_mod.MAX_TAGS, contract.MAX_TAGS)

    def test_the_apps_fallback_breaks_ties_as_curate_does(self):
        # apps/web/src/order.js recomputes rank for editions written before it
        # existed; if its TIE_ORDER drifts, Ranked reorders when AIB-79t
        # backfills those editions.
        source = (REPO_ROOT / "apps" / "web" / "src" / "order.js").read_text()
        found = re.search(r"export const TIE_ORDER = \[([^\]]*)\];", source)
        self.assertIsNotNone(found, "order.js no longer declares TIE_ORDER")
        self.assertEqual(tuple(re.findall(r'"([a-z]+)"', found.group(1))), rank.TIE_ORDER)

    def test_the_rejection_reasons_are_the_ones_actually_written(self):
        self.assertEqual(set(relevance.REASONS), {"unusable", "not-ai", "duplicate"})


if __name__ == "__main__":
    unittest.main()
