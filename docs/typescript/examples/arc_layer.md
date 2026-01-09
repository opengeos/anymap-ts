# Arc Layer

The DeckGL ArcLayer renders raised arcs joining pairs of source and target points, ideal for visualizing origin-destination data like flight routes, migration patterns, and transportation networks.

## Python Example

```python
from anymap_ts import MapLibreMap

# Sample flight data from San Francisco
flights = [
    {"source": [-122.4194, 37.7749], "target": [-73.9857, 40.7484], "name": "SF to NYC"},
    {"source": [-122.4194, 37.7749], "target": [-87.6298, 41.8781], "name": "SF to Chicago"},
    {"source": [-122.4194, 37.7749], "target": [-118.2437, 34.0522], "name": "SF to LA"},
]

m = MapLibreMap(center=[-98.5795, 39.8283], zoom=3, pitch=30)
m.add_basemap("CartoDB.DarkMatter")
m.add_arc_layer(
    data=flights,
    name="flights",
    get_source_color=[0, 128, 255, 255],
    get_target_color=[255, 128, 0, 255],
    get_width=2,
    great_circle=True,
)
m
```

## TypeScript Implementation

The `handleAddArcLayer` method in `MapLibreRenderer` creates deck.gl ArcLayer instances:

```typescript
import { ArcLayer } from '@deck.gl/layers';

private handleAddArcLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  this.initializeDeckOverlay();
  const id = kwargs.id as string || `arc-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new ArcLayer({
    id,
    data,
    pickable: kwargs.pickable !== false,
    opacity: kwargs.opacity as number ?? 0.8,
    getWidth: kwargs.getWidth ?? 1,
    getHeight: kwargs.getHeight ?? 1,
    greatCircle: kwargs.greatCircle as boolean ?? false,
    getSourcePosition: (d: any) => d[kwargs.getSourcePosition as string] || d.source,
    getTargetPosition: (d: any) => d[kwargs.getTargetPosition as string] || d.target,
    getSourceColor: kwargs.getSourceColor ?? [51, 136, 255, 255],
    getTargetColor: kwargs.getTargetColor ?? [255, 136, 51, 255],
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
  this.deckLayerAdapter?.notifyLayerAdded(id);
}
```

## Layer Control Integration

Arc layers integrate with the layer control via `DeckLayerAdapter`:

```typescript
// Layer IDs starting with 'arc-' are managed by DeckLayerAdapter
getLayerIds(): string[] {
  return Array.from(this.deckLayers.keys()).filter(id =>
    id.startsWith('arc-') || id.startsWith('pointcloud-')
  );
}

// Toggle visibility by cloning the immutable deck.gl layer
setVisibility(layerId: string, visible: boolean): void {
  const layer = this.deckLayers.get(layerId);
  if (layer && typeof layer.clone === 'function') {
    const updated = layer.clone({ visible });
    this.deckLayers.set(layerId, updated);
    this.updateOverlay();
  }
}
```

## API Reference

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `Array` | required | Array of arc data objects |
| `name` | `string` | auto-generated | Layer identifier |
| `get_source_position` | `string` | `"source"` | Accessor for source [lng, lat] |
| `get_target_position` | `string` | `"target"` | Accessor for target [lng, lat] |
| `get_source_color` | `Array<int>` | `[51, 136, 255, 255]` | RGBA color at source |
| `get_target_color` | `Array<int>` | `[255, 136, 51, 255]` | RGBA color at target |
| `get_width` | `number` | `1` | Arc width in pixels |
| `get_height` | `number` | `1` | Arc height multiplier |
| `great_circle` | `bool` | `false` | Use great circle path |
| `pickable` | `bool` | `true` | Enable hover/click |
| `opacity` | `float` | `0.8` | Layer opacity |

### Data Format

Each arc object should have source and target coordinates:

```javascript
{
  source: [longitude, latitude],  // or [longitude, latitude, altitude]
  target: [longitude, latitude],
  // ... additional properties
}
```

## Source Files

- **MapLibre Handler**: `src/maplibre/MapLibreRenderer.ts`
- **Mapbox Handler**: `src/mapbox/MapboxRenderer.ts`
- **DeckGL Handler**: `src/deckgl/DeckGLRenderer.ts`
- **Layer Adapter**: `src/maplibre/adapters/DeckLayerAdapter.ts`

See also: [Python notebook example](../../notebooks/arc_layer.ipynb)
