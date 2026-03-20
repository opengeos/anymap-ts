import maplibregl, { addProtocol, Popup } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { SwipeControl } from 'maplibre-gl-swipe';
import 'maplibre-gl-swipe/style.css';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';

// Register PMTiles protocol
const pmtilesProtocol = new Protocol();
addProtocol('pmtiles', pmtilesProtocol.tile);

const PMTILES_URL = 'https://data.source.coop/kerner-lab/fields-of-the-world/ftw-sources.pmtiles';
const SOURCE_ID = 'ftw-source';
const LAYER_IMAGERY = 'esri-imagery';
const LAYER_FILL = 'ftw-fill';
const LAYER_OUTLINE = 'ftw-outline';
// Transparent layer on the main map used solely for click hit-detection.
// SwipeControl sets visibility:none on right-only layers on the main map,
// making queryRenderedFeatures return nothing there. This layer stays visible
// (fill-opacity:0) on the main map so clicks can still be detected.
const LAYER_HIT = 'ftw-hit';

const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#FF8C33',
  '#33FFF6', '#A833FF', '#FF333D', '#33FFBD', '#FF9933',
];

function buildFillColor(): maplibregl.ExpressionSpecification {
  const expr: unknown[] = ['case'];
  for (let i = 0; i < 10; i++) {
    expr.push(['==', ['%', ['to-number', ['get', 'id']], 10], i]);
    expr.push(COLORS[i]);
  }
  expr.push('#FF0000');
  return expr as maplibregl.ExpressionSpecification;
}

function buildPopupHTML(props: Record<string, unknown>): string {
  const tdKeyStyle = [
    'font-weight:600',
    'color:#222',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'max-width:130px',
    'padding:4px 8px',
    'border-bottom:1px solid #eee',
    'font-size:13px',
  ].join(';');

  const tdValStyle = [
    'color:#444',
    'word-break:break-word',
    'padding:4px 8px',
    'border-bottom:1px solid #eee',
    'font-size:13px',
  ].join(';');

  const rows = Object.entries(props)
    .map(([k, v]) =>
      `<tr>` +
      `<td style="${tdKeyStyle}" title="${k}">${k}</td>` +
      `<td style="${tdValStyle}">${v}</td>` +
      `</tr>`
    )
    .join('');

  return (
    `<div style="max-height:280px;overflow-y:auto">` +
    `<table style="border-collapse:collapse;width:100%;table-layout:fixed">` +
    `${rows}` +
    `</table></div>`
  );
}

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  center: [17.8616, 48.1005],
  zoom: 11,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

map.on('load', () => {
  // Add Esri World Imagery raster source and insert its layer below labels
  map.addSource(LAYER_IMAGERY, {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxzoom: 19,
  });
  map.addLayer(
    { id: LAYER_IMAGERY, type: 'raster', source: LAYER_IMAGERY },
    'waterway_label',
  );

  // Add PMTiles source and layers
  map.addSource(SOURCE_ID, {
    type: 'vector',
    url: `pmtiles://${PMTILES_URL}`,
  });

  map.addLayer({
    id: LAYER_FILL,
    type: 'fill',
    source: SOURCE_ID,
    'source-layer': 'ftw-sources',
    paint: {
      'fill-color': buildFillColor(),
      'fill-opacity': 0.5,
    },
  });

  map.addLayer({
    id: LAYER_OUTLINE,
    type: 'line',
    source: SOURCE_ID,
    'source-layer': 'ftw-sources',
    paint: {
      'line-color': '#ffffff',
      'line-width': 1,
    },
  });

  // Transparent hit-detection layer. SwipeControl sets visibility:none on
  // right-only layers on the main map, so clicks on LAYER_FILL never fire
  // there. LAYER_HIT is not assigned to either side, so SwipeControl leaves
  // it alone and it stays visible (fill-opacity:0) on the main map for clicks.
  map.addLayer({
    id: LAYER_HIT,
    type: 'fill',
    source: SOURCE_ID,
    'source-layer': 'ftw-sources',
    paint: { 'fill-opacity': 0 },
  });

  // All clicks pass through the comparison map (pointer-events:none on its
  // clip container) to the main map. Use LAYER_HIT for detection, then check
  // the slider position so the popup only appears on the right side where
  // fields are actually visible.
  const swipeControl = new SwipeControl({
    leftLayers: [LAYER_IMAGERY],
    rightLayers: [LAYER_IMAGERY, LAYER_FILL, LAYER_OUTLINE],
    collapsed: false,
    title: 'Layer Swipe',
  });
  map.addControl(swipeControl as unknown as maplibregl.IControl, 'top-left');

  map.on('click', LAYER_HIT, (e) => {
    if (!e.features || e.features.length === 0) return;
    const sliderPct = swipeControl.getPosition();
    const containerWidth = map.getContainer().getBoundingClientRect().width;
    if (e.point.x < (sliderPct / 100) * containerWidth) return;
    const props = e.features[0].properties || {};
    new Popup({ maxWidth: '320px' })
      .setLngLat(e.lngLat)
      .setHTML(buildPopupHTML(props))
      .addTo(map);
  });
  map.on('mouseenter', LAYER_HIT, () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', LAYER_HIT, () => { map.getCanvas().style.cursor = ''; });

  // Layer control showing only the user-added PMTiles layers
  const layerControl = new LayerControl({
    collapsed: true,
    layers: [LAYER_FILL, LAYER_OUTLINE],
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');
});
