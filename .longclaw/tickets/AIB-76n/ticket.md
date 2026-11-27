---
format: longclaw.ticket/v1
id: 47295eb2-ad1d-4023-895a-a972bd8061e2
key: AIB-76n
title: "Chrome extension: popup with the ranked daily edition, stars and sign-in"
status: done
priority: p2
rank: a0
labels:
  - app
type: feature
created_at: 2026-10-08T10:23:17.730Z
updated_at: 2026-11-27T11:03:44.945Z
---

The aiBytes_ Chrome extension, popup first: clicking the toolbar icon shows today's edition as a ranked list, with a star on every row that syncs to the reader's aibytes.io account. It replaces the existing "AI Bytes" listing on the Chrome Web Store. Split out of AIB-8h (phase 7) on 2026-10-08; re-scoped on 2026-11-20 after a requirements interview with the publisher. The new-tab page moved to its own ticket, AIB-151m.

## Goal (confirmed 20 Nov 2026)

- **Success is installs on the Chrome Web Store.** The extension is a sticky interface of its own, separate from the newsletter and the site, and it can be monetized later. More installs count as success even if newsletter subscribers don't grow.
- **Who installs it, and from where:** the existing audience first (newsletter readers and aibytes.io visitors, converted by an install banner on aibytes.io); then readers coming from launch posts on Reddit, Hacker News, Product Hunt and LinkedIn; then organic search in the Chrome Web Store.
- **Why now:** the product has caught up. Saves, sign-in and gists all ship on aibytes.io, so the extension can be complete rather than a read-only preview, and the existing listing is an empty placeholder (9 users, blank screenshots).
- **No monetization in v1** — no sponsored rows and nothing else that hints at it; it will be evaluated later. The ranked list is still built so a sponsored row could be added later without a redesign.

## Statement of intent (confirmed 20 Nov 2026)

- **Outcome:** a popup-first extension that replaces the existing store listing. The popup shows today's edition as a **ranked list**, in the same order as aibytes.io, built from Ledger and the web app's components.
- **Popup, kept lean:** a header with the edition date, the ranked list with a ☆ on every row, a **Saved** toggle, and "Open on aibytes.io". Clicking a row opens its **gist full-size inside the popup** with ← Back; an item without a gist opens its source in a new tab. No category filters, no edition switching, no gist reactions.
- **Stars:** sync to the reader's aibytes.io account (`users/{uid}/saves`, the AIB-75v store), so Saved is the same in the popup and on the site. Signed out, stars are kept in the extension and merged into the account on the first sign-in, as the web app does.
- **Sign-in happens on aibytes.io, never in the extension.** After a Google sign-in on aibytes.io, a new callable in `functions/` mints a Firebase custom token, and the page sends it to the extension with `chrome.runtime.sendMessage(EXTENSION_ID, …)` through `externally_connectable` (aibytes.io only). The extension checks the sender's origin and calls `signInWithCustomToken` (`firebase/auth/web-extension`). This happens on **every** aibytes.io sign-in while the extension is installed, not only during onboarding, and sign-out on aibytes.io signs the extension out too.
- **Onboarding at `aibytes.io/extension-onboarding`:** opened by the background worker on install, and once on the update for existing users. **1. Pin to toolbar**, with a GIF or animation of the puzzle-piece → pin action. The step ticks itself when the reader pins, using `chrome.action.getUserSettings().isOnToolbar` and `action.onUserSettingsChanged`. **2. Sign in (optional)**, with an "Also subscribe to the weekly newsletter" checkbox that reuses the AIB-140p subscribe path. Both steps can be skipped. Without the extension installed, the page shows "Add to Chrome".
- **Install banner on aibytes.io:** a component shown on the site to readers on desktop Chrome who don't have the extension installed. It is detected through `externally_connectable`, so it disappears once the extension is installed. It is designed in the prototype alongside the popup and onboarding.
- **Store and site:** the update is uploaded to the existing listing from the same developer account. It needs a version above 26.1.15, a new icon, screenshots, promo tile and description, and the privacy answers redone. The listing is written to rank in store search and to convert: the name, short description and first screenshot are designed for both. Then the aibytes.io "Chrome Extension (soon)" link points at the listing.
- **Constraint, minimal permissions:** host access to `https://aibytes.io/*` only, plus `externally_connectable` for aibytes.io. No `identity` and no `tabs` permission. The Firebase and Google APIs are reached with plain cross-origin calls, which need no host permission.
- **Out of scope:** any monetization; the launch posts themselves — the Reddit, Hacker News, Product Hunt and LinkedIn copy and the demo video go in AIB-152d after the update is live, and this ticket only produces the screenshots and GIF they can reuse; the new-tab override (AIB-151m); content scripts, and with them the Ledger `:host` token gap; category filters and edition switching in the popup; gist reactions in the extension; browsers other than Chrome.

## What is true today

- The web app is live at `https://aibytes.io`, built from `apps/web` and deployed by `.github/workflows/pages.yml` on every push to `main` that touches `content/`.
- The data is public and fetchable from an extension: `https://aibytes.io/content/index.json`, `editions/YYYY-MM-DD.json` and `gists/<slug>.json`, served with `access-control-allow-origin: *` and `cache-control: max-age=600`. The contract is `packages/feed-schema`.
- Ledger (`packages/design-system`) has what the popup needs: `ListRow`, `GistView`, `EndCard`, `ItemImage`, the source marks, and the star (E2, under the source icon). Dark mode follows `prefers-color-scheme`.
- Saves and Google sign-in shipped on the web in AIB-75v: local saves, a Firestore account store, and the merge on first sign-in (`apps/web/src/accountSaves.js`). The web app's feed composition lives in `apps/web/src/App.jsx` (about 52 KB), so reusing it in the popup probably means pulling shared pieces out of that file first.
- `functions/` is the `aibytes-web` Cloud Functions codebase, with one callable today. Minting custom tokens needs the functions' service account to hold **Service Account Token Creator** — a one-time IAM grant by the publisher.
- The web app's footer shows "Chrome Extension (soon)" as plain text (`apps/web/src/footer.js`).
- The existing store listing (`faamldnehjdjdobapchedpmldfjjfife`) is version 26.1.15, with 9 users, 11 MB, in Education, and declares that it handles personal data.

## How we get there

Same flow as AIB-75v:

1. **Prototype** the popup (list, Saved, gist view, signed-in and signed-out states), the two onboarding steps and the aibytes.io install banner on the real Ledger components, in `docs/ux/prototypes/AIB-76n-extension/`, with the open choices as numbered options. The picks go to `docs/decisions/product/AIB-76n-extension-design.md`.
2. **Capability map and module specs** in `docs/specs/AIB-76n-*.md`.
3. **Plan and todo** in `docs/plans/AIB-76n-plan.md` and `-todo.md`, mirrored here as numbered checklist items.
4. Build, store submission, and the footer link.

