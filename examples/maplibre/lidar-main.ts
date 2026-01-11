import maplibregl from 'maplibre-gl';
import { LidarControl, LidarLayerAdapter } from 'maplibre-gl-lidar';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-lidar/style.css';
import 'maplibre-gl-layer-control/style.css';

// Autzen Stadium COPC LiDAR dataset
const AUTZEN_COPC_URL = 'https://s3.amazonaws.com/hobu-lidar/autzen-classified.copc.laz';

// Create the map centered on Autzen Stadium, Eugene, Oregon
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-123.07, 44.05],
  zoom: 15,
  pitch: 60,
  bearing: -20,
});

// Add navigation and scale controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

// Create LiDAR control with initial settings
const lidarControl = new LidarControl({
  collapsed: false,
  position: 'top-left',
  title: 'LiDAR Viewer',
  pointSize: 2,
  opacity: 1.0,
  colorScheme: 'elevation',
  usePercentile: true,
  pointBudget: 2000000,
  pickable: true,
  autoZoom: true,
  copcLoadingMode: 'dynamic',
  streamingPointBudget: 5000000,
});

// Create LiDAR adapter for layer control integration
const lidarAdapter = new LidarLayerAdapter(lidarControl);

// Create layer control with LiDAR adapter
const layerControl = new LayerControl({
  collapsed: true,
  customLayerAdapters: [lidarAdapter],
});

map.on('load', () => {
  // Add layer control
  map.addControl(layerControl, 'top-right');

  // Add the LiDAR control to the map
  map.addControl(lidarControl as unknown as maplibregl.IControl, 'top-right');

  // Load the Autzen COPC dataset
  lidarControl.loadPointCloudStreaming(AUTZEN_COPC_URL, {
    id: 'autzen',
    name: 'Autzen Stadium',
  });
});
