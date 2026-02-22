"""Leaflet map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import to_geojson, get_bounds, infer_layer_type

STATIC_DIR = Path(__file__).parent / "static"

# Default color ramps for choropleth
COLORS_YLGNBU = [
    "#ffffd9",
    "#edf8b1",
    "#c7e9b4",
    "#7fcdbb",
    "#41b6c4",
    "#1d91c0",
    "#225ea8",
    "#253494",
    "#081d58",
]


def _get_default_style(layer_type: str) -> Dict[str, Any]:
    """Get default Leaflet style for a layer type."""
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
    """Infer Leaflet layer type from GeoJSON."""
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


def _compute_thresholds(values: List[float], n_classes: int = 7) -> List[float]:
    """Compute equal-interval thresholds for a list of numeric values."""
    if not values:
        return []
    mn, mx = min(values), max(values)
    step = (mx - mn) / n_classes
    return [mn + step * i for i in range(1, n_classes)]


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

    _esm = STATIC_DIR / "leaflet.js"
    _css = STATIC_DIR / "leaflet.css"

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
            style="",
            **kwargs,
        )

        self._layer_dict = {"Background": []}

        if controls is None:
            controls = {
                "scale": {"position": "bottom-left"},
                "attribution": {"position": "bottom-right"},
                "layers": {"position": "top-right"},
            }

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
            basemap: Name of basemap provider (e.g., "OpenStreetMap",
                "CartoDB.Positron") or a tile URL.
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
        popup_properties: Optional[Union[List[str], bool]] = None,
        tooltip_property: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add vector data to the map.

        Supports GeoJSON dicts, GeoDataFrames, or file paths.

        Args:
            data: GeoJSON dict, GeoDataFrame, or path to vector file.
            style: Leaflet style properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            popup_properties: List of property names to show in popups,
                or True to show all properties.
            tooltip_property: Property name to use as tooltip text.
            **kwargs: Additional layer options.
        """
        geojson = to_geojson(data)

        if geojson.get("type") == "url":
            self.add_geojson(
                geojson["url"],
                style=style,
                name=name,
                fit_bounds=fit_bounds,
                popup_properties=popup_properties,
                tooltip_property=tooltip_property,
                **kwargs,
            )
            return

        layer_id = name or f"vector-{len(self._layers)}"

        if style is None:
            layer_type = _infer_leaflet_type(geojson)
            style = _get_default_style(layer_type)

        bounds = get_bounds(data) if fit_bounds else None

        js_kwargs: Dict[str, Any] = {
            "data": geojson,
            "name": layer_id,
            "style": style,
            "fitBounds": fit_bounds,
            "bounds": bounds,
        }
        if popup_properties is not None:
            js_kwargs["popupProperties"] = popup_properties
        if tooltip_property is not None:
            js_kwargs["tooltipProperty"] = tooltip_property

        self.call_js_method("addGeoJSON", **js_kwargs, **kwargs)

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "geojson", "style": style},
        }

    def add_geojson(
        self,
        data: Union[str, Dict],
        style: Optional[Dict] = None,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        popup_properties: Optional[Union[List[str], bool]] = None,
        tooltip_property: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add GeoJSON data to the map.

        Args:
            data: GeoJSON dict or URL to GeoJSON file.
            style: Leaflet style properties.
            name: Layer name.
            fit_bounds: Whether to fit map to data bounds.
            popup_properties: List of property names to show in popups,
                or True to show all properties.
            tooltip_property: Property name to use as tooltip text.
            **kwargs: Additional layer options.
        """
        self.add_vector(
            data,
            style=style,
            name=name,
            fit_bounds=fit_bounds,
            popup_properties=popup_properties,
            tooltip_property=tooltip_property,
            **kwargs,
        )

    # -------------------------------------------------------------------------
    # Raster / Tile Methods
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
            opacity: Layer opacity (0 to 1).
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

    def add_wms_layer(
        self,
        url: str,
        layers: str,
        name: Optional[str] = None,
        format: str = "image/png",
        transparent: bool = True,
        attribution: str = "",
        opacity: float = 1.0,
        crs: Optional[str] = None,
        styles: str = "",
        version: str = "1.1.1",
        **kwargs,
    ) -> None:
        """Add a WMS (Web Map Service) tile layer.

        Args:
            url: WMS service base URL.
            layers: Comma-separated WMS layer names.
            name: Layer name for the control.
            format: Image format (e.g., "image/png", "image/jpeg").
            transparent: Request transparent background.
            attribution: Attribution text.
            opacity: Layer opacity (0 to 1).
            crs: Coordinate reference system (e.g., "EPSG:4326").
            styles: WMS styles parameter.
            version: WMS version string.
            **kwargs: Additional WMS parameters.
        """
        layer_id = name or f"wms-{len(self._layers)}"

        self.call_js_method(
            "addWMSLayer",
            url,
            name=layer_id,
            layers=layers,
            format=format,
            transparent=transparent,
            attribution=attribution,
            opacity=opacity,
            crs=crs,
            styles=styles,
            version=version,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "wms"},
        }

    def remove_wms_layer(self, layer_id: str) -> None:
        """Remove a WMS layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self.remove_layer(layer_id)

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
            control_type: Type of control ('zoom', 'scale', 'attribution',
                'layers').
            position: Control position ('topleft', 'topright', 'bottomleft',
                'bottomright').
            **kwargs: Control-specific options.
        """
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
        tooltip: Optional[str] = None,
        marker_id: Optional[str] = None,
        draggable: bool = False,
        opacity: float = 1.0,
        icon_url: Optional[str] = None,
        icon_size: Optional[Tuple[int, int]] = None,
        icon_anchor: Optional[Tuple[int, int]] = None,
    ) -> None:
        """Add a marker to the map.

        Args:
            lng: Longitude.
            lat: Latitude.
            popup: HTML content for popup.
            tooltip: Tooltip text.
            marker_id: Unique marker ID.
            draggable: Whether marker can be dragged.
            opacity: Marker opacity (0 to 1).
            icon_url: URL to custom icon image.
            icon_size: Icon size as (width, height) in pixels.
            icon_anchor: Icon anchor point as (x, y) in pixels.
        """
        kw: Dict[str, Any] = {"popup": popup, "id": marker_id}
        if tooltip:
            kw["tooltip"] = tooltip
        if draggable:
            kw["draggable"] = True
        if opacity != 1.0:
            kw["opacity"] = opacity
        if icon_url:
            kw["iconUrl"] = icon_url
            if icon_size:
                kw["iconSize"] = list(icon_size)
            if icon_anchor:
                kw["iconAnchor"] = list(icon_anchor)

        self.call_js_method("addMarker", lng, lat, **kw)

    def add_markers(
        self,
        data: List[Dict[str, Any]],
        name: Optional[str] = None,
    ) -> None:
        """Add multiple markers as a layer group.

        Each item in *data* should be a dict with at least ``lng`` and
        ``lat`` keys.  Optional keys: ``popup``, ``tooltip``, ``iconUrl``,
        ``iconSize``.

        Args:
            data: List of marker dicts.
            name: Layer group name.
        """
        layer_id = name or f"markers-{len(self._layers)}"
        self.call_js_method("addMarkers", data=data, name=layer_id)
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "markers"},
        }

    def remove_marker(self, marker_id: str) -> None:
        """Remove a marker from the map.

        Args:
            marker_id: Marker ID to remove.
        """
        self.call_js_method("removeMarker", marker_id)

    # -------------------------------------------------------------------------
    # Shapes (Circle, CircleMarker, Polyline, Polygon, Rectangle)
    # -------------------------------------------------------------------------

    def add_circle_marker(
        self,
        lng: float,
        lat: float,
        radius: int = 10,
        name: Optional[str] = None,
        color: str = "#3388ff",
        fill_color: Optional[str] = None,
        fill_opacity: float = 0.5,
        weight: int = 2,
        opacity: float = 1.0,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
    ) -> None:
        """Add a circle marker (fixed pixel radius) to the map.

        Args:
            lng: Longitude.
            lat: Latitude.
            radius: Radius in pixels.
            name: Layer name.
            color: Stroke color.
            fill_color: Fill color (defaults to stroke color).
            fill_opacity: Fill opacity.
            weight: Stroke weight in pixels.
            opacity: Stroke opacity.
            popup: Popup HTML content.
            tooltip: Tooltip text.
        """
        layer_id = name or f"circle-marker-{len(self._layers)}"
        self.call_js_method(
            "addCircleMarker",
            lng,
            lat,
            name=layer_id,
            radius=radius,
            color=color,
            fillColor=fill_color or color,
            fillOpacity=fill_opacity,
            weight=weight,
            opacity=opacity,
            popup=popup,
            tooltip=tooltip,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "circle_marker"},
        }

    def add_circle(
        self,
        lng: float,
        lat: float,
        radius: float = 1000,
        name: Optional[str] = None,
        color: str = "#3388ff",
        fill_color: Optional[str] = None,
        fill_opacity: float = 0.2,
        weight: int = 2,
        opacity: float = 1.0,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
    ) -> None:
        """Add a geographic circle (radius in meters) to the map.

        Args:
            lng: Center longitude.
            lat: Center latitude.
            radius: Radius in meters.
            name: Layer name.
            color: Stroke color.
            fill_color: Fill color (defaults to stroke color).
            fill_opacity: Fill opacity.
            weight: Stroke weight in pixels.
            opacity: Stroke opacity.
            popup: Popup HTML content.
            tooltip: Tooltip text.
        """
        layer_id = name or f"circle-{len(self._layers)}"
        self.call_js_method(
            "addCircle",
            lng,
            lat,
            name=layer_id,
            radius=radius,
            color=color,
            fillColor=fill_color or color,
            fillOpacity=fill_opacity,
            weight=weight,
            opacity=opacity,
            popup=popup,
            tooltip=tooltip,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "circle"},
        }

    def add_polyline(
        self,
        coordinates: Sequence[Sequence[float]],
        name: Optional[str] = None,
        color: str = "#3388ff",
        weight: int = 3,
        opacity: float = 1.0,
        dash_array: Optional[str] = None,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
        fit_bounds: bool = False,
    ) -> None:
        """Add a polyline to the map.

        Args:
            coordinates: List of [lng, lat] pairs.
            name: Layer name.
            color: Line color.
            weight: Line weight in pixels.
            opacity: Line opacity.
            dash_array: Dash pattern (e.g., "5 10").
            popup: Popup HTML content.
            tooltip: Tooltip text.
            fit_bounds: Whether to fit map to polyline bounds.
        """
        layer_id = name or f"polyline-{len(self._layers)}"
        kw: Dict[str, Any] = {
            "coordinates": [list(c) for c in coordinates],
            "name": layer_id,
            "color": color,
            "weight": weight,
            "opacity": opacity,
            "fitBounds": fit_bounds,
        }
        if dash_array:
            kw["dashArray"] = dash_array
        if popup:
            kw["popup"] = popup
        if tooltip:
            kw["tooltip"] = tooltip

        self.call_js_method("addPolyline", **kw)
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "polyline"},
        }

    def add_polygon(
        self,
        coordinates: Sequence[Sequence[float]],
        name: Optional[str] = None,
        color: str = "#3388ff",
        fill_color: Optional[str] = None,
        fill_opacity: float = 0.5,
        weight: int = 2,
        opacity: float = 1.0,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
        fit_bounds: bool = False,
    ) -> None:
        """Add a polygon to the map.

        Args:
            coordinates: List of [lng, lat] vertex pairs.
            name: Layer name.
            color: Stroke color.
            fill_color: Fill color (defaults to stroke color).
            fill_opacity: Fill opacity.
            weight: Stroke weight in pixels.
            opacity: Stroke opacity.
            popup: Popup HTML content.
            tooltip: Tooltip text.
            fit_bounds: Whether to fit map to polygon bounds.
        """
        layer_id = name or f"polygon-{len(self._layers)}"
        self.call_js_method(
            "addPolygon",
            coordinates=[list(c) for c in coordinates],
            name=layer_id,
            color=color,
            fillColor=fill_color or color,
            fillOpacity=fill_opacity,
            weight=weight,
            opacity=opacity,
            popup=popup,
            tooltip=tooltip,
            fitBounds=fit_bounds,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "polygon"},
        }

    def add_rectangle(
        self,
        bounds: Tuple[float, float, float, float],
        name: Optional[str] = None,
        color: str = "#3388ff",
        fill_color: Optional[str] = None,
        fill_opacity: float = 0.2,
        weight: int = 2,
        opacity: float = 1.0,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
    ) -> None:
        """Add a rectangle to the map.

        Args:
            bounds: Bounding box as (west, south, east, north).
            name: Layer name.
            color: Stroke color.
            fill_color: Fill color (defaults to stroke color).
            fill_opacity: Fill opacity.
            weight: Stroke weight in pixels.
            opacity: Stroke opacity.
            popup: Popup HTML content.
            tooltip: Tooltip text.
        """
        layer_id = name or f"rectangle-{len(self._layers)}"
        self.call_js_method(
            "addRectangle",
            bounds=list(bounds),
            name=layer_id,
            color=color,
            fillColor=fill_color or color,
            fillOpacity=fill_opacity,
            weight=weight,
            opacity=opacity,
            popup=popup,
            tooltip=tooltip,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "rectangle"},
        }

    # -------------------------------------------------------------------------
    # Overlays (Image, Video)
    # -------------------------------------------------------------------------

    def add_image_overlay(
        self,
        url: str,
        bounds: Tuple[float, float, float, float],
        name: Optional[str] = None,
        opacity: float = 1.0,
        interactive: bool = False,
    ) -> None:
        """Add an image overlay to the map.

        Args:
            url: URL of the image to overlay.
            bounds: Bounding box as (west, south, east, north).
            name: Layer name.
            opacity: Image opacity (0 to 1).
            interactive: Whether the overlay responds to mouse events.
        """
        layer_id = name or f"image-{len(self._layers)}"
        self.call_js_method(
            "addImageOverlay",
            url,
            bounds=list(bounds),
            name=layer_id,
            opacity=opacity,
            interactive=interactive,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "image_overlay"},
        }

    def add_video_overlay(
        self,
        url: Union[str, List[str]],
        bounds: Tuple[float, float, float, float],
        name: Optional[str] = None,
        opacity: float = 1.0,
        autoplay: bool = True,
        loop: bool = True,
        muted: bool = True,
    ) -> None:
        """Add a video overlay to the map.

        Args:
            url: Video URL or list of URLs (for multiple formats).
            bounds: Bounding box as (west, south, east, north).
            name: Layer name.
            opacity: Video opacity (0 to 1).
            autoplay: Whether to autoplay the video.
            loop: Whether to loop the video.
            muted: Whether to mute the video.
        """
        layer_id = name or f"video-{len(self._layers)}"
        self.call_js_method(
            "addVideoOverlay",
            url=url if isinstance(url, list) else [url],
            bounds=list(bounds),
            name=layer_id,
            opacity=opacity,
            autoplay=autoplay,
            loop=loop,
            muted=muted,
        )
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "video_overlay"},
        }

    # -------------------------------------------------------------------------
    # Heatmap
    # -------------------------------------------------------------------------

    def add_heatmap(
        self,
        data: Any,
        name: Optional[str] = None,
        radius: int = 25,
        blur: int = 15,
        max_zoom: int = 18,
        max_val: float = 1.0,
        min_opacity: float = 0.05,
        gradient: Optional[Dict[str, str]] = None,
        value_column: Optional[str] = None,
        lat_column: str = "lat",
        lng_column: str = "lng",
    ) -> None:
        """Add a heatmap layer.

        Accepts a list of ``[lng, lat]`` or ``[lng, lat, intensity]``
        arrays, a GeoJSON FeatureCollection of Points, or a pandas/
        geopandas DataFrame.

        Args:
            data: Heat data – list of [lng, lat, intensity?] arrays,
                GeoJSON FeatureCollection, or DataFrame.
            name: Layer name.
            radius: Heatmap point radius in pixels.
            blur: Blur radius in pixels.
            max_zoom: Zoom level at which points reach full intensity.
            max_val: Maximum point intensity.
            min_opacity: Minimum opacity of heat points.
            gradient: Custom color gradient as {stop: color} dict,
                e.g. ``{0.4: "blue", 0.65: "lime", 1: "red"}``.
            value_column: Column name for intensity (DataFrame input).
            lat_column: Column name for latitude (DataFrame input).
            lng_column: Column name for longitude (DataFrame input).
        """
        layer_id = name or f"heatmap-{len(self._layers)}"
        heat_data = self._normalize_heatmap_data(
            data, value_column, lat_column, lng_column
        )

        kw: Dict[str, Any] = {
            "data": heat_data,
            "name": layer_id,
            "radius": radius,
            "blur": blur,
            "maxZoom": max_zoom,
            "max": max_val,
            "minOpacity": min_opacity,
        }
        if gradient:
            kw["gradient"] = {str(k): v for k, v in gradient.items()}

        self.call_js_method("addHeatmap", **kw)
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "heatmap"},
        }

    def remove_heatmap(self, name: str) -> None:
        """Remove a heatmap layer.

        Args:
            name: Heatmap layer name.
        """
        self.remove_layer(name)

    @staticmethod
    def _normalize_heatmap_data(
        data: Any,
        value_column: Optional[str] = None,
        lat_column: str = "lat",
        lng_column: str = "lng",
    ) -> List[List[float]]:
        """Convert various data formats to [[lng, lat, intensity], …]."""
        # Already a list of lists/tuples
        if isinstance(data, (list, tuple)) and len(data) > 0:
            first = data[0]
            if isinstance(first, (list, tuple)):
                return [list(p) for p in data]

        # GeoJSON FeatureCollection
        if isinstance(data, dict):
            if data.get("type") == "FeatureCollection":
                result = []
                for f in data.get("features", []):
                    geom = f.get("geometry", {})
                    if geom.get("type") == "Point":
                        coords = geom["coordinates"]
                        intensity = 1.0
                        if value_column and f.get("properties"):
                            val = f["properties"].get(value_column)
                            if val is not None:
                                intensity = float(val)
                        result.append([coords[0], coords[1], intensity])
                return result

        # DataFrame / GeoDataFrame
        try:
            import pandas as pd

            if isinstance(data, pd.DataFrame):
                has_geometry = hasattr(data, "geometry") and hasattr(data.geometry, "x")
                result = []
                for _, row in data.iterrows():
                    if has_geometry:
                        lng_val = row.geometry.x
                        lat_val = row.geometry.y
                    else:
                        lng_val = row[lng_column]
                        lat_val = row[lat_column]
                    intensity = float(row[value_column]) if value_column else 1.0
                    result.append([float(lng_val), float(lat_val), intensity])
                return result
        except ImportError:
            pass

        raise ValueError(
            "Unsupported data type for heatmap. Use a list of [lng, lat] "
            "or [lng, lat, intensity] arrays, a GeoJSON FeatureCollection, "
            "or a pandas/geopandas DataFrame."
        )

    # -------------------------------------------------------------------------
    # Choropleth
    # -------------------------------------------------------------------------

    def add_choropleth(
        self,
        data: Any,
        value_column: str,
        name: Optional[str] = None,
        colors: Optional[List[str]] = None,
        thresholds: Optional[List[float]] = None,
        n_classes: int = 7,
        fill_opacity: float = 0.7,
        line_color: str = "#ffffff",
        line_weight: int = 2,
        line_opacity: float = 1.0,
        popup_properties: Optional[Union[List[str], bool]] = None,
        tooltip_property: Optional[str] = None,
        fit_bounds: bool = True,
        legend_title: Optional[str] = None,
        legend_position: str = "bottomright",
    ) -> None:
        """Add an interactive choropleth layer.

        Inspired by the `Leaflet Interactive Choropleth
        <https://leafletjs.com/examples/choropleth/>`_ tutorial.

        Args:
            data: GeoJSON dict, GeoDataFrame, or path to vector file.
            value_column: Property/column name containing numeric values.
            name: Layer name.
            colors: List of colors for the scale. Defaults to a
                yellow-green-blue ramp.
            thresholds: Breakpoints between colour classes.  If *None*,
                equal-interval breaks are computed automatically.
            n_classes: Number of classes when auto-computing thresholds.
            fill_opacity: Polygon fill opacity.
            line_color: Polygon border color.
            line_weight: Border weight in pixels.
            line_opacity: Border opacity.
            popup_properties: Properties to show in popups (list or True).
            tooltip_property: Property for hover tooltip text.
            fit_bounds: Whether to fit map to data bounds.
            legend_title: Title for the legend (shows legend if provided).
            legend_position: Legend position on the map.
        """
        geojson = to_geojson(data)
        layer_id = name or f"choropleth-{len(self._layers)}"

        if colors is None:
            colors = COLORS_YLGNBU

        if thresholds is None:
            values = []
            for feat in geojson.get("features", []):
                val = feat.get("properties", {}).get(value_column)
                if val is not None:
                    try:
                        values.append(float(val))
                    except (TypeError, ValueError):
                        pass
            # _compute_thresholds(v, n) returns n-1 thresholds → n bins.
            # getColor needs len(colors) bins, so n = len(colors).
            n = len(colors) if colors else n_classes
            thresholds = _compute_thresholds(values, n)

        kw: Dict[str, Any] = {
            "data": geojson,
            "name": layer_id,
            "valueProperty": value_column,
            "colors": colors,
            "thresholds": thresholds,
            "fillOpacity": fill_opacity,
            "lineColor": line_color,
            "lineWeight": line_weight,
            "lineOpacity": line_opacity,
            "fitBounds": fit_bounds,
        }
        if popup_properties is not None:
            kw["popupProperties"] = popup_properties
        if tooltip_property:
            kw["tooltipProperty"] = tooltip_property
        if legend_title:
            kw["legendTitle"] = legend_title
            kw["legendPosition"] = legend_position

        self.call_js_method("addChoropleth", **kw)
        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "choropleth"},
        }

    # -------------------------------------------------------------------------
    # Popups
    # -------------------------------------------------------------------------

    def add_popup(
        self,
        lng: float,
        lat: float,
        content: str,
        popup_id: Optional[str] = None,
        max_width: int = 300,
        close_button: bool = True,
    ) -> None:
        """Add a standalone popup at a location.

        Args:
            lng: Longitude.
            lat: Latitude.
            content: HTML content for the popup.
            popup_id: Unique popup ID.
            max_width: Maximum popup width in pixels.
            close_button: Whether to show a close button.
        """
        self.call_js_method(
            "addPopup",
            lng,
            lat,
            content=content,
            id=popup_id,
            maxWidth=max_width,
            closeButton=close_button,
        )

    def remove_popup(self, popup_id: str) -> None:
        """Remove a popup.

        Args:
            popup_id: Popup ID to remove.
        """
        self.call_js_method("removePopup", popup_id)

    # -------------------------------------------------------------------------
    # Legend
    # -------------------------------------------------------------------------

    def add_legend(
        self,
        items: List[Dict[str, str]],
        title: Optional[str] = None,
        name: str = "legend",
        position: str = "bottomright",
    ) -> None:
        """Add a custom legend to the map.

        Args:
            items: List of dicts with "color" and "label" keys.
            title: Legend title.
            name: Legend identifier (for removal).
            position: Position on the map.
        """
        self.call_js_method(
            "addLegend",
            name=name,
            title=title,
            items=items,
            position=position,
        )

    def remove_legend(self, name: str = "legend") -> None:
        """Remove a legend.

        Args:
            name: Legend identifier.
        """
        self.call_js_method("removeLegend", name)

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
        const map = L.map('map').setView([state.center[1], state.center[0]], state.zoom);
        for (const call of state.js_calls || []) {
            try { executeMethod(call.method, call.args, call.kwargs); }
            catch (e) { console.error('Error executing', call.method, e); }
        }

        function executeMethod(method, args, kwargs) {
            switch (method) {
                case 'addBasemap':
                case 'addTileLayer':
                    L.tileLayer(args[0], {
                        attribution: kwargs.attribution || '',
                        maxZoom: kwargs.maxZoom || 22,
                        minZoom: kwargs.minZoom || 0,
                        opacity: kwargs.opacity || 1
                    }).addTo(map);
                    break;
                case 'addGeoJSON': {
                    const style = kwargs.style || { color: '#3388ff', weight: 2, opacity: 0.8, fillOpacity: 0.5 };
                    const layer = L.geoJSON(kwargs.data, {
                        style: style,
                        pointToLayer: (f, ll) => L.circleMarker(ll, style)
                    }).addTo(map);
                    if (kwargs.fitBounds) map.fitBounds(layer.getBounds(), { padding: [50, 50] });
                    break;
                }
                case 'addControl': {
                    const pos = kwargs.position || 'topright';
                    if (args[0] === 'zoom' || args[0] === 'navigation') L.control.zoom({ position: pos }).addTo(map);
                    else if (args[0] === 'scale') L.control.scale({ position: pos, imperial: false }).addTo(map);
                    break;
                }
                case 'addMarker': {
                    const mk = L.marker([args[1], args[0]]).addTo(map);
                    if (kwargs.popup) mk.bindPopup(kwargs.popup);
                    break;
                }
                case 'flyTo':
                    map.flyTo([args[1], args[0]], kwargs.zoom || map.getZoom(), { duration: (kwargs.duration || 2000) / 1000 });
                    break;
                case 'fitBounds': {
                    const b = args[0];
                    map.fitBounds([[b[1], b[0]], [b[3], b[2]]], { padding: [kwargs.padding || 50, kwargs.padding || 50] });
                    break;
                }
                default:
                    console.log('Unknown method:', method);
            }
        }
    </script>
</body>
</html>"""
