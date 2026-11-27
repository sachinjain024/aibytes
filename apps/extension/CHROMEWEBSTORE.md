# Chrome Web Store listing — aiBytes_

> Last updated: 2026-11-27
>
> Lives with the extension. Stay out of the store zip. The listing copy below
> is from `docs/specs/AIB-76n-store-listing.md` (T23); the publisher pastes it
> into the developer dashboard.

The update replaces the existing listing
`faamldnehjdjdobapchedpmldfjjfife` (version 26.1.15). The manifest `key` is
the public key that pins an unpacked build to that ID. The private `.pem`
never enters this repo.

## The listing

| Field | Value |
|---|---|
| Name | aiBytes – AI News Feed for Developers |
| Short description | AI feed for developers: latest AI news, trending GitHub projects, Hacker News threads, Reddit discussions and Product Hunt launches. |
| Category | Productivity › Developer Tools |
| Language | English |
| Website | https://aibytes.io |
| Support | the publisher's support email, set in the dashboard (never committed) |

The category moved from News & Weather to Developer Tools on 27 Nov 2026, by
the publisher's choice: the readers are developers, as the name says, and
daily.dev, the nearest neighbour, lists there. It is a dashboard setting, so
it can change again without a new version.

The short description keeps Reddit by the publisher's choice (22 Nov 2026);
if review calls it misleading, use the fallback in the spec's "Risks".

### Description

Paste the text between the markers as it is. The store shows plain text, so
the section headings are capitals and the lists use "•".

<!-- description:start -->
```text
aiBytes_ puts today's AI news for developers in your toolbar: one ranked list of the stories, repos, threads and launches worth your time.

WHAT'S IN IT
Every day aiBytes_ publishes an edition from four sources:
• AI news from TechCrunch
• Trending AI repositories on GitHub, with the stars they gained
• Hacker News threads about AI
• AI launches on Product Hunt
Each item has its title, a one-line summary written for developers, and where it came from, with its stars, points or comments.

HOW IT'S RANKED
Each item is ranked by how it stands in its own source: stars gained on GitHub, points on Hacker News, votes on Product Hunt. The four are then put into one list, strongest first, whatever the source.

GISTS
Many items have a gist: a short page on what it is, the numbers behind it, and why it matters. Click the item and the gist opens in the popup; go to the source when you want more.

SAVING
Star an item to keep it in Saved. Without an account, your stars stay in this browser. Sign in with Google on aibytes.io and the extension signs in too: your stars sync with your aibytes.io account, and the ones you made before signing in are added to it.

ALSO FROM aiBytes_
• aibytes.io: the same daily edition on the web, with earlier editions.
• The aiBytes_ newsletter: the week in AI for developers, every Monday.

PRIVACY
The extension asks for one permission, storage, to keep your stars on this device while you are signed out. It reads nothing from the pages you visit and sends no analytics events. When you sign in, your stars are stored in your aibytes.io account. Details: https://aibytes.io/privacy
```
<!-- description:end -->

## Permissions

Every permission in the production manifest, with a specific reason. A
permission with an install warning disables the extension for the existing
users; none of these show one. The set was frozen at T8 on 25 Nov 2026 as
`storage` alone: the sign-in gate passed with no host permission
(extension-auth, "The gate's result"). Do
not add another without the publisher's yes.

| Permission | Type | Warning | Why |
|---|---|---|---|
| `storage` | permissions | none | Stars the reader sets while signed out are kept in `chrome.storage.local` so they survive closing the popup and restarting Chrome, and so the background can merge them into the aibytes.io account on the first sign-in. |

No `host_permissions`. Today's edition is fetched from
`https://aibytes.io/content/*`, which is public CORS. Opening a tab
(`chrome.tabs.create` for Sign in, a gist source, or onboarding) needs no
`tabs` permission. `externally_connectable` (T14) is a manifest key, not a
permission.

## The zip

`npm run package:extension` makes a production build in a temp folder, checks
it, and writes `apps/extension/builds/aibytes-extension-<version>.zip` (git-ignored).
It never touches `dist/`, which a dev profile loads unpacked. The check stops
the package for a source map, a file that names `localhost`, or any file that
is not the manifest, `popup.html`, `background.js`, an icon, or a built
script, stylesheet or font. Check it with `unzip -l`.

## Images

