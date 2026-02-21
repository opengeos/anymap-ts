"""Tests for MapLibreMap widget."""

import pytest
from unittest.mock import patch

from anymap_ts.maplibre import MapLibreMap


class TestMapLibreInit:
    """Tests for MapLibreMap initialization."""

    def test_default_init(self):
        m = MapLibreMap(controls={})
        assert m.center == [0.0, 0.0]
        assert m.zoom == 2.0
        assert m.width == "100%"
        assert m.height == "700px"
        assert m.bearing == 0.0
        assert m.pitch == 0.0
        assert m.max_pitch == 85.0
        assert m.antialias is True
        assert m.double_click_zoom is True

    def test_custom_init(self):
        m = MapLibreMap(
            center=(-122.4, 37.8),
            zoom=10.0,
            width="800px",
            height="600px",
            bearing=45.0,
            pitch=30.0,
            max_pitch=60.0,
            controls={},
        )
        assert m.center == [-122.4, 37.8]
        assert m.zoom == 10.0
        assert m.bearing == 45.0
        assert m.pitch == 30.0
        assert m.max_pitch == 60.0

    def test_default_style(self):
        m = MapLibreMap(controls={})
        assert "cartocdn" in m.style or "positron" in m.style

    def test_style_shortcut(self):
        m = MapLibreMap(style="positron", controls={})
        assert "positron" in m.style

    def test_style_url_passthrough(self):
        url = "https://demotiles.maplibre.org/style.json"
        m = MapLibreMap(style=url, controls={})
        assert m.style == url

    def test_layer_dict_initialized(self):
        m = MapLibreMap(controls={})
        assert "Background" in m._layer_dict


class TestLayerDictHelpers:
    """Tests for _add_to_layer_dict and _remove_from_layer_dict."""

    def test_add_to_layer_dict(self):
        m = MapLibreMap(controls={})
        m._add_to_layer_dict("layer-1", "Vector")
        assert "Vector" in m._layer_dict
        assert "layer-1" in m._layer_dict["Vector"]

    def test_add_to_layer_dict_no_duplicate(self):
        m = MapLibreMap(controls={})
        m._add_to_layer_dict("layer-1", "Vector")
        m._add_to_layer_dict("layer-1", "Vector")
        assert m._layer_dict["Vector"].count("layer-1") == 1

    def test_remove_from_layer_dict(self):
        m = MapLibreMap(controls={})
        m._add_to_layer_dict("layer-1", "Vector")
        m._remove_from_layer_dict("layer-1")
        assert "Vector" not in m._layer_dict or "layer-1" not in m._layer_dict.get(
            "Vector", []
        )

    def test_remove_nonexistent_layer(self):
        m = MapLibreMap(controls={})
        m._remove_from_layer_dict("nonexistent")


class TestValidation:
    """Tests for validation helpers."""

    def test_validate_opacity_valid(self):
        m = MapLibreMap(controls={})
        assert m._validate_opacity(0.5) == 0.5
        assert m._validate_opacity(0.0) == 0.0
        assert m._validate_opacity(1.0) == 1.0

    def test_validate_opacity_invalid(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="between 0 and 1"):
            m._validate_opacity(1.5)
        with pytest.raises(ValueError, match="between 0 and 1"):
            m._validate_opacity(-0.1)

    def test_validate_position_valid(self):
        m = MapLibreMap(controls={})
        for pos in ["top-left", "top-right", "bottom-left", "bottom-right"]:
            assert m._validate_position(pos) == pos

    def test_validate_position_invalid(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="Position must be one of"):
            m._validate_position("center")


class TestAddBasemap:
    """Tests for add_basemap."""

    def test_add_basemap(self):
        m = MapLibreMap(controls={})
        m.add_basemap("OpenStreetMap")
        calls = [c for c in m._js_calls if c["method"] == "addBasemap"]
        assert len(calls) >= 1
        assert "Basemaps" in m._layer_dict
        assert "OpenStreetMap" in m._layer_dict["Basemaps"]


