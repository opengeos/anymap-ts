/**
 * Leaflet renderer implementation.
 * Note: Leaflet uses [lat, lng] order (opposite of MapLibre/Mapbox).
 */

import L, { Map as LeafletMap, TileLayer, Marker, Popup, GeoJSON, Control, LatLngBounds } from 'leaflet';
import { BaseMapRenderer, MethodHandler } from '../core/BaseMapRenderer';
import { StateManager } from '../core/StateManager';
import type { MapWidgetModel } from '../types/anywidget';
import type { ControlPosition, FlyToOptions, FitBoundsOptions, DEFAULT_STYLE, inferGeometryType } from '../types/leaflet';
import type { Feature, FeatureCollection } from 'geojson';

/**
 * Leaflet map renderer.
 */
export class LeafletRenderer extends BaseMapRenderer<LeafletMap> {
  private stateManager: StateManager;
  private layersMap: globalThis.Map<string, L.Layer> = new globalThis.Map();
  private markersMap: globalThis.Map<string, Marker> = new globalThis.Map();
  private popupsMap: globalThis.Map<string, Popup> = new globalThis.Map();
  private controlsMap: globalThis.Map<string, Control> = new globalThis.Map();
  private resizeObserver: ResizeObserver | null = null;

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  /**
   * Initialize the Leaflet map.
   */
  async initialize(): Promise<void> {
    // Create container
    this.createMapContainer();

    // Create map
    this.map = this.createMap();

    // Set up listeners
    this.setupModelListeners();
    this.setupMapEvents();

    // Set up resize observer
    this.setupResizeObserver();

    // Process any JS calls that were made before listeners were set up
    this.processJsCalls();

    // Mark as ready (Leaflet doesn't have a load event like MapLibre)
    this.isMapReady = true;
    this.processPendingCalls();
  }

