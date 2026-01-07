/**
 * Vitest setup file for TypeScript tests.
 */

import { vi } from 'vitest';

// Mock MapLibre GL
vi.mock('maplibre-gl', () => ({
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn((event, callback) => {
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

// Mock window.URL.createObjectURL
if (typeof global.URL.createObjectURL === 'undefined') {
  global.URL.createObjectURL = vi.fn();
}
