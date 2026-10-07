#!/usr/bin/env python3
"""Post one message to the aiBytes_ Slack, for confirming the webhook works.

    python3 packages/runner/notify.py
    python3 packages/runner/notify.py "the webhook is alive"

Reads AIBYTES_SLACK_WEBHOOK from the environment or the git-ignored .env.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_runner import notify

if __name__ == "__main__":
    sys.exit(notify.main())
