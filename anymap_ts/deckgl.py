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
    # DeckGL Point Cloud Layer
    # -------------------------------------------------------------------------

    def add_point_cloud_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "position",
        get_color: Union[List[int], str, Callable] = None,
        get_normal: Union[str, Callable] = None,
        point_size: float = 2,
        size_units: str = "pixels",
        coordinate_system: Optional[str] = None,
        coordinate_origin: Optional[List[float]] = None,
        pickable: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a point cloud layer for 3D point visualization.

        Renders large point cloud datasets typically from LiDAR or 3D scanning.
        Supports both 2D and 3D coordinates with optional normal vectors for
        lighting effects.

        Args:
            data: Array of point data with position [x, y, z] coordinates.
            name: Layer ID. If None, auto-generated.
            get_position: Accessor for point position [x, y, z].
            get_color: Accessor for point color [r, g, b, a].
            get_normal: Accessor for point normal [nx, ny, nz] for lighting.
            point_size: Point size in size_units.
            size_units: Units for point_size ('pixels' or 'meters').
            coordinate_system: Coordinate system ('CARTESIAN', 'METER_OFFSETS',
                'LNGLAT', 'LNGLAT_OFFSETS').
            coordinate_origin: Origin for offset coordinate systems [lng, lat, z].
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity (0-1).
            **kwargs: Additional PointCloudLayer props.

        Example:
            >>> m = DeckGLMap()
            >>> points = [
            ...     {"position": [-122.4, 37.8, 100], "color": [255, 0, 0]},
            ...     {"position": [-122.5, 37.7, 200], "color": [0, 255, 0]},
            ... ]
            >>> m.add_point_cloud_layer(
            ...     data=points,
            ...     point_size=5,
            ...     get_color="color"
            ... )
        """
        layer_id = name or f"pointcloud-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        layer_kwargs = {
            "id": layer_id,
            "data": processed_data,
            "getPosition": get_position,
            "getColor": get_color or [255, 255, 255, 255],
            "pointSize": point_size,
            "sizeUnits": size_units,
            "pickable": pickable,
            "opacity": opacity,
        }

        if get_normal is not None:
            layer_kwargs["getNormal"] = get_normal

        if coordinate_system is not None:
            layer_kwargs["coordinateSystem"] = coordinate_system

        if coordinate_origin is not None:
            layer_kwargs["coordinateOrigin"] = coordinate_origin

        layer_kwargs.update(kwargs)
        self.call_js_method("addPointCloudLayer", **layer_kwargs)

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "PointCloudLayer", "id": layer_id},
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
    # Generic DeckGL Layer
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
            layer_type: The deck.gl layer type. Supported types include:
                'ScatterplotLayer', 'ArcLayer', 'PathLayer', 'PolygonLayer',
                'HexagonLayer', 'HeatmapLayer', 'GridLayer', 'IconLayer',
                'TextLayer', 'GeoJsonLayer', 'ContourLayer', 'ScreenGridLayer',
                'PointCloudLayer', 'TripsLayer', 'LineLayer'.
            data: Array of data objects or GeoJSON.
            name: Layer ID. If None, auto-generated from layer_type.
            **kwargs: Layer-specific properties passed directly to deck.gl.
                Common properties include:
                - opacity: Layer opacity (0-1)
                - pickable: Whether layer responds to hover/click
                - getPosition: Accessor for position coordinates
                - getColor/getFillColor/getLineColor: Color accessors

        Example:
            >>> m = DeckGLMap()
            >>> # Add a TripsLayer with animation
            >>> m.add_deckgl_layer(
            ...     'TripsLayer',
            ...     data=trips_data,
            ...     getPath='waypoints',
            ...     getTimestamps='timestamps',
            ...     getColor=[253, 128, 93],
            ...     trailLength=180,
            ... )
            >>> # Add a LineLayer
            >>> m.add_deckgl_layer(
            ...     'LineLayer',
            ...     data=lines_data,
            ...     getSourcePosition='source',
            ...     getTargetPosition='target',
            ...     getColor=[0, 128, 255],
            ... )
        """
        # Normalize layer type and create prefix
        layer_type_clean = layer_type.replace("Layer", "")
        prefix = layer_type_clean.lower()
        layer_id = name or f"{prefix}-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addDeckGLLayer",
            layerType=layer_type,
            id=layer_id,
            data=processed_data,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": layer_type, "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Trips Layer
    # -------------------------------------------------------------------------

    def add_trips_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_path: Union[str, Callable] = "waypoints",
        get_timestamps: Union[str, Callable] = "timestamps",
        get_color: Union[List[int], str, Callable] = None,
        width_min_pixels: float = 2,
        trail_length: float = 180,
        current_time: float = 0,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a trips layer for animated path visualization.

        The TripsLayer renders animated paths showing movement over time,
        ideal for visualizing vehicle routes, migration patterns, or any
        time-based trajectory data.

        Args:
            data: Array of trip objects with waypoints and timestamps.
            name: Layer ID. If None, auto-generated.
            get_path: Accessor for waypoint coordinates [[lng, lat], ...].
            get_timestamps: Accessor for timestamps at each waypoint.
            get_color: Accessor for trip color [r, g, b] or [r, g, b, a].
            width_min_pixels: Minimum trail width in pixels.
            trail_length: Trail length in timestamp units.
            current_time: Current animation time.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity (0-1).
            **kwargs: Additional TripsLayer props.

        Example:
            >>> m = DeckGLMap()
            >>> trips = [
            ...     {
            ...         "waypoints": [[-122.4, 37.8], [-122.5, 37.7], [-122.6, 37.8]],
            ...         "timestamps": [0, 50, 100]
            ...     }
            ... ]
            >>> m.add_trips_layer(
            ...     data=trips,
            ...     trail_length=180,
            ...     current_time=50,
            ... )
        """
        layer_id = name or f"trips-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "TripsLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL Line Layer
    # -------------------------------------------------------------------------

    def add_line_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_source_position: Union[str, Callable] = "sourcePosition",
        get_target_position: Union[str, Callable] = "targetPosition",
        get_color: Union[List[int], str, Callable] = None,
        get_width: Union[float, str, Callable] = 1,
        width_min_pixels: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a line layer for simple line segment visualization.

        The LineLayer renders straight line segments between source and
        target positions. Unlike ArcLayer, lines are drawn directly
        without curvature.

        Args:
            data: Array of line objects with source/target positions.
            name: Layer ID. If None, auto-generated.
            get_source_position: Accessor for source position [lng, lat].
            get_target_position: Accessor for target position [lng, lat].
            get_color: Accessor for line color [r, g, b] or [r, g, b, a].
            get_width: Accessor for line width.
            width_min_pixels: Minimum line width in pixels.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity (0-1).
            **kwargs: Additional LineLayer props.

        Example:
            >>> m = DeckGLMap()
            >>> lines = [
            ...     {"sourcePosition": [-122.4, 37.8], "targetPosition": [-122.5, 37.7]},
            ...     {"sourcePosition": [-122.5, 37.7], "targetPosition": [-122.6, 37.8]},
            ... ]
            >>> m.add_line_layer(
            ...     data=lines,
            ...     get_color=[0, 128, 255],
            ...     get_width=2,
            ... )
        """
        layer_id = name or f"line-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "LineLayer", "id": layer_id},
        }

    # -------------------------------------------------------------------------
    # DeckGL COG Layer
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
            >>> m = DeckGLMap()
            >>> m.add_cog_layer(
            ...     "https://example.com/landcover.tif",
            ...     name="landcover",
            ...     opacity=0.8
            ... )
        """
        # Use a monotonically increasing counter to avoid ID collisions when layers are removed.
        counter = getattr(self, "_cog_layer_counter", 0)
        layer_id = name or f"cog-{counter}"
        self._cog_layer_counter = counter + 1

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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "COGLayer", "id": layer_id, "url": url},
        }

    # -------------------------------------------------------------------------
    # New DeckGL Layer Types
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
        """Add a bitmap layer for raster image overlay.

        Args:
            image: URL or data URI of the image.
            bounds: Bounding box [west, south, east, north].
            name: Layer ID.
            opacity: Layer opacity (0-1).
            visible: Whether layer is visible.
            pickable: Whether layer responds to hover/click.
            desaturate: Desaturation amount (0-1).
            transparent_color: Color to make transparent [r, g, b, a].
            tint_color: Color to tint the image [r, g, b].
            **kwargs: Additional BitmapLayer props.
        """
        layer_id = name or f"bitmap-{len(self._deck_layers)}"

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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "BitmapLayer", "id": layer_id},
        }

    def add_column_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_elevation: Union[float, str, Callable] = 1000,
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
        """Add a column layer for 3D column/bar visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
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
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional ColumnLayer props.
        """
        layer_id = name or f"column-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ColumnLayer", "id": layer_id},
        }

    def add_grid_cell_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_color: Union[List[int], str, Callable] = None,
        get_elevation: Union[float, str, Callable] = 1000,
        cell_size: float = 200,
        coverage: float = 1,
        elevation_scale: float = 1,
        extruded: bool = True,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a grid cell layer for pre-aggregated grid visualization.

        Args:
            data: Array of data objects with position coordinates.
            name: Layer ID.
            get_position: Accessor for cell position [lng, lat].
            get_color: Accessor for cell color [r, g, b, a].
            get_elevation: Accessor for cell height.
            cell_size: Cell size in meters.
            coverage: Cell coverage (0-1).
            elevation_scale: Elevation multiplier.
            extruded: Whether to extrude cells.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional GridCellLayer props.
        """
        layer_id = name or f"gridcell-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "GridCellLayer", "id": layer_id},
        }

    def add_solid_polygon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_polygon: Union[str, Callable] = "polygon",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_elevation: Union[float, str, Callable] = 0,
        filled: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a solid polygon layer for filled polygon visualization.

        Args:
            data: Array of data objects with polygon coordinates.
            name: Layer ID.
            get_polygon: Accessor for polygon coordinates.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill polygons.
            extruded: Whether to render as 3D polygons.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional SolidPolygonLayer props.
        """
        layer_id = name or f"solidpolygon-{len(self._deck_layers)}"
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

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "SolidPolygonLayer", "id": layer_id},
        }

    def add_tile_layer(
        self,
        data: Union[str, List[str]],
        name: Optional[str] = None,
        min_zoom: int = 0,
        max_zoom: int = 19,
        tile_size: int = 256,
        pickable: bool = False,
        visible: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a tile layer for raster tile visualization.

        Args:
            data: Tile URL template with {z}/{x}/{y} placeholders.
            name: Layer ID.
            min_zoom: Minimum zoom level.
            max_zoom: Maximum zoom level.
            tile_size: Tile size in pixels.
            pickable: Whether layer responds to hover/click.
            visible: Whether layer is visible.
            opacity: Layer opacity (0-1).
            **kwargs: Additional TileLayer props.
        """
        layer_id = name or f"tile-{len(self._deck_layers)}"

        self.call_js_method(
            "addTileLayer",
            id=layer_id,
            data=data,
            minZoom=min_zoom,
            maxZoom=max_zoom,
            tileSize=tile_size,
            pickable=pickable,
            visible=visible,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "TileLayer", "id": layer_id},
        }

    def add_mvt_layer(
        self,
        data: Union[str, List[str]],
        name: Optional[str] = None,
        min_zoom: int = 0,
        max_zoom: int = 14,
        binary: bool = True,
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_point_radius: Union[float, str, Callable] = 5,
        line_width_min_pixels: float = 1,
        point_radius_min_pixels: float = 2,
        pickable: bool = True,
        visible: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a Mapbox Vector Tile (MVT) layer.

        Args:
            data: MVT tile URL template with {z}/{x}/{y} placeholders.
            name: Layer ID.
            min_zoom: Minimum zoom level.
            max_zoom: Maximum zoom level.
            binary: Whether to use binary format.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for line width.
            get_point_radius: Accessor for point radius.
            line_width_min_pixels: Minimum line width in pixels.
            point_radius_min_pixels: Minimum point radius in pixels.
            pickable: Whether layer responds to hover/click.
            visible: Whether layer is visible.
            opacity: Layer opacity (0-1).
            **kwargs: Additional MVTLayer props.
        """
        layer_id = name or f"mvt-{len(self._deck_layers)}"

        self.call_js_method(
            "addMVTLayer",
            id=layer_id,
            data=data,
            minZoom=min_zoom,
            maxZoom=max_zoom,
            binary=binary,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            getPointRadius=get_point_radius,
            lineWidthMinPixels=line_width_min_pixels,
            pointRadiusMinPixels=point_radius_min_pixels,
            pickable=pickable,
            visible=visible,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "MVTLayer", "id": layer_id},
        }

    def add_tile3d_layer(
        self,
        data: str,
        name: Optional[str] = None,
        point_size: float = 1,
        pickable: bool = True,
        visible: bool = True,
        opacity: float = 1.0,
        load_options: Optional[Dict] = None,
        **kwargs,
    ) -> None:
        """Add a 3D Tiles layer for 3D building/terrain visualization.

        Args:
            data: URL to tileset.json.
            name: Layer ID.
            point_size: Point size for point cloud tiles.
            pickable: Whether layer responds to hover/click.
            visible: Whether layer is visible.
            opacity: Layer opacity (0-1).
            load_options: Loader options for tile loading.
            **kwargs: Additional Tile3DLayer props.
        """
        layer_id = name or f"tile3d-{len(self._deck_layers)}"

        self.call_js_method(
            "addTile3DLayer",
            id=layer_id,
            data=data,
            pointSize=point_size,
            pickable=pickable,
            visible=visible,
            opacity=opacity,
            loadOptions=load_options or {},
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "Tile3DLayer", "id": layer_id},
        }

    def add_terrain_layer(
        self,
        elevation_data: Union[str, List[str]],
        name: Optional[str] = None,
        texture: Optional[str] = None,
        mesh_max_error: float = 4.0,
        bounds: Optional[List[float]] = None,
        elevation_decoder: Optional[Dict] = None,
        pickable: bool = False,
        visible: bool = True,
        opacity: float = 1.0,
        wireframe: bool = False,
        **kwargs,
    ) -> None:
        """Add a terrain layer for 3D terrain visualization.

        Args:
            elevation_data: URL to elevation tiles (e.g., Mapbox terrain).
            name: Layer ID.
            texture: URL to texture tiles for terrain surface.
            mesh_max_error: Maximum mesh error in meters.
            bounds: Bounding box [west, south, east, north].
            elevation_decoder: Decoder for elevation data format.
            pickable: Whether layer responds to hover/click.
            visible: Whether layer is visible.
            opacity: Layer opacity (0-1).
            wireframe: Whether to render as wireframe.
            **kwargs: Additional TerrainLayer props.
        """
        layer_id = name or f"terrain-{len(self._deck_layers)}"

        default_decoder = {
            "rScaler": 256,
            "gScaler": 1,
            "bScaler": 1 / 256,
            "offset": -32768,
        }

        self.call_js_method(
            "addTerrainLayer",
            id=layer_id,
            elevationData=elevation_data,
            texture=texture,
            meshMaxError=mesh_max_error,
            bounds=bounds,
            elevationDecoder=elevation_decoder or default_decoder,
            pickable=pickable,
            visible=visible,
            opacity=opacity,
            wireframe=wireframe,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "TerrainLayer", "id": layer_id},
        }

    def add_great_circle_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_source_position: Union[str, Callable] = "source",
        get_target_position: Union[str, Callable] = "target",
        get_source_color: Union[List[int], str, Callable] = None,
        get_target_color: Union[List[int], str, Callable] = None,
        get_width: Union[float, str, Callable] = 1,
        width_min_pixels: float = 1,
        width_max_pixels: float = 100,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a great circle layer for geodesic arc visualization.

        Args:
            data: Array of data objects with source/target coordinates.
            name: Layer ID.
            get_source_position: Accessor for source position [lng, lat].
            get_target_position: Accessor for target position [lng, lat].
            get_source_color: Accessor for source color [r, g, b, a].
            get_target_color: Accessor for target color [r, g, b, a].
            get_width: Accessor for line width.
            width_min_pixels: Minimum line width in pixels.
            width_max_pixels: Maximum line width in pixels.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional GreatCircleLayer props.
        """
        layer_id = name or f"greatcircle-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addGreatCircleLayer",
            id=layer_id,
            data=processed_data,
            getSourcePosition=get_source_position,
            getTargetPosition=get_target_position,
            getSourceColor=get_source_color or [51, 136, 255, 255],
            getTargetColor=get_target_color or [255, 136, 51, 255],
            getWidth=get_width,
            widthMinPixels=width_min_pixels,
            widthMaxPixels=width_max_pixels,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "GreatCircleLayer", "id": layer_id},
        }

    def add_h3_hexagon_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_hexagon: Union[str, Callable] = "hexagon",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_elevation: Union[float, str, Callable] = 0,
        filled: bool = True,
        stroked: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        coverage: float = 1,
        high_precision: bool = False,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add an H3 hexagon layer for H3 spatial index visualization.

        Args:
            data: Array of data objects with H3 index.
            name: Layer ID.
            get_hexagon: Accessor for H3 index string.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill hexagons.
            stroked: Whether to stroke hexagons.
            extruded: Whether to render as 3D hexagons.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            coverage: Hexagon coverage (0-1).
            high_precision: Use high precision rendering.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional H3HexagonLayer props.
        """
        layer_id = name or f"h3hexagon-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addH3HexagonLayer",
            id=layer_id,
            data=processed_data,
            getHexagon=get_hexagon,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getElevation=get_elevation,
            filled=filled,
            stroked=stroked,
            extruded=extruded,
            wireframe=wireframe,
            elevationScale=elevation_scale,
            coverage=coverage,
            highPrecision=high_precision,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "H3HexagonLayer", "id": layer_id},
        }

    def add_h3_cluster_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_hexagons: Union[str, Callable] = "hexagons",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        filled: bool = True,
        stroked: bool = True,
        extruded: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add an H3 cluster layer for grouped H3 cell visualization.

        Args:
            data: Array of data objects with H3 index arrays.
            name: Layer ID.
            get_hexagons: Accessor for array of H3 index strings.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for line width.
            filled: Whether to fill clusters.
            stroked: Whether to stroke clusters.
            extruded: Whether to render as 3D.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional H3ClusterLayer props.
        """
        layer_id = name or f"h3cluster-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addH3ClusterLayer",
            id=layer_id,
            data=processed_data,
            getHexagons=get_hexagons,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            filled=filled,
            stroked=stroked,
            extruded=extruded,
            elevationScale=elevation_scale,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "H3ClusterLayer", "id": layer_id},
        }

    def add_s2_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_s2_token: Union[str, Callable] = "s2Token",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_elevation: Union[float, str, Callable] = 0,
        filled: bool = True,
        stroked: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add an S2 layer for S2 geometry cell visualization.

        Args:
            data: Array of data objects with S2 token.
            name: Layer ID.
            get_s2_token: Accessor for S2 token string.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for line width.
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill cells.
            stroked: Whether to stroke cells.
            extruded: Whether to render as 3D.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional S2Layer props.
        """
        layer_id = name or f"s2-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addS2Layer",
            id=layer_id,
            data=processed_data,
            getS2Token=get_s2_token,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            getElevation=get_elevation,
            filled=filled,
            stroked=stroked,
            extruded=extruded,
            wireframe=wireframe,
            elevationScale=elevation_scale,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "S2Layer", "id": layer_id},
        }

    def add_quadkey_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_quadkey: Union[str, Callable] = "quadkey",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_elevation: Union[float, str, Callable] = 0,
        filled: bool = True,
        stroked: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a Quadkey layer for Bing Maps tile index visualization.

        Args:
            data: Array of data objects with quadkey.
            name: Layer ID.
            get_quadkey: Accessor for quadkey string.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for line width.
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill cells.
            stroked: Whether to stroke cells.
            extruded: Whether to render as 3D.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional QuadkeyLayer props.
        """
        layer_id = name or f"quadkey-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addQuadkeyLayer",
            id=layer_id,
            data=processed_data,
            getQuadkey=get_quadkey,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            getElevation=get_elevation,
            filled=filled,
            stroked=stroked,
            extruded=extruded,
            wireframe=wireframe,
            elevationScale=elevation_scale,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "QuadkeyLayer", "id": layer_id},
        }

    def add_geohash_layer(
        self,
        data: Any,
        name: Optional[str] = None,
        get_geohash: Union[str, Callable] = "geohash",
        get_fill_color: Union[List[int], str, Callable] = None,
        get_line_color: Union[List[int], str, Callable] = None,
        get_line_width: Union[float, str, Callable] = 1,
        get_elevation: Union[float, str, Callable] = 0,
        filled: bool = True,
        stroked: bool = True,
        extruded: bool = False,
        wireframe: bool = False,
        elevation_scale: float = 1,
        pickable: bool = True,
        opacity: float = 0.8,
        **kwargs,
    ) -> None:
        """Add a Geohash layer for geohash cell visualization.

        Args:
            data: Array of data objects with geohash.
            name: Layer ID.
            get_geohash: Accessor for geohash string.
            get_fill_color: Accessor for fill color [r, g, b, a].
            get_line_color: Accessor for stroke color [r, g, b, a].
            get_line_width: Accessor for line width.
            get_elevation: Accessor for 3D extrusion height.
            filled: Whether to fill cells.
            stroked: Whether to stroke cells.
            extruded: Whether to render as 3D.
            wireframe: Whether to render wireframe.
            elevation_scale: Elevation multiplier.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity.
            **kwargs: Additional GeohashLayer props.
        """
        layer_id = name or f"geohash-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        self.call_js_method(
            "addGeohashLayer",
            id=layer_id,
            data=processed_data,
            getGeohash=get_geohash,
            getFillColor=get_fill_color or [51, 136, 255, 128],
            getLineColor=get_line_color or [0, 0, 0, 255],
            getLineWidth=get_line_width,
            getElevation=get_elevation,
            filled=filled,
            stroked=stroked,
            extruded=extruded,
            wireframe=wireframe,
            elevationScale=elevation_scale,
            pickable=pickable,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "GeohashLayer", "id": layer_id},
        }

    def add_wms_layer(
        self,
        data: str,
        name: Optional[str] = None,
        service_type: str = "wms",
        layers: Optional[List[str]] = None,
        srs: Optional[str] = None,
        pickable: bool = False,
        visible: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a WMS layer for OGC Web Map Service visualization.

        Args:
            data: WMS base URL.
            name: Layer ID.
            service_type: Service type ('wms' or 'template').
            layers: WMS layer names to request.
            srs: Spatial reference system (e.g., 'EPSG:4326').
            pickable: Whether layer responds to hover/click.
            visible: Whether layer is visible.
            opacity: Layer opacity (0-1).
            **kwargs: Additional WMSLayer props.
        """
        layer_id = name or f"wms-{len(self._deck_layers)}"

        self.call_js_method(
            "addWMSLayer",
            id=layer_id,
            data=data,
            serviceType=service_type,
            layers=layers,
            srs=srs,
            pickable=pickable,
            visible=visible,
            opacity=opacity,
            **kwargs,
        )

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "WMSLayer", "id": layer_id},
        }

    def add_simple_mesh_layer(
        self,
        data: Any,
        mesh: str,
        name: Optional[str] = None,
        texture: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_color: Union[List[int], str, Callable] = None,
        get_orientation: Union[str, Callable] = None,
        get_scale: Union[str, Callable] = None,
        get_translation: Union[str, Callable] = None,
        size_scale: float = 1,
        wireframe: bool = False,
        pickable: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a simple mesh layer for 3D mesh visualization.

        Args:
            data: Array of data objects with position coordinates.
            mesh: URL to OBJ/glTF mesh file.
            name: Layer ID.
            texture: URL to texture image.
            get_position: Accessor for mesh position [lng, lat, z].
            get_color: Accessor for mesh color [r, g, b, a].
            get_orientation: Accessor for mesh orientation [pitch, yaw, roll].
            get_scale: Accessor for mesh scale [x, y, z].
            get_translation: Accessor for mesh translation [x, y, z].
            size_scale: Global size multiplier.
            wireframe: Whether to render as wireframe.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity (0-1).
            **kwargs: Additional SimpleMeshLayer props.
        """
        layer_id = name or f"simplemesh-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        layer_kwargs = {
            "id": layer_id,
            "data": processed_data,
            "mesh": mesh,
            "getPosition": get_position,
            "getColor": get_color or [255, 255, 255, 255],
            "sizeScale": size_scale,
            "wireframe": wireframe,
            "pickable": pickable,
            "opacity": opacity,
        }

        if texture:
            layer_kwargs["texture"] = texture
        if get_orientation:
            layer_kwargs["getOrientation"] = get_orientation
        if get_scale:
            layer_kwargs["getScale"] = get_scale
        if get_translation:
            layer_kwargs["getTranslation"] = get_translation

        layer_kwargs.update(kwargs)
        self.call_js_method("addSimpleMeshLayer", **layer_kwargs)

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "SimpleMeshLayer", "id": layer_id},
        }

    def add_scenegraph_layer(
        self,
        data: Any,
        scenegraph: str,
        name: Optional[str] = None,
        get_position: Union[str, Callable] = "coordinates",
        get_color: Union[List[int], str, Callable] = None,
        get_orientation: Union[str, Callable] = None,
        get_scale: Union[str, Callable] = None,
        get_translation: Union[str, Callable] = None,
        size_scale: float = 1,
        size_min_pixels: float = 0,
        size_max_pixels: float = 10000,
        pickable: bool = True,
        opacity: float = 1.0,
        **kwargs,
    ) -> None:
        """Add a scenegraph layer for glTF model visualization.

        Args:
            data: Array of data objects with position coordinates.
            scenegraph: URL to glTF/GLB model file.
            name: Layer ID.
            get_position: Accessor for model position [lng, lat, z].
            get_color: Accessor for model tint color [r, g, b, a].
            get_orientation: Accessor for model orientation [pitch, yaw, roll].
            get_scale: Accessor for model scale [x, y, z].
            get_translation: Accessor for model translation [x, y, z].
            size_scale: Global size multiplier.
            size_min_pixels: Minimum model size in pixels.
            size_max_pixels: Maximum model size in pixels.
            pickable: Whether layer responds to hover/click.
            opacity: Layer opacity (0-1).
            **kwargs: Additional ScenegraphLayer props.
        """
        layer_id = name or f"scenegraph-{len(self._deck_layers)}"
        processed_data = self._process_deck_data(data)

        layer_kwargs = {
            "id": layer_id,
            "data": processed_data,
            "scenegraph": scenegraph,
            "getPosition": get_position,
            "getColor": get_color or [255, 255, 255, 255],
            "sizeScale": size_scale,
            "sizeMinPixels": size_min_pixels,
            "sizeMaxPixels": size_max_pixels,
            "pickable": pickable,
            "opacity": opacity,
        }

        if get_orientation:
            layer_kwargs["getOrientation"] = get_orientation
        if get_scale:
            layer_kwargs["getScale"] = get_scale
        if get_translation:
            layer_kwargs["getTranslation"] = get_translation

        layer_kwargs.update(kwargs)
        self.call_js_method("addScenegraphLayer", **layer_kwargs)

        self._deck_layers = {
            **self._deck_layers,
            layer_id: {"type": "ScenegraphLayer", "id": layer_id},
        }

    def remove_cog_layer(self, layer_id: str) -> None:
        """Remove a COG layer.

        Args:
            layer_id: Layer identifier to remove.
        """
        self.remove_deck_layer(layer_id)

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
