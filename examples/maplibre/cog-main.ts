import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { COGLayer, proj } from '@developmentseed/deck.gl-geotiff';
import { toProj4 } from 'geotiff-geokeys-to-proj4';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';

// NLCD 2024 Land Cover COG (Continental US)
const COG_URL = 'https://s3.us-east-1.amazonaws.com/ds-deck.gl-raster-public/cog/Annual_NLCD_LndCov_2024_CU_C1V1.tif';

// US bounds
const US_BOUNDS: [[number, number], [number, number]] = [[-125, 24], [-66, 50]];

// CONUS Albers Equal Area (EPSG:5070) - commonly used for NLCD
const CONUS_ALBERS_PROJ4 = '+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs';

/**
 * Custom geoKeysParser to handle user-defined projections locally.
 * The NLCD COG uses CONUS Albers (similar to EPSG:5070).
 */
async function geoKeysParser(
  geoKeys: Record<string, unknown>,
): Promise<proj.ProjectionInfo> {
  console.log('geoKeysParser called with:', geoKeys);

  try {
    const result = toProj4(geoKeys as Parameters<typeof toProj4>[0]);
    console.log('toProj4 result:', result);

    // Check if we got a valid proj4 string
    if (result.proj4 && typeof result.proj4 === 'string' && result.proj4.trim()) {
      // Clean up the proj4 string - remove +axis=ne which can cause issues
      let cleanProj4 = result.proj4
        .replace(/\+axis=\w+\s*/g, '')
        .replace(/\+pm=\d+\s*/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      console.log('Using cleaned proj4:', cleanProj4);
      return {
        definition: cleanProj4,
        proj4: cleanProj4,
      };
    }
  } catch (error) {
    console.warn('toProj4 error:', error);
  }

  // Fallback to CONUS Albers for NLCD-like data
  console.log('Using CONUS Albers fallback');
  return {
    definition: CONUS_ALBERS_PROJ4,
    proj4: CONUS_ALBERS_PROJ4,
  };
}

// Create map centered on Continental US
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [-98.5, 39.8],
  zoom: 4,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

// Create deck.gl overlay
const deckOverlay = new MapboxOverlay({ layers: [] });
let cogLayer: COGLayer | null = null;
let cogLayerVisible = true;
let currentOpacity = 0.8;

map.on('load', () => {
  map.addControl(deckOverlay as unknown as maplibregl.IControl);

  // Add layer control
  const layerControl = new LayerControl({
    collapsed: true,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-left');

  // Auto-load on startup
  setTimeout(loadNLCD, 500);
});

function showStatus(message: string, type: 'loading' | 'success' | 'error'): void {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.className = `status-message status-${type}`;
    status.style.display = 'block';
  }
}

function hideStatus(): void {
  const status = document.getElementById('status');
  if (status) {
    status.style.display = 'none';
  }
}

async function loadNLCD(): Promise<void> {
  const btn = document.getElementById('btn-load');
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = 'Loading...';
  }
  showStatus('Loading COG tiles...', 'loading');

  try {
    // Create a COGLayer with custom geoKeysParser
    cogLayer = new COGLayer({
      id: 'cog-nlcd',
      geotiff: COG_URL,
      opacity: currentOpacity,
      visible: cogLayerVisible,
      geoKeysParser,
      onGeoTIFFLoad: (_tiff: unknown, options: { geographicBounds: { west: number; south: number; east: number; north: number } }) => {
        const { west, south, east, north } = options.geographicBounds;
        map.fitBounds([[west, south], [east, north]], { padding: 50, duration: 1500 });
        showStatus('COG layer loaded successfully!', 'success');
        setTimeout(hideStatus, 3000);
      },
    });

    deckOverlay.setProps({ layers: [cogLayer] });

    if (btn) {
      btn.textContent = 'Reload NLCD 2024';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showStatus(`Error: ${errorMessage}`, 'error');
    console.error('COG load error:', error);
    if (btn) {
      btn.textContent = 'Load NLCD 2024 Land Cover';
    }
  }

  if (btn) {
    btn.classList.remove('loading');
  }
}

function updateOpacity(): void {
  const opacityInput = document.getElementById('opacity') as HTMLInputElement;
  const opacityValue = document.getElementById('opacityValue');

  if (opacityInput && opacityValue) {
    currentOpacity = parseInt(opacityInput.value) / 100;
    opacityValue.textContent = `${Math.round(currentOpacity * 100)}%`;

    if (cogLayer) {
      cogLayer = new COGLayer({
        id: 'cog-nlcd',
        geotiff: COG_URL,
        opacity: currentOpacity,
        visible: cogLayerVisible,
        geoKeysParser,
      });
      deckOverlay.setProps({ layers: [cogLayer] });
    }
  }
}

function fitToBounds(): void {
  map.fitBounds(US_BOUNDS, { padding: 50, duration: 2000 });
}

function toggleLayer(): void {
  cogLayerVisible = !cogLayerVisible;
  if (cogLayer) {
    cogLayer = new COGLayer({
      id: 'cog-nlcd',
      geotiff: COG_URL,
      opacity: currentOpacity,
      visible: cogLayerVisible,
      geoKeysParser,
    });
    deckOverlay.setProps({ layers: [cogLayer] });
  }
}

// Bind event listeners
document.getElementById('btn-load')?.addEventListener('click', loadNLCD);
document.getElementById('opacity')?.addEventListener('input', updateOpacity);
document.getElementById('btn-fit')?.addEventListener('click', fitToBounds);
document.getElementById('btn-toggle')?.addEventListener('click', toggleLayer);