class TestAddVector:
    """Tests for add_vector with GeoJSON dict."""

    def test_add_vector_point(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_point, name="test-point")
        assert "test-point" in m._layers
        assert m._layers["test-point"]["type"] == "circle"
        assert "Vector" in m._layer_dict

    def test_add_vector_polygon(self, geojson_polygon):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_polygon, name="test-poly")
        assert m._layers["test-poly"]["type"] == "fill"

    def test_add_vector_line(self, geojson_line):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_line, name="test-line")
        assert m._layers["test-line"]["type"] == "line"

    def test_add_vector_custom_type(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_point, layer_type="symbol", name="test-sym")
        assert m._layers["test-sym"]["type"] == "symbol"

    def test_add_vector_custom_paint(self, geojson_point):
        m = MapLibreMap(controls={})
        paint = {"circle-radius": 10, "circle-color": "red"}
        m.add_vector(geojson_point, paint=paint, name="test-paint")
        assert m._layers["test-paint"]["paint"] == paint

    def test_add_vector_auto_name(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_point)
        assert len(m._layers) == 1

    def test_add_vector_calls_js(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_point, name="v1")
        calls = [c for c in m._js_calls if c["method"] == "addGeoJSON"]
        assert len(calls) >= 1


class TestAddGeoJSON:
    """Tests for add_geojson (delegates to add_vector)."""

    def test_delegates_to_add_vector(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_geojson(geojson_point, name="geojson-test")
        assert "geojson-test" in m._layers


class TestAddMarker:
    """Tests for add_marker."""

    def test_add_marker_basic(self):
        m = MapLibreMap(controls={})
        marker_id = m.add_marker(-122.4, 37.8)
        assert marker_id in m._layers
        assert m._layers[marker_id]["type"] == "marker"
        assert m._layers[marker_id]["lngLat"] == [-122.4, 37.8]
        assert "Markers" in m._layer_dict

    def test_add_marker_custom_name(self):
        m = MapLibreMap(controls={})
        marker_id = m.add_marker(-122.4, 37.8, name="my-marker")
        assert marker_id == "my-marker"

    def test_add_marker_with_popup(self):
        m = MapLibreMap(controls={})
        m.add_marker(-122.4, 37.8, popup="Hello")
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert len(calls) >= 1
        assert calls[-1]["kwargs"]["popup"] == "Hello"

    def test_add_marker_with_tooltip(self):
        m = MapLibreMap(controls={})
        m.add_marker(-122.4, 37.8, tooltip="Hover me")
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert calls[-1]["kwargs"]["tooltip"] == "Hover me"


class TestAddMarkers:
    """Tests for add_markers with various data formats."""

    def test_add_markers_from_list(self):
        m = MapLibreMap(controls={})
        data = [
            {"lng": -122.4, "lat": 37.8, "name": "SF"},
            {"lng": -74.0, "lat": 40.7, "name": "NYC"},
        ]
        layer_id = m.add_markers(data, name="cities")
        assert layer_id == "cities"
        assert m._layers["cities"]["count"] == 2

    def test_add_markers_from_list_lon_latitude(self):
        m = MapLibreMap(controls={})
        data = [
            {"longitude": -122.4, "latitude": 37.8},
            {"longitude": -74.0, "latitude": 40.7},
        ]
        layer_id = m.add_markers(data)
        assert m._layers[layer_id]["count"] == 2

    def test_add_markers_from_geojson(self):
        m = MapLibreMap(controls={})
        fc = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
                    "properties": {"name": "SF"},
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-74.0, 40.7]},
                    "properties": {"name": "NYC"},
                },
            ],
        }
        layer_id = m.add_markers(fc, popup_column="name")
        assert m._layers[layer_id]["count"] == 2

    def test_add_markers_empty_raises(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="No valid point data"):
            m.add_markers([])

    def test_add_markers_with_popup_column(self):
        m = MapLibreMap(controls={})
        data = [{"lng": -122.4, "lat": 37.8, "city": "SF"}]
        m.add_markers(data, popup_column="city")
        calls = [c for c in m._js_calls if c["method"] == "addMarkers"]
        assert len(calls) >= 1

    def test_add_markers_custom_columns(self):
        m = MapLibreMap(controls={})
        data = [{"x_coord": -122.4, "y_coord": 37.8}]
        layer_id = m.add_markers(data, lng_column="x_coord", lat_column="y_coord")
        assert m._layers[layer_id]["count"] == 1


