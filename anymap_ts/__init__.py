"""anymap-ts: Interactive maps with anywidget and TypeScript."""

from anymap_ts._version import __version__
from anymap_ts.maplibre import MapLibreMap
from anymap_ts.mapbox import MapboxMap
from anymap_ts.leaflet import LeafletMap
from anymap_ts.deckgl import DeckGLMap
from anymap_ts.openlayers import OpenLayersMap
from anymap_ts.cesium import CesiumMap
from anymap_ts.keplergl import KeplerGLMap
from anymap_ts.potree import PotreeViewer

# Default Map class is MapLibreMap
Map = MapLibreMap

__all__ = [
    "__version__",
    "Map",
    "MapLibreMap",
    "MapboxMap",
    "LeafletMap",
    "DeckGLMap",
    "OpenLayersMap",
    "CesiumMap",
    "KeplerGLMap",
    "PotreeViewer",
]
