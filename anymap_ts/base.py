"""Base MapWidget class for all map implementations."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import anywidget
import traitlets


class MapWidget(anywidget.AnyWidget):
    """Base class for interactive map widgets.

    This class provides the core functionality for Python-JavaScript communication
    using anywidget's traitlet synchronization system.
    """

    # Synchronized traits for map state
    center = traitlets.List([0.0, 0.0]).tag(sync=True)
    zoom = traitlets.Float(2.0).tag(sync=True)
    width = traitlets.Unicode("100%").tag(sync=True)
    height = traitlets.Unicode("400px").tag(sync=True)
    style = traitlets.Union([traitlets.Unicode(), traitlets.Dict()]).tag(sync=True)

    # JavaScript method call queue
    _js_calls = traitlets.List([]).tag(sync=True)
    _js_method_counter = traitlets.Int(0)

    # Events from JavaScript
    _js_events = traitlets.List([]).tag(sync=True)

    # State persistence for layers, sources, and controls
    _layers = traitlets.Dict({}).tag(sync=True)
    _sources = traitlets.Dict({}).tag(sync=True)
    _controls = traitlets.Dict({}).tag(sync=True)

    # Interaction state
    clicked = traitlets.Dict({}).tag(sync=True)
    current_bounds = traitlets.List([]).tag(sync=True)
    current_center = traitlets.List([]).tag(sync=True)
    current_zoom = traitlets.Float(0.0).tag(sync=True)

    # Drawing data
    _draw_data = traitlets.Dict({}).tag(sync=True)

    def __init__(self, **kwargs):
        """Initialize the MapWidget.

        Args:
            **kwargs: Additional widget arguments
        """
        super().__init__(**kwargs)
        self._event_handlers: Dict[str, List[Callable]] = {}
        self.observe(self._handle_js_events, names=["_js_events"])

    def _handle_js_events(self, change: Dict[str, Any]) -> None:
        """Process events received from JavaScript.

        Args:
            change: Traitlet change dict
        """
        events = change.get("new", [])
        for event in events:
            event_type = event.get("type")
            if event_type in self._event_handlers:
                for handler in self._event_handlers[event_type]:
                    try:
                        handler(event.get("data"))
                    except Exception as e:
                        print(f"Error in event handler for {event_type}: {e}")
        # Clear processed events
        self._js_events = []

    def call_js_method(self, method: str, *args, **kwargs) -> None:
        """Queue a JavaScript method call.

        Args:
            method: Name of the JavaScript method to call
            *args: Positional arguments for the method
            **kwargs: Keyword arguments for the method
        """
        self._js_method_counter += 1
        call = {
            "id": self._js_method_counter,
            "method": method,
            "args": list(args),
            "kwargs": kwargs,
        }
        self._js_calls = self._js_calls + [call]

    def on_map_event(self, event_type: str, handler: Callable) -> None:
        """Register an event handler.

        Args:
            event_type: Type of event (e.g., 'click', 'moveend')
            handler: Callback function to handle the event
        """
        if event_type not in self._event_handlers:
            self._event_handlers[event_type] = []
        self._event_handlers[event_type].append(handler)

    def off_map_event(
        self, event_type: str, handler: Optional[Callable] = None
    ) -> None:
        """Unregister an event handler.

        Args:
            event_type: Type of event
            handler: Specific handler to remove. If None, removes all handlers.
        """
        if event_type in self._event_handlers:
            if handler is None:
                del self._event_handlers[event_type]
            else:
                self._event_handlers[event_type] = [
                    h for h in self._event_handlers[event_type] if h != handler
                ]

    def set_center(self, lng: float, lat: float) -> None:
        """Set the map center.

        Args:
            lng: Longitude
            lat: Latitude
        """
        self.center = [lng, lat]

    def set_zoom(self, zoom: float) -> None:
        """Set the map zoom level.

        Args:
            zoom: Zoom level
        """
        self.zoom = zoom

    def fly_to(
        self,
        lng: float,
        lat: float,
        zoom: Optional[float] = None,
        duration: int = 2000,
    ) -> None:
        """Fly to a location with animation.

        Args:
            lng: Longitude
            lat: Latitude
            zoom: Optional zoom level
            duration: Animation duration in milliseconds
        """
        self.call_js_method("flyTo", lng, lat, zoom=zoom, duration=duration)

    def fit_bounds(
        self,
        bounds: List[float],
        padding: int = 50,
        duration: int = 1000,
    ) -> None:
        """Fit the map to the given bounds.

        Args:
            bounds: [west, south, east, north] bounds
            padding: Padding in pixels
            duration: Animation duration in milliseconds
        """
        self.call_js_method("fitBounds", bounds, padding=padding, duration=duration)

    @property
    def viewstate(self) -> Dict[str, Any]:
        """Get current view state."""
        return {
            "center": self.current_center or self.center,
            "zoom": self.current_zoom or self.zoom,
            "bounds": self.current_bounds,
        }

    def _generate_html_template(self) -> str:
        """Generate HTML template for standalone export.

        Override in subclasses for library-specific templates.
        """
        raise NotImplementedError("Subclasses must implement _generate_html_template")

    def to_html(
        self,
        filepath: Optional[Union[str, Path]] = None,
        title: str = "Interactive Map",
    ) -> Optional[str]:
        """Export map to standalone HTML file.

        Args:
            filepath: Path to save the HTML file. If None, returns HTML string.
            title: Title for the HTML page.

        Returns:
            HTML string if filepath is None, otherwise None.
        """
        html = self._generate_html_template()
        html = html.replace("{{title}}", title)

        if filepath:
            Path(filepath).write_text(html, encoding="utf-8")
            return None
        return html
