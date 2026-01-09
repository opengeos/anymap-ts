import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { COGLayer } from '@developmentseed/deck.gl-geotiff';

// NLCD 2024 Land Cover COG (Continental US)
const COG_URL = 'https://s3.us-east-1.amazonaws.com/ds-deck.gl-raster-public/cog/Annual_NLCD_LndCov_2024_CU_C1V1.tif';

// US bounds
const US_BOUNDS: [[number, number], [number, number]] = [[-125, 24], [-66, 50]];

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
    // Create a COGLayer using @developmentseed/deck.gl-geotiff
    cogLayer = new COGLayer({
      id: 'cog-nlcd',
      url: COG_URL,
      opacity: currentOpacity,
      visible: cogLayerVisible,
    });

    deckOverlay.setProps({ layers: [cogLayer] });

    showStatus('COG layer loaded successfully!', 'success');
    if (btn) {
      btn.textContent = 'Reload NLCD 2024';
    }
    setTimeout(hideStatus, 3000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showStatus(`Error: ${errorMessage}`, 'error');
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

    // Recreate layer with new opacity
    if (cogLayer) {
      cogLayer = new COGLayer({
        id: 'cog-nlcd',
        url: COG_URL,
        opacity: currentOpacity,
        visible: cogLayerVisible,
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
      url: COG_URL,
      opacity: currentOpacity,
      visible: cogLayerVisible,
    });
    deckOverlay.setProps({ layers: [cogLayer] });
  }
}

// Bind event listeners
document.getElementById('btn-load')?.addEventListener('click', loadNLCD);
document.getElementById('opacity')?.addEventListener('input', updateOpacity);
document.getElementById('btn-fit')?.addEventListener('click', fitToBounds);
document.getElementById('btn-toggle')?.addEventListener('click', toggleLayer);
