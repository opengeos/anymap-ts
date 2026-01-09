# Usage

## Map Classes

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

## MapLibre GL JS (Default)

```python
from anymap_ts import Map

# Create a map centered on a location
m = Map(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_draw_control()
m
```

## Mapbox GL JS

```python
import os
from anymap_ts import MapboxMap

# Set your Mapbox token (or use MAPBOX_TOKEN env var)
m = MapboxMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m
```

## Leaflet

```python
from anymap_ts import LeafletMap

m = LeafletMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_marker(-122.4194, 37.7749, popup="San Francisco")
m
```

## OpenLayers

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

## DeckGL

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

## Cesium (3D Globe)

```python
from anymap_ts import CesiumMap

# Set CESIUM_TOKEN env var for terrain/3D Tiles
m = CesiumMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.set_terrain()  # Enable Cesium World Terrain
m.fly_to(-122.4194, 37.7749, height=50000, heading=45, pitch=-45)
m
```

## KeplerGL

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

## Potree (Point Clouds)

```python
from anymap_ts import PotreeViewer

viewer = PotreeViewer(
    point_budget=1000000,
    edl_enabled=True
)
viewer.load_point_cloud("path/to/pointcloud/cloud.js", name="lidar")
viewer
```

## Common Methods

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

## Add Vector Data

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

## Map Navigation

```python
# Fly to location with animation
m.fly_to(-122.4, 37.8, zoom=14)

# Fit to bounds [west, south, east, north]
m.fit_bounds([-123, 37, -122, 38])
```

## Export to HTML

```python
# All map types support HTML export
m.to_html("map.html", title="My Map")
```
