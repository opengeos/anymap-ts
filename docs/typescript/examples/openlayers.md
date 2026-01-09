# OpenLayers

OpenLayers is a high-performance library with excellent WMS/WMTS support and projection handling.

## Python Example

```python
from anymap_ts import OpenLayersMap

m = OpenLayersMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_geojson(geojson, name="cities", style={"fillColor": "rgba(255, 0, 0, 0.8)", "strokeColor": "#ffffff", "radius": 8})
m.add_marker(-122.4194, 37.7749, color="#ff0000")
m.fly_to(-122.4194, 37.7749, zoom=14)
m
```

## TypeScript Implementation

The `OpenLayersRenderer` wraps the OpenLayers API:

```typescript
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';

export class OpenLayersRenderer extends BaseMapRenderer<Map> {
  private layersMap: Map<string, Layer> = new Map();

  protected createMap(): Map {
    const center = this.model.get('center') as [number, number];
    const zoom = this.model.get('zoom');

    return new Map({
      target: this.mapContainer!,
      view: new View({
        center: fromLonLat(center), // Convert to EPSG:3857
        zoom,
      }),
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
  const style = kwargs.style as Record<string, unknown>;

  // Parse GeoJSON
  const features = new GeoJSON().readFeatures(geojson, {
    featureProjection: 'EPSG:3857', // Reproject to map projection
  });

  // Create vector source and layer
  const source = new VectorSource({ features });
  const layer = new VectorLayer({
    source,
    style: this.createStyle(style),
  });

  this.map.addLayer(layer);
  this.layersMap.set(name, layer);

  // Fit to extent
  if (kwargs.fitBounds !== false) {
    this.map.getView().fit(source.getExtent(), { padding: [50, 50, 50, 50] });
  }
}
```

### Styling

```typescript
private createStyle(options?: Record<string, unknown>): Style {
  return new Style({
    fill: new Fill({
      color: options?.fillColor || 'rgba(51, 136, 255, 0.5)',
    }),
    stroke: new Stroke({
      color: options?.strokeColor || '#3388ff',
      width: options?.strokeWidth || 2,
    }),
    image: new Circle({
      radius: options?.radius || 8,
      fill: new Fill({ color: options?.fillColor || '#3388ff' }),
      stroke: new Stroke({ color: options?.strokeColor || '#ffffff', width: 2 }),
    }),
  });
}
```

### Navigation

```typescript
private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];
  const zoom = kwargs.zoom as number;
  const duration = kwargs.duration as number || 2000;

  this.map.getView().animate({
    center: fromLonLat([lng, lat]),
    zoom: zoom || this.map.getView().getZoom(),
    duration,
  });
}
```

### Markers

```typescript
private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];
  const id = kwargs.id as string || `marker-${Date.now()}`;
  const color = kwargs.color as string || '#3388ff';

  const feature = new Feature({
    geometry: new Point(fromLonLat([lng, lat])),
  });

  feature.setStyle(new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 2 }),
    }),
  }));

  const source = new VectorSource({ features: [feature] });
  const layer = new VectorLayer({ source });

  this.map.addLayer(layer);
  this.markersMap.set(id, layer);
}
```

### WMS Layers

```typescript
private handleAddWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const url = kwargs.url as string;
  const layers = kwargs.layers as string;
  const name = kwargs.name as string;

  const layer = new TileLayer({
    source: new TileWMS({
      url,
      params: {
        LAYERS: layers,
        TILED: true,
      },
    }),
  });

  this.map.addLayer(layer);
  this.layersMap.set(name, layer);
}
```

## Coordinate System

OpenLayers uses EPSG:3857 (Web Mercator) internally. Convert coordinates:

```typescript
import { fromLonLat, toLonLat } from 'ol/proj';

// To OpenLayers (EPSG:4326 -> EPSG:3857)
const olCoord = fromLonLat([-122.4, 37.8]);

// From OpenLayers (EPSG:3857 -> EPSG:4326)
const lngLat = toLonLat(olCoord);
```

## Source Files

- **Renderer**: `src/openlayers/OpenLayersRenderer.ts`
- **Types**: `src/types/openlayers.ts`

See also: [Python notebook example](../../notebooks/openlayers.ipynb)
