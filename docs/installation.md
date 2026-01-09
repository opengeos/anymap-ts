# Installation

## Stable release

To install anymap-ts from PyPI, run this command in your terminal:

```bash
pip install anymap-ts
```

To install anymap-ts from conda-forge, run this command in your terminal:

```bash
conda install -c conda-forge anymap-ts
```

## From sources

To install anymap-ts from sources, run this command in your terminal:

```bash
pip install git+https://github.com/opengeos/anymap-ts
```

## Optional dependencies

```bash
# For vector data support (GeoDataFrame)
pip install anymap-ts[vector]

# For local raster support (localtileserver)
pip install anymap-ts[raster]

# All optional dependencies
pip install anymap-ts[all]
```

## Development installation

```bash
git clone https://github.com/opengeos/anymap-ts.git
cd anymap-ts
pip install -e ".[dev]"
```

## Environment Variables

| Variable | Library | Description |
|----------|---------|-------------|
| `MAPBOX_TOKEN` | Mapbox, KeplerGL | Mapbox access token |
| `CESIUM_TOKEN` | Cesium | Cesium Ion access token |
