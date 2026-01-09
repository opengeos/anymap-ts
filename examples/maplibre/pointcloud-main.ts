import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { PointCloudLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PointData {
  position: [number, number, number];
  color: [number, number, number, number];
}

function generatePoints(centerLng: number, centerLat: number, numPoints = 1000, spread = 0.01): PointData[] {
  const points: PointData[] = [];
  for (let i = 0; i < numPoints; i += 1) {
    const lng = centerLng + (Math.random() - 0.5) * spread * 2;
    const lat = centerLat + (Math.random() - 0.5) * spread * 2;
    const dist = Math.sqrt((lng - centerLng) ** 2 + (lat - centerLat) ** 2);
    const elevation = Math.max(0, 500 - dist * 50000) + Math.random() * 50;
    const colorRatio = Math.min(elevation / 500, 1);
    const color: [number, number, number, number] = [
      Math.round(255 * colorRatio),
      Math.round(100 * (1 - colorRatio)),
      Math.round(255 * (1 - colorRatio)),
      255,
    ];
    points.push({ position: [lng, lat, elevation], color });
  }
  return points;
}

const pointCloud = generatePoints(-122.4194, 37.7749);

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4194, 37.7749],
  zoom: 14,
  pitch: 60,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addPointCloudLayer(): void {
  const layerId = 'pointcloud-demo';
  const layer = new PointCloudLayer<PointData>({
    id: layerId,
    data: pointCloud,
    pickable: true,
    opacity: 0.9,
    pointSize: 3,
    sizeUnits: 'pixels',
    getPosition: (d) => d.position,
    getColor: (d) => d.color,
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

  addPointCloudLayer();
});
