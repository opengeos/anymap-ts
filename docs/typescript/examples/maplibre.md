# MapLibre GL JS

MapLibre GL JS is the default renderer in anymap-ts, providing vector tile maps with drawing and layer control capabilities.

## Python Example

```python
from anymap_ts import Map

m = Map(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_draw_control(position="top-left")
m.add_layer_control()
m
```

## TypeScript Implementation

The `MapLibreRenderer` class extends `BaseMapRenderer` and provides comprehensive map functionality:

```typescript
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { BaseMapRenderer } from '../core/BaseMapRenderer';
import type { MapWidgetModel, RenderContext } from '../types/anywidget';

export class MapLibreRenderer extends BaseMapRenderer<MapLibreMap> {
  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.registerMethods();
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

  protected createMap(): MapLibreMap {
    const center = this.model.get('center');
    const zoom = this.model.get('zoom');

    return new MapLibreMap({
      container: this.mapContainer!,
      style: this.model.get('style'),
      center: center as [number, number],
      zoom,
    });
  }
}
```

## Key Methods

### Navigation

```typescript
// Set center position
private handleSetCenter(args: unknown[]): void {
  const [lng, lat] = args as [number, number];
  this.map.setCenter([lng, lat]);
}

// Fly to location with animation
private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];
  this.map.flyTo({
    center: [lng, lat],
    zoom: kwargs.zoom as number,
    duration: kwargs.duration as number || 2000,
  });
}

// Fit bounds
private handleFitBounds(args: unknown[]): void {
  const [bounds] = args as [[number, number, number, number]];
  this.map.fitBounds([
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ]);
}
```

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

  // Determine layer type from geometry
  const layerType = this.inferLayerType(geojson.features[0].geometry.type);

  // Add layer with default styling
  this.map.addLayer({
    id: name,
    type: layerType,
    source: sourceId,
    paint: this.getDefaultPaint(layerType),
  });
}
```

### Controls

```typescript
// Add navigation, scale, or draw controls
private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
  const [controlType] = args as [string];
  const position = kwargs.position as string || 'top-right';

  let control: maplibregl.IControl;
  switch (controlType) {
    case 'navigation':
      control = new maplibregl.NavigationControl();
      break;
    case 'scale':
      control = new maplibregl.ScaleControl();
      break;
    case 'fullscreen':
      control = new maplibregl.FullscreenControl();
      break;
  }

  this.map.addControl(control, position);
}
```

### Draw Control

```typescript
private handleAddDrawControl(args: unknown[], kwargs: Record<string, unknown>): void {
  const position = kwargs.position as string || 'top-right';

  this.geoEditorPlugin = new GeoEditorPlugin(this.map);
  this.geoEditorPlugin.initialize({
    position,
    drawModes: kwargs.drawModes as string[],
  }, (data: FeatureCollection) => {
    // Sync drawn features to Python
    this.model.set('_draw_data', data);
    this.model.save_changes();
  });
}

// Get drawn features
private handleGetDrawData(): void {
  const data = this.geoEditorPlugin.getFeatures();
  this.model.set('_draw_data', data);
  this.model.save_changes();
}
```

## Event Handling

```typescript
private setupMapEvents(): void {
  // Click event
  this.map.on('click', (e) => {
    this.sendEvent('click', {
      lngLat: [e.lngLat.lng, e.lngLat.lat],
      point: [e.point.x, e.point.y],
    });
  });

  // Move end event
  this.map.on('moveend', () => {
    const center = this.map.getCenter();
    this.model.set('current_center', [center.lng, center.lat]);
    this.model.set('current_zoom', this.map.getZoom());
    this.model.save_changes();
  });
}
```

## Source Files

- **Renderer**: `src/maplibre/MapLibreRenderer.ts`
- **Plugins**: `src/maplibre/plugins/GeoEditorPlugin.ts`, `LayerControlPlugin.ts`
- **Types**: `src/types/maplibre.ts`

See also: [Python notebook example](../../notebooks/maplibre.ipynb)
