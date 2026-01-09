"""MapLibre GL JS map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget
from .basemaps import get_basemap_url, get_maplibre_style
from .utils import to_geojson, get_bounds, infer_layer_type, get_default_paint

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
        height: str = "600px",
        style: Union[str, Dict] = "https://demotiles.maplibre.org/style.json",
        bearing: float = 0.0,
        pitch: float = 0.0,
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize a MapLibre map.

        Args:
            center: Map center as (longitude, latitude)
            zoom: Initial zoom level
            width: Map width as CSS string
            height: Map height as CSS string
            style: MapLibre style URL or style object
            bearing: Map bearing in degrees
            pitch: Map pitch in degrees
            controls: Dict of controls to add. If None, defaults to
                {"navigation": True, "fullscreen": True, "globe": True, "layer-control": True}.
                Use {"layer-control": {"collapsed": True}} for custom options.
            **kwargs: Additional widget arguments
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
            **kwargs,
        )

        # Initialize layer dictionary
        self._layer_dict = {"Background": []}

        # Add default controls
        if controls is None:
            controls = {
                "navigation": True,
                "fullscreen": True,
                "globe": True,
                "layer-control": True,
            }

        for control_name, config in controls.items():
            if config:
                if control_name == "layer-control":
                    # Layer control uses a separate method
                    self.add_layer_control(
                        **(config if isinstance(config, dict) else {})
                    )
                else:
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

        # Build tile URL with parameters
        tile_url = client.get_tile_url()
        if indexes:
            tile_url = client.get_tile_url(indexes=indexes)
        if colormap:
            tile_url = client.get_tile_url(colormap=colormap)
        if vmin is not None or vmax is not None:
            tile_url = client.get_tile_url(
                vmin=vmin or client.min, vmax=vmax or client.max
            )
        if nodata is not None:
            tile_url = client.get_tile_url(nodata=nodata)

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

    def remove_zarr_layer(self, layer_id: str) -> None:
        """Remove a Zarr layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removeZarrLayer", layer_id)

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

    def remove_layer(self, layer_id: str) -> None:
        """Remove a layer from the map.

        Args:
            layer_id: Layer identifier to remove
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
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
            "layer-control": {"layers": layers, "position": position},
        }

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
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the map."""
        template_path = Path(__file__).parent / "templates" / "maplibre.html"

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
    <script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
    <link href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" rel="stylesheet" />
    <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const state = {{state}};

        const map = new maplibregl.Map({
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
                            control = new maplibregl.NavigationControl();
                            break;
                        case 'scale':
                            control = new maplibregl.ScaleControl();
                            break;
                        case 'fullscreen':
                            control = new maplibregl.FullscreenControl();
                            break;
                    }
                    if (control) {
                        map.addControl(control, position);
                    }
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

                default:
                    console.log('Unknown method:', method);
            }
        }
    </script>
</body>
</html>"""
