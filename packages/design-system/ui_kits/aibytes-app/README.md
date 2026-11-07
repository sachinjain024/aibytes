# aiBytes_ app UI kit

The app's screens, rendered the way `apps/web` renders them: the same Ledger components (AppHeader, Sidebar, Toolbar, FilterPanel, ActiveFilters, EditionBar, CardGrid / RowList, Card, ListRow, SectionHeading, EmptyState, EndCard) inside the same page classes, so `../../styles.css` lays them out exactly as in the app. Only the data differs.

- `index.html` — **01 · latest edition, grid, light (the hero).** Fully interactive: categories, search, the filter panel, grid↔list, ranked↔grouped, light↔dark, the calendar. Its tweaks switch theme, layout and order.
- `02-grid-dark.html` … `11-grouped-list.html` — each is the same app seeded into one state (and still interactive): 05 filter panel open with filters applied, 06 a search with no match, 07 an empty category, 08 the calendar, 04 and 09 the phone layout and its menu.
- `12-saves-signed-out.html`, `13-signed-in-menu.html`, `14-mobile-banner.html` — saves and sign-in (AIB-75v): 12 three saves signed out, with the stars under the source icons, the Saved count in the rail and the sticky save banner; 13 signed in, dark list, the account menu open; 14 the phone layout with the wrapped banner and the open drawer below it. They replace the old `06-saved` and `09-headers-auth` screens.
- **Saves are live on every screen.** The ☆ under each source icon saves in page state; the first save signed out shows the sticky banner (dismissible), and `Sign in` (header or banner) signs in the sample reader, Ada Lovelace, whose avatar shows the initial. Saved in the rail or the account menu opens a preview of the Saved view: newest edition first, each edition's saves in rank order. `index.html` has an Account tweak (Signed out / Signed in).
- **Ranked is the default feed**: one curation-ordered list (`rank` field in the edition JSON), no sections — the source mark on each card carries provenance. The `Ranked | Grouped` control in the toolbar switches modes; `10-grouped-grid.html` / `11-grouped-list.html` show the grouped variant (screens 05 + 07 are also seeded grouped for their section/empty-state semantics).
- Every card/row ends with a ⋮ context menu (`CardMenu`); its one item so far is "Open in" with ChatGPT / Claude / Gemini icon buttons (prefilled prompt where supported). List rows are two lines: title over a one-line summary.
- `App.jsx` — the app shell (loaded as text/babel; reads components from the Ledger bundle namespace).
- `data.js` — four sample editions (Aug 22, 25, 26, 27 2026 — Aug 23–24 intentionally missing to show the calendar's honesty). Real-feeling content: ChatCut, OfficeCLI, the Apple × OpenAI story, the Claude Code 33k-tokens thread.
- `app.css` — empty on purpose: the page layout is the app's, from `styles.css`.

Notes: item counts shown in the toolbar are computed from the data (numbers must encode something true). "Top today" = the `top` flag, one per edition. URL reflection (`/?c=repos&t=agents,open-source`) is noted on screen 05 but not simulated.
