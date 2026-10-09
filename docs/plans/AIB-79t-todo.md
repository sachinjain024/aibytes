# Task list: AIB-79t

Plan: `docs/plans/AIB-79t-plan.md`. Spec: `docs/specs/AIB-79t-rank-backfill.md`.

## T1: `curate.py rank`

**Description:** A third curate subcommand. It re-derives the day's kept
drafts offline, refuses unless their ids equal the published edition's, and
writes `rank` from `rank.assign` as each item's last key, changing nothing
else.

**Acceptance criteria:**
- [ ] `curate.py rank --date D` adds `rank` 1..N to a rank-less edition. The
      ranks equal `rank.assign` over the kept drafts, and only `rank` lines
      are added to the file.
- [ ] `index.json`, `hidden.json`, `links.json` and `rejected.json` are
      byte-identical afterwards. No network call happens, even on a link-cache
      miss.
- [ ] A different id set refuses with the diff and writes nothing. A second
      run is a no-op. Different existing ranks refuse unless `--force` is
      passed.

**Verification:**
- [ ] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_curate_edition -v`
      (new `RankBackfillTests`: the 8 cases in the spec's Testing strategy)
- [ ] `AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests`
- [ ] Rehearse on a copy of the tree: `cp -R content /tmp/c && python3
      packages/curate/curate.py rank --date 2026-10-08 --content-root /tmp/c`.
      Then `diff` against the real tree shows only `rank` lines, and
      `validate.py --content-root /tmp/c` passes.

**Dependencies:** None.

**Files likely touched:**
- `packages/curate/aibytes_curate/cli.py`
- `packages/curate/aibytes_curate/edition.py` (only if a helper reads better there)
- `tests/test_curate_edition.py`
- `.claude/skills/curate-edition/SKILL.md`
- `CLAUDE.md` (the curate commands block)

**Estimated scope:** M

## T2: Backfill `2026-10-08` and `2026-10-09`

**Description:** Run `rank` over every rank-less edition on the real tree and
commit only `content/editions/`. The commit is content-only, with the ticket
update in a separate commit.

**Acceptance criteria:**
- [ ] A scan of `content/editions/` lists no rank-less edition.
- [ ] `git diff --stat` touches only the backfilled edition files. Each
      diff is only `+"rank": n` lines, plus the comma added to the line
      before each.
- [ ] The content commit contains nothing outside `content/editions/`.

**Verification:**
- [ ] `python3 packages/feed-schema/validate.py`
- [ ] `git diff -U0 content/ | grep '^[-+] ' | grep -v '"rank"' | grep -v '"hidden"'`
      prints nothing. The only `-` lines are `hidden` lines gaining a
      trailing comma.
- [ ] `npm run dev:web`: the Ranked order for both days is unchanged. The
      client fallback already computed the same order (28/28 on 2026-10-09).

**Dependencies:** T1 merged.

**Files likely touched:**
- `content/editions/2026-10-08.json`
- `content/editions/2026-10-09.json`

**Estimated scope:** S

## T3: The runner syncs `main` before it fetches

**Description:** A new first step, `sync`, in `run.py`. On `main` it does
`git pull --ff-only origin main` and logs the sha. Off `main`, or when it
cannot fast-forward, the run fails at `sync` and Slack says so. `--no-push`
skips it.

**Acceptance criteria:**
- [ ] A commit on origin that the checkout lacks is pulled in before `fetch`,
      and the log names the new sha.
- [ ] Another branch, or a diverged `main`, fails the run at `sync`, and no
      later step runs.
- [ ] `--no-push` skips `sync` and leaves `HEAD` alone. The existing
      end-to-end tests pass unchanged.

**Verification:**
- [ ] `AIBYTES_SKIP_LIVE=1 python3 -m unittest tests.test_runner -v`
      (new `SyncTest`, on `PublishTest`'s bare-origin fixture)
- [ ] `AIBYTES_SKIP_LIVE=1 python3 -m unittest discover -s tests`
- [ ] `python3 packages/runner/run.py --skip-fetch --no-push` locally: the log
      shows `sync` skipped, and `git status` is unchanged.

**Dependencies:** None (sequenced after T2).

**Files likely touched:**
- `packages/runner/aibytes_runner/cli.py`
- `tests/test_runner.py`
- `packages/runner/README.md`
- `CLAUDE.md` (the runner's pipeline line)

**Estimated scope:** S
