# Decisions

One file per decision, named for its LongClaw ticket:
`AIB-134j-newsletter-on-substack.md`. Each says what was decided, why, what it
cost, and how to undo it.

| Folder | What goes there |
|---|---|
| `product/` | Product and business decisions: which platform the newsletter runs on, what the product does or stops doing |
| `architecture/` | Engineering decisions: how the code, data, hosting or pipeline is built, and what was removed |

Taste decisions about how the newsletter reads or looks (an intro hook, a
section layout, a thumbnail background) don't go here. They stay as dated
records in `newsletter/artifacts/`, as `.claude/rules/newsletter.md` describes.
