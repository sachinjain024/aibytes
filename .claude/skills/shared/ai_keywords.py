"""Back-compat shim: the vocabulary now lives in packages/fetchers.

Kept so anything importing `ai_keywords` by the old path keeps working.
New code should import `aibytes_fetchers.keywords` directly.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[3] / "packages" / "fetchers"))

from aibytes_fetchers.keywords import *  # noqa: F401,F403
from aibytes_fetchers.keywords import ACRONYMS, DOMAINS, PHRASES, compile_patterns  # noqa: F401
