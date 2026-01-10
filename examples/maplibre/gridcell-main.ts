import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { GridCellLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Generate grid cell data
function generateGridCells(centerLng: number, centerLat: number, count: number) {
  const cells = [];
  const gridSize = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (cells.length >= count) break;
      cells.push({
        position: [
          centerLng + (i - gridSize / 2) * 0.003,
          centerLat + (j - gridSize / 2) * 0.003,
        ],
        elevation: Math.random() * 1000 + 100,
        color: [
          Math.floor(Math.random() * 155 + 100),
          Math.floor(Math.random() * 155 + 100),
          255,
          200,
        ],
      });
    }
  }
  return cells;
}

const gridCells = generateGridCells(-122.4, 37.8, 100);

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 12,
  pitch: 45,
  bearing: -17,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

let cellSize = 200;

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addGridCellLayer(): void {
  const layerId = 'gridcell-layer';

  const layer = new GridCellLayer({
    id: layerId,
    data: gridCells,
    getPosition: (d: { position: number[] }) => d.position as [number, number],
    getElevation: (d: { elevation: number }) => d.elevation,
    getFillColor: (d: { color: number[] }) => d.color as [number, number, number, number],
    cellSize,
    extruded: true,
    elevationScale: 1,
    pickable: true,
  });

  deckLayers.set(layerId, layer);
  updateOverlay();
  deckAdapter.notifyLayerAdded(layerId);
}

// Setup cell size slider
const cellSizeSlider = document.getElementById('cellSize') as HTMLInputElement;
const cellSizeValue = document.getElementById('cellSizeValue') as HTMLSpanElement;

cellSizeSlider?.addEventListener('input', () => {
  cellSize = parseInt(cellSizeSlider.value, 10);
  cellSizeValue.textContent = `${cellSize}m`;
  addGridCellLayer();
});

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  addGridCellLayer();
});
