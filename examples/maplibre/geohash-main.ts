import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GeohashLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample geohash data (around San Francisco area, precision 5)
const geohashData = [
  { geohash: '9q8yy', value: 150 },
  { geohash: '9q8yz', value: 200 },
  { geohash: '9q8yv', value: 180 },
  { geohash: '9q8yw', value: 250 },
  { geohash: '9q8yx', value: 300 },
  { geohash: '9q8yu', value: 220 },
  { geohash: '9q8yt', value: 190 },
  { geohash: '9q8ys', value: 280 },
  { geohash: '9q8yr', value: 170 },
  { geohash: '9q8yq', value: 230 },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.75],
  zoom: 10,
  pitch: 45,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let elevationScale = 100;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addGeohashLayer(): void {
  const layerId = 'geohash-layer';

  const layer = new GeohashLayer({
    id: layerId,
    data: geohashData,
    getGeohash: (d: { geohash: string }) => d.geohash,
    getFillColor: [100, 200, 100, 180],
    getElevation: (d: { value: number }) => d.value,
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
  addGeohashLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addGeohashLayer();
});
