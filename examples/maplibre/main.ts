import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';

// Create map centered on San Francisco Bay Area
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-122.4, 37.8],
  zoom: 10,
});

// Add navigation control
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

// Add draw control
const draw = new MapboxDraw({
  displayControlsDefault: false,
  controls: {
    polygon: true,
    line_string: true,
    point: true,
    trash: true,
  },
});
map.addControl(draw as unknown as maplibregl.IControl, 'top-left');

// Track draw events
function updateDrawData(): void {
  const data = draw.getAll();
  const drawDataEl = document.getElementById('drawData');
  if (drawDataEl) {
    drawDataEl.textContent =
      data.features.length > 0
        ? JSON.stringify(data, null, 2)
        : 'No drawn features yet';
  }
}

map.on('draw.create', updateDrawData);
map.on('draw.update', updateDrawData);
map.on('draw.delete', updateDrawData);

// Add layers when map loads
map.on('load', () => {
  // Add layer control
  const layerControl = new LayerControl({
    collapsed: true,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'bottom-left');

  // Add GeoJSON polygon source
  map.addSource('polygon', {
    type: 'geojson',
    data: {
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
      properties: { name: 'Bay Area' },
    },
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

  // Add points source
  map.addSource('points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [],
    },
  });

  map.addLayer({
    id: 'points-layer',
    type: 'circle',
    source: 'points',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff6b6b',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });
});

// Add markers for cities
new maplibregl.Marker({ color: '#00d9ff' })
  .setLngLat([-122.4194, 37.7749])
  .setPopup(new maplibregl.Popup().setHTML('<b>San Francisco</b><br>The City by the Bay'))
  .addTo(map);

new maplibregl.Marker({ color: '#00ff88' })
  .setLngLat([-122.2712, 37.8044])
  .setPopup(new maplibregl.Popup().setHTML('<b>Oakland</b>'))
  .addTo(map);

// State
let polygonVisible = true;

// Action functions
function flyToSF(): void {
  map.flyTo({ center: [-122.4194, 37.7749], zoom: 14, duration: 2000 });
}

function flyToOakland(): void {
  map.flyTo({ center: [-122.2712, 37.8044], zoom: 14, duration: 2000 });
}

function addRandomPoints(): void {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = Array.from({ length: 50 }, () => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [
        -122.4 + (Math.random() - 0.5) * 0.4,
        37.8 + (Math.random() - 0.5) * 0.4,
      ],
    },
    properties: { value: Math.floor(Math.random() * 100) },
  }));

  const source = map.getSource('points') as maplibregl.GeoJSONSource;
  source?.setData({
    type: 'FeatureCollection',
    features,
  });
}

function togglePolygon(): void {
  polygonVisible = !polygonVisible;
  map.setLayoutProperty('polygon-fill', 'visibility', polygonVisible ? 'visible' : 'none');
  map.setLayoutProperty('polygon-outline', 'visibility', polygonVisible ? 'visible' : 'none');
}

// Bind event listeners
document.getElementById('btn-sf')?.addEventListener('click', flyToSF);
document.getElementById('btn-oakland')?.addEventListener('click', flyToOakland);
document.getElementById('btn-points')?.addEventListener('click', addRandomPoints);
document.getElementById('btn-polygon')?.addEventListener('click', togglePolygon);
document.getElementById('btn-draw')?.addEventListener('click', updateDrawData);
