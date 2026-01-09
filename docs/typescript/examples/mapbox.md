# Mapbox GL JS

Mapbox GL JS is a commercial vector tile mapping library. Requires an access token.

## Python Example

```python
import os
from anymap_ts import MapboxMap

m = MapboxMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_geojson(geojson, name="cities")
m.fly_to(-122.4194, 37.7749, zoom=12)
m
```

**Note:** Set the `MAPBOX_TOKEN` environment variable or pass `access_token` to the constructor.

## TypeScript Implementation

The `MapboxRenderer` extends `MapLibreRenderer` since Mapbox GL JS has a similar API:

```typescript
import mapboxgl from 'mapbox-gl';
import { BaseMapRenderer } from '../core/BaseMapRenderer';
import type { MapWidgetModel } from '../types/anywidget';

export class MapboxRenderer extends BaseMapRenderer<mapboxgl.Map> {
  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);

    // Set access token
    const token = model.get('access_token') as string;
    if (token) {
      mapboxgl.accessToken = token;
    }

    this.registerMethods();
  }

  protected createMap(): mapboxgl.Map {
    const center = this.model.get('center') as [number, number];
    const zoom = this.model.get('zoom');
    const style = this.model.get('style') as string || 'mapbox://styles/mapbox/streets-v12';

    return new mapboxgl.Map({
      container: this.mapContainer!,
      style,
      center,
      zoom,
    });
  }

  async initialize(): Promise<void> {
    this.createMapContainer();
    this.map = this.createMap();
    this.setupModelListeners();
    this.setupMapEvents();

    await new Promise<void>((resolve) => {
      this.map!.on('load', () => {
        this.isMapReady = true;
        this.processPendingCalls();
        resolve();
      });
    });
  }
}
```

## Key Methods

### Adding GeoJSON

```typescript
private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
  const geojson = kwargs.data as FeatureCollection;
  const name = kwargs.name as string;
  const sourceId = `${name}-source`;

  // Add source
  this.map.addSource(sourceId, {
    type: 'geojson',
    data: geojson,
  });

  // Determine layer type
  const layerType = this.inferLayerType(geojson);

  // Add layer
  this.map.addLayer({
    id: name,
    type: layerType,
    source: sourceId,
    paint: this.getDefaultPaint(layerType),
  });
}
```

### Navigation

```typescript
private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];

  this.map.flyTo({
    center: [lng, lat],
    zoom: kwargs.zoom as number,
    bearing: kwargs.bearing as number,
    pitch: kwargs.pitch as number,
    duration: kwargs.duration as number || 2000,
  });
}
```

## Mapbox-Specific Features

### 3D Terrain

```typescript
private handleSetTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
  // Add terrain source
  this.map.addSource('mapbox-dem', {
    type: 'raster-dem',
    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
    tileSize: 512,
    maxzoom: 14,
  });

  // Enable terrain
  this.map.setTerrain({
    source: 'mapbox-dem',
    exaggeration: kwargs.exaggeration as number || 1.5,
  });

  // Add sky layer
  this.map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
    },
  });
}
```

### 3D Buildings

```typescript
private handleAdd3DBuildings(args: unknown[], kwargs: Record<string, unknown>): void {
  this.map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': '#aaa',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.6,
    },
  });
}
```

## Source Files

- **Renderer**: `src/mapbox/MapboxRenderer.ts`
- **Types**: `src/types/mapbox.ts`

See also: [Python notebook example](../../notebooks/mapbox.ipynb)
