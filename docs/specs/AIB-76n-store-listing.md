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
| Short description (132 max) | Draft: "Today's top AI news, launches and trending GitHub repos, ranked from Hacker News, Product Hunt and TechCrunch. Save to read later." The source names live here, not in the title (Chrome's keyword-spam policy) |
| Description | Opens with one line on what it is; then what's in the edition (the four categories), how ranking works, the gist view, saving and syncing with aibytes.io, the newsletter; then privacy in one paragraph and a link to `/privacy`. No superlatives, no keyword lists, no unattributed reviews. Under 1,000 words |
| Category | **Lifestyle › News & Weather** (ticket item 4.1), moved from Education. For reference, daily.dev, the closest competitor, lists under Productivity › Developer Tools |
| Language | English |
| Icon | `packages/design-system/assets/extension/icon-128.png` |
| Screenshots | Five, 1280×800, below |
| Small promo tile | 440×280: the icon, "aiBytes", "AI News Feed for Developers", on Ledger's surface colour |
| Marquee (optional) | 1400×560, only if the store asks |
| Website | `https://aibytes.io` |
| Support | the publisher's support email from the dashboard (not committed) |

**Screenshots,** each the real popup over a plain page, with a short caption
band at the top in Ledger's display face:

1. Today's edition, ranked: "Today's AI news, ranked, one click away"
2. A gist in the popup: "Read the gist without leaving your tab"
3. Saved: "Save items; they sync with aibytes.io"
4. Dark mode: "Follows your system theme"
5. Onboarding step 1: "Pin it in two steps"

Made by `apps/extension/store/screenshots.mjs`: a page that renders the real
popup components against a fixed edition fixture, captured by headless Chrome
at 1280×800 (the method the prototype used; no new dependency). The PNGs are
committed under `apps/extension/store/`, so AIB-152d can reuse them.

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
nothing from the pages the reader visits and runs no analytics; and how to
remove it all (remove the extension; delete saves from Saved). The facts are
checked against the built extension before the page changes.

## Submitting

1. The publisher uploads the zip in the developer dashboard, fills the listing
   from `CHROMEWEBSTORE.md`, and submits. Review can take days; a rejection's
   reason goes into `CHROMEWEBSTORE.md` with the change made, and the zip is
   resubmitted with a higher version.
2. **On approval**, one small PR on the same branch:
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
node apps/extension/store/screenshots.mjs     # → apps/extension/store/*.png
npm test -w @aibytes/web                      # footer and flag, after approval
npm run build:web
```

## Project structure

```
apps/extension/
  CHROMEWEBSTORE.md          the listing, justifications, privacy answers, review history
  store/screenshots.mjs      the capture script
  store/*.png                5 screenshots, the promo tile (and marquee if asked)
apps/web/src/
  footer.js, extension.js    the link and the flag, after approval
  App.jsx                    /privacy's extension section
```

## Testing strategy

- **`node --test`:** the version is a valid Chrome version above `26.1.15`;
  the production manifest test from `extension-auth`; `footer.test.js` for the
  link; the flag's default.
- **By hand:** the zip in a clean profile (ID, onboarding, signed out, signed
  in); the screenshots at exactly 1280×800 and the tile at 440×280; the
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
   screenshots and promo tile, and the update is published.
2. A clean install from the store has the ID
   `faamldnehjdjdobapchedpmldfjjfife` and opens onboarding once.
3. An existing 26.1.15 install updates without opening anything (and, with no
   warning-bearing permission, without being disabled).
4. aibytes.io's footer links to the listing; the install box shows to desktop
   Chrome readers without the extension; the onboarding button is live.
5. `/privacy` describes the extension, and the dashboard's privacy answers
   agree with it.

## Open questions

1. **The short description** above is a draft, shown to the publisher on 22
   Nov 2026 with one alternative. Approve or edit.
2. **A marquee tile:** make one only if the store asks (assumed), or make it
   for featuring?

Decided 22 Nov 2026: the category is News & Weather (ticket item 4.1).
