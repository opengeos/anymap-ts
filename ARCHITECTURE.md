# Architecture

This document describes the architecture of anymap-ts, a TypeScript/Python hybrid package that provides interactive maps in Jupyter notebooks via [anywidget](https://anywidget.dev/).

## Overview

anymap-ts consists of two halves:

1. **TypeScript frontend** (`src/`) -- renders interactive maps in the browser using various mapping libraries (MapLibre, Mapbox, Leaflet, OpenLayers, Deck.gl, Cesium, Kepler.gl, Potree).
2. **Python backend** (`anymap_ts/`) -- provides the Jupyter widget API and communicates with the frontend via traitlets.

The two halves communicate through anywidget's bidirectional model synchronization.

## Directory Structure

```
src/
  core/             # Abstract base classes and state management
  types/            # TypeScript type definitions for each library
  utils/            # Shared utility functions (color conversion, geo helpers)
  styles/           # CSS stylesheets
  maplibre/         # MapLibre GL JS renderer (primary implementation)
    adapters/       # Layer control adapters (COG, Deck, Zarr, Marker, LiDAR)
    plugins/        # Optional plugins (GeoEditor, LayerControl)
    layers/         # Custom layer implementations
  mapbox/           # Mapbox GL JS renderer
  leaflet/          # Leaflet renderer
  openlayers/       # OpenLayers renderer
  deckgl/           # Deck.gl renderer (extends MapLibre)
  cesium/           # Cesium 3D globe renderer
  keplergl/         # Kepler.gl renderer
  potree/           # Potree point cloud viewer
```

## Python-JS Communication

Communication between Python and JavaScript uses anywidget's traitlet system:

### Python to JS (Method Calls)

Python calls JS methods by appending to the `_js_calls` traitlet:

```
Python                          JavaScript
------                          ----------
m.add_layer(...)  -->  _js_calls: [{id, method, args, kwargs}]
                                    |
                       BaseMapRenderer.processJsCalls()
                                    |
                       methodHandlers.get(method)(args, kwargs)
```

Each call has a unique `id` for deduplication. Calls made before the map is ready are queued in `pendingCalls` and processed once the map fires its `load` event.

### JS to Python (Events)

JS sends events to Python via the `_js_events` traitlet:

```
JavaScript                      Python
----------                      ------
sendEvent('click', data)  -->  _js_events: [{type, data, timestamp}]
                                    |
                               model.observe(callback)
```

### State Persistence

The `_layers`, `_sources`, and `_controls` traitlets persist widget state. When a map widget is displayed in a subsequent Jupyter cell, `restoreState()` replays sources and layers from these traitlets to recreate the map. The `StateManager` class manages updates to these traitlets.

## BaseMapRenderer

`BaseMapRenderer<TMap>` (`src/core/BaseMapRenderer.ts`) is the abstract base class for all renderers. It provides:

- **Model communication**: `processJsCalls()`, `sendEvent()`, `setupModelListeners()`
- **Handler registry**: `registerMethod(name, handler)` / `executeMethod(method, args, kwargs)`
- **State restoration**: `restoreState()` for multi-cell rendering
- **Lifecycle**: `initialize()` (abstract), `destroy()` (abstract)

Subclasses implement `createMap()`, `onCenterChange()`, `onZoomChange()`, `onStyleChange()`, and register their method handlers.

## Renderer Hierarchy

```
BaseMapRenderer<TMap>
  |
  +-- MapLibreRenderer        (primary, ~80+ handlers)
  |     +-- DeckGLRenderer    (extends with heavy geo-layers)
  |
  +-- MapboxRenderer           (standalone, similar API to MapLibre)
  +-- LeafletRenderer         (standalone)
  +-- OpenLayersRenderer      (standalone)
  +-- CesiumRenderer          (standalone, 3D globe)
```

KeplerGL and Potree are standalone implementations that don't extend BaseMapRenderer.

## Handler Registration

Each renderer registers its handlers in a `registerMethods()` method called from the constructor:

```typescript
private registerMethods(): void {
  this.registerMethod('flyTo', this.handleFlyTo.bind(this));
  this.registerMethod('addLayer', this.handleAddLayer.bind(this));
  // ...
}
```

Handlers follow a consistent signature: `(args: unknown[], kwargs: Record<string, unknown>) => void`

## Adapter Pattern (Layer Control)

The layer control plugin (`maplibre-gl-layer-control`) only understands native MapLibre layers. To integrate non-native layer types (Deck.gl, COG, Zarr, LiDAR, Markers), adapters provide a translation layer:

```
LayerControlPlugin
  |
  +-- COGLayerAdapter      -- wraps deck.gl COG layers
  +-- DeckLayerAdapter     -- wraps generic deck.gl layers
  +-- ZarrLayerAdapter     -- wraps @carbonplan/zarr-layer
  +-- MarkerLayerAdapter   -- wraps marker groups
  +-- LidarLayerAdapter    -- wraps LiDAR point cloud layers
```

Each adapter implements the interface expected by the layer control, mapping visibility toggles and metadata queries to the underlying layer type.

## Plugin System

Users can load private JavaScript plugins at runtime via `handleLoadPlugin`. Plugins can be loaded from:

- **URL**: `js_url` / `css_url` for external scripts and styles
- **Inline code**: `js_code` / `css_code` for embedded JavaScript and CSS

Plugin instances are stored in `pluginInstances` and can be called from Python via `callPluginMethod`.

## Build System

Each renderer is bundled independently using esbuild:

```
npm run build:maplibre  -->  anymap_ts/static/maplibre.js
npm run build:mapbox    -->  anymap_ts/static/mapbox.js
npm run build:leaflet   -->  anymap_ts/static/leaflet.js
...
```

This keeps bundle sizes manageable since users only load the renderer they need. The Python build system (hatchling + hatch-jupyter-builder) automatically runs `npm run build:prod` when building wheels.

## Adding a New Mapping Library

1. Create a new directory under `src/` (e.g., `src/newlib/`)
2. Implement a renderer class extending `BaseMapRenderer<NewLibMap>`:
   - Implement `createMap()`, `initialize()`, `destroy()`
   - Implement `onCenterChange()`, `onZoomChange()`, `onStyleChange()`
   - Register method handlers in the constructor
3. Create an `index.ts` that exports an anywidget-compatible render function
4. Add a build script in `package.json`
5. Create a corresponding Python class in `anymap_ts/` extending `MapWidget`
6. Add type definitions in `src/types/` if needed

## Testing

- **TypeScript unit tests**: `tests/typescript/` using Vitest with jsdom environment
- **Python unit tests**: `tests/python/` using pytest with coverage
- **E2E tests**: `tests/e2e/` using Playwright in JupyterLab
- **Notebook tests**: `tests/notebooks/` using nbmake
