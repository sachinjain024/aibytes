"""Source lookup by name or alias."""

from .sources import github, hackernews, producthunt, techcrunch

SOURCES = {m.NAME: m for m in (producthunt, hackernews, techcrunch, github)}

# Every name the CLI and the skill scripts accept for a source.
ALIASES = {
    "ph": "producthunt", "product-hunt": "producthunt",
    "hn": "hackernews", "hacker-news": "hackernews",
    "tc": "techcrunch", "tech-crunch": "techcrunch",
    "gh": "github", "github-trending": "github",
}


def resolve(name):
    key = ALIASES.get(name, name)
    if key not in SOURCES:
        known = sorted(set(SOURCES) | set(ALIASES))
        raise KeyError(f"unknown source {name!r} (known: {', '.join(known)})")
    return SOURCES[key]


def names():
    return list(SOURCES)
