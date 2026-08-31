#!/usr/bin/env python3
"""Entry point for scheduled fetches: python3 packages/fetchers/fetch.py --cadence daily"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from aibytes_fetchers.cli import main

if __name__ == "__main__":
    sys.exit(main())
