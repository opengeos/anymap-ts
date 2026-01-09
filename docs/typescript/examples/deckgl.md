# DeckGL

DeckGL provides GPU-accelerated visualization layers on top of MapLibre GL JS.

## Python Example

```python
from anymap_ts import DeckGLMap
import random

# Create map with dark basemap
m = DeckGLMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("CartoDB.DarkMatter")

# Generate sample data
points = [
    {"coordinates": [-122.4 + random.uniform(-0.2, 0.2), 37.8 + random.uniform(-0.2, 0.2)], "value": random.randint(1, 100)}
    for _ in range(1000)
]

# Add scatterplot layer
m.add_scatterplot_layer(data=points, name="scatterplot", get_radius=100, get_fill_color=[255, 140, 0, 200])

# Add hexagon aggregation layer
m.add_hexagon_layer(data=points, name="hexagons", radius=500, elevation_scale=10, extruded=True)
m
```

## TypeScript Implementation

The `DeckGLRenderer` extends `MapLibreRenderer` and adds deck.gl overlay support:

```typescript
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapLibreRenderer } from '../maplibre/MapLibreRenderer';

export class DeckGLRenderer extends MapLibreRenderer {
  private deckOverlay: MapboxOverlay | null = null;
  private deckLayers: Map<string, unknown> = new Map();

  async initialize(): Promise<void> {
    await super.initialize();

    // Create deck.gl overlay
    this.deckOverlay = new MapboxOverlay({ layers: [] });
    this.map.addControl(this.deckOverlay);
  }

  private updateDeckOverlay(): void {
    const layers = Array.from(this.deckLayers.values());
    this.deckOverlay.setProps({ layers });
  }
}
```

## Layer Types

### ScatterplotLayer

```typescript
private handleAddScatterplotLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string || `scatterplot-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new ScatterplotLayer({
    id,
    data,
    pickable: true,
    opacity: kwargs.opacity as number ?? 0.8,
    stroked: true,
    filled: true,
    radiusScale: kwargs.radiusScale as number ?? 1,
    radiusMinPixels: kwargs.radiusMinPixels as number ?? 1,
    getPosition: (d: any) => d.coordinates || d.position,
    getRadius: kwargs.getRadius ?? 5,
    getFillColor: kwargs.getFillColor ?? [51, 136, 255, 200],
    getLineColor: kwargs.getLineColor ?? [255, 255, 255, 255],
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
}
```

### HexagonLayer (Aggregation)

```typescript
private handleAddHexagonLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string || `hexagon-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new HexagonLayer({
    id,
    data,
    pickable: true,
    extruded: kwargs.extruded as boolean ?? true,
    radius: kwargs.radius as number ?? 1000,
    elevationScale: kwargs.elevationScale as number ?? 4,
    getPosition: (d: any) => d.coordinates || d.position,
    colorRange: [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78],
    ],
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
}
```

### HeatmapLayer

```typescript
private handleAddHeatmapLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string || `heatmap-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new HeatmapLayer({
    id,
    data,
    opacity: kwargs.opacity as number ?? 1,
    radiusPixels: kwargs.radiusPixels as number ?? 30,
    intensity: kwargs.intensity as number ?? 1,
    threshold: kwargs.threshold as number ?? 0.05,
    getPosition: (d: any) => d.coordinates || d.position,
    getWeight: kwargs.getWeight ?? 1,
    colorRange: [
      [255, 255, 178, 25],
      [254, 217, 118, 85],
      [254, 178, 76, 127],
      [253, 141, 60, 170],
      [240, 59, 32, 212],
      [189, 0, 38, 255],
    ],
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
}
```

### ArcLayer (Connections)

```typescript
private handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const id = kwargs.id as string || `arc-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new ArcLayer({
    id,
    data,
    pickable: true,
    getWidth: kwargs.getWidth ?? 1,
    getSourcePosition: (d: any) => d.source || d.from,
    getTargetPosition: (d: any) => d.target || d.to,
    getSourceColor: kwargs.getSourceColor ?? [51, 136, 255, 255],
    getTargetColor: kwargs.getTargetColor ?? [255, 136, 51, 255],
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
}
```

## Available Layers

| Layer | Description |
|-------|-------------|
| `ScatterplotLayer` | Render points as circles |
| `ArcLayer` | Render arcs between source and target positions |
| `PathLayer` | Render paths/polylines |
| `PolygonLayer` | Render filled and/or stroked polygons |
| `HexagonLayer` | Aggregate points into hexagonal bins |
| `HeatmapLayer` | Render heatmap based on point density |
| `GridLayer` | Aggregate points into rectangular bins |
| `IconLayer` | Render icons at positions |
| `TextLayer` | Render text labels |
| `GeoJsonLayer` | Render GeoJSON data |

## Source Files

- **Renderer**: `src/deckgl/DeckGLRenderer.ts`
- **Types**: `src/types/deckgl.ts`

See also: [Python notebook example](../../notebooks/deckgl.ipynb)
