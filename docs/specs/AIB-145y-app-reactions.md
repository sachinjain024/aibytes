# Spec: `app-reactions`, emoji reactions on a gist

- **Ticket:** AIB-145y, task T30 (builds in T31 and T32)
- **Parent spec:** `docs/specs/AIB-145y-gists.md`, module `app-reactions`
- **Builds on:** `AIB-145y-ledger-gist-ui.md` (`ReactionBar`), `AIB-145y-app-gist-pages.md`
  (the page), `AIB-145y-app-gist-panel.md` (the panel), the design record (D2), and the
  accounts spec AIB-75v (Google sign-in, `firestore.rules`, the emulator tests)
- **Status:** approved 15 Nov 2026, with all three recommendations. The choices
  marked **Decide** below are settled as recommended.

## Objective

A reader of a gist, on its page or in the panel, sees how many people reacted with
each of eight emoji and, signed in with Google, can add or remove their own. Reading
the counts never needs sign-in. Pressing a button while signed out asks for Google
sign-in. One reader can hold any of the eight on a gist, once each, the way GitHub's
reactions work.

This spec fixes the data shape, the rules, what a view costs, and how the app talks
to it. It does **not** need a Cloud Function (below). The rules and their emulator
tests are T31; the store and the wiring are T32.

## The eight, and their keys

Fixed order, from the Ledger spec: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀. Firestore holds a key,
never the emoji itself (no Unicode in field names or rules), and the app maps key to
emoji in one table:

| Emoji | Key | | Emoji | Key |
|---|---|---|---|---|
| 👍 | `plus1` | | ❤️ | `heart` |
| 👎 | `minus1` | | 🚀 | `rocket` |
| 😄 | `laugh` | | 👀 | `eyes` |
| 🎉 | `hooray` | | 😕 | `confused` |

Adding a ninth later is a rules change and a publisher deploy; nothing else stores
the list.

## The data

Two collections, both keyed by the gist's slug (the contract's slug rule,
`^[a-z0-9]+(?:-[a-z0-9]+)*$`, at most 80 characters).

```
gist_reactions/{slug}/by/{uid}   what one reader chose
  keys:        string[]          a set of the eight keys, each at most once, 1 to 8 long
  updated_at:  timestamp         the server time of the last change

gist_reaction_counts/{slug}      what everyone chose, as numbers
  plus1, minus1, laugh, hooray, confused, heart, rocket, eyes:  integer, 0 or more
```

A reader who clears their last emoji deletes their `by/{uid}` document. A counts
document is created by the first reaction to a gist and is never deleted.

**Why two collections, not one (Decide 1).** The plan's first guess was one document
per reader and a `count()` query per emoji. That needs public `list` on the readers'
documents, and a document id is the reader's Firebase uid: anyone could list every
gist a given uid reacted to and with what. A uid is opaque, but it is stable and
links one person across gists. The counts document holds numbers only, so it can be
public without exposing anyone, and one read replaces eight queries.

## The rules (T31)

```
match /gist_reactions/{slug}/by/{uid} {
  allow read:   if isOwner(uid);
  allow create, update: if isOwner(uid) && isGoogle() && isSlug(slug)
                        && isReaderDoc(request.resource.data)
                        && countsAfterMatch(slug, uid);
  allow delete: if isOwner(uid) && countsAfterMatch(slug, uid);
}
match /gist_reaction_counts/{slug} {
  allow get: if true;            // no list: nobody can enumerate gists
  allow write: if isSlug(slug) && isGoogle() && countsFollowReader(slug);
}
```

- **Signed out cannot write.** Every write needs `isGoogle()`
  (`request.auth.token.firebase.sign_in_provider == 'google.com'`).
- **Your own document only.** `by/{uid}` is readable and writable by that uid and no
  one else, and the owner alone can read it.
- **Only the eight.** `keys` has 1 to 8 entries, all from the table, no repeats
  (checked as a set).
