# Zarr Layer

Zarr layers enable visualization of multi-dimensional scientific datasets with GPU acceleration.

## Python Example

```python
from anymap_ts import Map

ZARR_URL = "https://carbonplan-maps.s3.us-west-2.amazonaws.com/v2/demo/4d/tavg-prec-month"

m = Map(center=[-100, 40], zoom=3, style="dark-matter")

m.add_zarr_layer(
    url=ZARR_URL,
    variable="climate",
    name="climate-prec",
    clim=(0, 300),
    colormap=["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
    opacity=0.8,
    selector={"band": "prec", "month": 1},
    spatial_dimensions={"lat": "y", "lon": "x"},
    zarr_version=2,
)
m
```

## TypeScript Implementation

Zarr layers use the `@carbonplan/zarr-layer` package:

```typescript
import { ZarrLayer } from '@carbonplan/zarr-layer';

private handleAddZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string || `zarr-${Date.now()}`;
  const source = kwargs.source as string;
  const variable = kwargs.variable as string;

  const layer = new ZarrLayer({
    id,
    source,
    variable,
    clim: kwargs.clim as [number, number] || [0, 100],
    colormap: kwargs.colormap as string[] || ['#000000', '#ffffff'],
    selector: kwargs.selector as Record<string, unknown> || {},
    opacity: kwargs.opacity as number ?? 1,
    minzoom: kwargs.minzoom as number,
    maxzoom: kwargs.maxzoom as number,
    fillValue: kwargs.fillValue as number,
    spatialDimensions: kwargs.spatialDimensions as { lat?: string; lon?: string },
    zarrVersion: kwargs.zarrVersion as 2 | 3,
    bounds: kwargs.bounds as [number, number, number, number],
  });

  this.map.addLayer(layer as unknown as maplibregl.CustomLayerInterface);
  this.zarrLayers.set(id, layer);
}
```

### Updating Zarr Layer

```typescript
private handleUpdateZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string;
  const layer = this.zarrLayers.get(id);
  if (!layer) return;

  // Update properties dynamically
  if (kwargs.selector) layer.setSelector(kwargs.selector as Record<string, number>);
  if (kwargs.clim) layer.setClim(kwargs.clim as [number, number]);
  if (kwargs.colormap) layer.setColormap(kwargs.colormap as string[]);
  if (kwargs.opacity !== undefined) layer.setOpacity(kwargs.opacity as number);
}
```

### Removing Zarr Layer

```typescript
private handleRemoveZarrLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const [id] = args as [string];

  if (this.map && this.map.getLayer(id)) {
    this.map.removeLayer(id);
  }
  this.zarrLayers.delete(id);
}
```

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | required | URL to the Zarr store |
| `variable` | string | required | Variable name in the Zarr dataset |
| `id` | string | auto | Layer identifier |
| `colormap` | string[] | `['#000000', '#ffffff']` | Hex color strings for visualization |
| `clim` | [number, number] | `[0, 100]` | Color scale limits (min, max) |
| `opacity` | number | 1.0 | Layer opacity (0-1) |
| `selector` | object | `{}` | Dimension selector (e.g., `{month: 4, band: "tavg"}`) |
| `minzoom` | number | 0 | Minimum zoom level for rendering |
| `maxzoom` | number | 22 | Maximum zoom level for rendering |
| `fillValue` | number | auto | No-data value |
| `spatialDimensions` | object | auto | Custom spatial dimension names |
| `zarrVersion` | number | auto | Zarr format version (2 or 3) |
| `bounds` | [number, number, number, number] | auto | Explicit bounds [west, south, east, north] |

## Dynamic Updates

Zarr layers support dynamic updates without recreating the layer:

```python
# Update selector (e.g., change month)
m.update_zarr_layer(
    layer_id="climate-prec",
    selector={"band": "prec", "month": 7},
)

# Update colormap and clim
m.update_zarr_layer(
    layer_id="climate-prec",
    selector={"band": "tavg", "month": 7},
    clim=(-20, 30),
    colormap=["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"],
)
```

## Colormaps

Common colormaps as hex arrays:

```typescript
const colormaps = {
  // Blues (precipitation)
  blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],

  // RdYlBu (temperature)
  rdylbu: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],

  // Inferno (general)
  inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
};
```

## Sample Datasets

| Dataset | URL | Variable | Description |
|---------|-----|----------|-------------|
| 4D Climate | `carbonplan-maps.s3.../v2/demo/4d/tavg-prec-month` | climate | Temp/precip by month |
| Ocean Temp | `atlantis-vis-o.s3-ext.../tos_con` | tos_con | v3 pyramid, EPSG:3857 |
| Burn Prob | `carbonplan-share.s3.../13-lvl-30m-4326-scott-BP.zarr` | BP | 30m resolution CONUS |

## Source Files

- **MapLibre Implementation**: `src/maplibre/MapLibreRenderer.ts`
- **Layer Adapter**: `src/maplibre/adapters/ZarrLayerAdapter.ts`

See also: [Python notebook example](../../notebooks/zarr_layer.ipynb)
