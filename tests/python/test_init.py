"""Tests for the anymap_ts package initialization and exports."""

import anymap_ts
from anymap_ts import (
    Map,
    MapLibreMap,
    MapboxMap,
    LeafletMap,
    DeckGLMap,
    OpenLayersMap,
    CesiumMap,
    KeplerGLMap,
    PotreeViewer,
)


class TestPackageExports:
    """Tests for package-level exports."""

    def test_version_exists(self):
        assert hasattr(anymap_ts, "__version__")
        assert isinstance(anymap_ts.__version__, str)
        assert len(anymap_ts.__version__) > 0

    def test_map_is_maplibre(self):
        assert Map is MapLibreMap

    def test_all_exports(self):
        assert "Map" in anymap_ts.__all__
        assert "MapLibreMap" in anymap_ts.__all__
        assert "MapboxMap" in anymap_ts.__all__
        assert "LeafletMap" in anymap_ts.__all__
        assert "DeckGLMap" in anymap_ts.__all__
        assert "OpenLayersMap" in anymap_ts.__all__
        assert "CesiumMap" in anymap_ts.__all__
        assert "KeplerGLMap" in anymap_ts.__all__
        assert "PotreeViewer" in anymap_ts.__all__


class TestWidgetImports:
    """Tests that all widget classes are importable and instantiatable."""

    def test_maplibre_map(self):
        m = MapLibreMap(controls={})
        assert isinstance(m, MapLibreMap)

    def test_leaflet_map(self):
        m = LeafletMap(controls={})
        assert isinstance(m, LeafletMap)

    def test_openlayers_map(self):
        m = OpenLayersMap(controls={})
        assert isinstance(m, OpenLayersMap)

    def test_deckgl_map(self):
        m = DeckGLMap(controls={})
        assert isinstance(m, DeckGLMap)

    def test_cesium_map(self):
        m = CesiumMap()
        assert isinstance(m, CesiumMap)

    def test_keplergl_map(self):
        m = KeplerGLMap()
        assert isinstance(m, KeplerGLMap)

    def test_potree_viewer(self):
        v = PotreeViewer()
        assert isinstance(v, PotreeViewer)

    def test_mapbox_map(self):
        m = MapboxMap(access_token="test", controls={})
        assert isinstance(m, MapboxMap)


class TestWidgetInheritance:
    """Tests that widget classes have proper inheritance."""

    def test_maplibre_is_mapwidget(self):
        from anymap_ts.base import MapWidget

        m = MapLibreMap(controls={})
        assert isinstance(m, MapWidget)

    def test_deckgl_extends_maplibre(self):
        m = DeckGLMap(controls={})
        assert isinstance(m, MapLibreMap)
        assert isinstance(m, DeckGLMap)

    def test_all_widgets_have_call_js_method(self):
        widgets = [
            MapLibreMap(controls={}),
            LeafletMap(controls={}),
            OpenLayersMap(controls={}),
            DeckGLMap(controls={}),
            CesiumMap(),
            KeplerGLMap(),
            PotreeViewer(),
        ]
        for w in widgets:
            assert hasattr(w, "call_js_method")
            assert callable(w.call_js_method)

    def test_all_widgets_have_set_center(self):
        widgets = [
            MapLibreMap(controls={}),
            LeafletMap(controls={}),
            OpenLayersMap(controls={}),
            CesiumMap(),
            KeplerGLMap(),
        ]
        for w in widgets:
            assert hasattr(w, "set_center")
