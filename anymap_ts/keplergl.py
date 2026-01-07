"""KeplerGL map widget implementation.

KeplerGL is loaded via CDN since it's React-based and requires complex setup.
This implementation provides a Python wrapper with data management capabilities.
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import traitlets

from .base import MapWidget

# Path to bundled static assets
STATIC_DIR = Path(__file__).parent / "static"


class KeplerGLMap(MapWidget):
    """Interactive map widget using KeplerGL.

    KeplerGL is a powerful data visualization tool built on top of deck.gl.
    This class provides a Python interface for adding data and configuring
    the KeplerGL visualization.

    Note: KeplerGL is loaded from CDN due to its React-based architecture.

    Example:
        >>> from anymap_ts import KeplerGLMap
        >>> import pandas as pd
        >>> m = KeplerGLMap()
        >>> df = pd.DataFrame({
        ...     'lat': [37.7749, 37.8044],
        ...     'lng': [-122.4194, -122.2712],
        ...     'value': [100, 200]
        ... })
        >>> m.add_data(df, name='points')
        >>> m
    """

    # KeplerGL-specific traits
    config = traitlets.Dict({}).tag(sync=True)
    datasets = traitlets.Dict({}).tag(sync=True)
    read_only = traitlets.Bool(False).tag(sync=True)
    show_data_table = traitlets.Bool(True).tag(sync=True)

    # Mapbox token for basemaps
    mapbox_token = traitlets.Unicode("").tag(sync=True)

    def __init__(
        self,
        center: Tuple[float, float] = (-122.4, 37.8),
        zoom: float = 10.0,
        width: str = "100%",
        height: str = "600px",
        config: Optional[Dict] = None,
        read_only: bool = False,
        show_data_table: bool = True,
        mapbox_token: Optional[str] = None,
        **kwargs,
    ):
        """Initialize a KeplerGL map.

        Args:
            center: Map center as (longitude, latitude).
            zoom: Initial zoom level.
            width: Widget width as CSS string.
            height: Widget height as CSS string.
            config: KeplerGL configuration dict.
            read_only: Whether the UI is read-only.
            show_data_table: Whether to show the data table panel.
            mapbox_token: Mapbox access token for basemaps.
            **kwargs: Additional widget arguments.
        """
        import os

        if mapbox_token is None:
            mapbox_token = os.environ.get("MAPBOX_TOKEN", "")

        super().__init__(
            center=list(center),
            zoom=zoom,
            width=width,
            height=height,
            config=config or {},
            read_only=read_only,
            show_data_table=show_data_table,
            mapbox_token=mapbox_token,
            **kwargs,
        )
        self.datasets = {}

    # -------------------------------------------------------------------------
    # Data Methods
    # -------------------------------------------------------------------------

    def add_data(
        self,
        data: Any,
        name: Optional[str] = None,
    ) -> None:
        """Add data to the map.

        Args:
            data: Data to add (DataFrame, GeoDataFrame, dict, or file path).
            name: Dataset name/label.
        """
        dataset_id = name or f"data_{uuid.uuid4().hex[:8]}"
        processed_data = self._process_data(data)

        self.datasets = {
            **self.datasets,
            dataset_id: {
                "info": {
                    "id": dataset_id,
                    "label": dataset_id,
                },
                "data": processed_data,
            },
        }

        self.call_js_method(
            "addData",
            dataId=dataset_id,
            data=processed_data,
        )

    def _process_data(self, data: Any) -> Dict:
        """Process data into KeplerGL format.

        Args:
            data: Input data.

        Returns:
            Processed data dict with fields and rows.
        """
        # Handle DataFrame
        if hasattr(data, "to_dict"):
            # Check if it's a GeoDataFrame
            if hasattr(data, "geometry"):
                # Convert to GeoJSON for geometry columns
                geojson = json.loads(data.to_json())
                return {
                    "type": "geojson",
                    "data": geojson,
                }
            else:
                # Regular DataFrame
                fields = []
                for col in data.columns:
                    dtype = str(data[col].dtype)
                    if "int" in dtype:
                        field_type = "integer"
                    elif "float" in dtype:
                        field_type = "real"
                    elif "datetime" in dtype:
                        field_type = "timestamp"
                    elif "bool" in dtype:
                        field_type = "boolean"
                    else:
                        field_type = "string"

                    fields.append({"name": col, "type": field_type})

                # Convert to list of lists
                rows = data.values.tolist()

                return {
                    "fields": fields,
                    "rows": rows,
                }

        # Handle dict (assume it's already GeoJSON or processed)
        if isinstance(data, dict):
            if "type" in data and data["type"] in [
                "FeatureCollection",
                "Feature",
                "Point",
                "LineString",
                "Polygon",
                "MultiPoint",
                "MultiLineString",
                "MultiPolygon",
            ]:
                return {"type": "geojson", "data": data}
            return data

        # Handle file path
        if isinstance(data, (str, Path)):
            path = Path(data)
            if path.exists():
                if path.suffix.lower() in [".geojson", ".json"]:
                    with open(path) as f:
                        geojson = json.load(f)
                    return {"type": "geojson", "data": geojson}
                elif path.suffix.lower() == ".csv":
                    try:
                        import pandas as pd

                        df = pd.read_csv(path)
                        return self._process_data(df)
                    except ImportError:
                        raise ImportError(
                            "pandas is required to load CSV files. "
                            "Install with: pip install pandas"
                        )

        return data

    def remove_data(self, name: str) -> None:
        """Remove a dataset.

        Args:
            name: Dataset name to remove.
        """
        if name in self.datasets:
            datasets = dict(self.datasets)
            del datasets[name]
            self.datasets = datasets
        self.call_js_method("removeData", dataId=name)

    # -------------------------------------------------------------------------
    # Configuration Methods
    # -------------------------------------------------------------------------

    def set_config(self, config: Dict) -> None:
        """Set the KeplerGL configuration.

        Args:
            config: Configuration dict.
        """
        self.config = config
        self.call_js_method("setConfig", config=config)

    def get_config(self) -> Dict:
        """Get the current KeplerGL configuration.

        Returns:
            Configuration dict.
        """
        return self.config

    def save_config(self, filepath: Union[str, Path]) -> None:
        """Save configuration to a JSON file.

        Args:
            filepath: Path to save the configuration.
        """
        with open(filepath, "w") as f:
            json.dump(self.config, f, indent=2)

    def load_config(self, filepath: Union[str, Path]) -> None:
        """Load configuration from a JSON file.

        Args:
            filepath: Path to the configuration file.
        """
        with open(filepath) as f:
            config = json.load(f)
        self.set_config(config)

    # -------------------------------------------------------------------------
    # Filter Methods
    # -------------------------------------------------------------------------

    def add_filter(
        self,
        data_id: str,
        field: str,
        filter_type: str = "range",
        value: Optional[Any] = None,
    ) -> None:
        """Add a filter to the visualization.

        Args:
            data_id: Dataset ID to filter.
            field: Field name to filter on.
            filter_type: Type of filter ('range', 'select', 'time').
            value: Filter value(s).
        """
        filter_config = {
            "dataId": [data_id],
            "name": [field],
            "type": filter_type,
        }
        if value is not None:
            filter_config["value"] = value

        self.call_js_method("addFilter", filter=filter_config)

    # -------------------------------------------------------------------------
    # Layer Methods
    # -------------------------------------------------------------------------

    def add_layer(
        self,
        layer_type: str,
        data_id: str,
        columns: Dict[str, str],
        label: Optional[str] = None,
        color: Optional[List[int]] = None,
        vis_config: Optional[Dict] = None,
        **kwargs,
    ) -> None:
        """Add a layer to the visualization.

        Args:
            layer_type: Layer type ('point', 'arc', 'line', 'hexagon', 'heatmap', etc.).
            data_id: Dataset ID for the layer.
            columns: Column mapping (e.g., {'lat': 'latitude', 'lng': 'longitude'}).
            label: Layer label.
            color: Layer color as [r, g, b].
            vis_config: Visual configuration.
            **kwargs: Additional layer options.
        """
        layer_config = {
            "type": layer_type,
            "config": {
                "dataId": data_id,
                "label": label or f"{layer_type}_layer",
                "columns": columns,
                "isVisible": True,
            },
        }
        if color:
            layer_config["config"]["color"] = color
        if vis_config:
            layer_config["config"]["visConfig"] = vis_config

        layer_config["config"].update(kwargs)

        self.call_js_method("addLayer", layer=layer_config)

    # -------------------------------------------------------------------------
    # View Methods
    # -------------------------------------------------------------------------

    def fly_to(
        self,
        lng: float,
        lat: float,
        zoom: Optional[float] = None,
    ) -> None:
        """Fly to a location.

        Args:
            lng: Target longitude.
            lat: Target latitude.
            zoom: Target zoom level.
        """
        self.center = [lng, lat]
        if zoom is not None:
            self.zoom = zoom
        self.call_js_method("flyTo", lng=lng, lat=lat, zoom=zoom or self.zoom)

    # -------------------------------------------------------------------------
    # HTML Export
    # -------------------------------------------------------------------------

    def _generate_html_template(self) -> str:
        """Generate standalone HTML for KeplerGL."""
        template_path = Path(__file__).parent / "templates" / "keplergl.html"

        if template_path.exists():
            template = template_path.read_text(encoding="utf-8")
        else:
            template = self._get_default_template()

        state = {
            "center": self.center,
            "zoom": self.zoom,
            "config": self.config,
            "datasets": self.datasets,
            "read_only": self.read_only,
            "mapbox_token": self.mapbox_token,
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
    <title>KeplerGL Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        #app { position: absolute; top: 0; bottom: 0; width: 100%; }
    </style>
</head>
<body>
    <div id="app"></div>
    <script>
        const state = {{state}};
        // KeplerGL requires React/Redux setup - simplified placeholder
        document.getElementById('app').innerHTML = '<p>KeplerGL visualization requires full React setup. Use Jupyter widget for interactive visualization.</p>';
    </script>
</body>
</html>"""

    def _repr_html_(self) -> str:
        """Return HTML representation for Jupyter (uses iframe with CDN KeplerGL)."""
        state = {
            "center": self.center,
            "zoom": self.zoom,
            "config": self.config,
            "datasets": self.datasets,
            "mapbox_token": self.mapbox_token,
        }

        html = f"""
        <iframe
            srcdoc='
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <script src="https://unpkg.com/react@16.8.4/umd/react.production.min.js"></script>
                <script src="https://unpkg.com/react-dom@16.8.4/umd/react-dom.production.min.js"></script>
                <script src="https://unpkg.com/kepler.gl@3.0.0/umd/keplergl.min.js"></script>
                <link href="https://unpkg.com/kepler.gl@3.0.0/umd/keplergl.min.css" rel="stylesheet" />
                <style>
                    body {{ margin: 0; padding: 0; overflow: hidden; }}
                    #app {{ width: 100vw; height: 100vh; }}
                </style>
            </head>
            <body>
                <div id="app"></div>
                <script>
                    const state = {json.dumps(state)};
                    // KeplerGL requires complex React setup
                    document.getElementById("app").innerHTML = "KeplerGL widget - use anywidget interface for full interactivity";
                </script>
            </body>
            </html>
            '
            width="{self.width}"
            height="{self.height}"
            frameborder="0"
        ></iframe>
        """
        return html
