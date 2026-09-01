"""Tests for the daily runner (packages/runner).

The runner exists to make failure loud, so these tests are mostly about
failure. Three things have to hold, and each of them is a way a silent miss
happens in production:

- **Claude's exit code is not the gate.** `claude -p` exits 0 whenever the
  model finishes its turn, so a session that never wrote the file must still
  fail the run.
- **Nothing escapes unreported.** Every step failure, and any unexpected
  exception, has to reach the notifier and produce a non-zero exit.
- **A broken notifier never fails a good edition.** Slack being down is not a
  reason to throw away an edition that built and validated.

The end-to-end test drives the real argv construction against stub executables,
because that is where the breakable details live: flag names, and whether the
prompt actually tells Claude where to write. Nothing here touches the network
or the real Slack webhook.
"""

import http.server
import json
import os
import pathlib
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest import mock

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "packages" / "runner"))

from aibytes_runner import cli, notify, watchdog  # noqa: E402

DATE = "2026-08-31"


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def context(tmp, **overrides):
    """A Context built the way main() builds one, pointed at a temp tree."""
    argv = [
        "--date", DATE,
        "--repo", str(tmp),
        "--data-root", str(tmp / "newsletter" / "data"),
        "--content-root", str(tmp / "content"),
        "--python", sys.executable,
        "--quiet",
    ]
    for flag, value in overrides.items():
        argv.append(f"--{flag.replace('_', '-')}")
        if value is not None:
            argv.append(str(value))
    args = cli.build_parser().parse_args(argv)
    return cli.Context(args)


class Recorder:
    """Stands in for notify.send and remembers what would have gone out."""

    def __init__(self, result=True):
        self.messages = []
        self.result = result

    def __call__(self, text, **kwargs):
        self.messages.append(text)
        return self.result

    @property
    def only(self):
        assert len(self.messages) == 1, self.messages
        return self.messages[0]


class SlackStub(http.server.BaseHTTPRequestHandler):
    """A local stand-in for hooks.slack.com. status is set per test."""

    status = 200
    received = []

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        SlackStub.received.append(json.loads(self.rfile.read(length)))
        self.send_response(SlackStub.status)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *args):
        pass


class QuietServer(http.server.HTTPServer):
    """HTTPServer without the reverse DNS lookup.

    `HTTPServer.server_bind` calls `socket.getfqdn()`, which on a machine with
    no reverse record for its own address stalls for tens of seconds - per
    test. Nothing here needs the resolved name.
    """

    def server_bind(self):
        socketserver.TCPServer.server_bind(self)
        self.server_name = "127.0.0.1"
        self.server_port = self.server_address[1]


# --------------------------------------------------------------------------
# notify: reading the webhook
# --------------------------------------------------------------------------

class EnvFileTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.env = self.tmp / ".env"

    def test_parses_and_ignores_noise(self):
        self.env.write_text(
            "# a comment\n"
            "\n"
            "PH_API_KEY=abc\n"
            'AIBYTES_SLACK_WEBHOOK="https://example.test/hook"\n'
            "not a pair\n"
        )
        values = notify.read_env_file(self.env)
        self.assertEqual(values["PH_API_KEY"], "abc")
        self.assertEqual(values["AIBYTES_SLACK_WEBHOOK"], "https://example.test/hook")

    def test_missing_file_is_not_an_error(self):
        # An unset webhook is a supported configuration, not a crash.
        self.assertEqual(notify.read_env_file(self.tmp / "nope"), {})

    def test_environment_wins_over_env_file(self):
        self.env.write_text("AIBYTES_SLACK_WEBHOOK=https://from-file.test\n")
        with mock.patch.dict(os.environ,
                             {notify.ENV_VAR: "https://from-env.test"}):
            self.assertEqual(notify.webhook(self.env), "https://from-env.test")

    def test_falls_back_to_the_env_file(self):
        self.env.write_text("AIBYTES_SLACK_WEBHOOK=https://from-file.test\n")
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(notify.webhook(self.env), "https://from-file.test")

    def test_no_webhook_anywhere_is_none(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(notify.webhook(self.tmp / "nope"))


# --------------------------------------------------------------------------
# notify: sending
# --------------------------------------------------------------------------

class SendTest(unittest.TestCase):
    def setUp(self):
        SlackStub.received = []
        SlackStub.status = 200
        self.server = QuietServer(("127.0.0.1", 0), SlackStub)
        thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(self.server.shutdown)
        self.url = "http://127.0.0.1:%d/hook" % self.server.server_address[1]

    def test_posts_the_message(self):
        self.assertTrue(notify.send("hello", url=self.url))
        self.assertEqual(SlackStub.received, [{"text": "hello"}])

    def test_a_slack_error_returns_false_without_raising(self):
        SlackStub.status = 500
        with mock.patch("sys.stderr"):
            self.assertFalse(notify.send("hello", url=self.url))

    def test_an_unreachable_webhook_returns_false_without_raising(self):
        # The point of the whole module: Slack being down must never become an
        # exception in the middle of a good run.
        with mock.patch("sys.stderr"):
            self.assertFalse(notify.send("hello", url="http://127.0.0.1:1/nope"))

    def test_no_webhook_configured_returns_false_without_raising(self):
        with mock.patch.dict(os.environ, {}, clear=True), mock.patch("sys.stderr"):
            self.assertFalse(notify.send("hello", env_file="/nonexistent/.env"))

    def test_a_long_message_is_clipped_to_something_slack_accepts(self):
        self.assertTrue(notify.send("x" * 50000, url=self.url))
        self.assertLessEqual(len(SlackStub.received[0]["text"]), notify.MAX_CHARS)


class MessageTest(unittest.TestCase):
    def test_success_carries_the_date_and_the_counts(self):
        text = notify.published(DATE, {"Launches": 5, "News": 3}, "abc1234",
                                f"logs/{DATE}.log")
        self.assertIn(DATE, text)
        self.assertIn("8 item", text)
        self.assertIn("abc1234", text)

    def test_failure_carries_the_step_and_the_rerun_command(self):
        text = notify.failed(DATE, "build", "exited 1", "traceback",
                             f"logs/{DATE}.log", f"run.py --date {DATE}")
        self.assertIn("build", text)
        self.assertIn("traceback", text)
        # Actionable from a phone is the whole point.
        self.assertIn(f"run.py --date {DATE}", text)

    def test_a_partial_fetch_rides_along_on_the_success_message(self):
        # One message per run: a partial fetch still published an edition, and
        # two messages for one run trains you to ignore both.
        text = notify.published(DATE, {"News": 3}, "abc1234", "logs/x.log",
                                ["fetch: producthunt"])
        self.assertIn("published", text)
        self.assertIn("producthunt", text)

    def test_the_watchdog_message_says_the_job_may_never_have_run(self):
        text = notify.missing(DATE, "content/editions/x.json", "logs/x.log")
        self.assertIn(DATE, text)
        self.assertIn("did not run", text)


# --------------------------------------------------------------------------
# The watchdog
# --------------------------------------------------------------------------

class WatchdogTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.content = self.tmp / "content"
        (self.content / "editions").mkdir(parents=True)

    def publish(self, counts=None, date=DATE, listed=True):
        (self.content / "editions" / f"{date}.json").write_text(json.dumps({
            "date": date, "counts": counts if counts is not None else {"News": 4},
        }))
        (self.content / "index.json").write_text(json.dumps({
            "editions": [{"date": date}] if listed else [],
        }))

    def test_a_published_edition_has_no_problems(self):
        self.publish()
        self.assertEqual(watchdog.problems(self.content, DATE), [])

    def test_a_missing_edition_is_reported(self):
        (self.content / "index.json").write_text('{"editions": []}')
        found = watchdog.problems(self.content, DATE)
        self.assertTrue(any("does not exist" in p for p in found))

    def test_an_edition_missing_from_the_index_is_reported(self):
        self.publish(listed=False)
        found = watchdog.problems(self.content, DATE)
        self.assertTrue(any("does not list" in p for p in found))

    def test_an_empty_edition_is_reported(self):
        self.publish(counts={"News": 0})
        found = watchdog.problems(self.content, DATE)
        self.assertTrue(any("no items" in p for p in found))

    def test_a_mismatched_date_is_reported(self):
        self.publish(date=DATE)
        found = watchdog.problems(self.content, "2026-09-01")
        self.assertTrue(any("does not exist" in p for p in found))

    def test_unreadable_json_is_reported_rather_than_raised(self):
        (self.content / "editions" / f"{DATE}.json").write_text("{not json")
        found = watchdog.problems(self.content, DATE)
        self.assertTrue(any("not valid JSON" in p for p in found))

    def test_main_exits_non_zero_and_notifies_when_the_edition_is_missing(self):
        (self.content / "index.json").write_text('{"editions": []}')
        recorder = Recorder()
        with mock.patch.object(notify, "send", recorder), mock.patch("sys.stderr"):
            code = watchdog.main(["--date", DATE,
                                  "--content-root", str(self.content)])
        self.assertEqual(code, 1)
        self.assertIn(DATE, recorder.only)


# --------------------------------------------------------------------------
# Running steps
# --------------------------------------------------------------------------

class RunCommandTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.ctx = context(self.tmp)
        self.ctx.log = cli.Log(self.tmp / "run.log", echo=False)
        self.addCleanup(self.ctx.log.close)

    def test_a_non_zero_exit_names_the_step(self):
        with self.assertRaises(cli.StepError) as caught:
            cli.run_command(self.ctx, "build", [sys.executable, "-c", "raise SystemExit(3)"])
        self.assertEqual(caught.exception.step, "build")
        self.assertIn("exited 3", caught.exception.detail)

    def test_a_missing_executable_is_a_step_failure_not_a_traceback(self):
        with self.assertRaises(cli.StepError) as caught:
            cli.run_command(self.ctx, "fetch", ["/nonexistent/binary"])
        self.assertIn("not found", caught.exception.detail)

    def test_a_hung_step_times_out(self):
        with self.assertRaises(cli.StepError) as caught:
            cli.run_command(self.ctx, "fetch",
                            [sys.executable, "-c", "import time; time.sleep(5)"],
                            timeout=1)
        self.assertIn("timed out", caught.exception.detail)

    def test_both_streams_reach_the_log(self):
        cli.run_command(self.ctx, "draft", [
            sys.executable, "-c",
            "import sys; print('out'); print('err', file=sys.stderr)"])
        self.assertIn("out", self.ctx.log.tail())
        self.assertIn("err", self.ctx.log.tail())


class SummariesGateTest(unittest.TestCase):
    """Claude's exit code is not the gate; the file it wrote is."""

    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.ctx = context(self.tmp)
        self.ctx.log = cli.Log(self.tmp / "run.log", echo=False)
        self.addCleanup(self.ctx.log.close)
        pathlib.Path(self.ctx.summaries).parent.mkdir(parents=True, exist_ok=True)

    def write(self, text):
        pathlib.Path(self.ctx.summaries).write_text(text)

    def test_a_session_that_wrote_nothing_fails_the_run(self):
        with self.assertRaises(cli.StepError) as caught:
            cli._check_summaries(self.ctx)
        self.assertIn("without writing", caught.exception.detail)

    def test_unparseable_summaries_fail_the_run(self):
        self.write("{not json")
        with self.assertRaises(cli.StepError):
            cli._check_summaries(self.ctx)

    def test_an_empty_summaries_file_fails_the_run(self):
        self.write(json.dumps({"date": DATE, "items": {}}))
        with self.assertRaises(cli.StepError) as caught:
            cli._check_summaries(self.ctx)
        self.assertIn("no items", caught.exception.detail)

    def test_a_written_file_passes(self):
        self.write(json.dumps({"date": DATE, "items": {
            "ph-x": {"summary": "s", "tags": ["Launch"]}}}))
        cli._check_summaries(self.ctx)  # does not raise

    def test_claude_reporting_an_error_fails_the_run(self):
        with self.assertRaises(cli.StepError):
            cli._report_claude(self.ctx, json.dumps(
                {"is_error": True, "result": "hit the turn limit"}))

    def test_an_unexpected_result_shape_is_tolerated(self):
        # The summaries file is the thing that matters; an unfamiliar result
        # envelope must not fail an otherwise-good run.
        cli._report_claude(self.ctx, "not json at all")
        cli._report_claude(self.ctx, json.dumps(["unexpected"]))


# --------------------------------------------------------------------------
# The run as a whole
# --------------------------------------------------------------------------

class RunTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.ctx = context(self.tmp)
        self.recorder = Recorder()
        patch = mock.patch.object(notify, "send", self.recorder)
        patch.start()
        self.addCleanup(patch.stop)

    def test_a_clean_run_reports_the_edition(self):
        self.ctx.counts = {}

        def ok(ctx):
            ctx.counts = {"News": 2}
            ctx.sha = "abc1234"

        with mock.patch.object(cli, "STEPS", (("build", ok),)):
            self.assertEqual(cli.run(self.ctx), 0)
        self.assertIn("published", self.recorder.only)
        self.assertIn("abc1234", self.recorder.only)

    def test_a_failing_step_exits_non_zero_and_names_the_step(self):
        def boom(ctx):
            raise cli.StepError("validate", "content/ is not valid")

        with mock.patch.object(cli, "STEPS", (("validate", boom),)):
            self.assertEqual(cli.run(self.ctx), 1)
        self.assertIn("validate", self.recorder.only)
        self.assertIn("failed", self.recorder.only)

    def test_an_unexpected_exception_is_still_reported(self):
        # A traceback with no Slack message is the exact silent failure the
        # runner exists to prevent.
        def boom(ctx):
            raise ZeroDivisionError("surprise")

        with mock.patch.object(cli, "STEPS", (("draft", boom),)):
            self.assertEqual(cli.run(self.ctx), 1)
        self.assertIn("ZeroDivisionError", self.recorder.only)

    def test_a_broken_notifier_does_not_fail_a_good_edition(self):
        self.recorder.result = False
        with mock.patch.object(cli, "STEPS", (("build", lambda ctx: None),)):
            self.assertEqual(cli.run(self.ctx), 0)

    def test_the_run_is_written_to_the_day_log(self):
        with mock.patch.object(cli, "STEPS", (("build", lambda ctx: None),)):
            cli.run(self.ctx)
        self.assertIn(DATE, pathlib.Path(self.ctx.log_path).read_text())

    def test_the_log_path_is_named_for_the_edition_date(self):
        self.assertEqual(pathlib.Path(self.ctx.log_path).name, f"{DATE}.log")


# --------------------------------------------------------------------------
# Publishing
# --------------------------------------------------------------------------

def git(*args, cwd):
    subprocess.run(["git"] + list(args), cwd=str(cwd), check=True,
                   capture_output=True, text=True)


@unittest.skipIf(shutil.which("git") is None, "git is not installed")
class PublishTest(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.origin = self.tmp / "origin.git"
        self.work = self.tmp / "work"
        subprocess.run(["git", "init", "--bare", "-b", "main", str(self.origin)],
                       check=True, capture_output=True)
        subprocess.run(["git", "clone", str(self.origin), str(self.work)],
                       check=True, capture_output=True)
        git("config", "user.email", "test@example.test", cwd=self.work)
        git("config", "user.name", "Test", cwd=self.work)
        git("checkout", "-B", "main", cwd=self.work)
        (self.work / "content" / "editions").mkdir(parents=True)
        (self.work / "newsletter" / "data").mkdir(parents=True)
        (self.work / "content" / "index.json").write_text("{}")
        git("add", "-A", cwd=self.work)
        git("commit", "-m", "initial", cwd=self.work)
        git("push", "-u", "origin", "main", cwd=self.work)

        self.ctx = context(self.work)
        self.ctx.log = cli.Log(self.tmp / "run.log", echo=False)
        self.addCleanup(self.ctx.log.close)
        self.ctx.counts = {"News": 3}

    def edition(self):
        (self.work / "content" / "editions" / f"{DATE}.json").write_text(
            '{"date": "%s"}' % DATE)

    def test_it_commits_and_pushes_the_edition(self):
        self.edition()
        cli.step_publish(self.ctx)
        self.assertTrue(self.ctx.sha)
        remote = subprocess.run(
            ["git", "log", "--oneline", "-1", "main"], cwd=str(self.origin),
            capture_output=True, text=True, check=True)
        self.assertIn(DATE, remote.stdout)

    def test_it_refuses_to_push_from_another_branch(self):
        git("checkout", "-b", "issue-06", cwd=self.work)
        self.edition()
        with self.assertRaises(cli.StepError) as caught:
            cli.step_publish(self.ctx)
        self.assertIn("refusing to push", caught.exception.detail)

    def test_nothing_to_commit_is_not_a_failure(self):
        cli.step_publish(self.ctx)  # does not raise
        self.assertEqual(self.ctx.sha, "")

    def test_it_only_stages_the_published_paths(self):
        # A scheduled job with push rights must not be able to sweep up a
        # stray file in a public repo.
        self.edition()
        (self.work / "scratch.txt").write_text("not for the world")
        cli.step_publish(self.ctx)
        tracked = subprocess.run(
            ["git", "ls-files"], cwd=str(self.work),
            capture_output=True, text=True, check=True).stdout
        self.assertNotIn("scratch.txt", tracked)

    def test_no_push_leaves_the_tree_alone(self):
        self.edition()
        self.ctx.push = False
        cli.step_publish(self.ctx)
        status = subprocess.run(
            ["git", "status", "--porcelain", "-uall"], cwd=str(self.work),
            capture_output=True, text=True, check=True).stdout
        self.assertIn(f"{DATE}.json", status)


# --------------------------------------------------------------------------
# End to end, against stub executables
# --------------------------------------------------------------------------

STUB_FETCH = """#!/usr/bin/env python3
import sys
print("fetched", sys.argv[1:])
"""

STUB_CURATE = r'''#!/usr/bin/env python3
"""Stands in for packages/curate/curate.py: draft writes a curation request,
build turns a summaries file into an edition."""
import json, pathlib, sys

args = sys.argv[1:]
command = args[0]
def value(flag):
    return args[args.index(flag) + 1]

date = value("--date")
data = pathlib.Path(value("--data-root")) / date[:4] / date[5:7] / "days" / date
content = pathlib.Path(value("--content-root"))
data.mkdir(parents=True, exist_ok=True)

if command == "draft":
    (data / "curation.json").write_text(json.dumps(
        {"date": date, "items": [{"id": "hn-1", "title": "A thing"}]}))
    print("wrote curation.json (1 item)")
else:
    written = json.loads(pathlib.Path(value("--summaries")).read_text())
    assert set(written["items"]) == {"hn-1"}, written
    (content / "editions").mkdir(parents=True, exist_ok=True)
    (content / "editions" / (date + ".json")).write_text(json.dumps(
        {"date": date, "counts": {"HN": 1}}))
    (content / "index.json").write_text(json.dumps(
        {"editions": [{"date": date}]}))
    print("wrote the edition (1 visible item)")
'''

STUB_VALIDATE = """#!/usr/bin/env python3
print("content is valid")
"""

STUB_CLAUDE = r'''#!/usr/bin/env python3
"""Stands in for `claude -p`.

It finds the summaries path in the prompt rather than being told separately,
which is how these tests check that the prompt actually tells Claude where to
write. It records its own argv so the flags can be asserted on, and it always
exits 0 - the point being that the run must not trust that.
"""
import json, os, pathlib, re, sys

pathlib.Path(os.environ["STUB_CLAUDE_ARGV"]).write_text(json.dumps(sys.argv[1:]))
prompt = "\n".join(sys.argv[1:])
match = re.search(r"(\S*summaries\.json)", prompt)
if match and os.environ.get("STUB_CLAUDE_WRITE") != "0":
    target = pathlib.Path(os.environ["STUB_CLAUDE_REPO"]) / match.group(1)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(
        {"date": "DATE", "items": {"hn-1": {"summary": "s", "tags": ["Model"]}}}))
print(json.dumps({"is_error": False, "num_turns": 4, "total_cost_usd": 0.31,
                  "result": "wrote the summaries"}))
'''


class EndToEndTest(unittest.TestCase):
    """The real argv construction, against stubs. No network, no model."""

    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        for relative, body in (
            ("packages/fetchers/fetch.py", STUB_FETCH),
            ("packages/curate/curate.py", STUB_CURATE),
            ("packages/feed-schema/validate.py", STUB_VALIDATE),
        ):
            path = self.tmp / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body)
        self.claude = self.tmp / "claude-stub"
        self.claude.write_text(STUB_CLAUDE)
        self.claude.chmod(0o755)
        self.argv_file = self.tmp / "claude-argv.json"

        self.recorder = Recorder()
        patch = mock.patch.object(notify, "send", self.recorder)
        patch.start()
        self.addCleanup(patch.stop)
        env = mock.patch.dict(os.environ, {
            "STUB_CLAUDE_ARGV": str(self.argv_file),
            "STUB_CLAUDE_REPO": str(self.tmp),
        })
        env.start()
        self.addCleanup(env.stop)

    def run_it(self, extra=()):
        argv = [
            "--date", DATE,
            "--repo", str(self.tmp),
            "--data-root", str(self.tmp / "newsletter" / "data"),
            "--content-root", str(self.tmp / "content"),
            "--python", sys.executable,
            "--claude", str(self.claude),
            "--no-push", "--quiet",
        ] + list(extra)
        return cli.main(argv)

    def test_a_full_run_publishes_the_edition(self):
        self.assertEqual(self.run_it(), 0)
        edition = self.tmp / "content" / "editions" / f"{DATE}.json"
        self.assertTrue(edition.exists())
        self.assertIn("published", self.recorder.only)
        self.assertIn("1 item", self.recorder.only)

    def test_claude_is_given_read_and_write_but_never_bash(self):
        self.run_it()
        argv = json.loads(self.argv_file.read_text())
        self.assertIn("--print", argv)
        allowed = argv[argv.index("--allowedTools") + 1]
        self.assertIn("Read", allowed)
        self.assertIn("Write", allowed)
        # No Bash means it cannot run build, cannot touch git, cannot fetch.
        self.assertNotIn("Bash", allowed)
        self.assertIn("Bash", argv[argv.index("--disallowedTools") + 1])

    def test_the_prompt_names_the_files_and_forbids_the_other_steps(self):
        self.run_it()
        prompt = "\n".join(json.loads(self.argv_file.read_text()))
        self.assertIn("curation.json", prompt)
        self.assertIn("summaries.json", prompt)
        self.assertIn("do NOT run git", prompt.replace("Do NOT", "do NOT"))

    def test_a_session_that_writes_nothing_fails_despite_exiting_zero(self):
        # The single most important test here: the stub exits 0 and prints a
        # clean result, and the run still has to fail.
        with mock.patch.dict(os.environ, {"STUB_CLAUDE_WRITE": "0"}):
            self.assertEqual(self.run_it(), 1)
        # Attribution matters, not just the exit code. Without the gate the run
        # still dies - one step later, in `build`, blaming the wrong thing -
        # and the Slack message would send you to read the curate code.
        self.assertIn("at step `summaries`", self.recorder.only)
        self.assertIn("without writing", self.recorder.only)
        self.assertFalse((self.tmp / "content" / "editions").exists())

    def test_skip_fetch_reuses_the_days_snapshots(self):
        (self.tmp / "packages" / "fetchers" / "fetch.py").write_text(
            "#!/usr/bin/env python3\nraise SystemExit('should not run')\n")
        self.assertEqual(self.run_it(["--skip-fetch"]), 0)

    def test_the_date_defaults_to_today(self):
        args = cli.build_parser().parse_args([])
        self.assertIsNone(args.date)
        self.assertRegex(cli.today(), r"^\d{4}-\d{2}-\d{2}$")


class FetchToleranceTest(unittest.TestCase):
    """One bad source must not cost the edition."""

    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.ctx = context(self.tmp)
        self.ctx.log = cli.Log(self.tmp / "run.log", echo=False)
        self.addCleanup(self.ctx.log.close)
        self.fetch = self.tmp / "packages" / "fetchers" / "fetch.py"
        self.fetch.parent.mkdir(parents=True)

    def write_fetch(self, body):
        self.fetch.write_text(body)

    def test_a_partial_fetch_is_a_warning_not_a_failure(self):
        self.write_fetch(
            "import sys\n"
            "print('==> hackernews')\n"
            "print('failed: producthunt', file=sys.stderr)\n"
            "raise SystemExit(1)\n")
        cli.step_fetch(self.ctx)  # does not raise
        self.assertEqual(self.ctx.warnings, ["fetch: producthunt"])

    def test_a_clean_fetch_warns_about_nothing(self):
        self.write_fetch("print('fetched 4 sources')\n")
        cli.step_fetch(self.ctx)
        self.assertEqual(self.ctx.warnings, [])

    def test_it_asks_the_fetchers_to_keep_going(self):
        self.write_fetch("print('ok')\n")
        cli.step_fetch(self.ctx)
        self.assertIn("--keep-going", self.ctx.log.tail())

    def test_an_unrecognisable_failure_still_warns(self):
        self.write_fetch("raise SystemExit(2)\n")
        cli.step_fetch(self.ctx)
        self.assertIn("one or more sources failed", self.ctx.warnings[0])

    def test_skip_fetch_does_not_run_it_at_all(self):
        self.write_fetch("raise SystemExit('should not run')\n")
        self.ctx.skip_fetch = True
        cli.step_fetch(self.ctx)
        self.assertEqual(self.ctx.warnings, [])


if __name__ == "__main__":
    unittest.main()
