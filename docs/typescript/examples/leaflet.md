# Leaflet

Leaflet is a lightweight, mobile-friendly mapping library with excellent browser support.

## Python Example

```python
from anymap_ts import LeafletMap

m = LeafletMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_marker(-122.4194, 37.7749, popup="San Francisco")
m.add_marker(-122.2712, 37.8044, popup="Oakland")
m
```

## TypeScript Implementation

The `LeafletRenderer` class handles coordinate conversion (Leaflet uses `[lat, lng]` order):

```typescript
import * as L from 'leaflet';
import { BaseMapRenderer } from '../core/BaseMapRenderer';
import type { MapWidgetModel } from '../types/anywidget';

export class LeafletRenderer extends BaseMapRenderer<L.Map> {
  private layersMap: Map<string, L.Layer> = new Map();
  private markersMap: Map<string, L.Marker> = new Map();

  protected createMap(): L.Map {
    // Leaflet uses [lat, lng] but we receive [lng, lat] from Python
    const center = this.model.get('center') as [number, number];
    const zoom = this.model.get('zoom');

    return L.map(this.mapContainer!, {
      center: [center[1], center[0]], // Convert [lng, lat] to [lat, lng]
      zoom,
      zoomControl: false,
    });
  }

  async initialize(): Promise<void> {
    this.createMapContainer();
    this.map = this.createMap();
    this.setupModelListeners();
    this.setupMapEvents();
    this.isMapReady = true;
    this.processPendingCalls();
  }
}
```

## Key Methods

### Adding Markers

```typescript
private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];
  const id = kwargs.id as string || `marker-${Date.now()}`;
  const popup = kwargs.popup as string;

  // Note: Leaflet uses [lat, lng] order
  const marker = L.marker([lat, lng]);

  if (popup) {
    marker.bindPopup(popup);
  }

  marker.addTo(this.map);
  this.markersMap.set(id, marker);
}
```

### Adding GeoJSON

```typescript
private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
  const geojson = kwargs.data as FeatureCollection;
  const name = kwargs.name as string;
  const style = kwargs.style as Record<string, unknown>;

  const geoJsonLayer = L.geoJSON(geojson, {
    style: (feature) => style || this.getDefaultStyle(feature.geometry.type),
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, style || this.getDefaultStyle('Point'));
    },
  });

  geoJsonLayer.addTo(this.map);
  this.layersMap.set(name, geoJsonLayer);

  // Optionally fit bounds
  if (kwargs.fitBounds !== false) {
    this.map.fitBounds(geoJsonLayer.getBounds());
  }
}
```

### Navigation

```typescript
private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
  const [lng, lat] = args as [number, number];
  const zoom = kwargs.zoom as number;
  const duration = (kwargs.duration as number) || 2000;

  // Leaflet's flyTo uses [lat, lng] and duration in seconds
  this.map.flyTo([lat, lng], zoom || this.map.getZoom(), {
    duration: duration / 1000,
  });
}

private handleFitBounds(args: unknown[], kwargs: Record<string, unknown>): void {
  const [bounds] = args as [[number, number, number, number]];

  // Convert [west, south, east, north] to Leaflet bounds
  const leafletBounds = L.latLngBounds(
    [bounds[1], bounds[0]], // Southwest: [lat, lng]
    [bounds[3], bounds[2]]  // Northeast: [lat, lng]
  );

  this.map.fitBounds(leafletBounds);
}
```

### Controls

```typescript
private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
  const [controlType] = args as [string];
  const position = this.convertPosition(kwargs.position as string);

  let control: L.Control;
  switch (controlType) {
    case 'zoom':
      control = L.control.zoom({ position });
      break;
    case 'scale':
      control = L.control.scale({ position, imperial: false });
      break;
    case 'layers':
      control = L.control.layers({}, {}, { position });
      break;
  }

  control.addTo(this.map);
  this.controlsMap.set(controlType, control);
}

// Convert position from MapLibre format to Leaflet format
private convertPosition(position: string): L.ControlPosition {
  const map: Record<string, L.ControlPosition> = {
    'top-left': 'topleft',
    'top-right': 'topright',
    'bottom-left': 'bottomleft',
    'bottom-right': 'bottomright',
  };
  return map[position] || 'topright';
}
```

## Default Styles

```typescript
private getDefaultStyle(geometryType: string): Record<string, unknown> {
  const defaults = {
    Point: {
      radius: 8,
      fillColor: '#3388ff',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.8,
    },
    LineString: {
      color: '#3388ff',
      weight: 3,
      opacity: 0.8,
    },
    Polygon: {
      fillColor: '#3388ff',
      color: '#0000ff',
      weight: 2,
      fillOpacity: 0.5,
    },
  };
  return defaults[geometryType] || defaults.Point;
}
```

## Source Files

- **Renderer**: `src/leaflet/LeafletRenderer.ts`
- **Types**: `src/types/leaflet.ts`

See also: [Python notebook example](../../notebooks/leaflet.ipynb)
