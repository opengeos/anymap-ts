import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { easeOut } from 'ol/easing';

// Create map
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({ source: new OSM() }),
  ],
  view: new View({
    center: fromLonLat([-122.4, 37.8]),
    zoom: 10,
  }),
});

// Add polygon layer (matching notebook example)
const polygonSource = new VectorSource();
const polygonLayer = new VectorLayer({
  source: polygonSource,
  style: new Style({
    fill: new Fill({ color: 'rgba(0, 217, 255, 0.3)' }),
    stroke: new Stroke({ color: '#00d9ff', width: 2 }),
  }),
});
map.addLayer(polygonLayer);

// Add polygon feature (matching notebook example)
const polygonGeojson = {
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
};
const polygonFeatures = new GeoJSON().readFeatures(polygonGeojson, {
  featureProjection: 'EPSG:3857',
});
polygonSource.addFeatures(polygonFeatures);

// Add points layer
const pointsSource = new VectorSource();
const pointsLayer = new VectorLayer({
  source: pointsSource,
  style: new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({ color: '#ff6b6b' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  }),
});
map.addLayer(pointsLayer);

// Add city markers (matching notebook example)
interface City {
  name: string;
  coords: [number, number];
}

const cities: City[] = [
  { name: 'San Francisco', coords: [-122.4194, 37.7749] },
  { name: 'Oakland', coords: [-122.2712, 37.8044] },
];

cities.forEach(city => {
  const feature = new Feature({
    geometry: new Point(fromLonLat(city.coords)),
    name: city.name,
  });
  feature.setStyle(new Style({
    image: new Circle({
      radius: 10,
      fill: new Fill({ color: '#00d9ff' }),
      stroke: new Stroke({ color: '#fff', width: 2 }),
    }),
  }));
  pointsSource.addFeature(feature);
});

// Click handler
map.on('click', (e) => {
  const coords = map.getCoordinateFromPixel(e.pixel);
  console.log('Clicked:', coords);
});

// State
let polygonVisible = true;

// Action functions (matching notebook example)
function flyToSF(): void {
  map.getView().animate({
    center: fromLonLat([-122.4194, 37.7749]),
    zoom: 14,
    duration: 2000,
    easing: easeOut,
  });
}

function flyToOakland(): void {
  map.getView().animate({
    center: fromLonLat([-122.2712, 37.8044]),
    zoom: 14,
    duration: 2000,
    easing: easeOut,
  });
}

function addRandomFeatures(): void {
  // Clear existing random points (keep city markers)
  const features = pointsSource.getFeatures();
  features.forEach(f => {
    if (!f.get('name')) pointsSource.removeFeature(f);
  });

  // Add new random points
  for (let i = 0; i < 50; i++) {
    const feature = new Feature({
      geometry: new Point(fromLonLat([
        -122.4 + (Math.random() - 0.5) * 0.4,
        37.8 + (Math.random() - 0.5) * 0.4,
      ])),
    });
    feature.setStyle(new Style({
      image: new Circle({
        radius: 6,
        fill: new Fill({ color: '#ff6b6b' }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    }));
    pointsSource.addFeature(feature);
  }
}

function togglePolygon(): void {
  polygonVisible = !polygonVisible;
  polygonLayer.setVisible(polygonVisible);
}

// Bind event listeners
document.getElementById('btn-sf')?.addEventListener('click', flyToSF);
document.getElementById('btn-oakland')?.addEventListener('click', flyToOakland);
document.getElementById('btn-features')?.addEventListener('click', addRandomFeatures);
document.getElementById('btn-polygon')?.addEventListener('click', togglePolygon);
