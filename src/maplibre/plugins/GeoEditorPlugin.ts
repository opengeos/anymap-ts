/**
 * MapLibre GL Geo Editor plugin integration.
 * Uses dynamic CDN imports.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection, Feature } from 'geojson';
import type { ControlPosition } from '../../types/maplibre';

// Dynamic import helpers
async function loadGeoman() {
  const mod = await import('https://esm.sh/@geoman-io/maplibre-geoman-free@0.6.2');
  return mod.Geoman;
}

async function loadGeoEditor() {
  const mod = await import('https://esm.sh/maplibre-gl-geo-editor@0.7.3');
  return mod.GeoEditor;
}

export interface GeoEditorOptions {
  position?: ControlPosition;
  drawModes?: string[];
  editModes?: string[];
  collapsed?: boolean;
  fileModes?: string[];
  showFeatureProperties?: boolean;
  fitBoundsOnLoad?: boolean;
}

/**
 * Plugin for integrating maplibre-gl-geo-editor.
 */
export class GeoEditorPlugin {
  private map: MapLibreMap;
  private geoman: any | null = null;
  private geoEditor: any | null = null;
  private onDataChange: ((data: FeatureCollection) => void) | null = null;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  /**
   * Initialize the geo editor control.
   */
  async initialize(
    options: GeoEditorOptions,
    onDataChange: (data: FeatureCollection) => void
  ): Promise<void> {
    if (this.geoEditor) {
      this.destroy();
    }

    this.onDataChange = onDataChange;

    const {
      position = 'top-right',
      drawModes = ['polygon', 'line', 'rectangle', 'circle', 'marker'],
      editModes = ['select', 'drag', 'change', 'rotate', 'delete'],
      collapsed = false,
      fileModes = ['open', 'save'],
      showFeatureProperties = false,
      fitBoundsOnLoad = true,
    } = options;

    // Load modules from CDN
    const [GeomanClass, GeoEditorClass] = await Promise.all([
      loadGeoman(),
      loadGeoEditor(),
    ]);

    // Helper to create GeoEditor once Geoman is ready
    const createGeoEditor = () => {
      if (this.geoEditor) return;

      try {
        this.geoEditor = new GeoEditorClass({
          position,
          drawModes: drawModes as any[],
          editModes: editModes as any[],
          fileModes: fileModes as any[],
          collapsed,
          showFeatureProperties,
          fitBoundsOnLoad,
          onFeatureCreate: () => this.syncFeatures(),
          onFeatureEdit: () => this.syncFeatures(),
          onFeatureDelete: () => this.syncFeatures(),
          onSelectionChange: () => this.syncFeatures(),
          onGeoJsonLoad: () => this.syncFeatures(),
        });

        this.geoEditor.setGeoman(this.geoman!);
        this.map.addControl(this.geoEditor, position);
      } catch (error) {
        console.error('Failed to create GeoEditor:', error);
      }
    };

    // Initialize Geoman first
    this.geoman = new GeomanClass(this.map, {});

    this.map.on('gm:loaded', createGeoEditor);

    setTimeout(() => {
      if (!this.geoEditor && this.geoman) {
        console.warn('gm:loaded event not received, initializing GeoEditor with timeout fallback');
        createGeoEditor();
      }
    }, 1000);
  }

  private syncFeatures(): void {
    if (this.geoEditor && this.onDataChange) {
      const features = this.geoEditor.getFeatures();
      this.onDataChange(features);
    }
  }

  getFeatures(): FeatureCollection {
    if (!this.geoEditor) {
      return { type: 'FeatureCollection', features: [] };
    }
    return this.geoEditor.getFeatures();
  }

  loadFeatures(geojson: FeatureCollection): void {
    if (!this.geoEditor) {
      console.warn('GeoEditor not initialized');
      return;
    }
    this.geoEditor.loadGeoJson(geojson);
    this.syncFeatures();
  }

  clear(): void {
    if (this.geoEditor) {
      const features = this.geoEditor.getFeatures();
      for (const feature of features.features) {
        if (feature.id) {
          this.geoEditor.selectFeatures([feature]);
          this.geoEditor.deleteSelectedFeatures();
        }
      }
      this.syncFeatures();
    }
  }

  getSelectedFeatures(): Feature[] {
    if (!this.geoEditor) {
      return [];
    }
    return this.geoEditor.getSelectedFeatures();
  }

  enableDrawMode(mode: string): void {
    if (this.geoEditor) {
      this.geoEditor.enableDrawMode(mode as any);
    }
  }

  enableEditMode(mode: string): void {
    if (this.geoEditor) {
      this.geoEditor.enableEditMode(mode as any);
    }
  }

  disableAllModes(): void {
    if (this.geoEditor) {
      this.geoEditor.disableAllModes();
    }
  }

  getGeoEditor(): any | null {
    return this.geoEditor;
  }

  destroy(): void {
    if (this.geoEditor) {
      this.map.removeControl(this.geoEditor);
      this.geoEditor = null;
    }
    this.geoman = null;
    this.onDataChange = null;
  }
}
