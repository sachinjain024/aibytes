# Capability map: AIB-77u, home screen to prototype parity

Status: **proposed; the four questions are answered, the module split awaits approval.** No module spec is written until this map
is approved (spec-driven development, Phase 0).

Source of the work: `.longclaw/tickets/AIB-77u/ticket.md`, which audits
`docs/ux/prototypes/aiBytes_app_home.html` against `apps/web` and records three
decisions (2026-10-09): adopt the side nav; hide it below 900px for now, with
phone-width navigation in AIB-78z; and write a rank at curation, with no
TOP-today marker for now.

## Why a map rather than one spec

The ticket's open items split into three groups. Each has its own consumers,
its own tests, and could ship without the other two:

- **A data-contract change** (Python, `content/`, read by a Chrome extension
  that cannot be hotfixed)
- **A page-layout change** (the rail replaces the header chips and the edition
  bar)
- **A feed-ordering feature** (Ranked and Grouped modes)

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `edition-rank` | An optional, additive `rank` on each edition item: `edition.schema.json`, `validate.py`, and `feed.d.ts` in one pass; `packages/curate` writes it at `build`; tests in `test_feed_schema.py` and `test_curate_edition.py` (backfill: AIB-79t) | — |
| `app-side-nav` | `apps/web` renders Ledger's `SideNav` at 900px and wider: the date block (Today / ← Yesterday / Latest → / Pick a date), categories with counts including All, and the full-bleed layout with the prototype's grid (`minmax(360px,1fr)`, 20px/28px padding). Below 900px the rail is hidden (fallback: AIB-78z) | — |
| `app-feed-order` | The header's Ranked / Grouped control. Ranked is one flat grid sorted by `rank`, falling back to signals for editions without it. Grouped is one section per category with a `SectionHeading` and count, in edition order (product spec §6). Both work in grid and list views | `edition-rank` (Ranked's order) |

Out of scope, per the ticket: the TOP-today marker; saves, the star, My Starred,
and sign-in (AIB-75v); phone-width navigation (AIB-78z).

## Build order

```
edition-rank ──► app-feed-order
app-side-nav            (independent; can land in parallel)
```

1. `edition-rank` first. It is the one change to a published contract, so it
   should land and validate before anything reads it.
2. `app-side-nav`, in parallel or next. It touches only `apps/web`.
3. `app-feed-order` last, once editions carry `rank`.

Three PRs, one per module, all on or off branch `aib-77u-home-side-nav`.
Specs will be saved beside this file as `docs/specs/AIB-77u-<module-id>.md`.

## Conflicts with the written product spec

The side-nav decision contradicts `docs/aibytes-app-product-spec.md` §6, which
says the header carries the category chips and the edition bar is "directly
under the header, always visible". The design-system rule says the design brief,
then the product spec, wins on conflicts, so §6 needs a dated amendment
recording the side-nav decision. That is part of `app-side-nav`.

## Decisions (answered 2026-10-09)

1. **Below 900px until AIB-78z:** keep today's header category chips and
   edition bar. The rail and the chips/bar swap at the same 900px breakpoint, so
   every width has exactly one category control and one date pager.
   *Module: `app-side-nav`.*
2. **Who decides `rank`:** a deterministic score computed in `packages/curate`
   from signals (each item's standing within its own source, interleaved
   across sources). No LLM call and no change to the curate-edition skill's
   prompt. *Module: `edition-rank`.*
3. **Default feed order:** Ranked, remembered in local storage the way grid/list
   is (`prefs.js`). Product spec §6 is amended to match.
   *Module: `app-feed-order`.*
4. **Backfill:** both published editions get `rank`, but as its own ticket,
   **AIB-79t** (decided 2026-10-09, along with choosing the route there).
   `edition-rank` changes no published file. The app keeps the signal fallback
   anyway, because the extension may meet older files.
5. **Tie order:** at equal standing, GitHub, Hacker News, TechCrunch, Product
   Hunt. This is a rank-only constant; the file's reading order is unchanged.
