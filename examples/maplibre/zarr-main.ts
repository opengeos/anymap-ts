import maplibregl from 'maplibre-gl';
import { ZarrLayer } from '@carbonplan/zarr-layer';
import { LayerControl } from 'maplibre-gl-layer-control';
import 'maplibre-gl-layer-control/style.css';

interface DatasetConfig {
  url: string;
  variable: string;
  clim: [number, number];
  colormap: string[];
  selector?: Record<string, number | string>;
  spatialDimensions?: { lat: string; lon: string };
  zarrVersion?: number;
  center: [number, number];
  zoom: number;
}

// Dataset configurations matching the notebook examples
const datasets: Record<string, DatasetConfig> = {
  climate: {
    url: 'https://carbonplan-maps.s3.us-west-2.amazonaws.com/v2/demo/4d/tavg-prec-month',
    variable: 'climate',
    clim: [0, 300],
    colormap: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    selector: { band: 'prec', month: 1 },
    spatialDimensions: { lat: 'y', lon: 'x' },
    zarrVersion: 2,
    center: [-100, 40],
    zoom: 3,
  },
  ocean: {
    url: 'https://atlantis-vis-o.s3-ext.jc.rl.ac.uk/noc-npd-era5-demo/npd-eorca1-era5v1/gn/T1y/tos_con',
    variable: 'tos_con',
    clim: [0, 50],
    colormap: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
    selector: { time: 0 },
    center: [0, 30],
    zoom: 2,
  },
  burn: {
    url: 'https://carbonplan-share.s3.us-west-2.amazonaws.com/zarr-layer-examples/13-lvl-30m-4326-scott-BP.zarr',
    variable: 'BP',
    clim: [0, 0.13],
    colormap: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
    spatialDimensions: { lat: 'latitude', lon: 'longitude' },
    zarrVersion: 3,
    center: [-98, 39],
    zoom: 4,
  },
};

// Current state
let currentDataset = 'climate';
let currentOpacity = 0.8;
let layerVisible = true;
let zarrLayer: ZarrLayer | null = null;

// Create map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: datasets.climate.center,
  zoom: datasets.climate.zoom,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

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

function updateLegend(colormap: string[], clim: [number, number]): void {
  const gradient = document.getElementById('legendGradient');
  const minLabel = document.getElementById('minLabel');
  const maxLabel = document.getElementById('maxLabel');

  if (gradient) {
    gradient.style.background = `linear-gradient(to right, ${colormap.join(', ')})`;
  }
  if (minLabel) minLabel.textContent = clim[0].toString();
  if (maxLabel) maxLabel.textContent = clim[1].toString();
}

function updateControlVisibility(): void {
  const bandGroup = document.getElementById('bandGroup');
  const monthGroup = document.getElementById('monthGroup');

  if (currentDataset === 'climate') {
    if (bandGroup) bandGroup.style.display = 'block';
    if (monthGroup) monthGroup.style.display = 'block';
  } else {
    if (bandGroup) bandGroup.style.display = 'none';
    if (monthGroup) monthGroup.style.display = 'none';
  }
}

async function loadZarrLayer(): Promise<void> {
  showStatus('Loading Zarr layer...', 'loading');

  try {
    const config = datasets[currentDataset];

    // Remove existing layer
    if (zarrLayer) {
      map.removeLayer(zarrLayer.id);
      zarrLayer = null;
    }

    // Build selector for climate dataset
    let selector = config.selector;
    if (currentDataset === 'climate') {
      const bandSelect = document.getElementById('band') as HTMLSelectElement;
      const monthSelect = document.getElementById('month') as HTMLSelectElement;
      selector = {
        band: bandSelect?.value || 'prec',
        month: parseInt(monthSelect?.value || '1'),
      };

      // Update clim and colormap based on band
      if (bandSelect?.value === 'tavg') {
        config.clim = [-20, 30];
        config.colormap = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'];
      } else {
        config.clim = [0, 300];
        config.colormap = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
      }
    }

    // Create new Zarr layer
    zarrLayer = new ZarrLayer({
      id: `zarr-${currentDataset}`,
      source: config.url,
      variable: config.variable,
      colormap: config.colormap,
      clim: config.clim,
      opacity: layerVisible ? currentOpacity : 0,
      selector: selector,
    });

    // Add layer to map
    map.addLayer(zarrLayer);

    // Update legend
    updateLegend(config.colormap, config.clim);

    // Fly to dataset center
    map.flyTo({
      center: config.center,
      zoom: config.zoom,
      duration: 1500,
    });

    showStatus('Zarr layer loaded!', 'success');
    setTimeout(hideStatus, 2000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    showStatus(`Error: ${errorMessage}`, 'error');
    console.error('Failed to load Zarr layer:', error);
  }
}

function updateOpacity(): void {
  const opacityInput = document.getElementById('opacity') as HTMLInputElement;
  const opacityValue = document.getElementById('opacityValue');

  if (opacityInput && opacityValue) {
    currentOpacity = parseInt(opacityInput.value) / 100;
    opacityValue.textContent = `${Math.round(currentOpacity * 100)}%`;

    if (zarrLayer && layerVisible) {
      zarrLayer.setOpacity(currentOpacity);
      map.triggerRepaint();
    }
  }
}

function toggleLayer(): void {
  layerVisible = !layerVisible;
  if (zarrLayer) {
    zarrLayer.setOpacity(layerVisible ? currentOpacity : 0);
    map.triggerRepaint();
  }
}

function onDatasetChange(): void {
  const datasetSelect = document.getElementById('dataset') as HTMLSelectElement;
  currentDataset = datasetSelect?.value || 'climate';
  updateControlVisibility();
  loadZarrLayer();
}

// Initialize on map load
map.on('load', () => {
  // Add layer control
  const layerControl = new LayerControl({
    collapsed: true,
  });
  map.addControl(layerControl as unknown as maplibregl.IControl, 'top-right');

  updateControlVisibility();
  loadZarrLayer();
});

// Event listeners
document.getElementById('dataset')?.addEventListener('change', onDatasetChange);
document.getElementById('band')?.addEventListener('change', loadZarrLayer);
document.getElementById('month')?.addEventListener('change', loadZarrLayer);
document.getElementById('opacity')?.addEventListener('input', updateOpacity);
document.getElementById('btn-toggle')?.addEventListener('click', toggleLayer);