- **Counts cannot be set by hand.** A counts write is allowed only in the same
  batched write as a reader-document change, and only when the new counts differ
  from the old by exactly the keys that reader added (+1) and removed (-1), with
  every other field unchanged and no field below 0. The rules compare
  `getAfter()` against `get()` of the same pair of documents. The app always writes
  the two together in one `writeBatch`; a reader document written alone, or counts
  written alone, is refused.
- **Counts are public, reader documents are not.** `get` on a counts document is open;
  there is no `list` on either collection.
- **A change is one emoji.** A single write changes the reader's set by exactly one
  key, so a toggle is one step and the arithmetic above stays simple. Changing
  several in one batch is not supported; the app does them one at a time.

Everything else stays closed, as today. The emulator tests (T31, `rules.test.js`)
prove: a signed-out reader cannot write; a non-Google sign-in cannot; a reader
cannot read or write another's document; a ninth key and a duplicate are refused;
counts cannot be written alone, cannot move by two, cannot go below 0 and cannot
change a key the reader did not touch; two readers' reactions add up; deleting a
reaction subtracts; anyone can `get` a counts document and nobody can `list`.

**If the rules cannot express this (Decide 1's risk).** Comparing before and after
across two documents in a batch is supported (`getAfter`), but it is the part of
this spec I have not yet run. T31 proves it on the emulator first. If it cannot be
made honest, the fall-back is the plan's first shape (one document per reader, public
`count()` queries, with the uid exposure above), and I stop and ask before building
that, since it changes what the publisher is agreeing to here.

**Known limit.** The rules check that a slug is well-formed, not that a gist exists
(`firestore.rules` cannot read `content/`). A signed-in person can create counts for
a slug that is not a real gist. The cost is a few junk documents that nothing reads.
It is bounded by sign-in, by one document per slug, and by the publisher's ability to
clean up in the console, so it is accepted.

## What a view costs

| Action | Reads | Writes |
|---|---|---|
| Open a gist, signed out | 1 (counts) | 0 |
| Open a gist, signed in | 2 (counts, your own reader document) | 0 |
| Press an emoji | 0 | 2 (reader, counts), in one batch |

Counts are read once when the gist opens, never with a live listener, so a gist left
open does not bill. The reader's press updates the numbers on screen straight away
from what they just did; other people's presses show on the next open. At Firestore's
free tier (50,000 reads a day) that is about 25,000 gist opens a day signed in, many
times today's traffic. A popular gist takes about one counts write per second at
most, Firestore's per-document limit; that is far above anything this site sees, and
past it a press fails and rolls back like any other refused write.

## What the app does (T32)

A `reactions.js` store in `apps/web/src`, taking `db` and `uid` as the saves store
does so the emulator tests can drive it:

```ts
reactions(db, uid?) → {
  load(slug): Promise<{ counts: Record<key, number>, mine: key[] }>,
  toggle(slug, key): Promise<void>,   // one writeBatch; rejects when the rules refuse
}
```

- **Display.** `ReactionBar` goes in the `actions` slot of `GistView`, after the save
  row (design D2), on the page and in the panel, as `GistActions` already does for
  saving. The bar shows at once with zero counts and the numbers fill in when
  `load` resolves, so nothing shifts. The server-rendered page has no reaction row
  (the Ledger spec, unchanged); it appears after the page mounts.
- **Pressing, signed in.** The count and the pressed state change at once. The write
  goes out. If the rules refuse it, or it fails, the change is undone and a short
  line under the bar says "Could not save your reaction. Try again."
- **Pressing, signed out.** The existing Google sign-in opens. The press is not
  applied afterwards; the reader presses again **(Decide 2)**.
- **When the counts will not load.** The bar still shows, with no numbers. A
  signed-in press still tries to write. No error is shown for a read that fails.
- **Switching gists in the panel.** `load` runs for the new gist; the old gist's
  numbers are not shown on the new one for even a frame (the bar is keyed by slug).
- **Sign-in and out.** Signing in loads the reader's own set; signing out clears the
  pressed marks and keeps the public counts.

