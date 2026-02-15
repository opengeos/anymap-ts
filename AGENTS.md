# anymap-ts Developer Guide

This document provides essential information for AI coding agents working on the anymap-ts project.

## Project Overview

**anymap-ts** is a Python package for creating interactive maps in Jupyter notebooks using [anywidget](https://anywidget.dev/) and TypeScript. It provides a unified Python interface to multiple JavaScript mapping libraries.

### Supported Mapping Libraries

| Library | Module | Use Case |
|---------|--------|----------|
| MapLibre GL JS | `MapLibreMap` | Default, general-purpose vector maps |
| Mapbox GL JS | `MapboxMap` | Advanced styling, 3D terrain |
| Leaflet | `LeafletMap` | Lightweight, mobile-friendly maps |
| OpenLayers | `OpenLayersMap` | Enterprise, WMS/WMTS, projections |
| DeckGL | `DeckGLMap` | GPU-accelerated data visualization |
| Cesium | `CesiumMap` | 3D globe, terrain, 3D Tiles |
| KeplerGL | `KeplerGLMap` | Data exploration UI |
| Potree | `PotreeViewer` | LiDAR point cloud visualization |

### Architecture

The project follows a hybrid Python/TypeScript architecture:

- **Python side (`anymap_ts/`)**: Widget classes extending `anywidget.AnyWidget` with traitlets for state synchronization
- **TypeScript side (`src/`)**: Renderer classes extending `BaseMapRenderer` that handle the actual map rendering
- **Communication**: Bidirectional via anywidget's traitlet synchronization (`_js_calls`, `_js_events`)

## Project Structure

```
anymap-ts/
├── src/                          # TypeScript source code
│   ├── index.ts                  # Main entry point (exports MapLibre by default)
│   ├── core/                     # Base classes
│   │   ├── BaseMapRenderer.ts    # Abstract base for all renderers
│   │   └── StateManager.ts       # State persistence
│   ├── maplibre/                 # MapLibre implementation
│   │   ├── MapLibreRenderer.ts   # Main renderer class
│   │   ├── adapters/             # Layer adapters (COG, Zarr, DeckGL)
│   │   ├── plugins/              # UI plugins (GeoEditor, LayerControl)
│   │   └── index.ts              # Widget entry point (render function)
│   ├── mapbox/, leaflet/, ...    # Other library implementations
│   └── types/                    # TypeScript type definitions
│       ├── anywidget.ts          # Widget communication types
│       ├── maplibre.ts           # MapLibre-specific types
│       └── ...
├── anymap_ts/                    # Python package
│   ├── __init__.py               # Exports all map classes
│   ├── base.py                   # MapWidget base class
│   ├── maplibre.py               # MapLibreMap widget
│   ├── mapbox.py, leaflet.py...  # Other widget implementations
│   ├── basemaps.py               # Basemap URL utilities
│   ├── utils.py                  # Helper functions
│   └── static/                   # Built JavaScript/CSS bundles
├── examples/                     # HTML examples for development
├── docs/                         # MkDocs documentation
├── tests/                        # Test suites
│   ├── python/                   # pytest tests
│   └── typescript/               # vitest tests
└── package.json                  # npm scripts and dependencies
```

## Technology Stack

### Python
- **Python**: 3.10+
- **Build system**: hatchling + hatch-jupyter-builder
- **Core dependencies**: anywidget>=0.9.0, traitlets>=5.0.0, xyzservices>=2023.10.0
- **Optional**: geopandas (vector), localtileserver (raster)
- **Testing**: pytest, pytest-cov
- **Linting**: ruff, black, mypy

### TypeScript/JavaScript
- **Target**: ES2022, ESNext modules
- **Build tools**: esbuild (library bundles), Vite (examples)
- **Testing**: vitest with jsdom environment
- **Key dependencies**:
  - maplibre-gl >=5.16.0
  - mapbox-gl ^3.18.1
  - leaflet ^1.9.4
  - deck.gl 9.2.6
  - cesium ^1.138.0
  - ol (OpenLayers) ^10.8.0

## Build Commands

### Setup
```bash
# Install Python package in editable mode
pip install -e ".[dev]"

# Install Node.js dependencies
npm install --legacy-peer-deps
```

### Build JavaScript Bundles
```bash
# Build all library bundles (production)
npm run build:lib
# or
npm run build:prod

# Build specific libraries
npm run build:maplibre    # Primary target, builds by default
npm run build:mapbox
npm run build:leaflet
npm run build:deckgl
npm run build:openlayers
npm run build:cesium
npm run build:keplergl
npm run build:potree

# Build all including examples
npm run build:all

# Watch mode (development)
npm run watch
```

### Python Package Build
The Python package build automatically triggers npm builds via `hatch-jupyter-builder`:
```bash
# Build wheel (includes JS bundles)
pip install build
python -m build
```

### Development Server
```bash
# Start Vite dev server for examples
npm run dev           # Serves examples/ directory on port 5173
```

## Testing

### Python Tests
```bash
# Run all Python tests with coverage
pytest

# Run specific test file
pytest tests/python/test_basemaps.py
```

Configuration in `pyproject.toml`:
- Test path: `tests/python/`
- Coverage includes: `anymap_ts/` module
- Coverage omits: tests, `__pycache__`

### TypeScript Tests
```bash
# Run all TypeScript tests once
npm run test

# Run in watch mode
npm run test:watch
```

Configuration in `vitest.config.ts`:
- Environment: jsdom
- Setup file: `tests/typescript/setup.ts`
- Test pattern: `tests/typescript/**/*.test.ts`
- Path aliases: `@core`, `@maplibre`, `@types`

## Code Style Guidelines

### Python
- **Line length**: 88 characters (ruff default)
- **Target version**: Python 3.9+
- **Import style**: Use `from __future__ import annotations`
- **Type hints**: Encouraged, use `typing` imports
- **Formatting**: Black (via pre-commit)
- **Linting**: ruff with rules E, F, I, N, W, UP

### TypeScript
- **Strict mode**: Enabled
- **Module resolution**: bundler
- **Path aliases**:
  - `@core/*` → `src/core/*`
  - `@maplibre/*` → `src/maplibre/*`
  - `@types/*` → `src/types/*`
- **File naming**: PascalCase for classes (e.g., `MapLibreRenderer.ts`)

### Pre-commit Hooks
Installed hooks (see `.pre-commit-config.yaml`):
- check-toml, check-yaml
- end-of-file-fixer, trailing-whitespace
- black-jupyter (Python formatting)
- codespell (spell checking)
- nbstripout (notebook output stripping)

Run manually: `pre-commit run --all-files`

## Adding a New Map Library

To add support for a new mapping library:

1. **TypeScript side** (`src/`):
   - Create `src/<library>/` directory
   - Create `<Library>Renderer.ts` extending `BaseMapRenderer<TMap>`
   - Implement abstract methods: `initialize()`, `destroy()`, `createMap()`, `onCenterChange()`, `onZoomChange()`, `onStyleChange()`
   - Create `index.ts` with the anywidget `render()` function
   - Add npm build script in `package.json`

2. **Python side** (`anymap_ts/`):
   - Create `<library>.py` with widget class extending `MapWidget`
   - Set `_esm` and `_css` to point to built bundles in `static/`
   - Add library-specific traitlets as needed
   - Export class in `__init__.py`

3. **Build**:
   - Add library to `build:lib` script
   - Update hatchling `ensured-targets` if needed

4. **Tests**:
   - Add Python tests in `tests/python/`
   - Add TypeScript tests if applicable

## Widget Communication Protocol

### Python → JavaScript
Python calls JavaScript methods via the `_js_calls` traitlet:

```python
# In Python (base.py)
def call_js_method(self, method: str, *args, **kwargs) -> None:
    self._js_method_counter += 1
    call = {
        "id": self._js_method_counter,
        "method": method,
        "args": list(args),
        "kwargs": kwargs,
    }
    self._js_calls = self._js_calls + [call]  # Triggers sync
```

JavaScript processes calls in `BaseMapRenderer.processJsCalls()`.

### JavaScript → Python
JavaScript sends events via the `_js_events` traitlet:

```typescript
// In TypeScript (BaseMapRenderer.ts)
protected sendEvent(type: string, data: unknown): void {
    const event: JsEvent = {
        type,
        data,
        timestamp: Date.now(),
    };
    this.eventQueue.push(event);
    this.model.set('_js_events', [...this.eventQueue]);
    this.model.save_changes();
}
```

Python handles events in `MapWidget._handle_js_events()`.

## Environment Variables

| Variable | Used By | Description |
|----------|---------|-------------|
| `MAPBOX_TOKEN` | MapboxMap, KeplerGLMap | Mapbox access token |
| `CESIUM_TOKEN` | CesiumMap | Cesium Ion access token |

## Documentation

Documentation is built with MkDocs (Material theme):

```bash
# Install docs dependencies
pip install -e ".[docs]"

# Serve docs locally
mkdocs serve

# Build docs
mkdocs build
```

- Source: `docs/`
- Notebooks: `docs/notebooks/` (linked from `examples/`)
- API docs: Auto-generated via mkdocstrings

## Security Considerations

- HTML export (`to_html()`) generates standalone files with embedded JavaScript
- User-provided URLs for tiles/WMS are passed through to the frontend
- No sanitization of GeoJSON properties (displayed as-is in popups)

## Release Process

1. Update version in `anymap_ts/_version.py`
2. Update CHANGELOG
3. Build and test: `npm run build:all && pytest`
4. Create git tag: `git tag vX.Y.Z`
5. Push tag: `git push origin vX.Y.Z`
6. GitHub Actions will build and publish to PyPI

The conda-forge package is maintained separately at [conda-forge/anymap-ts-feedstock](https://github.com/conda-forge/anymap-ts-feedstock).

## Useful Resources

- [anywidget documentation](https://anywidget.dev/)
- [MapLibre GL JS docs](https://maplibre.org/maplibre-gl-js/docs/)
- [traitlets documentation](https://traitlets.readthedocs.io/)
- Project docs: https://ts.anymap.dev
