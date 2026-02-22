/**
 * Leaflet renderer implementation.
 * Note: Leaflet uses [lat, lng] order (opposite of MapLibre/Mapbox).
 *
 * Note: We import from the explicit ESM path to avoid conflict with the
 * src/leaflet directory due to tsconfig baseUrl resolution.
 */

import { L } from './leaflet-setup';

type LeafletMap = L.Map;
type TileLayer = L.TileLayer;
type Marker = L.Marker;
type Popup = L.Popup;
type GeoJSON = L.GeoJSON;
type Control = L.Control;
type LatLngBounds = L.LatLngBounds;
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
  private layerControl: L.Control.Layers | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceTimer: number | null = null;

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  async initialize(): Promise<void> {
    this.createMapContainer();
    this.map = this.createMap();
    this.setupModelListeners();
    this.setupMapEvents();
    this.setupResizeObserver();
    this.processJsCalls();
    this.isMapReady = true;
    this.processPendingCalls();
  }

  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.map) {
        if (this.resizeDebounceTimer !== null) {
          window.clearTimeout(this.resizeDebounceTimer);
        }
        this.resizeDebounceTimer = window.setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
          this.resizeDebounceTimer = null;
        }, 100);
      }
    });

    this.resizeObserver.observe(this.mapContainer);
    this.resizeObserver.observe(this.el);
  }

  protected createMap(): LeafletMap {
    const center = this.model.get('center') as [number, number];
    const zoom = this.model.get('zoom');

    const map = L.map(this.mapContainer!, {
      center: [center[1], center[0]],
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    return map;
  }

  private setupMapEvents(): void {
    if (!this.map) return;

    this.map.on('click', (e: L.LeafletMouseEvent) => {
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

    this.map.on('zoomend', () => {
      if (!this.map) return;
      this.sendEvent('zoomend', { zoom: this.map.getZoom() });
    });
  }

  private registerMethods(): void {
    // Map navigation
    this.registerMethod('setCenter', this.handleSetCenter.bind(this));
    this.registerMethod('setZoom', this.handleSetZoom.bind(this));
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('fitBounds', this.handleFitBounds.bind(this));

    // Tile layers
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));
    this.registerMethod('removeTileLayer', this.handleRemoveTileLayer.bind(this));

    // WMS layers
    this.registerMethod('addWMSLayer', this.handleAddWMSLayer.bind(this));
    this.registerMethod('removeWMSLayer', this.handleRemoveWMSLayer.bind(this));

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
    this.registerMethod('addMarkers', this.handleAddMarkers.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));

    // Shapes
    this.registerMethod('addCircleMarker', this.handleAddCircleMarker.bind(this));
    this.registerMethod('addCircle', this.handleAddCircle.bind(this));
    this.registerMethod('addPolyline', this.handleAddPolyline.bind(this));
    this.registerMethod('addPolygon', this.handleAddPolygon.bind(this));
    this.registerMethod('addRectangle', this.handleAddRectangle.bind(this));

    // Overlays
    this.registerMethod('addImageOverlay', this.handleAddImageOverlay.bind(this));
    this.registerMethod('addVideoOverlay', this.handleAddVideoOverlay.bind(this));

    // Heatmap
    this.registerMethod('addHeatmap', this.handleAddHeatmap.bind(this));
    this.registerMethod('removeHeatmap', this.handleRemoveHeatmap.bind(this));

    // Choropleth
    this.registerMethod('addChoropleth', this.handleAddChoropleth.bind(this));

    // Popups & Tooltips
    this.registerMethod('addPopup', this.handleAddPopup.bind(this));
    this.registerMethod('removePopup', this.handleRemovePopup.bind(this));

    // Legend
    this.registerMethod('addLegend', this.handleAddLegend.bind(this));
    this.registerMethod('removeLegend', this.handleRemoveLegend.bind(this));
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

    const options = { duration: duration / 1000 };

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
      [bounds[1], bounds[0]],
      [bounds[3], bounds[2]]
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
    const opacity = (kwargs.opacity as number) ?? 1;

    const tileLayer = L.tileLayer(url, { attribution, minZoom, maxZoom, opacity });
    tileLayer.addTo(this.map);
    this.layersMap.set(name, tileLayer);

    if (this.layerControl) {
      this.layerControl.addOverlay(tileLayer, name);
    }
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
  // WMS layer handlers
  // -------------------------------------------------------------------------

  private handleAddWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || `wms-${Date.now()}`;
    const layers = (kwargs.layers as string) || '';
    const format = (kwargs.format as string) || 'image/png';
    const transparent = kwargs.transparent !== false;
    const attribution = (kwargs.attribution as string) || '';
    const opacity = (kwargs.opacity as number) ?? 1;
    const crs = kwargs.crs as string | undefined;
    const styles = (kwargs.styles as string) || '';
    const version = (kwargs.version as string) || '1.1.1';
    const uppercase = kwargs.uppercase !== false;

    const wmsOptions: Record<string, unknown> = {
      layers,
      format,
      transparent,
      attribution,
      opacity,
      styles,
      version,
      uppercase,
    };

    if (crs) {
      const crsMap: Record<string, L.CRS> = {
        'EPSG:3857': L.CRS.EPSG3857,
        'EPSG:4326': L.CRS.EPSG4326,
        'EPSG:3395': L.CRS.EPSG3395,
      };
      if (crsMap[crs]) {
        wmsOptions.crs = crsMap[crs];
      }
    }

    const wmsLayer = L.tileLayer.wms(url, wmsOptions as any);
    wmsLayer.addTo(this.map);
    this.layersMap.set(name, wmsLayer);

    if (this.layerControl) {
      this.layerControl.addOverlay(wmsLayer, name);
    }
  }

  private handleRemoveWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    this.handleRemoveLayer(args, kwargs);
  }

  // -------------------------------------------------------------------------
  // Basemap handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const name = (kwargs.name as string) || 'basemap';
    const attribution = (kwargs.attribution as string) || '';

    const existingLayer = this.layersMap.get(`basemap-${name}`);
    if (existingLayer) {
      this.map.removeLayer(existingLayer);
    }

    const tileLayer = L.tileLayer(url, { attribution, maxZoom: 22 });
    tileLayer.addTo(this.map);
    tileLayer.bringToBack();
    this.layersMap.set(`basemap-${name}`, tileLayer);

    if (this.layerControl) {
      this.layerControl.addBaseLayer(tileLayer, name);
    }
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
    const popupProperties = kwargs.popupProperties as string[] | boolean | undefined;
    const tooltipProperty = kwargs.tooltipProperty as string | undefined;

    const geoJsonLayer = L.geoJSON(geojson as any, {
      style: (feature: GeoJSON.Feature | undefined) => {
        if (style) return style;
        const geomType = feature?.geometry?.type || 'Point';
        return this.getDefaultStyle(geomType);
      },
      pointToLayer: (feature: GeoJSON.Feature, latlng: L.LatLng) => {
        const s = style || this.getDefaultStyle('Point');
        return L.circleMarker(latlng, s as any);
      },
      onEachFeature: (feature: GeoJSON.Feature, layer: L.Layer) => {
        const props = feature.properties || {};

        if (popupProperties) {
          let html = '<div class="anymap-popup">';
          const keys = popupProperties === true ? Object.keys(props) : popupProperties;
          for (const key of keys) {
            if (props[key] !== undefined && props[key] !== null) {
              html += `<b>${key}:</b> ${props[key]}<br>`;
            }
          }
          html += '</div>';
          layer.bindPopup(html);
        }

        if (tooltipProperty && props[tooltipProperty] !== undefined) {
          layer.bindTooltip(String(props[tooltipProperty]), { sticky: true });
        }
      },
    });

    geoJsonLayer.addTo(this.map);
    this.layersMap.set(name, geoJsonLayer);

    if (this.layerControl) {
      this.layerControl.addOverlay(geoJsonLayer, name);
    }

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
      Point: { radius: 8, fillColor: '#3388ff', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8 },
      MultiPoint: { radius: 8, fillColor: '#3388ff', color: '#ffffff', weight: 2, opacity: 1, fillOpacity: 0.8 },
      LineString: { color: '#3388ff', weight: 3, opacity: 0.8 },
      MultiLineString: { color: '#3388ff', weight: 3, opacity: 0.8 },
      Polygon: { fillColor: '#3388ff', color: '#0000ff', weight: 2, opacity: 1, fillOpacity: 0.5 },
      MultiPolygon: { fillColor: '#3388ff', color: '#0000ff', weight: 2, opacity: 1, fillOpacity: 0.5 },
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
      if (this.layerControl) {
        this.layerControl.removeLayer(layer);
      }
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
      case 'layers': {
        const baseLayers: Record<string, TileLayer> = {};
        const overlays: Record<string, L.Layer> = {};
        this.layersMap.forEach((layer, name) => {
          if (name.startsWith('basemap-')) {
            baseLayers[name.replace('basemap-', '')] = layer as TileLayer;
          } else {
            overlays[name] = layer;
          }
        });
        const layersControl = L.control.layers(baseLayers, overlays, {
          position, collapsed: kwargs.collapsed !== false,
        });
        this.layerControl = layersControl;
        control = layersControl;
        break;
      }
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
      if (controlType === 'layers') {
        this.layerControl = null;
      }
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
    const id = (kwargs.id as string) || `marker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;
    const draggable = kwargs.draggable as boolean | undefined;
    const opacity = kwargs.opacity as number | undefined;
    const iconUrl = kwargs.iconUrl as string | undefined;
    const iconSize = kwargs.iconSize as [number, number] | undefined;
    const iconAnchor = kwargs.iconAnchor as [number, number] | undefined;

    const markerOptions: L.MarkerOptions = {};

    if (draggable) markerOptions.draggable = true;
    if (opacity !== undefined) markerOptions.opacity = opacity;

    if (iconUrl) {
      markerOptions.icon = L.icon({
        iconUrl,
        iconSize: iconSize || [25, 41],
        iconAnchor: iconAnchor || [12, 41],
        popupAnchor: [1, -34],
      });
    }

    const marker = L.marker([lat, lng], markerOptions);

    if (popup) marker.bindPopup(popup);
    if (tooltip) marker.bindTooltip(tooltip);

    if (draggable) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        this.sendEvent('marker_dragend', { id, lngLat: [pos.lng, pos.lat] });
      });
    }

    marker.addTo(this.map);
    this.markersMap.set(id, marker);
  }

  private handleAddMarkers(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const data = kwargs.data as Array<Record<string, unknown>>;
    const name = (kwargs.name as string) || `markers-${Date.now()}`;

    const markerGroup = L.layerGroup();

    for (const item of data) {
      const lng = item.lng as number;
      const lat = item.lat as number;
      const popup = item.popup as string | undefined;
      const tooltip = item.tooltip as string | undefined;
      const iconUrl = item.iconUrl as string | undefined;
      const iconSize = item.iconSize as [number, number] | undefined;

      const opts: L.MarkerOptions = {};
      if (iconUrl) {
        opts.icon = L.icon({
          iconUrl,
          iconSize: iconSize || [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      }

      const marker = L.marker([lat, lng], opts);
      if (popup) marker.bindPopup(popup);
      if (tooltip) marker.bindTooltip(tooltip);
      markerGroup.addLayer(marker);
    }

    markerGroup.addTo(this.map);
    this.layersMap.set(name, markerGroup);

    if (this.layerControl) {
      this.layerControl.addOverlay(markerGroup, name);
    }
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
  // Shape handlers (circles, polylines, polygons, rectangles)
  // -------------------------------------------------------------------------

  private handleAddCircleMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const name = (kwargs.name as string) || `circle-marker-${Date.now()}`;
    const radius = (kwargs.radius as number) || 10;
    const color = (kwargs.color as string) || '#3388ff';
    const fillColor = (kwargs.fillColor as string) || color;
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.5;
    const weight = (kwargs.weight as number) || 2;
    const opacity = (kwargs.opacity as number) ?? 1;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;

    const cm = L.circleMarker([lat, lng], {
      radius, color, fillColor, fillOpacity, weight, opacity,
    });

    if (popup) cm.bindPopup(popup);
    if (tooltip) cm.bindTooltip(tooltip);

    cm.addTo(this.map);
    this.layersMap.set(name, cm);

    if (this.layerControl) {
      this.layerControl.addOverlay(cm, name);
    }
  }

  private handleAddCircle(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const name = (kwargs.name as string) || `circle-${Date.now()}`;
    const radius = (kwargs.radius as number) || 1000;
    const color = (kwargs.color as string) || '#3388ff';
    const fillColor = (kwargs.fillColor as string) || color;
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.2;
    const weight = (kwargs.weight as number) || 2;
    const opacity = (kwargs.opacity as number) ?? 1;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;

    const circle = L.circle([lat, lng], {
      radius, color, fillColor, fillOpacity, weight, opacity,
    });

    if (popup) circle.bindPopup(popup);
    if (tooltip) circle.bindTooltip(tooltip);

    circle.addTo(this.map);
    this.layersMap.set(name, circle);

    if (this.layerControl) {
      this.layerControl.addOverlay(circle, name);
    }
  }

  private handleAddPolyline(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const coords = kwargs.coordinates as number[][];
    const name = (kwargs.name as string) || `polyline-${Date.now()}`;
    const color = (kwargs.color as string) || '#3388ff';
    const weight = (kwargs.weight as number) || 3;
    const opacity = (kwargs.opacity as number) ?? 1;
    const dashArray = kwargs.dashArray as string | undefined;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;
    const fitBounds = kwargs.fitBounds as boolean | undefined;

    const latLngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);
    const opts: L.PolylineOptions = { color, weight, opacity };
    if (dashArray) opts.dashArray = dashArray;

    const polyline = L.polyline(latLngs, opts);

    if (popup) polyline.bindPopup(popup);
    if (tooltip) polyline.bindTooltip(tooltip);

    polyline.addTo(this.map);
    this.layersMap.set(name, polyline);

    if (fitBounds) {
      this.map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    if (this.layerControl) {
      this.layerControl.addOverlay(polyline, name);
    }
  }

  private handleAddPolygon(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const coords = kwargs.coordinates as number[][];
    const name = (kwargs.name as string) || `polygon-${Date.now()}`;
    const color = (kwargs.color as string) || '#3388ff';
    const fillColor = (kwargs.fillColor as string) || color;
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.5;
    const weight = (kwargs.weight as number) || 2;
    const opacity = (kwargs.opacity as number) ?? 1;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;
    const fitBounds = kwargs.fitBounds as boolean | undefined;

    const latLngs = coords.map(([lng, lat]) => [lat, lng] as [number, number]);

    const polygon = L.polygon(latLngs, { color, fillColor, fillOpacity, weight, opacity });

    if (popup) polygon.bindPopup(popup);
    if (tooltip) polygon.bindTooltip(tooltip);

    polygon.addTo(this.map);
    this.layersMap.set(name, polygon);

    if (fitBounds) {
      this.map.fitBounds(polygon.getBounds(), { padding: [50, 50] });
    }

    if (this.layerControl) {
      this.layerControl.addOverlay(polygon, name);
    }
  }

  private handleAddRectangle(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const bounds = kwargs.bounds as [number, number, number, number];
    const name = (kwargs.name as string) || `rectangle-${Date.now()}`;
    const color = (kwargs.color as string) || '#3388ff';
    const fillColor = (kwargs.fillColor as string) || color;
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.2;
    const weight = (kwargs.weight as number) || 2;
    const opacity = (kwargs.opacity as number) ?? 1;
    const popup = kwargs.popup as string | undefined;
    const tooltip = kwargs.tooltip as string | undefined;

    const leafletBounds = L.latLngBounds(
      [bounds[1], bounds[0]],
      [bounds[3], bounds[2]]
    );

    const rect = L.rectangle(leafletBounds, { color, fillColor, fillOpacity, weight, opacity });

    if (popup) rect.bindPopup(popup);
    if (tooltip) rect.bindTooltip(tooltip);

    rect.addTo(this.map);
    this.layersMap.set(name, rect);

    if (this.layerControl) {
      this.layerControl.addOverlay(rect, name);
    }
  }

  // -------------------------------------------------------------------------
  // Image & Video overlay handlers
  // -------------------------------------------------------------------------

  private handleAddImageOverlay(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [url] = args as [string];
    const bounds = kwargs.bounds as [number, number, number, number];
    const name = (kwargs.name as string) || `image-${Date.now()}`;
    const opacity = (kwargs.opacity as number) ?? 1;
    const interactive = kwargs.interactive as boolean | undefined;

    const leafletBounds = L.latLngBounds(
      [bounds[1], bounds[0]],
      [bounds[3], bounds[2]]
    );

    const imageOverlay = L.imageOverlay(url, leafletBounds, {
      opacity,
      interactive: interactive || false,
    });

    imageOverlay.addTo(this.map);
    this.layersMap.set(name, imageOverlay);

    if (this.layerControl) {
      this.layerControl.addOverlay(imageOverlay, name);
    }
  }

  private handleAddVideoOverlay(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const urls = kwargs.url as string | string[];
    const bounds = kwargs.bounds as [number, number, number, number];
    const name = (kwargs.name as string) || `video-${Date.now()}`;
    const opacity = (kwargs.opacity as number) ?? 1;
    const autoplay = kwargs.autoplay !== false;
    const loop = kwargs.loop !== false;
    const muted = kwargs.muted !== false;

    const leafletBounds = L.latLngBounds(
      [bounds[1], bounds[0]],
      [bounds[3], bounds[2]]
    );

    const videoOverlay = L.videoOverlay(urls as string, leafletBounds, {
      opacity,
      autoplay,
      loop,
      muted,
    });

    videoOverlay.addTo(this.map);
    this.layersMap.set(name, videoOverlay);

    if (this.layerControl) {
      this.layerControl.addOverlay(videoOverlay, name);
    }
  }

  // -------------------------------------------------------------------------
  // Heatmap handlers (via leaflet.heat)
  // -------------------------------------------------------------------------

  private handleAddHeatmap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const data = kwargs.data as number[][];
    const name = (kwargs.name as string) || `heatmap-${Date.now()}`;
    const radius = (kwargs.radius as number) || 25;
    const blur = (kwargs.blur as number) || 15;
    const maxZoom = (kwargs.maxZoom as number) || 18;
    const max = (kwargs.max as number) || 1.0;
    const minOpacity = (kwargs.minOpacity as number) || 0.05;
    const gradient = kwargs.gradient as Record<string, string> | undefined;

    // leaflet.heat expects [lat, lng, intensity] arrays
    const heatData = data.map((point) => {
      if (point.length >= 3) {
        return [point[1], point[0], point[2]];
      }
      return [point[1], point[0]];
    });

    const options: Record<string, unknown> = {
      radius,
      blur,
      maxZoom,
      max,
      minOpacity,
    };
    if (gradient) options.gradient = gradient;

    // @ts-ignore - L.heatLayer is added by leaflet.heat plugin
    const heatLayer = (L as any).heatLayer(heatData, options);
    heatLayer.addTo(this.map);
    this.layersMap.set(name, heatLayer);

    if (this.layerControl) {
      this.layerControl.addOverlay(heatLayer, name);
    }
  }

  private handleRemoveHeatmap(args: unknown[], kwargs: Record<string, unknown>): void {
    this.handleRemoveLayer(args, kwargs);
  }

  // -------------------------------------------------------------------------
  // Choropleth handler
  // -------------------------------------------------------------------------

  private handleAddChoropleth(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const geojson = kwargs.data as FeatureCollection;
    const name = (kwargs.name as string) || `choropleth-${Date.now()}`;
    const valueProperty = kwargs.valueProperty as string;
    const colors = kwargs.colors as string[];
    const thresholds = kwargs.thresholds as number[];
    const fillOpacity = (kwargs.fillOpacity as number) ?? 0.7;
    const lineColor = (kwargs.lineColor as string) || '#ffffff';
    const lineWeight = (kwargs.lineWeight as number) || 2;
    const lineOpacity = (kwargs.lineOpacity as number) ?? 1;
    const popupProperties = kwargs.popupProperties as string[] | boolean | undefined;
    const tooltipProperty = kwargs.tooltipProperty as string | undefined;
    const fitBounds = kwargs.fitBounds !== false;
    const legendTitle = kwargs.legendTitle as string | undefined;
    const legendPosition = kwargs.legendPosition as string | undefined;

    const getColor = (value: number): string => {
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (value >= thresholds[i]) return colors[i + 1] || colors[colors.length - 1];
      }
      return colors[0];
    };

    const choroplethLayer = L.geoJSON(geojson as any, {
      style: (feature: any) => {
        const value = feature?.properties?.[valueProperty] ?? 0;
        return {
          fillColor: getColor(value),
          weight: lineWeight,
          opacity: lineOpacity,
          color: lineColor,
          fillOpacity,
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const props = feature.properties || {};

        if (popupProperties) {
          let html = '<div class="anymap-popup">';
          const keys = popupProperties === true ? Object.keys(props) : popupProperties;
          for (const key of keys) {
            if (props[key] !== undefined && props[key] !== null) {
              html += `<b>${key}:</b> ${props[key]}<br>`;
            }
          }
          html += '</div>';
          layer.bindPopup(html);
        }

        if (tooltipProperty && props[tooltipProperty] !== undefined) {
          layer.bindTooltip(String(props[tooltipProperty]), { sticky: true });
        }

        // Highlight on hover
        (layer as any).on({
          mouseover: (e: any) => {
            const target = e.target;
            target.setStyle({
              weight: lineWeight + 2,
              fillOpacity: Math.min(fillOpacity + 0.2, 1),
            });
            target.bringToFront();
          },
          mouseout: (e: any) => {
            choroplethLayer.resetStyle(e.target);
          },
        });
      },
    });

    choroplethLayer.addTo(this.map);
    this.layersMap.set(name, choroplethLayer);

    if (fitBounds) {
      const layerBounds = choroplethLayer.getBounds();
      if (layerBounds.isValid()) {
        this.map.fitBounds(layerBounds, { padding: [50, 50] });
      }
    }

    if (this.layerControl) {
      this.layerControl.addOverlay(choroplethLayer, name);
    }

    if (legendTitle && colors && thresholds) {
      this.createChoroplethLegend(name, legendTitle, colors, thresholds, legendPosition || 'bottomright');
    }
  }

  private createChoroplethLegend(
    name: string,
    title: string,
    colors: string[],
    thresholds: number[],
    position: string,
  ): void {
    if (!this.map) return;

    const LegendControl = L.Control.extend({
      options: { position: this.convertPosition(position) },
      onAdd: () => {
        const div = L.DomUtil.create('div', 'anymap-legend');

        let html = `<div style="font-weight:bold;margin-bottom:6px">${title}</div>`;
        const numBins = thresholds.length + 1;
        for (let i = 0; i < numBins; i++) {
          const color = colors[i] || colors[colors.length - 1];
          const label = i === 0
            ? `< ${thresholds[0]}`
            : i < thresholds.length
              ? `${thresholds[i - 1]} – ${thresholds[i]}`
              : `≥ ${thresholds[thresholds.length - 1]}`;
          html += `<div style="display:flex;align-items:center;margin:2px 0"><span style="width:18px;height:12px;display:inline-block;background:${color};margin-right:6px;border-radius:2px"></span>${label}</div>`;
        }
        div.innerHTML = html;
        return div;
      },
    });

    const legend = new LegendControl();
    legend.addTo(this.map);
    this.controlsMap.set(`legend-${name}`, legend);
  }

  // -------------------------------------------------------------------------
  // Popup handlers
  // -------------------------------------------------------------------------

  private handleAddPopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [lng, lat] = args as [number, number];
    const content = kwargs.content as string;
    const id = (kwargs.id as string) || `popup-${Date.now()}`;
    const maxWidth = (kwargs.maxWidth as number) || 300;
    const closeButton = kwargs.closeButton !== false;

    const popup = L.popup({
      maxWidth,
      closeButton,
    })
      .setLatLng([lat, lng])
      .setContent(content)
      .openOn(this.map);

    this.popupsMap.set(id, popup);
  }

  private handleRemovePopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [id] = args as [string];

    const popup = this.popupsMap.get(id);
    if (popup) {
      this.map.closePopup(popup);
      this.popupsMap.delete(id);
    }
  }

  // -------------------------------------------------------------------------
  // Legend handlers
  // -------------------------------------------------------------------------

  private handleAddLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const name = (kwargs.name as string) || 'legend';
    const title = kwargs.title as string;
    const items = kwargs.items as Array<{ color: string; label: string }>;
    const position = (kwargs.position as string) || 'bottomright';

    const LegendControl = L.Control.extend({
      options: { position: this.convertPosition(position) },
      onAdd: () => {
        const div = L.DomUtil.create('div', 'anymap-legend');

        let html = title ? `<div style="font-weight:bold;margin-bottom:6px">${title}</div>` : '';
        for (const item of items) {
          html += `<div style="display:flex;align-items:center;margin:2px 0"><span style="width:18px;height:12px;display:inline-block;background:${item.color};margin-right:6px;border-radius:2px"></span>${item.label}</div>`;
        }
        div.innerHTML = html;
        return div;
      },
    });

    const legend = new LegendControl();
    legend.addTo(this.map);
    this.controlsMap.set(`legend-${name}`, legend);
  }

  private handleRemoveLegend(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [name] = args as [string];
    const key = `legend-${name}`;

    const control = this.controlsMap.get(key);
    if (control) {
      this.map.removeControl(control);
      this.controlsMap.delete(key);
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
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    this.removeModelListeners();

    if (this.resizeDebounceTimer !== null) {
      window.clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

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
    this.layerControl = null;

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
