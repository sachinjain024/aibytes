# Newsletter prompt: asked after a reader's first Google sign-in

- **Status:** final, build not started
- **Decided:** 10 Nov 2026, from a clickable prototype of the four open choices;
  the dialog was refined in review on the prototype and finalised 11 Nov 2026
- **Ticket:** AIB-140p
- **Follows:** AIB-75v (`docs/decisions/product/AIB-75v-saves-and-sign-in-design.md`)

## Decision

The app offers the weekly newsletter around Google sign-in. The prototype put
the question before the Google popup and after it, on the real Ledger
components. These are the picks:

| | Choice | Picked | Not picked |
|---|---|---|---|
| A | When it is asked | **A2 · post-signup**, after Google returns | A1 · pre-signup, before the Google popup |
| B | Pre-signup form | not applicable | B1 · a tick box in a sign-in dialog · B2 · ask first, two buttons |
| C | Post-signup form | **C1 · a modal dialog** | C2 · a card under the avatar |
| D | Copy | **D2 · the full pitch** | D1 · one short line with Subscribe and Not now |

## How it behaves

**A2 · When.** The reader selects Sign in, picks a Google account, and comes
back to the page they were on. If the Google account is new to aiBytes_
(Firebase's `additionalUserInfo.isNewUser`), the dialog opens. A returning
account sees nothing, so each reader is asked once and no flag is stored about
them.

**C1 · The dialog.** Centred over a scrim, 420px wide at most, with 16px side
margins at phone width. It is modal: Tab stays inside, Escape and the × close
it, a click on the scrim closes it, and focus returns to where it was. Focus
starts on Subscribe.

**D2 · The copy**, top to bottom:

> **✓ You're successfully signed in.**
>
> Get the best of AI in your inbox every Monday
>
> - New AI tools
> - AI threads on HN
> - Trending AI projects
> - Latest AI news
> - Official announcements
> - Viral posts on X
>
> [ Subscribe ]
>
> Read by 2,000+ developers at companies like Amazon, Google, OpenAI, Nvidia
> and Stripe.
>
> ♥ Built by a former YC founder [YC mark]

- **One heading.** The heading only confirms the sign-in, with a green tick in
  front of it. The offer is a lead line in the text colour at weight 500, then
  the six things an issue covers as a two-column list. *(Changed 11 Nov in
  review: the heading first carried the offer too, with the pitch as one
  paragraph that also named X.)*
- **Alignment.** The heading, the lead line and the list are left-aligned.
  The list's first column starts at the dialog's left edge and its second
  column ends at the right edge, so neither side is left empty. The proof and
  built-by lines under the button are centred. *(11 Nov in review: the lead
  line and list were centred for one pass, then moved back to the left.)*
- **One action.** Subscribe is the only button, full width. There is no
  "Not now"; the ×, Escape and the scrim dismiss the dialog. *(11 Nov in
  review: a secondary View archive button, opening
  `https://newsletter.aibytes.io/archive` in a new tab, was added and then
  removed "for now". It can come back later.)*
- **Subscribe** saves the reader's Google email as a newsletter subscriber in
  the app's own database. Nothing opens in another tab and the reader is not
  sent to Substack. *(Changed 10 Nov, after the first pick: the ticket had
  Subscribe open the Substack subscribe page with the email prefilled.)*
- **Thank you.** The dialog then swaps to a green tick, "Thank you for
  subscribing." and "aiBytes_ arrives every Monday at <email>.", counts
  "Closing in 3", 2, 1, and closes itself. The × and Escape close it sooner.
- **The proof line** sits under the Subscribe button, centred, at the same
  12px as the built-by line. *(Changed 10 Nov in review: it first sat above
  the button at body size.)*
- **The built-by line** closes the dialog under a 1px rule, centred, at 12px: a
  filled heart in the text colour, the line, then the Y Combinator mark drawn
  as Ledger draws the Hacker News tile (a white Y on `--hot`).

**After a merge.** The dialog does not mention merged saves. The
"N saves from this browser were added to your account." line stays on the
Saved page only. *(Changed 10 Nov: the first prototype repeated the line at
the top of the dialog; it was removed in review.)*

## What Ledger needs

- A `Dialog` component (focus trap, Escape, return focus, `aria-modal`), with
  its `.d.ts`, `.prompt.md`, tests and a UI kit screen. The prototype's
  `Dialog` in `App.jsx` is the reference for its behaviour.
- A success colour for the tick. Ledger has no green today; the prototype uses
  `#1a7f4b` in light and `#46c282` in dark, which need to become tokens and
  pass the contrast tests.
- The Y Combinator mark and the heart as inline SVGs; neither is in Ledger's
  icon set today. The YC tile is a third use of `--hot`, next to "top today"
  and the Hacker News tile, so the design-system rule that lists its uses needs
  the addition.

## Why

- **A2 over A1:** before Google returns, the app cannot tell a new reader from
  a returning one or an existing subscriber, so the pre-signup question would
  show on every Sign in click. Asking after sign-in is one question, once,
  with the email in hand, so one click subscribes it.
- **C1 over C2:** the dialog is seen once and answered; a card under the avatar
  is easy to miss on the one occasion it shows.
- **D2 over D1:** a new reader has not seen the newsletter, so the prompt says
  what is in it and who reads it. A single action keeps the choice simple;
  closing the dialog is the "no".

## Settled for the build (11 Nov 2026)

Saving the subscription in the app, in place of sending the reader to
Substack, raised these. The answers, with the detail in
`docs/specs/AIB-140p-newsletter-prompt.md`:

- **Where it is saved:** Firestore, one document per reader at the top level,
  so the app can tell whether the signed-in reader is subscribed and stop
  offering the newsletter to them.
- **How a saved address reaches the newsletter platform:** the publisher asks
  an agent for the subscribers up to a date, uploads that list, and tells the
  agent it is done, which marks them imported. A thanked reader gets their
  first issue after the next import.
- **When a save fails:** the dialog shows a failure line with retry, and a
  Firebase Cloud Function posts an alert to the daily runner's Slack channel.
  Only that function is deployed from this repo; the project's other
  functions are not touched.
- **After the dialog is closed:** it is never shown again.
- **Consent:** the click is the only opt-in; there is no confirmation email.
- **The privacy page** (`/privacy`) must say the app stores the subscription
  and passes the email to Substack.

## To keep true

The proof line and the built-by line are public claims on a page anyone can
read. Update "2,000+" and the company list when they change.

The prototype is checked in at `docs/ux/prototypes/AIB-140p-newsletter-prompt/`:
open `aib-140p-newsletter-prompt.html`, or rebuild it from the live Ledger
sources with `node docs/ux/prototypes/AIB-140p-newsletter-prompt/build.mjs`. It
opens on the picks above; its options panel still switches between all of them.
