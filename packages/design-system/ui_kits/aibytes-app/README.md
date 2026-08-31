# aiBytes_ app UI kit

The nine screens from the design brief (§6), all composed from the Ledger component bundle — no re-implemented primitives.

- `index.html` — **01 · latest edition, grid, light (the hero).** Fully interactive: category/tag/source filters, grid↔list, light↔dark, save + banner + fake Google sign-in, edition paging, calendar popover.
- `02-grid-dark.html` … `09-headers-auth.html` — the remaining brief screens; each is the same app seeded into that state (and still interactive).
- **Ranked is the default feed**: one curation-ordered list (`rank` field in the edition JSON), no sections — the source mark on each card carries provenance. A `Ranked | Grouped` segmented control in the header switches modes; `10-grouped-grid.html` / `11-grouped-list.html` show the grouped variant (screens 05 + 07 are also seeded grouped for their section/empty-state semantics).
- Every card/row ends with a ⋮ context menu (`CardMenu`); its one item so far is "Open in" with ChatGPT / Claude / Gemini icon buttons (prefilled prompt where supported). List rows are two lines: title over a one-line summary.
- `App.jsx` — the app shell (loaded as text/babel; reads components from the Ledger bundle namespace).
- `data.js` — four sample editions (Aug 22, 25, 26, 27 2026 — Aug 23–24 intentionally missing to show the calendar's honesty). Real-feeling content: ChatCut, OfficeCLI, the Apple × OpenAI story, the Claude Code 33k-tokens thread.
- `app.css` — screen-level layout only (feed grid, filter popovers, phone frame). Everything else is tokens + component classes.

Notes: item counts shown in the edition bar are computed from the data (numbers must encode something true). "Top today" = the `top` flag, one per edition. URL reflection (`/?c=repos&t=agents,open-source`) is noted on screen 05 but not simulated.
