"""Weekly issue item ids (AIB-145y T34).

News, launches, repos and HN Deep use `{prefix}-{slugify(title)}-issue-{N}`.
T34 (gists draft --issue) and T36 (build_weekly_issues.py) share this so the
id cannot drift. An X post's id is the contract X gist slug plus `-issue-N`,
not this helper; see gist_contract.x_post_slug.
"""

import re

ID_PREFIX = {
    "producthunt": "ph",
    "github": "gh",
    "hackernews": "hn",
    "techcrunch": "tc",
}

TITLE_SLUG_MAX = 48
_NON_SLUG = re.compile(r"[^a-z0-9]+")


def slugify(text):
    """Lower-case hyphenated slug, at most TITLE_SLUG_MAX chars."""
    text = _NON_SLUG.sub("-", (text or "").lower()).strip("-")
    return text[:TITLE_SLUG_MAX].strip("-") or "item"


def weekly_item_id(source, title, issue_number):
    """`ph-chatcut-issue-16`. Clashes are uniquified separately."""
    return f"{ID_PREFIX[source]}-{slugify(title)}-issue-{issue_number}"


def unique_weekly_ids(items):
    """Two items with the same title slug get -2, -3 before the issue suffix.

    Mutates `items` in place and returns them.
    """
    seen = {}
    for item in items:
        base = item["id"]
        seen[base] = seen.get(base, 0) + 1
        if seen[base] > 1:
            stem, suffix = base.rsplit("-issue-", 1)
            item["id"] = f"{stem}-{seen[base]}-issue-{suffix}"
    return items
