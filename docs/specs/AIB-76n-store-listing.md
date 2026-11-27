# Spec: AIB-76n, module 6 `store-listing`

Status: **draft, 22 Nov 2026, for review.** Module 6 of 6 in
`docs/specs/AIB-76n-capability-map.md`. Builds on every other module. Ticket
items 4 and 5. Name decided: "aiBytes – AI News Feed for Developers" (map
answer 7).

## Objective

Replace the existing "AI Bytes" listing (`faamldnehjdjdobapchedpmldfjjfife`,
version 26.1.15, 9 users, blank screenshots) with this extension, written to
rank in store search and to convert, then switch on everything on aibytes.io
that points at it.

Who: people searching the Chrome Web Store for AI news, and readers sent
there from aibytes.io and the launch posts (AIB-152d).

Success looks like:

- The update is live on the listing, with the new name, descriptions, icon,
  screenshots and promo tile, and approved privacy answers.
- The 9 existing users are updated without losing the extension.
- aibytes.io's footer links to the listing, the install box is on, and the
  onboarding page's "Add to Chrome" is live.

### Not in this module

The launch posts and demo video (AIB-152d, which reuses these screenshots).
Paid promotion. Monetization. Any code change to the extension beyond the
version.

## The package

- **Version:** `YY.M.D` of the submission day, e.g. `26.12.3`, set in
  `apps/extension/package.json`. A test checks it is above `26.1.15`.
- **Zip:** `npm run package:extension`. Before it, the permission set is frozen
  as `extension-auth` left it (`storage`, plus any host permission its gate
  required), and the production manifest test passes (no localhost, the `key`
  present).
- **Check before upload:** the zip installed in a clean Chrome profile has the
  ID `faamldnehjdjdobapchedpmldfjjfife`, opens onboarding once, and works
  signed out and signed in against production.

## The listing

Written into `apps/extension/CHROMEWEBSTORE.md` (the file ticket item 2.4 sets
up), so it is reviewed in a PR and copied into the dashboard.

