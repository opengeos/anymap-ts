# Cesium

Cesium is a powerful 3D globe visualization library with terrain and 3D Tiles support.

## Python Example

```python
from anymap_ts import CesiumMap

m = CesiumMap(center=[-122.4, 37.8], zoom=10)
m.add_basemap("OpenStreetMap")
m.add_geojson(geojson, name="features", stroke="#ff0000", fill="rgba(255,0,0,0.3)")
m.fly_to(-122.4194, 37.7749, height=50000, heading=45, pitch=-45)
m
```

**Note:** Some features like Cesium World Terrain require a Cesium Ion access token. Set the `CESIUM_TOKEN` environment variable.

## TypeScript Implementation

Cesium is loaded dynamically from CDN since it's too large to bundle:

```typescript
const CESIUM_VERSION = '1.120';
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

// Load Cesium JS dynamically
function loadCesiumJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cesium) {
      resolve();
      return;
    }

    window.CESIUM_BASE_URL = CESIUM_BASE_URL;

    const script = document.createElement('script');
    script.src = `${CESIUM_BASE_URL}/Cesium.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cesium'));
    document.head.appendChild(script);
  });
}
```

### CesiumWidget Class

```typescript
class CesiumWidget {
  private viewer: Cesium.Viewer | null = null;
  private dataSources: Map<string, Cesium.DataSource> = new Map();

  async initialize(): Promise<void> {
    const Cesium = window.Cesium;
    const accessToken = this.model.get('access_token');

    if (accessToken) {
      Cesium.Ion.defaultAccessToken = accessToken;
    }

    // Create viewer
    this.viewer = new Cesium.Viewer(this.container, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      animation: false,
      timeline: false,
    });

    // Set initial camera position
    const center = this.model.get('center');
    const height = this.zoomToHeight(this.model.get('zoom'));

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
    });
  }
}
```

## Key Methods

### Camera Control

```typescript
// Convert zoom level to camera height
function zoomToHeight(zoom: number): number {
  return 40000000 / Math.pow(2, zoom);
}

handle_flyTo(args: unknown[], kwargs: Record<string, unknown>): void {
  const Cesium = window.Cesium;
  const lng = args[0] as number;
  const lat = args[1] as number;
  const height = kwargs.height as number || this.zoomToHeight(kwargs.zoom as number || 10);
  const heading = kwargs.heading as number || 0;
  const pitch = kwargs.pitch as number || -90;
  const duration = kwargs.duration as number ?? 2;

  this.viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
    orientation: {
      heading: Cesium.Math.toRadians(heading),
      pitch: Cesium.Math.toRadians(pitch),
      roll: 0,
    },
    duration,
  });
}

handle_resetView(args: unknown[], kwargs: Record<string, unknown>): void {
  this.viewer.camera.flyHome(kwargs.duration as number ?? 2);
}
```

### Adding GeoJSON

```typescript
async handle_addGeoJSON(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
  const Cesium = window.Cesium;
  const data = kwargs.data as object;
  const name = kwargs.name as string;
  const stroke = kwargs.stroke as string || '#3388ff';
  const fill = kwargs.fill as string || 'rgba(51, 136, 255, 0.5)';

  const dataSource = await Cesium.GeoJsonDataSource.load(data, {
    stroke: Cesium.Color.fromCssColorString(stroke),
    fill: Cesium.Color.fromCssColorString(fill),
    clampToGround: true,
  });

  await this.viewer.dataSources.add(dataSource);
  this.dataSources.set(name, dataSource);

  if (kwargs.flyTo !== false) {
    this.viewer.zoomTo(dataSource);
  }
}
```

### Terrain

```typescript
handle_setTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
  const Cesium = window.Cesium;

  this.viewer.scene.setTerrain(
    Cesium.Terrain.fromWorldTerrain({
      requestVertexNormals: true,
      requestWaterMask: true,
    })
  );
}
```

### Basemap

```typescript
handle_addBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
  const Cesium = window.Cesium;
  const url = args[0] as string;
  const name = kwargs.name as string || 'basemap';

  const imageryProvider = new Cesium.UrlTemplateImageryProvider({ url });
  const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
  this.imageryLayers.set(name, layer);
}
```

## 3D Features

### Camera Orientation

Cesium supports full 3D camera control with heading, pitch, and roll:

```typescript
// Heading: rotation around the vertical axis (0-360 degrees)
// Pitch: rotation around the lateral axis (-90 to 90 degrees)
// Roll: rotation around the longitudinal axis

this.viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
  orientation: {
    heading: Cesium.Math.toRadians(45),  // 45 degrees from north
    pitch: Cesium.Math.toRadians(-45),   // 45 degrees down
    roll: 0,
  },
});
```

### 3D Tilesets

```typescript
handle_add3DTileset(args: unknown[], kwargs: Record<string, unknown>): void {
  const Cesium = window.Cesium;
  const url = kwargs.url as string;
  const name = kwargs.name as string;

  const tileset = this.viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({ url })
  );

  this.tilesets.set(name, tileset);
}
```

## Source Files

- **Widget**: `src/cesium/index.ts`
- **Types**: `src/types/cesium.ts`

See also: [Python notebook example](../../notebooks/cesium.ipynb)
