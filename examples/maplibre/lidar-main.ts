import maplibregl from 'maplibre-gl';
import { LidarControl } from 'maplibre-gl-lidar';
import 'maplibre-gl-lidar/style.css';

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

// Status element
const statusEl = document.getElementById('status');
const updateStatus = (message: string) => {
  if (statusEl) {
    statusEl.textContent = message;
  }
};

// Create LiDAR control with initial settings
const lidarControl = new LidarControl({
  collapsed: false,
  position: 'top-left',
  title: 'LiDAR Viewer',
  pointSize: 2,
  opacity: 1.0,
  colorScheme: 'classification',
  usePercentile: true,
  pointBudget: 2000000,
  pickable: true,
  autoZoom: true,
  copcLoadingMode: 'dynamic',
  streamingPointBudget: 5000000,
});

// Set up control event listeners
lidarControl.on('loadstart', () => {
  updateStatus('Loading LiDAR data...');
});

lidarControl.on('load', (event) => {
  const info = event.pointCloudInfo;
  if (info) {
    updateStatus(`Loaded ${info.pointCount.toLocaleString()} points`);
  }
});

lidarControl.on('loaderror', (event) => {
  updateStatus(`Error: ${event.error?.message || 'Failed to load'}`);
});

lidarControl.on('streamingprogress', (event) => {
  const progress = event.progress;
  if (progress) {
    updateStatus(`Loading: ${progress.loadedPoints.toLocaleString()} points (${Math.round(progress.percentComplete)}%)`);
  }
});

lidarControl.on('statechange', () => {
  // Update UI when state changes
});

map.on('load', () => {
  // Add the LiDAR control to the map
  map.addControl(lidarControl as unknown as maplibregl.IControl, 'top-left');

  updateStatus('Loading Autzen Stadium LiDAR...');

  // Load the Autzen COPC dataset
  lidarControl.loadPointCloudStreaming(AUTZEN_COPC_URL, {
    id: 'autzen',
    name: 'Autzen Stadium',
  });
});

// UI Controls
const colorSchemeSelect = document.getElementById('color-scheme') as HTMLSelectElement;
const pointSizeSlider = document.getElementById('point-size') as HTMLInputElement;
const opacitySlider = document.getElementById('opacity') as HTMLInputElement;
const sizeValueEl = document.getElementById('size-value');
const opacityValueEl = document.getElementById('opacity-value');

// Color scheme change
colorSchemeSelect?.addEventListener('change', () => {
  lidarControl.setColorScheme(colorSchemeSelect.value);
});

// Point size change
pointSizeSlider?.addEventListener('input', () => {
  const size = parseFloat(pointSizeSlider.value);
  lidarControl.setPointSize(size);
  if (sizeValueEl) {
    sizeValueEl.textContent = size.toString();
  }
});

// Opacity change
opacitySlider?.addEventListener('input', () => {
  const opacity = parseInt(opacitySlider.value, 10) / 100;
  lidarControl.setOpacity(opacity);
  if (opacityValueEl) {
    opacityValueEl.textContent = `${opacitySlider.value}%`;
  }
});
