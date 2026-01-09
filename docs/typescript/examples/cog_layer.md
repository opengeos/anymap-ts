# COG Layer

Cloud Optimized GeoTIFFs (COGs) enable efficient raster visualization with automatic reprojection.

## Python Example

```python
from anymap_ts import Map

COG_URL = "https://s3.us-east-1.amazonaws.com/ds-deck.gl-raster-public/cog/Annual_NLCD_LndCov_2024_CU_C1V1.tif"

m = Map(center=[-98.5, 39.8], zoom=4, style="dark-matter")
m.add_cog_layer(COG_URL, name="nlcd-landcover", opacity=1.0)
m
```

## TypeScript Implementation

COG layers use the `@developmentseed/deck.gl-geotiff` package with deck.gl overlay:

```typescript
import { MapboxOverlay } from '@deck.gl/mapbox';
import { COGLayer, proj } from '@developmentseed/deck.gl-geotiff';
import { toProj4 } from 'geotiff-geokeys-to-proj4';

// Parse GeoKeys for reprojection
async function geoKeysParser(geoKeys: Record<string, unknown>): Promise<proj.ProjectionInfo> {
  const projDefinition = toProj4(geoKeys);
  return {
    def: projDefinition.proj4,
    parsed: proj.parseCrs(projDefinition.proj4),
    coordinatesUnits: projDefinition.coordinatesUnits,
  };
}
```

### Adding COG Layer

```typescript
private handleAddCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  // Initialize deck.gl overlay if needed
  this.initializeDeckOverlay();

  const id = kwargs.id as string || `cog-${Date.now()}`;
  const geotiff = kwargs.geotiff as string;
  const fitBounds = kwargs.fitBounds !== false;

  const layer = new COGLayer({
    id,
    geotiff,
    opacity: kwargs.opacity as number ?? 1,
    visible: kwargs.visible !== false,
    debug: kwargs.debug as boolean ?? false,
    debugOpacity: kwargs.debugOpacity as number ?? 0.25,
    maxError: kwargs.maxError as number ?? 0.125,
    beforeId: kwargs.beforeId as string,
    geoKeysParser,
    onGeoTIFFLoad: (tiff, options) => {
      if (fitBounds && this.map) {
        const { west, south, east, north } = options.geographicBounds;
        this.map.fitBounds([[west, south], [east, north]], { padding: 40, duration: 1000 });
      }
    },
  });

  this.deckLayers.set(id, layer);
  this.updateDeckOverlay();
}
```

### Removing COG Layer

```typescript
private handleRemoveCOGLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const [id] = args as [string];
  this.deckLayers.delete(id);
  this.updateDeckOverlay();
}
```

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `geotiff` | string | required | URL to the Cloud Optimized GeoTIFF file |
| `id` | string | auto | Layer identifier |
| `opacity` | number | 1.0 | Layer opacity (0-1) |
| `visible` | boolean | true | Whether layer is visible |
| `debug` | boolean | false | Show reprojection mesh for debugging |
| `debugOpacity` | number | 0.25 | Opacity of debug mesh |
| `maxError` | number | 0.125 | Maximum reprojection error in pixels |
| `fitBounds` | boolean | true | Fit map to COG bounds after loading |
| `beforeId` | string | undefined | ID of layer to insert before |

## Layer Control Integration

The COG layer adapter allows integration with the layer control:

```typescript
class COGLayerAdapter implements CustomLayerAdapter {
  private map: MapLibreMap;
  private deckOverlay: MapboxOverlay;
  private deckLayers: Map<string, unknown>;

  getLayerIds(): string[] {
    return Array.from(this.deckLayers.keys()).filter((id) => id.startsWith('cog-'));
  }

  setVisibility(layerId: string, visible: boolean): void {
    const layer = this.deckLayers.get(layerId);
    if (layer) {
      const updatedLayer = (layer as COGLayer).clone({ visible });
      this.deckLayers.set(layerId, updatedLayer);
      this.updateOverlay();
    }
  }

  setOpacity(layerId: string, opacity: number): void {
    const layer = this.deckLayers.get(layerId);
    if (layer) {
      const updatedLayer = (layer as COGLayer).clone({ opacity });
      this.deckLayers.set(layerId, updatedLayer);
      this.updateOverlay();
    }
  }
}
```

## Debug Mode

Enable debug mode to visualize the reprojection mesh:

```python
m.add_cog_layer(
    COG_URL,
    name="nlcd-debug",
    debug=True,
    debug_opacity=0.25,
)
```

This shows the triangular mesh used for GPU reprojection, useful for debugging projection issues.

## Source Files

- **MapLibre Implementation**: `src/maplibre/MapLibreRenderer.ts`
- **DeckGL Implementation**: `src/deckgl/DeckGLRenderer.ts`
- **Layer Adapter**: `src/maplibre/adapters/COGLayerAdapter.ts`
- **Layer with Opacity**: `src/maplibre/layers/COGLayerWithOpacity.ts`

See also: [Python notebook example](../../notebooks/cog_layer.ipynb)
