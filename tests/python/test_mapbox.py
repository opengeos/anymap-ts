"""Tests for MapboxMap widget."""

import os
import pytest
from unittest.mock import patch

from anymap_ts.mapbox import MapboxMap, get_mapbox_token


class TestGetMapboxToken:
    """Tests for get_mapbox_token helper."""

    def test_returns_empty_when_not_set(self):
        with patch.dict(os.environ, {}, clear=True):
            # Remove MAPBOX_TOKEN if present
            os.environ.pop("MAPBOX_TOKEN", None)
            assert get_mapbox_token() == ""

    def test_returns_token_from_env(self):
        with patch.dict(os.environ, {"MAPBOX_TOKEN": "pk.test123"}):
            assert get_mapbox_token() == "pk.test123"


class TestMapboxInit:
    """Tests for MapboxMap initialization."""

    def test_default_init(self):
        m = MapboxMap(access_token="test-token", controls={})
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m.width == "100%"
        assert m.height == "600px"
        assert m.bearing == 0.0
        assert m.pitch == 0.0
        assert m.access_token == "test-token"
        assert "mapbox://" in m.style

    def test_custom_init(self):
        m = MapboxMap(
            center=(-122.4, 37.8),
            zoom=12.0,
            width="800px",
            height="500px",
            bearing=90.0,
            pitch=45.0,
            access_token="test-token",
            controls={},
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 12.0
        assert m.bearing == 90.0
        assert m.pitch == 45.0

    def test_token_from_env(self):
        with patch.dict(os.environ, {"MAPBOX_TOKEN": "pk.envtoken"}):
            m = MapboxMap(controls={})
            assert m.access_token == "pk.envtoken"

    def test_layer_dict_initialized(self):
        m = MapboxMap(access_token="test", controls={})
        assert "Background" in m._layer_dict


class TestMapboxMethods:
    """Tests for MapboxMap methods."""

    def test_add_tile_layer(self):
        m = MapboxMap(access_token="test", controls={})
        m.add_tile_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="tiles")
        assert "tiles" in m._layers

    def test_add_marker(self):
        m = MapboxMap(access_token="test", controls={})
        m.add_marker(-122.4, 37.8, marker_id="mb-marker")
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert len(calls) >= 1

    def test_add_geojson(self):
        m = MapboxMap(access_token="test", controls={})
        geojson = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
            "properties": {},
        }
        m.add_geojson(geojson, name="mb-geojson")
        assert "mb-geojson" in m._layers

    def test_remove_layer(self):
        m = MapboxMap(access_token="test", controls={})
        geojson = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
            "properties": {},
        }
        m.add_geojson(geojson, name="rm-layer")
        m.remove_layer("rm-layer")
        assert "rm-layer" not in m._layers

    def test_set_visibility(self):
        m = MapboxMap(access_token="test", controls={})
        m.set_visibility("some-layer", False)
        calls = [c for c in m._js_calls if c["method"] == "setVisibility"]
        assert len(calls) == 1

    def test_set_opacity(self):
        m = MapboxMap(access_token="test", controls={})
        m.set_opacity("some-layer", 0.5)
        calls = [c for c in m._js_calls if c["method"] == "setOpacity"]
        assert len(calls) == 1
