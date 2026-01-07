"""Leaflet map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import to_geojson, get_bounds, infer_layer_type


# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


def _get_default_style(layer_type: str) -> Dict[str, Any]:
    """Get default Leaflet style for a layer type.

    Args:
        layer_type: Type of layer ('point', 'line', 'polygon').

    Returns:
        Dict with Leaflet style properties.
    """
    defaults = {
        "point": {
            "radius": 8,
            "fillColor": "#3388ff",
            "color": "#ffffff",
            "weight": 2,
            "opacity": 1,
            "fillOpacity": 0.8,
        },
        "line": {
            "color": "#3388ff",
            "weight": 3,
            "opacity": 0.8,
        },
        "polygon": {
            "fillColor": "#3388ff",
            "color": "#0000ff",
            "weight": 2,
            "opacity": 1,
            "fillOpacity": 0.5,
        },
    }
    return defaults.get(layer_type, defaults["point"])


def _infer_leaflet_type(geojson: Dict) -> str:
    """Infer Leaflet layer type from GeoJSON.

    Args:
        geojson: GeoJSON dict.

    Returns:
        Layer type string ('point', 'line', 'polygon').
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

    if geometry_type in ("Point", "MultiPoint"):
        return "point"
    elif geometry_type in ("LineString", "MultiLineString"):
        return "line"
    elif geometry_type in ("Polygon", "MultiPolygon"):
        return "polygon"
    return "point"


