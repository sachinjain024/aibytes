---
name: curate-edition
description: Turn one day's raw source snapshots into a published aiBytes_ edition - dedup, relevance filter, category, tags, a one-line summary per item, and card images - written to content/editions/YYYY-MM-DD.json with index.json kept in step. Use whenever the user wants to curate, build, publish, or regenerate a daily edition, the app feed, or the edition JSON - triggers include "curate today's edition", "build the edition for <date>", "generate the daily feed", "re-curate <date>", or "/curate-edition". This is the daily app pipeline; the weekly email is generate-newsletter-content.
---

# Curate Edition (aiBytes_)

Turn the day's raw snapshots in `newsletter/data/` into one edition of the
aiBytes_ app: `content/editions/YYYY-MM-DD.json`, with `content/index.json`
kept in step. The app and the Chrome extension read that file. The weekly
newsletter does not - it keeps curating from raw `newsletter/data/`.

The script does everything mechanical and refuses to publish anything the
contract rejects. **You write the summaries and pick the tags** - that is the
half a script cannot do, and it is the whole reason this skill exists.

## The shape of a run

```
draft   snapshots            -> curation.json + rejected.json
        you write summaries.json against curation.json
build   snapshots + that file -> content/editions/DATE.json + index.json
```

`build` re-derives the items from the snapshots rather than trusting
`curation.json`, so the snapshots stay the single source of truth. If your
summaries file names an id that is not in this edition, or misses one that is,
`build` refuses and writes nothing.

### 1. Draft

```bash
python3 .claude/skills/curate-edition/scripts/curate_edition.py draft --date 2026-08-31
```

Writes `newsletter/data/{yyyy}/{mm}/days/{date}/curation.json` - every item that
passed the filter, with what its source said about it - and `rejected.json`
beside it. Read `curation.json`; it also carries the tag vocabulary inline, so
you do not need to open `content/tags.json` separately.

If a source's snapshot is missing the script says so and builds from the rest.
Fetch first if that was not intended:

```bash
python3 packages/fetchers/fetch.py --cadence daily
```

### 2. Write the summaries

Produce a JSON file - `summaries.json` beside the curation request is fine -
mapping every item id to a summary and its tags:

```json
{
  "date": "2026-08-31",
  "items": {
    "ph-chatcut-2026-08-31": {
      "summary": "AI video editor inside ChatGPT with a real timeline and XML export.",
      "tags": ["Video", "Dev Tool", "Launch"]
    }
  }
}
```

Every id in `curation.json` needs an entry. No extras.

**The summary.** One sentence, at most 200 characters, in the aiBytes_ voice:
dense, calm, honest, technical. The reader is a builder scanning forty cards.

- **Say what the thing does, not why it matters.** "Routes prompts across
  providers and caches identical calls" - not "a powerful tool that transforms
  how teams work with AI".
- **Never restate the title.** The title is directly above the summary on the
  card. If the title is "Nvidia agrees to acquire Hugging Face for $13B", the
  summary carries what the title cannot: the price per user, the antitrust
  angle, what happens to the model hub.
- **Write from the source's facts.** `source_text` in `curation.json` is what
  the source actually said. Never invent a capability, a number, a launch date,
  or a company relationship that is not in it. If the source says too little to
  write a line, describe only what it does say.
- **Product Hunt copy is marketing; translate it.** Launch descriptions assert
  value ("effortlessly supercharge your workflow"). Find the mechanism
  underneath and write that instead. This is the single biggest lift in the
  file.
- **No hype words.** revolutionary, game-changing, seamless, effortless,
  supercharge, unleash, cutting-edge, world-class, blazing fast, 10x. The
  script warns about these; it does not stop you, because the judgement is
  yours.
- **Do not repeat the signals.** The card already renders upvotes, points,
  stars gained and comments in their own column. A summary that says "with over
  1,900 points on Hacker News" spends its one line on a number the reader can
  already see.
- **Single hyphens.** No em or en dashes anywhere, matching the rest of the
  publisher's copy. Use ` - ` where a dash is needed.
- **Name names.** "the Cursor editor", not "the editor"; "Hugging Face", not
  "the model hub".

