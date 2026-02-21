"""Tests for DeckGLMap widget."""

import pytest

from anymap_ts.deckgl import DeckGLMap


class TestDeckGLInit:
    """Tests for DeckGLMap initialization."""

    def test_default_init(self):
        m = DeckGLMap(controls={})
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m._deck_layers == {}
        assert m.bearing == 0.0
        assert m.pitch == 0.0

    def test_custom_init(self):
        m = DeckGLMap(
            center=(-122.4, 37.8),
            zoom=10.0,
            bearing=45.0,
            pitch=30.0,
            controls={},
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 10.0
        assert m.bearing == 45.0
        assert m.pitch == 30.0

    def test_inherits_maplibre(self):
        m = DeckGLMap(controls={})
        assert hasattr(m, "add_vector")
        assert hasattr(m, "add_marker")
        assert hasattr(m, "add_basemap")


class TestDeckGLScatterplot:
    """Tests for add_scatterplot_layer."""

    def test_add_scatterplot_basic(self):
        m = DeckGLMap(controls={})
        data = [
            {"coordinates": [-122.4, 37.8], "value": 100},
            {"coordinates": [-74.0, 40.7], "value": 200},
        ]
        m.add_scatterplot_layer(data, name="scatter")
        assert "scatter" in m._deck_layers
        calls = [c for c in m._js_calls if c["method"] == "addScatterplotLayer"]
        assert len(calls) >= 1


class TestDeckGLArcLayer:
    """Tests for add_arc_layer."""

    def test_add_arc_layer(self):
        m = DeckGLMap(controls={})
        data = [
            {
                "source": [-122.4, 37.8],
                "target": [-74.0, 40.7],
            }
        ]
        m.add_arc_layer(data, name="arcs")
        assert "arcs" in m._deck_layers


class TestDeckGLHexagon:
    """Tests for add_hexagon_layer."""

    def test_add_hexagon_layer(self):
        m = DeckGLMap(controls={})
        data = [
            {"coordinates": [-122.4, 37.8]},
            {"coordinates": [-122.3, 37.7]},
        ]
        m.add_hexagon_layer(data, name="hexagons")
        assert "hexagons" in m._deck_layers


class TestDeckGLHeatmap:
    """Tests for add_heatmap_layer."""

    def test_add_heatmap_layer(self):
        m = DeckGLMap(controls={})
        data = [
            {"coordinates": [-122.4, 37.8], "weight": 1},
        ]
        m.add_heatmap_layer(data, name="heat")
        assert "heat" in m._deck_layers


class TestDeckGLPath:
    """Tests for add_path_layer."""

    def test_add_path_layer(self):
        m = DeckGLMap(controls={})
        data = [
            {"path": [[-122.4, 37.8], [-122.3, 37.7]]},
        ]
        m.add_path_layer(data, name="paths")
        assert "paths" in m._deck_layers


class TestDeckGLPolygon:
    """Tests for add_polygon_layer."""

    def test_add_polygon_layer(self):
        m = DeckGLMap(controls={})
        data = [
            {
                "polygon": [
                    [-122.5, 37.7],
                    [-122.3, 37.7],
                    [-122.3, 37.9],
                    [-122.5, 37.9],
                ]
            },
        ]
        m.add_polygon_layer(data, name="polygons")
        assert "polygons" in m._deck_layers


class TestDeckGLGrid:
    """Tests for add_grid_layer."""

    def test_add_grid_layer(self):
        m = DeckGLMap(controls={})
        data = [{"coordinates": [-122.4, 37.8]}]
        m.add_grid_layer(data, name="grid")
        assert "grid" in m._deck_layers


class TestDeckGLGeoJSON:
    """Tests for add_geojson_layer."""

    def test_add_geojson_layer(self, geojson_point):
        m = DeckGLMap(controls={})
        fc = {"type": "FeatureCollection", "features": [geojson_point]}
        m.add_geojson_layer(fc, name="deck-geo")
        assert "deck-geo" in m._deck_layers


class TestDeckGLRemoveLayer:
    """Tests for remove_deck_layer."""

    def test_remove_deck_layer(self):
        m = DeckGLMap(controls={})
        data = [{"coordinates": [-122.4, 37.8]}]
        m.add_scatterplot_layer(data, name="rm-scatter")
        m.remove_deck_layer("rm-scatter")
        assert "rm-scatter" not in m._deck_layers

    def test_remove_nonexistent_deck_layer(self):
        m = DeckGLMap(controls={})
        m.remove_deck_layer("nonexistent")


class TestDeckGLVisibility:
    """Tests for set_deck_layer_visibility."""

    def test_set_deck_layer_visibility(self):
        m = DeckGLMap(controls={})
        m.set_deck_layer_visibility("layer", False)
        calls = [c for c in m._js_calls if c["method"] == "setDeckLayerVisibility"]
        assert len(calls) == 1


class TestDeckGLMapLibreMethods:
    """Test that MapLibre methods still work on DeckGL."""

    def test_add_vector(self, geojson_point):
        m = DeckGLMap(controls={})
        m.add_vector(geojson_point, name="vec")
        assert "vec" in m._layers

    def test_add_marker(self):
        m = DeckGLMap(controls={})
        mid = m.add_marker(-122.4, 37.8, name="deck-marker")
        assert mid == "deck-marker"