class LeafletMap(MapWidget):
    """Interactive map widget using Leaflet.

    This class provides a Python interface to Leaflet maps with
    full bidirectional communication through anywidget.

    Note:
        Leaflet uses [lat, lng] order internally, but this class
        accepts [lng, lat] for consistency with other map libraries.

    Example:
        >>> from anymap_ts import LeafletMap
        >>> m = LeafletMap(center=[-122.4, 37.8], zoom=10)
        >>> m.add_basemap("OpenStreetMap")
        >>> m
    """

    # ESM module for frontend
    _esm = STATIC_DIR / "leaflet.js"
    _css = STATIC_DIR / "leaflet.css"

    # Layer tracking
    _layer_dict = traitlets.Dict({}).tag(sync=True)

    def __init__(
        self,
        center: Tuple[float, float] = (0.0, 0.0),
        zoom: float = 2.0,
        width: str = "100%",
        height: str = "600px",
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize a Leaflet map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string.
            controls: Dict of controls to add (e.g., {"zoom": True}).
            **kwargs: Additional widget arguments.
        """
        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            style="",  # Leaflet doesn't use style URLs
            **kwargs,
        )

        # Initialize layer dictionary
        self._layer_dict = {"Background": []}

        # Add default controls
        if controls is None:
            controls = {"zoom": True, "scale": True}

        for control_name, config in controls.items():
            if config:
                self.add_control(
                    control_name, **(config if isinstance(config, dict) else {})
                )

    # -------------------------------------------------------------------------
    # Basemap Methods
    # -------------------------------------------------------------------------

    def add_basemap(
        self,
        basemap: str = "OpenStreetMap",
        attribution: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a basemap layer.

        Args:
            basemap: Name of basemap provider (e.g., "OpenStreetMap", "CartoDB.Positron").
            attribution: Custom attribution text.
            **kwargs: Additional options.
        """
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
        style: Optional[Dict] = None,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add vector data to the map.

        Supports GeoJSON, GeoDataFrame, or file paths to vector formats.

        Args:
            data: GeoJSON dict, GeoDataFrame, or path to vector file.
            style: Leaflet style properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        geojson = to_geojson(data)

        # Handle URL data
        if geojson.get("type") == "url":
            self.add_geojson(
                geojson["url"],
                style=style,
                name=name,
                fit_bounds=fit_bounds,
                **kwargs,
            )
            return

        layer_id = name or f"vector-{len(self._layers)}"

        # Get default style if not provided
        if style is None:
            layer_type = _infer_leaflet_type(geojson)
            style = _get_default_style(layer_type)

        # Get bounds
        bounds = get_bounds(data) if fit_bounds else None

        # Call JavaScript
        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            style=style,
            fitBounds=fit_bounds,
            bounds=bounds,
            **kwargs,
        )

        # Track layer
        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "geojson",
                "style": style,
            },
        }

    def add_geojson(
        self,
        data: Union[str, Dict],
        style: Optional[Dict] = None,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add GeoJSON data to the map.

        Args:
            data: GeoJSON dict or URL to GeoJSON file.
            style: Leaflet style properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        self.add_vector(
            data,
            style=style,
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
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add an XYZ tile layer.

        Args:
            url: Tile URL template with {x}, {y}, {z} placeholders.
            name: Layer name.
            attribution: Attribution text.
            min_zoom: Minimum zoom level.
            max_zoom: Maximum zoom level.
            opacity: Layer opacity.
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
            opacity=opacity,
            **kwargs,
        )

        # Track layer
        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "tile",
            },
        }

    # -------------------------------------------------------------------------
    # Layer Management
    # -------------------------------------------------------------------------

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
        position: str = "topright",
        **kwargs,
    ) -> None:
        """Add a map control.

        Args:
            control_type: Type of control ('zoom', 'scale', 'attribution', 'layers').
            position: Control position ('topleft', 'topright', 'bottomleft', 'bottomright').
            **kwargs: Control-specific options.
        """
        # Convert position format
        position_map = {
            "top-left": "topleft",
            "top-right": "topright",
            "bottom-left": "bottomleft",
            "bottom-right": "bottomright",
        }
        pos = position_map.get(position, position)

        self.call_js_method("addControl", control_type, position=pos, **kwargs)
        self._controls = {
            **self._controls,
            control_type: {"type": control_type, "position": pos, **kwargs},
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

    def add_layer_control(
        self,
        position: str = "topright",
        collapsed: bool = True,
    ) -> None:
        """Add a layer control for toggling layer visibility.

        Args:
            position: Control position.
            collapsed: Whether control starts collapsed.
        """
        self.add_control("layers", position=position, collapsed=collapsed)

    # -------------------------------------------------------------------------
    # Markers
    # -------------------------------------------------------------------------

    def add_marker(
        self,
        lng: float,
        lat: float,
        popup: Optional[str] = None,
        marker_id: Optional[str] = None,
    ) -> None:
        """Add a marker to the map.

        Args:
            lng: Longitude.
            lat: Latitude.
            popup: HTML content for popup.
            marker_id: Unique marker ID.
        """
        self.call_js_method("addMarker", lng, lat, popup=popup, id=marker_id)

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
        template_path = Path(__file__).parent / "templates" / "leaflet.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        # Serialize state
        state = {
            "center": self.center,
            "zoom": self.zoom,
            "width": self.width,
            "height": self.height,
            "layers": self._layers,
            "controls": self._controls,
            "js_calls": self._js_calls,
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
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const state = {{state}};

        // Note: Leaflet uses [lat, lng], but we store [lng, lat]
        const map = L.map('map').setView([state.center[1], state.center[0]], state.zoom);

        // Replay JS calls
        for (const call of state.js_calls || []) {
            try {
                executeMethod(call.method, call.args, call.kwargs);
            } catch (e) {
                console.error('Error executing', call.method, e);
            }
        }

        function executeMethod(method, args, kwargs) {
            switch (method) {
                case 'addBasemap':
                case 'addTileLayer':
                    const url = args[0];
                    L.tileLayer(url, {
                        attribution: kwargs.attribution || '',
                        maxZoom: kwargs.maxZoom || 22,
                        minZoom: kwargs.minZoom || 0,
                        opacity: kwargs.opacity || 1
                    }).addTo(map);
                    break;

                case 'addGeoJSON':
                    const geojson = kwargs.data;
                    const style = kwargs.style || {
                        color: '#3388ff',
                        weight: 2,
                        opacity: 0.8,
                        fillOpacity: 0.5
                    };
                    const layer = L.geoJSON(geojson, {
                        style: style,
                        pointToLayer: (feature, latlng) => L.circleMarker(latlng, style)
                    }).addTo(map);

                    if (kwargs.fitBounds) {
                        map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                    }
                    break;

                case 'addControl':
                    const controlType = args[0];
                    const position = kwargs.position || 'topright';
                    if (controlType === 'zoom' || controlType === 'navigation') {
                        L.control.zoom({ position }).addTo(map);
                    } else if (controlType === 'scale') {
                        L.control.scale({ position, imperial: false }).addTo(map);
                    }
                    break;

                case 'addMarker':
                    const [lng, lat] = args;
                    const marker = L.marker([lat, lng]).addTo(map);
                    if (kwargs.popup) {
                        marker.bindPopup(kwargs.popup);
                    }
                    break;

                case 'flyTo':
                    map.flyTo([args[1], args[0]], kwargs.zoom || map.getZoom(), {
                        duration: (kwargs.duration || 2000) / 1000
                    });
                    break;

                case 'fitBounds':
                    const bounds = args[0];
                    map.fitBounds([
                        [bounds[1], bounds[0]],
                        [bounds[3], bounds[2]]
                    ], { padding: [kwargs.padding || 50, kwargs.padding || 50] });
                    break;

                default:
                    console.log('Unknown method:', method);
            }
        }
    </script>
</body>
</html>"""
