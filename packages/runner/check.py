#!/usr/bin/env python3
"""Is today's edition actually published? The watchdog launchd runs at 14:30.

    python3 packages/runner/check.py
    python3 packages/runner/check.py --date 2026-08-31 --no-notify

Exits non-zero and posts to Slack when the edition is missing - the one failure
mode the runner's own notification cannot report, because a job that never ran
never fails.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_runner import watchdog

if __name__ == "__main__":
    sys.exit(watchdog.main())
