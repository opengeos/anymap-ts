import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { IconLayer } from '@deck.gl/layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface IconData {
  coordinates: [number, number];
  name: string;
  category: string;
  size: number;
}

// POI locations around San Francisco
const pois: IconData[] = [
  // Restaurants
  { coordinates: [-122.4098, 37.7855], name: 'Restaurant A', category: 'restaurant', size: 40 },
  { coordinates: [-122.4150, 37.7820], name: 'Restaurant B', category: 'restaurant', size: 35 },
  { coordinates: [-122.4200, 37.7890], name: 'Restaurant C', category: 'restaurant', size: 45 },
  { coordinates: [-122.4050, 37.7750], name: 'Restaurant D', category: 'restaurant', size: 38 },
  { coordinates: [-122.4300, 37.7800], name: 'Restaurant E', category: 'restaurant', size: 42 },
  // Hotels
  { coordinates: [-122.4100, 37.7880], name: 'Hotel A', category: 'hotel', size: 50 },
  { coordinates: [-122.4180, 37.7920], name: 'Hotel B', category: 'hotel', size: 55 },
  { coordinates: [-122.4050, 37.7810], name: 'Hotel C', category: 'hotel', size: 48 },
  { coordinates: [-122.4220, 37.7770], name: 'Hotel D', category: 'hotel', size: 52 },
  // Attractions
  { coordinates: [-122.4194, 37.7749], name: 'City Hall', category: 'attraction', size: 60 },
  { coordinates: [-122.4534, 37.8083], name: 'Fishermans Wharf', category: 'attraction', size: 55 },
  { coordinates: [-122.4862, 37.8199], name: 'Golden Gate View', category: 'attraction', size: 65 },
  { coordinates: [-122.3894, 37.7866], name: 'Ferry Building', category: 'attraction', size: 50 },
  { coordinates: [-122.4783, 37.8199], name: 'Fort Point', category: 'attraction', size: 45 },
];

// Color mapping for different categories
const categoryColors: Record<string, [number, number, number]> = {
  restaurant: [255, 100, 100],
  hotel: [100, 150, 255],
  attraction: [100, 255, 150],
};

// Create a simple data URL icon atlas (colored circles)
function createIconAtlas(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Restaurant icon (red circle)
  ctx.fillStyle = 'rgb(255, 100, 100)';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', 32, 32);

  // Hotel icon (blue circle)
  ctx.fillStyle = 'rgb(100, 150, 255)';
  ctx.beginPath();
  ctx.arc(96, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillText('H', 96, 32);

  // Attraction icon (green circle)
  ctx.fillStyle = 'rgb(100, 255, 150)';
  ctx.beginPath();
  ctx.arc(160, 32, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'white';
  ctx.fillText('A', 160, 32);

  return canvas.toDataURL();
}

const iconAtlas = createIconAtlas();

const iconMapping = {
  restaurant: { x: 0, y: 0, width: 64, height: 64, mask: false },
  hotel: { x: 64, y: 0, width: 64, height: 64, mask: false },
  attraction: { x: 128, y: 0, width: 64, height: 64, mask: false },
};

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.42, 37.79],
  zoom: 13,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function addIconLayer(): void {
  const layerId = 'icon-pois';
  const layer = new IconLayer<IconData>({
    id: layerId,
    data: pois,
    pickable: true,
    iconAtlas,
    iconMapping,
    getIcon: (d) => d.category,
    getPosition: (d) => d.coordinates,
    getSize: (d) => d.size,
    sizeScale: 1,
    sizeUnits: 'pixels',
    sizeMinPixels: 20,
    sizeMaxPixels: 80,
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

  addIconLayer();
});
