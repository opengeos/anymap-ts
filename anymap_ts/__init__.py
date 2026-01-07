"""anymap-ts: Interactive maps with anywidget and TypeScript."""

from anymap_ts._version import __version__
from anymap_ts.maplibre import MapLibreMap

# Default Map class is MapLibreMap
Map = MapLibreMap

__all__ = [
    "__version__",
    "Map",
    "MapLibreMap",
]
