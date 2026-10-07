"""The daily runner's one line out: a Slack incoming webhook.

Two rules shape everything here.

**A broken notifier must never fail a good edition.** Nothing in this module
raises. `send` reports the problem on stderr and returns False, so the runner
can say "published, but the notification did not go out" instead of throwing
away a perfectly good edition over a network blip.

**The webhook URL is a bearer credential.** Anyone holding it can post into the
workspace, and this repo is public, so it is read from the environment or from
the git-ignored `.env` and never from a default in this file. An unset webhook
is a supported configuration, not an error: the runner still logs everything.
"""

import json
import os
import pathlib
import sys
import urllib.error
import urllib.request

REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]
ENV_VAR = "AIBYTES_SLACK_WEBHOOK"
TIMEOUT = 10
# Slack truncates around 40k; the log tail is the only thing that can approach
# that, and a message too long to post is worse than a message that says less.
MAX_CHARS = 3500
TRUNCATED = "\n... (truncated, see the log)"


def read_env_file(path):
    """The git-ignored .env as a dict. Missing or malformed is not an error.

    Deliberately more forgiving than the fetchers' loader, which exits when the
    file is absent. Here an absent file just means "no webhook configured".
    """
    values = {}
    try:
        text = pathlib.Path(path).read_text()
    except OSError:
        return values
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def webhook(env_file=None):
    """The webhook URL, or None. Environment first, then .env."""
    from_env = os.environ.get(ENV_VAR, "").strip()
    if from_env:
        return from_env
    path = pathlib.Path(env_file) if env_file else REPO_ROOT / ".env"
    return read_env_file(path).get(ENV_VAR) or None


def send(text, env_file=None, url=None):
    """Post one message. True if it went out, False for every other outcome.

    `url` is for the tests, which point this at a local stub rather than at
    Slack. Nothing else should pass it.
    """
    target = url or webhook(env_file)
    if not target:
        print(f"note: {ENV_VAR} is not set, so this went nowhere:\n{text}",
              file=sys.stderr)
        return False

    body = json.dumps({"text": _clip(text)}).encode("utf-8")
    request = urllib.request.Request(
        target, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            if response.status != 200:
                print(f"note: Slack answered {response.status}", file=sys.stderr)
                return False
            return True
    except (urllib.error.URLError, OSError, ValueError) as exc:
        # Never let this reach the caller: see the module docstring.
        print(f"note: could not reach Slack ({exc})", file=sys.stderr)
        return False


def _clip(text):
    if len(text) <= MAX_CHARS:
        return text
    return text[:MAX_CHARS - len(TRUNCATED)] + TRUNCATED


# --------------------------------------------------------------------------
# The three messages. Each one is written to be read on a phone.
# --------------------------------------------------------------------------

def published(date, counts, sha, log_path, warnings=()):
    """One line, so that silence means something.

    Warnings ride along on the success message rather than getting their own:
    a partial fetch still published an edition, and two messages for one run
    trains you to ignore both.
    """
    total = sum(counts.values()) if counts else 0
    split = "  ".join(f"{name} {n}" for name, n in (counts or {}).items() if n)
    parts = [f":white_check_mark: *aiBytes_ {date}* published - {total} item(s)"]
    if split:
        parts.append(f"    {split}")
    for warning in warnings or ():
        parts.append(f"    :warning: {warning}")
    if sha:
        parts.append(f"    commit `{sha}`")
    parts.append(f"    log `{log_path}`")
    return "\n".join(parts)


def failed(date, step, detail, tail, log_path, rerun):
    """Loud, and actionable from a phone: what died, and the exact re-run."""
    parts = [
        f":rotating_light: *aiBytes_ {date} failed* at step `{step}`",
        f"    {detail}",
    ]
    if tail:
        parts.append(f"```\n{tail}\n```")
    parts.append(f"    log `{log_path}`")
    parts.append(f"    re-run: `{rerun}`")
    return "\n".join(parts)


def missing(date, expected, log_path):
    """The watchdog's message - the one a failure notification cannot send.

    If launchd never fired the job, nothing failed, so nothing was sent. This
    is the only message that catches that.
    """
    return "\n".join([
        f":warning: *no aiBytes_ edition for {date}*",
        f"    expected `{expected}` and it is not there",
        "    the daily job did not run, or it died before it could report",
        f"    check `{log_path}`, then re-run:",
        f"    `python3 packages/runner/run.py --date {date}`",
    ])


def main(argv=None):
    """A test ping, for confirming the webhook works before trusting it."""
    import argparse

    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("message", nargs="?",
                        default=":wave: aiBytes_ notification test",
                        help="what to post (default: a test ping)")
    parser.add_argument("--env-file", default=None,
                        help="path to .env (default: repo root)")
    args = parser.parse_args(argv)

    if not webhook(args.env_file):
        print(f"error: {ENV_VAR} is not set in the environment or .env",
              file=sys.stderr)
        return 1
    if not send(args.message, env_file=args.env_file):
        return 1
    print("sent")
    return 0
