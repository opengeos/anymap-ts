import maplibregl from 'maplibre-gl';
import { addControlGrid } from 'maplibre-gl-components';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-components/style.css';
import 'maplibre-gl-layer-control/style.css';

const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP_STYLE,
  center: [-98, 38.5],
  zoom: 4,
  maxPitch: 85,
});

map.on('load', () => {
  // Add layer control
  const layerControl = new LayerControl({
    collapsed: true,
    basemapStyleUrl: BASEMAP_STYLE,
    excludeLayers: [
      'measure-*',
      'mapbox-gl-draw-*',
      'gl-draw-*',
      'gm_*',
      'inspect-highlight-*',
      'lidar-*',
      'usgs-lidar-*',
    ],
  });
  map.addControl(layerControl, 'top-right');

  // Add control grid with all default controls
  const controlGrid = addControlGrid(map, {
    basemapStyleUrl: BASEMAP_STYLE,
  });

  // Register adapters so data layers appear in the LayerControl
  for (const adapter of controlGrid.getAdapters()) {
    layerControl.registerCustomAdapter(adapter);
  }
});
