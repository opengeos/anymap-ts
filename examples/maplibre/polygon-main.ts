import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PolygonLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PolygonData {
  polygon: [number, number][];
  name: string;
  elevation: number;
  fillColor: [number, number, number, number];
  lineColor: [number, number, number, number];
}

// San Francisco districts as polygons
const districts: PolygonData[] = [
  {
    name: 'Financial District',
    polygon: [
      [-122.405, 37.795],
      [-122.395, 37.795],
      [-122.395, 37.785],
      [-122.405, 37.785],
      [-122.405, 37.795],
    ],
    elevation: 500,
    fillColor: [255, 100, 100, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'SoMa',
    polygon: [
      [-122.415, 37.785],
      [-122.395, 37.785],
      [-122.395, 37.770],
      [-122.415, 37.770],
      [-122.415, 37.785],
    ],
    elevation: 400,
    fillColor: [100, 255, 100, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'Mission District',
    polygon: [
      [-122.425, 37.770],
      [-122.405, 37.770],
      [-122.405, 37.750],
      [-122.425, 37.750],
      [-122.425, 37.770],
    ],
    elevation: 350,
    fillColor: [100, 100, 255, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'Chinatown',
    polygon: [
      [-122.410, 37.798],
      [-122.403, 37.798],
      [-122.403, 37.792],
      [-122.410, 37.792],
      [-122.410, 37.798],
    ],
    elevation: 300,
    fillColor: [255, 200, 100, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'North Beach',
    polygon: [
      [-122.415, 37.805],
      [-122.405, 37.805],
      [-122.405, 37.798],
      [-122.415, 37.798],
      [-122.415, 37.805],
    ],
    elevation: 250,
    fillColor: [200, 100, 255, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'Marina District',
    polygon: [
      [-122.445, 37.805],
      [-122.425, 37.805],
      [-122.425, 37.798],
      [-122.445, 37.798],
      [-122.445, 37.805],
    ],
    elevation: 200,
    fillColor: [100, 255, 255, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'Castro',
    polygon: [
      [-122.440, 37.765],
      [-122.425, 37.765],
      [-122.425, 37.755],
      [-122.440, 37.755],
      [-122.440, 37.765],
    ],
    elevation: 300,
    fillColor: [255, 150, 200, 180],
    lineColor: [255, 255, 255, 255],
  },
  {
    name: 'Haight-Ashbury',
    polygon: [
      [-122.455, 37.775],
      [-122.440, 37.775],
      [-122.440, 37.765],
      [-122.455, 37.765],
      [-122.455, 37.775],
    ],
    elevation: 280,
    fillColor: [255, 255, 100, 180],
    lineColor: [255, 255, 255, 255],
  },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.42, 37.78],
  zoom: 13,
  pitch: 45,
  bearing: -17,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addPolygonLayer(): void {
  const layerId = 'polygon-sf-districts';
  const layer = new PolygonLayer<PolygonData>({
    id: layerId,
    data: districts,
    pickable: true,
    stroked: true,
    filled: true,
    wireframe: false,
    extruded: true,
    lineWidthMinPixels: 2,
    getPolygon: (d) => d.polygon,
    getElevation: (d) => d.elevation,
    getFillColor: (d) => d.fillColor,
    getLineColor: (d) => d.lineColor,
    getLineWidth: 2,
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

  addPolygonLayer();
});
