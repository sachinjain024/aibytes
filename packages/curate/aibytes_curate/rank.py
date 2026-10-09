"""Each item's place in the day's one reading order, across every source.

Mechanical on purpose, like the rest of curate: the fetchers have already ranked
each source by its own signal, so this only decides how the four lists
interleave. An item's standing is how far down its own source it sits; the best
item of every source stands at 0, so a source with few items is not buried.

The group is the source, not the category: a Show HN (category launches) is
ranked against the HN threads by points. TechCrunch carries no signals, which
is why this reads the fetcher's position (`draft.rank`) rather than signals.

Ranks cover every item, hidden ones included, so hide.py never renumbers.
"""

# Who wins a tie at equal standing. Not adapters.ORDER: that one is the file's
# reading order, and changing it would reorder every published edition.
TIE_ORDER = ("github", "hackernews", "techcrunch", "producthunt")


def assign(drafts):
    """{item id: rank}, 1-based, over every draft - hidden ones included."""
    by_source = {}
    for draft in drafts:
        by_source.setdefault(draft.source, []).append(draft)
    standing = {}
    for group in by_source.values():
        group.sort(key=lambda d: (d.rank, d.id))
        for position, draft in enumerate(group):
            standing[draft.id] = position / len(group)
    order = sorted(drafts, key=lambda d: (
        standing[d.id], TIE_ORDER.index(d.source), d.id))
    return {d.id: n for n, d in enumerate(order, start=1)}
