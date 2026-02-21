"""MapLibre GL JS map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.parse import urlencode

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url, get_maplibre_style
from .utils import (
    to_geojson,
    get_bounds,
    infer_layer_type,
    get_default_paint,
    fetch_geojson,
)

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


class MapLibreMap(MapWidget):
    """Interactive map widget using MapLibre GL JS.

    This class provides a Python interface to MapLibre GL JS maps with
    full bidirectional communication through anywidget.

    Example:
        >>> from anymap_ts import Map
        >>> m = Map(center=[-122.4, 37.8], zoom=10)
        >>> m.add_basemap("OpenStreetMap")
        >>> m
    """

    # ESM module for frontend
    _esm = STATIC_DIR / "maplibre.js"
    _css = STATIC_DIR / "maplibre.css"

    # MapLibre-specific traits
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
        height: str = "700px",
        style: Union[
            str, Dict
        ] = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        bearing: float = 0.0,
        pitch: float = 0.0,
        max_pitch: float = 85.0,
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize a MapLibre map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string. Default is "700px".
            style: MapLibre style URL or style object. Default is "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json".
            bearing: Map bearing in degrees.
            pitch: Map pitch in degrees.
            max_pitch: Maximum pitch angle in degrees (default: 85).
            controls: Dict of controls to add. If None, defaults to
                {"layer-control": True, "control-grid": True}.
                Use {"layer-control": {"collapsed": True}} for custom options.
            **kwargs: Additional widget arguments.
        """
        # Handle style shortcuts
        if isinstance(style, str) and not style.startswith("http"):
            try:
                style = get_maplibre_style(style)
            except ValueError:
                pass  # Use as-is

        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            style=style,
            bearing=bearing,
            pitch=pitch,
            max_pitch=max_pitch,
            **kwargs,
        )

        # Initialize layer dictionary
        self._layer_dict = {"Background": []}

        # Add default controls
        if controls is None:
            controls = {
                "layer-control": True,
                "control-grid": True,
            }

        for control_name, config in controls.items():
            if config:
                if control_name == "layer-control":
                    self.add_layer_control(
                        **(config if isinstance(config, dict) else {})
                    )
                elif control_name == "control-grid":
                    self.add_control_grid(
                        **(config if isinstance(config, dict) else {})
                    )
                else:
                    self.add_control(
                        control_name, **(config if isinstance(config, dict) else {})
                    )

    # -------------------------------------------------------------------------
    # Layer Dict Helper
    # -------------------------------------------------------------------------

    def _add_to_layer_dict(self, layer_id: str, category: str = "Overlays") -> None:
        """Add a layer to the layer dictionary for UI tracking.

        Args:
            layer_id: The layer identifier.
            category: The category to add the layer to (e.g., "Overlays", "Raster").
        """
        layers = self._layer_dict.get(category, [])
        if layer_id not in layers:
            self._layer_dict = {
                **self._layer_dict,
                category: layers + [layer_id],
            }

    def _remove_from_layer_dict(self, layer_id: str) -> None:
        """Remove a layer from the layer dictionary.

        Args:
            layer_id: The layer identifier to remove.
        """
        new_dict = {}
        for category, layers in self._layer_dict.items():
            if layer_id in layers:
                new_layers = [lid for lid in layers if lid != layer_id]
                if new_layers:  # Only keep category if it still has layers
                    new_dict[category] = new_layers
            else:
                new_dict[category] = layers
        self._layer_dict = new_dict

    # -------------------------------------------------------------------------
    # Validation Helpers
    # -------------------------------------------------------------------------

    def _validate_opacity(self, opacity: float, param_name: str = "opacity") -> float:
        """Validate opacity value is between 0 and 1.

        Args:
            opacity: The opacity value to validate.
            param_name: Name of the parameter for error messages.

        Returns:
            The validated opacity value.

        Raises:
            ValueError: If opacity is not between 0 and 1.
        """
        if not 0 <= opacity <= 1:
            raise ValueError(f"{param_name} must be between 0 and 1, got {opacity}")
        return opacity

    def _validate_position(self, position: str) -> str:
        """Validate control position is valid.

        Args:
            position: The position string to validate.

        Returns:
            The validated position string.

        Raises:
            ValueError: If position is not valid.
        """
        valid_positions = ["top-left", "top-right", "bottom-left", "bottom-right"]
        if position not in valid_positions:
            raise ValueError(
                f"Position must be one of: {', '.join(valid_positions)}, got '{position}'"
            )
        return position

    def _remove_layer_internal(self, layer_id: str, js_method: str) -> None:
        """Internal helper to remove a layer.

        Args:
            layer_id: The layer identifier to remove.
            js_method: The JavaScript method to call for removal.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self._remove_from_layer_dict(layer_id)
        self.call_js_method(js_method, layer_id)

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
            basemap: Name of basemap provider (e.g., "OpenStreetMap", "CartoDB.Positron")
            attribution: Custom attribution text
            **kwargs: Additional options
        """
        url, default_attribution = get_basemap_url(basemap)
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
            data: GeoJSON dict, GeoDataFrame, or path to vector file
            layer_type: MapLibre layer type ('circle', 'line', 'fill', 'symbol')
            paint: MapLibre paint properties
            name: Layer name
            fit_bounds: Whether to fit map to data bounds
            **kwargs: Additional layer options
        """
        geojson = to_geojson(data)

        layer_id = name or f"vector-{len(self._layers)}"

        # Handle URL data - fetch GeoJSON to get bounds and infer layer type
        if geojson.get("type") == "url":
            url = geojson["url"]
            # Fetch the actual GeoJSON data from URL
            geojson = fetch_geojson(url)

        # Infer layer type if not specified
        if layer_type is None:
            layer_type = infer_layer_type(geojson)

        # Get default paint if not provided
        if paint is None:
            paint = get_default_paint(layer_type)

        # Get bounds (use geojson dict, not original data which may be a URL)
        bounds = get_bounds(geojson) if fit_bounds else None

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
        self._add_to_layer_dict(layer_id, "Vector")

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
            data: GeoJSON dict or URL to GeoJSON file
            layer_type: MapLibre layer type
            paint: MapLibre paint properties
            name: Layer name
            fit_bounds: Whether to fit map to data bounds
            **kwargs: Additional layer options
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
    # Marker Methods
    # -------------------------------------------------------------------------

    def add_marker(
        self,
        lng: float,
        lat: float,
        popup: Optional[str] = None,
        tooltip: Optional[str] = None,
        color: str = "#3388ff",
        draggable: bool = False,
        scale: float = 1.0,
        popup_max_width: str = "240px",
        tooltip_max_width: str = "240px",
        name: Optional[str] = None,
        **kwargs,
    ) -> str:
        """Add a single marker to the map.

        Args:
            lng: Longitude of the marker.
            lat: Latitude of the marker.
            popup: Optional popup HTML content (shown on click).
            tooltip: Optional tooltip HTML content (shown on hover).
            color: Marker color as hex string.
            draggable: Whether the marker can be dragged.
            scale: Marker size multiplier (default 1.0, range 0.1 to 3.0).
            popup_max_width: Maximum width of popup (CSS value, default "240px").
            tooltip_max_width: Maximum width of tooltip (CSS value, default "240px").
            name: Marker identifier. If None, auto-generated.
            **kwargs: Additional marker options.

        Returns:
            The marker identifier.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map(center=[-122.4, 37.8], zoom=10)
            >>> m.add_marker(-122.4, 37.8, popup="San Francisco", tooltip="Hover me!")
            >>> m.add_marker(-122.5, 37.7, scale=1.5, color="#ff0000")
        """
        marker_id = name or f"marker-{len(self._layers)}"

        self.call_js_method(
            "addMarker",
            lng,
            lat,
            id=marker_id,
            popup=popup,
            tooltip=tooltip,
            color=color,
            draggable=draggable,
            scale=scale,
            popupMaxWidth=popup_max_width,
            tooltipMaxWidth=tooltip_max_width,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            marker_id: {
                "id": marker_id,
                "type": "marker",
                "lngLat": [lng, lat],
            },
        }
        self._add_to_layer_dict(marker_id, "Markers")
        return marker_id

    def add_markers(
        self,
        data: Any,
        lng_column: Optional[str] = None,
        lat_column: Optional[str] = None,
        popup_column: Optional[str] = None,
        tooltip_column: Optional[str] = None,
        color: str = "#3388ff",
        scale: float = 1.0,
        popup_max_width: str = "240px",
        tooltip_max_width: str = "240px",
        draggable: bool = False,
        name: Optional[str] = None,
        **kwargs,
    ) -> str:
        """Add multiple markers from data.

        Args:
            data: Data source - can be:
                - List of dicts with 'lng'/'lon'/'longitude' and 'lat'/'latitude' keys
                - GeoDataFrame with Point geometries
                - GeoJSON FeatureCollection with Point features
            lng_column: Column name for longitude (auto-detected if None).
            lat_column: Column name for latitude (auto-detected if None).
            popup_column: Column name for popup content (shown on click).
            tooltip_column: Column name for tooltip content (shown on hover).
            color: Marker color as hex string.
            scale: Marker size multiplier (default 1.0, range 0.1 to 3.0).
            popup_max_width: Maximum width of popup (CSS value, default "240px").
            tooltip_max_width: Maximum width of tooltip (CSS value, default "240px").
            draggable: Whether markers can be dragged.
            name: Layer identifier. If None, auto-generated.
            **kwargs: Additional marker options.

        Returns:
            The layer identifier.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> cities = [
            ...     {"name": "SF", "info": "San Francisco", "lng": -122.4, "lat": 37.8},
            ...     {"name": "NYC", "info": "New York City", "lng": -74.0, "lat": 40.7},
            ... ]
            >>> m.add_markers(cities, popup_column="name", tooltip_column="info", scale=1.5)
        """
        layer_id = name or f"markers-{len(self._layers)}"
        markers = []

        # Handle GeoDataFrame
        if hasattr(data, "geometry"):
            for _, row in data.iterrows():
                geom = row.geometry
                if geom.geom_type == "Point":
                    marker = {"lngLat": [geom.x, geom.y]}
                    if popup_column and popup_column in row:
                        marker["popup"] = str(row[popup_column])
                    if tooltip_column and tooltip_column in row:
                        marker["tooltip"] = str(row[tooltip_column])
                    markers.append(marker)
        # Handle GeoJSON
        elif isinstance(data, dict) and data.get("type") == "FeatureCollection":
            for feature in data.get("features", []):
                geom = feature.get("geometry", {})
                if geom.get("type") == "Point":
                    coords = geom.get("coordinates", [])
                    marker = {"lngLat": coords[:2]}
                    props = feature.get("properties", {})
                    if popup_column and popup_column in props:
                        marker["popup"] = str(props[popup_column])
                    if tooltip_column and tooltip_column in props:
                        marker["tooltip"] = str(props[tooltip_column])
                    markers.append(marker)
        # Handle list of dicts
        elif isinstance(data, list):
            lng_keys = ["lng", "lon", "longitude", "x"]
            lat_keys = ["lat", "latitude", "y"]

            for item in data:
                if not isinstance(item, dict):
                    continue

                # Find lng/lat values
                lng_val = None
                lat_val = None

                if lng_column and lng_column in item:
                    lng_val = item[lng_column]
                else:
                    for key in lng_keys:
                        if key in item:
                            lng_val = item[key]
                            break

                if lat_column and lat_column in item:
                    lat_val = item[lat_column]
                else:
                    for key in lat_keys:
                        if key in item:
                            lat_val = item[key]
                            break

                if lng_val is not None and lat_val is not None:
                    marker = {"lngLat": [float(lng_val), float(lat_val)]}
                    if popup_column and popup_column in item:
                        marker["popup"] = str(item[popup_column])
                    if tooltip_column and tooltip_column in item:
                        marker["tooltip"] = str(item[tooltip_column])
                    markers.append(marker)

        if not markers:
            raise ValueError("No valid point data found in input")

        self.call_js_method(
            "addMarkers",
            id=layer_id,
            markers=markers,
            color=color,
            scale=scale,
            popupMaxWidth=popup_max_width,
            tooltipMaxWidth=tooltip_max_width,
            draggable=draggable,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "markers",
                "count": len(markers),
            },
        }
        self._add_to_layer_dict(layer_id, "Markers")
        return layer_id

    def remove_marker(self, marker_id: str) -> None:
        """Remove a marker from the map.

        Args:
            marker_id: Marker identifier to remove.
        """
        self._remove_layer_internal(marker_id, "removeMarker")

    # -------------------------------------------------------------------------
    # Heatmap Methods
    # -------------------------------------------------------------------------

    def add_heatmap(
        self,
        data: Any,
        weight_property: Optional[str] = None,
        radius: int = 20,
        intensity: float = 1.0,
        colormap: Optional[List] = None,
        opacity: float = 0.8,
        name: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a heatmap layer to the map.

        Creates a heatmap visualization from point data using MapLibre's
        native heatmap layer type.

        Args:
            data: Point data - can be GeoJSON, GeoDataFrame, or file path.
            weight_property: Property name to use for point weights.
                If None, all points have equal weight.
            radius: Radius of influence for each point in pixels.
            intensity: Intensity multiplier for the heatmap.
            colormap: Color gradient as list of [stop, color] pairs.
                Example: [[0, "blue"], [0.5, "yellow"], [1, "red"]]
                Default: blue-yellow-red gradient.
            opacity: Layer opacity (0-1).
            name: Layer identifier. If None, auto-generated.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional heatmap layer options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_heatmap(
            ...     "earthquakes.geojson",
            ...     weight_property="magnitude",
            ...     radius=30,
            ...     colormap=[[0, "blue"], [0.5, "lime"], [1, "red"]]
            ... )
        """
        self._validate_opacity(opacity)
        layer_id = name or f"heatmap-{len(self._layers)}"

        # Convert data to GeoJSON
        geojson = to_geojson(data)

        # Handle URL data - fetch GeoJSON
        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

        # Default colormap
        if colormap is None:
            colormap = [
                [0, "rgba(33,102,172,0)"],
                [0.2, "rgb(103,169,207)"],
                [0.4, "rgb(209,229,240)"],
                [0.6, "rgb(253,219,199)"],
                [0.8, "rgb(239,138,98)"],
                [1, "rgb(178,24,43)"],
            ]

        # Build heatmap paint properties
        paint = {
            "heatmap-radius": radius,
            "heatmap-intensity": intensity,
            "heatmap-opacity": opacity,
            "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
            ],
        }

        # Add colormap stops
        for stop, color in colormap:
            paint["heatmap-color"].extend([stop, color])

        # Add weight if specified
        if weight_property:
            paint["heatmap-weight"] = ["get", weight_property]

        # Get bounds
        bounds = get_bounds(geojson) if fit_bounds else None

        self.call_js_method(
            "addGeoJSON",
            data=geojson,
            name=layer_id,
            layerType="heatmap",
            paint=paint,
            fitBounds=fit_bounds,
            bounds=bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "heatmap",
                "source": f"{layer_id}-source",
                "paint": paint,
            },
        }
        self._add_to_layer_dict(layer_id, "Heatmap")

    # -------------------------------------------------------------------------
    # Raster Data Methods
    # -------------------------------------------------------------------------

    def add_raster(
        self,
        source: str,
        name: Optional[str] = None,
        attribution: str = "",
        indexes: Optional[List[int]] = None,
        colormap: Optional[str] = None,
        vmin: Optional[float] = None,
        vmax: Optional[float] = None,
        nodata: Optional[float] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a raster layer from a local file using localtileserver.

        Args:
            source: Path to local raster file
            name: Layer name
            attribution: Attribution text
            indexes: Band indexes to use
            colormap: Colormap name
            vmin: Minimum value for colormap
            vmax: Maximum value for colormap
            nodata: NoData value
            fit_bounds: Whether to fit map to raster bounds
            **kwargs: Additional options
        """
        try:
            from localtileserver import TileClient
        except ImportError:
            raise ImportError(
                "localtileserver is required for local raster support. "
                "Install with: pip install anymap-ts[raster]"
            )

        client = TileClient(source)

        # Build parameters dict and pass all at once
        tile_params = {}
        if indexes:
            tile_params["indexes"] = indexes
        if colormap:
            tile_params["colormap"] = colormap
        if vmin is not None or vmax is not None:
            tile_params["vmin"] = vmin if vmin is not None else client.min
            tile_params["vmax"] = vmax if vmax is not None else client.max
        if nodata is not None:
            tile_params["nodata"] = nodata

        tile_url = client.get_tile_url(**tile_params)

        layer_name = name or Path(source).stem

        self.add_tile_layer(
            tile_url,
            name=layer_name,
            attribution=attribution,
            **kwargs,
        )

        # Fit bounds if requested
        if fit_bounds:
            bounds = client.bounds()
            if bounds:
                self.fit_bounds([bounds[0], bounds[1], bounds[2], bounds[3]])

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
            url: Tile URL template with {x}, {y}, {z} placeholders
            name: Layer name
            attribution: Attribution text
            min_zoom: Minimum zoom level
            max_zoom: Maximum zoom level
            **kwargs: Additional options
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
        self._add_to_layer_dict(layer_id, "Raster")

    def add_stac_layer(
        self,
        url: Optional[str] = None,
        item: Optional[Any] = None,
        assets: Optional[List[str]] = None,
        colormap: Optional[str] = None,
        rescale: Optional[List[float]] = None,
        opacity: float = 1.0,
        layer_id: Optional[str] = None,
        titiler_endpoint: str = "https://titiler.xyz",
        attribution: str = "STAC",
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a STAC (SpatioTemporal Asset Catalog) layer to the map.

        Uses TiTiler to render STAC items as XYZ tiles on the map.
        Supports both STAC item URLs and pystac Item objects.

        Args:
            url: URL to a STAC item JSON
            item: A pystac Item object
            assets: List of asset names/bands to visualize
            colormap: Colormap name (e.g., 'viridis', 'plasma', 'inferno')
            rescale: Min/max values for rescaling as [min, max]
            opacity: Layer opacity (0-1)
            layer_id: Custom layer identifier
            titiler_endpoint: TiTiler server endpoint URL
            attribution: Attribution text for the layer
            fit_bounds: Whether to fit map to STAC item bounds
            **kwargs: Additional tile layer options

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> # From URL
            >>> m.add_stac_layer(
            ...     url="https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/S2A_MSIL2A_20220101T181901_N0301_R027_T10TEM_20220101T201906",
            ...     assets=["red", "green", "blue"],
            ...     rescale=[0, 3000]
            ... )
            >>> # From pystac Item
            >>> import pystac
            >>> item = pystac.Item.from_file("path/to/item.json")
            >>> m.add_stac_layer(item=item, assets=["nir", "red"], colormap="ndvi")
        """
        if url is None and item is None:
            raise ValueError("Either 'url' or 'item' must be provided")

        if url is not None and item is not None:
            raise ValueError("Provide either 'url' or 'item', not both")

        # Handle pystac Item object
        if item is not None:
            try:
                # Check if it's a pystac Item
                if hasattr(item, "to_dict") and hasattr(item, "self_href"):
                    stac_url = item.self_href
                    if not stac_url:
                        # Try to get URL from item properties if no self_href
                        if hasattr(item, "links"):
                            for link in item.links:
                                if link.rel == "self":
                                    stac_url = link.href
                                    break
                        if not stac_url:
                            raise ValueError(
                                "STAC item must have a self_href or self link for tile generation"
                            )
                else:
                    raise ValueError(
                        "Item must be a pystac Item object with to_dict() and self_href attributes"
                    )
            except Exception as e:
                raise ValueError(f"Invalid STAC item: {e}")
        else:
            stac_url = url

        # Build TiTiler tile URL
        tile_params = {"url": stac_url}

        if assets:
            tile_params["assets"] = ",".join(assets)
        if colormap:
            tile_params["colormap_name"] = colormap
        if rescale:
            if len(rescale) == 2:
                tile_params["rescale"] = f"{rescale[0]},{rescale[1]}"
            else:
                raise ValueError("rescale must be a list of two values [min, max]")

        # Construct tile URL template
        query_string = urlencode(tile_params)
        tile_url = f"{titiler_endpoint.rstrip('/')}/stac/tiles/{{z}}/{{x}}/{{y}}?{query_string}"

        layer_name = layer_id or f"stac-{len(self._layers)}"

        # Add as tile layer
        self.add_tile_layer(
            url=tile_url,
            name=layer_name,
            attribution=attribution,
            **kwargs,
        )

        # Update layer info to mark as STAC
        if layer_name in self._layers:
            self._layers[layer_name].update(
                {
                    "stac_url": stac_url,
                    "stac_assets": assets,
                    "colormap": colormap,
                    "rescale": rescale,
                }
            )

        # Try to fit bounds if requested and we have an item object
        if fit_bounds and item is not None:
            try:
                bbox = item.bbox
                if bbox and len(bbox) == 4:
                    self.fit_bounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]])
            except Exception:
                pass  # Skip bounds fitting if bbox is not available

    # -------------------------------------------------------------------------
    # COG Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_cog_layer(
        self,
        url: str,
        name: Optional[str] = None,
        opacity: float = 1.0,
        visible: bool = True,
        debug: bool = False,
        debug_opacity: float = 0.25,
        max_error: float = 0.125,
        fit_bounds: bool = True,
        before_id: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a Cloud Optimized GeoTIFF (COG) layer using @developmentseed/deck.gl-geotiff.

        This method renders COG files directly in the browser using GPU-accelerated
        deck.gl-geotiff rendering with automatic reprojection support.

        Args:
            url: URL to the Cloud Optimized GeoTIFF file.
            name: Layer ID. If None, auto-generated.
            opacity: Layer opacity (0-1).
            visible: Whether layer is visible.
            debug: Show reprojection mesh for debugging.
            debug_opacity: Opacity of debug mesh (0-1).
            max_error: Maximum reprojection error in pixels. Lower values
                create denser mesh for better accuracy.
            fit_bounds: Whether to fit map to COG bounds after loading.
            before_id: ID of layer to insert before.
            **kwargs: Additional COGLayer props.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_cog_layer(
            ...     "https://example.com/landcover.tif",
            ...     name="landcover",
            ...     opacity=0.8
            ... )
        """
        layer_id = name or f"cog-{len(self._layers)}"

        self.call_js_method(
            "addCOGLayer",
            id=layer_id,
            geotiff=url,
            opacity=opacity,
            visible=visible,
            debug=debug,
            debugOpacity=debug_opacity,
            maxError=max_error,
            fitBounds=fit_bounds,
            beforeId=before_id,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "cog",
                "url": url,
            },
        }
        self._add_to_layer_dict(layer_id, "Raster")

    def remove_cog_layer(self, layer_id: str) -> None:
        """Remove a COG layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removeCOGLayer")

    # -------------------------------------------------------------------------
    # Zarr Layer (@carbonplan/zarr-layer)
    # -------------------------------------------------------------------------

    def add_zarr_layer(
        self,
        url: str,
        variable: str,
        name: Optional[str] = None,
        colormap: Optional[List[str]] = None,
        clim: Optional[Tuple[float, float]] = None,
        opacity: float = 1.0,
        selector: Optional[Dict[str, Any]] = None,
        minzoom: int = 0,
        maxzoom: int = 22,
        fill_value: Optional[float] = None,
        spatial_dimensions: Optional[Dict[str, str]] = None,
        zarr_version: Optional[int] = None,
        bounds: Optional[List[float]] = None,
        **kwargs,
    ) -> None:
        """Add a Zarr dataset layer for visualizing multidimensional array data.

        This method renders Zarr pyramid datasets directly in the browser using
        GPU-accelerated WebGL rendering via @carbonplan/zarr-layer.

        Args:
            url: URL to the Zarr store (pyramid format recommended).
            variable: Variable name in the Zarr dataset to visualize.
            name: Layer ID. If None, auto-generated.
            colormap: List of hex color strings for visualization.
                Example: ['#0000ff', '#ffff00', '#ff0000'] (blue-yellow-red).
                Default: ['#000000', '#ffffff'] (black to white).
            clim: Color range as (min, max) tuple.
                Default: (0, 100).
            opacity: Layer opacity (0-1).
            selector: Dimension selector for multi-dimensional data.
                Example: {"month": 4} to select 4th month.
            minzoom: Minimum zoom level for rendering.
            maxzoom: Maximum zoom level for rendering.
            fill_value: No-data value (auto-detected from metadata if not set).
            spatial_dimensions: Custom spatial dimension names.
                Example: {"lat": "y", "lon": "x"} for non-standard names.
            zarr_version: Zarr format version (2 or 3). Auto-detected if not set.
            bounds: Explicit spatial bounds [xMin, yMin, xMax, yMax].
                Units depend on CRS: degrees for EPSG:4326, meters for EPSG:3857.
            **kwargs: Additional ZarrLayer props.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_zarr_layer(
            ...     "https://example.com/climate.zarr",
            ...     variable="temperature",
            ...     clim=(270, 310),
            ...     colormap=['#0000ff', '#ffff00', '#ff0000'],
            ...     selector={"month": 7}
            ... )
        """
        layer_id = name or f"zarr-{len(self._layers)}"

        self.call_js_method(
            "addZarrLayer",
            id=layer_id,
            source=url,
            variable=variable,
            colormap=colormap or ["#000000", "#ffffff"],
            clim=list(clim) if clim else [0, 100],
            opacity=opacity,
            selector=selector or {},
            minzoom=minzoom,
            maxzoom=maxzoom,
            fillValue=fill_value,
            spatialDimensions=spatial_dimensions,
            zarrVersion=zarr_version,
            bounds=bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "zarr",
                "url": url,
                "variable": variable,
            },
        }
        self._add_to_layer_dict(layer_id, "Raster")

    def remove_zarr_layer(self, layer_id: str) -> None:
        """Remove a Zarr layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removeZarrLayer")

    def update_zarr_layer(
        self,
        layer_id: str,
        selector: Optional[Dict[str, Any]] = None,
        clim: Optional[Tuple[float, float]] = None,
        colormap: Optional[List[str]] = None,
        opacity: Optional[float] = None,
    ) -> None:
        """Update a Zarr layer's properties dynamically.

        Args:
            layer_id: Layer identifier.
            selector: New dimension selector.
            clim: New color range.
            colormap: New colormap.
            opacity: New opacity value (0-1).
        """
        update_kwargs: Dict[str, Any] = {"id": layer_id}
        if selector is not None:
            update_kwargs["selector"] = selector
        if clim is not None:
            update_kwargs["clim"] = list(clim)
        if colormap is not None:
            update_kwargs["colormap"] = colormap
        if opacity is not None:
            update_kwargs["opacity"] = opacity
        self.call_js_method("updateZarrLayer", **update_kwargs)

    # -------------------------------------------------------------------------
    # PMTiles Layer
    # -------------------------------------------------------------------------

    def add_pmtiles_layer(
        self,
        url: str,
        layer_id: Optional[str] = None,
        style: Optional[Dict[str, Any]] = None,
        opacity: float = 1.0,
        visible: bool = True,
        fit_bounds: bool = False,
        source_type: str = "vector",
        **kwargs,
    ) -> None:
        """Add a PMTiles layer for efficient vector or raster tile serving.

        PMTiles is a single-file archive format for pyramids of map tiles.
        It enables efficient web-native map serving without requiring a
        separate tile server infrastructure.

        Args:
            url: URL to the PMTiles file (e.g., "https://example.com/data.pmtiles").
            layer_id: Layer identifier. If None, auto-generated.
            style: Layer style configuration for vector tiles.
                For vector PMTiles, can include:
                - type: Layer type ('fill', 'line', 'circle', 'symbol')
                - source-layer: Source layer name from vector tiles
                - paint properties (e.g., 'fill-color', 'line-width')
                - layout properties (e.g., 'visibility')
                Example: {"type": "line", "source-layer": "roads", "line-color": "#ff0000"}
            opacity: Layer opacity (0-1).
            visible: Whether layer is initially visible.
            fit_bounds: Whether to fit map to layer bounds after loading.
            source_type: Source type - "vector" for vector PMTiles, "raster" for raster PMTiles.
            **kwargs: Additional layer options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> # Add vector PMTiles
            >>> m.add_pmtiles_layer(
            ...     url="https://example.com/countries.pmtiles",
            ...     layer_id="countries",
            ...     style={
            ...         "type": "fill",
            ...         "source-layer": "countries",
            ...         "fill-color": "#3388ff",
            ...         "fill-opacity": 0.6
            ...     }
            ... )
            >>> # Add raster PMTiles
            >>> m.add_pmtiles_layer(
            ...     url="https://example.com/satellite.pmtiles",
            ...     layer_id="satellite",
            ...     source_type="raster",
            ...     opacity=0.8
            ... )
        """
        layer_id = layer_id or f"pmtiles-{len(self._layers)}"

        self.call_js_method(
            "addPMTilesLayer",
            url=url,
            id=layer_id,
            style=style or {},
            opacity=opacity,
            visible=visible,
            fitBounds=fit_bounds,
            sourceType=source_type,
            name=layer_id,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "pmtiles",
                "url": url,
                "source_type": source_type,
            },
        }
        category = "Vector" if source_type == "vector" else "Raster"
        self._add_to_layer_dict(layer_id, category)

    def remove_pmtiles_layer(self, layer_id: str) -> None:
        """Remove a PMTiles layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removePMTilesLayer")

    # -------------------------------------------------------------------------
    # Arc Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_arc_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_source_position: Union[str, Any] = "source",
        get_target_position: Union[str, Any] = "target",
        get_source_color: Optional[List[int]] = None,
        get_target_color: Optional[List[int]] = None,
        get_width: Union[float, str] = 1,
        get_height: float = 1,
        great_circle: bool = False,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add an arc layer for origin-destination visualization using deck.gl.

        Arc layers are ideal for visualizing connections between locations,
        such as flight routes, migration patterns, or network flows.

        Args:
            data: Array of data objects with source/target coordinates.
                Each object should have source and target positions.
            name: Layer ID. If None, auto-generated.
            get_source_position: Accessor for source position [lng, lat].
                Can be a string (property name) or a value.
            get_target_position: Accessor for target position [lng, lat].
                Can be a string (property name) or a value.
            get_source_color: Source end color as [r, g, b, a].
                Default: [51, 136, 255, 255] (blue).
            get_target_color: Target end color as [r, g, b, a].
                Default: [255, 136, 51, 255] (orange).
            get_width: Arc width in pixels. Can be a number or accessor.
            get_height: Arc height multiplier. Higher values create more curved arcs.
            great_circle: Whether to draw arcs along great circles.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ArcLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> arcs = [
            ...     {"source": [-122.4, 37.8], "target": [-73.9, 40.7]},
            ...     {"source": [-122.4, 37.8], "target": [-0.1, 51.5]},
            ... ]
            >>> m.add_arc_layer(arcs, name="flights")
        """
        layer_id = name or f"arc-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addArcLayer",
            id=layer_id,
            data=processed_data,
            getSourcePosition=get_source_position,
            getTargetPosition=get_target_position,
            getSourceColor=get_source_color or [51, 136, 255, 255],
            getTargetColor=get_target_color or [255, 136, 51, 255],
            getWidth=get_width,
            getHeight=get_height,
            greatCircle=great_circle,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "arc",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    def remove_arc_layer(self, layer_id: str) -> None:
        """Remove an arc layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removeArcLayer")

    # -------------------------------------------------------------------------
    # PointCloud Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_point_cloud_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "position",
        get_color: Optional[Union[List[int], str]] = None,
        get_normal: Optional[Union[str, Any]] = None,
        point_size: float = 2,
        size_units: str = "pixels",
        pickable: bool = True,
        opacity: float = 1.0,
        material: bool = True,
        coordinate_system: Optional[int] = None,
        coordinate_origin: Optional[List[float]] = None,
        **kwargs,
    ) -> None:
        """Add a point cloud layer for 3D point visualization using deck.gl.

        Point cloud layers render large collections of 3D points, ideal for
        LiDAR data, photogrammetry outputs, or any 3D point dataset.

        Args:
            data: Array of point data with positions. Each point should have
                x, y, z coordinates (or position array).
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [x, y, z].
                Can be a string (property name) or a value.
            get_color: Accessor or value for point color [r, g, b, a].
                Default: [255, 255, 255, 255] (white).
            get_normal: Accessor for point normal [nx, ny, nz] for lighting.
                Default: [0, 0, 1] (pointing up).
            point_size: Point size in pixels or meters (depends on size_units).
            size_units: Size units: 'pixels', 'meters', or 'common'.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            material: Whether to enable lighting effects.
            coordinate_system: Coordinate system for positions.
            coordinate_origin: Origin for coordinate system [x, y, z].
            **kwargs: Additional PointCloudLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> import numpy as np
            >>> m = MapLibreMap(pitch=45)
            >>> points = [
            ...     {"position": [-122.4, 37.8, 100], "color": [255, 0, 0, 255]},
            ...     {"position": [-122.3, 37.7, 200], "color": [0, 255, 0, 255]},
            ... ]
            >>> m.add_point_cloud_layer(points, point_size=5)
        """
        layer_id = name or f"pointcloud-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addPointCloudLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getColor=get_color or [255, 255, 255, 255],
            getNormal=get_normal,
            pointSize=point_size,
            sizeUnits=size_units,
            pickable=pickable,
            opacity=opacity,
            material=material,
            coordinateSystem=coordinate_system,
            coordinateOrigin=coordinate_origin,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "pointcloud",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    def remove_point_cloud_layer(self, layer_id: str) -> None:
        """Remove a point cloud layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removePointCloudLayer")

    # -------------------------------------------------------------------------
    # Scatterplot Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_scatterplot_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_radius: Union[float, str] = 5,
        get_fill_color: Optional[Union[List[int], str]] = None,
        get_line_color: Optional[Union[List[int], str]] = None,
        radius_scale: float = 1,
        radius_min_pixels: float = 1,
        radius_max_pixels: float = 100,
        line_width_min_pixels: float = 1,
        stroked: bool = True,
        filled: bool = True,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a scatterplot layer for sized/colored point visualization using deck.gl.

        Scatterplot layers render circles at given coordinates with configurable
        radius and color, ideal for point datasets where size and color encode data.

        Args:
            data: Array of data objects or GeoJSON with point coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
                Can be a string (property name) or a value.
            get_radius: Accessor for point radius in meters.
            get_fill_color: Accessor for fill color [r, g, b, a].
                Default: [51, 136, 255, 200] (blue).
            get_line_color: Accessor for stroke color [r, g, b, a].
                Default: [255, 255, 255, 255] (white).
            radius_scale: Global radius multiplier.
            radius_min_pixels: Minimum radius in pixels.
            radius_max_pixels: Maximum radius in pixels.
            line_width_min_pixels: Minimum stroke width in pixels.
            stroked: Whether to draw stroke around points.
            filled: Whether to fill points.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ScatterplotLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8], "size": 100},
            ...     {"coordinates": [-122.5, 37.7], "size": 200},
            ... ]
            >>> m.add_scatterplot_layer(points, get_radius="size")
        """
        layer_id = name or f"scatterplot-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addScatterplotLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getRadius=get_radius,
            getFillColor=get_fill_color or [51, 136, 255, 200],
            getLineColor=get_line_color or [255, 255, 255, 255],
            radiusScale=radius_scale,
            radiusMinPixels=radius_min_pixels,
            radiusMaxPixels=radius_max_pixels,
            lineWidthMinPixels=line_width_min_pixels,
            stroked=stroked,
            filled=filled,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "scatterplot",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Path Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_path_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_path: Union[str, Any] = "path",
        get_color: Optional[Union[List[int], str]] = None,
        get_width: Union[float, str] = 1,
        width_scale: float = 1,
        width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a path layer for route/trajectory rendering using deck.gl.

        Path layers render polylines defined by arrays of coordinates,
        ideal for visualizing routes, trajectories, or any line-based data.

        Args:
            data: Array of data objects with path coordinates.
            name: Layer ID. If None, auto-generated.
            get_path: Accessor for path coordinates [[lng, lat], ...].
                Can be a string (property name) or a value.
            get_color: Accessor for path color [r, g, b, a].
                Default: [51, 136, 255, 200] (blue).
            get_width: Accessor for path width in meters.
            width_scale: Global width multiplier.
            width_min_pixels: Minimum width in pixels.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional PathLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> routes = [
            ...     {"path": [[-122.4, 37.8], [-122.5, 37.7], [-122.6, 37.8]]},
            ... ]
            >>> m.add_path_layer(routes, get_color=[255, 0, 0], get_width=3)
        """
        layer_id = name or f"path-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addPathLayer",
            id=layer_id,
            data=processed_data,
            getPath=get_path,
            getColor=get_color or [51, 136, 255, 200],
            getWidth=get_width,
            widthScale=width_scale,
            widthMinPixels=width_min_pixels,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "path",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Polygon Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_polygon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_polygon: Union[str, Any] = "polygon",
        get_fill_color: Optional[Union[List[int], str]] = None,
        get_line_color: Optional[Union[List[int], str]] = None,
        get_line_width: Union[float, str] = 1,
        get_elevation: Union[float, str] = 0,
        extruded: bool = False,
        wireframe: bool = False,
        filled: bool = True,
        stroked: bool = True,
        line_width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.5,
        **kwargs,
    ) -> None:
        """Add a polygon layer for filled polygon visualization using deck.gl.

        Polygon layers render filled and/or stroked polygons with optional
        3D extrusion, ideal for choropleth maps and area visualizations.

        Args:
            data: Array of data objects with polygon coordinates.
            name: Layer ID. If None, auto-generated.
            get_polygon: Accessor for polygon coordinates.
                Can be a string (property name) or a value.
            get_fill_color: Accessor for fill color [r, g, b, a].
                Default: [51, 136, 255, 128].
            get_line_color: Accessor for stroke color [r, g, b, a].
                Default: [0, 0, 255, 255].
            get_line_width: Accessor for stroke width.
            get_elevation: Accessor for 3D extrusion height.
            extruded: Whether to render as 3D polygons.
            wireframe: Whether to render wireframe (extruded only).
            filled: Whether to fill polygons.
            stroked: Whether to draw stroke.
            line_width_min_pixels: Minimum stroke width in pixels.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional PolygonLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> polygons = [
            ...     {"polygon": [[-122.4, 37.8], [-122.5, 37.7], [-122.3, 37.7]], "height": 1000},
            ... ]
            >>> m.add_polygon_layer(polygons, extruded=True, get_elevation="height")
        """
        layer_id = name or f"polygon-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addPolygonLayer",
            id=layer_id,
            data=processed_data,
            getPolygon=get_polygon,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 255, 255],
            getLineWidth=get_line_width,
            getElevation=get_elevation,
            extruded=extruded,
            wireframe=wireframe,
            filled=filled,
            stroked=stroked,
            lineWidthMinPixels=line_width_min_pixels,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "polygon",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Hexagon Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_hexagon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        radius: float = 1000,
        elevation_scale: float = 4,
        extruded: bool = True,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a hexagon layer for hexagonal binning/aggregation using deck.gl.

        Hexagon layers aggregate points into hexagonal bins and render them
        with height and color based on point density.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
            radius: Hexagon radius in meters.
            elevation_scale: Elevation multiplier for 3D hexagons.
            extruded: Whether to render as 3D hexagons.
            color_range: Color gradient for aggregation [[r, g, b], ...].
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional HexagonLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8]},
            ...     {"coordinates": [-122.41, 37.81]},
            ... ]
            >>> m.add_hexagon_layer(points, radius=500, elevation_scale=10)
        """
        layer_id = name or f"hexagon-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        default_color_range = [
            [1, 152, 189],
            [73, 227, 206],
            [216, 254, 181],
            [254, 237, 177],
            [254, 173, 84],
            [209, 55, 78],
        ]

        self.call_js_method(
            "addHexagonLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            radius=radius,
            elevationScale=elevation_scale,
            extruded=extruded,
            colorRange=color_range or default_color_range,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "hexagon",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Deck.gl Heatmap Layer
    # -------------------------------------------------------------------------

    def add_deck_heatmap_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_weight: Union[float, str] = 1,
        radius_pixels: float = 30,
        intensity: float = 1,
        threshold: float = 0.05,
        color_range: Optional[List[List[int]]] = None,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a GPU-accelerated heatmap layer using deck.gl.

        This is an alternative to the native MapLibre heatmap layer, using
        deck.gl's GPU-based rendering for better performance with large datasets.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight value.
            radius_pixels: Influence radius in pixels.
            intensity: Intensity multiplier.
            threshold: Minimum density threshold (0-1).
            color_range: Color gradient [[r, g, b, a], ...].
            opacity: Layer opacity (0-1).
            **kwargs: Additional HeatmapLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8], "weight": 5},
            ...     {"coordinates": [-122.5, 37.7], "weight": 10},
            ... ]
            >>> m.add_deck_heatmap_layer(points, get_weight="weight")
        """
        layer_id = name or f"deck-heatmap-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        default_color_range = [
            [255, 255, 178, 25],
            [254, 217, 118, 85],
            [254, 178, 76, 127],
            [253, 141, 60, 170],
            [240, 59, 32, 212],
            [189, 0, 38, 255],
        ]

        self.call_js_method(
            "addHeatmapLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getWeight=get_weight,
            radiusPixels=radius_pixels,
            intensity=intensity,
            threshold=threshold,
            colorRange=color_range or default_color_range,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "deck-heatmap",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Grid Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_grid_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        cell_size: float = 200,
        elevation_scale: float = 4,
        extruded: bool = True,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a grid layer for square grid aggregation using deck.gl.

        Grid layers aggregate points into square grid cells and render them
        with height and color based on point density.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
            cell_size: Grid cell size in meters.
            elevation_scale: Elevation multiplier for 3D cells.
            extruded: Whether to render as 3D cells.
            color_range: Color gradient [[r, g, b], ...].
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional GridLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8]},
            ...     {"coordinates": [-122.41, 37.81]},
            ... ]
            >>> m.add_grid_layer(points, cell_size=500)
        """
        layer_id = name or f"grid-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        default_color_range = [
            [1, 152, 189],
            [73, 227, 206],
            [216, 254, 181],
            [254, 237, 177],
            [254, 173, 84],
            [209, 55, 78],
        ]

        self.call_js_method(
            "addGridLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            cellSize=cell_size,
            elevationScale=elevation_scale,
            extruded=extruded,
            colorRange=color_range or default_color_range,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "grid",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Icon Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_icon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_icon: Union[str, Any] = "icon",
        get_size: Union[float, str] = 20,
        get_color: Optional[Union[List[int], str]] = None,
        icon_atlas: Optional[str] = None,
        icon_mapping: Optional[Dict] = None,
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add an icon layer for custom icon markers at scale using deck.gl.

        Icon layers render icons/images at specified positions, ideal for
        rendering large numbers of custom markers efficiently.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for icon position [lng, lat].
            get_icon: Accessor for icon name in icon_mapping.
            get_size: Accessor for icon size in pixels.
            get_color: Accessor for icon tint color [r, g, b, a].
                Default: [255, 255, 255, 255] (white, no tint).
            icon_atlas: URL to icon atlas image.
            icon_mapping: Dict mapping icon names to atlas coordinates.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional IconLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> markers = [
            ...     {"coordinates": [-122.4, 37.8], "icon": "marker", "size": 30},
            ... ]
            >>> m.add_icon_layer(markers, get_size="size")
        """
        layer_id = name or f"icon-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addIconLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getIcon=get_icon,
            getSize=get_size,
            getColor=get_color or [255, 255, 255, 255],
            iconAtlas=icon_atlas,
            iconMapping=icon_mapping,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "icon",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Text Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_text_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_text: Union[str, Any] = "text",
        get_size: Union[float, str] = 12,
        get_color: Optional[Union[List[int], str]] = None,
        get_angle: Union[float, str] = 0,
        text_anchor: str = "middle",
        alignment_baseline: str = "center",
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a text layer for label placement using deck.gl.

        Text layers render text labels at specified positions, ideal for
        annotating map features or creating label layers.

        Args:
            data: Array of data objects with position and text.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for text position [lng, lat].
            get_text: Accessor for text content string.
            get_size: Accessor for text size in pixels.
            get_color: Accessor for text color [r, g, b, a].
                Default: [0, 0, 0, 255] (black).
            get_angle: Accessor for text rotation in degrees.
            text_anchor: Horizontal alignment ('start', 'middle', 'end').
            alignment_baseline: Vertical alignment ('top', 'center', 'bottom').
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional TextLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> labels = [
            ...     {"coordinates": [-122.4, 37.8], "text": "San Francisco"},
            ...     {"coordinates": [-118.2, 34.1], "text": "Los Angeles"},
            ... ]
            >>> m.add_text_layer(labels, get_size=16)
        """
        layer_id = name or f"text-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addTextLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getText=get_text,
            getSize=get_size,
            getColor=get_color or [0, 0, 0, 255],
            getAngle=get_angle,
            getTextAnchor=text_anchor,
            getAlignmentBaseline=alignment_baseline,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "text",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # GeoJSON Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_geojson_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_fill_color: Optional[Union[List[int], str]] = None,
        get_line_color: Optional[Union[List[int], str]] = None,
        get_line_width: Union[float, str] = 1,
        get_point_radius: Union[float, str] = 5,
        get_elevation: Union[float, str] = 0,
        extruded: bool = False,
        wireframe: bool = False,
        filled: bool = True,
        stroked: bool = True,
        line_width_min_pixels: float = 1,
        point_radius_min_pixels: float = 2,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a GeoJSON layer with auto-styling using deck.gl.

        GeoJSON layers render GeoJSON features with automatic geometry type
        detection and styling, supporting points, lines, and polygons.

        Args:
            data: GeoJSON object, URL, or file path.
            name: Layer ID. If None, auto-generated.
            get_fill_color: Accessor for fill color [r, g, b, a].
                Default: [51, 136, 255, 128].
            get_line_color: Accessor for stroke color [r, g, b, a].
                Default: [0, 0, 0, 255].
            get_line_width: Accessor for stroke width.
            get_point_radius: Accessor for point radius.
            get_elevation: Accessor for 3D extrusion height.
            extruded: Whether to render as 3D features.
            wireframe: Whether to render wireframe (extruded only).
            filled: Whether to fill features.
            stroked: Whether to draw stroke.
            line_width_min_pixels: Minimum stroke width in pixels.
            point_radius_min_pixels: Minimum point radius in pixels.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional GeoJsonLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_geojson_layer(
            ...     "https://example.com/data.geojson",
            ...     get_fill_color=[255, 0, 0, 128],
            ... )
        """
        layer_id = name or f"geojson-deck-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addGeoJsonLayer",
            id=layer_id,
            data=processed_data,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            getPointRadius=get_point_radius,
            getElevation=get_elevation,
            extruded=extruded,
            wireframe=wireframe,
            filled=filled,
            stroked=stroked,
            lineWidthMinPixels=line_width_min_pixels,
            pointRadiusMinPixels=point_radius_min_pixels,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "geojson-deck",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Contour Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_contour_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_weight: Union[float, str] = 1,
        cell_size: float = 200,
        contours: Optional[List[Dict]] = None,
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a contour layer for isoline/isoband generation using deck.gl.

        Contour layers aggregate point data and generate isolines or isobands,
        ideal for density visualization and topographic-style maps.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight value.
            cell_size: Grid cell size for aggregation in meters.
            contours: Contour definitions [{threshold, color, strokeWidth}, ...].
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ContourLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8], "weight": 5},
            ...     {"coordinates": [-122.41, 37.81], "weight": 10},
            ... ]
            >>> m.add_contour_layer(points, contours=[
            ...     {"threshold": 1, "color": [255, 255, 178], "strokeWidth": 1},
            ...     {"threshold": 5, "color": [253, 141, 60], "strokeWidth": 2},
            ... ])
        """
        layer_id = name or f"contour-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        default_contours = [
            {"threshold": 1, "color": [255, 255, 255], "strokeWidth": 1},
            {"threshold": 5, "color": [51, 136, 255], "strokeWidth": 2},
            {"threshold": 10, "color": [0, 0, 255], "strokeWidth": 3},
        ]

        self.call_js_method(
            "addContourLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getWeight=get_weight,
            cellSize=cell_size,
            contours=contours or default_contours,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "contour",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Screen Grid Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_screen_grid_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_weight: Union[float, str] = 1,
        cell_size_pixels: float = 50,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a screen grid layer for screen-space grid aggregation using deck.gl.

        Screen grid layers aggregate points into a grid in screen space,
        providing a fast overview of point density that updates on zoom/pan.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight value.
            cell_size_pixels: Grid cell size in screen pixels.
            color_range: Color gradient [[r, g, b, a], ...].
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ScreenGridLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> points = [
            ...     {"coordinates": [-122.4, 37.8]},
            ...     {"coordinates": [-122.41, 37.81]},
            ... ]
            >>> m.add_screen_grid_layer(points, cell_size_pixels=30)
        """
        layer_id = name or f"screengrid-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        default_color_range = [
            [255, 255, 178, 25],
            [254, 217, 118, 85],
            [254, 178, 76, 127],
            [253, 141, 60, 170],
            [240, 59, 32, 212],
            [189, 0, 38, 255],
        ]

        self.call_js_method(
            "addScreenGridLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getWeight=get_weight,
            cellSizePixels=cell_size_pixels,
            colorRange=color_range or default_color_range,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "screengrid",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Trips Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_trips_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_path: Union[str, Any] = "waypoints",
        get_timestamps: Union[str, Any] = "timestamps",
        get_color: Optional[Union[List[int], str]] = None,
        width_min_pixels: float = 2,
        trail_length: float = 180,
        current_time: float = 0,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a trips layer for animated trip/trajectory playback using deck.gl.

        Trips layers render animated paths showing movement over time, ideal
        for visualizing vehicle routes, migration patterns, or time-based data.

        Args:
            data: Array of trip objects with waypoints and timestamps.
            name: Layer ID. If None, auto-generated.
            get_path: Accessor for waypoint coordinates [[lng, lat], ...].
            get_timestamps: Accessor for timestamps at each waypoint.
            get_color: Accessor for trip color [r, g, b] or [r, g, b, a].
                Default: [253, 128, 93].
            width_min_pixels: Minimum trail width in pixels.
            trail_length: Trail length in timestamp units.
            current_time: Current animation time.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional TripsLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> trips = [
            ...     {
            ...         "waypoints": [[-122.4, 37.8], [-122.5, 37.7]],
            ...         "timestamps": [0, 100]
            ...     }
            ... ]
            >>> m.add_trips_layer(trips, trail_length=200, current_time=50)
        """
        layer_id = name or f"trips-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addTripsLayer",
            id=layer_id,
            data=processed_data,
            getPath=get_path,
            getTimestamps=get_timestamps,
            getColor=get_color or [253, 128, 93],
            widthMinPixels=width_min_pixels,
            trailLength=trail_length,
            currentTime=current_time,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "trips",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Line Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_line_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_source_position: Union[str, Any] = "sourcePosition",
        get_target_position: Union[str, Any] = "targetPosition",
        get_color: Optional[Union[List[int], str]] = None,
        get_width: Union[float, str] = 1,
        width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a line layer for origin-destination line visualization using deck.gl.

        Line layers render straight line segments between source and target
        positions. Unlike arc layers, lines are drawn without curvature.

        Args:
            data: Array of line objects with source/target positions.
            name: Layer ID. If None, auto-generated.
            get_source_position: Accessor for source position [lng, lat].
            get_target_position: Accessor for target position [lng, lat].
            get_color: Accessor for line color [r, g, b] or [r, g, b, a].
                Default: [51, 136, 255, 200] (blue).
            get_width: Accessor for line width.
            width_min_pixels: Minimum line width in pixels.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional LineLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> lines = [
            ...     {"sourcePosition": [-122.4, 37.8], "targetPosition": [-73.9, 40.7]},
            ... ]
            >>> m.add_line_layer(lines, get_color=[0, 128, 255], get_width=2)
        """
        layer_id = name or f"line-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addLineLayer",
            id=layer_id,
            data=processed_data,
            getSourcePosition=get_source_position,
            getTargetPosition=get_target_position,
            getColor=get_color or [51, 136, 255, 200],
            getWidth=get_width,
            widthMinPixels=width_min_pixels,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "line",
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Generic Deck.gl Layer
    # -------------------------------------------------------------------------

    def add_deckgl_layer(
        self,
        layer_type: str,
        data: Any,
        name: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a generic deck.gl layer to the map.

        This method provides a flexible way to add any supported deck.gl layer
        type using a single interface. For commonly used layers, prefer the
        specific methods (e.g., add_scatterplot_layer) for better IDE support.

        Args:
            layer_type: The deck.gl layer type (e.g., 'ScatterplotLayer',
                'ArcLayer', 'HexagonLayer').
            data: Array of data objects or GeoJSON.
            name: Layer ID. If None, auto-generated from layer_type.
            **kwargs: Layer-specific properties passed directly to deck.gl.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_deckgl_layer(
            ...     "TripsLayer",
            ...     data=trips_data,
            ...     getPath="waypoints",
            ...     getTimestamps="timestamps",
            ...     trailLength=180,
            ... )
        """
        layer_type_clean = layer_type.replace("Layer", "")
        prefix = layer_type_clean.lower()
        layer_id = name or f"{prefix}-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addDeckGLLayer",
            layerType=layer_type,
            id=layer_id,
            data=processed_data,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": layer_type,
            },
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    def remove_deck_layer(self, layer_id: str) -> None:
        """Remove a deck.gl layer from the map.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removeDeckLayer")

    # -------------------------------------------------------------------------
    # Column Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_column_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_fill_color: Optional[Union[List[int], str]] = None,
        get_line_color: Optional[Union[List[int], str]] = None,
        get_elevation: Union[float, str] = 1000,
        radius: float = 1000,
        disk_resolution: int = 20,
        elevation_scale: float = 1,
        coverage: float = 1,
        extruded: bool = True,
        filled: bool = True,
        stroked: bool = False,
        wireframe: bool = False,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a column layer for 3D bar chart visualization using deck.gl.

        Column layers render cylindrical columns at specified positions,
        ideal for 3D bar charts on a map.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for column position [lng, lat].
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_elevation: Accessor for column height.
            radius: Column radius in meters.
            disk_resolution: Number of sides for column polygon.
            elevation_scale: Elevation multiplier.
            coverage: Column coverage (0-1).
            extruded: Whether to extrude columns.
            filled: Whether to fill columns.
            stroked: Whether to stroke columns.
            wireframe: Whether to render as wireframe.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ColumnLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> data = [
            ...     {"coordinates": [-122.4, 37.8], "value": 500},
            ...     {"coordinates": [-122.5, 37.7], "value": 1000},
            ... ]
            >>> m.add_column_layer(data, get_elevation="value", radius=500)
        """
        layer_id = name or f"column-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addColumnLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getFillColor=get_fill_color or [255, 140, 0, 200],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getElevation=get_elevation,
            radius=radius,
            diskResolution=disk_resolution,
            elevationScale=elevation_scale,
            coverage=coverage,
            extruded=extruded,
            filled=filled,
            stroked=stroked,
            wireframe=wireframe,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "column"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Bitmap Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_bitmap_layer(
        self,
        image: str,
        bounds: List[float],
        name: Optional[str] = None,
        opacity: float = 1.0,
        visible: bool = True,
        pickable: bool = False,
        desaturate: float = 0,
        transparent_color: Optional[List[int]] = None,
        tint_color: Optional[List[int]] = None,
        **kwargs,
    ) -> None:
        """Add a bitmap layer for image overlay with GPU rendering using deck.gl.

        Args:
            image: URL or data URI of the image.
            bounds: Bounding box [west, south, east, north].
            name: Layer ID. If None, auto-generated.
            opacity: Layer opacity (0-1).
            visible: Whether layer is visible.
            pickable: Whether layer responds to hover/click events.
            desaturate: Desaturation amount (0-1).
            transparent_color: Color to make transparent [r, g, b, a].
            tint_color: Color to tint the image [r, g, b].
            **kwargs: Additional BitmapLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_bitmap_layer(
            ...     "https://example.com/overlay.png",
            ...     bounds=[-122.5, 37.7, -122.3, 37.9],
            ... )
        """
        layer_id = name or f"bitmap-{len(self._layers)}"

        self.call_js_method(
            "addBitmapLayer",
            id=layer_id,
            image=image,
            bounds=bounds,
            opacity=opacity,
            visible=visible,
            pickable=pickable,
            desaturate=desaturate,
            transparentColor=transparent_color or [0, 0, 0, 0],
            tintColor=tint_color or [255, 255, 255],
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "bitmap"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Solid Polygon Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_solid_polygon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_polygon: Union[str, Any] = "polygon",
        get_fill_color: Optional[Union[List[int], str]] = None,
        get_line_color: Optional[Union[List[int], str]] = None,
        get_elevation: Union[float, str] = 0,
        filled: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a solid polygon layer for extruded 3D polygon visualization using deck.gl.

        Args:
            data: Array of data objects with polygon coordinates.
            name: Layer ID. If None, auto-generated.
            get_polygon: Accessor for polygon coordinates.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill polygons.
            extruded: Whether to render as 3D polygons.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional SolidPolygonLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> data = [
            ...     {"polygon": [[-122.4, 37.8], [-122.5, 37.7], [-122.3, 37.7]], "height": 500},
            ... ]
            >>> m.add_solid_polygon_layer(data, extruded=True, get_elevation="height")
        """
        layer_id = name or f"solidpolygon-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addSolidPolygonLayer",
            id=layer_id,
            data=processed_data,
            getPolygon=get_polygon,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getElevation=get_elevation,
            filled=filled,
            extruded=extruded,
            wireframe=wireframe,
            elevationScale=elevation_scale,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "solidpolygon"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # Grid Cell Layer (deck.gl)
    # -------------------------------------------------------------------------

    def add_grid_cell_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Any] = "coordinates",
        get_color: Optional[Union[List[int], str]] = None,
        get_elevation: Union[float, str] = 1000,
        cell_size: float = 200,
        coverage: float = 1,
        elevation_scale: float = 1,
        extruded: bool = True,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a grid cell layer for pre-aggregated grid visualization using deck.gl.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for cell position [lng, lat].
            get_color: Accessor for cell color [r, g, b, a].
            get_elevation: Accessor for cell height.
            cell_size: Cell size in meters.
            coverage: Cell coverage (0-1).
            elevation_scale: Elevation multiplier.
            extruded: Whether to extrude cells.
            pickable: Whether layer responds to hover/click events.
            opacity: Layer opacity (0-1).
            **kwargs: Additional GridCellLayer props.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=45)
            >>> data = [
            ...     {"coordinates": [-122.4, 37.8], "value": 500},
            ... ]
            >>> m.add_grid_cell_layer(data, get_elevation="value")
        """
        layer_id = name or f"gridcell-{len(self._layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addGridCellLayer",
            id=layer_id,
            data=processed_data,
            getPosition=get_position,
            getColor=get_color or [255, 140, 0, 200],
            getElevation=get_elevation,
            cellSize=cell_size,
            coverage=coverage,
            elevationScale=elevation_scale,
            extruded=extruded,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {"id": layer_id, "type": "gridcell"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

    # -------------------------------------------------------------------------
    # LiDAR Layers (maplibre-gl-lidar)
    # -------------------------------------------------------------------------

    def add_lidar_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        title: str = "LiDAR Viewer",
        point_size: float = 2,
        opacity: float = 1.0,
        color_scheme: str = "elevation",
        use_percentile: bool = True,
        point_budget: int = 1000000,
        pickable: bool = False,
        auto_zoom: bool = True,
        copc_loading_mode: Optional[str] = None,
        streaming_point_budget: int = 5000000,
        panel_max_height: int = 600,
        **kwargs,
    ) -> None:
        """Add an interactive LiDAR control panel.

        The LiDAR control provides a UI panel for loading, visualizing, and
        styling LiDAR point cloud files (LAS, LAZ, COPC formats).

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left', 'bottom-right').
            collapsed: Whether the panel starts collapsed.
            title: Title displayed on the panel.
            point_size: Point size in pixels.
            opacity: Layer opacity (0-1).
            color_scheme: Color scheme ('elevation', 'intensity', 'classification', 'rgb').
            use_percentile: Use 2-98% percentile for color scaling.
            point_budget: Maximum number of points to display.
            pickable: Enable hover/click interactions.
            auto_zoom: Auto-zoom to point cloud after loading.
            copc_loading_mode: COPC loading mode ('full' or 'dynamic').
            streaming_point_budget: Point budget for streaming mode.
            panel_max_height: Maximum height of the panel in pixels.
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(pitch=60)
            >>> m.add_lidar_control(color_scheme="classification", pickable=True)
        """
        self.call_js_method(
            "addLidarControl",
            position=position,
            collapsed=collapsed,
            title=title,
            pointSize=point_size,
            opacity=opacity,
            colorScheme=color_scheme,
            usePercentile=use_percentile,
            pointBudget=point_budget,
            pickable=pickable,
            autoZoom=auto_zoom,
            copcLoadingMode=copc_loading_mode,
            streamingPointBudget=streaming_point_budget,
            panelMaxHeight=panel_max_height,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "lidar-control": {"position": position, "collapsed": collapsed},
        }

    def add_lidar_layer(
        self,
        source: Union[str, Path],
        name: Optional[str] = None,
        color_scheme: str = "elevation",
        point_size: float = 2,
        opacity: float = 1.0,
        pickable: bool = True,
        auto_zoom: bool = True,
        streaming_mode: bool = True,
        point_budget: int = 1000000,
        **kwargs,
    ) -> None:
        """Load and display a LiDAR file from URL or local path.

        Supports LAS, LAZ, and COPC (Cloud-Optimized Point Cloud) formats.
        For local files, the file is read and sent as base64 to JavaScript.
        For URLs, the data is loaded directly via streaming when possible.

        Args:
            source: URL or local file path to the LiDAR file.
            name: Layer identifier. If None, auto-generated.
            color_scheme: Color scheme ('elevation', 'intensity', 'classification', 'rgb').
            point_size: Point size in pixels.
            opacity: Layer opacity (0-1).
            pickable: Enable hover/click interactions.
            auto_zoom: Auto-zoom to point cloud after loading.
            streaming_mode: Use streaming mode for large COPC files.
            point_budget: Maximum number of points to display.
            **kwargs: Additional layer options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap(center=[-123.07, 44.05], zoom=14, pitch=60)
            >>> m.add_lidar_layer(
            ...     source="https://s3.amazonaws.com/hobu-lidar/autzen-classified.copc.laz",
            ...     name="autzen",
            ...     color_scheme="classification",
            ... )
        """
        layer_id = name or f"lidar-{len(self._layers)}"

        # Check if source is a local file
        source_path = Path(source) if isinstance(source, (str, Path)) else None
        is_local = source_path is not None and source_path.exists()

        if is_local:
            # Read local file and encode as base64
            import base64

            with open(source_path, "rb") as f:
                file_data = f.read()
            source_b64 = base64.b64encode(file_data).decode("utf-8")

            self.call_js_method(
                "addLidarLayer",
                source=source_b64,
                name=layer_id,
                isBase64=True,
                filename=source_path.name,
                colorScheme=color_scheme,
                pointSize=point_size,
                opacity=opacity,
                pickable=pickable,
                autoZoom=auto_zoom,
                streamingMode=streaming_mode,
                pointBudget=point_budget,
                **kwargs,
            )
        else:
            # Load from URL
            self.call_js_method(
                "addLidarLayer",
                source=str(source),
                name=layer_id,
                isBase64=False,
                colorScheme=color_scheme,
                pointSize=point_size,
                opacity=opacity,
                pickable=pickable,
                autoZoom=auto_zoom,
                streamingMode=streaming_mode,
                pointBudget=point_budget,
                **kwargs,
            )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "lidar",
                "source": str(source),
            },
        }
        self._add_to_layer_dict(layer_id, "LiDAR")

    def remove_lidar_layer(self, layer_id: Optional[str] = None) -> None:
        """Remove a LiDAR layer.

        Args:
            layer_id: Layer identifier to remove. If None, removes all LiDAR layers.
        """
        if layer_id:
            if layer_id in self._layers:
                layers = dict(self._layers)
                del layers[layer_id]
                self._layers = layers
            self.call_js_method("removeLidarLayer", id=layer_id)
        else:
            # Remove all lidar layers
            layers = dict(self._layers)
            self._layers = {k: v for k, v in layers.items() if v.get("type") != "lidar"}
            self.call_js_method("removeLidarLayer")

    def set_lidar_color_scheme(self, color_scheme: str) -> None:
        """Set the LiDAR color scheme.

        Args:
            color_scheme: Color scheme ('elevation', 'intensity', 'classification', 'rgb').
        """
        self.call_js_method("setLidarColorScheme", colorScheme=color_scheme)

    def set_lidar_point_size(self, point_size: float) -> None:
        """Set the LiDAR point size.

        Args:
            point_size: Point size in pixels.
        """
        self.call_js_method("setLidarPointSize", pointSize=point_size)

    def set_lidar_opacity(self, opacity: float) -> None:
        """Set the LiDAR layer opacity.

        Args:
            opacity: Opacity value between 0 and 1.
        """
        self.call_js_method("setLidarOpacity", opacity=opacity)

    # -------------------------------------------------------------------------
    # maplibre-gl-components UI Controls
    # -------------------------------------------------------------------------

    def add_pmtiles_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        default_url: Optional[str] = None,
        load_default_url: bool = False,
        default_opacity: float = 1.0,
        default_fill_color: str = "steelblue",
        default_line_color: str = "#333",
        default_pickable: bool = True,
        **kwargs,
    ) -> None:
        """Add a PMTiles layer control for loading PMTiles files via UI.

        This provides an interactive panel for users to enter PMTiles URLs
        and visualize vector or raster tile data.

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left', 'bottom-right').
            collapsed: Whether the panel starts collapsed.
            default_url: Default PMTiles URL to pre-fill.
            load_default_url: Whether to auto-load the default URL.
            default_opacity: Default layer opacity (0-1).
            default_fill_color: Default fill color for vector polygons.
            default_line_color: Default line color for vector lines.
            default_pickable: Whether features are clickable by default.
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_pmtiles_control(
            ...     default_url="https://pmtiles.io/protomaps(vector)ODbL_firenze.pmtiles",
            ...     load_default_url=True
            ... )
        """
        self.call_js_method(
            "addPMTilesControl",
            position=position,
            collapsed=collapsed,
            defaultUrl=default_url or "",
            loadDefaultUrl=load_default_url,
            defaultOpacity=default_opacity,
            defaultFillColor=default_fill_color,
            defaultLineColor=default_line_color,
            defaultPickable=default_pickable,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "pmtiles-control": {"position": position, "collapsed": collapsed},
        }

    def add_cog_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        default_url: Optional[str] = None,
        load_default_url: bool = False,
        default_opacity: float = 1.0,
        default_colormap: str = "viridis",
        default_bands: str = "1",
        default_rescale_min: float = 0,
        default_rescale_max: float = 255,
        **kwargs,
    ) -> None:
        """Add a COG layer control for loading Cloud Optimized GeoTIFFs via UI.

        This provides an interactive panel for users to enter COG URLs
        and configure visualization parameters like colormap and rescaling.

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left', 'bottom-right').
            collapsed: Whether the panel starts collapsed.
            default_url: Default COG URL to pre-fill.
            load_default_url: Whether to auto-load the default URL.
            default_opacity: Default layer opacity (0-1).
            default_colormap: Default colormap name.
            default_bands: Default bands (e.g., '1' or '1,2,3').
            default_rescale_min: Default minimum value for rescaling.
            default_rescale_max: Default maximum value for rescaling.
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_cog_control(
            ...     default_url="https://example.com/cog.tif",
            ...     default_colormap="terrain"
            ... )
        """
        self.call_js_method(
            "addCogControl",
            position=position,
            collapsed=collapsed,
            defaultUrl=default_url or "",
            loadDefaultUrl=load_default_url,
            defaultOpacity=default_opacity,
            defaultColormap=default_colormap,
            defaultBands=default_bands,
            defaultRescaleMin=default_rescale_min,
            defaultRescaleMax=default_rescale_max,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "cog-control": {"position": position, "collapsed": collapsed},
        }

    def add_zarr_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        default_url: Optional[str] = None,
        load_default_url: bool = False,
        default_opacity: float = 1.0,
        default_variable: str = "",
        default_clim: Optional[Tuple[float, float]] = None,
        **kwargs,
    ) -> None:
        """Add a Zarr layer control for loading Zarr datasets via UI.

        This provides an interactive panel for users to enter Zarr URLs
        and configure visualization parameters.

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left', 'bottom-right').
            collapsed: Whether the panel starts collapsed.
            default_url: Default Zarr URL to pre-fill.
            load_default_url: Whether to auto-load the default URL.
            default_opacity: Default layer opacity (0-1).
            default_variable: Default variable name.
            default_clim: Default color limits (min, max).
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_zarr_control(
            ...     default_url="https://example.com/data.zarr",
            ...     default_variable="temperature"
            ... )
        """
        self.call_js_method(
            "addZarrControl",
            position=position,
            collapsed=collapsed,
            defaultUrl=default_url or "",
            loadDefaultUrl=load_default_url,
            defaultOpacity=default_opacity,
            defaultVariable=default_variable,
            defaultClim=list(default_clim) if default_clim else [0, 1],
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "zarr-control": {"position": position, "collapsed": collapsed},
        }

    def add_vector_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        default_url: Optional[str] = None,
        load_default_url: bool = False,
        default_opacity: float = 1.0,
        default_fill_color: str = "#3388ff",
        default_stroke_color: str = "#3388ff",
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a vector layer control for loading vector datasets from URLs.

        This provides an interactive panel for users to enter URLs to
        GeoJSON, GeoParquet, or FlatGeobuf datasets.

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left', 'bottom-right').
            collapsed: Whether the panel starts collapsed.
            default_url: Default vector URL to pre-fill.
            load_default_url: Whether to auto-load the default URL.
            default_opacity: Default layer opacity (0-1).
            default_fill_color: Default fill color for polygons.
            default_stroke_color: Default stroke color for lines/outlines.
            fit_bounds: Whether to fit map to loaded data bounds.
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_vector_control(
            ...     default_url="https://example.com/data.geojson",
            ...     default_fill_color="#ff0000"
            ... )
        """
        self.call_js_method(
            "addVectorControl",
            position=position,
            collapsed=collapsed,
            defaultUrl=default_url or "",
            loadDefaultUrl=load_default_url,
            defaultOpacity=default_opacity,
            defaultFillColor=default_fill_color,
            defaultStrokeColor=default_stroke_color,
            fitBounds=fit_bounds,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "vector-control": {"position": position, "collapsed": collapsed},
        }

    def add_control_grid(
        self,
        position: str = "top-right",
        default_controls: Optional[List[str]] = None,
        exclude: Optional[List[str]] = None,
        rows: Optional[int] = None,
        columns: Optional[int] = None,
        collapsed: bool = True,
        collapsible: bool = True,
        title: str = "",
        show_row_column_controls: bool = True,
        gap: int = 2,
        basemap_style_url: Optional[str] = None,
        exclude_layers: Optional[List[str]] = None,
        **kwargs,
    ) -> None:
        """Add a ControlGrid with all default tools or a custom subset.

        The ControlGrid provides a collapsible toolbar with up to 26 built-in
        controls (search, basemap, terrain, measure, draw, etc.) in a
        configurable grid layout.

        Args:
            position: Control position ('top-left', 'top-right', 'bottom-left',
                'bottom-right').
            default_controls: Explicit list of control names to include. If None,
                all 26 default controls are used (minus any in ``exclude``).
                Valid names: 'globe', 'fullscreen', 'north', 'terrain', 'search',
                'viewState', 'inspect', 'vectorDataset', 'basemap', 'measure',
                'geoEditor', 'bookmark', 'print', 'minimap', 'swipe',
                'streetView', 'addVector', 'cogLayer', 'zarrLayer',
                'pmtilesLayer', 'stacLayer', 'stacSearch', 'planetaryComputer',
                'gaussianSplat', 'lidar', 'usgsLidar'.
            exclude: Controls to remove from the default set. Ignored when
                ``default_controls`` is provided.
            rows: Number of grid rows (auto-calculated if None).
            columns: Number of grid columns (auto-calculated if None).
            collapsed: Whether the grid starts collapsed. Default True.
            collapsible: Whether the grid can be collapsed. Default True.
            title: Optional header title for the grid.
            show_row_column_controls: Show row/column input fields. Default True.
            gap: Gap between grid cells in pixels. Default 2.
            basemap_style_url: Basemap style URL for SwipeControl layer grouping.
                If None, the current map style is used automatically.
            exclude_layers: Layer ID patterns to exclude from SwipeControl
                (e.g., 'measure-*', 'gl-draw-*'). If None, sensible defaults
                are applied.
            **kwargs: Additional ControlGrid options.

        Example:
            >>> from anymap_ts import MapLibreMap
            >>> m = MapLibreMap()
            >>> m.add_control_grid()  # All 26 controls
            >>> # Or with customization:
            >>> m.add_control_grid(
            ...     exclude=["minimap", "streetView"],
            ...     collapsed=True,
            ... )
        """
        js_kwargs: Dict[str, Any] = {
            "position": position,
            "collapsed": collapsed,
            "collapsible": collapsible,
            "showRowColumnControls": show_row_column_controls,
            "gap": gap,
            **kwargs,
        }
        if default_controls is not None:
            js_kwargs["defaultControls"] = default_controls
        if exclude is not None:
            js_kwargs["exclude"] = exclude
        if rows is not None:
            js_kwargs["rows"] = rows
        if columns is not None:
            js_kwargs["columns"] = columns
        if title:
            js_kwargs["title"] = title
        if basemap_style_url is not None:
            js_kwargs["basemapStyleUrl"] = basemap_style_url
        if exclude_layers is not None:
            js_kwargs["excludeLayers"] = exclude_layers

        self.call_js_method("addControlGrid", **js_kwargs)
        # Save full config for HTML export
        control_config = {
            "position": position,
            "collapsed": collapsed,
            "collapsible": collapsible,
        }
        if default_controls is not None:
            control_config["defaultControls"] = default_controls
        if exclude is not None:
            control_config["exclude"] = exclude
        if rows is not None:
            control_config["rows"] = rows
        if columns is not None:
            control_config["columns"] = columns
        self._controls = {
            **self._controls,
            "control-grid": control_config,
        }

    # -------------------------------------------------------------------------
    # Colorbar
    # -------------------------------------------------------------------------

    def add_colorbar(
        self,
        colormap: str = "viridis",
        vmin: float = 0,
        vmax: float = 1,
        label: str = "",
        units: str = "",
        orientation: str = "horizontal",
        position: str = "bottom-right",
        bar_thickness: Optional[int] = None,
        bar_length: Optional[int] = None,
        ticks: Optional[Dict] = None,
        opacity: Optional[float] = None,
        colorbar_id: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a continuous gradient colorbar to the map.

        Displays a color gradient legend with customizable colormaps,
        tick marks, labels, and positioning using maplibre-gl-components.

        Args:
            colormap: Colormap name (e.g., 'viridis', 'plasma', 'inferno',
                'magma', 'cividis', 'coolwarm', 'jet', 'terrain', etc.).
            vmin: Minimum value for the colorbar scale.
            vmax: Maximum value for the colorbar scale.
            label: Title/label displayed above or beside the colorbar.
            units: Unit string displayed after values (e.g., '°C', 'm').
            orientation: Orientation of the colorbar ('horizontal' or 'vertical').
            position: Control position ('top-left', 'top-right',
                'bottom-left', 'bottom-right').
            bar_thickness: Width/height of the gradient bar in pixels.
            bar_length: Length of the colorbar in pixels.
            ticks: Tick configuration dict (e.g., {'count': 5, 'precision': 2}).
            opacity: Opacity of the colorbar container (0-1).
            colorbar_id: Unique identifier. If None, auto-generated.
            **kwargs: Additional Colorbar options.

        Example:
            >>> m = Map()
            >>> m.add_cog_layer("https://example.com/dem.tif")
            >>> m.add_colorbar(
            ...     colormap="terrain",
            ...     vmin=0,
            ...     vmax=4000,
            ...     label="Elevation",
            ...     units="m",
            ... )
        """
        self._validate_position(position)

        cbar_id = (
            colorbar_id
            or f"colorbar-{len([k for k in self._controls.keys() if k.startswith('colorbar')])}"
        )

        js_kwargs: Dict[str, Any] = {
            "colormap": colormap,
            "vmin": vmin,
            "vmax": vmax,
            "label": label,
            "units": units,
            "orientation": orientation,
            "position": position,
            "colorbarId": cbar_id,
            **kwargs,
        }
        if bar_thickness is not None:
            js_kwargs["barThickness"] = bar_thickness
        if bar_length is not None:
            js_kwargs["barLength"] = bar_length
        if ticks is not None:
            js_kwargs["ticks"] = ticks
        if opacity is not None:
            js_kwargs["opacity"] = opacity

        self.call_js_method("addColorbar", **js_kwargs)

        self._controls = {
            **self._controls,
            cbar_id: {
                "type": "colorbar",
                "colormap": colormap,
                "vmin": vmin,
                "vmax": vmax,
                "label": label,
                "units": units,
                "orientation": orientation,
                "position": position,
            },
        }

    def remove_colorbar(self, colorbar_id: Optional[str] = None) -> None:
        """Remove a colorbar from the map.

        Args:
            colorbar_id: Colorbar identifier to remove. If None, removes
                all colorbars.
        """
        if colorbar_id is None:
            cbar_keys = [k for k in self._controls.keys() if k.startswith("colorbar")]
            for key in cbar_keys:
                self.call_js_method("removeColorbar", colorbarId=key)
            self._controls = {
                k: v for k, v in self._controls.items() if not k.startswith("colorbar")
            }
        else:
            self.call_js_method("removeColorbar", colorbarId=colorbar_id)
            if colorbar_id in self._controls:
                controls = dict(self._controls)
                del controls[colorbar_id]
                self._controls = controls

    def update_colorbar(self, colorbar_id: Optional[str] = None, **kwargs) -> None:
        """Update an existing colorbar's properties.

        Args:
            colorbar_id: Colorbar identifier to update. If None, updates
                the first colorbar found.
            **kwargs: Properties to update (colormap, vmin, vmax, label,
                units, orientation, bar_thickness, bar_length, ticks, opacity).
        """
        if colorbar_id is None:
            cbar_keys = [k for k in self._controls.keys() if k.startswith("colorbar")]
            if not cbar_keys:
                raise ValueError("No colorbar found to update")
            colorbar_id = cbar_keys[0]

        if colorbar_id not in self._controls:
            raise ValueError(f"Colorbar '{colorbar_id}' not found")

        js_kwargs: Dict[str, Any] = {"colorbarId": colorbar_id}
        key_map = {
            "bar_thickness": "barThickness",
            "bar_length": "barLength",
        }
        for key, value in kwargs.items():
            js_key = key_map.get(key, key)
            js_kwargs[js_key] = value

        self.call_js_method("updateColorbar", **js_kwargs)

        for key, value in kwargs.items():
            if key in self._controls.get(colorbar_id, {}):
                self._controls[colorbar_id][key] = value

    # -------------------------------------------------------------------------
    # Search / Geocoder Control
    # -------------------------------------------------------------------------

    def add_search_control(
        self,
        position: str = "top-left",
        placeholder: str = "Search places...",
        collapsed: bool = True,
        fly_to_zoom: int = 14,
        show_marker: bool = True,
        marker_color: str = "#4264fb",
        **kwargs,
    ) -> None:
        """Add a search/geocoder control using Nominatim.

        Provides place search functionality with autocomplete results.
        Results are geocoded via OpenStreetMap Nominatim service.

        Args:
            position: Control position ('top-left', 'top-right',
                'bottom-left', 'bottom-right').
            placeholder: Placeholder text for the search input.
            collapsed: Whether the control starts collapsed (icon only).
            fly_to_zoom: Zoom level to fly to when selecting a result.
            show_marker: Whether to add a marker at the selected location.
            marker_color: Color of the result marker.
            **kwargs: Additional SearchControl options.

        Example:
            >>> m = Map()
            >>> m.add_search_control(position="top-left", fly_to_zoom=12)
        """
        self._validate_position(position)
        self.call_js_method(
            "addSearchControl",
            position=position,
            placeholder=placeholder,
            collapsed=collapsed,
            flyToZoom=fly_to_zoom,
            showMarker=show_marker,
            markerColor=marker_color,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "search-control": {
                "type": "search-control",
                "position": position,
                "collapsed": collapsed,
            },
        }

    def remove_search_control(self) -> None:
        """Remove the search/geocoder control from the map."""
        self.call_js_method("removeSearchControl")
        if "search-control" in self._controls:
            controls = dict(self._controls)
            del controls["search-control"]
            self._controls = controls

    # -------------------------------------------------------------------------
    # Measurement Tools
    # -------------------------------------------------------------------------

    def add_measure_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        default_mode: str = "distance",
        distance_unit: str = "kilometers",
        area_unit: str = "square-kilometers",
        line_color: str = "#3b82f6",
        fill_color: str = "rgba(59, 130, 246, 0.2)",
        **kwargs,
    ) -> None:
        """Add a measurement control for distances and areas.

        Provides tools for measuring distances (polylines) and areas
        (polygons) interactively on the map.

        Args:
            position: Control position ('top-left', 'top-right',
                'bottom-left', 'bottom-right').
            collapsed: Whether the control starts collapsed.
            default_mode: Default measurement mode ('distance' or 'area').
            distance_unit: Distance unit ('kilometers', 'miles', 'meters',
                'feet', 'nautical-miles').
            area_unit: Area unit ('square-kilometers', 'square-miles',
                'square-meters', 'hectares', 'acres').
            line_color: Line color for distance measurements.
            fill_color: Fill color for area measurements.
            **kwargs: Additional MeasureControl options.

        Example:
            >>> m = Map()
            >>> m.add_measure_control(
            ...     default_mode="distance",
            ...     distance_unit="miles",
            ... )
        """
        self._validate_position(position)
        self.call_js_method(
            "addMeasureControl",
            position=position,
            collapsed=collapsed,
            defaultMode=default_mode,
            distanceUnit=distance_unit,
            areaUnit=area_unit,
            lineColor=line_color,
            fillColor=fill_color,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "measure-control": {
                "type": "measure-control",
                "position": position,
                "collapsed": collapsed,
            },
        }

    def remove_measure_control(self) -> None:
        """Remove the measurement control from the map."""
        self.call_js_method("removeMeasureControl")
        if "measure-control" in self._controls:
            controls = dict(self._controls)
            del controls["measure-control"]
            self._controls = controls

    # -------------------------------------------------------------------------
    # Print / Export Control
    # -------------------------------------------------------------------------

    def add_print_control(
        self,
        position: str = "top-right",
        collapsed: bool = True,
        format: str = "png",
        filename: str = "map-export",
        include_north_arrow: bool = False,
        include_scale_bar: bool = False,
        **kwargs,
    ) -> None:
        """Add a print/export control for saving the map as an image.

        Provides an interactive panel for exporting the current map view
        as PNG, JPEG, or PDF files.

        Args:
            position: Control position ('top-left', 'top-right',
                'bottom-left', 'bottom-right').
            collapsed: Whether the control starts collapsed.
            format: Default image format ('png', 'jpeg', 'pdf').
            filename: Default filename (without extension).
            include_north_arrow: Whether to include a north arrow by default.
            include_scale_bar: Whether to include a scale bar by default.
            **kwargs: Additional PrintControl options.

        Example:
            >>> m = Map()
            >>> m.add_print_control(
            ...     format="png",
            ...     filename="my-map",
            ...     include_scale_bar=True,
            ... )
        """
        self._validate_position(position)
        self.call_js_method(
            "addPrintControl",
            position=position,
            collapsed=collapsed,
            format=format,
            filename=filename,
            includeNorthArrow=include_north_arrow,
            includeScaleBar=include_scale_bar,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "print-control": {
                "type": "print-control",
                "position": position,
                "collapsed": collapsed,
            },
        }

    def remove_print_control(self) -> None:
        """Remove the print/export control from the map."""
        self.call_js_method("removePrintControl")
        if "print-control" in self._controls:
            controls = dict(self._controls)
            del controls["print-control"]
            self._controls = controls

    # -------------------------------------------------------------------------
    # FlatGeobuf Layer
    # -------------------------------------------------------------------------

    def add_flatgeobuf(
        self,
        url: str,
        name: Optional[str] = None,
        layer_type: Optional[str] = None,
        paint: Optional[Dict] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a FlatGeobuf layer from a URL.

        Streams and renders cloud-native FlatGeobuf vector data directly
        in the browser without downloading the entire file.

        Args:
            url: URL to the FlatGeobuf file.
            name: Layer name. If None, auto-generated.
            layer_type: MapLibre layer type ('circle', 'line', 'fill').
                If None, inferred from geometry type.
            paint: MapLibre paint properties. If None, defaults are used.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.

        Example:
            >>> m = Map()
            >>> m.add_flatgeobuf(
            ...     "https://flatgeobuf.org/test/data/UScounties.fgb",
            ...     name="counties",
            ...     paint={"fill-color": "#088", "fill-opacity": 0.5},
            ... )
        """
        layer_id = name or f"flatgeobuf-{len(self._layers)}"

        self.call_js_method(
            "addFlatGeobuf",
            url=url,
            name=layer_id,
            layerType=layer_type,
            paint=paint,
            fitBounds=fit_bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "flatgeobuf",
                "url": url,
            },
        }
        self._add_to_layer_dict(layer_id, "Vector")

    def remove_flatgeobuf(self, name: str) -> None:
        """Remove a FlatGeobuf layer from the map.

        Args:
            name: The layer identifier to remove.
        """
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self._remove_from_layer_dict(name)
        self.call_js_method("removeFlatGeobuf", name=name)

    def _process_deck_data(self, data: Any) -> Any:
        """Process data for deck.gl layers.

        Handles GeoDataFrame, file paths, GeoJSON, and list of dicts.

        Args:
            data: Input data in various formats.

        Returns:
            Processed data suitable for deck.gl layers.
        """
        # Handle GeoDataFrame
        if hasattr(data, "__geo_interface__"):
            return data.__geo_interface__

        # Handle file paths
        if isinstance(data, (str, Path)):
            path = Path(data)
            if path.exists():
                try:
                    import geopandas as gpd

                    gdf = gpd.read_file(path)
                    return gdf.__geo_interface__
                except ImportError:
                    pass

        # Return as-is for lists, dicts, etc.
        return data

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
            layer_id: Unique layer identifier
            layer_type: MapLibre layer type
            source: Source ID or source configuration dict
            paint: Paint properties
            layout: Layout properties
            before_id: ID of layer to insert before
            **kwargs: Additional layer options
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
        # Determine category based on layer type
        layer_type = layer_config.get("type", "")
        if layer_type == "raster":
            self._add_to_layer_dict(layer_id, "Raster")
        else:
            self._add_to_layer_dict(layer_id, "Vector")

    def remove_layer(self, layer_id: str) -> None:
        """Remove a layer from the map.

        Args:
            layer_id: Layer identifier to remove
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self._remove_from_layer_dict(layer_id)
        self.call_js_method("removeLayer", layer_id)

    def set_visibility(self, layer_id: str, visible: bool) -> None:
        """Set layer visibility.

        Args:
            layer_id: Layer identifier
            visible: Whether layer should be visible
        """
        self.call_js_method("setVisibility", layer_id, visible)

    def set_opacity(self, layer_id: str, opacity: float) -> None:
        """Set layer opacity.

        Args:
            layer_id: Layer identifier
            opacity: Opacity value between 0 and 1
        """
        self._validate_opacity(opacity)
        self.call_js_method("setOpacity", layer_id, opacity)

    def set_paint_property(self, layer_id: str, property_name: str, value: Any) -> None:
        """Set a paint property for a layer.

        Args:
            layer_id: Layer identifier.
            property_name: Name of the paint property (e.g., 'fill-color').
            value: New value for the property.

        Example:
            >>> m.set_paint_property("my-layer", "fill-color", "#ff0000")
            >>> m.set_paint_property("my-layer", "fill-opacity", 0.5)
        """
        self.call_js_method("setPaintProperty", layer_id, property_name, value)

    def set_layout_property(
        self, layer_id: str, property_name: str, value: Any
    ) -> None:
        """Set a layout property for a layer.

        Args:
            layer_id: Layer identifier.
            property_name: Name of the layout property (e.g., 'visibility').
            value: New value for the property.

        Example:
            >>> m.set_layout_property("my-layer", "visibility", "none")
        """
        self.call_js_method("setLayoutProperty", layer_id, property_name, value)

    def move_layer(self, layer_id: str, before_id: Optional[str] = None) -> None:
        """Move a layer in the layer stack.

        Args:
            layer_id: Layer identifier to move.
            before_id: ID of layer to move before. If None, moves to top.

        Example:
            >>> m.move_layer("my-layer", "other-layer")  # Move before other-layer
            >>> m.move_layer("my-layer")  # Move to top
        """
        self.call_js_method("moveLayer", layer_id, before_id)

    def get_layer(self, layer_id: str) -> Optional[Dict]:
        """Get layer configuration by ID.

        Args:
            layer_id: Layer identifier.

        Returns:
            Layer configuration dict or None if not found.
        """
        return self._layers.get(layer_id)

    def get_layer_ids(self) -> List[str]:
        """Get list of all layer IDs.

        Returns:
            List of layer identifiers.
        """
        return list(self._layers.keys())

    def add_popup(
        self,
        layer_id: str,
        properties: Optional[List[str]] = None,
        template: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add popup on click for a layer.

        Configures a layer to show a popup when features are clicked.

        Args:
            layer_id: Layer identifier to add popup to.
            properties: List of property names to display. If None, shows all.
            template: Custom HTML template for popup content. Use {property_name}
                placeholders for values. If None, auto-generates table.
            **kwargs: Additional popup options (maxWidth, closeButton, etc.).

        Example:
            >>> m.add_vector(geojson, name="cities")
            >>> m.add_popup("cities", properties=["name", "population"])
            >>> # Or with custom template:
            >>> m.add_popup("cities", template="<h3>{name}</h3><p>Pop: {population}</p>")
        """
        self.call_js_method(
            "addPopup",
            layerId=layer_id,
            properties=properties,
            template=template,
            **kwargs,
        )

    # -------------------------------------------------------------------------
    # Terrain and Image Overlay Methods
    # -------------------------------------------------------------------------

    def add_3d_terrain(
        self,
        source: str = "terrarium",
        exaggeration: float = 1.0,
        **kwargs,
    ) -> None:
        """Enable 3D terrain visualization.

        MapLibre GL JS supports 3D terrain rendering using elevation data
        from various terrain tile sources.

        Args:
            source: Terrain source - 'terrarium' (AWS terrain tiles) or
                'mapbox' (requires Mapbox token) or custom terrain URL.
            exaggeration: Vertical exaggeration factor. Default 1.0.
            **kwargs: Additional terrain options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map(center=[-122.4, 37.8], zoom=12, pitch=60)
            >>> m.add_3d_terrain(exaggeration=1.5)
        """
        # Define terrain sources
        terrain_sources = {
            "terrarium": {
                "url": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
                "encoding": "terrarium",
            },
            "mapbox": {
                "url": "mapbox://mapbox.mapbox-terrain-dem-v1",
                "encoding": "mapbox",
            },
        }

        if source in terrain_sources:
            terrain_config = terrain_sources[source]
        else:
            # Assume it's a custom URL
            terrain_config = {"url": source, "encoding": "terrarium"}

        self.call_js_method(
            "addTerrain",
            source=terrain_config,
            exaggeration=exaggeration,
            **kwargs,
        )

    def add_image_layer(
        self,
        url: str,
        coordinates: List[List[float]],
        name: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a georeferenced image overlay.

        Overlays an image on the map at specified geographic coordinates.

        Args:
            url: URL to the image file.
            coordinates: Four corner coordinates as [[lng, lat], ...] in order:
                top-left, top-right, bottom-right, bottom-left.
            name: Layer identifier. If None, auto-generated.
            opacity: Layer opacity (0-1).
            **kwargs: Additional layer options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_image_layer(
            ...     url="https://example.com/overlay.png",
            ...     coordinates=[
            ...         [-80.425, 46.437],  # top-left
            ...         [-71.516, 46.437],  # top-right
            ...         [-71.516, 37.936],  # bottom-right
            ...         [-80.425, 37.936],  # bottom-left
            ...     ]
            ... )
        """
        self._validate_opacity(opacity)
        layer_id = name or f"image-{len(self._layers)}"

        if len(coordinates) != 4:
            raise ValueError(
                "coordinates must have exactly 4 corner points "
                "[top-left, top-right, bottom-right, bottom-left]"
            )

        self.call_js_method(
            "addImageLayer",
            id=layer_id,
            url=url,
            coordinates=coordinates,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "image",
                "url": url,
                "coordinates": coordinates,
            },
        }
        self._add_to_layer_dict(layer_id, "Raster")

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
            control_type: Type of control ('navigation', 'scale', 'fullscreen', etc.)
            position: Control position
            **kwargs: Control-specific options
        """
        self.call_js_method("addControl", control_type, position=position, **kwargs)
        self._controls = {
            **self._controls,
            control_type: {"type": control_type, "position": position, **kwargs},
        }

    def remove_control(self, control_type: str) -> None:
        """Remove a map control.

        Args:
            control_type: Type of control to remove
        """
        self.call_js_method("removeControl", control_type)
        if control_type in self._controls:
            controls = dict(self._controls)
            del controls[control_type]
            self._controls = controls

    def add_layer_control(
        self,
        layers: Optional[List[str]] = None,
        position: str = "top-right",
        collapsed: bool = True,
    ) -> None:
        """Add a layer visibility control.

        Uses maplibre-gl-layer-control for layer toggling and opacity.

        Args:
            layers: List of layer IDs to include (None = all layers)
            position: Control position
            collapsed: Whether control starts collapsed
        """
        if layers is None:
            layers = list(self._layers.keys())

        self.call_js_method(
            "addLayerControl",
            layers=layers,
            position=position,
            collapsed=collapsed,
        )
        self._controls = {
            **self._controls,
            "layer-control": {
                "layers": layers,
                "position": position,
                "collapsed": collapsed,
            },
        }

    def add_legend(
        self,
        title: str,
        labels: List[str],
        colors: List[str],
        position: str = "bottom-right",
        opacity: float = 1.0,
        legend_id: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a floating legend control to the map.

        Creates a custom legend control with colored boxes and labels that
        floats over the map in the specified position.

        Args:
            title: Legend title text
            labels: List of label strings for each legend item
            colors: List of hex color strings (e.g., ['#ff0000', '#00ff00', '#0000ff'])
            position: Legend position ('top-left', 'top-right', 'bottom-left', 'bottom-right')
            opacity: Legend background opacity (0-1)
            legend_id: Custom legend identifier (auto-generated if None)
            **kwargs: Additional legend styling options

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_legend(
            ...     title="Land Cover",
            ...     labels=["Forest", "Water", "Urban"],
            ...     colors=["#228B22", "#0000FF", "#808080"],
            ...     position="top-left"
            ... )
        """
        if len(labels) != len(colors):
            raise ValueError("Number of labels must match number of colors")

        # Validate position
        self._validate_position(position)

        # Validate colors (basic hex color check)
        for i, color in enumerate(colors):
            if not isinstance(color, str) or not color.startswith("#"):
                raise ValueError(
                    f"Color at index {i} must be a hex color string (e.g., '#ff0000')"
                )

        legend_id = (
            legend_id
            or f"legend-{len([k for k in self._controls.keys() if k.startswith('legend')])}"
        )

        # Prepare legend data
        legend_items = []
        for label, color in zip(labels, colors):
            legend_items.append(
                {
                    "label": label,
                    "color": color,
                }
            )

        # Call JavaScript method to add legend
        self.call_js_method(
            "addLegend",
            id=legend_id,
            title=title,
            items=legend_items,
            position=position,
            opacity=opacity,
            **kwargs,
        )

        # Track legend control
        self._controls = {
            **self._controls,
            legend_id: {
                "type": "legend",
                "title": title,
                "labels": labels,
                "colors": colors,
                "position": position,
                "opacity": opacity,
            },
        }

    def remove_legend(self, legend_id: Optional[str] = None) -> None:
        """Remove a legend control from the map.

        Args:
            legend_id: Legend identifier to remove. If None, removes all legends.
        """
        if legend_id is None:
            # Remove all legends - create a copy of keys before iterating
            legend_keys = [k for k in self._controls.keys() if k.startswith("legend")]
            for key in legend_keys:
                self.call_js_method("removeLegend", key)
            # Rebuild controls dict without legend keys
            self._controls = {
                k: v for k, v in self._controls.items() if not k.startswith("legend")
            }
        else:
            self.call_js_method("removeLegend", legend_id)
            if legend_id in self._controls:
                controls = dict(self._controls)
                del controls[legend_id]
                self._controls = controls

    def update_legend(
        self,
        legend_id: str,
        title: Optional[str] = None,
        labels: Optional[List[str]] = None,
        colors: Optional[List[str]] = None,
        opacity: Optional[float] = None,
        **kwargs,
    ) -> None:
        """Update an existing legend's properties.

        Args:
            legend_id: Legend identifier to update
            title: New title (if provided)
            labels: New labels list (if provided)
            colors: New colors list (if provided)
            opacity: New opacity (if provided)
            **kwargs: Additional properties to update
        """
        if legend_id not in self._controls:
            raise ValueError(f"Legend '{legend_id}' not found")

        update_params = {"id": legend_id}

        if title is not None:
            update_params["title"] = title
            self._controls[legend_id]["title"] = title

        if labels is not None and colors is not None:
            if len(labels) != len(colors):
                raise ValueError("Number of labels must match number of colors")

            legend_items = [
                {"label": label, "color": color} for label, color in zip(labels, colors)
            ]
            update_params["items"] = legend_items
            self._controls[legend_id]["labels"] = labels
            self._controls[legend_id]["colors"] = colors

        elif labels is not None or colors is not None:
            raise ValueError("Both labels and colors must be provided together")

        if opacity is not None:
            update_params["opacity"] = opacity
            self._controls[legend_id]["opacity"] = opacity

        update_params.update(kwargs)
        self.call_js_method("updateLegend", **update_params)

    # -------------------------------------------------------------------------
    # Drawing
    # -------------------------------------------------------------------------

    def add_draw_control(
        self,
        position: str = "top-right",
        draw_modes: Optional[List[str]] = None,
        edit_modes: Optional[List[str]] = None,
        collapsed: bool = False,
        **kwargs,
    ) -> None:
        """Add a drawing control using maplibre-gl-geo-editor.

        Args:
            position: Control position
            draw_modes: Drawing modes to enable (e.g., ['polygon', 'line', 'marker'])
            edit_modes: Edit modes to enable (e.g., ['select', 'drag', 'delete'])
            collapsed: Whether control starts collapsed
            **kwargs: Additional geo-editor options
        """
        if draw_modes is None:
            draw_modes = ["polygon", "line", "rectangle", "circle", "marker"]
        if edit_modes is None:
            edit_modes = ["select", "drag", "change", "rotate", "delete"]

        self.call_js_method(
            "addDrawControl",
            position=position,
            drawModes=draw_modes,
            editModes=edit_modes,
            collapsed=collapsed,
            **kwargs,
        )
        self._controls = {
            **self._controls,
            "draw-control": {
                "position": position,
                "drawModes": draw_modes,
                "editModes": edit_modes,
            },
        }

    def get_draw_data(self) -> Dict:
        """Get the current drawn features as GeoJSON.

        Returns:
            GeoJSON FeatureCollection of drawn features
        """
        self.call_js_method("getDrawData")
        # Small delay to allow JS to update the trait
        import time

        time.sleep(0.1)
        return self._draw_data or {"type": "FeatureCollection", "features": []}

    @property
    def draw_data(self) -> Dict:
        """Property to access current draw data."""
        return self._draw_data or {"type": "FeatureCollection", "features": []}

    def load_draw_data(self, geojson: Dict) -> None:
        """Load GeoJSON features into the drawing layer.

        Args:
            geojson: GeoJSON FeatureCollection to load
        """
        self._draw_data = geojson
        self.call_js_method("loadDrawData", geojson)

    def clear_draw_data(self) -> None:
        """Clear all drawn features."""
        self._draw_data = {"type": "FeatureCollection", "features": []}
        self.call_js_method("clearDrawData")

    def save_draw_data(
        self,
        filepath: Union[str, Path],
        driver: Optional[str] = None,
    ) -> None:
        """Save drawn features to a file.

        Args:
            filepath: Path to save file
            driver: Output driver (auto-detected from extension if not provided)

        Raises:
            ImportError: If geopandas is not installed
        """
        try:
            import geopandas as gpd
        except ImportError:
            raise ImportError(
                "geopandas is required to save draw data. "
                "Install with: pip install anymap-ts[vector]"
            )

        data = self.get_draw_data()
        if not data.get("features"):
            print("No features to save")
            return

        gdf = gpd.GeoDataFrame.from_features(data["features"])
        filepath = Path(filepath)

        # Infer driver from extension
        if driver is None:
            ext = filepath.suffix.lower()
            driver_map = {
                ".geojson": "GeoJSON",
                ".json": "GeoJSON",
                ".shp": "ESRI Shapefile",
                ".gpkg": "GPKG",
            }
            driver = driver_map.get(ext, "GeoJSON")

        gdf.to_file(filepath, driver=driver)

    # -------------------------------------------------------------------------
    # GeoJSON Clustering
    # -------------------------------------------------------------------------

    def add_cluster_layer(
        self,
        data: Any,
        cluster_radius: int = 50,
        cluster_max_zoom: int = 14,
        cluster_colors: Optional[List[str]] = None,
        cluster_steps: Optional[List[int]] = None,
        cluster_min_radius: int = 15,
        cluster_max_radius: int = 30,
        unclustered_color: str = "#11b4da",
        unclustered_radius: int = 8,
        show_cluster_count: bool = True,
        name: Optional[str] = None,
        zoom_on_click: bool = True,
        fit_bounds: bool = True,
        **kwargs,
    ) -> str:
        """Add a clustered point layer with automatic grouping.

        Creates a point layer that automatically clusters nearby points at
        lower zoom levels. Clicking on clusters zooms in to expand them.

        Args:
            data: Point data - GeoJSON, GeoDataFrame, file path, or URL.
            cluster_radius: Radius of each cluster when grouping points (pixels).
            cluster_max_zoom: Max zoom level to cluster points (above this, all
                points are shown individually).
            cluster_colors: List of colors for cluster circles by size.
                Default: ["#51bbd6", "#f1f075", "#f28cb1"].
            cluster_steps: Point count thresholds for color changes.
                Default: [100, 750]. Must have len(cluster_colors) - 1 values.
            cluster_min_radius: Minimum cluster circle radius in pixels.
            cluster_max_radius: Maximum cluster circle radius in pixels.
            unclustered_color: Color for individual (unclustered) points.
            unclustered_radius: Radius for individual points in pixels.
            show_cluster_count: Whether to show point count in clusters.
            name: Layer identifier. If None, auto-generated.
            zoom_on_click: Whether clicking clusters zooms in to expand them.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional options.

        Returns:
            The layer identifier.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_cluster_layer(
            ...     "earthquakes.geojson",
            ...     cluster_radius=80,
            ...     cluster_colors=["#00ff00", "#ffff00", "#ff0000"],
            ...     cluster_steps=[50, 500],
            ... )
        """
        layer_id = name or f"cluster-{len(self._layers)}"

        # Default colors and steps
        if cluster_colors is None:
            cluster_colors = ["#51bbd6", "#f1f075", "#f28cb1"]
        if cluster_steps is None:
            cluster_steps = [100, 750]

        # Validate steps vs colors
        if len(cluster_steps) != len(cluster_colors) - 1:
            raise ValueError(
                f"cluster_steps must have {len(cluster_colors) - 1} values "
                f"(one less than cluster_colors), got {len(cluster_steps)}"
            )

        # Convert data to GeoJSON
        geojson = to_geojson(data)

        # Handle URL data - fetch GeoJSON
        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

        # Get bounds
        bounds = get_bounds(geojson) if fit_bounds else None

        self.call_js_method(
            "addClusterLayer",
            data=geojson,
            name=layer_id,
            clusterRadius=cluster_radius,
            clusterMaxZoom=cluster_max_zoom,
            clusterColors=cluster_colors,
            clusterSteps=cluster_steps,
            clusterMinRadius=cluster_min_radius,
            clusterMaxRadius=cluster_max_radius,
            unclusteredColor=unclustered_color,
            unclusteredRadius=unclustered_radius,
            showClusterCount=show_cluster_count,
            zoomOnClick=zoom_on_click,
            fitBounds=fit_bounds,
            bounds=bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "cluster",
                "source": f"{layer_id}-source",
            },
        }
        self._add_to_layer_dict(layer_id, "Vector")
        return layer_id

    def remove_cluster_layer(self, layer_id: str) -> None:
        """Remove a cluster layer and all its sublayers.

        Args:
            layer_id: Layer identifier to remove.
        """
        self._remove_layer_internal(layer_id, "removeClusterLayer")

    # -------------------------------------------------------------------------
    # Choropleth Maps
    # -------------------------------------------------------------------------

    def add_choropleth(
        self,
        data: Any,
        column: str,
        cmap: str = "viridis",
        classification: str = "quantile",
        k: int = 5,
        breaks: Optional[List[float]] = None,
        fill_opacity: float = 0.7,
        line_color: str = "#000000",
        line_width: float = 1,
        legend: bool = True,
        legend_title: Optional[str] = None,
        hover: bool = True,
        layer_id: Optional[str] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a choropleth (thematic) map layer with automatic classification.

        Choropleth maps use color gradients to visualize data values across
        geographic areas. This method automatically classifies data and applies
        appropriate colors.

        Args:
            data: Polygon data - GeoJSON, GeoDataFrame, file path, or URL.
            column: Property name to visualize (must be numeric).
            cmap: Colormap name. Any matplotlib colormap is supported when
                matplotlib is installed. Common options include:
                - Sequential: 'viridis', 'plasma', 'inferno', 'magma', 'cividis',
                  'Blues', 'Greens', 'Reds', 'Oranges', 'Purples', 'Greys'
                - Diverging: 'RdBu', 'RdYlGn', 'RdYlBu', 'Spectral', 'coolwarm'
                - Qualitative: 'Set1', 'Set2', 'Set3', 'Paired', 'tab10', 'tab20'
                See: https://matplotlib.org/stable/gallery/color/colormap_reference.html
            classification: Classification method:
                - 'quantile': Equal number of features per class
                - 'equal_interval': Equal value ranges
                - 'natural_breaks': Jenks natural breaks (requires jenkspy)
                - 'manual': Use custom breaks
            k: Number of classes (ignored if classification='manual').
            breaks: Custom break values for 'manual' classification.
                Must have k+1 values defining class boundaries.
            fill_opacity: Polygon fill opacity (0-1).
            line_color: Polygon outline color.
            line_width: Polygon outline width.
            legend: Whether to add a legend.
            legend_title: Legend title. Defaults to column name.
            hover: Whether to enable hover highlight effect.
            layer_id: Layer identifier. If None, auto-generated.
            fit_bounds: Whether to fit map to data bounds.
            **kwargs: Additional layer options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_choropleth(
            ...     "us_states.geojson",
            ...     column="population",
            ...     cmap="YlOrRd",
            ...     classification="quantile",
            ...     k=5,
            ...     legend_title="Population"
            ... )
        """
        from .utils import (
            get_choropleth_colors,
            compute_breaks,
            build_step_expression,
        )

        layer_name = layer_id or f"choropleth-{len(self._layers)}"

        # Convert data to GeoJSON
        geojson = to_geojson(data)

        # Handle URL data - fetch GeoJSON
        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

        # Extract values for classification
        features = geojson.get("features", [])
        values = []
        for feature in features:
            props = feature.get("properties", {})
            val = props.get(column)
            if val is not None:
                try:
                    values.append(float(val))
                except (TypeError, ValueError):
                    pass

        if not values:
            raise ValueError(f"No valid numeric values found for column '{column}'")

        # Compute breaks
        computed_breaks = compute_breaks(values, classification, k, breaks)

        # Get colors
        colors = get_choropleth_colors(cmap, k)

        # Build step expression for MapLibre
        step_expr = build_step_expression(column, computed_breaks, colors)

        # Get bounds
        bounds = get_bounds(geojson) if fit_bounds else None

        self.call_js_method(
            "addChoropleth",
            data=geojson,
            name=layer_name,
            column=column,
            stepExpression=step_expr,
            fillOpacity=fill_opacity,
            lineColor=line_color,
            lineWidth=line_width,
            hover=hover,
            fitBounds=fit_bounds,
            bounds=bounds,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_name: {
                "id": layer_name,
                "type": "choropleth",
                "source": f"{layer_name}-source",
                "column": column,
            },
        }
        self._add_to_layer_dict(layer_name, "Vector")

        # Add legend
        if legend:
            title = legend_title or column
            # Create labels from breaks
            labels = []
            for i in range(len(computed_breaks) - 1):
                low = computed_breaks[i]
                high = computed_breaks[i + 1]
                if i == len(computed_breaks) - 2:
                    labels.append(f"{low:.1f} - {high:.1f}")
                else:
                    labels.append(f"{low:.1f} - {high:.1f}")

            self.add_legend(
                title=title,
                labels=labels,
                colors=colors,
                position="bottom-right",
            )

    # -------------------------------------------------------------------------
    # 3D Buildings
    # -------------------------------------------------------------------------

    def add_3d_buildings(
        self,
        source: str = "openmaptiles",
        min_zoom: float = 14,
        fill_extrusion_color: str = "#aaa",
        fill_extrusion_opacity: float = 0.6,
        height_property: str = "render_height",
        base_property: str = "render_min_height",
        layer_id: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add 3D building extrusions from vector tiles.

        Creates 3D building visualizations using fill-extrusion layers.
        Works best with vector tile styles that include building data.

        Note:
            This feature requires a map style with vector tile building data.
            Recommended styles:
            - MapTiler styles (requires API key)
            - OpenFreeMap: "https://tiles.openfreemap.org/styles/liberty"
            - Protomaps styles

            CartoDB raster styles (Positron, DarkMatter) do NOT have building
            data. For those, the method will attempt to add OpenFreeMap tiles
            as a source, but results may vary.

        Args:
            source: Building source identifier. Usually auto-detected from
                the map style.
            min_zoom: Minimum zoom level to show buildings (default: 14).
            fill_extrusion_color: Building color as hex string.
            fill_extrusion_opacity: Building opacity (0-1).
            height_property: Property name for building height in the
                vector tiles (default: 'render_height').
            base_property: Property name for building base height
                (default: 'render_min_height').
            layer_id: Layer identifier. If None, uses '3d-buildings'.
            **kwargs: Additional layer options.

        Example:
            >>> from anymap_ts import Map
            >>> # Use a vector style with building data
            >>> m = Map(
            ...     center=[-74.0060, 40.7128],
            ...     zoom=15,
            ...     pitch=60,
            ...     style="https://tiles.openfreemap.org/styles/liberty"
            ... )
            >>> m.add_3d_buildings(
            ...     fill_extrusion_color="#4682B4",
            ...     fill_extrusion_opacity=0.8
            ... )
        """
        layer_name = layer_id or "3d-buildings"

        self.call_js_method(
            "add3DBuildings",
            source=source,
            minZoom=min_zoom,
            fillExtrusionColor=fill_extrusion_color,
            fillExtrusionOpacity=fill_extrusion_opacity,
            heightProperty=height_property,
            baseProperty=base_property,
            layerId=layer_name,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_name: {
                "id": layer_name,
                "type": "fill-extrusion",
            },
        }
        self._add_to_layer_dict(layer_name, "Vector")

    # -------------------------------------------------------------------------
    # Route Animation
    # -------------------------------------------------------------------------

    def animate_along_route(
        self,
        route: Any,
        duration: int = 10000,
        loop: bool = True,
        marker_color: str = "#3388ff",
        marker_size: float = 1.0,
        show_trail: bool = False,
        trail_color: str = "#3388ff",
        trail_width: float = 3,
        animation_id: Optional[str] = None,
        **kwargs,
    ) -> str:
        """Animate a marker along a route.

        Creates an animated marker that moves along the specified route line.

        Args:
            route: Route data - LineString GeoJSON, list of coordinates,
                GeoDataFrame, or file path.
            duration: Animation duration in milliseconds.
            loop: Whether to loop the animation.
            marker_color: Marker color.
            marker_size: Marker size multiplier.
            show_trail: Whether to show a trail behind the marker.
            trail_color: Trail line color.
            trail_width: Trail line width.
            animation_id: Animation identifier. If None, auto-generated.
            **kwargs: Additional animation options.

        Returns:
            The animation identifier.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> coords = [[-122.4, 37.8], [-122.3, 37.7], [-122.2, 37.8]]
            >>> anim_id = m.animate_along_route(coords, duration=5000, loop=True)
        """
        anim_id = animation_id or f"animation-{len(self._layers)}"

        # Convert route to coordinates list
        if isinstance(route, list) and len(route) > 0:
            if isinstance(route[0], (list, tuple)):
                # Already a list of coordinates
                coordinates = route
            else:
                raise ValueError("Route list must contain coordinate pairs")
        elif isinstance(route, dict):
            # GeoJSON
            if route.get("type") == "LineString":
                coordinates = route.get("coordinates", [])
            elif route.get("type") == "Feature":
                geometry = route.get("geometry", {})
                if geometry.get("type") == "LineString":
                    coordinates = geometry.get("coordinates", [])
                else:
                    raise ValueError("Feature geometry must be LineString")
            elif route.get("type") == "FeatureCollection":
                features = route.get("features", [])
                if (
                    features
                    and features[0].get("geometry", {}).get("type") == "LineString"
                ):
                    coordinates = features[0]["geometry"]["coordinates"]
                else:
                    raise ValueError(
                        "FeatureCollection must contain LineString features"
                    )
            else:
                raise ValueError(
                    "GeoJSON must be LineString, Feature, or FeatureCollection"
                )
        else:
            # Try to convert using to_geojson
            geojson = to_geojson(route)
            if geojson.get("type") == "url":
                geojson = fetch_geojson(geojson["url"])
            # Extract coordinates from the converted geojson
            if geojson.get("type") == "FeatureCollection":
                features = geojson.get("features", [])
                if features:
                    coordinates = features[0].get("geometry", {}).get("coordinates", [])
                else:
                    raise ValueError("No features found in data")
            elif geojson.get("type") == "Feature":
                coordinates = geojson.get("geometry", {}).get("coordinates", [])
            else:
                coordinates = geojson.get("coordinates", [])

        if len(coordinates) < 2:
            raise ValueError("Route must have at least 2 points")

        self.call_js_method(
            "animateAlongRoute",
            id=anim_id,
            coordinates=coordinates,
            duration=duration,
            loop=loop,
            markerColor=marker_color,
            markerSize=marker_size,
            showTrail=show_trail,
            trailColor=trail_color,
            trailWidth=trail_width,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            anim_id: {
                "id": anim_id,
                "type": "animation",
            },
        }
        return anim_id

    def stop_animation(self, animation_id: str) -> None:
        """Stop a running animation.

        Args:
            animation_id: Animation identifier to stop.
        """
        self.call_js_method("stopAnimation", animation_id)
        if animation_id in self._layers:
            layers = dict(self._layers)
            del layers[animation_id]
            self._layers = layers

    def pause_animation(self, animation_id: str) -> None:
        """Pause a running animation.

        Args:
            animation_id: Animation identifier to pause.
        """
        self.call_js_method("pauseAnimation", animation_id)

    def resume_animation(self, animation_id: str) -> None:
        """Resume a paused animation.

        Args:
            animation_id: Animation identifier to resume.
        """
        self.call_js_method("resumeAnimation", animation_id)

    def set_animation_speed(self, animation_id: str, speed: float) -> None:
        """Set animation speed multiplier.

        Args:
            animation_id: Animation identifier.
            speed: Speed multiplier (1.0 = normal, 2.0 = double speed, etc.).
        """
        self.call_js_method("setAnimationSpeed", animation_id, speed)

    # -------------------------------------------------------------------------
    # Feature Hover Effect
    # -------------------------------------------------------------------------

    def add_hover_effect(
        self,
        layer_id: str,
        highlight_color: Optional[str] = None,
        highlight_opacity: Optional[float] = None,
        highlight_outline_width: float = 2,
        **kwargs,
    ) -> None:
        """Add hover highlight effect to an existing layer.

        When the mouse hovers over a feature, it will be highlighted with
        the specified styles.

        Args:
            layer_id: Layer identifier to add hover effect to.
            highlight_color: Override fill/line color on hover. If None,
                the original color is kept but opacity/outline changes.
            highlight_opacity: Override opacity on hover.
            highlight_outline_width: Outline width on hover.
            **kwargs: Additional hover effect options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map()
            >>> m.add_geojson("states.geojson", name="states")
            >>> m.add_hover_effect("states", highlight_opacity=0.9)
        """
        self.call_js_method(
            "addHoverEffect",
            layerId=layer_id,
            highlightColor=highlight_color,
            highlightOpacity=highlight_opacity,
            highlightOutlineWidth=highlight_outline_width,
            **kwargs,
        )

    # -------------------------------------------------------------------------
    # Sky & Fog
    # -------------------------------------------------------------------------

    def set_sky(
        self,
        sky_color: str = "#88C6FC",
        horizon_color: str = "#F0E4D4",
        fog_color: str = "#FFFFFF",
        sky_horizon_blend: float = 0.5,
        horizon_fog_blend: float = 0.5,
        fog_ground_blend: float = 0.5,
        atmosphere_blend: float = 0.8,
        **kwargs,
    ) -> None:
        """Set sky and fog atmospheric effects for 3D terrain visualization.

        MapLibre v5 unifies sky and fog into a single `map.setSky()` API.
        Best used with 3D terrain enabled.

        Args:
            sky_color: Color of the sky. Default is "#88C6FC".
            horizon_color: Color at the horizon. Default is "#F0E4D4".
            fog_color: Color of the fog. Default is "#FFFFFF".
            sky_horizon_blend: Blend between sky and horizon (0-1).
                Default is 0.5.
            horizon_fog_blend: Blend between horizon and fog (0-1).
                Default is 0.5.
            fog_ground_blend: Blend between fog and ground (0-1).
                Default is 0.5.
            atmosphere_blend: Intensity of the atmosphere effect (0-1).
                Default is 0.8.
            **kwargs: Additional sky options.

        Example:
            >>> from anymap_ts import Map
            >>> m = Map(center=[-122.4, 37.8], zoom=12, pitch=60)
            >>> m.add_3d_terrain(exaggeration=1.5)
            >>> m.set_sky()
        """
        self.call_js_method(
            "setSky",
            skyColor=sky_color,
            horizonColor=horizon_color,
            fogColor=fog_color,
            skyHorizonBlend=sky_horizon_blend,
            horizonFogBlend=horizon_fog_blend,
            fogGroundBlend=fog_ground_blend,
            atmosphereBlend=atmosphere_blend,
            **kwargs,
        )

    def remove_sky(self) -> None:
        """Remove sky and fog atmospheric effects from the map.

        Example:
            >>> m.remove_sky()
        """
        self.call_js_method("removeSky")

    # -------------------------------------------------------------------------
    # Feature Query/Filter
    # -------------------------------------------------------------------------

    def set_filter(
        self,
        layer_id: str,
        filter_expression: Optional[List] = None,
    ) -> None:
        """Set or clear a filter on a map layer.

        Uses MapLibre GL JS filter expressions to show/hide features.

        Args:
            layer_id: The layer to apply the filter to.
            filter_expression: A MapLibre filter expression (list).
                Pass None to clear the filter.

        Example:
            >>> m.set_filter("states-layer", [">=", ["get", "density"], 100])
            >>> m.set_filter("states-layer", None)  # Clear filter
        """
        self.call_js_method(
            "setFilter",
            layerId=layer_id,
            filter=filter_expression,
        )

    def query_rendered_features(
        self,
        geometry: Optional[Any] = None,
        layers: Optional[List[str]] = None,
        filter_expression: Optional[List] = None,
    ) -> Dict:
        """Query features currently rendered on the map.

        Results are stored in the `queried_features` property.

        Args:
            geometry: Optional point {x, y} or bounding box [[x1, y1], [x2, y2]]
                to limit the query area. If None, queries the entire viewport.
            layers: Optional list of layer IDs to query. If None, queries all
                layers.
            filter_expression: Optional MapLibre filter expression to further
                filter results.

        Returns:
            The current queried features dict (may not yet reflect this query
            if called immediately; use the `queried_features` property).

        Example:
            >>> m.query_rendered_features(layers=["states-layer"])
            >>> features = m.queried_features
        """
        kwargs: Dict[str, Any] = {}
        if geometry is not None:
            kwargs["geometry"] = geometry
        if layers is not None:
            kwargs["layers"] = layers
        if filter_expression is not None:
            kwargs["filter"] = filter_expression

        self.call_js_method("queryRenderedFeatures", **kwargs)
        return self._queried_features

    def query_source_features(
        self,
        source_id: str,
        source_layer: Optional[str] = None,
        filter_expression: Optional[List] = None,
    ) -> Dict:
        """Query features from a source, including features not currently visible.

        Results are stored in the `queried_features` property.

        Args:
            source_id: The source to query.
            source_layer: Optional source layer for vector tile sources.
            filter_expression: Optional MapLibre filter expression.

        Returns:
            The current queried features dict.

        Example:
            >>> m.query_source_features("states-source")
            >>> features = m.queried_features
        """
        kwargs: Dict[str, Any] = {"sourceId": source_id}
        if source_layer is not None:
            kwargs["sourceLayer"] = source_layer
        if filter_expression is not None:
            kwargs["filter"] = filter_expression

        self.call_js_method("querySourceFeatures", **kwargs)
        return self._queried_features

    @property
    def queried_features(self) -> Dict:
        """Get the most recent query results.

        Returns:
            A GeoJSON FeatureCollection dict with queried features.
        """
        return self._queried_features

    # -------------------------------------------------------------------------
    # Video Layer
    # -------------------------------------------------------------------------

    def add_video_layer(
        self,
        urls: List[str],
        coordinates: List[List[float]],
        name: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a georeferenced video overlay on the map.

        Args:
            urls: List of video URLs (provide multiple formats for browser
                compatibility, e.g., [".mp4", ".webm"]).
            coordinates: Four corner coordinates as [[lng, lat], ...] in order:
                top-left, top-right, bottom-right, bottom-left.
            name: Layer identifier. If None, auto-generated.
            opacity: Layer opacity (0-1). Default is 1.0.
            **kwargs: Additional layer options.

        Example:
            >>> m.add_video_layer(
            ...     urls=["https://example.com/video.mp4"],
            ...     coordinates=[
            ...         [-122.51596391658498, 37.56238816766053],
            ...         [-122.51467645489949, 37.56410183312965],
            ...         [-122.51309394645498, 37.563391708549425],
            ...         [-122.51423120498498, 37.56161849366671],
            ...     ],
            ... )
        """
        self._validate_opacity(opacity)
        layer_id = name or f"video-{len(self._layers)}"

        if len(coordinates) != 4:
            raise ValueError(
                "coordinates must have exactly 4 corner points "
                "[top-left, top-right, bottom-right, bottom-left]"
            )

        self.call_js_method(
            "addVideoLayer",
            id=layer_id,
            urls=urls,
            coordinates=coordinates,
            opacity=opacity,
            **kwargs,
        )

        self._layers = {
            **self._layers,
            layer_id: {
                "id": layer_id,
                "type": "video",
                "source": f"{layer_id}-source",
            },
        }
        self._add_to_layer_dict(layer_id, "Raster")

    def remove_video_layer(self, name: str) -> None:
        """Remove a video layer from the map.

        Args:
            name: The layer identifier to remove.
        """
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self._remove_from_layer_dict(name)
        self.call_js_method("removeVideoLayer", id=name)

    def play_video(self, name: str) -> None:
        """Start playing a video layer.

        Args:
            name: The video layer identifier.
        """
        self.call_js_method("playVideo", id=name)

    def pause_video(self, name: str) -> None:
        """Pause a video layer.

        Args:
            name: The video layer identifier.
        """
        self.call_js_method("pauseVideo", id=name)

    def seek_video(self, name: str, time: float) -> None:
        """Seek to a specific time in a video layer.

        Args:
            name: The video layer identifier.
            time: Time in seconds to seek to.
        """
        self.call_js_method("seekVideo", id=name, time=time)

    # -------------------------------------------------------------------------
    # Split Map (Swipe/Compare)
    # -------------------------------------------------------------------------

    def add_split_map(
        self,
        left_layer: str,
        right_layer: str,
        position: int = 50,
    ) -> None:
        """Add a split map comparison view with a draggable divider.

        Creates a side-by-side comparison of two layers. The left side shows
        the left layer and the right side shows the right layer, with a
        draggable slider to adjust the split position.

        Args:
            left_layer: Layer ID for the left side.
            right_layer: Layer ID for the right side.
            position: Initial slider position as percentage (0-100).
                Default is 50 (middle).

        Note:
            Both layers must exist on the map before calling this method.
            Best suited for raster tile layers (e.g., satellite vs streets).

        Example:
            >>> m.add_tile_layer(
            ...     "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            ...     name="satellite",
            ... )
            >>> m.add_tile_layer(
            ...     "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ...     name="osm",
            ... )
            >>> m.add_split_map("satellite", "osm")
        """
        if not 0 <= position <= 100:
            raise ValueError(f"position must be between 0 and 100, got {position}")

        self.call_js_method(
            "addSplitMap",
            leftLayer=left_layer,
            rightLayer=right_layer,
            position=position,
        )

    def remove_split_map(self) -> None:
        """Remove the split map comparison view.

        Restores the map to normal single-view mode with all layers visible.
        """
        self.call_js_method("removeSplitMap")

    # -------------------------------------------------------------------------
    # Globe Projection (Section 3)
    # -------------------------------------------------------------------------

    def set_projection(self, projection: str = "mercator") -> None:
        """Set the map projection.

        MapLibre GL JS v4+ supports globe projection for a 3D globe view.

        Args:
            projection: Projection type. Supported values: 'mercator', 'globe'.

        Example:
            >>> m = MapLibreMap()
            >>> m.set_projection("globe")
        """
        self.call_js_method("setProjection", projection=projection)

    # -------------------------------------------------------------------------
    # Source Data Updates (Section 3)
    # -------------------------------------------------------------------------

    def update_geojson_source(self, source_id: str, data: Any) -> None:
        """Update the data of an existing GeoJSON source in place.

        This enables real-time/streaming data updates without removing
        and re-adding layers. Critical for live dashboards.

        Args:
            source_id: The ID of the GeoJSON source to update.
            data: New GeoJSON data (dict, GeoDataFrame, or URL string).

        Example:
            >>> m = MapLibreMap()
            >>> m.add_geojson("initial.geojson", name="points")
            >>> # Later, update with new data
            >>> m.update_geojson_source("points", new_geojson_data)
        """
        processed_data = self._process_deck_data(data)
        self.call_js_method(
            "updateGeoJSONSource",
            sourceId=source_id,
            data=processed_data,
        )

    # -------------------------------------------------------------------------
    # Custom Images & Sprites (Section 3)
    # -------------------------------------------------------------------------

    def add_image(self, name: str, url: str) -> None:
        """Load a custom icon image for use in symbol layers.

        Args:
            name: Name to reference this image in symbol layers.
            url: URL to the image file (PNG, JPEG, etc.).

        Example:
            >>> m = MapLibreMap()
            >>> m.add_image("custom-marker", "https://example.com/marker.png")
        """
        self.call_js_method("addMapImage", name=name, url=url)

    # -------------------------------------------------------------------------
    # Tooltip on Hover (Section 3 / Section 6)
    # -------------------------------------------------------------------------

    def add_tooltip(
        self,
        layer_id: str,
        template: Optional[str] = None,
        properties: Optional[List[str]] = None,
    ) -> None:
        """Add a tooltip that shows on feature hover.

        Shows formatted information when hovering over features in a layer.

        Args:
            layer_id: The ID of the layer to add tooltips to.
            template: HTML template with {property} placeholders.
                Example: "Name: {name}<br>Population: {pop}".
            properties: List of property names to display. If None and no
                template, all properties are shown.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_geojson("data.geojson", name="cities")
            >>> m.add_tooltip("cities", template="<b>{name}</b><br>Pop: {population}")
        """
        self.call_js_method(
            "addTooltip",
            layerId=layer_id,
            template=template or "",
            properties=properties,
        )

    def remove_tooltip(self, layer_id: str) -> None:
        """Remove tooltip from a layer.

        Args:
            layer_id: The layer identifier.
        """
        self.call_js_method("removeTooltip", layerId=layer_id)

    # -------------------------------------------------------------------------
    # Coordinates Display Control (Section 3)
    # -------------------------------------------------------------------------

    def add_coordinates_control(
        self,
        position: str = "bottom-left",
        precision: int = 4,
    ) -> None:
        """Add a coordinates display showing cursor lat/lng.

        Args:
            position: Control position ('top-left', 'top-right',
                'bottom-left', 'bottom-right').
            precision: Number of decimal places for coordinates.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_coordinates_control(position="bottom-left", precision=6)
        """
        self.call_js_method(
            "addCoordinatesControl",
            position=position,
            precision=precision,
        )

    def remove_coordinates_control(self) -> None:
        """Remove the coordinates display control."""
        self.call_js_method("removeCoordinatesControl")

    # -------------------------------------------------------------------------
    # Time Slider (Section 4)
    # -------------------------------------------------------------------------

    def add_time_slider(
        self,
        layer_id: str,
        property: str,
        min_value: float = 0,
        max_value: float = 100,
        step: float = 1,
        position: str = "bottom-left",
        label: str = "Time",
        auto_play: bool = False,
        interval: int = 500,
    ) -> None:
        """Add a time slider to filter data by a temporal property.

        Creates a slider control that filters layer features based on a
        numeric/temporal property, with optional auto-animation.

        Args:
            layer_id: Layer ID to filter.
            property: Property name to filter on.
            min_value: Minimum slider value.
            max_value: Maximum slider value.
            step: Step increment.
            position: Control position.
            label: Label text for the slider.
            auto_play: Whether to auto-animate through values.
            interval: Animation interval in milliseconds.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_geojson("events.geojson", name="events")
            >>> m.add_time_slider("events", "year", min_value=2000, max_value=2024)
        """
        self.call_js_method(
            "addTimeSlider",
            layerId=layer_id,
            property=property,
            min=min_value,
            max=max_value,
            step=step,
            position=position,
            label=label,
            autoPlay=auto_play,
            interval=interval,
        )

    def remove_time_slider(self) -> None:
        """Remove the time slider control."""
        self.call_js_method("removeTimeSlider")

    # -------------------------------------------------------------------------
    # Swipe Map Comparison (Section 6)
    # -------------------------------------------------------------------------

    def add_swipe_map(self, left_layer: str, right_layer: str) -> None:
        """Add a drag-to-compare swipe control for two layers.

        Unlike split map which is side-by-side, swipe map overlays both
        layers and uses a draggable divider for before/after comparison.

        Args:
            left_layer: Layer ID for the left side.
            right_layer: Layer ID for the right side.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_tile_layer("...", name="before")
            >>> m.add_tile_layer("...", name="after")
            >>> m.add_swipe_map("before", "after")
        """
        self.call_js_method(
            "addSwipeMap",
            leftLayer=left_layer,
            rightLayer=right_layer,
        )

    def remove_swipe_map(self) -> None:
        """Remove the swipe map comparison control."""
        self.call_js_method("removeSwipeMap")

    # -------------------------------------------------------------------------
    # Opacity Slider (Section 6)
    # -------------------------------------------------------------------------

    def add_opacity_slider(
        self,
        layer_id: str,
        position: str = "top-right",
        label: Optional[str] = None,
    ) -> None:
        """Add a UI slider to control layer opacity.

        Args:
            layer_id: Layer ID to control opacity for.
            position: Control position.
            label: Label text. Defaults to layer_id.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_tile_layer("...", name="satellite")
            >>> m.add_opacity_slider("satellite")
        """
        self.call_js_method(
            "addOpacitySlider",
            layerId=layer_id,
            position=position,
            label=label or layer_id,
        )

    def remove_opacity_slider(self, layer_id: str) -> None:
        """Remove the opacity slider for a layer.

        Args:
            layer_id: Layer identifier.
        """
        self.call_js_method("removeOpacitySlider", layerId=layer_id)

    # -------------------------------------------------------------------------
    # Style Switcher (Section 8)
    # -------------------------------------------------------------------------

    def add_style_switcher(
        self,
        styles: Dict[str, str],
        position: str = "top-right",
    ) -> None:
        """Add a dropdown to switch between map styles.

        Args:
            styles: Dict mapping style names to style URLs.
            position: Control position.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_style_switcher({
            ...     "Light": "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
            ...     "Dark": "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
            ...     "Voyager": "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
            ... })
        """
        self.call_js_method(
            "addStyleSwitcher",
            styles=styles,
            position=position,
        )

    def remove_style_switcher(self) -> None:
        """Remove the style switcher control."""
        self.call_js_method("removeStyleSwitcher")

    # -------------------------------------------------------------------------
    # Data Export (Section 7)
    # -------------------------------------------------------------------------

    def get_visible_features(
        self,
        layers: Optional[List[str]] = None,
    ) -> None:
        """Get all features currently visible in the viewport.

        Results are stored in the `_queried_features` trait and can be
        accessed after a short delay for the JavaScript round-trip.

        Args:
            layers: Optional list of layer IDs to query. If None, queries
                all visible layers.

        Example:
            >>> m = MapLibreMap()
            >>> m.get_visible_features(layers=["my-layer"])
            >>> # Access results via m._queried_features
        """
        self.call_js_method("getVisibleFeatures", layers=layers)

    def to_geojson(self, layer_id: Optional[str] = None) -> Optional[Dict]:
        """Get layer data as GeoJSON.

        If a source ID is provided, queries all features from that source.
        Returns the data from `_queried_features` if previously queried.

        Args:
            layer_id: Source/layer ID to export. If None, returns
                previously queried features.

        Returns:
            GeoJSON FeatureCollection dict, or None if not yet available.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_geojson("data.geojson", name="my-data")
            >>> m.to_geojson("my-data")
        """
        if layer_id:
            self.call_js_method("getLayerData", sourceId=layer_id)
        features = self._queried_features
        if features and "data" in features:
            return features["data"]
        return None

    def to_geopandas(self, layer_id: Optional[str] = None) -> Any:
        """Get layer data as a GeoDataFrame.

        Requires geopandas to be installed.

        Args:
            layer_id: Source/layer ID to export. If None, returns
                previously queried features.

        Returns:
            GeoDataFrame, or None if data not available.

        Example:
            >>> m = MapLibreMap()
            >>> m.add_geojson("data.geojson", name="my-data")
            >>> gdf = m.to_geopandas("my-data")
        """
        geojson = self.to_geojson(layer_id)
        if geojson is None:
            return None
        try:
            import geopandas as gpd

            return gpd.GeoDataFrame.from_features(geojson.get("features", []))
        except ImportError:
            raise ImportError("geopandas is required for to_geopandas()")

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the map."""
        template_path = Path(__file__).parent / "templates" / "maplibre.html"

        if not template_path.exists():
            raise FileNotFoundError(
                f"HTML template not found at {template_path}. "
                "Please ensure the templates directory is included in the package."
            )

        template = template_path.read_text(encoding="utf-8")

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
        }

        template = template.replace("{{state}}", json.dumps(state, indent=2))
        return template
