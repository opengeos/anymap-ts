import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface H3Data {
  hexagon: string;
  value: number;
}

// Sample H3 hexagon data around San Francisco (resolution 7)
const h3Data: H3Data[] = [
  { hexagon: '872830828ffffff', value: 100 },
  { hexagon: '87283082affffff', value: 200 },
  { hexagon: '87283082bffffff', value: 150 },
  { hexagon: '872830829ffffff', value: 300 },
  { hexagon: '87283095affffff', value: 250 },
  { hexagon: '87283095bffffff', value: 180 },
  { hexagon: '872830958ffffff', value: 220 },
  { hexagon: '872830959ffffff', value: 270 },
  { hexagon: '8728309caffffff', value: 190 },
  { hexagon: '8728309cbffffff', value: 240 },
  { hexagon: '8728309c8ffffff', value: 160 },
  { hexagon: '8728309c9ffffff', value: 310 },
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

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addH3HexagonLayer(): void {
  const layerId = 'h3-hexagons';
  const layer = new H3HexagonLayer<H3Data>({
    id: layerId,
    data: h3Data,
    pickable: true,
    opacity: 0.8,
    filled: true,
    stroked: true,
    extruded: true,
    elevationScale: 20,
    getHexagon: (d) => d.hexagon,
    getFillColor: (d) => {
      const t = d.value / 320;
      return [255 * t, 100 * (1 - t), 150, 200];
    },
    getElevation: (d) => d.value,
    getLineColor: [255, 255, 255, 100],
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

  addH3HexagonLayer();
});
