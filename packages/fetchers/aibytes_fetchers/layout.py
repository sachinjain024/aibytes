"""Where a snapshot is filed on disk.

The weekly layout is load-bearing: newsletter/data/<yyyy>/<mm>/weeks/week-<NN>/
is what the newsletter skills read and what two years of committed snapshots
already use. Do not change it. Other cadences get their own period folder
alongside it, so a daily feed and the weekly newsletter can share one tree
without colliding.
"""

import pathlib


def period_segments(as_of, cadence):
    """The <period>/<bucket> folders between the month and the source folder."""
    if cadence == "weekly":
        _, week, _ = as_of.isocalendar()
        return ("weeks", f"week-{week:02d}")
    if cadence == "daily":
        return ("days", as_of.isoformat())
    if cadence == "monthly":
        return ("months", f"{as_of.year:04d}-{as_of.month:02d}")
    raise ValueError(f"unknown cadence {cadence!r}")


def snapshot_path(output_root, as_of, cadence, subpath, filename, repo_root=None):
    """Absolute path for one source's snapshot.

    `output_root` is resolved against `repo_root` when relative, so a caller can
    pass "newsletter/data" and get the committed tree, or an absolute temp dir
    and get output outside the repo entirely (which is how the tests run).
    """
    root = pathlib.Path(output_root)
    if not root.is_absolute() and repo_root is not None:
        root = pathlib.Path(repo_root) / root
    return root.joinpath(
        f"{as_of.year:04d}",
        f"{as_of.month:02d}",
        *period_segments(as_of, cadence),
        *subpath,
        filename,
    )
