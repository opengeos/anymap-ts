# anymap-ts

[![image](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/opengeos/anymap-ts/blob/main)
[![notebook-link](https://img.shields.io/badge/notebook-link-e2d610?logo=jupyter&logoColor=white)](https://notebook.link/github/opengeos/anymap-ts/)
[![image](https://img.shields.io/pypi/v/anymap-ts.svg)](https://pypi.python.org/pypi/anymap-ts)
[![image](https://static.pepy.tech/badge/anymap-ts)](https://pepy.tech/project/anymap-ts)
[![image](https://img.shields.io/conda/vn/conda-forge/anymap-ts.svg)](https://anaconda.org/conda-forge/anymap-ts)
[![Conda Downloads](https://img.shields.io/conda/dn/conda-forge/anymap-ts.svg)](https://anaconda.org/conda-forge/anymap-ts)
[![Conda Recipe](https://img.shields.io/badge/recipe-anymap--ts-green.svg)](https://github.com/conda-forge/anymap-ts-feedstock)
[![npm version](https://img.shields.io/npm/v/anymap-ts.svg)](https://www.npmjs.com/package/anymap-ts)
[![image](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A Python package for creating interactive maps with anywidget and TypeScript**

-   GitHub repo: <https://github.com/opengeos/anymap-ts>
-   Documentation: <https://ts.anymap.dev>
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
