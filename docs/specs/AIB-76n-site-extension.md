# Spec: AIB-76n, module 5 `site-extension`

Status: **draft, 22 Nov 2026, for review.** Module 5 of 6 in
`docs/specs/AIB-76n-capability-map.md`. Builds on `ledger-extension-ui` and
the contract in `AIB-76n-extension-auth.md`. Design: E2, F1, G1, H3 in
`docs/decisions/product/AIB-76n-extension-design.md`; copy `onb.*` and
`site.*` from the prototype's `copy.js`.

## Objective

Everything aibytes.io does for the extension:

1. **Keep the extension's sign-in in step with the site's**, on every page.
2. **The onboarding page** at `aibytes.io/extension-onboarding`, opened once
   when the extension is installed: pin, then an optional sign-in with the
   newsletter box ticked, then done.
3. **The install box** in the sidebar for desktop Chromium readers without the
   extension, behind a flag until the store update is live.

Who: aibytes.io readers on desktop Chromium browsers, and every new install.

Success looks like:

- Signed in on aibytes.io with the extension installed, the extension is signed
  in as the same reader within a second of the page loading. Signed out on
  aibytes.io, it is signed out.
- A new install lands on the onboarding page; step 1 ticks itself within 2
  seconds of the reader pinning; step 2 signs both the site and the extension
  in, and subscribes the reader if the box is ticked.
- The install box shows only in desktop Chromium browsers that can install
  from the store, only without the extension,
  only with the flag on, and disappears when the extension is installed.

### Not in this module

The extension's side of the contract (`extension-auth`). The store listing,
turning the flag on, the footer link, `/privacy` (`store-listing`).

## The bridge (`apps/web/src/extensionBridge.js`)

```js
export const EXTENSION_ID = "faamldnehjdjdobapchedpmldfjjfife";
/** The extension's status, or null when it is absent, outside Chrome, or slow (1.5 s). */
export function extensionStatus(runtime = globalThis.chrome?.runtime) { … }
/** Puts the extension's sign-in in step with the site's. Never throws; never logs the token. */
export async function reconcile(user, { status, mintToken, send }) { … }
```

- **Absent:** Chrome exposes `chrome.runtime.sendMessage` to a page only when
  some installed extension lists that page in `externally_connectable`. No
  `chrome.runtime`, a `lastError`, or no answer in 1.5 seconds all mean "not
  installed".
- **Reconcile** runs once the site's session has restored (the first `onUser`
  call) and again on every sign-in and sign-out:
  - site signed in, extension's `uid` missing or different, and the
    extension's `signoutPending` is not set (a popup Sign out is under way;
    minting now would sign the extension straight back in from another open
    tab): call the
    `aibytesExtensionToken` callable (`firebase/functions`, imported only then)
    and send `{ type: "signin", token }`;
  - site signed out, extension has a `uid`: send `{ type: "signout" }`;
  - otherwise nothing.
  One reconcile at a time; a second request while one runs waits for it.
- **Never** logs, stores or puts the token in a URL. A failed mint or send is
  ignored on normal pages (the next load retries) and shown on the onboarding
  page (below).
- Wired in `App.jsx` beside the account effect, so it runs on every page.

## The onboarding page

**Route:** `/extension-onboarding` → `{ kind: "extension_onboarding" }` in
`route.js`, with `?step=signin` read as the start step. **Build:** emitted as
a real page by `vite.config.js`, like `/privacy`, with `ONBOARDING_HEAD` in
`pageMeta.js` (`robots: "noindex"`). **Shell:** the header only, no sidebar,
one centred column, as the gist page.

**States**, from the status at load:

- **Not installed** (status null): `onb.ni.h1`, `onb.ni.sub`, an "Add to
  Chrome" button (`site.cta`) to the store listing, and `onb.ni.fine`. With the
  flag off, the button is not rendered (map build order step 4).
- **Installed:** the heading with the green check (`onb.h1`) and `onb.sub`,
  then one step at a time (E2), each with "Step n of 2":
  - **Step 1, pin** (F1): `onb.s1.title`, `onb.s1.body`, `PinAnimation` with
    `onb.pin.1`–`5`, `onb.s1.wait` and Skip (`onb.s1.skip`). Pinned state comes
    from `status.pinned`, then the `"pin"` port's updates, or a `status` poll
    every 2 seconds where the port posts nothing (Chrome before 130). Once
    pinned: the tick and `onb.s1.done.before` / icon / `onb.s1.done.after`,
    then step 2 after 900 ms. Already pinned on arrival: the same, at once.
  - **Step 2, sign in** (G1): `onb.s2.title` with the Optional tag,
    `onb.s2.body1`, `onb.s2.body2`, the large Google button (`onb.google`,
    `Button variant="google" size="lg"`), the newsletter checkbox
    (`onb.subscribe`) **ticked by default**, and Skip for now
    (`onb.s2.skip`). Signing in uses the site's existing `signIn()`; the
    reconcile then signs the extension in. Afterwards:
    `onb.s2.signedin` once the extension replies `ok`, and, when the box was
    ticked, the subscribe below and `onb.s2.subscribed` on success. Then done
    after 900 ms. Already signed in on arrival: the signed-in lines at once,
    no button.
  - **Done:** `onb.done.title`; `onb.done.before`, the icon,
    `onb.done.after`, then `onb.done.synced` or `onb.done.later`; and
    `onb.done.cta` to `/`.