  /**
   * Set up resize observer.
   */
  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });

    this.resizeObserver.observe(this.mapContainer);
    this.resizeObserver.observe(this.el);
  }

  /**
   * Create the Leaflet map instance.
   */
  protected createMap(): LeafletMap {
    // Leaflet uses [lat, lng] but we receive [lng, lat] from Python
    const center = this.model.get('center') as [number, number];
    const zoom = this.model.get('zoom');

    const map = L.map(this.mapContainer!, {
      center: [center[1], center[0]], // Convert [lng, lat] to [lat, lng]
      zoom,
      zoomControl: false, // We'll add controls manually
      attributionControl: false,
    });

    return map;
  }

  /**
   * Set up map event listeners.
   */
  private setupMapEvents(): void {
    if (!this.map) return;

    // Click event
    this.map.on('click', (e) => {
      this.model.set('clicked', {
        lng: e.latlng.lng,
        lat: e.latlng.lat,
        point: [e.containerPoint.x, e.containerPoint.y],
      });
      this.sendEvent('click', {
        lngLat: [e.latlng.lng, e.latlng.lat],
        point: [e.containerPoint.x, e.containerPoint.y],
      });
      this.model.save_changes();
    });

    // Move end event
    this.map.on('moveend', () => {
      if (!this.map) return;
      const center = this.map.getCenter();
      const bounds = this.map.getBounds();
      const zoom = this.map.getZoom();

      this.model.set('current_center', [center.lng, center.lat]);
      this.model.set('current_zoom', zoom);
      this.model.set('current_bounds', [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);
      this.model.save_changes();

      this.sendEvent('moveend', {
        center: [center.lng, center.lat],
        zoom,
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      });
    });

    // Zoom end event
    this.map.on('zoomend', () => {
      if (!this.map) return;
      this.sendEvent('zoomend', { zoom: this.map.getZoom() });
    });
  }

  /**
   * Register all method handlers.
   */
  private registerMethods(): void {
    // Map navigation
    this.registerMethod('setCenter', this.handleSetCenter.bind(this));
    this.registerMethod('setZoom', this.handleSetZoom.bind(this));
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('fitBounds', this.handleFitBounds.bind(this));

    // Tile layers
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));
    this.registerMethod('removeTileLayer', this.handleRemoveTileLayer.bind(this));

    // GeoJSON
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));
    this.registerMethod('removeGeoJSON', this.handleRemoveGeoJSON.bind(this));

    // Layers
    this.registerMethod('removeLayer', this.handleRemoveLayer.bind(this));
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));

    // Basemaps
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));

    // Controls
    this.registerMethod('addControl', this.handleAddControl.bind(this));
    this.registerMethod('removeControl', this.handleRemoveControl.bind(this));

    // Markers
    this.registerMethod('addMarker', this.handleAddMarker.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));
  }

  // -------------------------------------------------------------------------
  // Map navigation handlers
  // -------------------------------------------------------------------------

  private handleSetCenter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    this.map.setView([lat, lng], this.map.getZoom());
  }

  private handleSetZoom(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [zoom] = args as [number];
    this.map.setZoom(zoom);
  }

  private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const zoom = kwargs.zoom as number | undefined;
    const duration = (kwargs.duration as number) || 2000;

    const options = {
      duration: duration / 1000, // Leaflet uses seconds
    };

    if (zoom !== undefined) {
      this.map.flyTo([lat, lng], zoom, options);
    } else {
      this.map.flyTo([lat, lng], this.map.getZoom(), options);
    }
  }

  private handleFitBounds(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [bounds] = args as [[number, number, number, number]];
    const padding = (kwargs.padding as number) || 50;
    const duration = (kwargs.duration as number) || 1000;

    const leafletBounds = L.latLngBounds(
      [bounds[1], bounds[0]], // Southwest: [lat, lng]
      [bounds[3], bounds[2]]  // Northeast: [lat, lng]
    );

    this.map.fitBounds(leafletBounds, {
      padding: [padding, padding],
      animate: true,
      duration: duration / 1000,
    });
  }

  // -------------------------------------------------------------------------
  // Tile layer handlers
  // -------------------------------------------------------------------------

  private handleAddTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || `tiles-${Date.now()}`;
    const attribution = (kwargs.attribution as string) || '';
    const minZoom = (kwargs.minZoom as number) || 0;
    const maxZoom = (kwargs.maxZoom as number) || 22;
    const opacity = (kwargs.opacity as number) || 1;

    const tileLayer = L.tileLayer(url, {
      attribution,
      minZoom,
      maxZoom,
      opacity,
    });

    tileLayer.addTo(this.map);
    this.layersMap.set(name, tileLayer);
  }

  private handleRemoveTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [name] = args as [string];

    const layer = this.layersMap.get(name);
    if (layer) {
      this.map.removeLayer(layer);
      this.layersMap.delete(name);
    }
  }

  // -------------------------------------------------------------------------
  // Basemap handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || 'basemap';
    const attribution = (kwargs.attribution as string) || '';

    // Remove existing basemap with same name
    const existingLayer = this.layersMap.get(`basemap-${name}`);
    if (existingLayer) {
      this.map.removeLayer(existingLayer);
    }

    const tileLayer = L.tileLayer(url, {
      attribution,
      maxZoom: 22,
    });

    // Add to bottom of layer stack
    tileLayer.addTo(this.map);
    tileLayer.bringToBack();
    this.layersMap.set(`basemap-${name}`, tileLayer);
  }

  // -------------------------------------------------------------------------
  // GeoJSON handlers
  // -------------------------------------------------------------------------

  private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const geojson = kwargs.data as FeatureCollection | Feature;
    const name = kwargs.name as string;
    const style = kwargs.style as Record<string, unknown> | undefined;
    const fitBounds = kwargs.fitBounds !== false;

    // Create GeoJSON layer
    const geoJsonLayer = L.geoJSON(geojson as any, {
      style: (feature) => {
        if (style) {
          return style;
        }
        // Default styles based on geometry type
        const geomType = feature?.geometry?.type || 'Point';
        return this.getDefaultStyle(geomType);
      },
      pointToLayer: (feature, latlng) => {
        const s = style || this.getDefaultStyle('Point');
        return L.circleMarker(latlng, s as any);
      },
    });

    geoJsonLayer.addTo(this.map);
    this.layersMap.set(name, geoJsonLayer);

    // Fit bounds
    if (fitBounds && kwargs.bounds) {
      const bounds = kwargs.bounds as [number, number, number, number];
      const leafletBounds = L.latLngBounds(
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]]
      );
      this.map.fitBounds(leafletBounds, { padding: [50, 50] });
    } else if (fitBounds) {
      const layerBounds = geoJsonLayer.getBounds();
      if (layerBounds.isValid()) {
        this.map.fitBounds(layerBounds, { padding: [50, 50] });
      }
    }
  }

  private handleRemoveGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [name] = args as [string];

    const layer = this.layersMap.get(name);
    if (layer) {
      this.map.removeLayer(layer);
      this.layersMap.delete(name);
    }
  }

  private getDefaultStyle(geometryType: string): Record<string, unknown> {
    const defaults: Record<string, Record<string, unknown>> = {
      Point: {
        radius: 8,
        fillColor: '#3388ff',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      },
      MultiPoint: {
        radius: 8,
        fillColor: '#3388ff',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      },
      LineString: {
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
      },
      MultiLineString: {
        color: '#3388ff',
        weight: 3,
        opacity: 0.8,
      },
      Polygon: {
        fillColor: '#3388ff',
        color: '#0000ff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
      MultiPolygon: {
        fillColor: '#3388ff',
        color: '#0000ff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5,
      },
    };
    return defaults[geometryType] || defaults.Point;
  }

  // -------------------------------------------------------------------------
  // Layer handlers
  // -------------------------------------------------------------------------

  private handleRemoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId] = args as [string];

    const layer = this.layersMap.get(layerId);
    if (layer) {
      this.map.removeLayer(layer);
      this.layersMap.delete(layerId);
    }
    this.stateManager.removeLayer(layerId);
  }

  private handleSetVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, visible] = args as [string, boolean];

    const layer = this.layersMap.get(layerId);
    if (layer) {
      if (visible) {
        this.map.addLayer(layer);
      } else {
        this.map.removeLayer(layer);
      }
    }
  }

  private handleSetOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [layerId, opacity] = args as [string, number];

    const layer = this.layersMap.get(layerId);
    if (layer && 'setOpacity' in layer) {
      (layer as TileLayer).setOpacity(opacity);
    } else if (layer && 'setStyle' in layer) {
      (layer as GeoJSON).setStyle({ opacity, fillOpacity: opacity * 0.6 });
    }
  }

  // -------------------------------------------------------------------------
  // Control handlers
  // -------------------------------------------------------------------------

  private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [controlType] = args as [string];
    const position = this.convertPosition(kwargs.position as string);

    let control: Control | null = null;

    switch (controlType) {
      case 'zoom':
      case 'navigation':
        control = L.control.zoom({ position });
        break;
      case 'scale':
        control = L.control.scale({ position, imperial: false });
        break;
      case 'attribution':
        control = L.control.attribution({ position });
        break;
      case 'layers':
        // Layer control needs baseLayers and overlays
        const baseLayers: Record<string, TileLayer> = {};
        const overlays: Record<string, L.Layer> = {};
        this.layersMap.forEach((layer, name) => {
          if (name.startsWith('basemap-')) {
            baseLayers[name.replace('basemap-', '')] = layer as TileLayer;
          } else {
            overlays[name] = layer;
          }
        });
        control = L.control.layers(baseLayers, overlays, { position, collapsed: kwargs.collapsed !== false });
        break;
    }

    if (control) {
      control.addTo(this.map);
      this.controlsMap.set(controlType, control);
      this.stateManager.addControl(controlType, controlType, position, kwargs);
    }
  }

  private handleRemoveControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [controlType] = args as [string];

    const control = this.controlsMap.get(controlType);
    if (control) {
      this.map.removeControl(control);
      this.controlsMap.delete(controlType);
      this.stateManager.removeControl(controlType);
    }
  }

  private convertPosition(position?: string): ControlPosition {
    const positionMap: Record<string, ControlPosition> = {
      'top-left': 'topleft',
      'top-right': 'topright',
      'bottom-left': 'bottomleft',
      'bottom-right': 'bottomright',
      topleft: 'topleft',
      topright: 'topright',
      bottomleft: 'bottomleft',
      bottomright: 'bottomright',
    };
    return positionMap[position || 'top-right'] || 'topright';
  }

  // -------------------------------------------------------------------------
  // Marker handlers
  // -------------------------------------------------------------------------

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const id = (kwargs.id as string) || `marker-${Date.now()}`;
    const popup = kwargs.popup as string | undefined;

    const marker = L.marker([lat, lng]);

    if (popup) {
      marker.bindPopup(popup);
    }

    marker.addTo(this.map);
    this.markersMap.set(id, marker);
  }

  private handleRemoveMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];

    const marker = this.markersMap.get(id);
    if (marker) {
      marker.remove();
      this.markersMap.delete(id);
    }
  }

  // -------------------------------------------------------------------------
  // Trait change handlers
  // -------------------------------------------------------------------------

  protected onCenterChange(): void {
    if (this.map && this.isMapReady) {
      const center = this.model.get('center') as [number, number];
      this.map.setView([center[1], center[0]], this.map.getZoom());
    }
  }

  protected onZoomChange(): void {
    if (this.map && this.isMapReady) {
      const zoom = this.model.get('zoom');
      this.map.setZoom(zoom);
    }
  }

  protected onStyleChange(): void {
    // Leaflet doesn't have a style concept like MapLibre/Mapbox
    // Style changes would need to be handled per-layer
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    this.removeModelListeners();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.markersMap.forEach((marker) => marker.remove());
    this.markersMap.clear();

    this.popupsMap.forEach((popup) => popup.remove());
    this.popupsMap.clear();

    this.layersMap.forEach((layer) => {
      if (this.map) {
        this.map.removeLayer(layer);
      }
    });
    this.layersMap.clear();

    this.controlsMap.forEach((control) => {
      if (this.map) {
        this.map.removeControl(control);
      }
    });
    this.controlsMap.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    if (this.mapContainer) {
      this.mapContainer.remove();
      this.mapContainer = null;
    }
  }
}
