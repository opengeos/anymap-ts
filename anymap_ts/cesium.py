"""Cesium 3D globe widget implementation."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .utils import to_geojson

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


def get_cesium_token() -> str:
    """Get Cesium Ion access token from environment variable.

    Returns:
        Cesium Ion access token or empty string if not set.
    """
    return os.environ.get("CESIUM_TOKEN", "")


class CesiumMap(MapWidget):
    """Interactive 3D globe widget using Cesium.

    This class provides a Python interface to Cesium for 3D globe
    visualization with terrain, 3D Tiles, and imagery layer support.

    Example:
        >>> from anymap_ts import CesiumMap
        >>> m = CesiumMap(center=[-122.4, 37.8], zoom=10)
        >>> m.set_terrain()  # Enable Cesium World Terrain
        >>> m.add_3d_tileset(url="path/to/tileset.json")
        >>> m
    """

    # ESM module for frontend
    _esm = STATIC_DIR / "cesium.js"

    # Cesium-specific traits
    access_token = traitlets.Unicode("").tag(sync=True)

    # Camera position traits
    camera_height = traitlets.Float(10000000).tag(sync=True)
    heading = traitlets.Float(0.0).tag(sync=True)
    pitch = traitlets.Float(-90.0).tag(sync=True)
    roll = traitlets.Float(0.0).tag(sync=True)

    # Terrain
    terrain_enabled = traitlets.Bool(False).tag(sync=True)

    def __init__(
        self,
        center: Tuple[float, float] = (0.0, 0.0),
        zoom: float = 2.0,
        width: str = "100%",
        height: str = "600px",
        access_token: Optional[str] = None,
        terrain: bool = False,
        **kwargs,
    ):
        """Initialize a Cesium 3D globe.

        Args:
            center: Globe center as (longitude, latitude).
            zoom: Initial zoom level (converted to camera height).
            width: Widget width as CSS string.
            height: Widget height as CSS string.
            access_token: Cesium Ion access token (uses CESIUM_TOKEN env var if not provided).
            terrain: Whether to enable terrain on initialization.
            **kwargs: Additional widget arguments.
        """
        # Get access token from env if not provided
        if access_token is None:
            access_token = get_cesium_token()

        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            access_token=access_token,
            terrain_enabled=terrain,
            **kwargs,
        )

        # Enable terrain if requested
        if terrain:
            self.set_terrain()

    # -------------------------------------------------------------------------
    # Basemap/Imagery Methods
    # -------------------------------------------------------------------------

    def add_basemap(
        self,
        basemap: str = "OpenStreetMap",
        **kwargs,
    ) -> None:
        """Add a basemap imagery layer.

        Args:
            basemap: Name of basemap (e.g., "OpenStreetMap", "Bing").
            **kwargs: Additional options.
        """
        # Common basemap URLs
        basemap_urls = {
            "OpenStreetMap": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            "CartoDB.Positron": "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            "CartoDB.DarkMatter": "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            "Stamen.Terrain": "https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png",
        }

        url = basemap_urls.get(basemap, basemap_urls["OpenStreetMap"])

        self.call_js_method("addBasemap", url, name=basemap, **kwargs)

    def add_imagery_layer(
        self,
        url: str,
        name: Optional[str] = None,
        layer_type: str = "xyz",
        alpha: float = 1.0,
        **kwargs,
    ) -> None:
        """Add an imagery layer.

        Args:
            url: Imagery URL or service endpoint.
            name: Layer name.
            layer_type: Type of imagery ('xyz', 'wms', 'wmts', 'arcgis').
            alpha: Layer opacity (0-1).
            **kwargs: Additional options (layers, parameters for WMS, etc.).
        """
        layer_id = name or f"imagery-{len(self._layers)}"

        self.call_js_method(
            "addImageryLayer",
            url=url,
            name=layer_id,
            type=layer_type,
            alpha=alpha,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "imagery"},
        }

    def remove_imagery_layer(self, name: str) -> None:
        """Remove an imagery layer.

        Args:
            name: Layer name to remove.
        """
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self.call_js_method("removeImageryLayer", name)

    # -------------------------------------------------------------------------
    # Terrain Methods
    # -------------------------------------------------------------------------

    def set_terrain(
        self,
        url: Optional[str] = None,
        request_vertex_normals: bool = True,
        request_water_mask: bool = True,
    ) -> None:
        """Enable terrain.

        Args:
            url: Terrain provider URL. If None, uses Cesium World Terrain (requires Ion token).
            request_vertex_normals: Request vertex normals for lighting.
            request_water_mask: Request water mask for water effects.
        """
        self.terrain_enabled = True
        self.call_js_method(
            "setTerrain",
            url=url or "cesium-world-terrain",
            requestVertexNormals=request_vertex_normals,
            requestWaterMask=request_water_mask,
        )

    def remove_terrain(self) -> None:
        """Disable terrain and use ellipsoid."""
        self.terrain_enabled = False
        self.call_js_method("removeTerrain")

    # -------------------------------------------------------------------------
    # 3D Tiles Methods
    # -------------------------------------------------------------------------

    def add_3d_tileset(
        self,
        url: Union[str, int],
        name: Optional[str] = None,
        maximum_screen_space_error: float = 16,
        fly_to: bool = True,
        **kwargs,
    ) -> None:
        """Add a 3D Tileset.

        Args:
            url: URL to tileset.json or Cesium Ion asset ID.
            name: Tileset name.
            maximum_screen_space_error: Maximum screen space error for LOD.
            fly_to: Whether to fly to the tileset after loading.
            **kwargs: Additional options.
        """
        layer_id = name or f"tileset-{len(self._layers)}"

        self.call_js_method(
            "add3DTileset",
            url=str(url),
            name=layer_id,
            maximumScreenSpaceError=maximum_screen_space_error,
            flyTo=fly_to,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "3dtiles"},
        }

    def remove_3d_tileset(self, name: str) -> None:
        """Remove a 3D Tileset.

        Args:
            name: Tileset name to remove.
        """
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self.call_js_method("remove3DTileset", name)

    # -------------------------------------------------------------------------
    # GeoJSON Methods
    # -------------------------------------------------------------------------

    def add_geojson(
        self,
        data: Any,
        name: Optional[str] = None,
        stroke: str = "#3388ff",
        stroke_width: float = 2,
        fill: str = "rgba(51, 136, 255, 0.5)",
        clamp_to_ground: bool = True,
        fly_to: bool = True,
        **kwargs,
    ) -> None:
        """Add GeoJSON data.

        Args:
            data: GeoJSON dict or file path.
            name: Data source name.
            stroke: Stroke color.
            stroke_width: Stroke width.
            fill: Fill color.
            clamp_to_ground: Whether to clamp features to terrain.
            fly_to: Whether to fly to the data after loading.
            **kwargs: Additional options.
        """
        geojson = to_geojson(data)
        layer_id = name or f"geojson-{len(self._layers)}"

        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            stroke=stroke,
            strokeWidth=stroke_width,
            fill=fill,
            clampToGround=clamp_to_ground,
            flyTo=fly_to,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "geojson"},
        }

    def remove_data_source(self, name: str) -> None:
        """Remove a data source (GeoJSON, etc.).

        Args:
            name: Data source name to remove.
        """
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self.call_js_method("removeDataSource", name)

    # -------------------------------------------------------------------------
    # Camera Methods
    # -------------------------------------------------------------------------

    def fly_to(
        self,
        lng: float,
        lat: float,
        height: Optional[float] = None,
        zoom: Optional[float] = None,
        heading: float = 0,
        pitch: float = -90,
        roll: float = 0,
        duration: float = 2,
    ) -> None:
        """Fly to a location.

        Args:
            lng: Target longitude.
            lat: Target latitude.
            height: Camera height in meters (overrides zoom).
            zoom: Zoom level (converted to height if height not provided).
            heading: Camera heading in degrees.
            pitch: Camera pitch in degrees (default -90 = looking down).
            roll: Camera roll in degrees.
            duration: Flight duration in seconds.
        """
        self.call_js_method(
            "flyTo",
            lng,
            lat,
            height=height,
            zoom=zoom,
            heading=heading,
            pitch=pitch,
            roll=roll,
            duration=duration,
        )

    def zoom_to(self, target: str) -> None:
        """Zoom to a layer or data source.

        Args:
            target: Name of the layer or data source to zoom to.
        """
        self.call_js_method("zoomTo", target=target)

    def set_camera(
        self,
        longitude: float = 0,
        latitude: float = 0,
        height: float = 10000000,
        heading: float = 0,
        pitch: float = -90,
        roll: float = 0,
    ) -> None:
        """Set the camera position immediately (no animation).

        Args:
            longitude: Camera longitude.
            latitude: Camera latitude.
            height: Camera height in meters.
            heading: Camera heading in degrees.
            pitch: Camera pitch in degrees.
            roll: Camera roll in degrees.
        """
        self.call_js_method(
            "setCamera",
            longitude=longitude,
            latitude=latitude,
            height=height,
            heading=heading,
            pitch=pitch,
            roll=roll,
        )

    def reset_view(self, duration: float = 2) -> None:
        """Reset camera to home position.

        Args:
            duration: Animation duration in seconds.
        """
        self.call_js_method("resetView", duration=duration)

    # -------------------------------------------------------------------------
    # Layer Management
    # -------------------------------------------------------------------------

    def set_visibility(self, name: str, visible: bool) -> None:
        """Set layer visibility.

        Args:
            name: Layer name.
            visible: Whether layer should be visible.
        """
        self.call_js_method("setVisibility", name, visible)

    def set_opacity(self, name: str, opacity: float) -> None:
        """Set layer opacity (imagery layers only).

        Args:
            name: Layer name.
            opacity: Opacity value (0-1).
        """
        self.call_js_method("setOpacity", name, opacity)

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the globe."""
        template_path = Path(__file__).parent / "templates" / "cesium.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        state = {
            "center": self.center,
            "zoom": self.zoom,
            "access_token": self.access_token,
            "terrain_enabled": self.terrain_enabled,
            "width": self.width,
            "height": self.height,
            "layers": self._layers,
            "js_calls": self._js_calls,
        }

        template = template.replace("{{state}}", json.dumps(state, indent=2))
        template = template.replace("{{access_token}}", self.access_token)
        return template

    def _get_default_template(self) -> str:
        """Get default HTML template."""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cesium Globe</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Cesium.js"></script>
    <link href="https://cesium.com/downloads/cesiumjs/releases/1.120/Build/Cesium/Widgets/widgets.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        #cesiumContainer { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="cesiumContainer"></div>
    <script>
        const state = {{state}};

        if (state.access_token) {
            Cesium.Ion.defaultAccessToken = state.access_token;
        }

        const viewer = new Cesium.Viewer('cesiumContainer', {
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false
        });

        for (const call of state.js_calls || []) {
            executeMethod(call.method, call.args, call.kwargs);
        }

        function executeMethod(method, args, kwargs) {
            console.log('Executing:', method, args, kwargs);
        }
    </script>
</body>
</html>"""