## Privacy and the page

`/privacy` says what is stored and why. It needs one added sentence: when a signed-in
reader reacts, Firestore holds their Google account id, the gist, the emoji and the
time, visible to no one but them, and the public counts are only numbers. That is a
text change in T32. No other consent or cookie change: reading stays free of
sign-in, and no new cookie or script is added.

## Boundaries

- **Always:** write the reader document and the counts in one batch; map keys to
  emoji in one table; keep the bar in the `actions` slot; test the rules on the
  emulator; undo a refused press on screen.
- **Ask first:** a Cloud Function; a live counts listener; a ninth emoji;
  reactions for a signed-out reader; any event in the analytics tool for reactions;
  a public `list` on either collection; storing more than the key set and a time.
- **Never:** put an email, a name or a photo in a reaction document; show who
  reacted; read the counts on the server render; apply a press the rules refused;
  let the publisher's deploy (P5) be skipped before T32 ships.

## Commands

```bash
npm run test:rules -w @aibytes/web      # emulator: rules.test.js, accountSaves, subscriberStore, and the new reactions tests (needs Firebase CLI and Java)
npm test -w @aibytes/web                # reactions.test.js: the store against a fake db
npm test -w @aibytes/design-system      # ReactionBar is unchanged; nothing new expected
npm run dev:web                         # http://localhost:5173/, against the real project after P5
# Rules deploy, by the publisher only (P5): firebase deploy --only firestore:rules --project ai-bytes-b42d2
```

## Testing

| Task | Tests |
|---|---|
| T31 | Emulator rules, as listed under "The rules". Added to `test:rules`'s file list in `apps/web/package.json`. |
| T32 | `reactions.test.js`: `toggle` adds then removes one key and writes both documents in one batch; two presses in a row stay consistent; a refused write rejects and the store reports it; `load` returns zeros for a gist with no counts document; the key table has eight entries in the Ledger order. Wiring: the bar sits in `GistActions` and re-keys on a slug change; the signed-out press calls sign-in and writes nothing. |
| T32 browser | After P5, on the real project, in both themes at 1440px and 375px: a press shows at once and survives a reload; a second browser sees the count after a reload; signed out, a press opens sign-in and writes nothing; Back and the panel's close do not lose a press; the page's server markup is unchanged. |

## Success criteria

1. Anyone can read a gist's counts without signing in; a signed-in reader can add and
   remove each of the eight, once each per gist.
2. A signed-out reader's press asks for sign-in and writes nothing.
3. No client can write another reader's document, read another's choice, write counts
   alone, move counts by more than one, or use a key outside the eight (emulator).
4. A page or panel view costs at most two reads and no listener.
5. A refused or failed press leaves the screen as it was, with one line saying so.
6. `/privacy` says what a reaction stores. The gist page's server markup is unchanged.

## Decide

1. **Counts as numbers in their own document.** Recommended: the two collections
   above, so reader choices stay private and a view is one read. The alternative is
   the plan's first guess, one document per reader and eight public `count()` queries
   per view: simpler rules, but it exposes which gists each uid reacted to and costs
   eight reads a view. This choice is the one that most needs a yes from the publisher
   because the rules are the hardest part of the module.
2. **A press while signed out.** Recommended: ask for sign-in and apply nothing; the
   reader presses again. The alternative remembers the press through the Google popup
   and applies it on return, which reads better but needs state held across the
   sign-in and the gist changing underneath it.
3. **Several emoji per reader, or one.** Recommended: several, one toggle each, as the
   parent spec says ("one toggle per person per emoji"), and as GitHub does. The
   alternative is one emoji per reader per gist, which makes the rules simpler and the
   numbers a clean poll, but drops "toggle each".

## Not in this spec

Reactions on feed cards, on the saved page or in the newsletter; a reaction summary
in search results; notifications; deleting a reader's reactions when they delete an
account (the app has no account deletion today; the reader's own documents can be
removed by the publisher in the console on request).