- `?step=signin` (the popup's Sign in, map assumption 3) starts at step 2.
  If the site is already signed in there, step 2 shows `onb.s2.continue`
  "Continue as {name}" (primary) and `onb.s2.switch` "Use a different account"
  instead of the Google button. Continue sends `signin` with a fresh token.
  "Use a different account" signs the site out, then opens Google's sign-in
  with `prompt: "select_account"`, and the new account's sign-in reaches the
  extension through the reconcile.
- `?action=signout` (the popup's Sign out, map assumption 4) is honoured
  **only when the extension asked for it**: the page reads `status`, and acts
  only if `signoutPending` is true. Then it signs the site out with
  `signOut()`, sends `{ type: "signout" }` (which clears the flag), and shows
  `onb.signedout` "You're signed out of aibytes.io and the extension." above
  step 2's sign-in, whose Google button uses `prompt: "select_account"` so
  the reader can pick another account. No step counter on this view.
  Without the flag (the extension is absent, the flag expired, or any other
  site opened the URL), the parameter is ignored and the page shows its
  normal state: a plain GET never signs anyone out.
- **Errors (copy approved 22 Nov 2026):** the extension does not answer the
  sign-in: `onb.s2.extfail` "Signed in as {name}. The extension didn't sign
  in; open it and try again." The subscribe fails: AIB-140p's line, "Could not subscribe. Check
  your connection and try again.", with its retry and failure report
  (`page: "extension-onboarding"`).
- **The AIB-140p newsletter prompt** (which opens for a new account after
  sign-in) does not open on this page: the checkbox has already asked.

## The newsletter source

- `subscriber.js`: `toSubscriberDoc(user, now, source = "signin-prompt")` and
  `subscribe(db, user, { source, … })`. `source` must be one of
  `"signin-prompt"` or `"extension-onboarding"`, or `toSubscriberDoc` throws
  (as it does for a missing email). The existing prompt passes nothing and is
  unchanged.
- `firestore.rules`, `isSubscriber`: `d.source in ['signin-prompt',
  'extension-onboarding']`, everything else as now.
- **Tests:** the emulator suite (`subscriberStore.test.js` and
  `rules.test.js`) creates a subscriber with each source and is refused
  with any other value; `subscriber.test.js` covers the default and the
  refusal.
- **Order:** the publisher deploys the rules (`firebase deploy --only
  firestore:rules --project ai-bytes-b42d2`) **before** this module's site
  code is merged to `main`. The new rules accept both values, so they break
  nothing live.
- The subscriber export (`packages/subscribers`) does not read `source`
  (checked 22 Nov 2026), so it exports both kinds unchanged. Counting signups
  by source is not in scope.

## The install box

- `Sidebar`'s `promo` slot gets `ExtensionPromo` (H3) when all hold:
  1. `EXTENSION_LIVE` (a constant in `apps/web/src/extension.js`, `false` until
     `store-listing` turns it on);
  2. a desktop Chromium browser that can install from the Chrome Web Store
     (Chrome, Edge, Brave, Opera, Vivaldi, Arc; map answer 12):
     `navigator.userAgentData` lists a `Chromium` brand and reports
     `mobile: false`, with a user-agent fallback (`Chrome/` present, no
     `Mobile` or `Android`) where `userAgentData` is missing. Never Safari,
     Firefox or any phone;
  3. the status check has answered "not installed" (nothing renders until it
     answers, so it never flashes for a reader who has the extension);
  4. not dismissed: "Not now" (`site.notnow`) stores the time in
     `localStorage["aibytes-extension-promo"]`, and the box stays hidden for
     30 days (map assumption 7).
- **Copy:** `site.name`, `site.h3.body`, `site.cta`, `site.notnow`.
- **Link:** the store listing,
  `https://chromewebstore.google.com/detail/faamldnehjdjdobapchedpmldfjjfife`,
  in a new tab.
- **Disappears on install:** after "Add to Chrome" is selected, and whenever the
  tab becomes visible again, the status is checked (every 3 seconds for up to
  2 minutes after the click); once installed, the box goes.

## Analytics

Through `track()`, listed first in `docs/specs/AIB-145y-gist-analytics.md`'s
event table, as that spec requires:

| Event | Data | Sent by |
|---|---|---|
| `extension-promo-click` | none | "Add to Chrome" in the box |
| `extension-promo-dismiss` | none | "Not now" |
| `extension-onboarding-step` | `{ step: "pin" \| "signin", outcome: "done" \| "skipped" }` | each step finishing |
| `extension-onboarding-subscribe` | `{ outcome: "ok" \| "failed" }` | the box's subscribe |

No event carries an email, a uid or a token.

## Tech stack

The web app's own: React 18, Vite 7, `firebase` 13 (`firebase/functions` for
the callable, imported on demand as `reportFailure.js` does), Ledger's new
components. No new dependency.

## Commands

```bash
npm test -w @aibytes/web
npm run test:rules -w @aibytes/web      # the subscriber source, on the emulator
npm run build:web                       # dist/extension-onboarding/index.html exists
npm run dev:web                         # http://localhost:5173/extension-onboarding, with the dev extension loaded
```

## Project structure

```
apps/web/src/
  extensionBridge.js (+ .test.js)    status, reconcile
  extension.js (+ .test.js)          EXTENSION_LIVE, the store URL, isDesktopChrome, the dismiss window
  ExtensionOnboarding.jsx            the page
  onboarding.js (+ .test.js)         the page's steps as a pure reducer
  copy/extension.js                  onb.* and site.* strings
  route.js, pageMeta.js, App.jsx     the route, the head, the wiring
  subscriber.js (+ tests)            source
apps/web/vite.config.js              emits /extension-onboarding
firestore.rules                      isSubscriber's source
docs/specs/AIB-145y-gist-analytics.md   the four events
```

## Code style

As `newsletterPrompt.js`: the page's states as a pure reducer, rendered by a
thin component.

```js
// The onboarding page's steps (spec AIB-76n site-extension, E2). Pure, so
// node --test covers every transition without Chrome or Firebase.
export function onboardingReducer(state, action) {
  switch (action.type) {
    case "pinned": return state.step === 1 ? { ...state, pinned: true, next: 2 } : state;
    case "skip": return { ...state, skipped: { ...state.skipped, [state.step]: true }, step: state.step + 1 };
    // signedIn, extensionSignedIn, subscribed, advance, …
  }
}
```

## Testing strategy

- **`node --test`:** `extensionBridge.js` against a fake `chrome.runtime`
  (absent, `lastError`, a timeout, each reconcile case, one at a time, the
  token never in a log or the returned value, no mint while
  `signoutPending`); `onboarding.js` (every transition, `?step=signin`,
  `?action=signout` with and without `signoutPending`, already pinned,
  already signed in, skips);
  `extension.js` (desktop Chromium detection against sample `userAgentData`
  values and user agents; the 30-day window); `route.js`; `pageMeta.js`.
- **Emulator:** the subscriber source, both values and a refused third.
- **Build:** `gistBuild.test.js`-style check that
  `dist/extension-onboarding/index.html` exists with `noindex`.
- **By hand, with the dev extension loaded:** a fresh install opens the page;
  pinning ticks step 1; signing in signs the popup in and subscribes; sign out
  on the site signs the popup out; with the flag forced on, the box shows in
  Chrome and Edge without the extension, not in Safari or Firefox, not on a phone, and
  goes when the extension is installed.

## Boundaries

- *Always:* the token stays in memory between the callable and `sendMessage`;
  every event listed before it is sent; `EXTENSION_LIVE` off until
  `store-listing`.
- *Ask first:* any change to the existing newsletter prompt's behaviour; a new
  event; showing the box outside desktop Chromium browsers (Safari, Firefox,
  phones).
- *Never:* deploy the rules (the publisher does, before the merge); log or
  store the token; link publicly to `/extension-onboarding` before the update
  is live.

## Success criteria

1. With the dev extension loaded: sign-in and sign-out on aibytes.io are
   mirrored in the extension within a second of the page settling, on any page.
2. The onboarding page passes the manual run above, in light and dark, at
   desktop and phone widths.
3. A subscribe from the page creates `subscribers/{uid}` with
   `source: "extension-onboarding"`; the existing prompt still writes
   `"signin-prompt"`.
4. With the flag off, nothing about the extension shows anywhere on
   aibytes.io except the onboarding page's installed states.
5. `npm test -w @aibytes/web` and the emulator suite pass; `npm run
   build:web` emits the page.

## Open questions

None. Approved 22 Nov 2026: `onb.s2.extfail`, `onb.s2.continue`,
`onb.s2.switch` and `onb.signedout`.

Decided 22 Nov 2026: the done card's button goes to `/`; the install box shows
in every desktop Chromium browser that can install from the store.
