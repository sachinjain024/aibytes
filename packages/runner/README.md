# The daily runner

The scheduled job behind `content/editions/`. It runs on the iMac at 13:30 IST,
publishes one edition, and says so in Slack either way.

```
fetch -> draft -> Claude writes the summaries -> build -> validate -> commit and push
```

## Why the script drives Claude, and not the other way round

`claude -p` exits 0 whenever the model finishes its turn, whether or not the
work happened. If Claude were the orchestrator, a failed run would look exactly
like a good one. So Claude is one bounded step inside a deterministic script:
it reads `curation.json`, writes `summaries.json`, and stops. `build` and
`validate.py` are the gates that decide whether an edition is real, and both
are plain Python that already refuses anything the contract rejects.

Claude gets `Read` and `Write` here and nothing else - no Bash, so it cannot
run `build`, cannot reach the network, and cannot touch git. The script does
all of that itself, and it stages only `content/` and `newsletter/data/`, never
`git add -A`.

## Setup

**1. The Slack webhook.** In the aiBytes_ Slack: create an app, turn on
Incoming Webhooks, add one to the channel you want, and copy the URL. Put it in
the git-ignored `.env` at the repo root:

```
AIBYTES_SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

That URL is a bearer credential - anyone holding it can post into the workspace
- and this repo is public. It lives in `.env` or the environment, nowhere else.
Confirm it works:

```bash
python3 packages/runner/notify.py
```

An unset webhook is supported: the job still runs and still logs, it just
reports to nobody.

**2. The LaunchAgents.**

```bash
bash packages/runner/aibytes_runner/launchd/install.sh
```

That renders both plists with this checkout's absolute paths and loads them.
Re-run it after moving the repo or changing python. `--uninstall` removes them.

They are **LaunchAgents, not LaunchDaemons**, on purpose: an agent runs inside
the logged-in GUI session, which is what gives it an unlocked login keychain
and therefore working Claude Code credentials. This Mac auto-logs-in and stays
on mains power with `sleep 0`, so the session is always there.

## Running it by hand

```bash
python3 packages/runner/run.py                        # today
python3 packages/runner/run.py --date 2026-08-31      # backfill or re-run
python3 packages/runner/run.py --skip-fetch --no-push # rehearse on today's snapshots
python3 packages/runner/check.py --date 2026-08-31    # is that edition published?
```

`--date` is the same flag launchd's job takes, so a re-run after a failure is
the command the Slack message already quotes at you.

## The two jobs

| Label | When | What it does |
|---|---|---|
| `io.aibytes.edition` | 13:30 | the run above |
| `io.aibytes.watchdog` | 14:30 | checks that today's edition is on disk and in `index.json` |

The watchdog exists because a failure notification cannot report the failure
that matters most. If launchd never fires the job - the agent unloaded by an OS
update, a typo in the plist, a reboot into a strange state - then nothing
failed, so nothing was sent, and silence looks exactly like a clean run. The
watchdog is the only thing that notices.

## When it goes wrong

Logs are in `logs/YYYY-MM-DD.log` (git-ignored), one per edition date, with
every command and both its streams. `logs/launchd.edition.log` catches anything
that dies before that file is open - a bad interpreter path, an import error -
which is otherwise invisible.

```bash
launchctl list | grep io.aibytes                      # loaded? last exit code?
launchctl kickstart -p gui/$(id -u)/io.aibytes.edition # run it now
tail -f logs/$(date +%F).log
```

The Slack failure message names the step that died, quotes the last 20 lines of
the log, and gives the exact re-run command. Steps are `fetch`, `draft`,
`summaries`, `build`, `validate`, `publish`.

## Tests

```bash
python3 -m unittest tests.test_runner -v
```

Offline, and mostly about failure: that Claude exiting 0 without writing the
file still fails the run, that nothing escapes unreported, and that Slack being
down never costs an edition that already built and validated.