class TestRemoveMarker:
    """Tests for remove_marker."""

    def test_remove_marker(self):
        m = MapLibreMap(controls={})
        m.add_marker(-122.4, 37.8, name="rm-marker")
        m.remove_marker("rm-marker")
        assert "rm-marker" not in m._layers


class TestAddTileLayer:
    """Tests for add_tile_layer."""

    def test_add_tile_layer(self):
        m = MapLibreMap(controls={})
        m.add_tile_layer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png", name="osm-tiles"
        )
        assert "osm-tiles" in m._layers
        assert m._layers["osm-tiles"]["type"] == "raster"
        assert "Raster" in m._layer_dict

    def test_add_tile_layer_auto_name(self):
        m = MapLibreMap(controls={})
        m.add_tile_layer("https://tile.openstreetmap.org/{z}/{x}/{y}.png")
        assert len(m._layers) == 1


class TestAddHeatmap:
    """Tests for add_heatmap."""

    def test_add_heatmap(self, geojson_point):
        fc = {
            "type": "FeatureCollection",
            "features": [geojson_point],
        }
        m = MapLibreMap(controls={})
        m.add_heatmap(fc, name="heat")
        assert "heat" in m._layers
        assert m._layers["heat"]["type"] == "heatmap"
        assert "Heatmap" in m._layer_dict

    def test_add_heatmap_invalid_opacity(self, geojson_point):
        fc = {"type": "FeatureCollection", "features": [geojson_point]}
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="between 0 and 1"):
            m.add_heatmap(fc, opacity=1.5)


class TestAddCogLayer:
    """Tests for add_cog_layer."""

    def test_add_cog_layer(self):
        m = MapLibreMap(controls={})
        m.add_cog_layer("https://example.com/test.tif", name="cog-test")
        assert "cog-test" in m._layers
        assert m._layers["cog-test"]["type"] == "cog"
        assert m._layers["cog-test"]["url"] == "https://example.com/test.tif"


class TestRemoveCogLayer:
    """Tests for remove_cog_layer."""

    def test_remove_cog_layer(self):
        m = MapLibreMap(controls={})
        m.add_cog_layer("https://example.com/test.tif", name="cog-rm")
        m.remove_cog_layer("cog-rm")
        assert "cog-rm" not in m._layers


class TestAddStacLayer:
    """Tests for add_stac_layer."""

    def test_add_stac_layer_url(self):
        m = MapLibreMap(controls={})
        m.add_stac_layer(
            url="https://example.com/stac/item.json",
            assets=["red", "green", "blue"],
            rescale=[0, 3000],
        )
        assert len(m._layers) == 1

    def test_add_stac_layer_no_args_raises(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="Either 'url' or 'item'"):
            m.add_stac_layer()

    def test_add_stac_layer_both_args_raises(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="not both"):
            m.add_stac_layer(url="x", item="y")

    def test_add_stac_layer_bad_rescale(self):
        m = MapLibreMap(controls={})
        with pytest.raises(ValueError, match="rescale must be a list of two"):
            m.add_stac_layer(
                url="https://example.com/stac/item.json", rescale=[0, 100, 200]
            )


class TestRemoveLayer:
    """Tests for _remove_layer_internal."""

    def test_remove_layer_internal(self, geojson_point):
        m = MapLibreMap(controls={})
        m.add_vector(geojson_point, name="to-remove")
        m._remove_layer_internal("to-remove", "removeLayer")
        assert "to-remove" not in m._layers


class TestAddControl:
    """Tests for add_control."""

    def test_add_control_calls_js(self):
        m = MapLibreMap(controls={})
        m.add_control("navigation", position="top-right")
        calls = [c for c in m._js_calls if c["method"] == "addControl"]
        assert len(calls) >= 1


class TestMapLibreHtmlExport:
    """Tests for HTML export."""

    def test_to_html_returns_string(self):
        m = MapLibreMap(controls={})
        html = m.to_html()
        assert isinstance(html, str)
        assert "maplibre" in html.lower() or "<html" in html.lower() or "<!DOCTYPE" in html.lower()

    def test_to_html_file(self, tmp_path):
        m = MapLibreMap(controls={})
        fpath = tmp_path / "map.html"
        m.to_html(filepath=str(fpath))
        assert fpath.exists()
