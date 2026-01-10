import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ContourLayer } from '@deck.gl/aggregation-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface PointData {
  coordinates: [number, number];
  weight: number;
}

// Generate clustered points around San Francisco for density visualization
function generateClusteredPoints(count = 2000): PointData[] {
  const clusters = [
    { center: [-122.4194, 37.7749], spread: 0.02, weight: 1.5 }, // Downtown SF
    { center: [-122.2711, 37.8044], spread: 0.015, weight: 1.2 }, // Oakland
    { center: [-122.2727, 37.8716], spread: 0.01, weight: 1.0 }, // Berkeley
    { center: [-122.4098, 37.7855], spread: 0.008, weight: 2.0 }, // Union Square
    { center: [-122.4534, 37.8083], spread: 0.01, weight: 0.8 }, // Fishermans Wharf
    { center: [-122.3894, 37.7866], spread: 0.01, weight: 1.3 }, // Embarcadero
  ];

  const points: PointData[] = [];

  for (let i = 0; i < count; i++) {
    // Randomly select a cluster
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];

    // Generate point with gaussian-like distribution around cluster center
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * cluster.spread;
    const lng = cluster.center[0] + Math.cos(angle) * radius;
    const lat = cluster.center[1] + Math.sin(angle) * radius;

    points.push({
      coordinates: [lng, lat] as [number, number],
      weight: Math.random() * cluster.weight + 0.5,
    });
  }

  return points;
}

const points = generateClusteredPoints();

// Define contour thresholds with colors (yellow to red gradient)
const contours: Array<{ threshold: number; color: [number, number, number]; strokeWidth: number }> = [
  { threshold: 1, color: [255, 255, 178], strokeWidth: 1 },
  { threshold: 5, color: [254, 217, 118], strokeWidth: 1 },
  { threshold: 10, color: [254, 178, 76], strokeWidth: 2 },
  { threshold: 20, color: [253, 141, 60], strokeWidth: 2 },
  { threshold: 40, color: [252, 78, 42], strokeWidth: 3 },
  { threshold: 60, color: [227, 26, 28], strokeWidth: 3 },
  { threshold: 80, color: [189, 0, 38], strokeWidth: 4 },
];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.35, 37.8],
  zoom: 11,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addContourLayer(): void {
  const layerId = 'contour-density';
  const layer = new ContourLayer<PointData>({
    id: layerId,
    data: points,
    pickable: true,
    cellSize: 200,
    contours,
    getPosition: (d) => d.coordinates,
    getWeight: (d) => d.weight,
    aggregation: 'SUM',
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

  addContourLayer();
});
