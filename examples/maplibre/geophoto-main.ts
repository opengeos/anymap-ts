import maplibregl from 'maplibre-gl';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';
import { GeoPhotoControl } from 'maplibre-gl-geophoto';
import 'maplibre-gl-geophoto/style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const GOOGLE_SATELLITE_SOURCE_ID = 'google-satellite';
const GOOGLE_SATELLITE_LAYER_ID = 'satellite';
const GOOGLE_SATELLITE_TILES = 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

// Create map
const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP_STYLE,
  center: [-122.274, 47.671],
  zoom: 15,
  maxZoom: 30,
  maxPitch: 85,
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Add layer control
const layerControl = new LayerControl({
  collapsed: true,
  layers: [],
  panelWidth: 340,
  panelMinWidth: 240,
  panelMaxWidth: 450,
  basemapStyleUrl: BASEMAP_STYLE,
});

map.addControl(layerControl, 'top-right');

// Add GeoPhoto control when map loads
map.on('load', () => {
  // Add Google satellite raster tiles above the Liberty basemap layers.
  map.addSource(GOOGLE_SATELLITE_SOURCE_ID, {
    type: 'raster',
    tiles: [GOOGLE_SATELLITE_TILES],
    tileSize: 256,
  });

  map.addLayer({
    id: GOOGLE_SATELLITE_LAYER_ID,
    type: 'raster',
    source: GOOGLE_SATELLITE_SOURCE_ID,
  });

  const geoPhotoControl = new GeoPhotoControl({
    title: 'GeoPhoto',
    collapsed: false,
    panelWidth: 360,
    showPath: true,
    showPathDirectionArrows: true,
    showObjects: true,
    fitBoundsOnLoad: true,
  });

  map.addControl(geoPhotoControl as unknown as maplibregl.IControl, 'top-right');

  // Listen for events
  geoPhotoControl.on('cameraselect', (event: any) => {
    console.log('Camera selected:', event.cameraIndex, event.camera?.id);
  });

  geoPhotoControl.on('dataloaded', () => {
    console.log('Data loaded:', geoPhotoControl.getCameras().length, 'cameras');
  });

  console.log('GeoPhoto control added to map');
});
