import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TerrainLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

// Terrain-RGB elevation data URL template
const TERRAIN_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// Satellite imagery for texture
const TEXTURE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-119.5, 37.7], // Yosemite area
  zoom: 10,
  pitch: 60,
  bearing: 30,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addTerrainLayer(): void {
  const layerId = 'terrain-3d';
  const layer = new TerrainLayer({
    id: layerId,
    elevationData: TERRAIN_URL,
    texture: TEXTURE_URL,
    elevationDecoder: {
      rScaler: 256,
      gScaler: 1,
      bScaler: 1 / 256,
      offset: -32768,
    },
    meshMaxError: 4,
    opacity: 1,
    pickable: false,
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

  addTerrainLayer();
});
