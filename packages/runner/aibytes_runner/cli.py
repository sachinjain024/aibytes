"""The daily edition pipeline: fetch, curate, publish, and say so in Slack.

    fetch -> draft -> Claude writes the summaries -> build -> validate -> push

Claude is one bounded step inside a deterministic script, not the orchestrator
around it. That is the whole design, and the reason is exit codes: `claude -p`
exits 0 whenever the model finishes its turn, whether or not the work happened,
so a failed run would look exactly like a good one. `build` and `validate.py`
are the gates that actually decide whether an edition is real, and they are
plain Python that already refuses to publish anything the contract rejects.

Claude gets Read and Write and nothing else here - no Bash, no network, no git.
It reads `curation.json`, writes `summaries.json`, and stops. The script does
every other step itself.
"""

import argparse
import datetime
import json
import os
import pathlib
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]

# Where the day's files live is curate's decision, not ours. Importing its
# helper is how the runner and `curate.py` are kept from ever disagreeing about
# the path to a curation request - the same reason curate imports the contract
# rather than restating it.
sys.path.insert(0, str(REPO_ROOT / "packages" / "curate"))
from aibytes_curate import edition as edition_mod  # noqa: E402

from . import notify  # noqa: E402

BRANCH = "main"
LOG_DIR = "logs"
SUMMARIES_FILENAME = "summaries.json"
# Only these ever get committed. Never `git add -A`: this repo is public, and a
# scheduled job with push rights should not be able to sweep up a stray file.
PUBLISH_PATHS = ("content", "newsletter/data")
TAIL_LINES = 20
DEFAULT_MODEL = "opus"
DEFAULT_MAX_TURNS = 60
# Generous: the fetchers hit four sites and Claude writes ~35 summaries.
STEP_TIMEOUT = 60 * 30

PROMPT = """/curate-edition {date}

The draft step has already run. Do only this, and nothing else:

1. Read {curation}
2. Write {summaries} - one entry for every id in that file, each with a
   `summary` and 1-4 `tags`, following the voice rules and the tag rules in
   the curate-edition skill. Use the tag vocabulary carried inline in
   curation.json.

Do NOT run the build step, do NOT touch content/, and do NOT run git. This is
a scheduled run and the script does all of that itself once you are done.
Write the file, then stop.
"""


class StepError(Exception):
    """A step failed. Carries the step name so the Slack message can say which."""

    def __init__(self, step, detail):
        super().__init__(f"{step}: {detail}")
        self.step = step
        self.detail = detail


# --------------------------------------------------------------------------
# Logging
# --------------------------------------------------------------------------

class Log:
    """Appends to logs/YYYY-MM-DD.log and echoes, and remembers the tail.

    The tail is what goes into a failure notification, which is the whole
    reason this keeps its own copy rather than shelling out to `tail` later.
    """

    def __init__(self, path, echo=True):
        self.path = pathlib.Path(path)
        self.echo = echo
        self.lines = []
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._handle = self.path.open("a", encoding="utf-8")

    def line(self, text=""):
        for one in str(text).splitlines() or [""]:
            stamp = datetime.datetime.now().strftime("%H:%M:%S")
            self.lines.append(one)
            self._handle.write(f"{stamp}  {one}\n")
            if self.echo:
                print(one)
        self._handle.flush()

    def block(self, title, text):
        if not (text or "").strip():
            return
        self.line(f"--- {title} ---")
        self.line(text.rstrip())
        self.line(f"--- end {title} ---")

    def tail(self, count=TAIL_LINES):
        return "\n".join(self.lines[-count:])

    def close(self):
        self._handle.close()


# --------------------------------------------------------------------------
# Context
# --------------------------------------------------------------------------

