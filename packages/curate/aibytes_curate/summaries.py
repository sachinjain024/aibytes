"""The handover to Claude, and the checks on what comes back.

`curate_edition.py draft` writes a curation request: the kept items, what each
source said about them, and the tag vocabulary. Claude reads that, writes a
one-line summary and picks 1-4 tags per item, and `build` merges the result.

Nothing here calls an LLM. Claude is the caller - the daily job runs the skill,
which runs these two commands around its own writing - so this module's job is
the boundary: state the request precisely, and refuse an answer that would
publish something the contract rejects.

Severity is split on purpose. A contract violation is fatal: a missing item, a
summary over the cap, a tag that is not in tags.json. Matters of taste - a hype
word, an em dash where the house style is a hyphen - are warnings printed for
the writer, because a script should not be the judge of a sentence.
"""

import json
import pathlib
import re

from . import REPO_ROOT  # noqa: F401  (imported for its sys.path setup)

import validate as contract

MIN_TAGS = 1
MAX_TAGS = contract.MAX_TAGS
SUMMARY_MAX = contract.SUMMARY_MAX

# Surfaced, never fatal. The list is the newsletter's standing complaint about
# launch copy: words that assert value instead of saying what a thing does.
HYPE_WORDS = (
    "revolutionary", "game-changing", "game changing", "cutting-edge",
    "cutting edge", "seamless", "seamlessly", "effortless", "effortlessly",
    "supercharge", "supercharged", "unleash", "unlock the power",
    "next-generation", "next generation", "world-class", "best-in-class",
    "blazing fast", "magical", "10x", "state-of-the-art",
)
HYPE_RE = re.compile("|".join(re.escape(w) for w in HYPE_WORDS), re.IGNORECASE)

# The publisher writes single hyphens everywhere else; an em dash in a card
# summary reads as copy from somewhere else.
DASH_RE = re.compile(r"[–—]")


class SummaryError(ValueError):
    """The summaries do not fit the items, or the contract. Nothing written."""


def curation_request(drafts, tags_doc, date, generated_at):
    """What Claude is given: the items, the source's words, the vocabulary."""
    return {
        "date": date,
        "generated_at": generated_at,
        "instructions": (
            "Write one line per item in the aiBytes_ voice - dense, calm, "
            "honest, technical. Say what the thing does, not why it matters. "
            f"At most {SUMMARY_MAX} characters, one sentence, no em dashes. "
            f"Then pick {MIN_TAGS} to {MAX_TAGS} tags per item from `tags` "
            "below, by their exact display name. Answer with the summaries "
            "file described in the curate-edition skill."
        ),
        "tags": tags_doc.get("groups", []),
        "items": [
            {
                "id": draft.id,
                "title": draft.item["title"],
                "category": draft.item["category"],
                "source": draft.source,
                "url": draft.item["url"],
                "source_url": draft.item["source_url"],
                "source_text": draft.text,
                **({"signals": draft.item["signals"]} if "signals" in draft.item else {}),
                **({"meta": draft.item["meta"]} if "meta" in draft.item else {}),
                **({"published_at": draft.item["published_at"]}
                   if "published_at" in draft.item else {}),
            }
            for draft in drafts
        ],
    }


def load(source):
    """Read a summaries document from a path, and normalise its shape.

    Accepted, because a writer should not have to remember which one:

        {"items": {"<id>": {"summary": ..., "tags": [...]}}}
        {"items": [{"id": ..., "summary": ..., "tags": [...]}]}
        {"<id>": {"summary": ..., "tags": [...]}}
        [{"id": ..., "summary": ..., "tags": [...]}]
    """
    if isinstance(source, (str, pathlib.Path)):
        path = pathlib.Path(source)
        if not path.exists():
            raise SummaryError(f"{path} is missing")
        try:
            document = json.loads(path.read_text())
        except ValueError as exc:
            raise SummaryError(f"{path} is not valid JSON: {exc}") from exc
    else:
        document = source

    if isinstance(document, dict) and "items" in document:
        document = document["items"]

    if isinstance(document, list):
        entries = {}
        for i, entry in enumerate(document):
            if not isinstance(entry, dict) or not entry.get("id"):
                raise SummaryError(f"items[{i}] has no id")
            entries[entry["id"]] = entry
        return entries
    if isinstance(document, dict):
        return dict(document)
    raise SummaryError("summaries must be an object or an array")


def check(summaries, drafts, tag_names):
    """Returns (problems, warnings). Problems mean nothing gets written."""
    problems, warnings = [], []
    wanted = [draft.id for draft in drafts]

    for missing in [i for i in wanted if i not in summaries]:
        problems.append(f"{missing}: no summary written")
    for extra in sorted(set(summaries) - set(wanted)):
        problems.append(f"{extra}: not an item in this edition")

    for item_id in wanted:
        if item_id not in summaries:
            continue  # already reported as missing above
        entry = summaries[item_id]
        if not isinstance(entry, dict):
            problems.append(f"{item_id}: must be an object with summary and tags")
            continue

        summary = entry.get("summary")
        if not (isinstance(summary, str) and summary.strip()):
            problems.append(f"{item_id}: summary must be a non-empty string")
        else:
            summary = summary.strip()
            if len(summary) > SUMMARY_MAX:
                problems.append(
                    f"{item_id}: summary is {len(summary)} chars, over the "
                    f"{SUMMARY_MAX} cap")
            if "\n" in summary:
                problems.append(f"{item_id}: summary must be one line")
            if DASH_RE.search(summary):
                warnings.append(f"{item_id}: summary uses an em or en dash; "
                                f"the house style is a spaced hyphen")
            hype = HYPE_RE.search(summary)
            if hype:
                warnings.append(f"{item_id}: summary says {hype.group(0)!r}, "
                                f"which asserts value instead of describing")

        tags = entry.get("tags")
        if not isinstance(tags, list):
            problems.append(f"{item_id}: tags must be an array")
            continue
        if not MIN_TAGS <= len(tags) <= MAX_TAGS:
            problems.append(
                f"{item_id}: {len(tags)} tags, expected {MIN_TAGS} to {MAX_TAGS}")
        if len(set(map(str, tags))) != len(tags):
            problems.append(f"{item_id}: tags must be unique")
        for tag in tags:
            if not isinstance(tag, str) or tag not in tag_names:
                problems.append(
                    f"{item_id}: tag {tag!r} is not a display name in tags.json")

    return problems, warnings


def merge(drafts, summaries):
    """Drafts plus their copy -> contract items, in the contract's key order."""
    items = []
    for draft in drafts:
        entry = summaries[draft.id]
        item, rest = {}, dict(draft.item)
        # id, title, then summary, then everything else - matching the order
        # the schema documents and the snapshots on disk already use.
        item["id"] = rest.pop("id")
        item["title"] = rest.pop("title")
        item["summary"] = entry["summary"].strip()
        item["url"] = rest.pop("url")
        item["source"] = rest.pop("source")
        item["source_url"] = rest.pop("source_url")
        item["category"] = rest.pop("category")
        item["tags"] = list(entry["tags"])
        item["image"] = rest.pop("image")
        for key in ("signals", "meta", "published_at"):
            if key in rest:
                item[key] = rest.pop(key)
        item["hidden"] = rest.pop("hidden")
        item.update(rest)
        items.append(item)
    return items
