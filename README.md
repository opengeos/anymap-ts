# anymap-ts

A Python package for creating interactive maps with [anywidget](https://anywidget.dev/) using TypeScript. Supports multiple mapping libraries including MapLibre GL JS, Mapbox GL JS, Leaflet, OpenLayers, DeckGL, Cesium, KeplerGL, and Potree.

[![PyPI version](https://badge.fury.io/py/anymap-ts.svg)](https://badge.fury.io/py/anymap-ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Supported Libraries

| Library | Description | Use Case |
|---------|-------------|----------|
| **MapLibre GL JS** | Open-source vector maps | Default, general-purpose mapping |
| **Mapbox GL JS** | Commercial vector maps | Advanced styling, 3D terrain |
| **Leaflet** | Lightweight, mobile-friendly | Simple maps, broad compatibility |
| **OpenLayers** | Feature-rich, enterprise | WMS/WMTS, projections |
| **DeckGL** | GPU-accelerated | Large-scale data visualization |
| **Cesium** | 3D globe | 3D Tiles, terrain, global views |
| **KeplerGL** | Data exploration | Interactive data analysis |
| **Potree** | Point clouds | LiDAR visualization |

## Features

- Interactive maps in Jupyter notebooks
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

### MapLibre GL JS (Default)

```python
from anymap_ts import Map

# Create a map centered on a location
m = Map(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_draw_control()
m
```

### Mapbox GL JS

```python
import os
from anymap_ts import MapboxMap

# Set your Mapbox token (or use MAPBOX_TOKEN env var)
m = MapboxMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m
```

### Leaflet

```python
from anymap_ts import LeafletMap

m = LeafletMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_marker(-122.4194, 37.7749, popup="San Francisco")
m
```

### OpenLayers

```python
from anymap_ts import OpenLayersMap

m = OpenLayersMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")

# Add WMS layer
m.add_wms_layer(
    url="https://example.com/wms",
    layers="layer_name",
    name="WMS Layer"
)
m
```

### DeckGL

```python
from anymap_ts import DeckGLMap

m = DeckGLMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("CartoDB.DarkMatter")

# Add scatterplot layer
points = [{"coordinates": [-122.4, 37.8], "value": 100}]
m.add_scatterplot_layer(data=points, get_radius=100)

# Add hexagon aggregation
m.add_hexagon_layer(data=points, radius=500, extruded=True)
m
```

### Cesium (3D Globe)

```python
from anymap_ts import CesiumMap

# Set CESIUM_TOKEN env var for terrain/3D Tiles
m = CesiumMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.set_terrain()  # Enable Cesium World Terrain
m.fly_to(-122.4194, 37.7749, height=50000, heading=45, pitch=-45)
m
```

### KeplerGL

```python
from anymap_ts import KeplerGLMap
import pandas as pd

m = KeplerGLMap(center=[-122.4, 37.8], zoom=10)

# Add DataFrame data
df = pd.DataFrame({
    'latitude': [37.7749, 37.8044],
    'longitude': [-122.4194, -122.2712],
    'value': [100, 200]
})
m.add_data(df, name='points')
m
```

### Potree (Point Clouds)

```python
from anymap_ts import PotreeViewer

viewer = PotreeViewer(
    point_budget=1000000,
    edl_enabled=True
)
viewer.load_point_cloud("path/to/pointcloud/cloud.js", name="lidar")
viewer
```

## Common Features

### Add Vector Data

```python
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

# Works with MapLibre, Mapbox, Leaflet, OpenLayers
m.add_vector(geojson, name="points")

# Or with GeoDataFrame (requires geopandas)
import geopandas as gpd
gdf = gpd.read_file("path/to/data.geojson")
m.add_vector(gdf, name="polygons")
```

### Map Navigation

```python
# Fly to location with animation
m.fly_to(-122.4, 37.8, zoom=14)

# Fit to bounds [west, south, east, north]
m.fit_bounds([-123, 37, -122, 38])
```

### Export to HTML

```python
# All map types support HTML export
m.to_html("map.html", title="My Map")
```

## Environment Variables

| Variable | Library | Description |
|----------|---------|-------------|
| `MAPBOX_TOKEN` | Mapbox, KeplerGL | Mapbox access token |
| `CESIUM_TOKEN` | Cesium | Cesium Ion access token |

## API Reference

### Map Classes

| Class | Base Library | Key Features |
|-------|--------------|--------------|
| `Map` / `MapLibreMap` | MapLibre GL JS | Vector tiles, drawing, layer control |
| `MapboxMap` | Mapbox GL JS | 3D terrain, Mapbox styles |
| `LeafletMap` | Leaflet | Lightweight, plugins |
| `OpenLayersMap` | OpenLayers | WMS/WMTS, projections |
| `DeckGLMap` | DeckGL + MapLibre | GPU layers, aggregations |
| `CesiumMap` | Cesium | 3D globe, terrain, 3D Tiles |
| `KeplerGLMap` | KeplerGL | Data exploration UI |
| `PotreeViewer` | Potree | Point cloud visualization |

### Common Methods

| Method | Description |
|--------|-------------|
| `add_basemap(name)` | Add a basemap layer |
| `add_vector(data, name)` | Add vector data (GeoJSON/GeoDataFrame) |
| `add_geojson(data, name)` | Add GeoJSON data |
| `add_tile_layer(url, name)` | Add XYZ tile layer |
| `fly_to(lng, lat, zoom)` | Fly to location |
| `fit_bounds(bounds)` | Fit map to bounds |
| `set_visibility(layer, visible)` | Set layer visibility |
| `set_opacity(layer, opacity)` | Set layer opacity |
| `to_html(filepath)` | Export to HTML |

### DeckGL-Specific Layers

| Method | Description |
|--------|-------------|
| `add_scatterplot_layer()` | Point visualization |
| `add_arc_layer()` | Origin-destination arcs |
| `add_path_layer()` | Polylines |
| `add_polygon_layer()` | Polygons |
| `add_hexagon_layer()` | Hexbin aggregation |
| `add_heatmap_layer()` | Density heatmap |
| `add_grid_layer()` | Grid aggregation |
| `add_geojson_layer()` | GeoJSON rendering |

### Cesium-Specific Methods

| Method | Description |
|--------|-------------|
| `set_terrain()` | Enable terrain |
| `add_3d_tileset(url)` | Add 3D Tiles |
| `add_imagery_layer(url)` | Add imagery |
| `set_camera(lng, lat, height)` | Set camera position |

### Potree-Specific Methods

| Method | Description |
|--------|-------------|
| `load_point_cloud(url)` | Load point cloud |
| `set_point_budget(budget)` | Set max points |
| `add_measurement_tool(type)` | Add measurement |
| `add_annotation(position, title)` | Add annotation |

## Examples

See the `examples/` folder for Jupyter notebooks demonstrating each library:

- `maplibre.ipynb` - MapLibre GL JS basics
- `mapbox.ipynb` - Mapbox GL JS with terrain
- `leaflet.ipynb` - Leaflet markers and GeoJSON
- `openlayers.ipynb` - OpenLayers and WMS
- `deckgl.ipynb` - DeckGL visualization layers
- `cesium.ipynb` - Cesium 3D globe
- `keplergl.ipynb` - KeplerGL data exploration
- `potree.ipynb` - Potree point clouds

## Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/opengeos/anymap-ts.git
cd anymap-ts
pip install -e ".[dev]"
npm install --legacy-peer-deps
```

### Build

```bash
# Build all libraries
npm run build:all

# Build specific library
npm run build:maplibre
npm run build:mapbox
npm run build:leaflet
npm run build:deckgl
npm run build:openlayers
npm run build:cesium

# Watch mode
npm run watch
```

### Project Structure

```
anymap-ts/
├── src/                    # TypeScript source
│   ├── core/               # Base classes
│   ├── maplibre/           # MapLibre implementation
│   ├── mapbox/             # Mapbox implementation
│   ├── leaflet/            # Leaflet implementation
│   ├── openlayers/         # OpenLayers implementation
│   ├── deckgl/             # DeckGL implementation
│   ├── cesium/             # Cesium implementation
│   └── types/              # Type definitions
├── anymap_ts/              # Python package
│   ├── maplibre.py         # MapLibreMap class
│   ├── mapbox.py           # MapboxMap class
│   ├── leaflet.py          # LeafletMap class
│   ├── openlayers.py       # OpenLayersMap class
│   ├── deckgl.py           # DeckGLMap class
│   ├── cesium.py           # CesiumMap class
│   ├── keplergl.py         # KeplerGLMap class
│   ├── potree.py           # PotreeViewer class
│   ├── static/             # Built JS/CSS
│   └── templates/          # HTML export templates
└── examples/               # Example notebooks
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

- [MapLibre GL JS](https://maplibre.org/) - Open-source maps
- [Mapbox GL JS](https://www.mapbox.com/mapbox-gljs) - Vector maps
- [Leaflet](https://leafletjs.com/) - Lightweight maps
- [OpenLayers](https://openlayers.org/) - Feature-rich maps
- [DeckGL](https://deck.gl/) - WebGL visualization
- [Cesium](https://cesium.com/) - 3D geospatial
- [KeplerGL](https://kepler.gl/) - Data exploration
- [Potree](https://potree.github.io/) - Point cloud viewer
- [anywidget](https://anywidget.dev/) - Widget framework
