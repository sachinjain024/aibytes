#!/usr/bin/env python3
"""Write the gists for one day's edition (AIB-145y).

    python3 packages/gists/gists.py draft --date 2026-11-11
    python3 packages/gists/gists.py build --date 2026-11-11 --gists .cache/gists/2026-11-11/gists.json

Claude writes gists.json between the two, following the write-gists skill.
The daily runner calls all three; see docs/specs/AIB-145y-gist-generate.md.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_gists import cli

if __name__ == "__main__":
    sys.exit(cli.main())
