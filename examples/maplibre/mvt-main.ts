import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 11,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let currentLineWidth = 1;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addMVTLayer(): void {
  const layerId = 'mvt-layer';

  const layer = new MVTLayer({
    id: layerId,
    data: 'https://tiles.basemaps.cartocdn.com/vectortiles/carto.streets/v1/{z}/{x}/{y}.mvt',
    minZoom: 0,
    maxZoom: 14,
    getLineColor: [255, 255, 255, 200],
    getFillColor: [100, 130, 180, 100],
    getLineWidth: currentLineWidth,
    lineWidthMinPixels: 1,
    pickable: true,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

// Setup line width slider
const widthSlider = document.getElementById('lineWidth') as HTMLInputElement;
const widthValue = document.getElementById('widthValue') as HTMLSpanElement;

widthSlider?.addEventListener('input', () => {
  currentLineWidth = parseInt(widthSlider.value, 10);
  widthValue.textContent = widthSlider.value;
  addMVTLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addMVTLayer();
});
