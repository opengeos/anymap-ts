import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { SolidPolygonLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample polygon data (building footprints)
const polygons = [
  {
    polygon: [
      [-122.402, 37.795],
      [-122.400, 37.795],
      [-122.400, 37.793],
      [-122.402, 37.793],
    ],
    elevation: 200,
    color: [255, 140, 0, 200],
  },
  {
    polygon: [
      [-122.398, 37.796],
      [-122.395, 37.796],
      [-122.395, 37.793],
      [-122.398, 37.793],
    ],
    elevation: 350,
    color: [0, 200, 255, 200],
  },
  {
    polygon: [
      [-122.405, 37.790],
      [-122.401, 37.790],
      [-122.401, 37.787],
      [-122.405, 37.787],
    ],
    elevation: 150,
    color: [255, 100, 100, 200],
  },
  {
    polygon: [
      [-122.395, 37.790],
      [-122.392, 37.790],
      [-122.392, 37.786],
      [-122.395, 37.786],
    ],
    elevation: 280,
    color: [100, 255, 100, 200],
  },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.79],
  zoom: 14,
  pitch: 45,
  bearing: -17,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let elevationScale = 10;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addSolidPolygonLayer(): void {
  const layerId = 'solidpolygon-layer';

  const layer = new SolidPolygonLayer({
    id: layerId,
    data: polygons,
    getPolygon: (d: { polygon: number[][] }) => d.polygon,
    getElevation: (d: { elevation: number }) => d.elevation,
    getFillColor: (d: { color: number[] }) => d.color as [number, number, number, number],
    extruded: true,
    elevationScale,
    pickable: true,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

// Setup elevation scale slider
const elevationSlider = document.getElementById('elevation') as HTMLInputElement;
const elevationValue = document.getElementById('elevationValue') as HTMLSpanElement;

elevationSlider?.addEventListener('input', () => {
  elevationScale = parseInt(elevationSlider.value, 10);
  elevationValue.textContent = elevationSlider.value;
  addSolidPolygonLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addSolidPolygonLayer();
});
