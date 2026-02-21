"""Mapbox GL JS map widget implementation."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.parse import urlencode

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url
from .utils import (
    to_geojson,
    get_bounds,
    infer_layer_type,
    get_default_paint,
    fetch_geojson,
)

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
        max_pitch: float = 85.0,
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
            max_pitch: Maximum pitch angle in degrees (default: 85).
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
            max_pitch=max_pitch,
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
    # Layer Dict Helpers
    # -------------------------------------------------------------------------

    def _add_to_layer_dict(self, layer_id: str, category: str = "Overlays") -> None:
        """Add a layer to the layer dictionary for UI tracking."""
        layers = self._layer_dict.get(category, [])
        if layer_id not in layers:
            self._layer_dict = {
                **self._layer_dict,
                category: layers + [layer_id],
            }

    def _remove_from_layer_dict(self, layer_id: str) -> None:
        """Remove a layer from the layer dictionary."""
        new_dict = {}
        for category, layers in self._layer_dict.items():
            if layer_id in layers:
                new_layers = [lid for lid in layers if lid != layer_id]
                if new_layers:
                    new_dict[category] = new_layers
            else:
                new_dict[category] = layers
        self._layer_dict = new_dict

    def _validate_opacity(self, opacity: float, param_name: str = "opacity") -> float:
        """Validate opacity value is between 0 and 1."""
        if not 0 <= opacity <= 1:
            raise ValueError(f"{param_name} must be between 0 and 1, got {opacity}")
        return opacity

    def _validate_position(self, position: str) -> str:
        """Validate control position is valid."""
        valid_positions = ["top-left", "top-right", "bottom-left", "bottom-right"]
        if position not in valid_positions:
            raise ValueError(
                f"Position must be one of: {', '.join(valid_positions)}, got '{position}'"
            )
        return position

    def _remove_layer_internal(self, layer_id: str, js_method: str) -> None:
        """Internal helper to remove a layer."""
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

        layer_id = name or f"vector-{len(self._layers)}"

        # Handle URL data - fetch GeoJSON to get bounds and infer layer type
        if geojson.get("type") == "url":
            url = geojson["url"]
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
        self._add_to_layer_dict(layer_id, "Raster")

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
        """Add a raster layer from a local file using localtileserver."""
        try:
            from localtileserver import TileClient
        except ImportError:
            raise ImportError(
                "localtileserver is required for local raster support. "
                "Install with: pip install anymap-ts[raster]"
            )

        client = TileClient(source)

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

        if fit_bounds:
            bounds = client.bounds()
            if bounds:
                self.fit_bounds([bounds[0], bounds[1], bounds[2], bounds[3]])

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
        """Add a STAC (SpatioTemporal Asset Catalog) layer to the map."""
        if url is None and item is None:
            raise ValueError("Either 'url' or 'item' must be provided")

        if url is not None and item is not None:
            raise ValueError("Provide either 'url' or 'item', not both")

        if item is not None:
            try:
                if hasattr(item, "to_dict") and hasattr(item, "self_href"):
                    stac_url = item.self_href
                    if not stac_url and hasattr(item, "links"):
                        for link in item.links:
                            if link.rel == "self":
                                stac_url = link.href
                                break
                    if not stac_url:
                        raise ValueError("STAC item must have a self_href or self link")
                else:
                    raise ValueError(
                        "Item must be a pystac Item object with to_dict() and self_href"
                    )
            except Exception as e:
                raise ValueError(f"Invalid STAC item: {e}")
        else:
            stac_url = url

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

        query_string = urlencode(tile_params)
        tile_url = f"{titiler_endpoint.rstrip('/')}/stac/tiles/{{z}}/{{x}}/{{y}}?{query_string}"

        layer_name = layer_id or f"stac-{len(self._layers)}"

        self.add_tile_layer(
            url=tile_url,
            name=layer_name,
            attribution=attribution,
            **kwargs,
        )

        if fit_bounds and item is not None:
            try:
                bbox = item.bbox
                if bbox and len(bbox) == 4:
                    self.fit_bounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]])
            except Exception:
                pass

    # -------------------------------------------------------------------------
    # COG Layer (deck.gl)
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
        """Add a heatmap layer to the map."""
        self._validate_opacity(opacity)
        layer_id = name or f"heatmap-{len(self._layers)}"

        geojson = to_geojson(data)

        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

        if colormap is None:
            colormap = [
                [0, "rgba(33,102,172,0)"],
                [0.2, "rgb(103,169,207)"],
                [0.4, "rgb(209,229,240)"],
                [0.6, "rgb(253,219,199)"],
                [0.8, "rgb(239,138,98)"],
                [1, "rgb(178,24,43)"],
            ]

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

        for stop, color in colormap:
            paint["heatmap-color"].extend([stop, color])

        if weight_property:
            paint["heatmap-weight"] = ["get", weight_property]

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
        """Add a Cloud Optimized GeoTIFF (COG) layer using deck.gl-raster.

        This method renders COG files directly in the browser using GPU-accelerated
        deck.gl rendering with automatic reprojection support.

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
            >>> from anymap_ts import MapboxMap
            >>> m = MapboxMap()
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
        """Remove a COG layer."""
        self._remove_layer_internal(layer_id, "removeCOGLayer")

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
        """Add a Zarr dataset layer for visualizing multidimensional array data."""
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
        """Remove a Zarr layer."""
        self._remove_layer_internal(layer_id, "removeZarrLayer")

    def update_zarr_layer(
        self,
        layer_id: str,
        selector: Optional[Dict[str, Any]] = None,
        clim: Optional[Tuple[float, float]] = None,
        colormap: Optional[List[str]] = None,
        opacity: Optional[float] = None,
    ) -> None:
        """Update a Zarr layer's properties dynamically."""
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
        """Add a PMTiles layer for efficient vector or raster tile serving."""
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
        """Remove a PMTiles layer."""
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
            >>> from anymap_ts import MapboxMap
            >>> m = MapboxMap()
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
        """Remove an arc layer."""
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
            >>> from anymap_ts import MapboxMap
            >>> m = MapboxMap(pitch=45)
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
        """Remove a point cloud layer."""
        self._remove_layer_internal(layer_id, "removePointCloudLayer")

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
        """Add a scatterplot layer using deck.gl."""
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
            layer_id: {"id": layer_id, "type": "scatterplot"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a path layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "path"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a polygon layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "polygon"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a hexagon layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "hexagon"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a GPU-accelerated heatmap layer using deck.gl."""
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
            layer_id: {"id": layer_id, "type": "deck-heatmap"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a grid layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "grid"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add an icon layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "icon"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a text layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "text"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a GeoJSON layer with auto-styling using deck.gl."""
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
            layer_id: {"id": layer_id, "type": "geojson-deck"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a contour layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "contour"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a screen grid layer using deck.gl."""
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
            layer_id: {"id": layer_id, "type": "screengrid"},
        }
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a trips layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "trips"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a line layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "line"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

    def add_deckgl_layer(
        self,
        layer_type: str,
        data: Any,
        name: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add a generic deck.gl layer to the map."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": layer_type}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

    def remove_deck_layer(self, layer_id: str) -> None:
        """Remove a deck.gl layer from the map."""
        self._remove_layer_internal(layer_id, "removeDeckLayer")

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
        """Add a column layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "column"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a bitmap layer using deck.gl."""
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

        self._layers = {**self._layers, layer_id: {"id": layer_id, "type": "bitmap"}}
        self._add_to_layer_dict(layer_id, "Deck.gl")

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
        """Add a solid polygon layer using deck.gl."""
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
        """Add a grid cell layer using deck.gl."""
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
            **kwargs: Additional control options.

        Example:
            >>> from anymap_ts import MapboxMap
            >>> m = MapboxMap(pitch=60)
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
            >>> from anymap_ts import MapboxMap
            >>> m = MapboxMap(center=[-123.07, 44.05], zoom=14, pitch=60)
            >>> m.add_lidar_layer(
            ...     source="https://s3.amazonaws.com/hobu-lidar/autzen-classified.copc.laz",
            ...     name="autzen",
            ...     color_scheme="classification",
            ... )
        """
        import base64

        layer_id = name or f"lidar-{len(self._layers)}"

        # Check if source is a local file
        source_path = Path(source) if isinstance(source, (str, Path)) else None
        is_local = source_path is not None and source_path.exists()

        if is_local:
            # Read local file and encode as base64
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

    def add_3d_terrain(
        self, exaggeration: float = 1.0, source: str = "mapbox-dem", **kwargs
    ) -> None:
        """Alias for add_terrain for MapLibre compatibility."""
        self.add_terrain(exaggeration=exaggeration, source=source)

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
        lt = layer_config.get("type", "")
        self._add_to_layer_dict(layer_id, "Raster" if lt == "raster" else "Vector")

    def remove_layer(self, layer_id: str) -> None:
        """Remove a layer from the map."""
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self._remove_from_layer_dict(layer_id)
        self.call_js_method("removeLayer", layer_id)

    def set_visibility(self, layer_id: str, visible: bool) -> None:
        """Set layer visibility.

        Args:
            layer_id: Layer identifier.
            visible: Whether layer should be visible.
        """
        self.call_js_method("setVisibility", layer_id, visible)

    def set_opacity(self, layer_id: str, opacity: float) -> None:
        """Set layer opacity."""
        self._validate_opacity(opacity)
        self.call_js_method("setOpacity", layer_id, opacity)

    def set_paint_property(self, layer_id: str, property_name: str, value: Any) -> None:
        """Set a paint property for a layer."""
        self.call_js_method("setPaintProperty", layer_id, property_name, value)

    def set_layout_property(
        self, layer_id: str, property_name: str, value: Any
    ) -> None:
        """Set a layout property for a layer."""
        self.call_js_method("setLayoutProperty", layer_id, property_name, value)

    def move_layer(self, layer_id: str, before_id: Optional[str] = None) -> None:
        """Move a layer in the layer stack."""
        self.call_js_method("moveLayer", layer_id, before_id)

    def get_layer(self, layer_id: str) -> Optional[Dict]:
        """Get layer configuration by ID."""
        return self._layers.get(layer_id)

    def get_layer_ids(self) -> List[str]:
        """Get list of all layer IDs."""
        return list(self._layers.keys())

    def add_popup(
        self,
        layer_id: str,
        properties: Optional[List[str]] = None,
        template: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Add popup on click for a layer."""
        self.call_js_method(
            "addPopup",
            layerId=layer_id,
            properties=properties,
            template=template,
            **kwargs,
        )

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
        """Remove a map control."""
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
        """Add a layer visibility control."""
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
        """Add a continuous gradient colorbar to the map."""
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
        """Remove a colorbar from the map."""
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
        """Update an existing colorbar's properties."""
        if colorbar_id is None:
            cbar_keys = [k for k in self._controls.keys() if k.startswith("colorbar")]
            if not cbar_keys:
                raise ValueError("No colorbar found to update")
            colorbar_id = cbar_keys[0]

        if colorbar_id not in self._controls:
            raise ValueError(f"Colorbar '{colorbar_id}' not found")

        js_kwargs: Dict[str, Any] = {"colorbarId": colorbar_id}
        key_map = {"bar_thickness": "barThickness", "bar_length": "barLength"}
        for key, value in kwargs.items():
            js_key = key_map.get(key, key)
            js_kwargs[js_key] = value

        self.call_js_method("updateColorbar", **js_kwargs)

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
        """Add a search/geocoder control."""
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
        """Remove the search/geocoder control."""
        self.call_js_method("removeSearchControl")
        if "search-control" in self._controls:
            controls = dict(self._controls)
            del controls["search-control"]
            self._controls = controls

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
        """Add a measurement control."""
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
        """Remove the measurement control."""
        self.call_js_method("removeMeasureControl")
        if "measure-control" in self._controls:
            controls = dict(self._controls)
            del controls["measure-control"]
            self._controls = controls

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
        """Add a print/export control."""
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
        """Remove the print/export control."""
        self.call_js_method("removePrintControl")
        if "print-control" in self._controls:
            controls = dict(self._controls)
            del controls["print-control"]
            self._controls = controls

    def add_coordinates_control(
        self,
        position: str = "bottom-left",
        precision: int = 4,
    ) -> None:
        """Add a coordinates display control."""
        self.call_js_method(
            "addCoordinatesControl",
            position=position,
            precision=precision,
        )

    def remove_coordinates_control(self) -> None:
        """Remove the coordinates display control."""
        self.call_js_method("removeCoordinatesControl")

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
        """Add a time slider to filter data by a temporal property."""
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

    def add_opacity_slider(
        self,
        layer_id: str,
        position: str = "top-right",
        label: Optional[str] = None,
    ) -> None:
        """Add a UI slider to control layer opacity."""
        self.call_js_method(
            "addOpacitySlider",
            layerId=layer_id,
            position=position,
            label=label or layer_id,
        )

    def remove_opacity_slider(self, layer_id: str) -> None:
        """Remove the opacity slider for a layer."""
        self.call_js_method("removeOpacitySlider", layerId=layer_id)

    def add_style_switcher(
        self,
        styles: Dict[str, str],
        position: str = "top-right",
    ) -> None:
        """Add a dropdown to switch between map styles."""
        self.call_js_method(
            "addStyleSwitcher",
            styles=styles,
            position=position,
        )

    def remove_style_switcher(self) -> None:
        """Remove the style switcher control."""
        self.call_js_method("removeStyleSwitcher")

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
        """Add a PMTiles layer control."""
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
        """Add a COG layer control."""
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
        """Add a Zarr layer control."""
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
        """Add a vector layer control."""
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
        """Add a ControlGrid with all default tools or a custom subset."""
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
        self._controls = {
            **self._controls,
            "control-grid": {
                "position": position,
                "collapsed": collapsed,
                "collapsible": collapsible,
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
        """Add a floating legend control to the map."""
        if len(labels) != len(colors):
            raise ValueError("Number of labels must match number of colors")

        self._validate_position(position)

        for i, color in enumerate(colors):
            if not isinstance(color, str) or not color.startswith("#"):
                raise ValueError(
                    f"Color at index {i} must be a hex color string (e.g., '#ff0000')"
                )

        legend_id = (
            legend_id
            or f"legend-{len([k for k in self._controls.keys() if k.startswith('legend')])}"
        )

        legend_items = [
            {"label": label, "color": color} for label, color in zip(labels, colors)
        ]

        self.call_js_method(
            "addLegend",
            id=legend_id,
            title=title,
            items=legend_items,
            position=position,
            opacity=opacity,
            **kwargs,
        )

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
        """Remove a legend control from the map."""
        if legend_id is None:
            legend_keys = [k for k in self._controls.keys() if k.startswith("legend")]
            for key in legend_keys:
                self.call_js_method("removeLegend", key)
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
        """Update an existing legend's properties."""
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

    def add_tooltip(
        self,
        layer_id: str,
        template: Optional[str] = None,
        properties: Optional[List[str]] = None,
    ) -> None:
        """Add a tooltip that shows on feature hover."""
        self.call_js_method(
            "addTooltip",
            layerId=layer_id,
            template=template or "",
            properties=properties,
        )

    def remove_tooltip(self, layer_id: str) -> None:
        """Remove tooltip from a layer."""
        self.call_js_method("removeTooltip", layerId=layer_id)

    def add_flatgeobuf(
        self,
        url: str,
        name: Optional[str] = None,
        layer_type: Optional[str] = None,
        paint: Optional[Dict] = None,
        fit_bounds: bool = True,
        **kwargs,
    ) -> None:
        """Add a FlatGeobuf layer from a URL."""
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
        """Remove a FlatGeobuf layer from the map."""
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self._remove_from_layer_dict(name)
        self.call_js_method("removeFlatGeobuf", name=name)

    def add_draw_control(
        self,
        position: str = "top-right",
        draw_modes: Optional[List[str]] = None,
        edit_modes: Optional[List[str]] = None,
        collapsed: bool = False,
        **kwargs,
    ) -> None:
        """Add a drawing control."""
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
        """Get the current drawn features as GeoJSON."""
        self.call_js_method("getDrawData")
        import time

        time.sleep(0.1)
        return self._draw_data or {"type": "FeatureCollection", "features": []}

    @property
    def draw_data(self) -> Dict:
        """Property to access current draw data."""
        return self._draw_data or {"type": "FeatureCollection", "features": []}

    def load_draw_data(self, geojson: Dict) -> None:
        """Load GeoJSON features into the drawing layer."""
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
        """Save drawn features to a file."""
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
        """Add a clustered point layer."""
        layer_id = name or f"cluster-{len(self._layers)}"

        if cluster_colors is None:
            cluster_colors = ["#51bbd6", "#f1f075", "#f28cb1"]
        if cluster_steps is None:
            cluster_steps = [100, 750]

        if len(cluster_steps) != len(cluster_colors) - 1:
            raise ValueError(
                f"cluster_steps must have {len(cluster_colors) - 1} values "
                f"(one less than cluster_colors), got {len(cluster_steps)}"
            )

        geojson = to_geojson(data)

        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

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
        """Remove a cluster layer."""
        self._remove_layer_internal(layer_id, "removeClusterLayer")

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
        """Add a choropleth (thematic) map layer."""
        from .utils import (
            get_choropleth_colors,
            compute_breaks,
            build_step_expression,
        )

        layer_name = layer_id or f"choropleth-{len(self._layers)}"

        geojson = to_geojson(data)

        if geojson.get("type") == "url":
            url = geojson["url"]
            geojson = fetch_geojson(url)

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

        computed_breaks = compute_breaks(values, classification, k, breaks)

        colors = get_choropleth_colors(cmap, k)

        step_expr = build_step_expression(column, computed_breaks, colors)

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

        if legend:
            title = legend_title or column
            labels = []
            for i in range(len(computed_breaks) - 1):
                low = computed_breaks[i]
                high = computed_breaks[i + 1]
                labels.append(f"{low:.1f} - {high:.1f}")

            self.add_legend(
                title=title,
                labels=labels,
                colors=colors,
                position="bottom-right",
            )

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
        """Add 3D building extrusions from vector tiles."""
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
        """Animate a marker along a route."""
        anim_id = animation_id or f"animation-{len(self._layers)}"

        if isinstance(route, list) and len(route) > 0:
            if isinstance(route[0], (list, tuple)):
                coordinates = route
            else:
                raise ValueError("Route list must contain coordinate pairs")
        elif isinstance(route, dict):
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
            geojson = to_geojson(route)
            if geojson.get("type") == "url":
                geojson = fetch_geojson(geojson["url"])
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
        """Stop a running animation."""
        self.call_js_method("stopAnimation", animation_id)
        if animation_id in self._layers:
            layers = dict(self._layers)
            del layers[animation_id]
            self._layers = layers

    def pause_animation(self, animation_id: str) -> None:
        """Pause a running animation."""
        self.call_js_method("pauseAnimation", animation_id)

    def resume_animation(self, animation_id: str) -> None:
        """Resume a paused animation."""
        self.call_js_method("resumeAnimation", animation_id)

    def set_animation_speed(self, animation_id: str, speed: float) -> None:
        """Set animation speed multiplier."""
        self.call_js_method("setAnimationSpeed", animation_id, speed)

    def add_hover_effect(
        self,
        layer_id: str,
        highlight_color: Optional[str] = None,
        highlight_opacity: Optional[float] = None,
        highlight_outline_width: float = 2,
        **kwargs,
    ) -> None:
        """Add hover highlight effect to an existing layer."""
        self.call_js_method(
            "addHoverEffect",
            layerId=layer_id,
            highlightColor=highlight_color,
            highlightOpacity=highlight_opacity,
            highlightOutlineWidth=highlight_outline_width,
            **kwargs,
        )

    def set_fog(
        self,
        color: Optional[str] = None,
        high_color: Optional[str] = None,
        low_color: Optional[str] = None,
        horizon_blend: Optional[float] = None,
        range: Optional[List[float]] = None,
        **kwargs,
    ) -> None:
        """Set fog atmospheric effect (Mapbox uses map.setFog() API)."""
        self.call_js_method(
            "setFog",
            color=color,
            highColor=high_color,
            lowColor=low_color,
            horizonBlend=horizon_blend,
            range=range,
            **kwargs,
        )

    def remove_fog(self) -> None:
        """Remove fog atmospheric effects from the map."""
        self.call_js_method("removeFog")

    def add_image_layer(
        self,
        url: str,
        coordinates: List[List[float]],
        name: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a georeferenced image overlay."""
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

    def add_video_layer(
        self,
        urls: List[str],
        coordinates: List[List[float]],
        name: Optional[str] = None,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a georeferenced video overlay on the map."""
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
        """Remove a video layer from the map."""
        if name in self._layers:
            layers = dict(self._layers)
            del layers[name]
            self._layers = layers
        self._remove_from_layer_dict(name)
        self.call_js_method("removeVideoLayer", id=name)

    def play_video(self, name: str) -> None:
        """Start playing a video layer."""
        self.call_js_method("playVideo", id=name)

    def pause_video(self, name: str) -> None:
        """Pause a video layer."""
        self.call_js_method("pauseVideo", id=name)

    def seek_video(self, name: str, time: float) -> None:
        """Seek to a specific time in a video layer."""
        self.call_js_method("seekVideo", id=name, time=time)

    def add_split_map(
        self,
        left_layer: str,
        right_layer: str,
        position: int = 50,
    ) -> None:
        """Add a split map comparison view with a draggable divider."""
        if not 0 <= position <= 100:
            raise ValueError(f"position must be between 0 and 100, got {position}")

        self.call_js_method(
            "addSplitMap",
            leftLayer=left_layer,
            rightLayer=right_layer,
            position=position,
        )

    def remove_split_map(self) -> None:
        """Remove the split map comparison view."""
        self.call_js_method("removeSplitMap")

    def set_projection(self, projection: str = "mercator") -> None:
        """Set the map projection (Mapbox supports 'globe' and 'mercator')."""
        self.call_js_method("setProjection", projection=projection)

    def update_geojson_source(self, source_id: str, data: Any) -> None:
        """Update the data of an existing GeoJSON source in place."""
        processed_data = self._process_deck_data(data)
        self.call_js_method(
            "updateGeoJSONSource",
            sourceId=source_id,
            data=processed_data,
        )

    def add_image(self, name: str, url: str) -> None:
        """Load a custom icon image for use in symbol layers."""
        self.call_js_method("addMapImage", name=name, url=url)

    def add_swipe_map(self, left_layer: str, right_layer: str) -> None:
        """Add a drag-to-compare swipe control for two layers."""
        self.call_js_method(
            "addSwipeMap",
            leftLayer=left_layer,
            rightLayer=right_layer,
        )

    def remove_swipe_map(self) -> None:
        """Remove the swipe map comparison control."""
        self.call_js_method("removeSwipeMap")

    def set_filter(
        self,
        layer_id: str,
        filter_expression: Optional[List] = None,
    ) -> None:
        """Set or clear a filter on a map layer."""
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
        """Query features currently rendered on the map."""
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
        """Query features from a source."""
        kwargs: Dict[str, Any] = {"sourceId": source_id}
        if source_layer is not None:
            kwargs["sourceLayer"] = source_layer
        if filter_expression is not None:
            kwargs["filter"] = filter_expression

        self.call_js_method("querySourceFeatures", **kwargs)
        return self._queried_features

    @property
    def queried_features(self) -> Dict:
        """Get the most recent query results."""
        return self._queried_features

    def get_visible_features(
        self,
        layers: Optional[List[str]] = None,
    ) -> Optional[Dict]:
        """Get all features currently visible in the viewport."""
        if layers is not None:
            self.call_js_method("getVisibleFeatures", layers=layers)
        features = self._queried_features
        if features and "data" in features:
            return features["data"]
        return None

    def to_geojson(self, layer_id: Optional[str] = None) -> Optional[Dict]:
        """Get layer data as GeoJSON."""
        if layer_id:
            self.call_js_method("getLayerData", sourceId=layer_id)
        features = self._queried_features
        if features and "data" in features:
            return features["data"]
        return None

    def to_geopandas(self, layer_id: Optional[str] = None) -> Any:
        """Get layer data as a GeoDataFrame."""
        geojson = self.to_geojson(layer_id)
        if geojson is None:
            return None
        try:
            import geopandas as gpd

            return gpd.GeoDataFrame.from_features(geojson.get("features", []))
        except ImportError:
            raise ImportError("geopandas is required for to_geopandas()")

    # -------------------------------------------------------------------------
    # Markers
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
        """Add a single marker to the map."""
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
        """Add multiple markers from data."""
        layer_id = name or f"markers-{len(self._layers)}"
        markers = []

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
        elif isinstance(data, list):
            lng_keys = ["lng", "lon", "longitude", "x"]
            lat_keys = ["lat", "latitude", "y"]

            for item in data:
                if not isinstance(item, dict):
                    continue

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
        """Remove a marker from the map."""
        self._remove_layer_internal(marker_id, "removeMarker")

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
