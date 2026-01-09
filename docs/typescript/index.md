# TypeScript Examples

anymap-ts is built with TypeScript, providing type-safe interactive maps through the anywidget framework. This section demonstrates how to use the TypeScript renderers directly.

## Architecture Overview

anymap-ts uses the **anywidget** pattern for Python-JavaScript communication:

```
Python (anymap_ts)  <-->  anywidget model  <-->  TypeScript Renderer
```

Each map type has a corresponding TypeScript renderer that:

1. Receives a `model` object for state synchronization with Python
2. Receives an `el` DOM element for rendering
3. Handles method calls from Python via `_js_calls`
4. Sends events back to Python via `_js_events`

## Available Renderers

| Renderer | Library | Source File |
|----------|---------|-------------|
| `MapLibreRenderer` | MapLibre GL JS | `src/maplibre/MapLibreRenderer.ts` |
| `LeafletRenderer` | Leaflet | `src/leaflet/LeafletRenderer.ts` |
| `MapboxRenderer` | Mapbox GL JS | `src/mapbox/MapboxRenderer.ts` |
| `CesiumWidget` | Cesium | `src/cesium/index.ts` |
| `DeckGLRenderer` | DeckGL + MapLibre | `src/deckgl/DeckGLRenderer.ts` |
| `OpenLayersRenderer` | OpenLayers | `src/openlayers/OpenLayersRenderer.ts` |
| `PotreeWidget` | Potree | `src/potree/index.ts` |
| `KeplerGLWidget` | KeplerGL | `src/keplergl/index.ts` |

## Examples by Category

### Basic Mapping

- [MapLibre GL JS](examples/maplibre.md) - Vector maps with drawing and layer control
- [Leaflet](examples/leaflet.md) - Lightweight, mobile-friendly maps
- [Mapbox GL JS](examples/mapbox.md) - Commercial vector maps (requires token)
- [OpenLayers](examples/openlayers.md) - Feature-rich with WMS/WMTS support

### 3D Visualization

- [Cesium](examples/cesium.md) - 3D globe with terrain and 3D Tiles

### GPU-Accelerated Layers

- [DeckGL](examples/deckgl.md) - ScatterplotLayer, HexagonLayer, HeatmapLayer, ArcLayer

### Scientific Data

- [COG Layer](examples/cog_layer.md) - Cloud Optimized GeoTIFF visualization
- [Zarr Layer](examples/zarr_layer.md) - Multi-dimensional dataset visualization

### Specialized Viewers

- [Potree](examples/potree.md) - Point cloud visualization for LiDAR
- [KeplerGL](examples/keplergl.md) - Interactive data exploration

## Core Types

The anywidget communication types are defined in `src/types/anywidget.ts`:

```typescript
// Method call from Python to JavaScript
interface JsCall {
  id: number;
  method: string;
  args: unknown[];
  kwargs: Record<string, unknown>;
}

// Event from JavaScript to Python
interface JsEvent {
  type: string;
  data: unknown;
  timestamp: number;
}

// Render context provided by anywidget
interface RenderContext {
  model: MapWidgetModel;
  el: HTMLElement;
}
```

## TypeScript Source Files

Standalone TypeScript example files are available in `src/examples/`:

| File | Description |
|------|-------------|
| `maplibre.ts` | MapLibre with draw and layer control |
| `leaflet.ts` | Leaflet with markers and GeoJSON |
| `mapbox.ts` | Mapbox GL JS example |
| `cesium.ts` | Cesium 3D globe |
| `deckgl.ts` | DeckGL visualization layers |
| `openlayers.ts` | OpenLayers mapping |
| `potree.ts` | Potree point cloud viewer |
| `keplergl.ts` | KeplerGL data exploration |
| `cog_layer.ts` | COG layer visualization |
| `zarr_layer.ts` | Zarr layer visualization |