**Hacker News items give you a title and nothing else.** There is no
description to work from, so "write from the source's facts" and "never restate
the title" pull against each other. Resolve it in this order: say what kind of
piece it is and where it lives, using the destination in `url` (an essay, a
release post, a court ruling, a vendor blog); add the one thing another item in
this same edition establishes, if there is one; and if neither is available,
write a tighter restatement rather than inventing a detail. A slightly flat line
is a much smaller cost than a confident wrong one.

Per category, what the line is for:

| Category | The summary answers |
|---|---|
| Launches | What it does, and what makes it different from the obvious alternative |
| Repos | What the code is, who it is for, and what it is built on |
| News | What happened, and the one fact that decides how big it is |
| HN | What the piece argues or reports - not what the commenters think |

**The tags.** One to four per item, by their **exact display name** from
`tags.json`. The script rejects anything else, because a free-form tag makes
the filter dirty forever.

- Aim for one **What it is** tag and one **Domain** tag, then stop unless a
  third genuinely adds a filter someone would use.
- **Ecosystem** tags are for when the org is the subject, not when it is
  mentioned. An article about OpenAI's pricing is `OpenAI`; a tool that happens
  to call the OpenAI API is not.
- **Business** tags carry the event: `Funding`, `Acquisition`, `Pricing`,
  `Policy`, `Legal`. `Launch` is for a thing shipping, which is most of
  Launches and few of anything else.
- `Show HN` goes on Show HN items, which the script has already filed under
  Launches.
- `Safety` is model behaviour and alignment. Infosec is `Security`. They are
  different tags and the difference matters to the filter.
- Prefer fewer, better tags. Four vague tags are worse than two exact ones.

### 3. Build

```bash
python3 .claude/skills/curate-edition/scripts/curate_edition.py build \
  --date 2026-08-31 --summaries newsletter/data/2026/08/days/2026-08-31/summaries.json
```

Writes the edition, updates `index.json`, rewrites `rejected.json`, and
validates the whole `content/` tree before it finishes. Every fatal problem is
listed at once and nothing is written until they are all fixed.

Warnings about hype words and dashes go to stderr. They are advice - re-read
the line, and rewrite it if the warning is right.

### 4. Verify

```bash
python3 packages/feed-schema/validate.py
```

Then read the edition itself: the counts match what you expect per category,
no summary restates its title, no summary quotes a signal, and the Launches
items link to the products rather than to Product Hunt.

## Things worth knowing

- **A hidden item stays hidden.** Re-curating a date carries `hidden: true`
  forward from `hidden.json`. If a logged hide names an item the new run no
  longer produces, `build` refuses rather than leaving the tree describing an
  item that is not there - un-hide it first with
  `python3 packages/feed-schema/hide.py <id> --unhide`.
- **`rejected.json` is the tuning loop.** It records every dropped item with a
  reason: `unusable`, `not-ai`, `duplicate`. Read it when the edition feels
  thin. It sits beside the raw snapshots, not in `content/`, because it is
  about the inputs.
- **Only Product Hunt needs the network.** A launch's real website only exists
  behind a `producthunt.com/r/` redirect, so `draft` follows it once per launch
  and caches the answers in `links.json` beside the snapshots. `build` reuses
  that cache, so it publishes the URLs you saw in `curation.json` and needs no
  network at all. `--no-resolve-links` skips the lookups entirely, and the item
  keeps its launch page as the destination.
- **Re-running is safe.** The same snapshots, link cache and summaries produce
  a byte-identical edition apart from `generated_at`, so a re-run diffs cleanly.
- **`--cadence weekly`** reads the weekly newsletter snapshots instead of the
  daily ones, which is how an edition can be built from a past week's data.
- **Viral on X stays in the weekly newsletter.** This skill reads Product Hunt,
  Hacker News, TechCrunch, and GitHub. `x_data.json` is a weekly snapshot.
  AIB-74u tracks adding viral posts to the daily edition later.
- This is the curation half of what `generate-newsletter-content` used to do
  alone. That skill keeps reading raw `data/` for the weekly issue and is not
  being pointed at these editions - the two surfaces curate independently.
