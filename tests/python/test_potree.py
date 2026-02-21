"""Tests for PotreeViewer widget."""

import pytest

from anymap_ts.potree import PotreeViewer


class TestPotreeInit:
    """Tests for PotreeViewer initialization."""

    def test_default_init(self):
        v = PotreeViewer()
        assert v.width == "100%"
        assert v.height == "600px"
        assert v.point_budget == 1000000
        assert v.point_size == 1.0
        assert v.fov == 60.0
        assert v.background == "#000000"
        assert v.edl_enabled is True
        assert v.edl_radius == 1.4
        assert v.edl_strength == 0.4
        assert v.point_clouds == {}
        assert v.camera_position == [0, 0, 100]
        assert v.camera_target == [0, 0, 0]

    def test_custom_init(self):
        v = PotreeViewer(
            width="800px",
            height="500px",
            point_budget=500000,
            point_size=2.0,
            fov=45.0,
            background="#ffffff",
            edl_enabled=False,
        )
        assert v.width == "800px"
        assert v.point_budget == 500000
        assert v.point_size == 2.0
        assert v.fov == 45.0
        assert v.background == "#ffffff"
        assert v.edl_enabled is False


class TestPointCloudMethods:
    """Tests for point cloud loading/removal."""

    def test_load_point_cloud(self):
        v = PotreeViewer()
        v.load_point_cloud("https://example.com/cloud.js", name="cloud1")
        assert "cloud1" in v.point_clouds
        assert v.point_clouds["cloud1"]["url"] == "https://example.com/cloud.js"
        calls = [c for c in v._js_calls if c["method"] == "loadPointCloud"]
        assert len(calls) == 1

    def test_load_point_cloud_auto_name(self):
        v = PotreeViewer()
        v.load_point_cloud("https://example.com/cloud.js")
        assert len(v.point_clouds) == 1

    def test_load_point_cloud_custom_material(self):
        v = PotreeViewer()
        v.load_point_cloud(
            "https://example.com/cloud.js",
            name="custom",
            point_size=3.0,
            point_size_type="fixed",
            shape="square",
            color="#ff0000",
        )
        material = v.point_clouds["custom"]["material"]
        assert material["size"] == 3.0
        assert material["pointSizeType"] == "fixed"
        assert material["shape"] == "square"
        assert material["color"] == "#ff0000"

    def test_remove_point_cloud(self):
        v = PotreeViewer()
        v.load_point_cloud("https://example.com/cloud.js", name="rm-cloud")
        v.remove_point_cloud("rm-cloud")
        assert "rm-cloud" not in v.point_clouds

    def test_remove_nonexistent_point_cloud(self):
        v = PotreeViewer()
        v.remove_point_cloud("nonexistent")

    def test_set_point_cloud_visibility(self):
        v = PotreeViewer()
        v.set_point_cloud_visibility("cloud1", False)
        calls = [c for c in v._js_calls if c["method"] == "setPointCloudVisibility"]
        assert len(calls) == 1


class TestCameraMethods:
    """Tests for camera control methods."""

    def test_set_camera_position(self):
        v = PotreeViewer()
        v.set_camera_position(10.0, 20.0, 30.0)
        assert v.camera_position == [10.0, 20.0, 30.0]

    def test_set_camera_target(self):
        v = PotreeViewer()
        v.set_camera_target(5.0, 10.0, 15.0)
        assert v.camera_target == [5.0, 10.0, 15.0]

    def test_fly_to_point_cloud(self):
        v = PotreeViewer()
        v.fly_to_point_cloud("cloud1")
        calls = [c for c in v._js_calls if c["method"] == "flyToPointCloud"]
        assert len(calls) == 1

    def test_reset_camera(self):
        v = PotreeViewer()
        v.reset_camera()
        calls = [c for c in v._js_calls if c["method"] == "resetCamera"]
        assert len(calls) == 1


class TestVisualizationSettings:
    """Tests for visualization setting methods."""

    def test_set_point_budget(self):
        v = PotreeViewer()
        v.set_point_budget(2000000)
        assert v.point_budget == 2000000

    def test_set_point_size(self):
        v = PotreeViewer()
        v.set_point_size(3.0)
        assert v.point_size == 3.0

    def test_set_fov(self):
        v = PotreeViewer()
        v.set_fov(90.0)
        assert v.fov == 90.0

    def test_set_background(self):
        v = PotreeViewer()
        v.set_background("#333333")
        assert v.background == "#333333"

    def test_set_edl(self):
        v = PotreeViewer()
        v.set_edl(enabled=True, radius=2.0, strength=0.8)
        assert v.edl_enabled is True
        assert v.edl_radius == 2.0
        assert v.edl_strength == 0.8

    def test_set_edl_disabled(self):
        v = PotreeViewer()
        v.set_edl(enabled=False)
        assert v.edl_enabled is False


class TestMeasurementTools:
    """Tests for measurement tool methods."""

    def test_add_measurement_tool(self):
        v = PotreeViewer()
        v.add_measurement_tool("distance")
        calls = [c for c in v._js_calls if c["method"] == "addMeasurementTool"]
        assert len(calls) == 1

    def test_clear_measurements(self):
        v = PotreeViewer()
        v.clear_measurements()
        calls = [c for c in v._js_calls if c["method"] == "clearMeasurements"]
        assert len(calls) == 1
