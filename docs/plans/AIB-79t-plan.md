# Implementation Plan: AIB-79t, rank backfill and runner sync

Spec: `docs/specs/AIB-79t-rank-backfill.md`.
Ticket: `.longclaw/tickets/AIB-79t/ticket.md`. Task list: `docs/plans/AIB-79t-todo.md`.
The AIB-79t checklist mirrors the tasks below, one item per task.

## Overview

Three tasks, one PR each, each merged to `main` before the next starts:

1. **T1** adds `curate.py rank --date D`: offline, checks the published ids,
   writes only `rank`.
2. **T2** runs it over `2026-10-08` and `2026-10-09`, as a content-only commit.
3. **T3** gives the runner a `sync` step that fast-forwards `main` before
   `fetch`.

## Dependency graph

```
T1 curate.py rank ── T2 backfill the content
T3 runner sync (independent)
```

- **T2 needs T1 merged**, so the backfill runs from `main`'s code.
- **T3 is independent** of both. It goes last because the backfill is the
  priority today, and the iMac's checkout is already current, so nothing is
  waiting on T3 until the next curate change merges.

## Architecture decisions (from the spec)

- **Route 1, not a re-run of `build`:** the diff is only added `rank` lines.
  `generated_at`, `index.json`, `hidden.json`, `links.json` and `rejected.json`
  are untouched.
- **Identity check before any write:** the snapshots must reproduce exactly the
  published ids, hidden items included, or nothing is written.
- **Always offline:** `rank` forces `no_resolve_links`. `prepare()` is reused
  unchanged; with no lookup the link cache cannot change, so it writes nothing.
- **Conservative:** identical ranks are a no-op. Different ranks refuse
  without `--force`.
- **`sync` is fast-forward only and fatal on failure**, and is skipped under
  `--no-push`, so rehearsals and the end-to-end tests stay side-effect free.
  A runner change takes effect the run after it lands, because `run.py` was
  imported before the pull.

## Task list

See `docs/plans/AIB-79t-todo.md` for acceptance criteria, verification, and
files per task.

### Phase 1: the backfill
- [x] T1 `curate.py rank`: the subcommand, its tests, a line in the skill
- [x] T2 Backfill `2026-10-08` and `2026-10-09` (content only)

### Checkpoint 1
- [ ] Python suite, web tests, and `validate.py` green
- [ ] Every edition in `content/editions/` carries `rank` 1..N
- [ ] Each edition's diff is only added `rank` lines
- [ ] T1 and T2 PRs merged

### Phase 2: the runner
- [ ] T3 `run.py` syncs `main` before it fetches

### Checkpoint 2: complete
- [ ] Every spec success criterion met
- [ ] AIB-79t checklist all ticked; status done
- [ ] T3 PR merged
- [ ] The iMac picks up T3 on its next run; the 2026-10-10 edition carries
      `rank` (if not, `curate.py rank --date 2026-10-10` in its own PR)

## Branches and PRs

- **T1** ships from `aib-79t-rank-backfill`, together with the spec, plan and
  `CLAUDE.md` commits already on that branch.
- **T2** and **T3** each get a fresh branch from an up-to-date `main`:
  `aib-79t-t2-backfill`, `aib-79t-t3-runner-sync`.
- **T2's content goes through a PR**, not straight to `main`. Only the daily
  runner pushes content directly.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| The snapshots no longer reproduce an edition's ids | Med | The identity check refuses and writes nothing; verified 31/31 and 28/28 on 2026-10-09 |
| `rank` writes more than `rank` | High | Byte-level tests on every other file; the T2 diff is reviewed as `+"rank"` lines only |
| A link-cache miss makes a network call | Med | `rank` forces offline; a test fails if `links.lookup` is called |
| T2 merges while the 13:30 runner pushes | Low | Different files; the runner rebases once on rejection |
| `sync` fails on the iMac (a dirty tree, a diverged `main`) and costs an edition | Med | Fails loudly in Slack at `sync`, before anything is fetched; the rerun is `run.py --date D` after a manual fix, and the watchdog still fires |
| `sync` pulls a broken `main` | Med | Same exposure as today's manual pull; `build` and `validate.py` still gate publishing |

## Out of scope

- Changing the score, the item set, or any field but `rank`.
- Any runner change beyond `sync`.

## Open questions

None.
