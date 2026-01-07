"""Utility functions for anymap-ts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

# Check for optional dependencies
try:
    import geopandas as gpd

    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False

try:
    import shapely.geometry

    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False


def to_geojson(data: Any) -> Dict:
    """Convert various data formats to GeoJSON.

    Args:
        data: GeoJSON dict, GeoDataFrame, file path, or URL

    Returns:
        GeoJSON dict

    Raises:
        ValueError: If data cannot be converted
        ImportError: If geopandas is required but not installed
    """
    # Already a dict (GeoJSON)
    if isinstance(data, dict):
        return data

    # GeoDataFrame
    if HAS_GEOPANDAS and isinstance(data, gpd.GeoDataFrame):
        return json.loads(data.to_json())

    # File path or URL
    if isinstance(data, (str, Path)):
        path_str = str(data)

        # If it's a URL, return as-is (will be handled by JS)
        if path_str.startswith(("http://", "https://")):
            return {"type": "url", "url": path_str}

        # Read file with geopandas
        if not HAS_GEOPANDAS:
            raise ImportError(
                "geopandas is required to read vector files. "
                "Install with: pip install anymap-ts[vector]"
            )

        gdf = gpd.read_file(path_str)
        return json.loads(gdf.to_json())

    # Has __geo_interface__ (shapely geometry, etc.)
    if hasattr(data, "__geo_interface__"):
        geo = data.__geo_interface__
        if geo.get("type") in (
            "Point",
            "LineString",
            "Polygon",
            "MultiPoint",
            "MultiLineString",
            "MultiPolygon",
            "GeometryCollection",
        ):
            return {"type": "Feature", "geometry": geo, "properties": {}}
        return geo

    raise ValueError(f"Cannot convert {type(data)} to GeoJSON")


def get_bounds(data: Any) -> Optional[List[float]]:
    """Calculate bounds from GeoJSON or GeoDataFrame.

    Args:
        data: GeoJSON dict or GeoDataFrame

    Returns:
        [west, south, east, north] bounds or None
    """
    if HAS_GEOPANDAS and isinstance(data, gpd.GeoDataFrame):
        bounds = data.total_bounds
        return [bounds[0], bounds[1], bounds[2], bounds[3]]

    if isinstance(data, dict):
        if HAS_SHAPELY:
            return _get_geojson_bounds_shapely(data)
        return _get_geojson_bounds_simple(data)

    return None


def _get_geojson_bounds_shapely(geojson: Dict) -> Optional[List[float]]:
    """Get bounds using shapely."""
    try:
        features = geojson.get("features", [geojson])
        if not features:
            return None

        geometries = []
        for f in features:
            geom = f.get("geometry") if "geometry" in f else f
            if geom:
                geometries.append(shapely.geometry.shape(geom))

        if not geometries:
            return None

        collection = shapely.geometry.GeometryCollection(geometries)
        bounds = collection.bounds
        return list(bounds)  # (minx, miny, maxx, maxy)
    except Exception:
        return None


def _get_geojson_bounds_simple(geojson: Dict) -> Optional[List[float]]:
    """Get bounds without shapely (simple coordinate extraction)."""
    try:
        coords = []
        _extract_coordinates(geojson, coords)

        if not coords:
            return None

        lngs = [c[0] for c in coords]
        lats = [c[1] for c in coords]

        return [min(lngs), min(lats), max(lngs), max(lats)]
    except Exception:
        return None


def _extract_coordinates(obj: Any, coords: List) -> None:
    """Recursively extract coordinates from GeoJSON."""
    if isinstance(obj, dict):
        if "coordinates" in obj:
            _flatten_coords(obj["coordinates"], coords)
        else:
            for value in obj.values():
                _extract_coordinates(value, coords)
    elif isinstance(obj, list):
        for item in obj:
            _extract_coordinates(item, coords)


def _flatten_coords(coord_array: Any, coords: List) -> None:
    """Flatten nested coordinate arrays."""
    if not coord_array:
        return
    if isinstance(coord_array[0], (int, float)):
        coords.append(coord_array[:2])
    else:
        for item in coord_array:
            _flatten_coords(item, coords)


def infer_layer_type(geojson: Dict) -> str:
    """Infer MapLibre layer type from GeoJSON geometry.

    Args:
        geojson: GeoJSON dict

    Returns:
        Layer type ('circle', 'line', 'fill')
    """
    geometry_type = None

    if geojson.get("type") == "FeatureCollection":
        features = geojson.get("features", [])
        if features:
            geometry_type = features[0].get("geometry", {}).get("type")
    elif geojson.get("type") == "Feature":
        geometry_type = geojson.get("geometry", {}).get("type")
    else:
        geometry_type = geojson.get("type")

    type_map = {
        "Point": "circle",
        "MultiPoint": "circle",
        "LineString": "line",
        "MultiLineString": "line",
        "Polygon": "fill",
        "MultiPolygon": "fill",
        "GeometryCollection": "fill",
    }

    return type_map.get(geometry_type, "circle")


def get_default_paint(layer_type: str) -> Dict[str, Any]:
    """Get default paint properties for a layer type.

    Args:
        layer_type: MapLibre layer type

    Returns:
        Paint properties dict
    """
    defaults = {
        "circle": {
            "circle-radius": 5,
            "circle-color": "#3388ff",
            "circle-opacity": 0.8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
        },
        "line": {
            "line-color": "#3388ff",
            "line-width": 2,
            "line-opacity": 0.8,
        },
        "fill": {
            "fill-color": "#3388ff",
            "fill-opacity": 0.5,
            "fill-outline-color": "#0000ff",
        },
        "fill-extrusion": {
            "fill-extrusion-color": "#3388ff",
            "fill-extrusion-opacity": 0.6,
            "fill-extrusion-height": 100,
        },
        "raster": {
            "raster-opacity": 1,
        },
        "heatmap": {
            "heatmap-opacity": 0.8,
        },
    }
    return defaults.get(layer_type, {})
