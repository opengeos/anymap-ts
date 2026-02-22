"""Tests for LeafletMap widget."""

import pytest

from anymap_ts.leaflet import (
    LeafletMap,
    _get_default_style,
    _infer_leaflet_type,
    _compute_thresholds,
)


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

    def test_compute_thresholds(self):
        values = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        thresholds = _compute_thresholds(values, n_classes=5)
        assert len(thresholds) == 4
        assert thresholds[0] == pytest.approx(20.0)

    def test_compute_thresholds_empty(self):
        assert _compute_thresholds([]) == []


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
            center=(-122.4, 37.8),
            zoom=12.0,
            width="800px",
            height="500px",
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

    def test_add_vector_with_popup_properties(self, geojson_point):
        m = LeafletMap(controls={})
        m.add_vector(geojson_point, name="with-popup", popup_properties=["name"])
        calls = [c for c in m._js_calls if c["method"] == "addGeoJSON"]
        assert calls[-1]["kwargs"]["popupProperties"] == ["name"]

    def test_add_vector_with_tooltip(self, geojson_point):
        m = LeafletMap(controls={})
        m.add_vector(geojson_point, name="with-tip", tooltip_property="name")
        calls = [c for c in m._js_calls if c["method"] == "addGeoJSON"]
        assert calls[-1]["kwargs"]["tooltipProperty"] == "name"


class TestLeafletTileLayer:
    """Tests for add_tile_layer."""

    def test_add_tile_layer(self):
        m = LeafletMap(controls={})
        m.add_tile_layer("https://tiles.example.com/{z}/{x}/{y}.png", name="tiles")
        assert "tiles" in m._layers


class TestLeafletWMS:
    """Tests for add_wms_layer."""

    def test_add_wms_layer(self):
        m = LeafletMap(controls={})
        m.add_wms_layer(
            "https://ows.mundialis.de/services/service",
            layers="TOPO-WMS",
            name="wms-topo",
        )
        assert "wms-topo" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addWMSLayer"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["layers"] == "TOPO-WMS"

    def test_remove_wms_layer(self):
        m = LeafletMap(controls={})
        m.add_wms_layer(
            "https://example.com/wms",
            layers="test",
            name="wms-test",
        )
        m.remove_wms_layer("wms-test")
        assert "wms-test" not in m._layers


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
    """Tests for add_marker and add_markers."""

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

    def test_add_marker_with_custom_icon(self):
        m = LeafletMap(controls={})
        m.add_marker(
            -122.4,
            37.8,
            icon_url="https://example.com/icon.png",
            icon_size=(32, 32),
        )
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert calls[-1]["kwargs"]["iconUrl"] == "https://example.com/icon.png"
        assert calls[-1]["kwargs"]["iconSize"] == [32, 32]

    def test_add_marker_with_tooltip(self):
        m = LeafletMap(controls={})
        m.add_marker(-122.4, 37.8, tooltip="Hello")
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert calls[-1]["kwargs"]["tooltip"] == "Hello"

    def test_add_marker_draggable(self):
        m = LeafletMap(controls={})
        m.add_marker(-122.4, 37.8, draggable=True)
        calls = [c for c in m._js_calls if c["method"] == "addMarker"]
        assert calls[-1]["kwargs"]["draggable"] is True

    def test_add_markers(self):
        m = LeafletMap(controls={})
        markers = [
            {"lng": -122.4, "lat": 37.8, "popup": "SF"},
            {"lng": -122.2, "lat": 37.9, "popup": "Oakland"},
        ]
        m.add_markers(markers, name="cities")
        assert "cities" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addMarkers"]
        assert len(calls) == 1


class TestLeafletShapes:
    """Tests for circle markers, circles, polylines, polygons, rectangles."""

    def test_add_circle_marker(self):
        m = LeafletMap(controls={})
        m.add_circle_marker(-122.4, 37.8, radius=15, name="cm")
        assert "cm" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addCircleMarker"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["radius"] == 15

    def test_add_circle(self):
        m = LeafletMap(controls={})
        m.add_circle(-122.4, 37.8, radius=5000, name="c")
        assert "c" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addCircle"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["radius"] == 5000

    def test_add_polyline(self):
        m = LeafletMap(controls={})
        coords = [[-122.5, 37.7], [-122.4, 37.8], [-122.3, 37.9]]
        m.add_polyline(coords, name="pl", color="red")
        assert "pl" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addPolyline"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["color"] == "red"

    def test_add_polygon(self):
        m = LeafletMap(controls={})
        coords = [[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.9]]
        m.add_polygon(coords, name="pg", fill_color="green")
        assert "pg" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addPolygon"]
        assert len(calls) == 1

    def test_add_rectangle(self):
        m = LeafletMap(controls={})
        m.add_rectangle((-122.5, 37.7, -122.3, 37.9), name="rect")
        assert "rect" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addRectangle"]
        assert len(calls) == 1


