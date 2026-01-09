import L from 'leaflet';

// Create the map (Leaflet uses [lat, lng] order)
const map = L.map('map').setView([37.8, -122.4], 10);

// Add OpenStreetMap basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}).addTo(map);

// Add markers with popups (matching notebook example)
L.marker([37.7749, -122.4194])
  .bindPopup('<b>San Francisco</b><br>The City by the Bay')
  .addTo(map);

L.marker([37.8044, -122.2712])
  .bindPopup('<b>Oakland</b>')
  .addTo(map);

// Add GeoJSON polygon (matching notebook example)
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
  properties: { name: 'Bay Area' },
};

const polygon = L.geoJSON(polygonData, {
  style: {
    fillColor: '#00d9ff',
    color: '#00d9ff',
    weight: 2,
    fillOpacity: 0.3,
  },
}).addTo(map);

// Add scale control (matching notebook example)
L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

// Click handler
map.on('click', (e) => {
  console.log('Clicked:', e.latlng);
});

// State
let polygonVisible = true;
const circleMarkers: L.CircleMarker[] = [];

// Action functions
function flyToSF(): void {
  map.flyTo([37.7749, -122.4194], 14, { duration: 2 });
}

function flyToOakland(): void {
  map.flyTo([37.8044, -122.2712], 14, { duration: 2 });
}

function addCircleMarkers(): void {
  // Clear existing
  circleMarkers.forEach(m => map.removeLayer(m));
  circleMarkers.length = 0;

  // Add new random circle markers
  for (let i = 0; i < 50; i++) {
    const marker = L.circleMarker([
      37.8 + (Math.random() - 0.5) * 0.4,
      -122.4 + (Math.random() - 0.5) * 0.4,
    ], {
      radius: 8,
      fillColor: '#ff6b6b',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.8,
    }).addTo(map);
    circleMarkers.push(marker);
  }
}

function togglePolygon(): void {
  polygonVisible = !polygonVisible;
  if (polygonVisible) {
    polygon.addTo(map);
  } else {
    map.removeLayer(polygon);
  }
}

// Bind event listeners
document.getElementById('btn-sf')?.addEventListener('click', flyToSF);
document.getElementById('btn-oakland')?.addEventListener('click', flyToOakland);
document.getElementById('btn-markers')?.addEventListener('click', addCircleMarkers);
document.getElementById('btn-polygon')?.addEventListener('click', togglePolygon);
