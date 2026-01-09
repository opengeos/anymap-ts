// Mapbox GL JS is loaded globally via script tag
declare const mapboxgl: any;

let map: any;
let is3D = false;

// Check for stored token
const storedToken = localStorage.getItem('mapbox_token');
if (storedToken) {
  const tokenInput = document.getElementById('tokenInput') as HTMLInputElement;
  if (tokenInput) {
    tokenInput.value = storedToken;
  }
}

function initMap(): void {
  const tokenInput = document.getElementById('tokenInput') as HTMLInputElement;
  const token = tokenInput?.value.trim();

  if (!token) {
    alert('Please enter a valid Mapbox access token');
    return;
  }

  localStorage.setItem('mapbox_token', token);
  mapboxgl.accessToken = token;

  const tokenForm = document.getElementById('tokenForm');
  const controls = document.getElementById('controls');
  if (tokenForm) tokenForm.style.display = 'none';
  if (controls) controls.style.display = 'block';

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-122.4, 37.8],
    zoom: 10,
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');

  map.on('load', () => {
    // Add GeoJSON source (matching notebook example)
    map.addSource('cities', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] },
            properties: { name: 'San Francisco' },
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-122.2712, 37.8044] },
            properties: { name: 'Oakland' },
          },
        ],
      },
    });

    map.addLayer({
      id: 'cities-layer',
      type: 'circle',
      source: 'cities',
      paint: {
        'circle-radius': 10,
        'circle-color': '#00d9ff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  });

  // Add markers with popups
  new mapboxgl.Marker({ color: '#00d9ff' })
    .setLngLat([-122.4194, 37.7749])
    .setPopup(new mapboxgl.Popup().setHTML('<h3>San Francisco</h3>'))
    .addTo(map);

  new mapboxgl.Marker({ color: '#00ff88' })
    .setLngLat([-122.2712, 37.8044])
    .setPopup(new mapboxgl.Popup().setHTML('<h3>Oakland</h3>'))
    .addTo(map);
}

function flyToSF(): void {
  if (map) {
    map.flyTo({ center: [-122.4194, 37.7749], zoom: 14, duration: 2000 });
  }
}

function flyToOakland(): void {
  if (map) {
    map.flyTo({ center: [-122.2712, 37.8044], zoom: 14, duration: 2000 });
  }
}

function toggle3D(): void {
  if (map) {
    is3D = !is3D;
    map.easeTo({ pitch: is3D ? 60 : 0, bearing: is3D ? 30 : 0, duration: 1000 });
  }
}

// Bind event listeners
document.getElementById('btn-load')?.addEventListener('click', initMap);
document.getElementById('btn-sf')?.addEventListener('click', flyToSF);
document.getElementById('btn-oakland')?.addEventListener('click', flyToOakland);
document.getElementById('btn-3d')?.addEventListener('click', toggle3D);
