import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import type { PickingInfo } from '@deck.gl/core';

interface DataPoint {
  id: number;
  latitude: number;
  longitude: number;
  value: number;
  category: string;
}

// Generate sample data (matching notebook example)
function generateData(count = 100): DataPoint[] {
  const categories = ['A', 'B', 'C'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    latitude: 37.8 + (Math.random() - 0.5) * 0.4,
    longitude: -122.4 + (Math.random() - 0.5) * 0.4,
    value: Math.floor(Math.random() * 100) + 1,
    category: categories[Math.floor(Math.random() * 3)],
  }));
}

// GeoJSON polygon (matching notebook example)
const polygonData: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-122.5, 37.7],
      [-122.3, 37.7],
      [-122.3, 37.9],
      [-122.5, 37.9],
      [-122.5, 37.7],
    ]],
  },
  properties: { name: 'Area' },
};

const allData = generateData();
let filteredData = [...allData];

const baseMaps: Record<string, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  streets: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

// Create MapLibre map
const map = new maplibregl.Map({
  container: 'map',
  style: baseMaps.dark,
  center: [-122.4, 37.8],
  zoom: 10,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Layer state
const layerState: Record<string, boolean> = {
  points: true,
  polygon: true,
  hexagon: false,
};

// Create deck.gl overlay
const deckOverlay = new MapboxOverlay({ layers: [] });

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  // Add polygon source and layer
  map.addSource('polygon', {
    type: 'geojson',
    data: polygonData,
  });

  map.addLayer({
    id: 'polygon-fill',
    type: 'fill',
    source: 'polygon',
    paint: {
      'fill-color': '#00d9ff',
      'fill-opacity': 0.3,
    },
  });

  map.addLayer({
    id: 'polygon-outline',
    type: 'line',
    source: 'polygon',
    paint: {
      'line-color': '#00d9ff',
      'line-width': 2,
    },
  });

  updateLayers();
  updateStats();
});

function createDeckLayers() {
  const layers = [];

  if (layerState.points) {
    layers.push(new ScatterplotLayer<DataPoint>({
      id: 'scatterplot',
      data: filteredData,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusMinPixels: 4,
      radiusMaxPixels: 20,
      getPosition: (d) => [d.longitude, d.latitude],
      getRadius: (d) => d.value * 2,
      getFillColor: (d) => {
        const colors: Record<string, [number, number, number]> = {
          A: [255, 107, 107],
          B: [107, 255, 107],
          C: [107, 107, 255],
        };
        return [...colors[d.category], 200] as [number, number, number, number];
      },
      getLineColor: [255, 255, 255, 100],
      onHover: (info) => showTooltip(info),
    }));
  }

  if (layerState.hexagon) {
    layers.push(new HexagonLayer<DataPoint>({
      id: 'hexagon',
      data: filteredData,
      pickable: true,
      extruded: true,
      radius: 300,
      elevationScale: 30,
      getPosition: (d) => [d.longitude, d.latitude],
      colorRange: [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78],
      ],
    }));
  }

  return layers;
}

function updateLayers(): void {
  deckOverlay.setProps({ layers: createDeckLayers() });

  // Update polygon visibility
  if (map.getLayer('polygon-fill')) {
    map.setLayoutProperty('polygon-fill', 'visibility', layerState.polygon ? 'visible' : 'none');
    map.setLayoutProperty('polygon-outline', 'visibility', layerState.polygon ? 'visible' : 'none');
  }
}

function toggleLayer(layerId: string): void {
  layerState[layerId] = !layerState[layerId];
  const toggle = document.getElementById(`toggle-${layerId}`);
  toggle?.classList.toggle('active', layerState[layerId]);
  updateLayers();
}

function updateFilter(): void {
  const valueFilter = document.getElementById('valueFilter') as HTMLInputElement;
  const categoryFilter = document.getElementById('categoryFilter') as HTMLSelectElement;
  const valueLabel = document.getElementById('valueLabel');

  const minValue = parseInt(valueFilter?.value || '0');
  const category = categoryFilter?.value || 'all';

  if (valueLabel) {
    valueLabel.textContent = `${minValue}+`;
  }

  filteredData = allData.filter(d => {
    if (d.value < minValue) return false;
    if (category !== 'all' && d.category !== category) return false;
    return true;
  });

  updateLayers();
  updateStats();
}

function changeBaseMap(): void {
  const baseMapSelect = document.getElementById('baseMapSelect') as HTMLSelectElement;
  const style = baseMapSelect?.value || 'dark';
  map.setStyle(baseMaps[style]);
  map.once('style.load', () => {
    // Re-add polygon layer after style change
    map.addSource('polygon', { type: 'geojson', data: polygonData });
    map.addLayer({
      id: 'polygon-fill',
      type: 'fill',
      source: 'polygon',
      paint: { 'fill-color': '#00d9ff', 'fill-opacity': 0.3 },
    });
    map.addLayer({
      id: 'polygon-outline',
      type: 'line',
      source: 'polygon',
      paint: { 'line-color': '#00d9ff', 'line-width': 2 },
    });
    updateLayers();
  });
}

function updateStats(): void {
  const totalPoints = document.getElementById('totalPoints');
  const filteredPointsEl = document.getElementById('filteredPoints');
  const avgValue = document.getElementById('avgValue');

  if (totalPoints) totalPoints.textContent = allData.length.toString();
  if (filteredPointsEl) filteredPointsEl.textContent = filteredData.length.toString();
  if (avgValue) {
    const avg = filteredData.length > 0
      ? (filteredData.reduce((sum, d) => sum + d.value, 0) / filteredData.length).toFixed(1)
      : '0';
    avgValue.textContent = avg;
  }
}

function showTooltip(info: PickingInfo<DataPoint>): void {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;

  if (info.object) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${info.x + 10}px`;
    tooltip.style.top = `${info.y + 10}px`;
    tooltip.innerHTML = `
      <strong>Point ${info.object.id}</strong><br>
      Value: ${info.object.value}<br>
      Category: ${info.object.category}
    `;
  } else {
    tooltip.style.display = 'none';
  }
}

// Bind event listeners
document.querySelectorAll('.layer-item').forEach(item => {
  item.addEventListener('click', () => {
    const layerId = item.getAttribute('data-layer');
    if (layerId) toggleLayer(layerId);
  });
});

document.getElementById('valueFilter')?.addEventListener('input', updateFilter);
document.getElementById('categoryFilter')?.addEventListener('change', updateFilter);
document.getElementById('baseMapSelect')?.addEventListener('change', changeBaseMap);
