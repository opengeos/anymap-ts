# Point Cloud Layer

The DeckGL PointCloudLayer renders 3D point cloud data, ideal for visualizing LiDAR scans, 3D models, and elevation data.

## Python Example

```python
import random
from anymap_ts import MapLibreMap

# Generate sample 3D point cloud
points = [
    {
        "position": [-122.4 + random.uniform(-0.01, 0.01),
                     37.8 + random.uniform(-0.01, 0.01),
                     random.uniform(0, 500)],
        "color": [255, int(random.uniform(0, 255)), 0, 255]
    }
    for _ in range(1000)
]

m = MapLibreMap(center=[-122.4, 37.8], zoom=14, pitch=60)
m.add_basemap("CartoDB.DarkMatter")
m.add_point_cloud_layer(
    data=points,
    name="lidar-scan",
    get_position="position",
    get_color="color",
    point_size=3,
    opacity=0.9,
)
m
```

## TypeScript Implementation

The `handleAddPointCloudLayer` method creates deck.gl PointCloudLayer instances:

```typescript
import { PointCloudLayer } from '@deck.gl/layers';

private handleAddPointCloudLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  this.initializeDeckOverlay();
  const id = kwargs.id as string || `pointcloud-${Date.now()}`;
  const data = kwargs.data as unknown[];

  const layer = new PointCloudLayer({
    id,
    data,
    pickable: kwargs.pickable !== false,
    opacity: kwargs.opacity as number ?? 1,
    pointSize: kwargs.pointSize as number ?? 2,
    sizeUnits: kwargs.sizeUnits as string ?? 'pixels',
    getPosition: (d: any) => d[kwargs.getPosition as string] || d.position,
    getNormal: kwargs.getNormal ?? [0, 0, 1],
    getColor: (d: any) => {
      const accessor = kwargs.getColor;
      if (Array.isArray(accessor)) return accessor;
      if (typeof accessor === 'string') return d[accessor] || [255, 255, 255, 255];
      return [255, 255, 255, 255];
    },
    coordinateSystem: kwargs.coordinateSystem,
    coordinateOrigin: kwargs.coordinateOrigin,
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
  this.deckLayerAdapter?.notifyLayerAdded(id);
}
```

## Layer Control Integration

Point cloud layers integrate with the layer control via `DeckLayerAdapter`:

```typescript
// Layer IDs starting with 'pointcloud-' are managed by DeckLayerAdapter
getLayerIds(): string[] {
  return Array.from(this.deckLayers.keys()).filter(id =>
    id.startsWith('arc-') || id.startsWith('pointcloud-')
  );
}

// Adjust opacity by cloning the immutable deck.gl layer
setOpacity(layerId: string, opacity: number): void {
  const layer = this.deckLayers.get(layerId);
  if (layer && typeof layer.clone === 'function') {
    const updated = layer.clone({ opacity });
    this.deckLayers.set(layerId, updated);
    this.updateOverlay();
  }
}
```

## API Reference

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `Array` | required | Array of point data objects |
| `name` | `string` | auto-generated | Layer identifier |
| `get_position` | `string` | `"position"` | Accessor for [x, y, z] position |
| `get_color` | `Array<int>` or `string` | `[255, 255, 255, 255]` | RGBA color or accessor |
| `get_normal` | `string` | `[0, 0, 1]` | Normal vector for lighting |
| `point_size` | `number` | `2` | Point size in size_units |
| `size_units` | `string` | `"pixels"` | `"pixels"` or `"meters"` |
| `coordinate_system` | `string` | auto | Coordinate system type |
| `coordinate_origin` | `Array` | none | Origin for offset coordinates |
| `pickable` | `bool` | `true` | Enable hover/click |
| `opacity` | `float` | `1.0` | Layer opacity |

### Data Format

Each point object should have position coordinates:

```javascript
{
  position: [x, y, z],  // [longitude, latitude, altitude] or [x, y, z]
  color: [r, g, b, a],  // Optional RGBA color
  normal: [nx, ny, nz]  // Optional normal vector
}
```

### Coordinate Systems

The `coordinate_system` parameter supports:

- `CARTESIAN` - Local cartesian coordinates
- `METER_OFFSETS` - Meter offsets from origin
- `LNGLAT` - WGS84 longitude/latitude (default)
- `LNGLAT_OFFSETS` - Lng/lat offsets from origin

## Source Files

- **MapLibre Handler**: `src/maplibre/MapLibreRenderer.ts`
- **Mapbox Handler**: `src/mapbox/MapboxRenderer.ts`
- **DeckGL Handler**: `src/deckgl/DeckGLRenderer.ts`
- **Layer Adapter**: `src/maplibre/adapters/DeckLayerAdapter.ts`

See also: [Python notebook example](../../notebooks/pointcloud_layer.ipynb)
