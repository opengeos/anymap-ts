import maplibregl from 'maplibre-gl';
import { addControlGrid } from 'maplibre-gl-components';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-components/style.css';
import 'maplibre-gl-layer-control/style.css';

// Plugin CSS imports
import 'maplibre-gl-geo-editor/style.css';
import 'maplibre-gl-lidar/style.css';
import 'maplibre-gl-planetary-computer/style.css';
import 'maplibre-gl-splat/style.css';
import 'maplibre-gl-streetview/style.css';
import 'maplibre-gl-swipe/style.css';
import 'maplibre-gl-usgs-lidar/style.css';

const BASEMAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP_STYLE,
  center: [-100, 40],
  zoom: 3,
  maxPitch: 85,
});

map.once('load', () => {
  map.setProjection({ type: 'globe' });
});

// Add layer control
const layerControl = new LayerControl({
  collapsed: true,
  layers: [],
  panelWidth: 340,
  panelMinWidth: 240,
  panelMaxWidth: 450,
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

// Add USGS Imagery as a WMS raster layer on top of the basemap
map.on('load', () => {
  map.addSource('usgs-imagery', {
    type: 'raster',
    tiles: [
      'https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer?service=WMS&request=GetMap&layers=0&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
    ],
    tileSize: 256,
    attribution: '&copy; <a href="https://basemap.nationalmap.gov/">USGS</a>',
  });

  map.addLayer({
    id: 'USGS-imagery-layer',
    type: 'raster',
    source: 'usgs-imagery',
    paint: {
      'raster-opacity': 0.8,
    },
  });

  // Add ESA WorldCover 2021 layer (off by default)
  map.addSource('worldcover', {
    type: 'raster',
    tiles: [
      'https://services.terrascope.be/wms/v2?service=WMS&request=GetMap&layers=WORLDCOVER_2021_MAP&styles=&format=image/png&transparent=true&version=1.1.1&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}',
    ],
    tileSize: 256,
    attribution:
      '&copy; <a href="https://esa-worldcover.org">ESA WorldCover 2021</a>',
  });

  map.addLayer({
    id: 'worldcover-layer',
    type: 'raster',
    source: 'worldcover',
    layout: {
      visibility: 'none',
    },
    paint: {
      'raster-opacity': 0.8,
    },
  });
});
