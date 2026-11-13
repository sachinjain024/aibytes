"""The verbatim-run check (spec G5).

Gists are public, indexed pages built from other people's writing, so the
build compares Claude's text with the material it was written from. Words are
compared case-insensitively with punctuation dropped, so a copied sentence
cannot pass by changing a comma.
"""

import re

FATAL_RUN = 20
WARN_RUN = 12

_WORD = re.compile(r"[a-z0-9]+(?:['’][a-z]+)?")


def words(text):
    return _WORD.findall((text or "").lower())


def strings(value):
    """Every string inside a JSON-ish value, depth first."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)


def longest_run(text, source_words, shortest=WARN_RUN):
    """The longest run of at least `shortest` words that `text` shares with
    `source_words`, as a string, or "" if there is none."""
    mine = words(text)
    if len(mine) < shortest or len(source_words) < shortest:
        return ""
    grams = {tuple(source_words[i:i + shortest]) for i in range(len(source_words) - shortest + 1)}
    joined = " " + " ".join(source_words) + " "
    best = []
    i = 0
    while i <= len(mine) - shortest:
        if tuple(mine[i:i + shortest]) not in grams:
            i += 1
            continue
        end = i + shortest
        while end < len(mine) and (" " + " ".join(mine[i:end + 1]) + " ") in joined:
            end += 1
        if end - i > len(best):
            best = mine[i:end]
        i = end
    return " ".join(best)


def source_words(material):
    """One word list per material string, so a run cannot span two sources."""
    return [words(text) for text in strings(material)]


def copied(text, material):
    """The longest copied run from any one material string ("" if under WARN_RUN)."""
    best = ""
    for source in source_words(material):
        run = longest_run(text, source)
        if len(run.split()) > len(best.split()):
            best = run
    return best
