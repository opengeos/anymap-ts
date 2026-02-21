"""Tests for CesiumMap widget."""

import os
import pytest
from unittest.mock import patch

from anymap_ts.cesium import CesiumMap, get_cesium_token


class TestGetCesiumToken:
    """Tests for get_cesium_token helper."""

    def test_returns_empty_when_not_set(self):
        with patch.dict(os.environ, {}, clear=True):
            os.environ.pop("CESIUM_TOKEN", None)
            assert get_cesium_token() == ""

    def test_returns_token_from_env(self):
        with patch.dict(os.environ, {"CESIUM_TOKEN": "cesium-abc123"}):
            assert get_cesium_token() == "cesium-abc123"


class TestCesiumInit:
    """Tests for CesiumMap initialization."""

    def test_default_init(self):
        m = CesiumMap()
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m.width == "100%"
        assert m.height == "600px"
        assert m.camera_height == 10000000
        assert m.heading == 0.0
        assert m.pitch == -90.0
        assert m.roll == 0.0
        assert m.terrain_enabled is False

    def test_custom_init(self):
        m = CesiumMap(
            center=(-122.4, 37.8),
            zoom=10.0,
            width="800px",
            height="500px",
            access_token="my-token",
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 10.0
        assert m.access_token == "my-token"

    def test_token_from_env(self):
        with patch.dict(os.environ, {"CESIUM_TOKEN": "env-token"}):
            m = CesiumMap()
            assert m.access_token == "env-token"

    def test_terrain_on_init(self):
        m = CesiumMap(terrain=True)
        assert m.terrain_enabled is True


class TestCesiumBasemap:
    """Tests for add_basemap."""

    def test_add_basemap(self):
        m = CesiumMap()
        m.add_basemap("OpenStreetMap")
        calls = [c for c in m._js_calls if c["method"] == "addBasemap"]
        assert len(calls) >= 1


class TestCesiumImagery:
    """Tests for add/remove imagery layers."""

    def test_add_imagery_layer(self):
        m = CesiumMap()
        m.add_imagery_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="img")
        assert "img" in m._layers
        assert m._layers["img"]["type"] == "imagery"

    def test_remove_imagery_layer(self):
        m = CesiumMap()
        m.add_imagery_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="rm-img")
        m.remove_imagery_layer("rm-img")
        assert "rm-img" not in m._layers


class TestCesiumTerrain:
    """Tests for terrain methods."""

    def test_set_terrain(self):
        m = CesiumMap()
        m.set_terrain()
        assert m.terrain_enabled is True
        calls = [c for c in m._js_calls if c["method"] == "setTerrain"]
        assert len(calls) >= 1

    def test_remove_terrain(self):
        m = CesiumMap()
        m.set_terrain()
        m.remove_terrain()
        assert m.terrain_enabled is False
        calls = [c for c in m._js_calls if c["method"] == "removeTerrain"]
        assert len(calls) >= 1


class TestCesium3DTileset:
    """Tests for 3D tileset methods."""

    def test_add_3d_tileset(self):
        m = CesiumMap()
        m.add_3d_tileset("https://example.com/tileset.json", name="tiles3d")
        assert "tiles3d" in m._layers
        assert m._layers["tiles3d"]["type"] == "3dtiles"

    def test_remove_3d_tileset(self):
        m = CesiumMap()
        m.add_3d_tileset("https://example.com/tileset.json", name="rm-3d")
        m.remove_3d_tileset("rm-3d")
        assert "rm-3d" not in m._layers


class TestCesiumGeoJSON:
    """Tests for GeoJSON methods."""

    def test_add_geojson(self, geojson_point):
        m = CesiumMap()
        m.add_geojson(geojson_point, name="cesium-geo")
        assert "cesium-geo" in m._layers
        assert m._layers["cesium-geo"]["type"] == "geojson"


class TestCesiumNavigation:
    """Tests for navigation methods."""

    def test_fly_to(self):
        m = CesiumMap()
        m.fly_to(-122.4, 37.8, zoom=10)
        calls = [c for c in m._js_calls if c["method"] == "flyTo"]
        assert len(calls) >= 1

    def test_set_visibility(self):
        m = CesiumMap()
        m.set_visibility("layer", False)
        calls = [c for c in m._js_calls if c["method"] == "setVisibility"]
        assert len(calls) == 1

    def test_set_opacity(self):
        m = CesiumMap()
        m.set_opacity("layer", 0.7)
        calls = [c for c in m._js_calls if c["method"] == "setOpacity"]
        assert len(calls) == 1
