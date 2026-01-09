# Installation

## Stable release

To install anymap-ts, run this command in your terminal:

```bash
pip install anymap-ts
```

This is the preferred method to install anymap-ts, as it will always install the most recent stable release.

If you don't have [pip](https://pip.pypa.io) installed, this [Python installation guide](http://docs.python-guide.org/en/latest/starting/installation/) can guide you through the process.

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
