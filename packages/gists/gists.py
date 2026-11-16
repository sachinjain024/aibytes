#!/usr/bin/env python3
"""Write the gists for one day's edition, or one weekly issue (AIB-145y).

    python3 packages/gists/gists.py draft --date 2026-11-11
    python3 packages/gists/gists.py build --date 2026-11-11 --gists .cache/gists/2026-11-11/gists.json
    python3 packages/gists/gists.py draft --issue issue-19
    python3 packages/gists/gists.py build --issue issue-19

Claude writes gists.json between the two for new full/brief rows, following
the write-gists skill. Weekly X posts are preview gists with no Claude step.
See docs/specs/AIB-145y-gist-generate.md and AIB-145y-newsletter-gist-links.md.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_gists import cli

if __name__ == "__main__":
    sys.exit(cli.main())
