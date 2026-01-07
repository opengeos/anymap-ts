"""Pytest configuration and fixtures."""

import pytest


@pytest.fixture
def geojson_point():
    """Sample GeoJSON point."""
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
        "properties": {"name": "Test Point"},
    }


@pytest.fixture
def geojson_polygon():
    """Sample GeoJSON polygon."""
    return {
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
        "properties": {"name": "Test Polygon"},
    }


@pytest.fixture
def geojson_line():
    """Sample GeoJSON line."""
    return {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [-122.5, 37.7],
                [-122.4, 37.8],
                [-122.3, 37.9],
            ],
        },
        "properties": {"name": "Test Line"},
    }


@pytest.fixture
def feature_collection(geojson_point, geojson_polygon, geojson_line):
    """Sample GeoJSON FeatureCollection."""
    return {
        "type": "FeatureCollection",
        "features": [geojson_point, geojson_polygon, geojson_line],
    }
