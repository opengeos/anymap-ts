"""OpenLayers map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import (
    to_geojson,
    get_bounds,
    fetch_geojson,
    get_choropleth_colors,
    compute_breaks,
)

STATIC_DIR = Path(__file__).parent / "static"


class OpenLayersMap(MapWidget):
    """Interactive map widget using OpenLayers.

    OpenLayers excels at WMS/WMTS support, projection handling,
    vector tiles, heatmaps, clustering, and advanced GIS operations.

    Example:
        >>> from anymap_ts import OpenLayersMap
        >>> m = OpenLayersMap(center=[-122.4, 37.8], zoom=10)
        >>> m.add_basemap("OpenStreetMap")
        >>> m
    """

    _esm = STATIC_DIR / "openlayers.js"
    _css = STATIC_DIR / "openlayers.css"

    # OpenLayers-specific traits
    projection = traitlets.Unicode("EPSG:3857").tag(sync=True)
    rotation = traitlets.Float(0.0).tag(sync=True)

    # Layer tracking
    _layer_dict = traitlets.Dict({}).tag(sync=True)

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
            controls: Dict of controls to add. Pass False to disable defaults.
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

        self._layer_dict = {"Background": []}

        if controls is None:
            controls = {
                "zoom": True,
                "attribution": True,
                "scale": {"units": "metric"},
            }

        if controls is not False:
            for control_name, config in controls.items():
                if config:
                    self.add_control(
                        control_name,
                        **(config if isinstance(config, dict) else {}),
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
            basemap: Name of basemap provider or a tile URL.
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
        popup: Optional[str] = None,
        popup_properties: Optional[List[str]] = None,
        **kwargs,
    ) -> None:
        """Add vector data to the map.

        Args:
            data: GeoJSON dict, GeoDataFrame, URL, or file path.
            name: Layer name.
            style: Style configuration dict with keys like fillColor, strokeColor,
                strokeWidth, radius, lineDash, text, textColor, font.
            fit_bounds: Whether to fit map to data bounds.
            popup: HTML template for popups, with {property} placeholders.
            popup_properties: List of property names to show in popup table.
            **kwargs: Additional layer options.
        """
        geojson = to_geojson(data)

        if geojson.get("type") == "url":
            self.add_geojson_from_url(
                geojson["url"],
                name=name,
                style=style,
                fit_bounds=fit_bounds,
                **kwargs,
            )
            return

        layer_id = name or f"vector-{len(self._layers)}"

        if style is None:
            style = self._get_default_style(geojson)

        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            style=style,
            fitBounds=fit_bounds,
            popup=popup,
            popupProperties=popup_properties,
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
        popup: Optional[str] = None,
        popup_properties: Optional[List[str]] = None,
        **kwargs,
    ) -> None:
        """Add GeoJSON data to the map.

        Args:
            data: GeoJSON dict, URL to GeoJSON, or file path.
            name: Layer name.
            style: Style configuration dict.
            fit_bounds: Whether to fit map to data bounds.
            popup: HTML template for popups.
            popup_properties: List of property names to show in popup.
            **kwargs: Additional layer options.
        """
        self.add_vector(
            data,
            name=name,
            style=style,
            fit_bounds=fit_bounds,
            popup=popup,
            popup_properties=popup_properties,
            **kwargs,
        )

    def add_geojson_from_url(
        self,
        url: str,
        name: Optional[str] = None,
        style: Optional[Dict] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add GeoJSON from a URL (loaded directly by the browser).

        Args:
            url: URL to GeoJSON file.
            name: Layer name.
            style: Style configuration dict.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional options.
        """
        layer_id = name or f"geojson-url-{len(self._layers)}"

        if style is None:
            style = {
                "fillColor": "rgba(51, 136, 255, 0.5)",
                "strokeColor": "#3388ff",
                "strokeWidth": 2,
                "radius": 6,
            }

        self.call_js_method(
            "addGeoJSONFromURL",
            url=url,
            name=layer_id,
            style=style,
            fitBounds=fit_bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "vector-url"},
        }

    def _get_default_style(self, geojson: Dict) -> Dict:
        """Get default style based on geometry type."""
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
        else:
            return {
                "fillColor": "rgba(51, 136, 255, 0.5)",
                "strokeColor": "#3388ff",
                "strokeWidth": 2,
            }

    def _infer_geom_type(self, geojson: Dict) -> str:
        """Infer geometry type from GeoJSON."""
        if geojson.get("type") == "FeatureCollection":
            features = geojson.get("features", [])
            if features:
                return features[0].get("geometry", {}).get("type", "Point")
        elif geojson.get("type") == "Feature":
            return geojson.get("geometry", {}).get("type", "Point")
        return "Point"

    # -------------------------------------------------------------------------
    # Heatmap
    # -------------------------------------------------------------------------

    def add_heatmap(
        self,
        data: Any,
        name: Optional[str] = None,
        weight: Optional[str] = None,
        blur: int = 15,
        radius: int = 8,
        opacity: float = 0.8,
        gradient: Optional[List[str]] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a heatmap layer (native OpenLayers heatmap).

        Args:
            data: GeoJSON (Point features), GeoDataFrame, or file path.
            name: Layer name.
            weight: Feature property to use as weight.
            blur: Blur size in pixels.
            radius: Radius size in pixels.
            opacity: Layer opacity.
            gradient: Color gradient as list of CSS color strings.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional options.
        """
        geojson = to_geojson(data)
        layer_id = name or f"heatmap-{len(self._layers)}"

        self.call_js_method(
            "addHeatmap",
            data=geojson,
            name=layer_id,
            weight=weight,
            blur=blur,
            radius=radius,
            opacity=opacity,
            gradient=gradient,
            fitBounds=fit_bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "heatmap"},
        }

    # -------------------------------------------------------------------------
    # Clustering
    # -------------------------------------------------------------------------

    def add_cluster_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        distance: int = 40,
        min_distance: int = 20,
        cluster_color: str = "rgba(51, 136, 255, 0.7)",
        point_color: str = "rgba(51, 136, 255, 0.9)",
        text_color: str = "#fff",
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a clustered point layer.

        Args:
            data: GeoJSON (Point features), GeoDataFrame, or file path.
            name: Layer name.
            distance: Distance in pixels within which features are clustered.
            min_distance: Minimum distance between clusters.
            cluster_color: Color of cluster circles.
            point_color: Color of individual point circles.
            text_color: Color of cluster count text.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional options.
        """
        geojson = to_geojson(data)
        layer_id = name or f"cluster-{len(self._layers)}"

        self.call_js_method(
            "addClusterLayer",
            data=geojson,
            name=layer_id,
            distance=distance,
            minDistance=min_distance,
            clusterColor=cluster_color,
            pointColor=point_color,
            textColor=text_color,
            fitBounds=fit_bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "cluster"},
        }

    def remove_cluster_layer(self, name: str) -> None:
        """Remove a cluster layer.

        Args:
            name: Layer name to remove.
        """
        self.remove_layer(name)

    # -------------------------------------------------------------------------
    # Choropleth
    # -------------------------------------------------------------------------

    def add_choropleth(
        self,
        data: Any,
        column: str,
        cmap: str = "YlOrRd",
        k: int = 5,
        classification: str = "quantile",
        name: Optional[str] = None,
        stroke_color: str = "#333",
        stroke_width: float = 1,
        opacity: float = 0.7,
        fit_bounds: bool = True,
        legend: bool = True,
        manual_breaks: Optional[List[float]] = None,
        **kwargs,
    ) -> None:
        """Add a choropleth (thematic) map layer.

        Args:
            data: GeoJSON or GeoDataFrame with polygon features.
            column: Property/column name to color by.
            cmap: Colormap name (e.g., 'YlOrRd', 'Blues', 'viridis').
            k: Number of classes.
            classification: Classification method ('quantile', 'equal_interval',
                'natural_breaks', 'manual').
            name: Layer name.
            stroke_color: Outline color.
            stroke_width: Outline width.
            opacity: Layer opacity.
            fit_bounds: Whether to fit map to data bounds.
            legend: Whether to show a legend.
            manual_breaks: Custom break values for 'manual' classification.
            **kwargs: Additional options.
        """
        geojson = to_geojson(data)
        layer_id = name or f"choropleth-{len(self._layers)}"

        features = geojson.get("features", [])
        values = []
        for f in features:
            val = f.get("properties", {}).get(column)
            if val is not None:
                try:
                    values.append(float(val))
                except (TypeError, ValueError):
                    pass

        if not values:
            raise ValueError(f"No numeric values found for column '{column}'")

        colors = get_choropleth_colors(cmap, k)
        breaks = compute_breaks(values, classification, k, manual_breaks)

        self.call_js_method(
            "addChoropleth",
            data=geojson,
            name=layer_id,
            column=column,
            breaks=breaks,
            colors=colors,
            strokeColor=stroke_color,
            strokeWidth=stroke_width,
            opacity=opacity,
            fitBounds=fit_bounds,
            legend=legend,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "choropleth"},
        }

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

    def add_wmts_layer(
        self,
        url: str,
        layer: str,
        name: Optional[str] = None,
        matrix_set: str = "EPSG:3857",
        format: str = "image/png",
        style: str = "default",
        attribution: str = "",
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a WMTS tile layer.

        WMTS (Web Map Tile Service) provides pre-rendered tiles
        and is faster than WMS for large-scale maps.

        Args:
            url: WMTS service URL.
            layer: Layer identifier.
            name: Display name for the layer.
            matrix_set: Tile matrix set (projection), e.g., 'EPSG:3857'.
            format: Tile format (default: image/png).
            style: Style identifier (default: 'default').
            attribution: Attribution text.
            opacity: Layer opacity.
            **kwargs: Additional options.
        """
        layer_id = name or f"wmts-{len(self._layers)}"

        self.call_js_method(
            "addWMTSLayer",
            url=url,
            layer=layer,
            name=layer_id,
            matrixSet=matrix_set,
            format=format,
            style=style,
            attribution=attribution,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "wmts"},
        }

    # -------------------------------------------------------------------------
    # Vector Tiles
    # -------------------------------------------------------------------------

    def add_vector_tile_layer(
        self,
        url: str,
        name: Optional[str] = None,
        style: Optional[Dict] = None,
        attribution: str = "",
        min_zoom: int = 0,
        max_zoom: int = 22,
        **kwargs,
    ) -> None:
        """Add a vector tile layer (MVT/PBF format).

        Args:
            url: Vector tile URL template with {x}, {y}, {z} placeholders.
            name: Layer name.
            style: Style configuration dict.
            attribution: Attribution text.
            min_zoom: Minimum zoom level.
            max_zoom: Maximum zoom level.
            **kwargs: Additional options.
        """
        layer_id = name or f"vectortile-{len(self._layers)}"

        self.call_js_method(
            "addVectorTileLayer",
            url=url,
            name=layer_id,
            style=style or {},
            attribution=attribution,
            minZoom=min_zoom,
            maxZoom=max_zoom,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "vectortile"},
        }

    # -------------------------------------------------------------------------
    # Image Overlay
    # -------------------------------------------------------------------------

    def add_image_layer(
        self,
        url: str,
        bounds: List[float],
        name: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a georeferenced image overlay.

        Args:
            url: URL to the image.
            bounds: Image extent as [west, south, east, north] in EPSG:4326.
            name: Layer name.
            opacity: Layer opacity.
            **kwargs: Additional options.
        """
        layer_id = name or f"image-{len(self._layers)}"

        self.call_js_method(
            "addImageLayer",
            url=url,
            name=layer_id,
            bounds=bounds,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "image"},
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

    def set_layer_style(self, layer_id: str, style: Dict) -> None:
        """Update the style of a vector layer.

        Args:
            layer_id: Layer identifier.
            style: New style configuration dict.
        """
        self.call_js_method("setLayerStyle", layer_id, style=style)

    def set_layer_z_index(self, layer_id: str, z_index: int) -> None:
        """Set the z-index (draw order) of a layer.

        Args:
            layer_id: Layer identifier.
            z_index: Z-index value (higher = drawn on top).
        """
        self.call_js_method("setLayerZIndex", layer_id, z_index)

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

        Supported control types:
            - 'zoom': Zoom in/out buttons
            - 'scale': Scale bar
            - 'fullscreen': Fullscreen toggle
            - 'attribution': Attribution display
            - 'rotate': Rotation reset button
            - 'mousePosition': Coordinate display at cursor
            - 'overviewMap': Mini overview map
            - 'zoomSlider': Zoom slider
            - 'zoomToExtent': Zoom to full extent button

        Args:
            control_type: Type of control.
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

    def add_layer_control(self, collapsed: bool = True) -> None:
        """Add a layer visibility control panel.

        Args:
            collapsed: Whether the panel starts collapsed.
        """
        self.call_js_method("addLayerControl", collapsed=collapsed)

    def remove_layer_control(self) -> None:
        """Remove the layer control panel."""
        self.call_js_method("removeLayerControl")

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

    def set_rotation(self, rotation: float) -> None:
        """Set the map rotation.

        Args:
            rotation: Rotation in radians.
        """
        self.rotation = rotation
        self.call_js_method("setRotation", rotation)

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
        radius: int = 8,
        draggable: bool = False,
        **kwargs,
    ) -> None:
        """Add a marker to the map.

        Args:
            lng: Marker longitude.
            lat: Marker latitude.
            popup: Popup content (HTML string).
            color: Marker color.
            name: Marker identifier.
            radius: Marker radius in pixels.
            draggable: Whether the marker can be dragged.
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
            radius=radius,
            draggable=draggable,
            **kwargs,
        )

    def remove_marker(self, name: str) -> None:
        """Remove a marker from the map.

        Args:
            name: Marker identifier to remove.
        """
        self.call_js_method("removeMarker", name)

    # -------------------------------------------------------------------------
    # Popups / Overlays
    # -------------------------------------------------------------------------

    def show_popup(
        self,
        lng: float,
        lat: float,
        content: str,
    ) -> None:
        """Show a popup at a location.

        Args:
            lng: Longitude.
            lat: Latitude.
            content: HTML content for the popup.
        """
        self.call_js_method("showPopup", lng=lng, lat=lat, content=content)

    def remove_popup(self) -> None:
        """Remove/close the current popup."""
        self.call_js_method("removePopup")

    # -------------------------------------------------------------------------
    # Draw Interaction
    # -------------------------------------------------------------------------

    def add_draw_control(
        self,
        draw_type: str = "Polygon",
        **kwargs,
    ) -> None:
        """Add a drawing interaction to the map.

        Allows users to draw features on the map. Drawn features are
        synced back as GeoJSON in the `_draw_data` trait.

        Args:
            draw_type: Geometry type to draw. One of 'Point', 'LineString',
                'Polygon', 'Circle'.
            **kwargs: Additional options.
        """
        self.call_js_method("addDrawControl", type=draw_type, **kwargs)

    def remove_draw_control(self) -> None:
        """Remove the drawing interaction."""
        self.call_js_method("removeDrawControl")

    def clear_draw_data(self) -> None:
        """Clear all drawn features."""
        self.call_js_method("clearDrawData")

    @property
    def draw_data(self) -> Dict:
        """Get the current drawn features as GeoJSON.

        Returns:
            GeoJSON FeatureCollection of drawn features.
        """
        return self._draw_data

    # -------------------------------------------------------------------------
    # Measure
    # -------------------------------------------------------------------------

    def add_measure_control(
        self,
        measure_type: str = "LineString",
        **kwargs,
    ) -> None:
        """Add a measurement tool.

        Args:
            measure_type: Type of measurement.
                'LineString' for distance, 'Polygon' for area.
            **kwargs: Additional options.
        """
        self.call_js_method("addMeasureControl", type=measure_type, **kwargs)

    def remove_measure_control(self) -> None:
        """Remove the measurement tool."""
        self.call_js_method("removeMeasureControl")

    # -------------------------------------------------------------------------
    # Select Interaction
    # -------------------------------------------------------------------------

    def add_select_interaction(self, multi: bool = False) -> None:
        """Add a click-to-select interaction.

        Selected feature properties are stored in `_queried_features`.

        Args:
            multi: Whether to allow selecting multiple features.
        """
        self.call_js_method("addSelectInteraction", multi=multi)

    def remove_select_interaction(self) -> None:
        """Remove the select interaction."""
        self.call_js_method("removeSelectInteraction")

    # -------------------------------------------------------------------------
    # Graticule
    # -------------------------------------------------------------------------

    def add_graticule(
        self,
        stroke_color: str = "rgba(0, 0, 0, 0.2)",
        stroke_width: float = 1,
        show_labels: bool = True,
    ) -> None:
        """Add a coordinate grid (graticule) overlay.

        Args:
            stroke_color: Grid line color.
            stroke_width: Grid line width.
            show_labels: Whether to show coordinate labels.
        """
        self.call_js_method(
            "addGraticule",
            strokeColor=stroke_color,
            strokeWidth=stroke_width,
            showLabels=show_labels,
        )

    def remove_graticule(self) -> None:
        """Remove the graticule overlay."""
        self.call_js_method("removeGraticule")

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
