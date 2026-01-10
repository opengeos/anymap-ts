import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { BitmapLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Sample satellite image URL (OpenStreetMap tile as example)
const IMAGE_URL = 'https://tile.openstreetmap.org/10/163/395.png';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 10,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let currentOpacity = 1;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addBitmapLayer(): void {
  const layerId = 'bitmap-overlay';

  // Define bounds for the image [west, south, east, north]
  const bounds: [number, number, number, number] = [-122.6, 37.6, -122.2, 38.0];

  const layer = new BitmapLayer({
    id: layerId,
    image: IMAGE_URL,
    bounds,
    opacity: currentOpacity,
    pickable: false,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

function updateBitmapOpacity(opacity: number): void {
  currentOpacity = opacity;
  const layerId = 'bitmap-overlay';
  const bounds: [number, number, number, number] = [-122.6, 37.6, -122.2, 38.0];

  const layer = new BitmapLayer({
    id: layerId,
    image: IMAGE_URL,
    bounds,
    opacity: currentOpacity,
    pickable: false,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
}

// Setup opacity slider
const opacitySlider = document.getElementById('opacity') as HTMLInputElement;
const opacityValue = document.getElementById('opacityValue') as HTMLSpanElement;

opacitySlider?.addEventListener('input', () => {
  const value = parseInt(opacitySlider.value, 10);
  opacityValue.textContent = `${value}%`;
  updateBitmapOpacity(value / 100);
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addBitmapLayer();
});