## Notes

- The extension is a shipped client that cannot be hotfixed, so it reads only fields the contract guarantees and tolerates fields it does not know (`.claude/rules/feed-schema.md`).
- Product spec §9 still describes a new-tab extension. Update it when the decision record lands.

## Checklist

- [x] 1. Prototype the popup, onboarding and aibytes.io install banner, and record the picks in docs/decisions/product/AIB-76n-extension-design.md <!-- longclaw:item=ck_cc395d9b -->
- [x] 2. Capability map (docs/specs/AIB-76n-capability-map.md), then the module specs (docs/specs/AIB-76n-<module-id>.md) <!-- longclaw:item=ck_019d540e -->
- [x] 2.1 Publisher, before extension-auth: add chrome-extension://faamldnehjdjdobapchedpmldfjjfife to Firebase Auth's authorised domains (project ai-bytes-b42d2) <!-- longclaw:item=ck_c4a64b1c -->
- [x] 2.2 Publisher, before extension-auth: the web API key is HTTP-referrer restricted to aibytes.io; confirm, and allow the extension (chrome-extension://faamldnehjdjdobapchedpmldfjjfife) so its Auth and Firestore calls are not refused <!-- longclaw:item=ck_469985f9 -->
- [x] 2.3 Understand what Chrome's "Build with AI" guidance offers (developer.chrome.com/docs/extensions/ai/build-with-ai#modern_web_guidance): the Modern Web Guidance skills (chrome-extensions, modern-web-guidance), Chrome DevTools for agents (chrome-devtools-mcp with --categoryExtensions), and the CHROMEWEBSTORE.md convention; note what applies to this build and what overlaps the repo's own skills and rules <!-- longclaw:item=ck_4fca43a2 -->
- [x] 2.4 Before the build: install the Modern Web Guidance skills (npx modern-web-guidance@latest install --choose; pick Claude Code, chrome-extensions and modern-web-guidance), add chrome-devtools-mcp with --categoryExtensions --autoConnect, and add the CHROMEWEBSTORE.md instruction (permission justifications kept with apps/extension); record where each is installed <!-- longclaw:item=ck_cf0be5fd -->
- [x] 2.5 Publisher, before T13's deploy: grant the functions' runtime service account Service Account Token Creator on itself (command in the extension-auth spec) <!-- longclaw:item=ck_37688461 -->
- [x] 3. Plan and todo (docs/plans/AIB-76n-plan.md), mirrored here as numbered build items <!-- longclaw:item=ck_79c8511c -->
- [x] 3.1 T1 packages/app-core with the display modules (order, visibility, format, storage, dates), importers updated, same test count <!-- longclaw:item=ck_bad9fdf1 -->
- [x] 3.2 T2 app-core's account modules (saves, accountData, accountSaves, merge, saved, firebase-config) and its test:rules <!-- longclaw:item=ck_036bc037 -->
- [x] 3.3 T3 Ledger ExtensionIcon and the Chrome PNGs (16, 32, 48, 128) <!-- longclaw:item=ck_6fb9402f -->
- [x] 3.4 T4 Ledger popup components (PopupHeader with avatar menu, footer, gist bars) and kit page 19 <!-- longclaw:item=ck_5c77755c -->
- [x] 3.5 T5 Ledger OnboardingStep, PinAnimation, Button size lg, and kit page 20 <!-- longclaw:item=ck_43fd53f4 -->
- [x] 3.6 T6 Ledger ExtensionPromo, Sidebar promo, kit page 21, extending-ledger.md <!-- longclaw:item=ck_f3986716 -->
- [x] 3.7 T7 apps/extension scaffold: manifest with key and storage, bundled fonts, onboarding on install <!-- longclaw:item=ck_b1dacb52 -->
- [x] 3.8 T8 The sign-in gate: custom token in the worker, Firestore read/write, worker restart; record the result and freeze permissions <!-- longclaw:item=ck_e863d797 -->
- [x] 3.9 T9 Today's edition in the popup: cache, schema refusal, rank then inFeed, states, View on Web links <!-- longclaw:item=ck_f0f056d4 -->
- [x] 3.10 T10 Stars and Saved signed out, through the chrome.storage.local adapter <!-- longclaw:item=ck_c344fc71 -->
- [x] 3.11 T11 The gist view in the popup, and every link in a new tab <!-- longclaw:item=ck_384173d2 -->
- [x] 3.12 T12 The store zip (package:extension) and CHROMEWEBSTORE.md started <!-- longclaw:item=ck_dfe7be13 -->
- [x] 3.13 T13 The aibytesExtensionToken callable (Google sign-ins only), tests and README <!-- longclaw:item=ck_a6f8eeb7 -->
- [x] 3.14 T14 The site-to-extension contract, the internal sign-out (signoutPending), externally_connectable <!-- longclaw:item=ck_3e6ddeea -->
- [x] 3.15 T15 The popup signed in: account saves, merge retry, avatar menu Sign out <!-- longclaw:item=ck_dc98b79f -->
- [x] 3.16 T16 aibytes.io bridge: status and reconcile on every load <!-- longclaw:item=ck_ead04a49 -->
- [x] 3.17 T17 Newsletter source extension-onboarding: subscriber.js, firestore.rules, emulator tests <!-- longclaw:item=ck_409040ae -->
- [x] 3.18 T18 /extension-onboarding page shell: route, App.jsx branch, noindex page, reducer, not-installed state, EXTENSION_LIVE = false <!-- longclaw:item=ck_6abd2a05 -->
- [x] 3.19 T19 Onboarding steps: pin, sign in with the newsletter box, sign-out view, done, Umami events <!-- longclaw:item=ck_cb57d0a3 -->
- [x] 3.20 T20 The install box: desktop Chromium detection (Chrome, Edge, Brave, Opera, Vivaldi, Arc), 30-day dismiss, behind EXTENSION_LIVE <!-- longclaw:item=ck_23986728 -->
- [x] 3.21 T21 The five store screenshots from the real popup <!-- longclaw:item=ck_2b704eaf -->
- [x] 3.21.1 Publisher ask: keep each tool's screenshots in apps/extension/store/assets/<version>/<tool> (claude, chatgpt, grok, gemini) <!-- longclaw:item=ck_f45ae4cc -->
- [x] 3.21.2 Publisher ask: popup rows stacked: title (up to 2 lines) with the ⋮ menu, then the summary (up to 2 lines), then the source and counts in a smaller font at the bottom <!-- longclaw:item=ck_5b8cd32a -->
- [x] 3.21.3 Publisher ask: popup width 550px (first asked for 640px, then 550px) <!-- longclaw:item=ck_663b865b -->
- [x] 3.21.4 Publisher ask: remove the date next to the aiBytes_ wordmark in the popup header <!-- longclaw:item=ck_193a9ea5 -->
- [x] 3.21.5 Publisher ask: a /proj-generate-chrome-store-screenshots skill that writes each run as a new version under apps/extension/store/assets/ without deleting earlier ones <!-- longclaw:item=ck_d415eb5b -->
- [x] 3.21.6 Publisher ask: screenshots follow the ticket's "Chrome Store Screenshots" comment (S1 to S5), the image style guide PDF for background and design, and assets/references/r1 for layout <!-- longclaw:item=ck_a9cf7994 -->
- [x] 3.21.7 Publisher ask: raw captures first; the framed screenshots only after the publisher approves the raw set <!-- longclaw:item=ck_7d21eb08 -->
- [x] 3.21.8 Publisher report: in the 550px popup the source line sat between the title and the summary; fixed (stacked rows pin title, summary, source line) and the screenshots now capture at the popup's real size <!-- longclaw:item=ck_1571857b -->
- [x] 3.21.9 Publisher ask: a light/dark theme toggle just before the star in the popup header, light by default <!-- longclaw:item=ck_973d0d60 -->
- [x] 3.21.10 Publisher ask: no border on the popup's theme toggle (moon/sun icon only) <!-- longclaw:item=ck_9672bb2b -->
- [x] 3.21.11 Publisher ask: show the signed-out save banner (Ledger's SaveBanner) in the popup, worded for the extension <!-- longclaw:item=ck_ea0bd5b0 -->
- [x] 3.21.12 Publisher ask: no border on the popup's saved (star) toggle <!-- longclaw:item=ck_6f4b92f3 -->
- [x] 3.22 Publisher: deploy aibytesExtensionToken (firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2), after 2.5 <!-- longclaw:item=ck_345509a0 -->
- [x] 3.23 Publisher: deploy firestore.rules (firebase deploy --only firestore:rules --project ai-bytes-b42d2) before PR #73 merges <!-- longclaw:item=ck_58f51248 -->
- [x] 4. Store listing written for search and conversion: version above 26.1.15, name, short description, icon, screenshots, promo tile, privacy answers; submit the update <!-- longclaw:item=ck_a7dacce3 -->
- [x] 4.1 Switch the store listing's category from Education to Productivity › Developer Tools (first decided as Lifestyle › News & Weather on 22 Nov; changed 27 Nov to sit with daily.dev, for a developer audience) <!-- longclaw:item=ck_860b789d -->
- [x] 4.2 Promo tile (440×280) and marquee (1400×560): run the brief in Claude, Grok, OpenAI and Gemini, shortlist the candidates in a numbered review artifact, publisher picks one of each <!-- longclaw:item=ck_dfe2ae1c -->
- [x] 5. After the store approves the update (T24, a follow-up PR from main): turn on EXTENSION_LIVE (install box and onboarding "Add to Chrome") and point the aibytes.io footer "Chrome Extension" link at the store listing <!-- longclaw:item=ck_f68f9eec -->

## Activity

<!-- longclaw:event
id: evt_4911ffc4
kind: create
occurred_at: 2026-10-08T10:23:17.730Z
actor:
  type: agent
  id: claude-code
-->
### claude-code created this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_04243603
kind: update
occurred_at: 2026-11-20T10:19:47.370Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: backlog
    to: in_progress
  - field: rank
    to: a0
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_94f0adc0
kind: update
occurred_at: 2026-11-20T13:01:12.243Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: title
    from: "Chrome extension: a new-tab page on the daily edition"
    to: "Chrome extension: popup with the ranked daily edition, stars and sign-in"
  - field: description
  - field: checklist.ck_89c9ab9b.removed
    from: Emit Ledger tokens on `:host` as well as `:root`, if anything is injected into other sites' pages
-->
### Claude Code updated this ticket

Re-scoped after a requirements interview with the publisher: popup first (ranked list, stars, gist in the popup), sign-in done on aibytes.io with a custom token sent to the extension, onboarding at aibytes.io/extension-onboarding. Saves are now in scope (AIB-75v has shipped). The new tab moved to AIB-151m, and the Ledger :host item is dropped because there are no content scripts.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_35f36017
kind: update
occurred_at: 2026-11-20T13:01:12.275Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cc395d9b.text
    from: Scaffold `apps/extension` (Manifest V3, new-tab override, Vite + React, Ledger)
    to: 1. Prototype the popup and onboarding, and record the picks in docs/decisions/product/AIB-76n-extension-design.md
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_db0919bf
kind: update
occurred_at: 2026-11-20T13:01:12.296Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_019d540e.text
    from: New-tab page rendering the latest edition from aibytes.io/content/, cached for offline
    to: 2. Capability map and module specs (docs/specs/AIB-76n-*.md)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ee9317ab
kind: update
occurred_at: 2026-11-20T13:01:12.318Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_a7dacce3.text
    from: Package and submit to the Chrome Web Store
    to: "4. Store listing: version above 26.1.15, icon, screenshots, promo tile, description, privacy answers; submit the update"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_56bb5f17
kind: update
occurred_at: 2026-11-20T13:01:12.338Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f68f9eec.text
    from: Point the web app's footer "Chrome Extension" link at the store listing
    to: 5. Point the aibytes.io footer "Chrome Extension" link at the store listing
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d533f9a9
kind: update
occurred_at: 2026-11-20T13:01:12.358Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_79c8511c.added
    to: 3. Plan and todo (docs/plans/AIB-76n-plan.md), mirrored here as numbered build items
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7f3f07b0
kind: update
occurred_at: 2026-11-20T13:01:15.355Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_79c8511c.moved
    from: "5"
    to: "3"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_91687b79
kind: update
occurred_at: 2026-11-20T13:18:21.646Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket

Second interview: success is Chrome Web Store installs, with the extension as a sticky surface to monetize later. Added the aibytes.io install banner and a store listing written for search and conversion. No monetization in v1. Launch posts go to a separate marketing ticket.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0564cdcb
kind: update
occurred_at: 2026-11-20T13:18:21.674Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cc395d9b.text
    from: 1. Prototype the popup and onboarding, and record the picks in docs/decisions/product/AIB-76n-extension-design.md
    to: 1. Prototype the popup, onboarding and aibytes.io install banner, and record the picks in docs/decisions/product/AIB-76n-extension-design.md
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ce5baea4
kind: update
occurred_at: 2026-11-20T13:18:21.694Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_a7dacce3.text
    from: "4. Store listing: version above 26.1.15, icon, screenshots, promo tile, description, privacy answers; submit the update"
    to: "4. Store listing written for search and conversion: version above 26.1.15, name, short description, icon, screenshots, promo tile, privacy answers; submit the update"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0245bc88
kind: update
occurred_at: 2026-11-20T13:19:34.719Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: description
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_91b6f9c0
kind: comment
occurred_at: 2026-11-20T13:26:48.995Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Prototype: docs/ux/prototypes/AIB-76n-extension/ (open aib-76n-extension.html; rebuild with node docs/ux/prototypes/AIB-76n-extension/build.mjs). Eight open choices, A-H: popup Saved, rows, signed-out, gist view; onboarding steps, pin animation, newsletter box; install banner.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_19bd6ad4
kind: update
occurred_at: 2026-11-21T16:07:30.511Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cc395d9b.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

Design decided from the prototype: A2 B1 C1 D2 E2 F1 G1 H3, the favicon as the extension icon, and the publisher's copy changes. Record: docs/decisions/product/AIB-76n-extension-design.md
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e7750949
kind: update
occurred_at: 2026-11-21T16:31:01.190Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_019d540e.text
    from: 2. Capability map and module specs (docs/specs/AIB-76n-*.md)
    to: 2. Capability map (docs/specs/AIB-76n-capability-map.md), then the module specs (docs/specs/AIB-76n-<module-id>.md)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9cf9adc8
kind: comment
occurred_at: 2026-11-21T16:31:01.214Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Spec drafted: docs/specs/AIB-76n-capability-map.md. Six modules in build order: ledger-extension-ui, app-core, extension-popup, extension-auth, site-extension, store-listing. Awaiting the publisher's review of the map (assumptions, risks, 3 open questions) before the module specs.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_def30b66
kind: update
occurred_at: 2026-11-21T20:12:59.540Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c4a64b1c.added
    to: "2.1 Publisher, before extension-auth: add chrome-extension://faamldnehjdjdobapchedpmldfjjfife to Firebase Auth's authorised domains (project ai-bytes-b42d2)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e9fd5835
kind: update
occurred_at: 2026-11-21T20:12:59.568Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_469985f9.added
    to: "2.2 Publisher, before extension-auth: the web API key is HTTP-referrer restricted to aibytes.io; confirm, and allow the extension (chrome-extension://faamldnehjdjdobapchedpmldfjjfife) so its Auth and Firestore calls are not refused"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_226b5df0
kind: update
occurred_at: 2026-11-21T20:12:59.870Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c4a64b1c.moved
    from: "6"
    to: "3"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_15688d51
kind: update
occurred_at: 2026-11-21T20:12:59.895Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_469985f9.moved
    from: "7"
    to: "4"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_653c71cd
kind: update
occurred_at: 2026-11-21T20:17:33.662Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4fca43a2.added
    to: "2.3 Understand what Chrome's \"Build with AI\" guidance offers (developer.chrome.com/docs/extensions/ai/build-with-ai#modern_web_guidance): the Modern Web Guidance skills (chrome-extensions, modern-web-guidance), Chrome DevTools for agents (chrome-devtools-mcp with --categoryExtensions), and the CHROMEWEBSTORE.md convention; note what applies to this build and what overlaps the repo's own skills and rules"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_29795cf2
kind: update
occurred_at: 2026-11-21T20:17:33.690Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cf0be5fd.added
    to: "2.4 Before the build: install the Modern Web Guidance skills (npx modern-web-guidance@latest install --choose; pick Claude Code, chrome-extensions and modern-web-guidance), add chrome-devtools-mcp with --categoryExtensions --autoConnect, and add the CHROMEWEBSTORE.md instruction (permission justifications kept with apps/extension); record where each is installed"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2505778e
kind: update
occurred_at: 2026-11-21T20:17:33.936Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4fca43a2.moved
    from: "8"
    to: "5"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_69dec8ff
kind: update
occurred_at: 2026-11-21T20:17:33.957Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cf0be5fd.moved
    from: "9"
    to: "6"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5e05220a
kind: comment
occurred_at: 2026-11-22T03:47:43.832Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
-->
### Claude Code commented

Module specs drafted for review (22 Nov 2026): docs/specs/AIB-76n-ledger-extension-ui.md, -app-core.md, -extension-popup.md, -extension-auth.md, -site-extension.md, -store-listing.md. Item 2 is ticked once they are approved; the plan (item 3) follows.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_82d5c4b3
kind: update
occurred_at: 2026-11-22T04:21:38.420Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_860b789d.added
    to: 4.1 Switch the store listing's category from Education to Lifestyle › News & Weather (daily.dev lists under Productivity › Developer Tools, for reference)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_785a951c
kind: update
occurred_at: 2026-11-22T04:21:38.471Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_860b789d.moved
    from: "10"
    to: "9"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_21ea71b8
kind: update
occurred_at: 2026-11-22T07:23:21.558Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dfe2ae1c.added
    to: "4.2 Promo tile (440×280) and marquee (1400×560): run the brief in Claude, Grok, OpenAI and Gemini, shortlist the candidates in a numbered review artifact, publisher picks one of each"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d7140a5e
kind: update
occurred_at: 2026-11-22T07:23:21.627Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dfe2ae1c.moved
    from: "11"
    to: "10"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f04e1403
kind: update
occurred_at: 2026-11-22T07:30:35.415Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_37688461.added
    to: "2.5 Publisher, before T13's deploy: grant the functions' runtime service account Service Account Token Creator on itself (command in the extension-auth spec)"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_68921367
kind: update
occurred_at: 2026-11-22T07:30:35.475Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_37688461.moved
    from: "12"
    to: "7"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ce7cd055
kind: update
occurred_at: 2026-11-22T07:30:35.521Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bad9fdf1.added
    to: 3.1 T1 packages/app-core with the display modules (order, visibility, format, storage, dates), importers updated, same test count
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6ee122e3
kind: update
occurred_at: 2026-11-22T07:30:35.570Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bad9fdf1.moved
    from: "13"
    to: "9"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_81ce2152
kind: update
occurred_at: 2026-11-22T07:30:35.592Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_036bc037.added
    to: 3.2 T2 app-core's account modules (saves, accountData, accountSaves, merge, saved, firebase-config) and its test:rules
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d40010a1
kind: update
occurred_at: 2026-11-22T07:30:35.630Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_036bc037.moved
    from: "14"
    to: "10"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_172ce837
kind: update
occurred_at: 2026-11-22T07:30:35.653Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6fb9402f.added
    to: 3.3 T3 Ledger ExtensionIcon and the Chrome PNGs (16, 32, 48, 128)
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4d73d178
kind: update
occurred_at: 2026-11-22T07:30:35.688Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6fb9402f.moved
    from: "15"
    to: "11"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3c65e8a6
kind: update
occurred_at: 2026-11-22T07:30:35.711Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5c77755c.added
    to: 3.4 T4 Ledger popup components (PopupHeader with avatar menu, footer, gist bars) and kit page 19
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_fdd03221
kind: update
occurred_at: 2026-11-22T07:30:35.749Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5c77755c.moved
    from: "16"
    to: "12"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f22d16af
kind: update
occurred_at: 2026-11-22T07:30:35.775Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_43fd53f4.added
    to: 3.5 T5 Ledger OnboardingStep, PinAnimation, Button size lg, and kit page 20
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1886fb69
kind: update
occurred_at: 2026-11-22T07:30:35.813Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_43fd53f4.moved
    from: "17"
    to: "13"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_263e9791
kind: update
occurred_at: 2026-11-22T07:30:35.837Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f3986716.added
    to: 3.6 T6 Ledger ExtensionPromo, Sidebar promo, kit page 21, extending-ledger.md
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f017f907
kind: update
occurred_at: 2026-11-22T07:30:35.876Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f3986716.moved
    from: "18"
    to: "14"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_43caff93
kind: update
occurred_at: 2026-11-22T07:30:35.902Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b1dacb52.added
    to: "3.7 T7 apps/extension scaffold: manifest with key and storage, bundled fonts, onboarding on install"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1b9620d6
kind: update
occurred_at: 2026-11-22T07:30:35.941Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b1dacb52.moved
    from: "19"
    to: "15"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d8436f14
kind: update
occurred_at: 2026-11-22T07:30:35.965Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e863d797.added
    to: "3.8 T8 The sign-in gate: custom token in the worker, Firestore read/write, worker restart; record the result and freeze permissions"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_aaf4a157
kind: update
occurred_at: 2026-11-22T07:30:36.005Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e863d797.moved
    from: "20"
    to: "16"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9038a755
kind: update
occurred_at: 2026-11-22T07:30:36.028Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f0f056d4.added
    to: "3.9 T9 Today's edition in the popup: cache, schema refusal, rank then inFeed, states, View on Web links"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3fb63bd8
kind: update
occurred_at: 2026-11-22T07:30:36.069Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f0f056d4.moved
    from: "21"
    to: "17"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b5a0772a
kind: update
occurred_at: 2026-11-22T07:30:36.094Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c344fc71.added
    to: 3.10 T10 Stars and Saved signed out, through the chrome.storage.local adapter
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0e16a905
kind: update
occurred_at: 2026-11-22T07:30:36.135Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_c344fc71.moved
    from: "22"
    to: "18"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a54bdaae
kind: update
occurred_at: 2026-11-22T07:30:36.160Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_384173d2.added
    to: 3.11 T11 The gist view in the popup, and every link in a new tab
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e24bfbfd
kind: update
occurred_at: 2026-11-22T07:30:36.200Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_384173d2.moved
    from: "23"
    to: "19"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8c8876de
kind: update
occurred_at: 2026-11-22T07:30:36.224Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dfe7be13.added
    to: 3.12 T12 The store zip (package:extension) and CHROMEWEBSTORE.md started
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_df2e3038
kind: update
occurred_at: 2026-11-22T07:30:36.263Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dfe7be13.moved
    from: "24"
    to: "20"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1ebc3c3d
kind: update
occurred_at: 2026-11-22T07:30:36.288Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_a6f8eeb7.added
    to: 3.13 T13 The aibytesExtensionToken callable (Google sign-ins only), tests and README
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c392c7a8
kind: update
occurred_at: 2026-11-22T07:30:36.329Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_a6f8eeb7.moved
    from: "25"
    to: "21"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_88ed3339
kind: update
occurred_at: 2026-11-22T07:30:36.353Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_3e6ddeea.added
    to: 3.14 T14 The site-to-extension contract, the internal sign-out (signoutPending), externally_connectable
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6fecde2f
kind: update
occurred_at: 2026-11-22T07:30:36.394Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_3e6ddeea.moved
    from: "26"
    to: "22"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_0bed37b4
kind: update
occurred_at: 2026-11-22T07:30:36.419Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dc98b79f.added
    to: "3.15 T15 The popup signed in: account saves, merge retry, avatar menu Sign out"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_32f30d53
kind: update
occurred_at: 2026-11-22T07:30:36.467Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_dc98b79f.moved
    from: "27"
    to: "23"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_60cfcbba
kind: update
occurred_at: 2026-11-22T07:30:36.497Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_ead04a49.added
    to: "3.16 T16 aibytes.io bridge: status and reconcile on every load"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9fd0721d
kind: update
occurred_at: 2026-11-22T07:30:36.540Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_ead04a49.moved
    from: "28"
    to: "24"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8ae01792
kind: update
occurred_at: 2026-11-22T07:30:36.564Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_409040ae.added
    to: "3.17 T17 Newsletter source extension-onboarding: subscriber.js, firestore.rules, emulator tests"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_93751d29
kind: update
occurred_at: 2026-11-22T07:30:36.604Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_409040ae.moved
    from: "29"
    to: "25"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5b6c4d5d
kind: update
occurred_at: 2026-11-22T07:30:36.630Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6abd2a05.added
    to: "3.18 T18 /extension-onboarding page shell: route, noindex page, reducer, not-installed state"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_6de89d5d
kind: update
occurred_at: 2026-11-22T07:30:36.670Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6abd2a05.moved
    from: "30"
    to: "26"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_38a9dc45
kind: update
occurred_at: 2026-11-22T07:30:36.702Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cb57d0a3.added
    to: "3.19 T19 Onboarding steps: pin, sign in with the newsletter box, sign-out view, done, Umami events"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_045c6fd6
kind: update
occurred_at: 2026-11-22T07:30:36.749Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_cb57d0a3.moved
    from: "31"
    to: "27"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2728e4a1
kind: update
occurred_at: 2026-11-22T07:30:36.777Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_23986728.added
    to: "3.20 T20 The install box: EXTENSION_LIVE flag, desktop Chromium detection, 30-day dismiss"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3cbfb2d3
kind: update
occurred_at: 2026-11-22T07:30:36.827Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_23986728.moved
    from: "32"
    to: "28"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_05f8374b
kind: update
occurred_at: 2026-11-22T07:30:36.853Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_2b704eaf.added
    to: 3.21 T21 The five store screenshots from the real popup
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_81310a8e
kind: update
occurred_at: 2026-11-22T07:30:36.899Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_2b704eaf.moved
    from: "33"
    to: "29"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_afb7ea62
kind: update
occurred_at: 2026-11-22T07:30:36.930Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_345509a0.added
    to: "3.22 Publisher: deploy aibytesExtensionToken (firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2), after 2.5"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_43e91f2a
kind: update
occurred_at: 2026-11-22T07:30:36.986Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_345509a0.moved
    from: "34"
    to: "30"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_3e889658
kind: update
occurred_at: 2026-11-22T07:30:37.017Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_58f51248.added
    to: "3.23 Publisher: deploy firestore.rules (firebase deploy --only firestore:rules --project ai-bytes-b42d2) before PR #73 merges"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_43d0154b
kind: update
occurred_at: 2026-11-22T07:30:37.064Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_58f51248.moved
    from: "35"
    to: "31"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_255ae736
kind: update
occurred_at: 2026-11-22T07:30:37.109Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_019d540e.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e2f07193
kind: update
occurred_at: 2026-11-22T07:57:03.584Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f68f9eec.text
    from: 5. Point the aibytes.io footer "Chrome Extension" link at the store listing
    to: "5. After the store approves the update (T24, a follow-up PR from main): turn on EXTENSION_LIVE (install box and onboarding \"Add to Chrome\") and point the aibytes.io footer \"Chrome Extension\" link at the store listing"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8d7b09c2
kind: update
occurred_at: 2026-11-22T07:57:13.256Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6abd2a05.text
    from: "3.18 T18 /extension-onboarding page shell: route, noindex page, reducer, not-installed state"
    to: "3.18 T18 /extension-onboarding page shell: route, App.jsx branch, noindex page, reducer, not-installed state, EXTENSION_LIVE = false"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_92c7703c
kind: update
occurred_at: 2026-11-22T07:57:13.302Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_23986728.text
    from: "3.20 T20 The install box: EXTENSION_LIVE flag, desktop Chromium detection, 30-day dismiss"
    to: "3.20 T20 The install box: desktop Chromium detection (Chrome, Edge, Brave, Opera, Vivaldi, Arc), 30-day dismiss, behind EXTENSION_LIVE"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bd711d15
kind: update
occurred_at: 2026-11-22T08:11:48.492Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_bad9fdf1.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1ba87edc
kind: update
occurred_at: 2026-11-22T11:31:12.663Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_036bc037.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_b04bdf28
kind: update
occurred_at: 2026-11-22T11:39:26.753Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_6fb9402f.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_28c59063
kind: update
occurred_at: 2026-11-22T11:50:22.745Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_5c77755c.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ebe9d12b
kind: update
occurred_at: 2026-11-22T11:58:45.291Z
actor:
  type: agent
  id: grok
  name: grok
changes:
  - field: checklist.ck_c4a64b1c.checked
    from: "false"
    to: "true"
-->
### grok updated this ticket

Publisher added chrome-extension://faamldnehjdjdobapchedpmldfjjfife to Firebase Auth authorised domains on project ai-bytes-b42d2 (Authentication → Settings). Confirmed in console: Custom row with full scheme, no trailing slash; localhost, aibytes.io, and Firebase defaults unchanged.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_90156525
kind: update
occurred_at: 2026-11-22T12:05:37.636Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_43fd53f4.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8a6f48d9
kind: update
occurred_at: 2026-11-22T12:14:11.951Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_f3986716.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_03131833
kind: update
occurred_at: 2026-11-25T03:55:14.333Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_4fca43a2.checked
    from: "false"
    to: "true"
  - field: checklist.ck_cf0be5fd.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

2.3 and 2.4 done (25 Nov 2026). Installed: the Modern Web Guidance skills chrome-extensions and modern-web-guidance at project scope in .claude/skills/ (pinned in skills-lock.json; .agents/skills still the symlink, so Codex sees them); chrome-devtools-mcp with --categoryExtensions --autoConnect at project scope in .mcp.json, overriding the user-level chrome-devtools server in this repo (allow remote debugging at chrome://inspect/#remote-debugging each browser session); the CHROMEWEBSTORE.md instruction as .claude/rules/extension.md, scoped to apps/extension/**, which puts the file at apps/extension/CHROMEWEBSTORE.md (the skill's default is the repo root) and out of the zip. Overlaps: modern-web-guidance picks platform features, but Ledger still decides styling; the skill's store-listing and privacy guidance yields to docs/specs/AIB-76n-store-listing.md. The installer also put find-skills at user scope (~/.agents/skills), outside the repo.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2697030d
kind: update
occurred_at: 2026-11-25T04:07:08.630Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_b1dacb52.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

T7 done (25 Nov 2026, be3822a): apps/extension on Vite 7, manifest by mode (storage only, the store key; the derived ID is checked by test), fonts bundled from @fontsource with Ledger's Google Fonts import stripped, onboarding on install only, CHROMEWEBSTORE.md started. Loaded unpacked in Chrome through chrome-devtools-mcp: ID faamldnehjdjdobapchedpmldfjjfife, onboarding opened once, the popup header renders. Next: T8, the sign-in gate, which needs ticket item 2.2 (the API key referrer restriction) first.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_456b565e
kind: update
occurred_at: 2026-11-25T05:09:44.034Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_469985f9.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

2.2 done (25 Nov 2026): the publisher added chrome-extension://faamldnehjdjdobapchedpmldfjjfife/* to the web API key's website restrictions (the full list is recorded in extension-auth's As set note). Verified by curl (the extension's referrer and aibytes.io accepted, an unknown site refused) and by a fetch from the unpacked dev build in Chrome with only the storage permission: 200. T8's gate can start once a custom token is minted by hand.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d750560e
kind: update
occurred_at: 2026-11-25T06:27:55.808Z
actor:
  type: agent
  id: claude-code
  name: Claude Code
changes:
  - field: checklist.ck_e863d797.checked
    from: "false"
    to: "true"
-->
### Claude Code updated this ticket

T8 done (25 Nov 2026): the sign-in gate passes, all four steps, from the worker with storage alone. Frozen permission set: storage, no host permissions (T14 adds externally_connectable, a manifest key). The merge runs in the worker; the fallback is not needed. Result table in extension-auth's The gate's result. The temporary Token Creator grant was removed afterwards.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4c216ae7
kind: update
occurred_at: 2026-11-25T09:38:09.337Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f0f056d4.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5fcc8a4f
kind: update
occurred_at: 2026-11-25T10:37:55.792Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_384173d2.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_dc4c2eaf
kind: update
occurred_at: 2026-11-25T11:39:11.683Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_c344fc71.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_955d80ba
kind: update
occurred_at: 2026-11-25T12:02:15.044Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_dfe7be13.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_defc00f9
kind: update
occurred_at: 2026-11-25T13:01:18.002Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_a6f8eeb7.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bef2e893
kind: update
occurred_at: 2026-11-25T13:23:42.878Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_37688461.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cc17a312
kind: update
occurred_at: 2026-11-25T13:26:23.880Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_345509a0.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_cb6c5e3e
kind: update
occurred_at: 2026-11-25T15:56:39.809Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_3e6ddeea.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_46bed131
kind: update
occurred_at: 2026-11-26T04:06:48.636Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_dc98b79f.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5538f074
kind: update
occurred_at: 2026-11-26T05:53:08.801Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ead04a49.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_94f95dcf
kind: update
occurred_at: 2026-11-26T05:55:14.342Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_409040ae.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a6041b49
kind: update
occurred_at: 2026-11-26T06:03:01.532Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6abd2a05.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_1352568a
kind: update
occurred_at: 2026-11-26T06:16:33.011Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_58f51248.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d286a083
kind: update
occurred_at: 2026-11-26T07:11:59.307Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_cb57d0a3.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d03f2fea
kind: update
occurred_at: 2026-11-26T07:22:51.060Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_23986728.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ef733987
kind: comment
occurred_at: 2026-11-26T16:25:18.215Z
edited_at: 2026-11-26T17:01:40.506Z
actor:
  type: human
  id: local
-->
### You commented

## Chrome Store Screenshots 
- S1: aiBytes_ Value Proposition: AI Feed from best resources. Show the different resources here. Some sort of art showing multiple resources giving best Ai feed.
- S2: Show a screenshot showing only Github Trending Repo
- S3: A Github Repo Gist
- S4: Show a screenshot showing HackerNews Threads, AI News, Product Launches and these are annotated on the screenshot.
- S5: A screen where we tell users how to stay updated with AI with Daily Feed (aibytes.io), Chrome Store Extension, and a Weekly Newsletter. We don’t show the product screenshot or newsletter screenshot here. Instead we create boxes or arts and also show our 2-d character reading aiBytes on his computer and his computer having 3 resources.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4adbc36f
kind: update
occurred_at: 2026-11-26T17:03:14.759Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f45ae4cc.added
    to: "3.21.1 Publisher ask: keep each tool's screenshots in apps/extension/store/assets/<version>/<tool> (claude, chatgpt, grok, gemini)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a8357abe
kind: update
occurred_at: 2026-11-26T17:03:26.820Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f45ae4cc.moved
    from: "36"
    to: "30"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_126c0030
kind: update
occurred_at: 2026-11-26T17:03:26.851Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f45ae4cc.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5ce1044c
kind: update
occurred_at: 2026-11-26T17:03:26.883Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5b8cd32a.added
    to: "3.21.2 Publisher ask: popup rows stacked: title (up to 2 lines) with the ⋮ menu, then the summary (up to 2 lines), then the source and counts in a smaller font at the bottom"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_75467b2e
kind: update
occurred_at: 2026-11-26T17:03:26.938Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5b8cd32a.moved
    from: "37"
    to: "31"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f894a13a
kind: update
occurred_at: 2026-11-26T17:03:26.966Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_5b8cd32a.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f77c5538
kind: update
occurred_at: 2026-11-26T17:03:26.994Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_663b865b.added
    to: "3.21.3 Publisher ask: popup width 550px (first asked for 640px, then 550px)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_22da1671
kind: update
occurred_at: 2026-11-26T17:03:27.040Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_663b865b.moved
    from: "38"
    to: "32"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_933862e2
kind: update
occurred_at: 2026-11-26T17:03:27.069Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_663b865b.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_62eed0c7
kind: update
occurred_at: 2026-11-26T17:03:27.097Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_193a9ea5.added
    to: "3.21.4 Publisher ask: remove the date next to the aiBytes_ wordmark in the popup header"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ed2c0bce
kind: update
occurred_at: 2026-11-26T17:03:27.142Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_193a9ea5.moved
    from: "39"
    to: "33"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_862865ba
kind: update
occurred_at: 2026-11-26T17:03:27.169Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_193a9ea5.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f13f4133
kind: update
occurred_at: 2026-11-26T17:03:27.195Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d415eb5b.added
    to: "3.21.5 Publisher ask: a /proj-generate-chrome-store-screenshots skill that writes each run as a new version under apps/extension/store/assets/ without deleting earlier ones"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4c659b3b
kind: update
occurred_at: 2026-11-26T17:03:27.246Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d415eb5b.moved
    from: "40"
    to: "34"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_988bfea5
kind: update
occurred_at: 2026-11-26T17:03:27.278Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_d415eb5b.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_149c3614
kind: update
occurred_at: 2026-11-26T17:03:27.307Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_a9cf7994.added
    to: "3.21.6 Publisher ask: screenshots follow the ticket's \"Chrome Store Screenshots\" comment (S1 to S5), the image style guide PDF for background and design, and assets/references/r1 for layout"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_35dc4438
kind: update
occurred_at: 2026-11-26T17:03:27.354Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_a9cf7994.moved
    from: "41"
    to: "35"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_02c08529
kind: update
occurred_at: 2026-11-26T17:03:27.382Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7d21eb08.added
    to: "3.21.7 Publisher ask: raw captures first; the framed screenshots only after the publisher approves the raw set"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_18bbfd87
kind: update
occurred_at: 2026-11-26T17:03:27.427Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7d21eb08.moved
    from: "42"
    to: "36"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_95c9af9c
kind: update
occurred_at: 2026-11-26T17:12:36.223Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_7d21eb08.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_608e74e0
kind: update
occurred_at: 2026-11-27T03:41:03.514Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_a9cf7994.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4a191af8
kind: update
occurred_at: 2026-11-27T03:41:03.554Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_2b704eaf.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_7af6a729
kind: update
occurred_at: 2026-11-27T03:58:29.577Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1571857b.added
    to: "3.21.8 Publisher report: in the 550px popup the source line sat between the title and the summary; fixed (stacked rows pin title, summary, source line) and the screenshots now capture at the popup's real size"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c0007333
kind: update
occurred_at: 2026-11-27T03:58:29.634Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1571857b.moved
    from: "43"
    to: "37"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_a7386262
kind: update
occurred_at: 2026-11-27T03:58:29.663Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_1571857b.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_eccaff85
kind: update
occurred_at: 2026-11-27T03:58:29.699Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_973d0d60.added
    to: "3.21.9 Publisher ask: a light/dark theme toggle just before the star in the popup header, light by default"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_91278fc3
kind: update
occurred_at: 2026-11-27T03:58:29.747Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_973d0d60.moved
    from: "44"
    to: "38"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4c837c5d
kind: update
occurred_at: 2026-11-27T03:58:29.786Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_973d0d60.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9707dcaa
kind: update
occurred_at: 2026-11-27T05:59:57.926Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_9672bb2b.added
    to: "3.21.10 Publisher ask: no border on the popup's theme toggle (moon/sun icon only)"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_67cd07c8
kind: update
occurred_at: 2026-11-27T05:59:57.982Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_9672bb2b.moved
    from: "45"
    to: "39"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_c0f0a5dd
kind: update
occurred_at: 2026-11-27T05:59:58.012Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_9672bb2b.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5227e78d
kind: update
occurred_at: 2026-11-27T06:07:58.728Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ea0bd5b0.added
    to: "3.21.11 Publisher ask: show the signed-out save banner (Ledger's SaveBanner) in the popup, worded for the extension"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9250eb97
kind: update
occurred_at: 2026-11-27T06:07:58.785Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ea0bd5b0.moved
    from: "46"
    to: "40"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bac78e06
kind: update
occurred_at: 2026-11-27T06:07:58.817Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_ea0bd5b0.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_eacb5788
kind: update
occurred_at: 2026-11-27T06:08:26.213Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6f4b92f3.added
    to: "3.21.12 Publisher ask: no border on the popup's saved (star) toggle"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_8d409d61
kind: update
occurred_at: 2026-11-27T06:08:26.276Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6f4b92f3.moved
    from: "47"
    to: "41"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_19bd3051
kind: update
occurred_at: 2026-11-27T06:08:26.311Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_6f4b92f3.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_811434da
kind: comment
occurred_at: 2026-11-27T06:19:37.976Z
actor:
  type: human
  id: local
-->
### You commented

Publisher feedback on the popup, 27 Nov 2026 (recorded at the publisher's ask; done, not yet committed):
- Row summary (the line under the title) is 13px in the popup, down from 14px. Stacked rows only; aibytes.io keeps 14px.
- Earlier in the same review, also logged as checklist items 3.21.8 to 3.21.12: the source line pinned below the summary; a light/dark toggle before the star, light by default; no border on the theme toggle; no border on the saved (star) toggle; the signed-out save banner shown in the popup, worded "Saved items are kept in this extension."
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_e8a31feb
kind: update
occurred_at: 2026-11-27T06:31:17.112Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_79c8511c.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_f45420d5
kind: comment
occurred_at: 2026-11-27T06:45:17.313Z
actor:
  type: human
  id: local
-->
### You commented

Publisher feedback on the T22 promo shortlist, 27 Nov 2026: on M2 (navy marquee), add the sources' logos subtly. Done as two new candidates: M4, the four source marks (GitHub, Hacker News, TechCrunch, Product Hunt) in small low-contrast chips under a 'From' label; M5, the same four as plain text. Reddit left out: it is not one of the edition's sources (see the store-listing spec's Risks), and Ledger has no Reddit mark. If M4 is picked, the store-listing spec's 'no third-party logos or names' rule for the promo images changes with it. T2 (navy tile) noted as 'looks good'.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_4fbcb8b8
kind: comment
occurred_at: 2026-11-27T08:26:02.908Z
actor:
  type: human
  id: local
-->
### You commented

Store images review (27 Nov 2026), publisher's asks: (1) screenshot versions keep only raw/ and each tool's folder once that tool is run, no .gitkeep placeholders; the empty folders (v6, v7 and the tool placeholders) are deleted. (2) The promo tile and marquee are versioned like the screenshots, store/assets/promo-tile/vN/ and store/assets/marquee/vN/, each with its HTML source, so every set uploaded to the store is kept; promo.mjs finish writes the next version and never overwrites. v1 is T2 and M4. (3) The standard icon in store art is the blue bolt tile with a white outline and an orange offset shadow (the raised look); the name stays navy with a blue underscore. (4) v12 (Claude's frame with the standard icon) is the final screenshot set for the Chrome Web Store, replacing v3 in CHROMEWEBSTORE.md.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_817c526e
kind: update
occurred_at: 2026-11-27T08:50:13.299Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_dfe2ae1c.checked
    from: "false"
    to: "true"
-->
### You updated this ticket

T22 done (67ca9e9): promo tile T2 and marquee M4 as store/assets/promo-tile/v1 and store/assets/marquee/v1. Publisher asks this round: all screenshot versions moved under store/assets/screenshots/ (v3, v8, v12-cream, v13-navy) and the skill updated to that path; v9 to v11 removed; v12 renamed v12-cream and v13 (Claude's frame on navy, frame --look navy) v13-navy; v12-cream is the set for the store for now (b81af5c).
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_2de99f39
kind: comment
occurred_at: 2026-11-27T08:56:56.401Z
actor:
  type: human
  id: local
-->
### You commented

T23 (listing, /privacy extension section, version 26.11.27, zip) committed. Correction found while checking the build: signed in, the extension holds the Google account's name, email and photo (shown in the popup header), so the data-use form declares personally identifiable info; the earlier draft said No. Left before submitting: the clean-profile check of the zip signed in and out against production, and /privacy live on aibytes.io (PR #73 merged), since the dashboard links to it.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_240b6b8a
kind: update
occurred_at: 2026-11-27T10:10:26.019Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_860b789d.text
    from: 4.1 Switch the store listing's category from Education to Lifestyle › News & Weather (daily.dev lists under Productivity › Developer Tools, for reference)
    to: 4.1 Switch the store listing's category from Education to Productivity › Developer Tools (first decided as Lifestyle › News & Weather on 22 Nov; changed 27 Nov to sit with daily.dev, for a developer audience)
-->
### You updated this ticket

Category changed (publisher, 27 Nov 2026): Productivity › Developer Tools instead of Lifestyle › News & Weather. The readers are developers, the name says 'for Developers', and daily.dev lists there. It is a dashboard setting, so it can change again without a new version. Updated in CHROMEWEBSTORE.md, the store-listing spec and the T23 plan.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_51167c55
kind: comment
occurred_at: 2026-11-27T10:22:57.883Z
actor:
  type: human
  id: local
-->
### You commented

Submitted to the Chrome Web Store for review (publisher, 27 Nov 2026): version 26.11.27 from apps/extension/builds/, category Productivity › Developer Tools, the store icon store-icon/v1, screenshots v12-cream, promo tile v1, marquee v1. T24 waits on approval.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_ff579672
kind: update
occurred_at: 2026-11-27T10:23:20.664Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_860b789d.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_9b3ed107
kind: update
occurred_at: 2026-11-27T10:23:37.874Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_a7dacce3.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_d7d1f26e
kind: comment
occurred_at: 2026-11-27T10:33:15.787Z
actor:
  type: human
  id: local
-->
### You commented

T24 done on PR #73 (publisher's ask, 27 Nov 2026, before store approval): EXTENSION_LIVE = true, so the install box and onboarding's Add to Chrome show; the footer's 'Chrome Extension' (no '(soon)') links the store listing. Web tests 226/226, build:web passes, checked on the dev server. Left for item 5: after approval, a clean store install opens onboarding once and a 26.1.15 install updates silently.
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_5788a284
kind: update
occurred_at: 2026-11-27T11:03:37.861Z
actor:
  type: human
  id: local
changes:
  - field: checklist.ck_f68f9eec.checked
    from: "false"
    to: "true"
-->
### You updated this ticket
<!-- /longclaw:event -->

<!-- longclaw:event
id: evt_bc09f7c3
kind: update
occurred_at: 2026-11-27T11:03:44.945Z
actor:
  type: human
  id: local
changes:
  - field: status
    from: in_progress
    to: done
-->
### You updated this ticket
<!-- /longclaw:event -->
