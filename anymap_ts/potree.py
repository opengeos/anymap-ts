"""Potree point cloud viewer widget implementation.

Potree is loaded via CDN since it's a complex Three.js-based viewer.
This implementation provides a Python wrapper for point cloud visualization.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


class PotreeViewer(MapWidget):
    """Interactive point cloud viewer using Potree.

    Potree is a WebGL-based point cloud renderer for large-scale LiDAR
    datasets. This class provides a Python interface for loading and
    visualizing point clouds.

    Note: Potree is loaded from CDN due to its complex Three.js dependencies.

    Example:
        >>> from anymap_ts import PotreeViewer
        >>> viewer = PotreeViewer()
        >>> viewer.load_point_cloud("path/to/pointcloud/cloud.js")
        >>> viewer
    """

    # Potree-specific traits
    point_budget = traitlets.Int(1000000).tag(sync=True)
    point_size = traitlets.Float(1.0).tag(sync=True)
    fov = traitlets.Float(60.0).tag(sync=True)
    background = traitlets.Unicode("#000000").tag(sync=True)

    # EDL (Eye Dome Lighting) settings
    edl_enabled = traitlets.Bool(True).tag(sync=True)
    edl_radius = traitlets.Float(1.4).tag(sync=True)
    edl_strength = traitlets.Float(0.4).tag(sync=True)

    # Point clouds
    point_clouds = traitlets.Dict({}).tag(sync=True)

    # Camera
    camera_position = traitlets.List([0, 0, 100]).tag(sync=True)
    camera_target = traitlets.List([0, 0, 0]).tag(sync=True)

    def __init__(
        self,
        width: str = "100%",
        height: str = "600px",
        point_budget: int = 1000000,
        point_size: float = 1.0,
        fov: float = 60.0,
        background: str = "#000000",
        edl_enabled: bool = True,
        **kwargs,
    ):
        """Initialize a Potree viewer.

        Args:
            width: Widget width as CSS string.
            height: Widget height as CSS string.
            point_budget: Maximum number of points to render.
            point_size: Default point size.
            fov: Field of view in degrees.
            background: Background color (hex string).
            edl_enabled: Enable Eye Dome Lighting.
            **kwargs: Additional widget arguments.
        """
        # Potree doesn't use center/zoom like maps
        super().__init__(
            center=[0, 0],
            zoom=1,
            width=width,
            height=height,
            point_budget=point_budget,
            point_size=point_size,
            fov=fov,
            background=background,
            edl_enabled=edl_enabled,
            **kwargs,
        )
        self.point_clouds = {}

    # -------------------------------------------------------------------------
    # Point Cloud Methods
    # -------------------------------------------------------------------------

    def load_point_cloud(
        self,
        url: str,
        name: Optional[str] = None,
        visible: bool = True,
        point_size: Optional[float] = None,
        point_size_type: str = "adaptive",
        shape: str = "circle",
        color: Optional[str] = None,
        **kwargs,
    ) -> None:
        """Load a point cloud.

        Args:
            url: URL to point cloud (Potree format or LAZ/LAS via Entwine).
            name: Point cloud name.
            visible: Whether point cloud is visible.
            point_size: Point size (overrides default).
            point_size_type: 'fixed', 'attenuated', or 'adaptive'.
            shape: Point shape ('square', 'circle', 'paraboloid').
            color: Point color (hex string or None for native colors).
            **kwargs: Additional material options.
        """
        cloud_id = name or f"pointcloud_{len(self.point_clouds)}"

        self.point_clouds = {
            **self.point_clouds,
            cloud_id: {
                "url": url,
                "name": cloud_id,
                "visible": visible,
                "material": {
                    "size": point_size or self.point_size,
                    "pointSizeType": point_size_type,
                    "shape": shape,
                    "color": color,
                    **kwargs,
                },
            },
        }

        self.call_js_method(
            "loadPointCloud",
            url=url,
            name=cloud_id,
            visible=visible,
            material={
                "size": point_size or self.point_size,
                "pointSizeType": point_size_type,
                "shape": shape,
                "color": color,
                **kwargs,
            },
        )

    def remove_point_cloud(self, name: str) -> None:
        """Remove a point cloud.

        Args:
            name: Point cloud name to remove.
        """
        if name in self.point_clouds:
            clouds = dict(self.point_clouds)
            del clouds[name]
            self.point_clouds = clouds
        self.call_js_method("removePointCloud", name=name)

    def set_point_cloud_visibility(self, name: str, visible: bool) -> None:
        """Set point cloud visibility.

        Args:
            name: Point cloud name.
            visible: Whether to show the point cloud.
        """
        self.call_js_method("setPointCloudVisibility", name=name, visible=visible)

    # -------------------------------------------------------------------------
    # Camera Methods
    # -------------------------------------------------------------------------

    def set_camera_position(
        self,
        x: float,
        y: float,
        z: float,
    ) -> None:
        """Set camera position.

        Args:
            x: X coordinate.
            y: Y coordinate.
            z: Z coordinate.
        """
        self.camera_position = [x, y, z]
        self.call_js_method("setCameraPosition", x=x, y=y, z=z)

    def set_camera_target(
        self,
        x: float,
        y: float,
        z: float,
    ) -> None:
        """Set camera target (look-at point).

        Args:
            x: X coordinate.
            y: Y coordinate.
            z: Z coordinate.
        """
        self.camera_target = [x, y, z]
        self.call_js_method("setCameraTarget", x=x, y=y, z=z)

    def fly_to_point_cloud(self, name: Optional[str] = None) -> None:
        """Fly to a point cloud or all point clouds.

        Args:
            name: Point cloud name (None for all).
        """
        self.call_js_method("flyToPointCloud", name=name)

    def reset_camera(self) -> None:
        """Reset camera to default view."""
        self.call_js_method("resetCamera")

    # -------------------------------------------------------------------------
    # Visualization Settings
    # -------------------------------------------------------------------------

    def set_point_budget(self, budget: int) -> None:
        """Set the point budget (max points to render).

        Args:
            budget: Maximum number of points.
        """
        self.point_budget = budget
        self.call_js_method("setPointBudget", budget=budget)

    def set_point_size(self, size: float) -> None:
        """Set default point size.

        Args:
            size: Point size.
        """
        self.point_size = size
        self.call_js_method("setPointSize", size=size)

    def set_fov(self, fov: float) -> None:
        """Set field of view.

        Args:
            fov: Field of view in degrees.
        """
        self.fov = fov
        self.call_js_method("setFOV", fov=fov)

    def set_background(self, color: str) -> None:
        """Set background color.

        Args:
            color: Background color (hex string).
        """
        self.background = color
        self.call_js_method("setBackground", color=color)

    def set_edl(
        self,
        enabled: bool = True,
        radius: float = 1.4,
        strength: float = 0.4,
    ) -> None:
        """Configure Eye Dome Lighting.

        Args:
            enabled: Whether to enable EDL.
            radius: EDL radius.
            strength: EDL strength.
        """
        self.edl_enabled = enabled
        self.edl_radius = radius
        self.edl_strength = strength
        self.call_js_method(
            "setEDL",
            enabled=enabled,
            radius=radius,
            strength=strength,
        )

    # -------------------------------------------------------------------------
    # Measurement Tools
    # -------------------------------------------------------------------------

    def add_measurement_tool(self, tool_type: str = "distance") -> None:
        """Add a measurement tool.

        Args:
            tool_type: Type of measurement ('point', 'distance', 'area', 'angle', 'height', 'profile').
        """
        self.call_js_method("addMeasurementTool", type=tool_type)

    def clear_measurements(self) -> None:
        """Clear all measurements."""
        self.call_js_method("clearMeasurements")

    # -------------------------------------------------------------------------
    # Clipping
    # -------------------------------------------------------------------------

    def add_clipping_volume(
        self,
        volume_type: str = "box",
        position: Optional[Tuple[float, float, float]] = None,
        scale: Optional[Tuple[float, float, float]] = None,
    ) -> None:
        """Add a clipping volume.

        Args:
            volume_type: Type of volume ('box', 'polygon', 'plane').
            position: Volume position (x, y, z).
            scale: Volume scale (x, y, z).
        """
        self.call_js_method(
            "addClippingVolume",
            type=volume_type,
            position=list(position) if position else None,
            scale=list(scale) if scale else None,
        )

    def clear_clipping_volumes(self) -> None:
        """Clear all clipping volumes."""
        self.call_js_method("clearClippingVolumes")

    # -------------------------------------------------------------------------
    # Annotations
    # -------------------------------------------------------------------------

    def add_annotation(
        self,
        position: Tuple[float, float, float],
        title: str,
        description: str = "",
        camera_position: Optional[Tuple[float, float, float]] = None,
        camera_target: Optional[Tuple[float, float, float]] = None,
    ) -> None:
        """Add an annotation.

        Args:
            position: Annotation position (x, y, z).
            title: Annotation title.
            description: Annotation description.
            camera_position: Camera position when focused.
            camera_target: Camera target when focused.
        """
        self.call_js_method(
            "addAnnotation",
            position=list(position),
            title=title,
            description=description,
            cameraPosition=list(camera_position) if camera_position else None,
            cameraTarget=list(camera_target) if camera_target else None,
        )

    def clear_annotations(self) -> None:
        """Clear all annotations."""
        self.call_js_method("clearAnnotations")

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for Potree viewer."""
        template_path = Path(__file__).parent / "templates" / "potree.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        state = {
            "point_budget": self.point_budget,
            "point_size": self.point_size,
            "fov": self.fov,
            "background": self.background,
            "edl_enabled": self.edl_enabled,
            "edl_radius": self.edl_radius,
            "edl_strength": self.edl_strength,
            "point_clouds": self.point_clouds,
            "camera_position": self.camera_position,
            "camera_target": self.camera_target,
            "width": self.width,
            "height": self.height,
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
    <title>Potree Viewer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; overflow: hidden; }
        #potree_render_area { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="potree_render_area"></div>
    <script>
        const state = {{state}};
        document.getElementById('potree_render_area').innerHTML = '<p style="color: white; padding: 20px;">Potree viewer requires Potree library. Point clouds: ' + Object.keys(state.point_clouds || {}).length + '</p>';
    </script>
</body>
</html>"""