class TestLeafletOverlays:
    """Tests for image and video overlays."""

    def test_add_image_overlay(self):
        m = LeafletMap(controls={})
        m.add_image_overlay(
            "https://example.com/image.png",
            bounds=(-122.5, 37.7, -122.3, 37.9),
            name="img",
        )
        assert "img" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addImageOverlay"]
        assert len(calls) == 1

    def test_add_video_overlay(self):
        m = LeafletMap(controls={})
        m.add_video_overlay(
            "https://example.com/video.mp4",
            bounds=(-122.5, 37.7, -122.3, 37.9),
            name="vid",
        )
        assert "vid" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addVideoOverlay"]
        assert len(calls) == 1


class TestLeafletHeatmap:
    """Tests for heatmap layer."""

    def test_add_heatmap_list(self):
        m = LeafletMap(controls={})
        data = [[-122.4, 37.8, 0.5], [-122.3, 37.7, 1.0]]
        m.add_heatmap(data, name="heat")
        assert "heat" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addHeatmap"]
        assert len(calls) == 1

    def test_add_heatmap_geojson(self):
        m = LeafletMap(controls={})
        data = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
                    "properties": {"intensity": 0.7},
                },
            ],
        }
        m.add_heatmap(data, name="heat-gj", value_column="intensity")
        assert "heat-gj" in m._layers

    def test_remove_heatmap(self):
        m = LeafletMap(controls={})
        m.add_heatmap([[-122.4, 37.8]], name="heat-rm")
        m.remove_heatmap("heat-rm")
        assert "heat-rm" not in m._layers

    def test_add_heatmap_with_gradient(self):
        m = LeafletMap(controls={})
        m.add_heatmap(
            [[-122.4, 37.8, 1.0]],
            name="heat-grad",
            gradient={0.4: "blue", 0.65: "lime", 1: "red"},
        )
        calls = [c for c in m._js_calls if c["method"] == "addHeatmap"]
        assert "gradient" in calls[-1]["kwargs"]


class TestLeafletChoropleth:
    """Tests for choropleth layer."""

    def test_add_choropleth(self):
        m = LeafletMap(controls={})
        data = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [-122.5, 37.7],
                                [-122.3, 37.7],
                                [-122.3, 37.9],
                                [-122.5, 37.9],
                                [-122.5, 37.7],
                            ]
                        ],
                    },
                    "properties": {"name": "Area A", "density": 50},
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [-122.3, 37.7],
                                [-122.1, 37.7],
                                [-122.1, 37.9],
                                [-122.3, 37.9],
                                [-122.3, 37.7],
                            ]
                        ],
                    },
                    "properties": {"name": "Area B", "density": 100},
                },
            ],
        }
        m.add_choropleth(
            data,
            value_column="density",
            name="choro",
            legend_title="Density",
        )
        assert "choro" in m._layers
        calls = [c for c in m._js_calls if c["method"] == "addChoropleth"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["valueProperty"] == "density"
        assert "thresholds" in calls[0]["kwargs"]
        assert "colors" in calls[0]["kwargs"]


class TestLeafletPopup:
    """Tests for popups."""

    def test_add_popup(self):
        m = LeafletMap(controls={})
        m.add_popup(-122.4, 37.8, content="<b>Hello</b>")
        calls = [c for c in m._js_calls if c["method"] == "addPopup"]
        assert len(calls) == 1
        assert calls[0]["kwargs"]["content"] == "<b>Hello</b>"


class TestLeafletLegend:
    """Tests for legend."""

    def test_add_legend(self):
        m = LeafletMap(controls={})
        items = [
            {"color": "red", "label": "High"},
            {"color": "blue", "label": "Low"},
        ]
        m.add_legend(items, title="Risk", name="risk")
        calls = [c for c in m._js_calls if c["method"] == "addLegend"]
        assert len(calls) == 1

    def test_remove_legend(self):
        m = LeafletMap(controls={})
        m.remove_legend("risk")
        calls = [c for c in m._js_calls if c["method"] == "removeLegend"]
        assert len(calls) == 1
