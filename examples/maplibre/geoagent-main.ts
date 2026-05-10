import maplibregl from 'maplibre-gl';
import { LayerControl } from 'maplibre-gl-layer-control';
import { GeoAgentControl } from 'maplibre-gl-geoagent';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-layer-control/style.css';
import 'maplibre-gl-geoagent/style.css';

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const cityData = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4194, 37.7749] },
      properties: { name: 'San Francisco City Hall', category: 'civic' },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.3937, 37.7955] },
      properties: { name: 'Ferry Building', category: 'landmark' },
    },
    {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-122.4783, 37.8199] },
      properties: { name: 'Golden Gate Bridge', category: 'landmark' },
    },
  ],
};

const neighborhoodData = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-122.431, 37.789],
          [-122.402, 37.789],
          [-122.402, 37.773],
          [-122.431, 37.773],
          [-122.431, 37.789],
        ]],
      },
      properties: { name: 'Central SF sample area' },
    },
  ],
};

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP_STYLE,
  center: [-122.431, 37.789],
  zoom: 12,
  maxPitch: 85,
  canvasContextAttributes: { preserveDrawingBuffer: true },
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const layerControl = new LayerControl({
  collapsed: true,
  layers: ['sf-sample-area', 'sf-landmarks'],
  panelWidth: 320,
  panelMinWidth: 240,
  panelMaxWidth: 420,
  basemapStyleUrl: BASEMAP_STYLE,
});
map.addControl(layerControl, 'top-right');

map.on('load', () => {
  map.addSource('sf-landmarks-source', {
    type: 'geojson',
    data: cityData,
  });

  map.addLayer({
    id: 'sf-landmarks',
    type: 'circle',
    source: 'sf-landmarks-source',
    paint: {
      'circle-color': [
        'match',
        ['get', 'category'],
        'civic', '#d9480f',
        'landmark', '#0b7285',
        '#495057',
      ],
      'circle-radius': 8,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
    },
  });

  map.addSource('sf-sample-area-source', {
    type: 'geojson',
    data: neighborhoodData,
  });

  map.addLayer({
    id: 'sf-sample-area',
    type: 'fill',
    source: 'sf-sample-area-source',
    paint: {
      'fill-color': '#2f9e44',
      'fill-opacity': 0.25,
      'fill-outline-color': '#2b8a3e',
    },
  }, 'sf-landmarks');

  const geoAgent = new GeoAgentControl({
    title: 'GeoAgent',
    collapsed: false,
    position: 'top-left',
    panelWidth: 420,
    panelMinWidth: 340,
    panelMaxWidth: 680,
    defaultProvider: 'openai-responses',
    allowCodeExecutionDefault: false,
    allowDestructiveToolsDefault: false,
    showPermissionToggles: false,
    basemaps: {
      Liberty: BASEMAP_STYLE,
      Positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      DarkMatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    },
  });

  geoAgent.on('statechange', (event) => {
    console.log('GeoAgent state changed:', event.state);
  });

  map.addControl(geoAgent, 'top-left');
});
