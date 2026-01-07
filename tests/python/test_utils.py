"""Tests for utility functions."""

import pytest
from anymap_ts.utils import (
    to_geojson,
    get_bounds,
    infer_layer_type,
    get_default_paint,
)


class TestToGeojson:
    """Tests for to_geojson function."""

    def test_dict_passthrough(self, geojson_point):
        """Dict input should pass through unchanged."""
        result = to_geojson(geojson_point)
        assert result == geojson_point

    def test_feature_collection(self, feature_collection):
        """FeatureCollection should pass through."""
        result = to_geojson(feature_collection)
        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 3

    def test_url_detection(self):
        """URL strings should be detected."""
        result = to_geojson("https://example.com/data.geojson")
        assert result["type"] == "url"
        assert result["url"] == "https://example.com/data.geojson"


class TestGetBounds:
    """Tests for get_bounds function."""

    def test_point_bounds(self, geojson_point):
        """Point should return point coordinates as bounds."""
        bounds = get_bounds(geojson_point)
        assert bounds is not None
        assert len(bounds) == 4
        assert bounds[0] == bounds[2]  # west == east for point
        assert bounds[1] == bounds[3]  # south == north for point

    def test_polygon_bounds(self, geojson_polygon):
        """Polygon should return proper bounds."""
        bounds = get_bounds(geojson_polygon)
        assert bounds is not None
        assert len(bounds) == 4
        assert bounds[0] < bounds[2]  # west < east
        assert bounds[1] < bounds[3]  # south < north

    def test_feature_collection_bounds(self, feature_collection):
        """FeatureCollection should return encompassing bounds."""
        bounds = get_bounds(feature_collection)
        assert bounds is not None
        assert len(bounds) == 4


class TestInferLayerType:
    """Tests for infer_layer_type function."""

    def test_point_to_circle(self, geojson_point):
        """Point geometry should infer circle layer."""
        result = infer_layer_type(geojson_point)
        assert result == "circle"

    def test_polygon_to_fill(self, geojson_polygon):
        """Polygon geometry should infer fill layer."""
        result = infer_layer_type(geojson_polygon)
        assert result == "fill"

    def test_line_to_line(self, geojson_line):
        """LineString geometry should infer line layer."""
        result = infer_layer_type(geojson_line)
        assert result == "line"

    def test_feature_collection(self, feature_collection):
        """FeatureCollection should use first feature's geometry."""
        result = infer_layer_type(feature_collection)
        assert result == "circle"  # First feature is a point


class TestGetDefaultPaint:
    """Tests for get_default_paint function."""

    def test_circle_paint(self):
        """Circle layer should have circle paint properties."""
        paint = get_default_paint("circle")
        assert "circle-radius" in paint
        assert "circle-color" in paint

    def test_line_paint(self):
        """Line layer should have line paint properties."""
        paint = get_default_paint("line")
        assert "line-color" in paint
        assert "line-width" in paint

    def test_fill_paint(self):
        """Fill layer should have fill paint properties."""
        paint = get_default_paint("fill")
        assert "fill-color" in paint
        assert "fill-opacity" in paint

    def test_unknown_type(self):
        """Unknown type should return empty dict."""
        paint = get_default_paint("unknown")
        assert paint == {}
