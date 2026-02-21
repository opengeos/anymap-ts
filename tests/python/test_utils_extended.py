"""Extended tests for utility functions - choropleth, GeoDataFrame, shapely."""

import pytest
import geopandas as gpd
import shapely.geometry

from anymap_ts.utils import (
    to_geojson,
    get_bounds,
    infer_layer_type,
    get_default_paint,
    get_choropleth_colors,
    compute_breaks,
    build_step_expression,
    _rgb_to_hex,
)


class TestRgbToHex:
    """Tests for _rgb_to_hex."""

    def test_black(self):
        assert _rgb_to_hex((0, 0, 0)) == "#000000"

    def test_white(self):
        assert _rgb_to_hex((1, 1, 1)) == "#ffffff"

    def test_red(self):
        assert _rgb_to_hex((1, 0, 0)) == "#ff0000"

    def test_rgba_ignores_alpha(self):
        assert _rgb_to_hex((0, 1, 0, 0.5)) == "#00ff00"


class TestGetChoroplethColors:
    """Tests for get_choropleth_colors (with matplotlib)."""

    def test_viridis_5(self):
        colors = get_choropleth_colors("viridis", 5)
        assert len(colors) == 5
        assert all(c.startswith("#") for c in colors)

    def test_single_color(self):
        colors = get_choropleth_colors("viridis", 1)
        assert len(colors) == 1

    def test_many_colors(self):
        colors = get_choropleth_colors("plasma", 20)
        assert len(colors) == 20

    def test_unknown_colormap(self):
        with pytest.raises(ValueError, match="Unknown colormap"):
            get_choropleth_colors("nonexistent_colormap_xyz", 5)

    def test_sequential_colormaps(self):
        for cmap in ["Blues", "Reds", "viridis", "plasma"]:
            colors = get_choropleth_colors(cmap, 3)
            assert len(colors) == 3

    def test_diverging_colormap(self):
        colors = get_choropleth_colors("RdBu", 5)
        assert len(colors) == 5

    def test_colors_are_valid_hex(self):
        colors = get_choropleth_colors("viridis", 5)
        for c in colors:
            assert c.startswith("#")
            assert len(c) == 7
            int(c[1:], 16)  # should not raise


class TestComputeBreaks:
    """Tests for compute_breaks."""

    def test_quantile(self):
        values = list(range(100))
        breaks = compute_breaks(values, "quantile", 4)
        assert len(breaks) == 5
        assert breaks[0] == 0
        assert breaks[-1] == 99

    def test_equal_interval(self):
        values = [0, 25, 50, 75, 100]
        breaks = compute_breaks(values, "equal_interval", 4)
        assert len(breaks) == 5
        assert breaks[0] == 0
        assert breaks[-1] == 100
        assert breaks[2] == pytest.approx(50.0)

    def test_manual(self):
        breaks = compute_breaks([], "manual", 3, manual_breaks=[0, 10, 20, 30])
        assert breaks == [0, 10, 20, 30]

    def test_manual_no_breaks_raises(self):
        with pytest.raises(ValueError, match="manual_breaks required"):
            compute_breaks([], "manual", 3)

    def test_manual_wrong_count_raises(self):
        with pytest.raises(ValueError, match="manual_breaks must have"):
            compute_breaks([], "manual", 3, manual_breaks=[0, 10])

    def test_unknown_classification(self):
        with pytest.raises(ValueError, match="Unknown classification"):
            compute_breaks([1, 2, 3], "xyz", 2)


class TestBuildStepExpression:
    """Tests for build_step_expression."""

    def test_basic(self):
        expr = build_step_expression("value", [0, 10, 20, 30], ["#a", "#b", "#c"])
        assert expr[0] == "step"
        assert expr[1] == ["get", "value"]
        assert expr[2] == "#a"

    def test_contains_breaks_and_colors(self):
        breaks = [0, 10, 20, 30]
        colors = ["#a", "#b", "#c"]
        expr = build_step_expression("val", breaks, colors)
        assert 10 in expr
        assert 20 in expr
        assert "#b" in expr


