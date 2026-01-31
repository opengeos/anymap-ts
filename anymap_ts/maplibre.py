"""MapLibre GL JS map widget implementation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
from urllib.parse import urlencode

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
        max_pitch: float = 85.0,
        controls: Optional[Dict[str, Any]] = None,
        **kwargs,
    ):
        """Initialize a MapLibre map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string.
            style: MapLibre style URL or style object.
            bearing: Map bearing in degrees.
            pitch: Map pitch in degrees.
            max_pitch: Maximum pitch angle in degrees (default: 85).
            controls: Dict of controls to add. If None, defaults to
                {"navigation": True, "fullscreen": True, "globe": True, "layer-control": True}.
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

    def remove_pmtiles_layer(self, layer_id: str) -> None:
        """Remove a PMTiles layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._layers:
            layers = dict(self._layers)
            del layers[layer_id]
            self._layers = layers
        self.call_js_method("removePMTilesLayer", layer_id)

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
        valid_positions = ["top-left", "top-right", "bottom-left", "bottom-right"]
        if position not in valid_positions:
            raise ValueError(f"Position must be one of: {', '.join(valid_positions)}")

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
            # Remove all legends
            legend_keys = [k for k in self._controls.keys() if k.startswith("legend")]
            for key in legend_keys:
                self.call_js_method("removeLegend", key)
                del self._controls[key]
        else:
            if legend_id in self._controls:
                del self._controls[legend_id]
            self.call_js_method("removeLegend", legend_id)

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
