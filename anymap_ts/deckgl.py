"""DeckGL map widget implementation extending MapLibre with deck.gl layers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import traitlets

from .maplibre import MapLibreMap

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


class DeckGLMap(MapLibreMap):
    """Interactive map widget using MapLibre GL JS with deck.gl overlay.

    This class extends MapLibreMap with deck.gl visualization layer support
    for GPU-accelerated geospatial visualizations.

    Example:
        >>> from anymap_ts import DeckGLMap
        >>> m = DeckGLMap(center=[-122.4, 37.8], zoom=10)
        >>> m.add_scatterplot_layer(
        ...     data=points,
        ...     get_position='coordinates',
        ...     get_radius=100,
        ...     get_fill_color=[255, 0, 0]
        ... )
        >>> m
    """

    # ESM module for frontend (uses DeckGL-enabled version)
    _esm = STATIC_DIR / "deckgl.js"

    # DeckGL layer tracking
    _deck_layers = traitlets.Dict({}).tag(sync=True)

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
        """Initialize a DeckGL map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Map width as CSS string.
            height: Map height as CSS string.
            style: MapLibre style URL or style object.
            bearing: Map bearing in degrees.
            pitch: Map pitch in degrees.
            controls: Dict of controls to add (e.g., {"navigation": True}).
            **kwargs: Additional widget arguments.
        """
        super().__init__(
            center=center,
            zoom=zoom,
            width=width,
            height=height,
            style=style,
            bearing=bearing,
            pitch=pitch,
            controls=controls,
            **kwargs,
        )
        self._deck_layers = {}

    # -------------------------------------------------------------------------
    # DeckGL Scatterplot Layer
    # -------------------------------------------------------------------------

    def add_scatterplot_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_radius: Union[float, str, Callable] = 5,
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
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
        """Add a scatterplot layer for point visualization.

        Args:
            data: Array of data objects or GeoJSON.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            get_radius: Accessor for point radius.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            radius_scale: Global radius multiplier.
            radius_min_pixels: Minimum radius in pixels.
            radius_max_pixels: Maximum radius in pixels.
            line_width_min_pixels: Minimum stroke width.
            stroked: Whether to draw stroke.
            filled: Whether to fill points.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"scatterplot-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ScatterplotLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Arc Layer
    # -------------------------------------------------------------------------

    def add_arc_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_source_position: Union[str, Callable] = "source",
        get_target_position: Union[str, Callable] = "target",
        get_source_color: Union[List[int], str, Callable] = None,
        get_target_color: Union[List[int], str, Callable] = None,
        get_width: Union[float, str, Callable] = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add an arc layer for origin-destination visualization.

        Args:
            data: Array of data objects with source/target coordinates.
            name: Layer ID.
            get_source_position: Accessor for source position [lng, lat].
            get_target_position: Accessor for target position [lng, lat].
            get_source_color: Accessor for source color [r, g, b, a].
            get_target_color: Accessor for target color [r, g, b, a].
            get_width: Accessor for arc width.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"arc-{len(self._deck_layers)}"
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
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ArcLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Path Layer
    # -------------------------------------------------------------------------

    def add_path_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_path: Union[str, Callable] = "path",
        get_color: Union[List[int], str, Callable] = None,
        get_width: Union[float, str, Callable] = 1,
        width_scale: float = 1,
        width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a path layer for polyline visualization.

        Args:
            data: Array of data objects with path coordinates.
            name: Layer ID.
            get_path: Accessor for path coordinates [[lng, lat], ...].
            get_color: Accessor for path color [r, g, b, a].
            get_width: Accessor for path width.
            width_scale: Global width multiplier.
            width_min_pixels: Minimum width in pixels.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"path-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "PathLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Polygon Layer
    # -------------------------------------------------------------------------

    def add_polygon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_polygon: Union[str, Callable] = "polygon",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_elevation: Union[float, str, Callable] = 0,
        extruded: bool = False,
        wireframe: bool = False,
        filled: bool = True,
        stroked: bool = True,
        line_width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.5,
        **kwargs,
    ) -> None:
        """Add a polygon layer for filled polygon visualization.

        Args:
            data: Array of data objects with polygon coordinates.
            name: Layer ID.
            get_polygon: Accessor for polygon coordinates.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for stroke width.
            get_elevation: Accessor for 3D extrusion height.
            extruded: Whether to render as 3D polygons.
            wireframe: Whether to render wireframe (extruded only).
            filled: Whether to fill polygons.
            stroked: Whether to draw stroke.
            line_width_min_pixels: Minimum stroke width.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"polygon-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "PolygonLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Hexagon Layer
    # -------------------------------------------------------------------------

    def add_hexagon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        radius: float = 1000,
        elevation_scale: float = 4,
        extruded: bool = True,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a hexagon layer for hexbin aggregation visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            radius: Hexagon radius in meters.
            elevation_scale: Elevation multiplier for 3D.
            extruded: Whether to render as 3D hexagons.
            color_range: Color gradient for aggregation [[r, g, b], ...].
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"hexagon-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "HexagonLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Heatmap Layer
    # -------------------------------------------------------------------------

    def add_heatmap_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_weight: Union[float, str, Callable] = 1,
        radius_pixels: float = 30,
        intensity: float = 1,
        threshold: float = 0.05,
        color_range: Optional[List[List[int]]] = None,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a heatmap layer for density visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight.
            radius_pixels: Influence radius in pixels.
            intensity: Intensity multiplier.
            threshold: Minimum density threshold.
            color_range: Color gradient [[r, g, b, a], ...].
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"heatmap-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "HeatmapLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Grid Layer
    # -------------------------------------------------------------------------

    def add_grid_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        cell_size: float = 200,
        elevation_scale: float = 4,
        extruded: bool = True,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a grid layer for square grid aggregation visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            cell_size: Grid cell size in meters.
            elevation_scale: Elevation multiplier for 3D.
            extruded: Whether to render as 3D cells.
            color_range: Color gradient [[r, g, b], ...].
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"grid-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "GridLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Icon Layer
    # -------------------------------------------------------------------------

    def add_icon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_icon: Union[str, Callable] = "icon",
        get_size: Union[float, str, Callable] = 20,
        get_color: Union[List[int], str, Callable] = None,
        icon_atlas: Optional[str] = None,
        icon_mapping: Optional[Dict] = None,
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add an icon layer for custom marker visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for icon position [lng, lat].
            get_icon: Accessor for icon name in icon_mapping.
            get_size: Accessor for icon size.
            get_color: Accessor for icon tint color [r, g, b, a].
            icon_atlas: URL to icon atlas image.
            icon_mapping: Dict mapping icon names to atlas coordinates.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"icon-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "IconLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Text Layer
    # -------------------------------------------------------------------------

    def add_text_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_text: Union[str, Callable] = "text",
        get_size: Union[float, str, Callable] = 12,
        get_color: Union[List[int], str, Callable] = None,
        get_angle: Union[float, str, Callable] = 0,
        text_anchor: str = "middle",
        alignment_baseline: str = "center",
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a text layer for label visualization.

        Args:
            data: Array of data objects with position and text.
            name: Layer ID.
            get_position: Accessor for text position [lng, lat].
            get_text: Accessor for text content.
            get_size: Accessor for text size.
            get_color: Accessor for text color [r, g, b, a].
            get_angle: Accessor for text rotation in degrees.
            text_anchor: Horizontal alignment ('start', 'middle', 'end').
            alignment_baseline: Vertical alignment ('top', 'center', 'bottom').
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"text-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "TextLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL GeoJSON Layer
    # -------------------------------------------------------------------------

    def add_geojson_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_point_radius: Union[float, str, Callable] = 5,
        get_elevation: Union[float, str, Callable] = 0,
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
        """Add a GeoJSON layer for rendering GeoJSON features.

        Args:
            data: GeoJSON object or URL.
            name: Layer ID.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for stroke width.
            get_point_radius: Accessor for point radius.
            get_elevation: Accessor for 3D extrusion height.
            extruded: Whether to render as 3D features.
            wireframe: Whether to render wireframe (extruded only).
            filled: Whether to fill features.
            stroked: Whether to draw stroke.
            line_width_min_pixels: Minimum stroke width.
            point_radius_min_pixels: Minimum point radius.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"geojson-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "GeoJsonLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Contour Layer
    # -------------------------------------------------------------------------

    def add_contour_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_weight: Union[float, str, Callable] = 1,
        cell_size: float = 200,
        contours: Optional[List[Dict]] = None,
        pickable: bool = True,
        opacity: float = 1,
        **kwargs,
    ) -> None:
        """Add a contour layer for isoline visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight.
            cell_size: Grid cell size for aggregation.
            contours: Contour definitions [{threshold, color, strokeWidth}, ...].
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"contour-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ContourLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Screen Grid Layer
    # -------------------------------------------------------------------------

    def add_screen_grid_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_weight: Union[float, str, Callable] = 1,
        cell_size_pixels: float = 50,
        color_range: Optional[List[List[int]]] = None,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a screen grid layer for screen-space grid aggregation.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for point position [lng, lat].
            get_weight: Accessor for point weight.
            cell_size_pixels: Grid cell size in pixels.
            color_range: Color gradient [[r, g, b, a], ...].
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional layer props.
        """
        layer_id = name or f"screengrid-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ScreenGridLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Layer Management
    # -------------------------------------------------------------------------

    def remove_deck_layer(self, layer_id: str) -> None:
        """Remove a deck.gl layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        if layer_id in self._deck_layers:
            layers = dict(self._deck_layers)
            del layers[layer_id]
            self._deck_layers = layers
        self.call_js_method("removeDeckLayer", layer_id)

    def set_deck_layer_visibility(self, layer_id: str, visible: bool) -> None:
        """Set deck.gl layer visibility.

        Args:
            layer_id: Layer identifier.
            visible: Whether layer should be visible.
        """
        self.call_js_method("setDeckLayerVisibility", layer_id, visible)

    # -------------------------------------------------------------------------
    # Data Processing Helpers
    # -------------------------------------------------------------------------

    def _process_deck_data(self, data: Any) -> Any:
        """Process data for deck.gl layers.

        Handles GeoDataFrame, GeoJSON, and list of dicts.

        Args:
            data: Input data in various formats.

        Returns:
            Processed data suitable for deck.gl.
        """
        # Handle GeoDataFrame
        if hasattr(data, "__geo_interface__"):
            return json.loads(data.to_json())

        # Handle file path
        if isinstance(data, (str, Path)):
            path = Path(data)
            if path.exists() and path.suffix.lower() in [".geojson", ".json"]:
                with open(path) as f:
                    return json.load(f)
            # Could be URL, return as-is
            return str(data)

        # Handle dict (GeoJSON or config)
        if isinstance(data, dict):
            return data

        # Handle list of dicts
        if isinstance(data, list):
            return data

        return data

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for the DeckGL map."""
        template_path = Path(__file__).parent / "templates" / "deckgl.html"

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
            "deckLayers": self._deck_layers,
            "js_calls": self._js_calls,
        }

        template = template.replace("{{state}}", json.dumps(state, indent=2))
        return template
