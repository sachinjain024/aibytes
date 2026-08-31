"""Cadence-independent time windows.

A cadence names both how far back to look and how the snapshot is filed. The
window itself is always an explicit (start, end) pair, so a source never needs
to know which cadence produced it - that is what lets the same fetch code back
the weekly newsletter and the daily app feed.
"""

import datetime as dt

# Cadence -> default window length in days.
CADENCES = {"daily": 1, "weekly": 7, "monthly": 30}
DEFAULT_CADENCE = "weekly"


class Window:
    """A half-open [start, end) date range, plus the as-of date it was cut from."""

    __slots__ = ("as_of", "days", "cadence")

    def __init__(self, as_of, days, cadence=DEFAULT_CADENCE):
        self.as_of = as_of
        self.days = days
        self.cadence = cadence

    @property
    def start(self):
        return self.as_of - dt.timedelta(days=self.days)

    @property
    def end(self):
        """Exclusive. The day after as_of, so as_of itself is always included."""
        return self.as_of + dt.timedelta(days=1)

    def start_epoch(self):
        return _to_epoch(self.start)

    def end_epoch(self):
        return _to_epoch(self.end)

    def as_dict(self, after_key="after", before_key="before"):
        """Window as it appears in a snapshot envelope. ProductHunt names the
        keys postedAfter/postedBefore, everyone else after/before."""
        return {after_key: self.start.isoformat(), before_key: self.end.isoformat()}

    def as_rfc3339_dict(self, after_key="postedAfter", before_key="postedBefore"):
        return {
            after_key: f"{self.start}T00:00:00Z",
            before_key: f"{self.end}T00:00:00Z",
        }

    def __repr__(self):
        return f"Window({self.start} .. {self.end}, cadence={self.cadence!r})"


def _to_epoch(day):
    return int(dt.datetime.combine(day, dt.time(), tzinfo=dt.timezone.utc).timestamp())


def resolve(cadence=None, days=None, date=None):
    """Build a Window from CLI-ish inputs.

    `days` wins over the cadence default when given, so `--cadence daily
    --days 3` is a three-day window still filed as a daily snapshot.
    """
    cadence = cadence or DEFAULT_CADENCE
    if cadence not in CADENCES:
        raise ValueError(f"unknown cadence {cadence!r} (expected one of {sorted(CADENCES)})")
    as_of = dt.date.fromisoformat(date) if isinstance(date, str) else (date or dt.date.today())
    return Window(as_of, days if days is not None else CADENCES[cadence], cadence)
