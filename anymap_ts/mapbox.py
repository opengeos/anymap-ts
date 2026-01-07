"""Mapbox GL JS map widget implementation."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import to_geojson, get_bounds, infer_layer_type, get_default_paint

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


def get_mapbox_token() -> str:
    """Get Mapbox access token from environment variable.

    Returns:
        Mapbox access token string, or empty string if not set.
    """
    return os.environ.get("MAPBOX_TOKEN", "")


class MapboxMap(MapWidget):
    """Interactive map widget using Mapbox GL JS.

    This class provides a Python interface to Mapbox GL JS maps with
    full bidirectional communication through anywidget.

    Note:
        Requires a Mapbox access token. Set via MAPBOX_TOKEN environment
        variable or pass directly to the constructor.

    Example:
        >>> from anymap_ts import MapboxMap
        >>> m = MapboxMap(center=[-122.4, 37.8], zoom=10)
        >>> m.add_basemap("mapbox://styles/mapbox/streets-v12")
        >>> m
    """

    # ESM module for frontend
    _esm = STATIC_DIR / "mapbox.js"
    _css = STATIC_DIR / "mapbox.css"

    # Mapbox-specific traits
    access_token = traitlets.Unicode("").tag(sync=True)
    bearing = traitlets.Float(0.0).tag(sync=True)
    pitch = traitlets.Float(0.0).tag(sync=True)
    antialias = traitlets.Bool(True).tag(sync=True)
    double_click_zoom = traitlets.Bool(True).tag(sync=True)

    # Layer tracking
    _layer_dict = traitlets.Dict({}).tag(sync=True)

    def __init__(
        self,
        center: Tuple[float, float] = (0.0, 0.0),
        zoom: float = 2.0,
        width: str = "100%",
        height: str = "600px",
        style: str = "mapbox://styles/mapbox/streets-v12",
        bearing: float = 0.0,
        pitch: float = 0.0,
        access_token: Optional[str] = None,
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize a Mapbox map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string.
            style: Mapbox style URL (e.g., "mapbox://styles/mapbox/streets-v12").
            bearing: Map bearing in degrees.
            pitch: Map pitch in degrees.
            access_token: Mapbox access token. If None, reads from MAPBOX_TOKEN env var.
            controls: Dict of controls to add (e.g., {"navigation": True}).
            **kwargs: Additional widget arguments.
        """
        # Get access token
        token = access_token or get_mapbox_token()
        if not token:
            print(
                "Warning: No Mapbox access token provided. "
                "Set MAPBOX_TOKEN environment variable or pass access_token parameter."
            )

        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            style=style,
            bearing=bearing,
            pitch=pitch,
            access_token=token,
            **kwargs,
        )

        # Initialize layer dictionary
        self._layer_dict = {"Background": []}

        # Add default controls
        if controls is None:
            controls = {"navigation": True, "fullscreen": True}

        for control_name, config in controls.items():
            if config:
                self.add_control(
                    control_name, **(config if isinstance(config, dict) else {})
                )

    def set_access_token(self, token: str) -> None:
        """Set the Mapbox access token.

        Args:
            token: Mapbox access token.
        """
        self.access_token = token

    # -------------------------------------------------------------------------
    # Basemap Methods
    # -------------------------------------------------------------------------

    def add_basemap(
        self,
        basemap: str = "mapbox://styles/mapbox/streets-v12",
        attribution: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a basemap layer.

        For Mapbox styles, use the style URL format:
        - "mapbox://styles/mapbox/streets-v12"
        - "mapbox://styles/mapbox/satellite-v9"
        - "mapbox://styles/mapbox/satellite-streets-v12"
        - "mapbox://styles/mapbox/light-v11"
        - "mapbox://styles/mapbox/dark-v11"
        - "mapbox://styles/mapbox/outdoors-v12"

        Or use XYZ tile URLs for custom basemaps.

        Args:
            basemap: Mapbox style URL or XYZ tile URL.
            attribution: Custom attribution text.
            **kwargs: Additional options.
        """
        # If it's a Mapbox style URL, set it as the map style
        if basemap.startswith("mapbox://"):
            self.style = basemap
            return

        # Otherwise, treat as XYZ tile URL
        try:
            url, default_attribution = get_basemap_url(basemap)
        except (ValueError, KeyError):
            url = basemap
            default_attribution = ""

        self.call_js_method(
            "addBasemap",
            url,
            attribution=attribution or default_attribution,
            name=basemap,
            **kwargs,
        )

        # Track in layer dict
        basemaps = self._layer_dict.get("Basemaps", [])
        if basemap not in basemaps:
            self._layer_dict = {
                **self._layer_dict,
                "Basemaps": basemaps + [basemap],
            }

    # -------------------------------------------------------------------------
    # Vector Data Methods
    # -------------------------------------------------------------------------

    def add_vector(
        self,
        data: Any,
        layer_type: Optional[str] = None,
        paint: Optional[Dict] = None,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add vector data to the map.

        Supports GeoJSON, GeoDataFrame, or file paths to vector formats.

        Args:
            data: GeoJSON dict, GeoDataFrame, or path to vector file.
            layer_type: Mapbox layer type ('circle', 'line', 'fill', 'symbol').
            paint: Mapbox paint properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        geojson = to_geojson(data)

        # Handle URL data
        if geojson.get("type") == "url":
            self.add_geojson(
                geojson["url"],
                layer_type=layer_type,
                paint=paint,
                name=name,
                fit_bounds=fit_bounds,
                **kwargs,
            )
            return

        layer_id = name or f"vector-{len(self._layers)}"

        # Infer layer type if not specified
        if layer_type is None:
            layer_type = infer_layer_type(geojson)

        # Get default paint if not provided
        if paint is None:
            paint = get_default_paint(layer_type)

        # Get bounds
        bounds = get_bounds(data) if fit_bounds else None

        # Call JavaScript
        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            layerType=layer_type,
            paint=paint,
            fitBounds=fit_bounds,
            bounds=bounds,
            **kwargs,
        )

        # Track layer
        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": layer_type,
                "source": f"{layer_id}-source",
                "paint": paint,
            },
        }

    def add_geojson(
        self,
        data: Union[str, Dict],
        layer_type: Optional[str] = None,
        paint: Optional[Dict] = None,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add GeoJSON data to the map.

        Args:
            data: GeoJSON dict or URL to GeoJSON file.
            layer_type: Mapbox layer type.
            paint: Mapbox paint properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        self.add_vector(
            data,
            layer_type=layer_type,
            paint=paint,
            name=name,
            fit_bounds=fit_bounds,
            **kwargs,
        )

    # -------------------------------------------------------------------------
    # Raster Data Methods
    # -------------------------------------------------------------------------

    def add_tile_layer(
        self,
        url: str,
        name: Optional[str] = None,
        attribution: str = "",
        min_zoom: int = 0,
        max_zoom: int = 22,
        **kwargs,
    ) -> None:
        """Add an XYZ tile layer.

        Args:
            url: Tile URL template with {x}, {y}, {z} placeholders.
            name: Layer name.
            attribution: Attribution text.
            min_zoom: Minimum zoom level.
            max_zoom: Maximum zoom level.
            **kwargs: Additional options.
        """
        layer_id = name or f"tiles-{len(self._layers)}"

        self.call_js_method(
            "addTileLayer",
            url,
            name=layer_id,
            attribution=attribution,
            minZoom=min_zoom,
            maxZoom=max_zoom,
            **kwargs,
        )

        # Track layer
        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "raster",
                "source": f"{layer_id}-source",
            },
        }

    # -------------------------------------------------------------------------
    # Terrain Methods (Mapbox-specific)
    # -------------------------------------------------------------------------

    def add_terrain(
        self, exaggeration: float = 1.0, source: str = "mapbox-dem"
    ) -> None:
        """Add 3D terrain to the map.

        Args:
            exaggeration: Terrain exaggeration factor.
            source: Terrain source ID.
        """
        self.call_js_method("addTerrain", source=source, exaggeration=exaggeration)

    def remove_terrain(self) -> None:
        """Remove 3D terrain from the map."""
        self.call_js_method("removeTerrain")

    # -------------------------------------------------------------------------
    # Layer Management
    # -------------------------------------------------------------------------

    def add_layer(
        self,
        layer_id: str,
        layer_type: str,
        source: Union[str, Dict],
        paint: Optional[Dict] = None,
        layout: Optional[Dict] = None,
        before_id: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a generic layer to the map.

        Args:
            layer_id: Unique layer identifier.
            layer_type: Mapbox layer type.
            source: Source ID or source configuration dict.
            paint: Paint properties.
            layout: Layout properties.
            before_id: ID of layer to insert before.
            **kwargs: Additional layer options.
        """
        layer_config = {
            "id": layer_id,
            "type": layer_type,
            "paint": paint or {},
            "layout": layout or {},
            **kwargs,
        }

        if isinstance(source, str):
            layer_config["source"] = source
        else:
            source_id = f"{layer_id}-source"
            self._sources = {**self._sources, source_id: source}
            self.call_js_method("addSource", source_id, **source)
            layer_config["source"] = source_id

        self._layers = {**self._layers, layer_id: layer_config}
        self.call_js_method("addLayer", beforeId=before_id, **layer_config)

    def remove_layer(self, layer_id: str) -> None:
        """Remove a layer from the map.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removeLayer", layer_id)

    def set_visibility(self, layer_id: str, visible: bool) -> None:
        """Set layer visibility.

        Args:
            layer_id: Layer identifier.
            visible: Whether layer should be visible.
        """
        self.call_js_method("setVisibility", layer_id, visible)

    def set_opacity(self, layer_id: str, opacity: float) -> None:
        """Set layer opacity.

        Args:
            layer_id: Layer identifier.
            opacity: Opacity value between 0 and 1.
        """
        self.call_js_method("setOpacity", layer_id, opacity)

    # -------------------------------------------------------------------------
    # Controls
    # -------------------------------------------------------------------------

    def add_control(
        self,
        control_type: str,
        position: str = "top-right",
        **kwargs,
    ) -> None:
        """Add a map control.

        Args:
            control_type: Type of control ('navigation', 'scale', 'fullscreen', etc.).
            position: Control position.
            **kwargs: Control-specific options.
        """
        self.call_js_method("addControl", control_type, position=position, **kwargs)
        self._controls = {
            **self._controls,
            control_type: {"type": control_type, "position": position, **kwargs},
        }

    def remove_control(self, control_type: str) -> None:
        """Remove a map control.

        Args:
            control_type: Type of control to remove.
        """
        self.call_js_method("removeControl", control_type)
        if control_type in self._controls:
            controls = dict(self._controls)
            del controls[control_type]
            self._controls = controls

    # -------------------------------------------------------------------------
    # Markers
    # -------------------------------------------------------------------------

    def add_marker(
        self,
        lng: float,
        lat: float,
        color: str = "#3388ff",
        popup: Optional[str] = None,
        marker_id: Optional[str] = None,
    ) -> None:
        """Add a marker to the map.

        Args:
            lng: Longitude.
            lat: Latitude.
            color: Marker color.
            popup: HTML content for popup.
            marker_id: Unique marker ID.
        """
        self.call_js_method(
            "addMarker", lng, lat, color=color, popup=popup, id=marker_id
        )

    def remove_marker(self, marker_id: str) -> None:
        """Remove a marker from the map.

        Args:
            marker_id: Marker ID to remove.
        """
        self.call_js_method("removeMarker", marker_id)

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the map."""
        template_path = Path(__file__).parent / "templates" / "mapbox.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        # Serialize state
        state = {
            "center": self.center,
            "zoom": self.zoom,
            "style": self.style,
            "bearing": self.bearing,
            "pitch": self.pitch,
            "width": self.width,
            "height": self.height,
            "layers": self._layers,
            "sources": self._sources,
            "controls": self._controls,
            "js_calls": self._js_calls,
            "access_token": self.access_token,
        }

        template = template.replace("{{state}}", json.dumps(state, indent=2))
        return template

    def _get_default_template(self) -> str:
        """Get default HTML template."""
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const state = {{state}};

        mapboxgl.accessToken = state.access_token;

        const map = new mapboxgl.Map({
            container: 'map',
            style: state.style,
            center: state.center,
            zoom: state.zoom,
            bearing: state.bearing || 0,
            pitch: state.pitch || 0
        });

        map.on('load', function() {
            // Replay JS calls
            for (const call of state.js_calls || []) {
                try {
                    executeMethod(call.method, call.args, call.kwargs);
                } catch (e) {
                    console.error('Error executing', call.method, e);
                }
            }
        });

        function executeMethod(method, args, kwargs) {
            switch (method) {
                case 'addBasemap':
                    const url = args[0];
                    const name = kwargs.name || 'basemap';
                    const sourceId = 'basemap-' + name;
                    if (!map.getSource(sourceId)) {
                        map.addSource(sourceId, {
                            type: 'raster',
                            tiles: [url],
                            tileSize: 256,
                            attribution: kwargs.attribution || ''
                        });
                    }
                    if (!map.getLayer(sourceId)) {
                        map.addLayer({
                            id: sourceId,
                            type: 'raster',
                            source: sourceId
                        });
                    }
                    break;

                case 'addGeoJSON':
                    const layerName = kwargs.name;
                    const sourceIdGeo = layerName + '-source';
                    if (!map.getSource(sourceIdGeo)) {
                        map.addSource(sourceIdGeo, {
                            type: 'geojson',
                            data: kwargs.data
                        });
                    }
                    if (!map.getLayer(layerName)) {
                        map.addLayer({
                            id: layerName,
                            type: kwargs.layerType || 'circle',
                            source: sourceIdGeo,
                            paint: kwargs.paint || {}
                        });
                    }
                    if (kwargs.fitBounds && kwargs.bounds) {
                        map.fitBounds([
                            [kwargs.bounds[0], kwargs.bounds[1]],
                            [kwargs.bounds[2], kwargs.bounds[3]]
                        ], { padding: 50 });
                    }
                    break;

                case 'addTileLayer':
                    const tileUrl = args[0];
                    const tileName = kwargs.name;
                    const tileSourceId = tileName + '-source';
                    if (!map.getSource(tileSourceId)) {
                        map.addSource(tileSourceId, {
                            type: 'raster',
                            tiles: [tileUrl],
                            tileSize: 256,
                            attribution: kwargs.attribution || ''
                        });
                    }
                    if (!map.getLayer(tileName)) {
                        map.addLayer({
                            id: tileName,
                            type: 'raster',
                            source: tileSourceId
                        });
                    }
                    break;

                case 'addControl':
                    const controlType = args[0];
                    const position = kwargs.position || 'top-right';
                    let control;
                    switch (controlType) {
                        case 'navigation':
                            control = new mapboxgl.NavigationControl();
                            break;
                        case 'scale':
                            control = new mapboxgl.ScaleControl();
                            break;
                        case 'fullscreen':
                            control = new mapboxgl.FullscreenControl();
                            break;
                    }
                    if (control) {
                        map.addControl(control, position);
                    }
                    break;

                case 'addTerrain':
                    const terrainSource = kwargs.source || 'mapbox-dem';
                    if (!map.getSource(terrainSource)) {
                        map.addSource(terrainSource, {
                            type: 'raster-dem',
                            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                            tileSize: 512,
                            maxzoom: 14
                        });
                    }
                    map.setTerrain({ source: terrainSource, exaggeration: kwargs.exaggeration || 1 });
                    break;

                case 'removeTerrain':
                    map.setTerrain(null);
                    break;

                case 'flyTo':
                    map.flyTo({
                        center: [args[0], args[1]],
                        zoom: kwargs.zoom,
                        duration: kwargs.duration || 2000
                    });
                    break;

                case 'fitBounds':
                    const bounds = args[0];
                    map.fitBounds([
                        [bounds[0], bounds[1]],
                        [bounds[2], bounds[3]]
                    ], {
                        padding: kwargs.padding || 50,
                        duration: kwargs.duration || 1000
                    });
                    break;

                case 'addMarker':
                    new mapboxgl.Marker({ color: kwargs.color || '#3388ff' })
                        .setLngLat([args[0], args[1]])
                        .addTo(map);
                    break;

                default:
                    console.log('Unknown method:', method);
            }
        }
    </script>
</body>
</html>"""
