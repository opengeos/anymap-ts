import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import { HexagonLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';

interface PointData {
  coordinates: [number, number];
  value: number;
}

interface ArcData {
  source: [number, number];
  target: [number, number];
}

// Generate sample data (matching notebook example)
function generatePoints(count = 1000): PointData[] {
  return Array.from({ length: count }, () => ({
    coordinates: [
      -122.4 + (Math.random() - 0.5) * 0.4,
      37.8 + (Math.random() - 0.5) * 0.4,
    ] as [number, number],
    value: Math.floor(Math.random() * 100) + 1,
  }));
}

// Generate arc data (matching notebook example)
function generateArcs(): ArcData[] {
  const cities: [number, number][] = [
    [-122.4194, 37.7749], // SF
    [-122.2712, 37.8044], // Oakland
    [-122.0308, 37.3382], // Cupertino
    [-121.8853, 37.3387], // San Jose
  ];
  return [
    { source: cities[0], target: cities[1] },
    { source: cities[0], target: cities[2] },
    { source: cities[1], target: cities[3] },
  ];
}

let points = generatePoints();
const arcs = generateArcs();

// Create MapLibre map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 10,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Create deck.gl overlay
const deckOverlay = new MapboxOverlay({ layers: [] });

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);
  showScatterplot();
});

function setActiveButton(id: string): void {
  document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}

// Layer functions (matching notebook example)
function showScatterplot(): void {
  setActiveButton('btn-scatter');
  const layer = new ScatterplotLayer<PointData>({
    id: 'scatterplot',
    data: points,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusMinPixels: 3,
    radiusMaxPixels: 30,
    getPosition: (d) => d.coordinates,
    getRadius: (d) => d.value * 3,
    getFillColor: [255, 140, 0, 200],
    getLineColor: [255, 255, 255, 255],
  });
  deckOverlay.setProps({ layers: [layer] });
}

function showHexagon(): void {
  setActiveButton('btn-hexagon');
  const layer = new HexagonLayer<PointData>({
    id: 'hexagon',
    data: points,
    pickable: true,
    extruded: true,
    radius: 500,
    elevationScale: 50,
    getPosition: (d) => d.coordinates,
    colorRange: [
      [1, 152, 189],
      [73, 227, 206],
      [216, 254, 181],
      [254, 237, 177],
      [254, 173, 84],
      [209, 55, 78],
    ],
  });
  deckOverlay.setProps({ layers: [layer] });
}

function showHeatmap(): void {
  setActiveButton('btn-heatmap');
  const layer = new HeatmapLayer<PointData>({
    id: 'heatmap',
    data: points,
    radiusPixels: 50,
    intensity: 1,
    threshold: 0.05,
    getPosition: (d) => d.coordinates,
    getWeight: (d) => d.value,
  });
  deckOverlay.setProps({ layers: [layer] });
}

function showArcs(): void {
  setActiveButton('btn-arcs');
  const layer = new ArcLayer<ArcData>({
    id: 'arcs',
    data: arcs,
    pickable: true,
    getWidth: 3,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getSourceColor: [0, 128, 255, 255],
    getTargetColor: [255, 0, 128, 255],
  });
  deckOverlay.setProps({ layers: [layer] });
}

function regenerateData(): void {
  points = generatePoints();
  // Refresh current layer
  const activeBtn = document.querySelector('.controls button.active');
  if (activeBtn) {
    (activeBtn as HTMLButtonElement).click();
  }
}

// Bind event listeners
document.getElementById('btn-scatter')?.addEventListener('click', showScatterplot);
document.getElementById('btn-hexagon')?.addEventListener('click', showHexagon);
document.getElementById('btn-heatmap')?.addEventListener('click', showHeatmap);
document.getElementById('btn-arcs')?.addEventListener('click', showArcs);
document.getElementById('btn-regenerate')?.addEventListener('click', regenerateData);
