"""OpenLayers map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import to_geojson, get_bounds, infer_layer_type

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


class OpenLayersMap(MapWidget):
    """Interactive map widget using OpenLayers.

    This class provides a Python interface to OpenLayers maps with
    full bidirectional communication through anywidget. OpenLayers
    excels at WMS/WMTS support and projection handling.

    Example:
        >>> from anymap_ts import OpenLayersMap
        >>> m = OpenLayersMap(center=[-122.4, 37.8], zoom=10)
        >>> m.add_basemap("OpenStreetMap")
        >>> m.add_wms_layer(
        ...     url="https://example.com/wms",
        ...     layers="layer_name",
        ...     name="WMS Layer"
        ... )
        >>> m
    """

    # ESM module for frontend
    _esm = STATIC_DIR / "openlayers.js"

    # OpenLayers-specific traits
    projection = traitlets.Unicode("EPSG:3857").tag(sync=True)
    rotation = traitlets.Float(0.0).tag(sync=True)

    def __init__(
        self,
        center: Tuple[float, float] = (0.0, 0.0),
        zoom: float = 2.0,
        width: str = "100%",
        height: str = "600px",
        projection: str = "EPSG:3857",
        rotation: float = 0.0,
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize an OpenLayers map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string.
            projection: Map projection (default EPSG:3857).
            rotation: Map rotation in radians.
            controls: Dict of controls to add.
            **kwargs: Additional widget arguments.
        """
        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            projection=projection,
            rotation=rotation,
            **kwargs,
        )

        # Add default controls
        if controls is None:
            controls = {"zoom": True, "attribution": True}

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
        url, default_attribution = get_basemap_url(basemap)
        self.call_js_method(
            "addBasemap",
            url,
            attribution=attribution or default_attribution,
            name=basemap,
            **kwargs,
        )

        basemaps = self._layer_dict.get("Basemaps", [])
        if basemap not in basemaps:
            self._layer_dict = {
                **self._layer_dict,
                "Basemaps": basemaps + [basemap],
            }

    # -------------------------------------------------------------------------
    # Tile Layer Methods
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

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "tile"},
        }

    # -------------------------------------------------------------------------
    # Vector Data Methods
    # -------------------------------------------------------------------------

    def add_vector(
        self,
        data: Any,
        name: Optional[str] = None,
        style: Optional[Dict] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add vector data to the map.

        Args:
            data: GeoJSON dict, GeoDataFrame, or path to vector file.
            name: Layer name.
            style: Style configuration dict.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        geojson = to_geojson(data)
        layer_id = name or f"vector-{len(self._layers)}"

        if style is None:
            style = self._get_default_style(geojson)

        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            style=style,
            fitBounds=fit_bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "vector"},
        }

    def add_geojson(
        self,
        data: Union[str, Dict],
        name: Optional[str] = None,
        style: Optional[Dict] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add GeoJSON data to the map.

        Args:
            data: GeoJSON dict or URL to GeoJSON file.
            name: Layer name.
            style: Style configuration dict.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.
        """
        self.add_vector(
            data,
            name=name,
            style=style,
            fit_bounds=fit_bounds,
            **kwargs,
        )

    def _get_default_style(self, geojson: Dict) -> Dict:
        """Get default style based on geometry type.

        Args:
            geojson: GeoJSON data.

        Returns:
            Style configuration dict.
        """
        geom_type = self._infer_geom_type(geojson)

        if geom_type in ["Point", "MultiPoint"]:
            return {
                "fillColor": "rgba(51, 136, 255, 0.8)",
                "strokeColor": "#ffffff",
                "strokeWidth": 2,
                "radius": 6,
            }
        elif geom_type in ["LineString", "MultiLineString"]:
            return {
                "strokeColor": "#3388ff",
                "strokeWidth": 3,
            }
        else:  # Polygon, MultiPolygon
            return {
                "fillColor": "rgba(51, 136, 255, 0.5)",
                "strokeColor": "#3388ff",
                "strokeWidth": 2,
            }

    def _infer_geom_type(self, geojson: Dict) -> str:
        """Infer geometry type from GeoJSON.

        Args:
            geojson: GeoJSON data.

        Returns:
            Geometry type string.
        """
        if geojson.get("type") == "FeatureCollection":
            features = geojson.get("features", [])
            if features:
                return features[0].get("geometry", {}).get("type", "Point")
        elif geojson.get("type") == "Feature":
            return geojson.get("geometry", {}).get("type", "Point")
        return "Point"

    # -------------------------------------------------------------------------
    # WMS/WMTS Methods
    # -------------------------------------------------------------------------

    def add_wms_layer(
        self,
        url: str,
        layers: str,
        name: Optional[str] = None,
        format: str = "image/png",
        transparent: bool = True,
        server_type: Optional[str] = None,
        attribution: str = "",
        **kwargs,
    ) -> None:
        """Add a WMS tile layer.

        Args:
            url: WMS service URL.
            layers: Comma-separated layer names.
            name: Layer name for the map.
            format: Image format (default: image/png).
            transparent: Whether to request transparent images.
            server_type: Server type ('mapserver', 'geoserver', 'qgis').
            attribution: Attribution text.
            **kwargs: Additional WMS parameters.
        """
        layer_id = name or f"wms-{len(self._layers)}"

        self.call_js_method(
            "addWMSLayer",
            url=url,
            layers=layers,
            name=layer_id,
            format=format,
            transparent=transparent,
            serverType=server_type,
            attribution=attribution,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "wms"},
        }

    def add_image_wms_layer(
        self,
        url: str,
        layers: str,
        name: Optional[str] = None,
        format: str = "image/png",
        transparent: bool = True,
        server_type: Optional[str] = None,
        attribution: str = "",
        **kwargs,
    ) -> None:
        """Add a single-image WMS layer (not tiled).

        Args:
            url: WMS service URL.
            layers: Comma-separated layer names.
            name: Layer name for the map.
            format: Image format (default: image/png).
            transparent: Whether to request transparent images.
            server_type: Server type ('mapserver', 'geoserver', 'qgis').
            attribution: Attribution text.
            **kwargs: Additional WMS parameters.
        """
        layer_id = name or f"imagewms-{len(self._layers)}"

        self.call_js_method(
            "addImageWMSLayer",
            url=url,
            layers=layers,
            name=layer_id,
            format=format,
            transparent=transparent,
            serverType=server_type,
            attribution=attribution,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "imagewms"},
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
        position: str = "top-right",
        **kwargs,
    ) -> None:
        """Add a map control.

        Args:
            control_type: Type of control ('zoom', 'scale', 'fullscreen', etc.).
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
    # Navigation
    # -------------------------------------------------------------------------

    def set_center(self, lng: float, lat: float) -> None:
        """Set the map center.

        Args:
            lng: Longitude.
            lat: Latitude.
        """
        self.center = [lng, lat]
        self.call_js_method("setCenter", lng, lat)

    def set_zoom(self, zoom: float) -> None:
        """Set the map zoom level.

        Args:
            zoom: Zoom level.
        """
        self.zoom = zoom
        self.call_js_method("setZoom", zoom)

    def fly_to(
        self,
        lng: float,
        lat: float,
        zoom: Optional[float] = None,
        duration: int = 2000,
    ) -> None:
        """Animate to a new location.

        Args:
            lng: Target longitude.
            lat: Target latitude.
            zoom: Target zoom level (optional).
            duration: Animation duration in milliseconds.
        """
        self.call_js_method(
            "flyTo", lng, lat, zoom=zoom or self.zoom, duration=duration
        )

    def fit_bounds(
        self,
        bounds: List[float],
        padding: int = 50,
        duration: int = 1000,
    ) -> None:
        """Fit the map to bounds.

        Args:
            bounds: Bounds as [minLng, minLat, maxLng, maxLat].
            padding: Padding in pixels.
            duration: Animation duration in milliseconds.
        """
        self.call_js_method("fitBounds", bounds, padding=padding, duration=duration)

    def fit_extent(
        self,
        extent: List[float],
        padding: int = 50,
        duration: int = 1000,
    ) -> None:
        """Fit the map to an extent (in map projection).

        Args:
            extent: Extent as [minX, minY, maxX, maxY] in map projection.
            padding: Padding in pixels.
            duration: Animation duration in milliseconds.
        """
        self.call_js_method("fitExtent", extent, padding=padding, duration=duration)

    # -------------------------------------------------------------------------
    # Markers
    # -------------------------------------------------------------------------

    def add_marker(
        self,
        lng: float,
        lat: float,
        popup: Optional[str] = None,
        color: str = "#3388ff",
        name: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a marker to the map.

        Args:
            lng: Marker longitude.
            lat: Marker latitude.
            popup: Popup content (HTML string).
            color: Marker color.
            name: Marker identifier.
            **kwargs: Additional options.
        """
        marker_id = name or f"marker-{len(self._layers)}"
        self.call_js_method(
            "addMarker",
            lng,
            lat,
            popup=popup,
            color=color,
            id=marker_id,
            **kwargs,
        )

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the map."""
        template_path = Path(__file__).parent / "templates" / "openlayers.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        state = {
            "center": self.center,
            "zoom": self.zoom,
            "projection": self.projection,
            "rotation": self.rotation,
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
    <title>OpenLayers Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@v10.0.0/ol.css">
    <script src="https://cdn.jsdelivr.net/npm/ol@v10.0.0/dist/ol.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const state = {{state}};

        const map = new ol.Map({
            target: 'map',
            view: new ol.View({
                center: ol.proj.fromLonLat(state.center),
                zoom: state.zoom
            })
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
