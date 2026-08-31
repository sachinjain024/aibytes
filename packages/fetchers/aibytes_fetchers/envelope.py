"""The JSON envelope wrapped around every snapshot.

Key order is fixed and matches the snapshots already committed under
newsletter/data/, so re-running a fetch produces a clean diff rather than a
reordered file. Optional keys are omitted rather than emitted as null, again
to match what is on disk.
"""

import json


def build(source, items_key, items, *, as_of, query_params, total_count,
          section=None, window=None, pool_count=None):
    envelope = {"source": source}
    if section is not None:
        envelope["section"] = section
    envelope["fetched_at"] = as_of.isoformat()
    if window is not None:
        envelope["window"] = window
    envelope["query_params"] = query_params
    envelope["totalCount"] = total_count
    if pool_count is not None:
        envelope["poolCount"] = pool_count
    envelope[items_key] = items
    return envelope


def write(path, envelope):
    """Write the envelope and return the path. Creates parent dirs."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(envelope, indent=2) + "\n")
    return path
