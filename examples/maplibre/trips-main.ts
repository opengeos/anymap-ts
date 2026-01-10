import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { TripsLayer } from '@deck.gl/geo-layers';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { DeckLayerAdapter } from '../../src/maplibre/adapters/DeckLayerAdapter';

interface TripData {
  waypoints: [number, number][];
  timestamps: number[];
  name: string;
  color?: [number, number, number];
}

const trips: TripData[] = [
  {
    waypoints: [
      [-122.45, 37.78],
      [-122.42, 37.79],
      [-122.40, 37.78],
      [-122.38, 37.80],
      [-122.35, 37.79],
    ],
    timestamps: [0, 30, 60, 90, 120],
    name: 'Trip 1',
  },
  {
    waypoints: [
      [-122.50, 37.75],
      [-122.47, 37.77],
      [-122.44, 37.76],
      [-122.41, 37.78],
      [-122.38, 37.77],
    ],
    timestamps: [10, 40, 70, 100, 130],
    name: 'Trip 2',
  },
  {
    waypoints: [
      [-122.43, 37.82],
      [-122.41, 37.80],
      [-122.39, 37.78],
      [-122.37, 37.76],
      [-122.35, 37.74],
    ],
    timestamps: [20, 50, 80, 110, 140],
    name: 'Trip 3',
  },
];

const trailLength = 180;
const loopLength = Math.max(...trips.flatMap((trip) => trip.timestamps)) + trailLength;
const animationSpeed = 30;
let currentTime = 0;
let lastFrameTime = 0;
let animationFrameId = 0;

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.42, 37.78],
  zoom: 12,
  pitch: 45,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const deckOverlay = new MapboxOverlay({ layers: [] });
const deckLayers = new Map<string, unknown>();
const deckAdapter = new DeckLayerAdapter(map, deckOverlay, deckLayers);
const layerId = 'trips-basic';

function updateOverlay(): void {
  deckOverlay.setProps({ layers: Array.from(deckLayers.values()) });
}

function buildTripsLayer(time: number): TripsLayer<TripData> {
  const existing = deckLayers.get(layerId) as { props?: { visible?: boolean; opacity?: number } } | undefined;
  const visible = existing?.props?.visible ?? true;
  const opacity = existing?.props?.opacity ?? 1;

  return new TripsLayer<TripData>({
    id: layerId,
    data: trips,
    pickable: true,
    opacity,
    visible,
    getPath: (d) => d.waypoints,
    getTimestamps: (d) => d.timestamps,
    getColor: (d) => d.color ?? [253, 128, 93],
    widthMinPixels: 3,
    rounded: true,
    trailLength,
    currentTime: time,
    fadeTrail: true,
  });
}

function setTripsLayer(time: number): void {
  deckLayers.set(layerId, buildTripsLayer(time));
  updateOverlay();
}

function animate(now: number): void {
  if (!lastFrameTime) {
    lastFrameTime = now;
  }
  const deltaSeconds = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  currentTime = (currentTime + deltaSeconds * animationSpeed) % loopLength;
  setTripsLayer(currentTime);
  animationFrameId = requestAnimationFrame(animate);
}

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  const layerControl = new LayerControl({
    collapsed: true,
    customLayerAdapters: [deckAdapter],
    panelWidth: 360,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  setTripsLayer(currentTime);
  deckAdapter.notifyLayerAdded(layerId);
  animationFrameId = requestAnimationFrame(animate);
});

map.on('remove', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
