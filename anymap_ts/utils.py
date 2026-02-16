"""Utility functions for anymap-ts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.request import urlopen
from urllib.error import URLError

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


def fetch_geojson(url: str) -> Dict:
    """Fetch GeoJSON data from a URL.

    Args:
        url: URL to fetch GeoJSON from

    Returns:
        GeoJSON dict

    Raises:
        ValueError: If the URL cannot be fetched or parsed
    """
    try:
        with urlopen(url, timeout=30) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            data = response.read().decode(charset)
            return json.loads(data)
    except URLError as e:
        raise ValueError(f"Failed to fetch GeoJSON from URL: {e}") from e
    except UnicodeDecodeError as e:
        raise ValueError(f"Failed to decode response as UTF-8: {e}") from e
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON at URL: {e}") from e


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


# -------------------------------------------------------------------------
# Choropleth Utilities
# -------------------------------------------------------------------------

# Check for matplotlib
try:
    import matplotlib.pyplot as plt

    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    plt = None  # type: ignore

# Fallback colormaps when matplotlib is not available
_FALLBACK_COLORMAPS = {
    "viridis": ["#440154", "#31688e", "#26838f", "#6cce5a", "#fde725"],
    "Blues": ["#f7fbff", "#9ecae1", "#4292c6", "#2171b5", "#08306b"],
    "Reds": ["#fff5f0", "#fc9272", "#ef3b2c", "#cb181d", "#67000d"],
    "YlOrRd": ["#ffffcc", "#feb24c", "#fc4e2a", "#bd0026", "#800026"],
}


def _rgb_to_hex(rgb: tuple) -> str:
    """Convert RGB tuple (0-1 range) to hex color string.

    Args:
        rgb: Tuple of (r, g, b) or (r, g, b, a) values in 0-1 range.

    Returns:
        Hex color string like '#ff0000'.
    """
    r, g, b = rgb[:3]
    return "#{:02x}{:02x}{:02x}".format(int(r * 255), int(g * 255), int(b * 255))


def get_choropleth_colors(cmap: str, k: int) -> List[str]:
    """Get colors for a choropleth map using matplotlib colormaps.

    Uses matplotlib colormaps when available, falling back to a small
    set of built-in colormaps if matplotlib is not installed.

    Args:
        cmap: Colormap name. Any matplotlib colormap is supported when
            matplotlib is installed. Common options include:
            - Sequential: 'viridis', 'plasma', 'inferno', 'magma', 'cividis',
              'Blues', 'Greens', 'Reds', 'Oranges', 'Purples', 'Greys'
            - Diverging: 'RdBu', 'RdYlGn', 'RdYlBu', 'Spectral', 'coolwarm',
              'bwr', 'seismic'
            - Qualitative: 'Set1', 'Set2', 'Set3', 'Paired', 'tab10', 'tab20'
            - Perceptually uniform: 'viridis', 'plasma', 'inferno', 'magma'
        k: Number of classes/colors to generate.

    Returns:
        List of k hex color strings.

    Raises:
        ValueError: If colormap is not found.

    Example:
        >>> colors = get_choropleth_colors('viridis', 5)
        >>> colors
        ['#440154', '#3b528b', '#21918c', '#5ec962', '#fde725']
    """
    if HAS_MATPLOTLIB:
        try:
            # Get the colormap from matplotlib
            colormap = plt.get_cmap(cmap)

            # Sample k colors evenly from the colormap
            colors = []
            for i in range(k):
                # Sample at evenly spaced points
                position = i / (k - 1) if k > 1 else 0.5
                rgba = colormap(position)
                colors.append(_rgb_to_hex(rgba))

            return colors

        except ValueError:
            raise ValueError(
                f"Unknown colormap '{cmap}'. See matplotlib colormap documentation "
                "for available options: https://matplotlib.org/stable/gallery/color/colormap_reference.html"
            )
    else:
        # Fallback to built-in colormaps
        if cmap not in _FALLBACK_COLORMAPS:
            available = ", ".join(sorted(_FALLBACK_COLORMAPS.keys()))
            raise ValueError(
                f"Colormap '{cmap}' not available. Without matplotlib, only these "
                f"colormaps are available: {available}. "
                "Install matplotlib for full colormap support: pip install matplotlib"
            )

        full_colors = _FALLBACK_COLORMAPS[cmap]

        if k <= len(full_colors):
            # Sample evenly from the colormap
            step = len(full_colors) / k
            indices = [int(i * step) for i in range(k)]
            return [full_colors[i] for i in indices]
        else:
            # Interpolate if we need more colors than available
            # For simplicity, just repeat the last colors
            colors = full_colors[:]
            while len(colors) < k:
                colors.append(colors[-1])
            return colors[:k]


def compute_breaks(
    values: List[float],
    classification: str,
    k: int,
    manual_breaks: Optional[List[float]] = None,
) -> List[float]:
    """Compute classification breaks for choropleth maps.

    Args:
        values: List of numeric values to classify.
        classification: Classification method ('quantile', 'equal_interval',
            'natural_breaks', 'manual').
        k: Number of classes.
        manual_breaks: Custom break values for 'manual' classification.

    Returns:
        List of break values (k+1 values defining class boundaries).

    Raises:
        ValueError: If classification method is invalid or breaks are incorrect.
    """
    if classification == "manual":
        if manual_breaks is None:
            raise ValueError("manual_breaks required for 'manual' classification")
        if len(manual_breaks) != k + 1:
            raise ValueError(f"manual_breaks must have {k + 1} values for {k} classes")
        return manual_breaks

    sorted_values = sorted(values)
    min_val = sorted_values[0]
    max_val = sorted_values[-1]

    if classification == "quantile":
        # Equal number of features per class
        breaks = [min_val]
        for i in range(1, k):
            idx = int(len(sorted_values) * i / k)
            breaks.append(sorted_values[idx])
        breaks.append(max_val)
        return breaks

    elif classification == "equal_interval":
        # Equal value ranges
        interval = (max_val - min_val) / k
        breaks = [min_val + i * interval for i in range(k + 1)]
        return breaks

    elif classification == "natural_breaks":
        # Jenks natural breaks - requires jenkspy
        try:
            import jenkspy

            breaks = jenkspy.jenks_breaks(values, n_classes=k)
            return breaks
        except ImportError:
            raise ImportError(
                "jenkspy is required for natural_breaks classification. "
                "Install with: pip install jenkspy"
            )

    else:
        raise ValueError(
            f"Unknown classification method '{classification}'. "
            "Options: 'quantile', 'equal_interval', 'natural_breaks', 'manual'"
        )


def build_step_expression(column: str, breaks: List[float], colors: List[str]) -> List:
    """Build a MapLibre step expression for choropleth styling.

    Args:
        column: Property name to style by.
        breaks: Break values (k+1 values for k classes).
        colors: List of k colors for each class.

    Returns:
        MapLibre step expression as a list.
    """
    # MapLibre step expression format:
    # ["step", ["get", "property"], color0, break1, color1, break2, color2, ...]
    expr = ["step", ["get", column], colors[0]]

    # Add breaks and colors (skip the first break which is the minimum)
    for i in range(1, len(breaks) - 1):
        expr.append(breaks[i])
        expr.append(colors[i])

    # Handle the last class
    if len(colors) > len(breaks) - 1:
        expr.append(breaks[-1])
        expr.append(colors[-1])

    return expr
