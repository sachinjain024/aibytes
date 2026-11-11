#!/usr/bin/env python3
"""Thin wrapper over packages/subscribers (spec AIB-140p)."""

import pathlib
import sys

REPO = pathlib.Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "packages" / "subscribers"))

from subscribers import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
