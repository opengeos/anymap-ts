/**
 * MapLibre GL Geo Editor plugin integration.
 */

import type { Map as MapLibreMap } from 'maplibre-gl';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import { GeoEditor } from 'maplibre-gl-geo-editor';
import type { FeatureCollection, Feature } from 'geojson';
import type { ControlPosition } from '../../types/maplibre';

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
  private geoman: Geoman | null = null;
  private geoEditor: GeoEditor | null = null;
  private onDataChange: ((data: FeatureCollection) => void) | null = null;
  private wrappedKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(map: MapLibreMap) {
    this.map = map;
  }

  /**
   * Initialize the geo editor control.
   */
  initialize(
    options: GeoEditorOptions,
    onDataChange: (data: FeatureCollection) => void
  ): void {
    if (this.geoEditor) {
      this.destroy();
    }

    this.onDataChange = onDataChange;

    const {
      position = 'top-right',
      drawModes = ['polygon', 'line', 'rectangle', 'circle', 'marker'],
      editModes = ['select', 'drag', 'change', 'rotate', 'cut', 'delete', 'scale', 'copy', 'split', 'union', 'difference', 'simplify', 'lasso'],
      collapsed = false,
      fileModes = ['open', 'save'],
      showFeatureProperties = false,
      fitBoundsOnLoad = true,
    } = options;

    // Helper to create GeoEditor once Geoman is ready
    const createGeoEditor = () => {
      if (this.geoEditor) return; // Already created

      try {
        // Create GeoEditor with valid options
        this.geoEditor = new GeoEditor({
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

        // Connect Geoman to GeoEditor
        this.geoEditor.setGeoman(this.geoman!);

        // Add control to map
        this.map.addControl(this.geoEditor, position);

        // Scope the editor's document-level keyboard shortcuts to the map
        // container so they don't hijack Ctrl+C/V/Z/Y outside the widget
        // (e.g. in Marimo/Jupyter cell editors). See issue #175.
        this.scopeKeyboardShortcutsToMap();
      } catch (error) {
        console.error('Failed to create GeoEditor:', error);
      }
    };

    // Initialize Geoman first
    this.geoman = new Geoman(this.map, {});

    // Listen for gm:loaded event
    this.map.on('gm:loaded', createGeoEditor);

    // Also set a timeout fallback in case gm:loaded doesn't fire
    setTimeout(() => {
      if (!this.geoEditor && this.geoman) {
        console.warn('gm:loaded event not received, initializing GeoEditor with timeout fallback');
        createGeoEditor();
      }
    }, 1000);
  }

  /**
   * Replace the geo-editor's document-level keydown handler with a wrapper
   * that only delegates to the original when the event originated inside the
   * map container. The upstream handler unconditionally calls
   * `preventDefault()` on Ctrl+C/V/Z/Y, which hijacks copy/paste/undo/redo in
   * Marimo or Jupyter cells when the widget is rendered. See issue #175.
   */
  private scopeKeyboardShortcutsToMap(): void {
    if (!this.geoEditor) return;

    // boundKeyHandler is a private field on GeoEditor; access defensively.
    const editor = this.geoEditor as unknown as {
      boundKeyHandler?: ((e: KeyboardEvent) => void) | null;
    };
    const originalHandler = editor.boundKeyHandler;
    if (typeof originalHandler !== 'function') return;

    document.removeEventListener('keydown', originalHandler);

    const mapContainer = this.map.getContainer();
    const wrappedHandler = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !mapContainer.contains(target)) {
        return;
      }
      originalHandler(event);
    };
    document.addEventListener('keydown', wrappedHandler);
    // Point the editor's own reference at our wrapper so its `onRemove`
    // (called via `map.removeControl(geoEditor)`) cleans up the right
    // listener even when callers bypass `GeoEditorPlugin.destroy()`.
    editor.boundKeyHandler = wrappedHandler;
    this.wrappedKeyHandler = wrappedHandler;
  }

  /**
   * Sync features to Python.
   */
  private syncFeatures(): void {
    if (this.geoEditor && this.onDataChange) {
      const features = this.geoEditor.getFeatures();
      this.onDataChange(features);
    }
  }

  /**
   * Get all features as GeoJSON.
   */
  getFeatures(): FeatureCollection {
    if (!this.geoEditor) {
      return { type: 'FeatureCollection', features: [] };
    }
    return this.geoEditor.getFeatures();
  }

  /**
   * Load GeoJSON features.
   */
  loadFeatures(geojson: FeatureCollection): void {
    if (!this.geoEditor) {
      console.warn('GeoEditor not initialized');
      return;
    }
    this.geoEditor.loadGeoJson(geojson);
    this.syncFeatures();
  }

  /**
   * Clear all features.
   */
  clear(): void {
    if (this.geoEditor) {
      // Get all features and delete them
      const features = this.geoEditor.getFeatures();
      for (const feature of features.features) {
        if (feature.id) {
          // Select and delete each feature
          this.geoEditor.selectFeatures([feature]);
          this.geoEditor.deleteSelectedFeatures();
        }
      }
      this.syncFeatures();
    }
  }

  /**
   * Get selected features.
   */
  getSelectedFeatures(): Feature[] {
    if (!this.geoEditor) {
      return [];
    }
    return this.geoEditor.getSelectedFeatures();
  }

  /**
   * Enable a draw mode.
   */
  enableDrawMode(mode: string): void {
    if (this.geoEditor) {
      this.geoEditor.enableDrawMode(mode as any);
    }
  }

  /**
   * Enable an edit mode.
   */
  enableEditMode(mode: string): void {
    if (this.geoEditor) {
      this.geoEditor.enableEditMode(mode as any);
    }
  }

  /**
   * Disable all modes.
   */
  disableAllModes(): void {
    if (this.geoEditor) {
      this.geoEditor.disableAllModes();
    }
  }

  /**
   * Get the GeoEditor instance.
   */
  getGeoEditor(): GeoEditor | null {
    return this.geoEditor;
  }

  /**
   * Destroy the geo editor.
   */
  destroy(): void {
    if (this.wrappedKeyHandler) {
      document.removeEventListener('keydown', this.wrappedKeyHandler);
      this.wrappedKeyHandler = null;
    }
    if (this.geoEditor) {
      this.map.removeControl(this.geoEditor);
      this.geoEditor = null;
    }
    this.geoman = null;
    this.onDataChange = null;
  }
}
