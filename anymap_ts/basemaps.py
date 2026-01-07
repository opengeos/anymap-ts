"""Basemap provider utilities."""

from __future__ import annotations

from typing import Dict, Optional, Tuple

import xyzservices.providers as xyz


def get_basemap_url(name: str) -> Tuple[str, str]:
    """Get tile URL and attribution for a named basemap.

    Args:
        name: Basemap provider name (e.g., "OpenStreetMap", "CartoDB.Positron")

    Returns:
        Tuple of (tile_url, attribution)

    Raises:
        ValueError: If basemap name is not found
    """
    # Handle shortcuts
    if name in BASEMAP_SHORTCUTS:
        name = BASEMAP_SHORTCUTS[name]

    # Handle dot notation for nested providers
    parts = name.split(".")
    provider = xyz
    for part in parts:
        provider = getattr(provider, part, None)
        if provider is None:
            raise ValueError(f"Unknown basemap: {name}")

    url = provider.build_url()
    attribution = provider.get("attribution", "")

    return url, attribution


def get_basemap_names() -> list:
    """Get list of available basemap names.

    Returns:
        List of basemap provider names
    """
    return list(xyz.flatten().keys())


# Common basemap shortcuts
BASEMAP_SHORTCUTS: Dict[str, str] = {
    "OpenStreetMap": "OpenStreetMap.Mapnik",
    "OSM": "OpenStreetMap.Mapnik",
    "CartoDB.Positron": "CartoDB.Positron",
    "CartoDB.DarkMatter": "CartoDB.DarkMatter",
    "Positron": "CartoDB.Positron",
    "DarkMatter": "CartoDB.DarkMatter",
    "Stamen.Terrain": "Stadia.StamenTerrain",
    "Stamen.Toner": "Stadia.StamenToner",
    "Stamen.Watercolor": "Stadia.StamenWatercolor",
    "Esri.WorldImagery": "Esri.WorldImagery",
    "Esri.WorldStreetMap": "Esri.WorldStreetMap",
    "Esri.WorldTopoMap": "Esri.WorldTopoMap",
    "Satellite": "Esri.WorldImagery",
}


# Default styles for MapLibre
MAPLIBRE_STYLES: Dict[str, str] = {
    "demo": "https://demotiles.maplibre.org/style.json",
    "positron": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    "dark-matter": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    "voyager": "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
}


def get_maplibre_style(name: str) -> str:
    """Get MapLibre style URL by name.

    Args:
        name: Style name (e.g., "positron", "dark-matter")

    Returns:
        Style URL

    Raises:
        ValueError: If style name is not found
    """
    name_lower = name.lower().replace("_", "-")
    if name_lower in MAPLIBRE_STYLES:
        return MAPLIBRE_STYLES[name_lower]
    # Assume it's already a URL
    if name.startswith("http"):
        return name
    raise ValueError(f"Unknown MapLibre style: {name}")
