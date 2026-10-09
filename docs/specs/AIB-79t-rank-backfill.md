# Spec: rank backfill (AIB-79t)

Status: **reviewed 2026-10-09; open questions resolved (see Decisions).**
Ticket: `.longclaw/tickets/AIB-79t/ticket.md`. Follows the `edition-rank` module
of AIB-77u: `docs/specs/AIB-77u-edition-rank.md`.

## Objective

Give every edition published without `rank` the same ranks a post-T2 `build`
would have written, so the app's Ranked order comes from one calculation for
every day rather than from the client fallback for some.

- **Why now:** `rank` is optional and all-or-none, so rank-less editions are
  valid and the app already orders them with the same score (`order.js`). The
  backfill removes that second code path from the reader's experience, and
  matters most for the Chrome extension (AIB-76n), which should be able to
  trust `rank` on every edition it can reach.
- **Who reads the result:** `apps/web` now, the extension later. Nothing else.
- **Also in scope:** the daily runner pulls `main` before it curates, so a
  merged curate change reaches the next edition (see "The runner syncs first").
- **Out of scope:** changing the score, the items, their order in the file, the
  summaries, or any other field.

### The editions to backfill

The T2 PR (#25) merged at 2026-10-09 16:43 IST. Today:

| Edition | Published | Items | Has `rank` |
|---|---|---|---|
| `2026-10-08` | 2026-10-08 13:31 IST | 31 | no |
| `2026-10-09` | 2026-10-09 13:31 IST (before #25) | 28 | no |

The runner iMac did not pull before it curated, which is how 2026-10-09 was
published with pre-#25 code. Its checkout was pulled to `main` by hand on
2026-10-09, after #25 merged, so `2026-10-10` onward should carry `rank`. The
backfill runs today over the two editions above. If 2026-10-10 still turns up
rank-less, the same command runs again for it; which editions need it is found
by scanning, not from a hard-coded list.

## The route: a `rank` subcommand (route 1)

Recommended, and the spec is written for it:

```bash
python3 packages/curate/curate.py rank --date 2026-10-08
```

1. **Re-derive the kept drafts** with the same `prepare()` that `build` uses,
   forced offline: links come only from the day's `links.json`, and no lookup
   runs, whatever flags are passed. `prepare()` needs no change for this: with
   no lookup the cache cannot change, so it writes nothing. `rank` does not
   write `rejected.json` either.
2. **Check identity.** The set of kept ids must equal the set of ids in the
   published file, hidden items included. Any difference refuses with both
   sides of the diff and writes nothing. This is what makes the rank
   trustworthy: it is computed over exactly the items that were published.
3. **Assign** with `rank.assign(kept)`, the same call `build` makes.
4. **Write only `rank`.** Every item gains `rank` as its last key. Every other
   byte of the edition stays as it was: `generated_at`, `counts`, the item
   order, the summaries, `hidden`. `index.json` and `hidden.json` are not
   opened for writing.
5. **Validate, then write.** The new document is checked in memory with the
   contract before it is written, then the whole tree is re-validated as the
   backstop, as `build` and `hide.py` do.

**Idempotent and conservative.** An edition whose ranks already equal the
computed ones is reported as unchanged and not rewritten. An edition that has
*different* ranks is refused unless `--force` is passed, so the command never
silently overwrites a rank `build` wrote.

**Why not route 2 (re-run `build`):** it rewrites `generated_at` (the app's
"updated N ago" would jump to the backfill time), rewrites `index.json` and
`rejected.json`, and re-merges the summaries, so the diff is far larger than
the one field being added. Route 1's diff is one line per item.

## The runner syncs first

A new first step, `sync`, in `packages/runner/aibytes_runner/cli.py`, before
`fetch`:

1. Refuse unless the checkout is on `main` (the same check `publish` makes),
   naming the branch, so a run never curates on a feature branch's code.
2. `git pull --ff-only origin main`. A pull that cannot fast-forward (local
   commits that origin does not have, or a dirty file the pull would
   overwrite) fails the run at `sync` with git's message in Slack, and nothing
   is fetched or written. That is a human's problem, like a push that fails
   twice.
3. Log the resulting short sha, so the day's log says which code curated it.

`--no-push` skips `sync`, as it skips `publish`: the rehearsal command
(`run.py --skip-fetch --no-push`) promises to change nothing, and the
end-to-end tests run in a temp tree that is not a git checkout.

**Limit, accepted:** `run.py` itself was imported before the pull, so a change
to the runner takes effect on the run after it lands. Every other step is a
subprocess (`fetch.py`, `curate.py`, `validate.py`, Claude) and runs the
pulled code.

**Verified offline on 2026-10-09:** with links from the cache only, both days'
snapshots reproduce exactly the published ids (31/31 and 28/28).

## Commands

```bash
# The backfill, one day at a time
python3 packages/curate/curate.py rank --date 2026-10-08
python3 packages/curate/curate.py rank --date 2026-10-09
python3 packages/curate/curate.py rank --date 2026-10-10   # only if it turns up rank-less

# Rehearse into a copy of the tree
python3 packages/curate/curate.py rank --date 2026-10-08 --content-root /tmp/content

# Which editions are rank-less
python3 -c "import json,glob;[print(f) for f in sorted(glob.glob('content/editions/*.json')) if not any('rank' in i for i in json.load(open(f))['items'])]"

python3 packages/feed-schema/validate.py
AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests -v
npm test -w @aibytes/web
```

`rank` takes `--date`, `--data-root`, `--content-root`/`--output-root`,
`--cadence`, and `--force`; not `--summaries`, and not `--no-resolve-links`,
because it is always offline.

## Project structure

| Path | Change |
|---|---|
| `packages/curate/aibytes_curate/cli.py` | `cmd_rank` and its subparser; `prepare()` unchanged |
| `packages/curate/aibytes_curate/edition.py` | a helper that adds `rank` to a loaded document and checks the id sets, if it does not fit in `cli.py` cleanly |
| `tests/test_curate_edition.py` | `RankBackfillTests` |
| `.claude/skills/curate-edition/SKILL.md` | one line on when `rank` is used (back-filling, never in the daily flow) |
| `packages/runner/aibytes_runner/cli.py` | `step_sync`, first in `STEPS` |
| `tests/test_runner.py` | `SyncTest`, on the existing bare-origin fixture |
| `packages/runner/README.md`, `CLAUDE.md` | the pipeline line gains `sync` |
| `content/editions/2026-10-08.json`, `…-09.json` (and `…-10.json` if needed) | the backfill itself, its own commit |

`rank.py`, `validate.py`, the schemas, and `feed.d.ts` do not change.

## Code style

As the rest of `cli.py`: one `cmd_*` per subcommand, `CurateError` with a
message that says what was not written and why, and stdout that reports what
was written.

```python
def cmd_rank(args):
    # Offline, always: the ranks must be over exactly the published items,
    # and a lookup could change which items survive dedup.
    args.no_resolve_links = True
    kept, _, _, _ = prepare(args)
    path = edition_mod.edition_path(content_root, args.date)
    document = edition_mod.read_json(path, path.name)
    published = {i["id"] for i in document["items"]}
    derived = {d.id for d in kept}
    if published != derived:
        raise CurateError(
            f"{args.date}: the snapshots no longer produce the published items, "
            "so nothing was written:\n" + _id_diff(published, derived))
    ...
```

## Testing strategy

`unittest`, offline, in `tests/test_curate_edition.py`, on the existing
temp-dir fixtures (a day's snapshots, a content root):

1. A rank-less edition gains `rank` 1..N equal to `rank.assign` over the drafts,
   and the file is otherwise byte-identical apart from the added lines.
2. `generated_at`, `index.json`, `hidden.json`, `links.json`, and
   `rejected.json` are unchanged (compared as bytes).
3. A hidden item keeps its `hidden: true` and still gets a rank.
4. Snapshots that produce a different id set refuse and write nothing.
5. A cache miss for a Product Hunt hint does not trigger a network lookup
   (`links.lookup` patched to fail the test if called).
6. Running it twice changes nothing the second time.
7. An edition with different ranks refuses without `--force` and is rewritten
   with it.
8. The result validates, and the app's fallback order (`order.js`) equals the
   written ranks for the fixture (a Python/JS parity check already exists for
   `TIE_ORDER`; this one is a manual check on the real editions, below).

Runner, in `tests/test_runner.py` against a bare origin and a clone:

1. A commit on origin that the clone lacks is fast-forwarded in before `fetch`.
2. A clone on another branch fails at `sync` and names the branch.
3. A clone that has diverged from origin fails at `sync`; nothing later runs.
4. `--no-push` skips `sync` and leaves `HEAD` where it was.

Manual, on the real tree before committing the content: the diff of each
edition is only added `"rank": n` lines (and the comma on the line before), and
the Ranked order in `npm run dev:web` is unchanged for those days, since the
fallback already computed the same order.

## Boundaries

- **Always:** rehearse into a copy of `content/` first; commit the content
  apart from the tooling; run `validate.py` and the Python suite before each
  commit.
- **Ask first:** backfilling with `--force`; backfilling any edition whose
  snapshots do not reproduce its ids; any runner change beyond `sync`.
- **Never:** change any field but `rank`; touch `generated_at` or
  `index.json`; make a network call; push content straight to `main` (it goes
  through the PR like the tooling).

## Success criteria

- [ ] `curate.py rank --date D` exists, is offline, and is covered by the
      tests above.
- [ ] Every edition in `content/editions/` carries `rank`, exactly `1..N`,
      equal to `rank.assign` over that day's kept drafts.
- [ ] Each backfilled edition's diff is only added `rank` lines; no other file
      under `content/` or `newsletter/data/` changes.
- [ ] `python3 packages/feed-schema/validate.py` passes.
- [ ] The tooling and the content are separate commits.
- [ ] `run.py` pulls `main` (fast-forward only) before `fetch`, fails the run
      at `sync` when it cannot, and skips it under `--no-push`.

## Decisions (2026-10-09)

1. **Backfill today**, over 2026-10-08 and 2026-10-09. If 2026-10-10 is
   rank-less, run `rank` again for it tomorrow.
2. **The runner pulls before it curates**, in this ticket (`sync`, above).
3. **Keep `rank`** after the backfill, for re-ranking if the score is tuned.

## Open questions

None.
