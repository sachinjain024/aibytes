---
format: longclaw.ticket/v1
id: 47295eb2-ad1d-4023-895a-a972bd8061e2
key: AIB-76n
title: "Chrome extension: popup with the ranked daily edition, stars and sign-in"
status: in_progress
priority: p2
rank: a0
labels:
  - app
type: feature
created_at: 2026-10-08T10:23:17.730Z
updated_at: 2026-11-22T07:23:21.627Z
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
- [ ] 2. Capability map (docs/specs/AIB-76n-capability-map.md), then the module specs (docs/specs/AIB-76n-<module-id>.md) <!-- longclaw:item=ck_019d540e -->
- [ ] 2.1 Publisher, before extension-auth: add chrome-extension://faamldnehjdjdobapchedpmldfjjfife to Firebase Auth's authorised domains (project ai-bytes-b42d2) <!-- longclaw:item=ck_c4a64b1c -->
- [ ] 2.2 Publisher, before extension-auth: the web API key is HTTP-referrer restricted to aibytes.io; confirm, and allow the extension (chrome-extension://faamldnehjdjdobapchedpmldfjjfife) so its Auth and Firestore calls are not refused <!-- longclaw:item=ck_469985f9 -->
- [ ] 2.3 Understand what Chrome's "Build with AI" guidance offers (developer.chrome.com/docs/extensions/ai/build-with-ai#modern_web_guidance): the Modern Web Guidance skills (chrome-extensions, modern-web-guidance), Chrome DevTools for agents (chrome-devtools-mcp with --categoryExtensions), and the CHROMEWEBSTORE.md convention; note what applies to this build and what overlaps the repo's own skills and rules <!-- longclaw:item=ck_4fca43a2 -->
- [ ] 2.4 Before the build: install the Modern Web Guidance skills (npx modern-web-guidance@latest install --choose; pick Claude Code, chrome-extensions and modern-web-guidance), add chrome-devtools-mcp with --categoryExtensions --autoConnect, and add the CHROMEWEBSTORE.md instruction (permission justifications kept with apps/extension); record where each is installed <!-- longclaw:item=ck_cf0be5fd -->
- [ ] 3. Plan and todo (docs/plans/AIB-76n-plan.md), mirrored here as numbered build items <!-- longclaw:item=ck_79c8511c -->
- [ ] 4. Store listing written for search and conversion: version above 26.1.15, name, short description, icon, screenshots, promo tile, privacy answers; submit the update <!-- longclaw:item=ck_a7dacce3 -->
- [ ] 4.1 Switch the store listing's category from Education to Lifestyle › News & Weather (daily.dev lists under Productivity › Developer Tools, for reference) <!-- longclaw:item=ck_860b789d -->
- [ ] 4.2 Promo tile (440×280) and marquee (1400×560): run the brief in Claude, Grok, OpenAI and Gemini, shortlist the candidates in a numbered review artifact, publisher picks one of each <!-- longclaw:item=ck_dfe2ae1c -->
- [ ] 5. Point the aibytes.io footer "Chrome Extension" link at the store listing <!-- longclaw:item=ck_f68f9eec -->

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