| Field | Content |
|---|---|
| Name (75 max) | **aiBytes – AI News Feed for Developers** |
| Short description (132 max) | **"AI feed for developers: latest AI news, trending GitHub projects, Hacker News threads, Reddit discussions and Product Hunt launches."** (132 characters; approved 22 Nov 2026). The source names live here, not in the title (Chrome's keyword-spam policy). See "Risks" on Reddit |
| Description | Opens with one line on what it is; then what's in the edition (the four categories), how ranking works, the gist view, saving and syncing with aibytes.io, the newsletter; then privacy in one paragraph and a link to `/privacy`. No superlatives, no keyword lists, no unattributed reviews. Under 1,000 words |
| Category | **Lifestyle › News & Weather** (ticket item 4.1), moved from Education. For reference, daily.dev, the closest competitor, lists under Productivity › Developer Tools |
| Language | English |
| Icon | `packages/design-system/assets/extension/icon-128.png` |
| Screenshots | Five, 1280×800, below |
| Small promo tile | 440×280, from "The promo images" below |
| Marquee | 1400×560, from "The promo images" below (made for featuring, not only if asked) |
| Website | `https://aibytes.io` |
| Support | the publisher's support email from the dashboard (not committed) |

**Screenshots** (revised 26 Nov 2026 from the publisher's "Chrome Store
Screenshots" comment on AIB-76n): the headline and a line under it on the
left, the real popup or art on the right, in the image style guide's look
(`docs/image-guide/`: cream ground, navy and orange, confetti) and the layout
of `apps/extension/store/assets/references/r1/`:

1. The sources feeding the feed: "Your daily AI feed, from the best sources"
2. GitHub repos only: "Trending GitHub repos, every day"
3. A repo's gist: "Get the gist of any repo"
4. Hacker News, AI news and launches, each row ringed and labelled:
   "Threads, news and launches in one list"
5. Art only, the style guide's character at his computer with the three ways
   to follow aiBytes_: "Stay current with AI, three ways"

Made by `apps/extension/store/screenshots.mjs` (the
`proj-generate-chrome-store-screenshots` skill): it captures the real popup on
a fixed edition fixture with headless Chrome (no new dependency), then frames
the captures at 1280×800. Every run is a new version under
`apps/extension/store/assets/screenshots/vN/`, never deleting an earlier one; the pick is
v12, Claude's frame with the standard raised icon (the blue tile, white
outline and orange offset shadow), in `assets/screenshots/v12-cream/claude/`, so AIB-152d can
reuse it.

## The promo images

The small promo tile and the marquee are generated, then shortlisted by the
publisher. The screenshots are not: they are always the real build.

1. **Brief.** `apps/extension/store/promo-brief.md`: the two sizes, what each
   must show (the extension icon, "aiBytes", "AI News Feed for Developers"),
   Ledger's palette and faces as the reference, and the rules: no UI the
   extension does not have, no third-party logos or names, no claims, text
   large enough to read at the tile's size.
2. **Generate.** The same brief is run in Claude, Grok, OpenAI and Gemini, by
   the publisher in each tool (no API key or tool session is added to the
   repo). Each tool's prompt as used is kept in the brief.
3. **Collect.** The candidates go in `apps/extension/store/candidates/`
   (`<tool>-<tile|marquee>-<n>.png`), git-ignored, so the rejected ones are
   never committed. `store/promo.mjs` renders HTML candidates, builds the
   review page (`review`) and sizes the picks (`finish`).
4. **Shortlist.** A review artifact shows every candidate at its real size,
   numbered, grouped by tool, in light and dark surrounds, as the repo's
   numbered-options practice for taste decisions. The publisher picks one tile
   and one marquee.
5. **Finish.** The two picks are cropped or resized to exactly 440×280 and
   1400×560 PNG, with any lettering redrawn in Ledger's faces if a tool garbled
   it, and committed as a new version, `store/assets/promo-tile/vN/` and
   `store/assets/marquee/vN/`, so every set uploaded to the store is kept. The
   pick and the tool it came from go in `CHROMEWEBSTORE.md`.

**The pick (27 Nov 2026):** Claude's T2 (navy tile) and M4 (navy marquee).
Two changes from the brief above, both the publisher's: the look follows the
accepted screenshots (the image style guide's cream, navy and orange) rather
than Ledger's palette, and the marquee shows the four sources' marks (GitHub,
Hacker News, TechCrunch, Product Hunt) in small chips under "From". They name
what the feed reads, not an endorsement. Reddit is left out because it is not
one of the edition's sources (see "Risks").

## Privacy

**Dashboard answers:**

- **Single purpose:** "Shows the aiBytes_ daily edition of AI news and lets the
  reader save items, synced with their aibytes.io account."
- **Permission justifications:** `storage` ("Keeps the reader's saved items
  and the last edition on this device"); any host permission `extension-auth`
  added, with its reason; `externally_connectable` ("Lets aibytes.io, and only
  aibytes.io, sign the extension in after the reader signs in there").
- **Remote code:** none.
- **Data collected:** personally identifiable information (the name and email
  of the Google account the reader signs in with, on aibytes.io) and
  authentication information (the Firebase session), only when the reader
  signs in; the item ids they save. Used only for the extension's own function;
  not sold, not used for anything unrelated, not used for credit decisions.
  The three certifications ticked.
- **Privacy policy URL:** `https://aibytes.io/privacy`.

**`/privacy` gains an "The Chrome extension" section** (in `App.jsx`'s
`PrivacyApp`, as its other sections): what the extension keeps on the device
(saved item ids while signed out, the last edition, the sign-in session); that
signed in, saves go to the same account store as the site; that it reads
nothing from the pages the reader visits and sends no analytics events (the
wording avoids `runs no analytics`, which `analytics.test.js` forbids in
`App.jsx`); and how to
remove it all (remove the extension; delete saves from Saved). The facts are
checked against the built extension before the page changes.

## Submitting

1. The publisher uploads the zip in the developer dashboard, fills the listing
   from `CHROMEWEBSTORE.md`, and submits. Review can take days; a rejection's
   reason goes into `CHROMEWEBSTORE.md` with the change made, and the zip is
   resubmitted with a higher version.
2. **On approval**, one small PR branched from `main` (PR #73 has merged by
   then, its site code behind the flag):
   - `EXTENSION_LIVE = true` (the install box and the onboarding page's "Add to
     Chrome");
   - `footer.js`: "Chrome Extension (soon)" becomes "Chrome Extension" with
     the listing's URL (`footer.test.js` updated);
   - the ticket's items 4 and 5 ticked.
3. **Existing users:** Chrome updates them within hours. `storage` shows no
   warning, so they keep the extension with nothing opened (map answer 4). If
   `extension-auth` added a host permission that warns, Chrome disables the
   extension until each accepts it (map answer 11); the description's first
   line after the summary says what changed.

## Commands

```bash
npm run package:extension                     # → apps/extension/aibytes-extension-<version>.zip
npm test -w @aibytes/extension                # includes the version and manifest checks
node apps/extension/store/screenshots.mjs raw     # → apps/extension/store/assets/screenshots/vN/raw/
node apps/extension/store/screenshots.mjs frame   # → apps/extension/store/assets/screenshots/vN/claude/*.png
npm test -w @aibytes/web                      # footer and flag, after approval
npm run build:web
```

## Project structure

```
apps/extension/
  CHROMEWEBSTORE.md          the listing, justifications, privacy answers, review history
  store/screenshots.mjs      the capture and frame script
  store/frame.html           Claude's frame; screenshot-brief.md, the prompt for other tools
  store/assets/screenshots/vN/           each screenshot version: raw/ captures, claude/ screenshots, and a
                             chatgpt/, grok/ or gemini/ folder only once that tool is run
  store/promo-brief.md       the brief and each tool's prompt
  store/promo.mjs            render HTML candidates, the review page, finish the picks
  store/candidates/          generated candidates (git-ignored)
  store/assets/promo-tile/vN/, store/assets/marquee/vN/   the publisher's picks, one
                             version per upload, each with its HTML source
apps/web/src/
  footer.js, extension.js    the link and the flag, after approval
  App.jsx                    /privacy's extension section
```

## Testing strategy

- **`node --test`:** the version is a valid Chrome version above `26.1.15`;
  the production manifest test from `extension-auth`; `footer.test.js` for the
  link; the flag's default.
- **By hand:** the zip in a clean profile (ID, onboarding, signed out, signed
  in); the screenshots at exactly 1280×800, the tile at 440×280 and the marquee at
  1400×560; the
  listing preview in the dashboard; after approval, install from the store on
  a clean profile, and the site's footer, box and onboarding button live.

## Boundaries

- *Always:* every claim in the listing true of the shipped build; the privacy
  answers match `/privacy` and the code; screenshots from the real build.
- *Ask first:* the category; any change to the name; anything submitted
  (the publisher submits).
- *Never:* superlatives, keyword lists or third-party names in the name; a
  support email or any credential in the repo; a permission added after the
  set is frozen.

## Success criteria

1. The listing shows the new name, short description, description, icon, five
   screenshots, promo tile and marquee, and the update is published.
2. A clean install from the store has the ID
   `faamldnehjdjdobapchedpmldfjjfife` and opens onboarding once.
3. An existing 26.1.15 install updates without opening anything (and, with no
   warning-bearing permission, without being disabled).
4. aibytes.io's footer links to the listing; the install box shows to desktop
   Chromium readers without the extension; the onboarding button is live.
5. `/privacy` describes the extension, and the dashboard's privacy answers
   agree with it.

## Risks

- **Reddit in the short description.** Reddit is not one of the edition's
  sources today: all 1,273 published items come from Hacker News, GitHub,
  TechCrunch and Product Hunt, and Reddit appears only inside a few summaries.
  The publisher chose to keep it for store search (22 Nov 2026). If review
  rejects the listing as misleading, the fallback is the same line without
  Reddit: "AI feed for developers: the latest AI news, trending GitHub
  projects, Hacker News threads and Product Hunt launches, ranked daily." (130
  characters). Adding Reddit as a source would remove the risk; that is its own
  ticket, not this module.

## Open questions

None. Decided 22 Nov 2026: the category is News & Weather (ticket item 4.1);
the short description above, with Reddit; the marquee is made, with the promo
tile, by the method in "The promo images"; `onb.signedout` is approved.
