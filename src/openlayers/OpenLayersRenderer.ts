/**
 * OpenLayers renderer implementation.
 */

import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from 'ol/style';
import { Zoom, ScaleLine, FullScreen, Attribution, Rotate, MousePosition } from 'ol/control';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions, DragRotateAndZoom } from 'ol/interaction';
import { createStringXY } from 'ol/coordinate';

import { BaseMapRenderer } from '../core/BaseMapRenderer';
import type { MapWidgetModel, JsCallMessage } from '../types/anywidget';

import 'ol/ol.css';

type MethodHandler = (args: unknown[], kwargs: Record<string, unknown>) => void;

/**
 * OpenLayers map renderer.
 */
export class OpenLayersRenderer extends BaseMapRenderer {
  protected map: Map | null = null;
  private methodHandlers: Record<string, MethodHandler> = {};
  private layersMap: Map<string, TileLayer<any> | VectorLayer<any> | ImageLayer<any>> = new Map();
  private controlsMap: Map<string, any> = new Map();

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.registerDefaultMethods();
  }

  /**
   * Register a method handler.
   */
  protected registerMethod(name: string, handler: MethodHandler): void {
    this.methodHandlers[name] = handler;
  }

  /**
   * Register default method handlers.
   */
  private registerDefaultMethods(): void {
    // Basemap
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));

    // Tile layers
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));

    // Vector data
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));

    // WMS/WMTS
    this.registerMethod('addWMSLayer', this.handleAddWMSLayer.bind(this));
    this.registerMethod('addImageWMSLayer', this.handleAddImageWMSLayer.bind(this));

    // Layer management
    this.registerMethod('removeLayer', this.handleRemoveLayer.bind(this));
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));

    // Controls
    this.registerMethod('addControl', this.handleAddControl.bind(this));
    this.registerMethod('removeControl', this.handleRemoveControl.bind(this));

    // Navigation
    this.registerMethod('setCenter', this.handleSetCenter.bind(this));
    this.registerMethod('setZoom', this.handleSetZoom.bind(this));
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('fitBounds', this.handleFitBounds.bind(this));
    this.registerMethod('fitExtent', this.handleFitExtent.bind(this));

    // Markers
    this.registerMethod('addMarker', this.handleAddMarker.bind(this));
  }

  /**
   * Initialize the OpenLayers map.
   */
  async initialize(): Promise<void> {
    const center = this.model.get('center') as [number, number] || [0, 0];
    const zoom = this.model.get('zoom') as number || 2;

    // Create map container
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    this.el.appendChild(container);

    // Create map
    this.map = new Map({
      target: container,
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
      }),
      controls: defaultControls({ attribution: false }),
      interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    });

    // Process any pending JS calls
    const jsCalls = this.model.get('_js_calls') as JsCallMessage[];
    if (jsCalls && jsCalls.length > 0) {
      for (const call of jsCalls) {
        await this.executeMethod(call);
      }
    }

    // Listen for model changes
    this.model.on('change:_js_calls', () => {
      this.handleJsCallsChange();
    });

    this.model.on('change:center', () => {
      const newCenter = this.model.get('center') as [number, number];
      if (this.map) {
        this.map.getView().setCenter(fromLonLat(newCenter));
      }
    });

    this.model.on('change:zoom', () => {
      const newZoom = this.model.get('zoom') as number;
      if (this.map) {
        this.map.getView().setZoom(newZoom);
      }
    });

    // Sync view changes back to model
    this.map.getView().on('change:center', () => {
      if (this.map) {
        const center = toLonLat(this.map.getView().getCenter() || [0, 0]);
        this.model.set('center', center);
        this.model.save_changes();
      }
    });

    this.map.getView().on('change:resolution', () => {
      if (this.map) {
        const zoom = this.map.getView().getZoom();
        this.model.set('zoom', zoom);
        this.model.save_changes();
      }
    });
  }

  /**
   * Handle JS calls change.
   */
  private handleJsCallsChange(): void {
    const jsCalls = this.model.get('_js_calls') as JsCallMessage[];
    if (jsCalls && jsCalls.length > 0) {
      const lastCall = jsCalls[jsCalls.length - 1];
      this.executeMethod(lastCall);
    }
  }

  /**
   * Execute a method from Python.
   */
  private async executeMethod(call: JsCallMessage): Promise<void> {
    const { method, args, kwargs } = call;
    const handler = this.methodHandlers[method];

    if (handler) {
      try {
        handler(args, kwargs);
      } catch (error) {
        console.error(`Error executing method ${method}:`, error);
      }
    } else {
      console.warn(`Unknown method: ${method}`);
    }
  }

  // -------------------------------------------------------------------------
  // Basemap Handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = args[0] as string;
    const name = kwargs.name as string || 'basemap';
    const attribution = kwargs.attribution as string || '';

    // Remove existing basemap if any
    const existingBasemap = this.layersMap.get('basemap-' + name);
    if (existingBasemap) {
      this.map.removeLayer(existingBasemap);
    }

    const layer = new TileLayer({
      source: new XYZ({
        url: url,
        attributions: attribution ? [attribution] : undefined,
      }),
      zIndex: 0,
    });

    this.map.getLayers().insertAt(0, layer);
    this.layersMap.set('basemap-' + name, layer);
  }

  // -------------------------------------------------------------------------
  // Tile Layer Handlers
  // -------------------------------------------------------------------------

  private handleAddTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = args[0] as string;
    const name = kwargs.name as string || `tiles-${this.layersMap.size}`;
    const attribution = kwargs.attribution as string || '';
    const opacity = kwargs.opacity as number ?? 1;
    const minZoom = kwargs.minZoom as number ?? 0;
    const maxZoom = kwargs.maxZoom as number ?? 22;

    const layer = new TileLayer({
      source: new XYZ({
        url: url,
        attributions: attribution ? [attribution] : undefined,
        minZoom: minZoom,
        maxZoom: maxZoom,
      }),
      opacity: opacity,
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
  }

  // -------------------------------------------------------------------------
  // Vector Layer Handlers
  // -------------------------------------------------------------------------

  private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `geojson-${this.layersMap.size}`;
    const fitBounds = kwargs.fitBounds !== false;
    const style = kwargs.style as Record<string, unknown> || {};

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(data, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.createVectorStyle(style),
    });

    this.map.addLayer(vectorLayer);
    this.layersMap.set(name, vectorLayer);

    if (fitBounds) {
      const extent = vectorSource.getExtent();
      this.map.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 500,
      });
    }
  }

  private createVectorStyle(styleConfig: Record<string, unknown>): Style {
    const fill = new Fill({
      color: styleConfig.fillColor as string || 'rgba(51, 136, 255, 0.5)',
    });

    const stroke = new Stroke({
      color: styleConfig.strokeColor as string || '#3388ff',
      width: styleConfig.strokeWidth as number ?? 2,
    });

    const circle = new CircleStyle({
      radius: styleConfig.radius as number ?? 6,
      fill: fill,
      stroke: stroke,
    });

    return new Style({
      fill: fill,
      stroke: stroke,
      image: circle,
    });
  }

  // -------------------------------------------------------------------------
  // WMS Layer Handlers
  // -------------------------------------------------------------------------

  private handleAddWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `wms-${this.layersMap.size}`;
    const layers = kwargs.layers as string;
    const format = kwargs.format as string || 'image/png';
    const transparent = kwargs.transparent !== false;
    const attribution = kwargs.attribution as string || '';

    const layer = new TileLayer({
      source: new TileWMS({
        url: url,
        params: {
          LAYERS: layers,
          FORMAT: format,
          TRANSPARENT: transparent,
        },
        serverType: kwargs.serverType as any || undefined,
        attributions: attribution ? [attribution] : undefined,
      }),
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
  }

  private handleAddImageWMSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `imagewms-${this.layersMap.size}`;
    const layers = kwargs.layers as string;
    const format = kwargs.format as string || 'image/png';
    const transparent = kwargs.transparent !== false;
    const attribution = kwargs.attribution as string || '';

    const layer = new ImageLayer({
      source: new ImageWMS({
        url: url,
        params: {
          LAYERS: layers,
          FORMAT: format,
          TRANSPARENT: transparent,
        },
        serverType: kwargs.serverType as any || undefined,
        attributions: attribution ? [attribution] : undefined,
      }),
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
  }

  // -------------------------------------------------------------------------
  // Layer Management Handlers
  // -------------------------------------------------------------------------

  private handleRemoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [layerId] = args as [string];
    const layer = this.layersMap.get(layerId);

    if (layer) {
      this.map.removeLayer(layer);
      this.layersMap.delete(layerId);
    }
  }

  private handleSetVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId, visible] = args as [string, boolean];
    const layer = this.layersMap.get(layerId);

    if (layer) {
      layer.setVisible(visible);
    }
  }

  private handleSetOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId, opacity] = args as [string, number];
    const layer = this.layersMap.get(layerId);

    if (layer) {
      layer.setOpacity(opacity);
    }
  }

  // -------------------------------------------------------------------------
  // Control Handlers
  // -------------------------------------------------------------------------

  private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const controlType = args[0] as string;
    const position = kwargs.position as string || 'top-right';

    let control: any;

    switch (controlType) {
      case 'zoom':
      case 'navigation':
        control = new Zoom();
        break;
      case 'scale':
        control = new ScaleLine({
          units: kwargs.units as any || 'metric',
        });
        break;
      case 'fullscreen':
        control = new FullScreen();
        break;
      case 'attribution':
        control = new Attribution({
          collapsible: kwargs.collapsible !== false,
        });
        break;
      case 'rotate':
        control = new Rotate({
          autoHide: kwargs.autoHide !== false,
        });
        break;
      case 'mousePosition':
        control = new MousePosition({
          coordinateFormat: createStringXY(4),
          projection: 'EPSG:4326',
        });
        break;
    }

    if (control) {
      this.map.addControl(control);
      this.controlsMap.set(controlType, control);
    }
  }

  private handleRemoveControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [controlType] = args as [string];
    const control = this.controlsMap.get(controlType);

    if (control) {
      this.map.removeControl(control);
      this.controlsMap.delete(controlType);
    }
  }

  // -------------------------------------------------------------------------
  // Navigation Handlers
  // -------------------------------------------------------------------------

  private handleSetCenter(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [lng, lat] = args as [number, number];
    this.map.getView().setCenter(fromLonLat([lng, lat]));
  }

  private handleSetZoom(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [zoom] = args as [number];
    this.map.getView().setZoom(zoom);
  }

  private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [lng, lat] = args as [number, number];
    const zoom = kwargs.zoom as number;
    const duration = kwargs.duration as number || 2000;

    this.map.getView().animate({
      center: fromLonLat([lng, lat]),
      zoom: zoom,
      duration: duration,
    });
  }

  private handleFitBounds(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const bounds = args[0] as [number, number, number, number];
    const padding = kwargs.padding as number || 50;
    const duration = kwargs.duration as number || 1000;

    // bounds: [minLng, minLat, maxLng, maxLat]
    const extent = transformExtent(
      [bounds[0], bounds[1], bounds[2], bounds[3]],
      'EPSG:4326',
      'EPSG:3857'
    );

    this.map.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: duration,
    });
  }

  private handleFitExtent(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const extent = args[0] as [number, number, number, number];
    const padding = kwargs.padding as number || 50;
    const duration = kwargs.duration as number || 1000;

    this.map.getView().fit(extent, {
      padding: [padding, padding, padding, padding],
      duration: duration,
    });
  }

  // -------------------------------------------------------------------------
  // Marker Handler
  // -------------------------------------------------------------------------

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [lng, lat] = args as [number, number];
    const name = kwargs.id as string || kwargs.name as string || `marker-${this.layersMap.size}`;
    const popup = kwargs.popup as string;
    const color = kwargs.color as string || '#3388ff';

    // Create a vector source with a point feature
    const feature = new GeoJSON().readFeature({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        popup: popup,
      },
    }, {
      featureProjection: 'EPSG:3857',
    });

    const vectorSource = new VectorSource({
      features: [feature],
    });

    const markerStyle = new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: markerStyle,
    });

    this.map.addLayer(vectorLayer);
    this.layersMap.set(name, vectorLayer);
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
    }
    this.layersMap.clear();
    this.controlsMap.clear();
    super.destroy();
  }
}
