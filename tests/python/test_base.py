"""Tests for the MapWidget base class."""

import pytest
from unittest.mock import MagicMock, patch

from anymap_ts.base import MapWidget


class _TestWidget(MapWidget):
    """Concrete subclass for testing the abstract base."""

    _esm = ""

    def _generate_html_template(self):
        return "<html><head><title>{{title}}</title></head><body>map</body></html>"


class TestMapWidgetInit:
    """Tests for MapWidget initialization and default traitlets."""

    def test_default_center(self):
        w = _TestWidget()
        assert w.center == [0.0, 0.0]

    def test_default_zoom(self):
        w = _TestWidget()
        assert w.zoom == 2.0

    def test_default_width(self):
        w = _TestWidget()
        assert w.width == "100%"

    def test_default_height(self):
        w = _TestWidget()
        assert w.height == "400px"

    def test_default_max_pitch(self):
        w = _TestWidget()
        assert w.max_pitch == 85.0

    def test_custom_init(self):
        w = _TestWidget(center=[10, 20], zoom=5.0, width="800px", height="600px")
        assert w.center == [10, 20]
        assert w.zoom == 5.0
        assert w.width == "800px"
        assert w.height == "600px"

    def test_empty_initial_state(self):
        w = _TestWidget()
        assert w._js_calls == []
        assert w._js_events == []
        assert w._layers == {}
        assert w._sources == {}
        assert w._controls == {}
        assert w.clicked == {}
        assert w.current_bounds == []
        assert w.current_center == []
        assert w.current_zoom == 0.0
        assert w._draw_data == {}
        assert w._queried_features == {}


class TestCallJsMethod:
    """Tests for call_js_method."""

    def test_basic_call(self):
        w = _TestWidget()
        w.call_js_method("flyTo", 10.0, 20.0)
        assert len(w._js_calls) == 1
        call = w._js_calls[0]
        assert call["method"] == "flyTo"
        assert call["args"] == [10.0, 20.0]
        assert call["kwargs"] == {}

    def test_call_with_kwargs(self):
        w = _TestWidget()
        w.call_js_method("flyTo", 10.0, 20.0, zoom=5, duration=2000)
        call = w._js_calls[0]
        assert call["kwargs"] == {"zoom": 5, "duration": 2000}

    def test_increments_counter(self):
        w = _TestWidget()
        w.call_js_method("a")
        w.call_js_method("b")
        assert w._js_method_counter == 2
        assert w._js_calls[0]["id"] == 1
        assert w._js_calls[1]["id"] == 2

    def test_multiple_calls_accumulate(self):
        w = _TestWidget()
        w.call_js_method("a")
        w.call_js_method("b")
        w.call_js_method("c")
        assert len(w._js_calls) == 3


class TestSetCenter:
    """Tests for set_center."""

    def test_set_center(self):
        w = _TestWidget()
        w.set_center(-122.4, 37.8)
        assert w.center == [-122.4, 37.8]


class TestSetZoom:
    """Tests for set_zoom."""

    def test_set_zoom(self):
        w = _TestWidget()
        w.set_zoom(10.0)
        assert w.zoom == 10.0


class TestFlyTo:
    """Tests for fly_to."""

    def test_fly_to_default_duration(self):
        w = _TestWidget()
        w.fly_to(-122.4, 37.8)
        call = w._js_calls[0]
        assert call["method"] == "flyTo"
        assert call["args"] == [-122.4, 37.8]
        assert call["kwargs"]["duration"] == 2000
        assert call["kwargs"]["zoom"] is None

    def test_fly_to_with_zoom(self):
        w = _TestWidget()
        w.fly_to(-122.4, 37.8, zoom=10)
        call = w._js_calls[0]
        assert call["kwargs"]["zoom"] == 10


