/**
 * Vitest setup file for TypeScript tests.
 */

import { vi } from 'vitest';

// Mock MapLibre GL (includes addProtocol for pmtiles registration)
vi.mock('maplibre-gl', () => ({
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn((event: string, callback: () => void) => {
      if (event === 'load') {
        setTimeout(callback, 0);
      }
    }),
    off: vi.fn(),
    addSource: vi.fn(),
    getSource: vi.fn().mockReturnValue(null),
    removeSource: vi.fn(),
    addLayer: vi.fn(),
    getLayer: vi.fn().mockReturnValue(null),
    removeLayer: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    setStyle: vi.fn(),
    setPaintProperty: vi.fn(),
    setLayoutProperty: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    getCenter: vi.fn().mockReturnValue({ lng: 0, lat: 0 }),
    getZoom: vi.fn().mockReturnValue(2),
    getBounds: vi.fn().mockReturnValue({
      getWest: () => -180,
      getSouth: () => -90,
      getEast: () => 180,
      getNorth: () => 90,
    }),
    getStyle: vi.fn().mockReturnValue({ layers: [] }),
    addControl: vi.fn(),
    removeControl: vi.fn(),
    remove: vi.fn(),
  })),
  addProtocol: vi.fn(),
  NavigationControl: vi.fn(),
  ScaleControl: vi.fn(),
  FullscreenControl: vi.fn(),
  GeolocateControl: vi.fn(),
  AttributionControl: vi.fn(),
  Marker: vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  Popup: vi.fn().mockImplementation(() => ({
    setHTML: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
}));

// Mock pmtiles (Protocol must be a class/constructor)
vi.mock('pmtiles', () => ({
  Protocol: class MockProtocol {
    tile = vi.fn();
  },
}));

// Mock maplibre-gl-layer-control
vi.mock('maplibre-gl-layer-control', () => ({
  LayerControl: vi.fn().mockImplementation(() => ({
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  })),
}));

// Mock maplibre-gl-geo-editor
vi.mock('maplibre-gl-geo-editor', () => ({
  GeoEditor: vi.fn().mockImplementation(() => ({
    setGeoman: vi.fn(),
    getFeatures: vi.fn().mockReturnValue({ type: 'FeatureCollection', features: [] }),
    loadGeoJson: vi.fn(),
    selectFeatures: vi.fn(),
    deleteSelectedFeatures: vi.fn(),
    getSelectedFeatures: vi.fn().mockReturnValue([]),
    enableDrawMode: vi.fn(),
    enableEditMode: vi.fn(),
    disableAllModes: vi.fn(),
  })),
}));

// Mock @geoman-io/maplibre-geoman-free
vi.mock('@geoman-io/maplibre-geoman-free', () => ({
  Geoman: vi.fn().mockImplementation(() => ({})),
}));

// Mock maplibre-gl-components
vi.mock('maplibre-gl-components', () => ({
  default: {},
}));

// Mock maplibre-gl-lidar
vi.mock('maplibre-gl-lidar', () => ({
  default: vi.fn(),
  LidarPanel: vi.fn().mockImplementation(() => ({
    onAdd: vi.fn(),
    onRemove: vi.fn(),
  })),
}));

// Mock Leaflet — `import * as L from 'leaflet/dist/leaflet-src.esm.js'`
// requires named exports at the top level of the module mock.
vi.mock('leaflet/dist/leaflet-src.esm.js', () => ({
  map: vi.fn().mockImplementation(() => ({
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    addLayer: vi.fn().mockReturnThis(),
    removeLayer: vi.fn().mockReturnThis(),
    addControl: vi.fn().mockReturnThis(),
    removeControl: vi.fn().mockReturnThis(),
    getCenter: vi.fn().mockReturnValue({ lat: 0, lng: 0 }),
    getZoom: vi.fn().mockReturnValue(2),
    getBounds: vi.fn().mockReturnValue({
      getWest: () => -180,
      getSouth: () => -90,
      getEast: () => 180,
      getNorth: () => 90,
      toBBoxString: () => '-180,-90,180,90',
    }),
    setZoom: vi.fn().mockReturnThis(),
    panTo: vi.fn().mockReturnThis(),
    flyTo: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn(),
    remove: vi.fn(),
    getContainer: vi.fn().mockReturnValue(document.createElement('div')),
  })),
  tileLayer: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  marker: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    bindTooltip: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  popup: vi.fn().mockImplementation(() => ({
    setContent: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    openOn: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  geoJSON: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    getBounds: vi.fn().mockReturnValue({
      isValid: () => true,
      getWest: () => -180,
      getSouth: () => -90,
      getEast: () => 180,
      getNorth: () => 90,
    }),
  })),
  control: {
    layers: vi.fn().mockImplementation(() => ({
      addTo: vi.fn().mockReturnThis(),
      addOverlay: vi.fn(),
      addBaseLayer: vi.fn(),
      remove: vi.fn(),
    })),
    scale: vi.fn().mockImplementation(() => ({
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    })),
  },
  circleMarker: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
  layerGroup: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    remove: vi.fn(),
    clearLayers: vi.fn(),
  })),
  Icon: {
    Default: {
      prototype: { _getIconUrl: null } as any,
      mergeOptions: vi.fn(),
    },
  },
  icon: vi.fn().mockReturnValue({}),
  divIcon: vi.fn().mockReturnValue({}),
  DomUtil: {
    create: vi.fn().mockImplementation((tag: string) => document.createElement(tag)),
  },
}));

// Mock leaflet.heat
vi.mock('leaflet.heat', () => ({}));

// Mock Leaflet CSS and asset imports
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: 'data:image/png;base64,mock' }));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: 'data:image/png;base64,mock' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: 'data:image/png;base64,mock' }));

// Mock CSS imports used by renderers
vi.mock('@geoman-io/maplibre-geoman-free/dist/maplibre-geoman.css', () => ({}));
vi.mock('maplibre-gl-geo-editor/style.css', () => ({}));
vi.mock('maplibre-gl-layer-control/style.css', () => ({}));
vi.mock('maplibre-gl-lidar/style.css', () => ({}));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('../src/styles/maplibre.css', () => ({}));

// Mock window.URL.createObjectURL
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = vi.fn();
}

// Mock ResizeObserver (not available in jsdom)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}
