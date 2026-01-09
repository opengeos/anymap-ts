# anymap-ts

[![image](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/opengeos/anymap-ts/blob/main)
[![image](https://img.shields.io/pypi/v/anymap-ts.svg)](https://pypi.python.org/pypi/anymap-ts)
[![image](https://img.shields.io/conda/vn/conda-forge/anymap-ts.svg)](https://anaconda.org/conda-forge/anymap-ts)
[![image](https://static.pepy.tech/badge/anymap-ts)](https://pepy.tech/project/anymap-ts)
[![Conda Downloads](https://img.shields.io/conda/dn/conda-forge/anymap-ts.svg)](https://anaconda.org/conda-forge/anymap-ts)
[![image](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A Python package for creating interactive maps with anywidget and TypeScript**

-   GitHub repo: <https://github.com/opengeos/anymap-ts>
-   Documentation: <https://anymap-ts.gishub.org>
-   PyPI: <https://pypi.org/project/anymap-ts>
-   Free software: MIT License

## Features

-   Interactive maps in Jupyter notebooks
-   Bidirectional Python-JavaScript communication via anywidget
-   Drawing and geometry editing with maplibre-gl-geo-editor
-   Layer control with maplibre-gl-layer-control
-   Multiple basemap providers via xyzservices
-   Export to standalone HTML
-   TypeScript-based frontend for type safety and maintainability

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

## Installation

```bash
pip install anymap-ts
```

## Quick Start

```python
from anymap_ts import Map

# Create a map centered on a location
m = Map(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_draw_control()
m
```
