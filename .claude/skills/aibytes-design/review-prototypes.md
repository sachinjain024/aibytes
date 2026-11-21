# Review prototypes

How a design choice for the app or the extension goes to the publisher: a
clickable prototype, built on the live Ledger components, with every open
choice as a lettered, numbered option. The picks then go into a decision
record (`docs/decisions/product/<KEY>-<slug>.md`). Examples:
`docs/ux/prototypes/AIB-75v-saves/`, `AIB-145y-gists/`, `AIB-76n-extension/`.

## Layout

```
docs/ux/prototypes/
  _kit/                  shared by every prototype - import it, don't copy it
    ReviewPanel.jsx      the options panel: views, lettered choices, decided marks
    CopyScreen.jsx       the Copy screen
    copy.js              makeCopy(rows) and changesText()
    kit.css              styles for both, Ledger tokens only
  <KEY>-<slug>/
    App.jsx              the prototype
    copy.js              its string table: makeCopy([...rows])
    proto.css            prototype-only styles (browser chrome, mock frames)
    build.mjs            esbuild bundle against the live Ledger sources, inlined
    <key>-<slug>.html    the built page, committed and published as an Artifact
```

Start `build.mjs` from the latest prototype's. It must load `../_kit/kit.css`
before `proto.css`, and map both `react-dom` and `react-dom/client` to the
React global. Build with `node docs/ux/prototypes/<KEY>-<slug>/build.mjs`.

## The options

`OPTIONS` in `App.jsx` is an ordered map: its order gives the letters (A, B,
C ...), so add new choices at the end and never reorder. Each has a `label`,
numbered `choices` and a one-line `note` per choice saying what it means for
the reader. `GROUPS` says which options each view shows; the Copy view shows
them all.

Let the URL hash set any starting state (`#view=onboarding&pin=2&theme=dark&panel=0`),
so screenshots and links can reach every choice.

## Decided choices

When the publisher confirms a pick ("A1", "E2 one at a time", a comment on the
prototype), add it to `DECIDED` in `App.jsx`:

```js
// Choices the publisher has confirmed: shown as "A1 ✓" and fixed.
const DECIDED = { saved: "1", flow: "2" };
```

The panel then shows only that pick, as a green "A1 ✓" button with a
"Decided" tag, and counts open against decided. Keep the option in `OPTIONS`;
removing it would shift every later letter. Only the publisher's own
confirmation decides a choice: a recommendation, or the default, never does.
Rebuild, republish, and list the decided picks in the reply.

## The Copy screen

Every reader-facing string lives in the prototype's `copy.js`, one row each,
and components render them with `t(key, vars)`. Nothing the reader sees is
hard-coded in JSX. Browser chrome, mock data and the prototype's own
narration ("Opens in a new tab") are not copy and stay out.

```js
{ key: "onb.s2.title", where: "Onboarding › Step 2 › Title", text: "Sign in to save & bookmark items" },
{ key: "pop.signin", where: "Popup › Header › Sign in link (C1)", text: "Sign in", when: o => o.signin === "1" },
```

- `where` is `Screen › place`. The Copy screen groups rows by the screen and
  shows the place, so the reviewer knows where each string appears. Name the
  choice in brackets when only one choice renders the string.
- `when` limits the row to the choices that render it. The Copy screen lists
  the selected choices' strings, and a checkbox adds the rest.
- `{name}` placeholders are filled by `t("key", { name })`. Split a sentence
  around a link or an icon into before, link and after rows.

The Copy screen is a view in the Show row. Each row shows where the string
appears, its current text, and a box for the new one. An edit shows in the
prototype at once, and is kept in that browser's local storage. "Copy changes"
puts the changed rows on the clipboard as numbered Was/Now pairs. "Send to
Claude" posts the same text as a comment thread sent to Claude, so it reaches
the session watching the prototype. It needs the page published with
`capabilities: { comments: {} }`; without that, opened as a local file, or for
a viewer who can't send, only Copy changes shows.

When changes arrive (pasted, or as a comment), update the rows' `text` in
`copy.js`, never the JSX. Rebuild and republish.

## Publishing and comments

Publish the built HTML with the Artifact tool, `capabilities: { comments: {} }`
on the first publish (later publishes keep it). Commit the prototype on the
feature branch first and after every change.

Comment auto-replies can publish their own edits straight to the Artifact. Make
each requested change in the prototype's source, then diff the newer published
version against your last one before republishing, so nothing is lost and the
page never drifts from the repo.