class TestFitBounds:
    """Tests for fit_bounds."""

    def test_fit_bounds_default(self):
        w = _TestWidget()
        w.fit_bounds([-122.5, 37.7, -122.3, 37.9])
        call = w._js_calls[0]
        assert call["method"] == "fitBounds"
        assert call["args"] == [[-122.5, 37.7, -122.3, 37.9]]
        assert call["kwargs"]["padding"] == 50
        assert call["kwargs"]["duration"] == 1000

    def test_fit_bounds_custom(self):
        w = _TestWidget()
        w.fit_bounds([-122.5, 37.7, -122.3, 37.9], padding=100, duration=500)
        call = w._js_calls[0]
        assert call["kwargs"]["padding"] == 100
        assert call["kwargs"]["duration"] == 500


class TestViewstate:
    """Tests for viewstate property."""

    def test_viewstate_defaults(self):
        w = _TestWidget()
        vs = w.viewstate
        assert vs["center"] == [0.0, 0.0]
        assert vs["zoom"] == 2.0
        assert vs["bounds"] == []

    def test_viewstate_uses_current_if_available(self):
        w = _TestWidget()
        w.current_center = [-122.4, 37.8]
        w.current_zoom = 10.0
        w.current_bounds = [-122.5, 37.7, -122.3, 37.9]
        vs = w.viewstate
        assert vs["center"] == [-122.4, 37.8]
        assert vs["zoom"] == 10.0
        assert vs["bounds"] == [-122.5, 37.7, -122.3, 37.9]


class TestEventHandlers:
    """Tests for on_map_event / off_map_event / _handle_js_events."""

    def test_register_handler(self):
        w = _TestWidget()
        handler = MagicMock()
        w.on_map_event("click", handler)
        assert "click" in w._event_handlers
        assert handler in w._event_handlers["click"]

    def test_multiple_handlers(self):
        w = _TestWidget()
        h1 = MagicMock()
        h2 = MagicMock()
        w.on_map_event("click", h1)
        w.on_map_event("click", h2)
        assert len(w._event_handlers["click"]) == 2

    def test_off_specific_handler(self):
        w = _TestWidget()
        h1 = MagicMock()
        h2 = MagicMock()
        w.on_map_event("click", h1)
        w.on_map_event("click", h2)
        w.off_map_event("click", h1)
        assert h1 not in w._event_handlers["click"]
        assert h2 in w._event_handlers["click"]

    def test_off_all_handlers(self):
        w = _TestWidget()
        h1 = MagicMock()
        w.on_map_event("click", h1)
        w.off_map_event("click")
        assert "click" not in w._event_handlers

    def test_handle_js_events(self):
        w = _TestWidget()
        handler = MagicMock()
        w.on_map_event("click", handler)
        w._handle_js_events(
            {"new": [{"type": "click", "data": {"lng": 10, "lat": 20}}]}
        )
        handler.assert_called_once_with({"lng": 10, "lat": 20})
        assert w._js_events == []

    def test_handle_unregistered_event(self):
        w = _TestWidget()
        w._handle_js_events({"new": [{"type": "moveend", "data": {}}]})

    def test_handler_exception_does_not_crash(self, capsys):
        w = _TestWidget()

        def bad_handler(data):
            raise RuntimeError("boom")

        w.on_map_event("click", bad_handler)
        w._handle_js_events({"new": [{"type": "click", "data": {}}]})
        captured = capsys.readouterr()
        assert "boom" in captured.out


class TestToHtml:
    """Tests for to_html."""

    def test_returns_string(self):
        w = _TestWidget()
        html = w.to_html()
        assert isinstance(html, str)
        assert "<html>" in html

    def test_title_substitution(self):
        w = _TestWidget()
        html = w.to_html(title="My Map")
        assert "My Map" in html

    def test_writes_file(self, tmp_path):
        w = _TestWidget()
        fpath = tmp_path / "map.html"
        result = w.to_html(filepath=str(fpath))
        assert result is None
        assert fpath.exists()
        content = fpath.read_text()
        assert "<html>" in content

    def test_generate_html_not_implemented(self):
        w = MapWidget()
        with pytest.raises(NotImplementedError):
            w._generate_html_template()
