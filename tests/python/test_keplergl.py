"""Tests for KeplerGLMap widget."""

import json
import os
import pytest
from unittest.mock import patch

from anymap_ts.keplergl import KeplerGLMap


class TestKeplerGLInit:
    """Tests for KeplerGLMap initialization."""

    def test_default_init(self):
        m = KeplerGLMap()
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 10.0
        assert m.width == "100%"
        assert m.height == "600px"
        assert m.config == {}
        assert m.datasets == {}
        assert m.read_only is False
        assert m.show_data_table is True

    def test_custom_init(self):
        m = KeplerGLMap(
            center=(10, 20),
            zoom=5.0,
            read_only=True,
            show_data_table=False,
        )
        assert m.center == [10, 20]
        assert m.zoom == 5.0
        assert m.read_only is True
        assert m.show_data_table is False

    def test_mapbox_token_from_env(self):
        with patch.dict(os.environ, {"MAPBOX_TOKEN": "pk.test"}):
            m = KeplerGLMap()
            assert m.mapbox_token == "pk.test"

    def test_mapbox_token_explicit(self):
        m = KeplerGLMap(mapbox_token="pk.explicit")
        assert m.mapbox_token == "pk.explicit"

    def test_custom_config(self):
        cfg = {"visState": {"layers": []}}
        m = KeplerGLMap(config=cfg)
        assert m.config == cfg


class TestKeplerGLData:
    """Tests for data management methods."""

    def test_add_data_dict(self):
        m = KeplerGLMap()
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
                    "properties": {"name": "SF"},
                }
            ],
        }
        m.add_data(geojson, name="cities")
        assert "cities" in m.datasets
        assert m.datasets["cities"]["info"]["id"] == "cities"

    def test_add_data_auto_name(self):
        m = KeplerGLMap()
        m.add_data({"type": "FeatureCollection", "features": []})
        assert len(m.datasets) == 1

    def test_remove_data(self):
        m = KeplerGLMap()
        m.add_data({"type": "FeatureCollection", "features": []}, name="rm-data")
        m.remove_data("rm-data")
        assert "rm-data" not in m.datasets

    def test_remove_nonexistent_data(self):
        m = KeplerGLMap()
        m.remove_data("nonexistent")

    def test_process_data_geojson(self):
        m = KeplerGLMap()
        geojson = {"type": "FeatureCollection", "features": []}
        result = m._process_data(geojson)
        assert result["type"] == "geojson"

    def test_process_data_dict_passthrough(self):
        m = KeplerGLMap()
        data = {"fields": [{"name": "x"}], "rows": [[1]]}
        result = m._process_data(data)
        assert result == data


class TestKeplerGLConfig:
    """Tests for configuration methods."""

    def test_set_config(self):
        m = KeplerGLMap()
        cfg = {"visState": {"layers": []}}
        m.set_config(cfg)
        assert m.config == cfg
        calls = [c for c in m._js_calls if c["method"] == "setConfig"]
        assert len(calls) == 1

    def test_get_config(self):
        m = KeplerGLMap()
        cfg = {"visState": {"layers": []}}
        m.config = cfg
        assert m.get_config() == cfg

    def test_save_config(self, tmp_path):
        m = KeplerGLMap()
        m.config = {"test": True}
        fpath = tmp_path / "config.json"
        m.save_config(str(fpath))
        with open(fpath) as f:
            saved = json.load(f)
        assert saved == {"test": True}

    def test_load_config(self, tmp_path):
        fpath = tmp_path / "config.json"
        with open(fpath, "w") as f:
            json.dump({"loaded": True}, f)
        m = KeplerGLMap()
        m.load_config(str(fpath))
        assert m.config == {"loaded": True}


class TestKeplerGLFilter:
    """Tests for add_filter."""

    def test_add_filter(self):
        m = KeplerGLMap()
        m.add_filter("data_1", "temperature", filter_type="range", value=[0, 100])
        calls = [c for c in m._js_calls if c["method"] == "addFilter"]
        assert len(calls) == 1


class TestKeplerGLFlyTo:
    """Tests for fly_to."""

    def test_fly_to(self):
        m = KeplerGLMap()
        m.fly_to(-122.4, 37.8, zoom=12)
        calls = [c for c in m._js_calls if c["method"] == "flyTo"]
        assert len(calls) >= 1
