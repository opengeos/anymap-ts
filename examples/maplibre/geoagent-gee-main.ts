import maplibregl from 'maplibre-gl';
import { GeoAgentControl } from 'maplibre-gl-geoagent';
import 'maplibre-gl/dist/maplibre-gl.css';
import 'maplibre-gl-geoagent/style.css';

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

const env = import.meta.env as Record<string, string | undefined>;
const oauthClientId = env.VITE_GEE_OAUTH_CLIENT_ID?.trim() || undefined;
const projectId = env.VITE_GEE_PROJECT_ID?.trim() || undefined;

const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP_STYLE,
  center: [-83.9207, 35.9606],
  zoom: 8,
  maxPitch: 85,
  canvasContextAttributes: { preserveDrawingBuffer: true },
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const studyArea = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [-84.18, 35.82],
          [-83.66, 35.82],
          [-83.66, 36.11],
          [-84.18, 36.11],
          [-84.18, 35.82],
        ]],
      },
      properties: {
        name: 'Knoxville study area',
      },
    },
  ],
};

function setStatus(): void {
  const status = document.getElementById('gee-status');
  if (!status) return;

  status.replaceChildren();

  const heading = document.createElement('h3');
  heading.textContent = 'Earth Engine';
  status.appendChild(heading);

  const oauth = document.createElement('p');
  oauth.textContent = oauthClientId
    ? 'OAuth client configured'
    : 'Set VITE_GEE_OAUTH_CLIENT_ID in examples/.env to enable OAuth.';
  status.appendChild(oauth);

  const project = document.createElement('p');
  project.textContent = projectId
    ? `Project: ${projectId}`
    : 'Project ID can be entered in the GeoAgent panel.';
  status.appendChild(project);

  const prompt = document.createElement('pre');
  prompt.textContent = 'Try: Search Google Earth Engine for SRTM elevation, then add it with a terrain palette.';
  status.appendChild(prompt);
}

map.on('load', () => {
  map.addSource('knoxville-study-area-source', {
    type: 'geojson',
    data: studyArea,
  });

  map.addLayer({
    id: 'knoxville-study-area',
    type: 'fill',
    source: 'knoxville-study-area-source',
    paint: {
      'fill-color': '#2f9e44',
      'fill-opacity': 0.22,
      'fill-outline-color': '#1b5e20',
    },
  });

  map.addLayer({
    id: 'knoxville-study-area-outline',
    type: 'line',
    source: 'knoxville-study-area-source',
    paint: {
      'line-color': '#1b5e20',
      'line-width': 2,
    },
  });

  const geoAgent = new GeoAgentControl({
    title: 'GeoAgent GEE',
    collapsed: false,
    position: 'top-left',
    panelWidth: 460,
    panelMinWidth: 360,
    panelMaxWidth: 760,
    defaultProvider: 'google',
    storagePrefix: 'geoagent.maplibre.gee',
    allowCodeExecutionDefault: false,
    allowDestructiveToolsDefault: false,
    showPermissionToggles: false,
    earthEngine: {
      enabled: true,
      oauthClientId,
      projectId,
      includeCommunityCatalog: true,
    },
    basemaps: {
      Liberty: BASEMAP_STYLE,
      Positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      DarkMatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    },
  });

  geoAgent.on('statechange', (event) => {
    console.log('GeoAgent GEE state changed:', event.state);
  });

  map.addControl(geoAgent, 'top-left');
  setStatus();
});
