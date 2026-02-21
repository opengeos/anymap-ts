"""Tests for LeafletMap widget."""

import pytest

from anymap_ts.leaflet import LeafletMap, _get_default_style, _infer_leaflet_type


class TestLeafletHelpers:
    """Tests for module-level helper functions."""

    def test_get_default_style_point(self):
        style = _get_default_style("point")
        assert "radius" in style
        assert "fillColor" in style

    def test_get_default_style_line(self):
        style = _get_default_style("line")
        assert "color" in style
        assert "weight" in style

    def test_get_default_style_polygon(self):
        style = _get_default_style("polygon")
        assert "fillColor" in style
        assert "fillOpacity" in style

    def test_get_default_style_unknown(self):
        style = _get_default_style("unknown")
        assert "radius" in style  # falls back to point

    def test_infer_type_point(self, geojson_point):
        assert _infer_leaflet_type(geojson_point) == "point"

    def test_infer_type_polygon(self, geojson_polygon):
        assert _infer_leaflet_type(geojson_polygon) == "polygon"

    def test_infer_type_line(self, geojson_line):
        assert _infer_leaflet_type(geojson_line) == "line"

    def test_infer_type_feature_collection(self, feature_collection):
        assert _infer_leaflet_type(feature_collection) == "point"


class TestLeafletInit:
    """Tests for LeafletMap initialization."""

    def test_default_init(self):
        m = LeafletMap(controls={})
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m.width == "100%"
        assert m.height == "600px"
        assert m.style == ""

    def test_custom_init(self):
        m = LeafletMap(
            center=(-122.4, 37.8), zoom=12.0, width="800px", height="500px",
            controls={},
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 12.0

    def test_layer_dict_initialized(self):
        m = LeafletMap(controls={})
        assert "Background" in m._layer_dict


class TestLeafletBasemap:
    """Tests for add_basemap."""

    def test_add_basemap(self):
        m = LeafletMap(controls={})
        m.add_basemap("OpenStreetMap")
        assert "Basemaps" in m._layer_dict
        assert "OpenStreetMap" in m._layer_dict["Basemaps"]

    def test_add_basemap_unknown_fallback(self):
        m = LeafletMap(controls={})
        m.add_basemap("https://custom.tiles/{z}/{x}/{y}.png")
        calls = [c for c in m._js_calls if c["method"] == "addBasemap"]
        assert len(calls) >= 1


class TestLeafletVector:
    """Tests for add_vector / add_geojson."""

    def test_add_vector(self, geojson_point):
        m = LeafletMap(controls={})
        m.add_vector(geojson_point, name="lf-vector")
        assert "lf-vector" in m._layers

    def test_add_geojson(self, geojson_polygon):
        m = LeafletMap(controls={})
        m.add_geojson(geojson_polygon, name="lf-geojson")
        assert "lf-geojson" in m._layers

    def test_add_vector_custom_style(self, geojson_line):
        m = LeafletMap(controls={})
        style = {"color": "red", "weight": 5}
        m.add_vector(geojson_line, style=style, name="styled")
        assert "styled" in m._layers


class TestLeafletTileLayer:
    """Tests for add_tile_layer."""

    def test_add_tile_layer(self):
        m = LeafletMap(controls={})
        m.add_tile_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="tiles")
        assert "tiles" in m._layers


class TestLeafletRemoveLayer:
    """Tests for remove_layer."""

    def test_remove_layer(self, geojson_point):
        m = LeafletMap(controls={})
        m.add_vector(geojson_point, name="to-remove")
        m.remove_layer("to-remove")
        assert "to-remove" not in m._layers


class TestLeafletVisibility:
    """Tests for set_visibility and set_opacity."""

    def test_set_visibility(self):
        m = LeafletMap(controls={})
        m.set_visibility("layer", False)
        calls = [c for c in m._js_calls if c["method"] == "setVisibility"]
        assert len(calls) == 1

    def test_set_opacity(self):
        m = LeafletMap(controls={})
        m.set_opacity("layer", 0.5)
        calls = [c for c in m._js_calls if c["method"] == "setOpacity"]
        assert len(calls) == 1


class TestLeafletControls:
    """Tests for add_control and add_layer_control."""

    def test_add_control(self):
        m = LeafletMap(controls={})
        m.add_control("scale")
        calls = [c for c in m._js_calls if c["method"] == "addControl"]
        assert len(calls) >= 1

    def test_add_layer_control(self):
        m = LeafletMap(controls={})
        m.add_layer_control()
        calls = [c for c in m._js_calls if c["method"] == "addControl"]
        assert len(calls) >= 1


class TestLeafletMarker:
    """Tests for add_marker."""

    def test_add_marker(self):
        m = LeafletMap(controls={})
        m.add_marker(-122.4, 37.8)
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert len(calls) >= 1

    def test_add_marker_with_popup(self):
        m = LeafletMap(controls={})
        m.add_marker(-122.4, 37.8, popup="<b>SF</b>")
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert calls[-1]["kwargs"]["popup"] == "<b>SF</b>"
