# anymap-ts

A Python package for creating interactive maps with [anywidget](https://anywidget.dev/) using TypeScript. Currently supports [MapLibre GL JS](https://maplibre.org/) with plans to support additional mapping libraries.

[![PyPI version](https://badge.fury.io/py/anymap-ts.svg)](https://badge.fury.io/py/anymap-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Interactive maps in Jupyter notebooks with MapLibre GL JS
- Bidirectional Python-JavaScript communication via anywidget
- Drawing and geometry editing with [maplibre-gl-geo-editor](https://www.npmjs.com/package/maplibre-gl-geo-editor)
- Layer control with [maplibre-gl-layer-control](https://www.npmjs.com/package/maplibre-gl-layer-control)
- Multiple basemap providers via [xyzservices](https://xyzservices.readthedocs.io/)
- Export to standalone HTML
- TypeScript-based frontend for type safety and maintainability

## Installation

### From PyPI (when published)

```bash
pip install anymap-ts
```

### From source (development)

```bash
git clone https://github.com/opengeos/anymap-ts.git
cd anymap-ts
pip install -e ".[dev]"
```

### Optional dependencies

```bash
# For vector data support (GeoDataFrame)
pip install anymap-ts[vector]

# For local raster support (localtileserver)
pip install anymap-ts[raster]

# All optional dependencies
pip install anymap-ts[all]
```

## Quick Start

### Basic Map

```python
from anymap_ts import Map

# Create a map centered on a location
m = Map(center=[-122.4, 37.8], zoom=10)
m
```

### Add Basemap

```python
from anymap_ts import Map

m = Map(center=[0, 0], zoom=2)

# Add OpenStreetMap basemap
m.add_basemap("OpenStreetMap")

# Or use other providers
m.add_basemap("CartoDB.Positron")
m.add_basemap("Esri.WorldImagery")

m
```

### Add Vector Data

```python
from anymap_ts import Map

m = Map(center=[-122.4, 37.8], zoom=10)

# Add GeoJSON data
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-122.4, 37.8]},
            "properties": {"name": "San Francisco"}
        }
    ]
}
m.add_vector(geojson, name="points")

# Or with GeoDataFrame (requires geopandas)
import geopandas as gpd
gdf = gpd.read_file("path/to/data.geojson")
m.add_vector(gdf, name="polygons", layer_type="fill")

m
```

### Add Tile Layer

```python
from anymap_ts import Map

m = Map(center=[0, 0], zoom=2)

# Add custom XYZ tiles
m.add_tile_layer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    name="osm",
    attribution="(C) OpenStreetMap contributors"
)

m
```

### Add Layer Control

```python
from anymap_ts import Map

m = Map()
m.add_basemap("OpenStreetMap")
m.add_vector(geojson, name="data")

# Add layer control for visibility/opacity
m.add_layer_control()

m
```

### Drawing and Editing

```python
from anymap_ts import Map

m = Map(center=[0, 0], zoom=2)

# Add drawing control
m.add_draw_control(
    position="top-right",
    draw_modes=["polygon", "line", "marker"],
    edit_modes=["select", "drag", "delete"]
)

# Get drawn features
features = m.get_draw_data()

# Load existing features
m.load_draw_data(geojson)

# Save to file (requires geopandas)
m.save_draw_data("output.geojson")

m
```

### Map Navigation

```python
from anymap_ts import Map

m = Map()

# Set center and zoom
m.set_center(-122.4, 37.8)
m.set_zoom(12)

# Fly to location with animation
m.fly_to(-122.4, 37.8, zoom=14, duration=2000)

# Fit to bounds [west, south, east, north]
m.fit_bounds([-123, 37, -122, 38])

m
```

### Add Controls

```python
from anymap_ts import Map

m = Map(controls=None)  # Start with no controls

# Add individual controls
m.add_control("navigation", position="top-right")
m.add_control("scale", position="bottom-left")
m.add_control("fullscreen", position="top-right")

m
```

### Export to HTML

```python
from anymap_ts import Map

m = Map(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")

# Save to file
m.to_html("map.html", title="My Map")

# Or get HTML string
html = m.to_html()
```

### Event Handling

```python
from anymap_ts import Map

m = Map()

# Register click handler
def on_click(data):
    print(f"Clicked at: {data['lngLat']}")

m.on_map_event("click", on_click)

# Access click data
print(m.clicked)  # {'lng': ..., 'lat': ..., 'point': [...]}

m
```

## API Reference

### Map Class

```python
Map(
    center=(0.0, 0.0),    # (longitude, latitude)
    zoom=2.0,              # Initial zoom level
    width="100%",          # CSS width
    height="400px",        # CSS height
    style="...",           # MapLibre style URL or object
    bearing=0.0,           # Map bearing in degrees
    pitch=0.0,             # Map pitch in degrees
    controls=None,         # Dict of controls to add
)
```

### Methods

| Method | Description |
|--------|-------------|
| `add_basemap(name)` | Add a basemap layer |
| `add_vector(data, layer_type, paint, name)` | Add vector data |
| `add_tile_layer(url, name, attribution)` | Add XYZ tile layer |
| `add_raster(source, name)` | Add local raster (requires localtileserver) |
| `add_layer(layer_id, layer_type, source, paint)` | Add generic layer |
| `remove_layer(layer_id)` | Remove a layer |
| `set_visibility(layer_id, visible)` | Set layer visibility |
| `set_opacity(layer_id, opacity)` | Set layer opacity |
| `add_control(type, position)` | Add a map control |
| `add_layer_control(layers, position)` | Add layer control |
| `add_draw_control(position, draw_modes, edit_modes)` | Add drawing control |
| `get_draw_data()` | Get drawn features as GeoJSON |
| `load_draw_data(geojson)` | Load GeoJSON into draw layer |
| `clear_draw_data()` | Clear drawn features |
| `save_draw_data(filepath)` | Save draw data to file |
| `set_center(lng, lat)` | Set map center |
| `set_zoom(zoom)` | Set zoom level |
| `fly_to(lng, lat, zoom, duration)` | Fly to location |
| `fit_bounds(bounds, padding)` | Fit map to bounds |
| `on_map_event(event_type, handler)` | Register event handler |
| `to_html(filepath, title)` | Export to HTML |

### Properties

| Property | Description |
|----------|-------------|
| `center` | Map center [lng, lat] |
| `zoom` | Current zoom level |
| `clicked` | Last clicked location |
| `draw_data` | Current drawn features |
| `viewstate` | Current view state (center, zoom, bounds) |

## Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/opengeos/anymap-ts.git
cd anymap-ts

# Install Python package in development mode
pip install -e ".[dev]"

# Install Node.js dependencies
npm install
```

### Build TypeScript

```bash
# Development build
npm run build

# Watch mode for development
npm run watch

# Production build (minified)
npm run build:prod

# Type checking
npm run typecheck
```

### Run Tests

```bash
# Python tests
pytest

# TypeScript tests
npm test
```

### Project Structure

```
anymap-ts/
├── src/                    # TypeScript source
│   ├── core/               # Base classes
│   ├── maplibre/           # MapLibre implementation
│   │   ├── index.ts        # ESM entry point
│   │   ├── MapLibreRenderer.ts
│   │   └── plugins/        # Plugin integrations
│   ├── types/              # Type definitions
│   └── styles/             # CSS styles
├── anymap_ts/              # Python package
│   ├── __init__.py
│   ├── base.py             # MapWidget base class
│   ├── maplibre.py         # MapLibreMap class
│   ├── basemaps.py         # Basemap providers
│   ├── utils.py            # Utilities
│   ├── static/             # Built JS/CSS (generated)
│   └── templates/          # HTML export templates
├── tests/                  # Test files
├── package.json            # Node.js config
├── pyproject.toml          # Python config
└── tsconfig.json           # TypeScript config
```

### Adding New Features

1. **Python side**: Add methods to `anymap_ts/maplibre.py`
2. **TypeScript side**: Add handlers to `src/maplibre/MapLibreRenderer.ts`
3. Register the method with `this.registerMethod()`
4. Rebuild with `npm run build`

## Dependencies

### Python
- [anywidget](https://anywidget.dev/) - Widget framework
- [traitlets](https://traitlets.readthedocs.io/) - Reactive properties
- [xyzservices](https://xyzservices.readthedocs.io/) - Basemap providers

### TypeScript/npm
- [maplibre-gl](https://maplibre.org/) - Map rendering
- [maplibre-gl-geo-editor](https://www.npmjs.com/package/maplibre-gl-geo-editor) - Drawing/editing
- [maplibre-gl-layer-control](https://www.npmjs.com/package/maplibre-gl-layer-control) - Layer control
- [@geoman-io/maplibre-geoman-free](https://geoman.io/) - Geometry editing

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- [MapLibre GL JS](https://maplibre.org/) for map rendering
- [anywidget](https://anywidget.dev/) for the widget framework
- [Geoman](https://geoman.io/) for geometry editing
- [xyzservices](https://xyzservices.readthedocs.io/) for basemap providers
