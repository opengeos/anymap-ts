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

    def remove_cog_layer(self, layer_id: str) -> None:
        """Remove a COG layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removeCOGLayer", layer_id)

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

    def remove_arc_layer(self, layer_id: str) -> None:
        """Remove an arc layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removeArcLayer", layer_id)

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

    def remove_point_cloud_layer(self, layer_id: str) -> None:
        """Remove a point cloud layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removePointCloudLayer", layer_id)

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
