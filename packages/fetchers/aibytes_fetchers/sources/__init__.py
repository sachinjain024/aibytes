"""One module per data source.

Each source module declares where its snapshot is filed and how its items are
shaped, then implements `fetch(window, args) -> FetchResult`. Everything else -
the window, the output path, the envelope, the CLI, the printed summary - comes
from the shared package, so adding a source means writing only the part that is
genuinely source-specific.

Required module attributes:
    NAME, SOURCE, SECTION, SUBPATH, FILENAME, ITEMS_KEY, DEFAULT_COUNT
Required callables:
    add_arguments(parser), fetch(window, args) -> FetchResult, format_line(item)
"""


class FetchResult:
    """What a source hands back to the runner."""

    __slots__ = ("items", "total_count", "query_params", "pool_count", "window_dict")

    def __init__(self, items, total_count, query_params, pool_count=None, window_dict=None):
        self.items = items
        self.total_count = total_count
        self.query_params = query_params
        self.pool_count = pool_count
        self.window_dict = window_dict
