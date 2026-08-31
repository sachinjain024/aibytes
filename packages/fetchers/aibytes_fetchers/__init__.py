"""Shared fetch machinery for aiBytes_ data sources.

The four sources (ProductHunt, HackerNews, TechCrunch, GitHub trending) were
originally four standalone skill scripts that each hardcoded a 7-day window and
a weekly snapshot path. Everything except the actual API call and the item
shape was duplicated across them.

This package holds the common half so a source can be fetched at any cadence:
the newsletter still runs it weekly, the app feed runs the same code daily.
Stdlib-only, like the scripts it replaces.
"""

__all__ = ["envelope", "http", "layout", "keywords", "registry", "runner", "window"]