class TestToGeojsonGeoDataFrame:
    """Tests for to_geojson with GeoDataFrame."""

    def test_geodataframe_conversion(self):
        gdf = gpd.GeoDataFrame(
            {"name": ["SF"]},
            geometry=[shapely.geometry.Point(-122.4, 37.8)],
            crs="EPSG:4326",
        )
        result = to_geojson(gdf)
        assert result["type"] == "FeatureCollection"
        assert len(result["features"]) == 1

    def test_geodataframe_polygon(self):
        poly = shapely.geometry.box(-122.5, 37.7, -122.3, 37.9)
        gdf = gpd.GeoDataFrame(
            {"name": ["area"]},
            geometry=[poly],
            crs="EPSG:4326",
        )
        result = to_geojson(gdf)
        assert result["type"] == "FeatureCollection"


class TestToGeojsonShapely:
    """Tests for to_geojson with shapely geometry objects."""

    def test_shapely_point(self):
        pt = shapely.geometry.Point(-122.4, 37.8)
        result = to_geojson(pt)
        assert result["type"] == "Feature"
        assert result["geometry"]["type"] == "Point"

    def test_shapely_polygon(self):
        poly = shapely.geometry.box(-122.5, 37.7, -122.3, 37.9)
        result = to_geojson(poly)
        assert result["type"] == "Feature"
        assert result["geometry"]["type"] == "Polygon"

    def test_shapely_linestring(self):
        line = shapely.geometry.LineString([(-122.4, 37.8), (-122.3, 37.9)])
        result = to_geojson(line)
        assert result["type"] == "Feature"
        assert result["geometry"]["type"] == "LineString"


class TestToGeojsonErrors:
    """Tests for to_geojson error handling."""

    def test_invalid_type_raises(self):
        with pytest.raises(ValueError, match="Cannot convert"):
            to_geojson(12345)

    def test_url_detection_http(self):
        result = to_geojson("http://example.com/data.geojson")
        assert result["type"] == "url"

    def test_url_detection_https(self):
        result = to_geojson("https://example.com/data.geojson")
        assert result["type"] == "url"


class TestGetBoundsGeoDataFrame:
    """Tests for get_bounds with GeoDataFrame."""

    def test_gdf_bounds(self):
        gdf = gpd.GeoDataFrame(
            {"name": ["a", "b"]},
            geometry=[
                shapely.geometry.Point(-122.4, 37.8),
                shapely.geometry.Point(-74.0, 40.7),
            ],
            crs="EPSG:4326",
        )
        bounds = get_bounds(gdf)
        assert bounds is not None
        assert len(bounds) == 4
        assert bounds[0] < bounds[2]
        assert bounds[1] < bounds[3]


class TestGetBoundsNone:
    """Tests for get_bounds edge cases."""

    def test_returns_none_for_non_dict(self):
        assert get_bounds(12345) is None

    def test_empty_feature_collection(self):
        result = get_bounds({"type": "FeatureCollection", "features": []})
        assert result is None


class TestInferLayerTypeGeometryTypes:
    """Tests for infer_layer_type with additional geometry types."""

    def test_multipoint(self):
        data = {"type": "MultiPoint", "coordinates": [[-122.4, 37.8], [-74.0, 40.7]]}
        assert infer_layer_type(data) == "circle"

    def test_multilinestring(self):
        data = {
            "type": "MultiLineString",
            "coordinates": [
                [[-122.5, 37.7], [-122.4, 37.8]],
                [[-74.0, 40.7], [-73.9, 40.8]],
            ],
        }
        assert infer_layer_type(data) == "line"

    def test_multipolygon(self):
        data = {
            "type": "MultiPolygon",
            "coordinates": [
                [[[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.7]]]
            ],
        }
        assert infer_layer_type(data) == "fill"

    def test_unknown_type_defaults_to_circle(self):
        data = {"type": "Feature", "geometry": {"type": "UnknownGeom"}}
        assert infer_layer_type(data) == "circle"


class TestGetDefaultPaintExtended:
    """Tests for get_default_paint with additional types."""

    def test_fill_extrusion(self):
        paint = get_default_paint("fill-extrusion")
        assert "fill-extrusion-color" in paint

    def test_raster(self):
        paint = get_default_paint("raster")
        assert "raster-opacity" in paint

    def test_heatmap(self):
        paint = get_default_paint("heatmap")
        assert "heatmap-opacity" in paint
