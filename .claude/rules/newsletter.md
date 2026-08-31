---
paths:
  - "newsletter/**"
  - ".claude/skills/generate-*/**"
  - ".claude/skills/*-fetch-items/**"
  - ".claude/skills/fetch-weekly-items/**"
  - ".claude/skills/ph-download-api-specs/**"
---

# Newsletter pipeline

Everything the weekly aiBytes_ issue needs lives under `newsletter/`:

- `newsletter/issues/{yyyy}/week-NN-Issue-N/` — the published issue HTML, its
  Beehiiv export, `social/`, and `thumbnails/`.
- `newsletter/data/{yyyy}/{mm}/weeks/week-NN/` — the weekly source snapshots the
  issue is written from. Produced by the fetch skills; committed.
- `newsletter/sources/<provider>/<api>/` — downloaded/mirrored reference docs
  (the ProductHunt GraphQL mirror). Regenerate with the skill, never hand-edit.
- `newsletter/apis/aibytes/` — Requestly project mirroring the HTTP calls the
  fetch skills make. Keep collections in sync with the source modules.
- `newsletter/artifacts/` — dated taste decision records (`YYYY-MMM-DD-*.html`).

## Design system

The newsletter is **deliberately not** a consumer of `packages/design-system`.
Email HTML cannot load a stylesheet, and the Beehiiv paste flow needs styles
inline, so the palette is duplicated inside
`.claude/skills/generate-newsletter-content/assets/template.html` and
`.claude/skills/generate-followup-thumbnail/assets/thumbnail.html`. That
duplication is intentional. Do not "fix" it by pointing these templates at
`packages/design-system` — it would break the email rendering. If a brand colour
changes, update both places.

## Taste decisions

Anything that is a judgement call about how the issue reads or looks — an intro
hook, a section treatment, a thumbnail background — goes through an artifact of
numbered variations first, then lands in three places: the issue output, the
skill that generates it, and a dated decision record in `newsletter/artifacts/`.