class Context:
    def __init__(self, args):
        self.date = args.date
        self.data_root = args.data_root
        self.content_root = args.content_root
        self.python = args.python or sys.executable
        self.claude = args.claude
        self.model = args.model
        self.max_turns = args.max_turns
        self.skip_fetch = args.skip_fetch
        self.push = args.push
        self.env_file = args.env_file
        self.echo = args.echo
        self.repo = pathlib.Path(args.repo).resolve()
        self.log_path = self.repo / LOG_DIR / f"{self.date}.log"
        self.curation = edition_mod.day_path(
            self.data_root, self.date, edition_mod.CURATION_FILENAME)
        self.summaries = edition_mod.day_path(
            self.data_root, self.date, SUMMARIES_FILENAME)
        self.edition = self.repo / edition_mod.edition_path(
            self.content_root, self.date)
        self.counts = {}
        self.sha = ""
        self.warnings = []
        self.log = None

    @property
    def rerun(self):
        return f"python3 packages/runner/run.py --date {self.date}"

    def shown(self, path):
        try:
            return str(pathlib.Path(path).relative_to(self.repo))
        except ValueError:
            return str(path)


# --------------------------------------------------------------------------
# Running things
# --------------------------------------------------------------------------

def run_command(ctx, step, argv, timeout=STEP_TIMEOUT, check=True):
    """Run one subprocess, log both streams, raise StepError on failure.

    Output is captured rather than streamed so that the log and the Slack tail
    hold exactly the same text. A scheduled job has nobody watching it live.

    `check=False` returns the result whatever the exit code, for the one step
    where a non-zero exit is not fatal - see `step_fetch`.
    """
    ctx.log.line(f"$ {' '.join(str(a) for a in argv)}")
    try:
        done = subprocess.run(
            [str(a) for a in argv], cwd=ctx.repo, capture_output=True,
            text=True, timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise StepError(step, f"command not found: {exc.filename}") from exc
    except subprocess.TimeoutExpired as exc:
        raise StepError(step, f"timed out after {timeout}s") from exc

    ctx.log.block("stdout", done.stdout or "")
    ctx.log.block("stderr", done.stderr or "")
    if check and done.returncode != 0:
        raise StepError(step, f"exited {done.returncode}")
    return done


# --------------------------------------------------------------------------
# The steps
# --------------------------------------------------------------------------

def step_fetch(ctx):
    """Fetch every source, and do not let one bad source cost the edition.

    `fetch.py` stops at the first failure and exits non-zero. Curate is
    explicitly happy to build from the sources that did answer - "a missing
    source is not an error" - so the runner asks for --keep-going and treats a
    partial fetch as a warning it carries into the Slack message rather than as
    a dead run. A total failure is still caught, one step later and with a
    better message: `draft` has no snapshots at all and says so.
    """
    if ctx.skip_fetch:
        ctx.log.line("skipping fetch (--skip-fetch); re-using the day's snapshots")
        return
    done = run_command(ctx, "fetch", [
        ctx.python, "packages/fetchers/fetch.py",
        "--cadence", "daily", "--date", ctx.date, "--keep-going",
    ], check=False)
    if done.returncode != 0:
        ctx.warnings.append(f"fetch: {_failed_sources(done.stderr)}")
        ctx.log.line(f"warning: {ctx.warnings[-1]}; "
                     f"building the edition from the sources that answered")


def _failed_sources(stderr):
    """The "failed: a, b" line fetch.py prints, or a fallback."""
    for line in reversed((stderr or "").splitlines()):
        if line.startswith("failed: "):
            return line[len("failed: "):].strip()
    return "one or more sources failed"


def step_draft(ctx):
    run_command(ctx, "draft", [
        ctx.python, "packages/curate/curate.py", "draft",
        "--date", ctx.date,
        "--data-root", ctx.data_root,
        "--content-root", ctx.content_root,
    ])
    if not pathlib.Path(ctx.curation).exists():
        raise StepError("draft", f"{ctx.shown(ctx.curation)} was not written")


def step_summaries(ctx):
    """The one step that needs a model. Everything around it is deterministic."""
    prompt = PROMPT.format(
        date=ctx.date,
        curation=ctx.shown(ctx.curation),
        summaries=ctx.shown(ctx.summaries),
    )
    done = run_command(ctx, "summaries", [
        ctx.claude, "--print", prompt,
        "--model", ctx.model,
        "--permission-mode", "acceptEdits",
        # Read and Write are all it needs. No Bash means it cannot run build,
        # cannot touch git, and cannot reach the network.
        "--allowedTools", "Read,Write,Edit,Glob,Grep",
        "--disallowedTools", "Bash,WebFetch,WebSearch",
        "--max-turns", str(ctx.max_turns),
        "--output-format", "json",
    ])
    _report_claude(ctx, done.stdout)
    _check_summaries(ctx)


def _report_claude(ctx, stdout):
    """Log what the session cost. Never fail on a shape we did not expect."""
    try:
        result = json.loads(stdout)
    except (ValueError, TypeError):
        ctx.log.line("note: could not parse Claude's JSON result; "
                     "the summaries file is the thing that matters")
        return
    if isinstance(result, dict):
        if result.get("is_error"):
            raise StepError("summaries", "Claude reported an error: "
                            f"{str(result.get('result'))[:400]}")
        turns = result.get("num_turns")
        cost = result.get("total_cost_usd")
        said = ["Claude finished"]
        if isinstance(turns, int):
            said.append(f"{turns} turn(s)")
        if isinstance(cost, (int, float)):
            said.append(f"${cost:.2f}")
        ctx.log.line(", ".join(said))


def _check_summaries(ctx):
    """Exists, parses, and is not empty.

    Deliberately shallow. `build` is the authority on whether the file covers
    exactly this edition's ids, and duplicating that check here would give the
    contract two homes. This only catches the failure that `build` would report
    confusingly: Claude finishing its turn without writing the file at all.
    """
    path = pathlib.Path(ctx.summaries)
    if not path.exists():
        raise StepError("summaries",
                        f"Claude finished without writing {ctx.shown(path)}")
    try:
        written = json.loads(path.read_text())
    except ValueError as exc:
        raise StepError("summaries",
                        f"{ctx.shown(path)} is not valid JSON: {exc}") from exc
    items = written.get("items") if isinstance(written, dict) else None
    if not items:
        raise StepError("summaries", f"{ctx.shown(path)} has no items")
    ctx.log.line(f"summaries written for {len(items)} item(s)")


def step_build(ctx):
    run_command(ctx, "build", [
        ctx.python, "packages/curate/curate.py", "build",
        "--date", ctx.date,
        "--summaries", str(ctx.summaries),
        "--data-root", ctx.data_root,
        "--content-root", ctx.content_root,
    ])
    if not ctx.edition.exists():
        raise StepError("build", f"{ctx.shown(ctx.edition)} was not written")
    ctx.counts = _counts(ctx.edition)


def _counts(path):
    try:
        return json.loads(pathlib.Path(path).read_text()).get("counts", {}) or {}
    except (OSError, ValueError):
        return {}


def step_validate(ctx):
    run_command(ctx, "validate", [
        ctx.python, "packages/feed-schema/validate.py",
        "--content-root", ctx.content_root,
    ])


def step_publish(ctx):
    if not ctx.push:
        ctx.log.line("skipping commit and push (--no-push)")
        return
    branch = run_command(ctx, "publish", [
        "git", "rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
    if branch != BRANCH:
        raise StepError("publish",
                        f"on branch {branch}, not {BRANCH}; refusing to push")

    run_command(ctx, "publish", ["git", "add", "--"] + list(PUBLISH_PATHS))
    staged = subprocess.run(
        ["git", "diff", "--cached", "--quiet"], cwd=ctx.repo)
    if staged.returncode == 0:
        ctx.log.line("nothing changed, so nothing to commit")
        return

    total = sum(ctx.counts.values())
    run_command(ctx, "publish", [
        "git", "commit", "-m", f"edition {ctx.date} ({total} items)"])
    ctx.sha = run_command(
        ctx, "publish", ["git", "rev-parse", "--short", "HEAD"]).stdout.strip()
    _push(ctx)
    ctx.log.line(f"pushed {ctx.sha} to {BRANCH}")


def _push(ctx):
    """Push, and rebase once if someone else got there first.

    The scheduled job is the only writer on most days, but the Actions fallback
    and a manual commit can both land between this run's fetch and its push. A
    single rebase-and-retry handles that; anything worse is a human's problem
    and the notification says so.
    """
    first = subprocess.run(["git", "push", "origin", BRANCH],
                           cwd=ctx.repo, capture_output=True, text=True)
    if first.returncode == 0:
        return
    ctx.log.block("push rejected", (first.stdout or "") + (first.stderr or ""))
    ctx.log.line("rebasing onto origin/main and retrying once")
    run_command(ctx, "publish", ["git", "pull", "--rebase", "origin", BRANCH])
    run_command(ctx, "publish", ["git", "push", "origin", BRANCH])
    ctx.sha = run_command(
        ctx, "publish", ["git", "rev-parse", "--short", "HEAD"]).stdout.strip()


STEPS = (
    ("fetch", step_fetch),
    ("draft", step_draft),
    ("summaries", step_summaries),
    ("build", step_build),
    ("validate", step_validate),
    ("publish", step_publish),
)


# --------------------------------------------------------------------------
# The run
# --------------------------------------------------------------------------

def run(ctx):
    ctx.log = Log(ctx.log_path, echo=ctx.echo)
    started = datetime.datetime.now().astimezone()
    ctx.log.line(f"=== aiBytes_ edition {ctx.date} - {started:%Y-%m-%d %H:%M:%S %Z} ===")
    try:
        for name, step in STEPS:
            ctx.log.line(f"[{name}]")
            step(ctx)
    except StepError as exc:
        return _fail(ctx, exc.step, exc.detail)
    except Exception as exc:  # noqa: BLE001 - see below
        # A traceback with no Slack message is the exact silent failure this
        # whole runner exists to prevent, so nothing gets to escape unreported.
        ctx.log.line(f"unexpected error: {exc!r}")
        return _fail(ctx, "runner", repr(exc))

    took = (datetime.datetime.now().astimezone() - started).total_seconds()
    ctx.log.line(f"done in {took:.0f}s")
    notify.send(
        notify.published(ctx.date, ctx.counts, ctx.sha, ctx.shown(ctx.log_path),
                         ctx.warnings),
        env_file=ctx.env_file)
    ctx.log.close()
    return 0


def _fail(ctx, step, detail):
    ctx.log.line(f"FAILED at {step}: {detail}")
    notify.send(
        notify.failed(ctx.date, step, detail, ctx.log.tail(),
                      ctx.shown(ctx.log_path), ctx.rerun),
        env_file=ctx.env_file)
    ctx.log.close()
    return 1


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def today():
    return datetime.date.today().isoformat()


def build_parser(prog="run.py"):
    parser = argparse.ArgumentParser(
        prog=prog, description=__doc__.splitlines()[0])
    parser.add_argument("--date", default=None,
                        help="the edition date, YYYY-MM-DD (default today)")
    parser.add_argument("--data-root", default=edition_mod.DEFAULT_DATA_ROOT,
                        help="where the raw snapshots are")
    parser.add_argument("--content-root", "--output-root", dest="content_root",
                        default=edition_mod.DEFAULT_CONTENT_ROOT,
                        help="the published content tree")
    parser.add_argument("--repo", default=str(REPO_ROOT),
                        help="the working tree to run in")
    parser.add_argument("--skip-fetch", action="store_true",
                        help="re-use the day's snapshots instead of fetching")
    parser.add_argument("--no-push", dest="push", action="store_false",
                        help="build and validate, but do not commit or push")
    parser.add_argument("--python", default=None,
                        help="the interpreter for the pipeline steps")
    parser.add_argument("--claude", default="claude",
                        help="the claude executable")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"model for the summaries step (default {DEFAULT_MODEL})")
    parser.add_argument("--max-turns", type=int, default=DEFAULT_MAX_TURNS,
                        help=f"cap on the summaries session (default {DEFAULT_MAX_TURNS})")
    parser.add_argument("--env-file", default=None,
                        help="path to .env, for the Slack webhook")
    parser.add_argument("--quiet", dest="echo", action="store_false",
                        help="log to the file only, not to stdout")
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    args.date = args.date or today()
    return run(Context(args))
