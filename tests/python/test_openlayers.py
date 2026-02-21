"""Tests for OpenLayersMap widget."""

import pytest

from anymap_ts.openlayers import OpenLayersMap


class TestOpenLayersInit:
    """Tests for OpenLayersMap initialization."""

    def test_default_init(self):
        m = OpenLayersMap(controls={})
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m.width == "100%"
        assert m.height == "600px"
        assert m.projection == "EPSG:3857"
        assert m.rotation == 0.0

    def test_custom_init(self):
        m = OpenLayersMap(
            center=(-122.4, 37.8),
            zoom=10.0,
            projection="EPSG:4326",
            rotation=0.5,
            controls={},
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 10.0
        assert m.projection == "EPSG:4326"
        assert m.rotation == 0.5

    def test_layer_dict_initialized(self):
        m = OpenLayersMap(controls={})
        assert "Background" in m._layer_dict


class TestOpenLayersBasemap:
    """Tests for add_basemap."""

    def test_add_basemap(self):
        m = OpenLayersMap(controls={})
        m.add_basemap("OpenStreetMap")
        assert "Basemaps" in m._layer_dict
        calls = [c for c in m._js_calls if c["method"] == "addBasemap"]
        assert len(calls) >= 1


class TestOpenLayersTileLayer:
    """Tests for add_tile_layer."""

    def test_add_tile_layer(self):
        m = OpenLayersMap(controls={})
        m.add_tile_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="tiles")
        assert "tiles" in m._layers
        assert m._layers["tiles"]["type"] == "tile"


class TestOpenLayersVector:
    """Tests for add_vector and add_geojson."""

    def test_add_vector(self, geojson_point):
        m = OpenLayersMap(controls={})
        m.add_vector(geojson_point, name="ol-vec")
        assert "ol-vec" in m._layers

    def test_add_geojson(self, geojson_polygon):
        m = OpenLayersMap(controls={})
        m.add_geojson(geojson_polygon, name="ol-geo")
        assert "ol-geo" in m._layers


class TestOpenLayersRemoveLayer:
    """Tests for remove_layer."""

    def test_remove_layer(self, geojson_point):
        m = OpenLayersMap(controls={})
        m.add_vector(geojson_point, name="rm-layer")
        m.remove_layer("rm-layer")
        assert "rm-layer" not in m._layers


class TestOpenLayersVisibility:
    """Tests for set_visibility and set_opacity."""

    def test_set_visibility(self):
        m = OpenLayersMap(controls={})
        m.set_visibility("layer", False)
        calls = [c for c in m._js_calls if c["method"] == "setVisibility"]
        assert len(calls) == 1

    def test_set_opacity(self):
        m = OpenLayersMap(controls={})
        m.set_opacity("layer", 0.5)
        calls = [c for c in m._js_calls if c["method"] == "setOpacity"]
        assert len(calls) == 1


class TestOpenLayersControl:
    """Tests for add_control."""

    def test_add_control(self):
        m = OpenLayersMap(controls={})
        m.add_control("zoom")
        calls = [c for c in m._js_calls if c["method"] == "addControl"]
        assert len(calls) >= 1


class TestOpenLayersMarker:
    """Tests for add_marker."""

    def test_add_marker(self):
        m = OpenLayersMap(controls={})
        m.add_marker(-122.4, 37.8)
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert len(calls) >= 1


class TestOpenLayersNavigation:
    """Tests for set_center, set_zoom, fly_to, fit_bounds."""

    def test_set_center(self):
        m = OpenLayersMap(controls={})
        m.set_center(-122.4, 37.8)
        assert m.center == [-122.4, 37.8]

    def test_set_zoom(self):
        m = OpenLayersMap(controls={})
        m.set_zoom(15.0)
        assert m.zoom == 15.0

    def test_fly_to(self):
        m = OpenLayersMap(controls={})
        m.fly_to(-122.4, 37.8, zoom=12)
        calls = [c for c in m._js_calls if c["method"] == "flyTo"]
        assert len(calls) >= 1

    def test_fit_bounds(self):
        m = OpenLayersMap(controls={})
        m.fit_bounds([-122.5, 37.7, -122.3, 37.9])
        calls = [c for c in m._js_calls if c["method"] == "fitBounds"]
        assert len(calls) >= 1