| Asset | File | Size | Source |
|---|---|---|---|
| Store icon | `store/assets/store-icon/v1/store-icon.png` | 128×128 | The standard raised icon (blue bolt tile, white outline, orange offset shadow) in the centre 96×96 with a transparent margin; `promo.mjs icon` from `store/store-icon.html`, 27 Nov 2026. The manifest's toolbar icons stay the flat tile, which reads at 16px |
| Screenshots (5) | `store/assets/screenshots/v12-cream/claude/screenshot-*.png` | 1280×800 | The real popup on a fixed edition, in Claude's frame with the standard raised icon; picked 27 Nov 2026 (T21) |
| Small promo tile | `store/assets/promo-tile/v1/promo-tile.png` | 440×280 | Claude's T2, picked 27 Nov 2026 (T22) |
| Marquee | `store/assets/marquee/v1/marquee.png` | 1400×560 | Claude's M4, picked 27 Nov 2026 (T22); shows the four sources' marks, which name what the feed reads |

All are opaque PNGs except the store icon, whose margin is transparent. Each image keeps every version uploaded to the store:
a new one is a new `vN` folder, and an earlier one is never replaced. `store/promo-brief.md` and `store/screenshot-brief.md`
record how each was made.

## Privacy and data use

These are the dashboard's Privacy tab, checked on 27 Nov 2026 (T23) against
the build and `/privacy`'s "The Chrome extension" section.

**Single purpose:** Shows the aiBytes_ daily edition of AI news and lets the
reader save items, synced with their aibytes.io account.

**Permission justification, `storage`:** Keeps the stars a reader sets while
signed out on this device, so they survive closing the popup and restarting
Chrome, and so they can be added to the reader's aibytes.io account when they
sign in.

**Remote code:** No. Every script is in the package; the extension fetches
only the public edition JSON from aibytes.io and talks to Firebase through its
bundled SDK.

**Does the extension collect user data?** Yes, only when the reader signs in,
plus the ids of the items they star.

| Data type | Collected? | Where it goes | Purpose | Shared? |
|---|---|---|---|---|
| Personally identifiable info | Yes, when signed in: the name, email address and profile photo of the Google account, which the popup shows in its header | Kept by Firebase Authentication in the extension's storage on this device; the account itself is on aibytes.io's Firebase | Show who is signed in | No. Firebase (Google) only, as the account service |
| Health info | No | | | |
| Financial and payment info | No | | | |
| Authentication info | Yes, when signed in: the Firebase session | The extension's storage on this device | Keep the reader signed in | No. Firebase (Google) only |
| Personal communications | No | | | |
| Location | No | | | |
| Web history | No | | | |
| User activity | The ids of the items the reader stars | Signed out: `chrome.storage.local` on this device. Signed in: the reader's account in Cloud Firestore, readable only by them | The star on each row, and the Saved list | No. Firebase (Google) only, as the account store |
| Website content | No. The extension reads nothing from the pages the reader visits | | | |

On the device and nowhere else, the popup also keeps the last edition it
showed (to open instantly), the light or dark theme, and whether the save
banner was dismissed. The extension sends no analytics events.

### Certification

- Data is not sold to third parties
- Data is not used for purposes unrelated to the extension's core function
  (today's ranked AI edition, starring items, reading gists)
- Data is not used for creditworthiness or lending

### Privacy policy URL

`https://aibytes.io/privacy`, whose "The Chrome extension" section covers the
above.

## Version history

| Version | Date | Changes | Status |
|---|---|---|---|
| 26.1.15 | existing listing | Placeholder "AI Bytes" | Published |
| 26.11.27 | 2026-11-27 | The first full release (T23): this listing, version `YY.M.D`, `/privacy`'s extension section. Includes everything under 0.1.0 | Submitted for review, 27 Nov 2026 |
| 0.1.0 | 2026-11-25 | Scaffold: popup placeholder, `storage` only, onboarding on install. Then today's edition (T9), stars and Saved signed out, kept in `chrome.storage.local` (T10), and gists in the popup (T11). Store zip: 19 files, 422 KB unpacked (T12). Popup review (27 Nov): 550px wide, stacked rows, a light/dark toggle (light by default) and the signed-out save banner; the theme and the banner's dismissal stay in the popup's own localStorage, on the device, and no permission changes | Draft |

The store version is `YY.M.D` of the submission day and must be above
`26.1.15` (`version.test.js`). T23 set it to 26.11.27; if the upload is on a
later day, set that day's version and rebuild the zip.
