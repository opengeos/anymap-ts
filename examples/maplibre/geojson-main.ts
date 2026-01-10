import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeoJsonLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// GeoJSON FeatureCollection with mixed geometry types
const geojsonData = {
  type: 'FeatureCollection' as const,
  features: [
    // Points - Landmarks
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4194, 37.7749] },
      properties: { name: 'San Francisco City Hall', type: 'landmark', value: 100 },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4862, 37.8199] },
      properties: { name: 'Golden Gate Bridge', type: 'landmark', value: 150 },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4534, 37.8083] },
      properties: { name: 'Alcatraz Island', type: 'landmark', value: 120 },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.3894, 37.7866] },
      properties: { name: 'Ferry Building', type: 'landmark', value: 80 },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4098, 37.7855] },
      properties: { name: 'Union Square', type: 'landmark', value: 90 },
    },
    // LineStrings - Transit routes
    {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-122.4194, 37.7749],
          [-122.4100, 37.7855],
          [-122.3894, 37.7866],
        ],
      },
      properties: { name: 'Market Street Route', type: 'route', value: 5 },
    },
    {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-122.4862, 37.8199],
          [-122.4700, 37.8080],
          [-122.4534, 37.8083],
        ],
      },
      properties: { name: 'Bay Ferry Route', type: 'route', value: 8 },
    },
    {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-122.4194, 37.7749],
          [-122.4300, 37.7600],
          [-122.4400, 37.7550],
          [-122.4500, 37.7650],
        ],
      },
      properties: { name: 'Mission Route', type: 'route', value: 6 },
    },
    // Polygons - Neighborhoods
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.415, 37.795],
          [-122.395, 37.795],
          [-122.395, 37.780],
          [-122.415, 37.780],
          [-122.415, 37.795],
        ]],
      },
      properties: { name: 'Downtown', type: 'neighborhood', value: 500 },
    },
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.430, 37.780],
          [-122.415, 37.780],
          [-122.415, 37.765],
          [-122.430, 37.765],
          [-122.430, 37.780],
        ]],
      },
      properties: { name: 'Mission District', type: 'neighborhood', value: 400 },
    },
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.455, 37.805],
          [-122.440, 37.805],
          [-122.440, 37.795],
          [-122.455, 37.795],
          [-122.455, 37.805],
        ]],
      },
      properties: { name: 'Marina', type: 'neighborhood', value: 350 },
    },
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.420, 37.810],
          [-122.405, 37.810],
          [-122.405, 37.798],
          [-122.420, 37.798],
          [-122.420, 37.810],
        ]],
      },
      properties: { name: 'North Beach', type: 'neighborhood', value: 300 },
    },
  ],
};

// Color mapping based on feature type
function getColor(feature: typeof geojsonData.features[0]): [number, number, number, number] {
  switch (feature.properties.type) {
    case 'landmark':
      return [255, 100, 100, 255];
    case 'route':
      return [100, 200, 255, 255];
    case 'neighborhood':
      return [100, 255, 150, 150];
    default:
      return [200, 200, 200, 255];
  }
}

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.42, 37.79],
  zoom: 12,
  pitch: 30,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addGeoJsonLayer(): void {
  const layerId = 'geojson-features';
  const layer = new GeoJsonLayer({
    id: layerId,
    data: geojsonData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    pointType: 'circle',
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: (f) => getColor(f as typeof geojsonData.features[0]),
    getLineColor: [255, 255, 255, 200],
    getPointRadius: (f) => (f as typeof geojsonData.features[0]).properties.value / 10,
    getLineWidth: (f) => (f as typeof geojsonData.features[0]).properties.value || 2,
    getElevation: (f) => (f as typeof geojsonData.features[0]).properties.value || 0,
    pointRadiusMinPixels: 5,
    pointRadiusMaxPixels: 20,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addGeoJsonLayer();
});
