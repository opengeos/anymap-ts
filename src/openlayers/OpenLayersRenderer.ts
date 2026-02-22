/**
 * OpenLayers renderer implementation with comprehensive feature support.
 */

import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import ImageLayer from 'ol/layer/Image';
import HeatmapLayer from 'ol/layer/Heatmap';
import VectorTileLayer from 'ol/layer/VectorTile';
import LayerGroup from 'ol/layer/Group';
import XYZ from 'ol/source/XYZ';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import ImageWMS from 'ol/source/ImageWMS';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import Cluster from 'ol/source/Cluster';
import ImageStatic from 'ol/source/ImageStatic';
import GeoJSON from 'ol/format/GeoJSON';
import MVT from 'ol/format/MVT';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text, RegularShape } from 'ol/style';
import {
  Zoom, ScaleLine, FullScreen, Attribution, Rotate,
  MousePosition, OverviewMap, ZoomSlider, ZoomToExtent,
} from 'ol/control';
import { defaults as defaultControls } from 'ol/control';
import { defaults as defaultInteractions, DragRotateAndZoom, Select, Draw, Modify, Snap } from 'ol/interaction';
import { createStringXY } from 'ol/coordinate';
import Overlay from 'ol/Overlay';
import Graticule from 'ol/layer/Graticule';
import { getTopLeft, getWidth } from 'ol/extent';
import { get as getProjection } from 'ol/proj';
import { click, pointerMove } from 'ol/events/condition';

import { BaseMapRenderer } from '../core/BaseMapRenderer';
import { StateManager } from '../core/StateManager';
import type { MapWidgetModel, JsCall } from '../types/anywidget';

import 'ol/ol.css';

type OLMap = Map;

/**
 * OpenLayers map renderer with comprehensive feature support.
 */
export class OpenLayersRenderer extends BaseMapRenderer<OLMap> {
  private stateManager: StateManager;
  private layersMap: globalThis.Map<string, TileLayer<any> | VectorLayer<any> | ImageLayer<any> | HeatmapLayer | VectorTileLayer | Graticule | LayerGroup> = new globalThis.Map();
  private controlsMap: globalThis.Map<string, any> = new globalThis.Map();
  private markersMap: globalThis.Map<string, VectorLayer<any>> = new globalThis.Map();
  private overlaysMap: globalThis.Map<string, Overlay> = new globalThis.Map();
  private interactionsMap: globalThis.Map<string, any> = new globalThis.Map();
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceTimer: number | null = null;
  private isSyncingFromView: boolean = false;
  private popupElement: HTMLDivElement | null = null;
  private popupCloser: HTMLAnchorElement | null = null;
  private popupContent: HTMLDivElement | null = null;
  private popupOverlay: Overlay | null = null;
  private measureTooltipElement: HTMLDivElement | null = null;
  private measureTooltip: Overlay | null = null;
  private drawSource: VectorSource | null = null;
  private drawLayer: VectorLayer<any> | null = null;
  private measureSource: VectorSource | null = null;
  private measureLayer: VectorLayer<any> | null = null;
  private layerControlElement: HTMLDivElement | null = null;

  constructor(model: MapWidgetModel, el: HTMLElement) {
    super(model, el);
    this.stateManager = new StateManager(model);
    this.registerMethods();
  }

  private registerMethods(): void {
    // Basemap
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));

    // Tile layers
    this.registerMethod('addTileLayer', this.handleAddTileLayer.bind(this));

    // Vector data
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));
    this.registerMethod('addGeoJSONFromURL', this.handleAddGeoJSONFromURL.bind(this));

    // WMS/WMTS
    this.registerMethod('addWMSLayer', this.handleAddWMSLayer.bind(this));
    this.registerMethod('addImageWMSLayer', this.handleAddImageWMSLayer.bind(this));
    this.registerMethod('addWMTSLayer', this.handleAddWMTSLayer.bind(this));

    // Heatmap
    this.registerMethod('addHeatmap', this.handleAddHeatmap.bind(this));

    // Clustering
    this.registerMethod('addClusterLayer', this.handleAddClusterLayer.bind(this));
    this.registerMethod('removeClusterLayer', this.handleRemoveClusterLayer.bind(this));

    // Vector tiles
    this.registerMethod('addVectorTileLayer', this.handleAddVectorTileLayer.bind(this));

    // Image overlay
    this.registerMethod('addImageLayer', this.handleAddImageLayer.bind(this));

    // Choropleth
    this.registerMethod('addChoropleth', this.handleAddChoropleth.bind(this));

    // Layer management
    this.registerMethod('removeLayer', this.handleRemoveLayer.bind(this));
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));
    this.registerMethod('setLayerStyle', this.handleSetLayerStyle.bind(this));
    this.registerMethod('setLayerZIndex', this.handleSetLayerZIndex.bind(this));

    // Controls
    this.registerMethod('addControl', this.handleAddControl.bind(this));
    this.registerMethod('removeControl', this.handleRemoveControl.bind(this));
    this.registerMethod('addLayerControl', this.handleAddLayerControl.bind(this));
    this.registerMethod('removeLayerControl', this.handleRemoveLayerControl.bind(this));

    // Navigation
    this.registerMethod('setCenter', this.handleSetCenter.bind(this));
    this.registerMethod('setZoom', this.handleSetZoom.bind(this));
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('fitBounds', this.handleFitBounds.bind(this));
    this.registerMethod('fitExtent', this.handleFitExtent.bind(this));
    this.registerMethod('setRotation', this.handleSetRotation.bind(this));

    // Markers
    this.registerMethod('addMarker', this.handleAddMarker.bind(this));
    this.registerMethod('removeMarker', this.handleRemoveMarker.bind(this));

    // Popups / Overlays
    this.registerMethod('addPopup', this.handleAddPopup.bind(this));
    this.registerMethod('removePopup', this.handleRemovePopup.bind(this));
    this.registerMethod('showPopup', this.handleShowPopup.bind(this));

    // Draw interaction
    this.registerMethod('addDrawControl', this.handleAddDrawControl.bind(this));
    this.registerMethod('removeDrawControl', this.handleRemoveDrawControl.bind(this));
    this.registerMethod('clearDrawData', this.handleClearDrawData.bind(this));

    // Measure
    this.registerMethod('addMeasureControl', this.handleAddMeasureControl.bind(this));
    this.registerMethod('removeMeasureControl', this.handleRemoveMeasureControl.bind(this));

    // Select interaction
    this.registerMethod('addSelectInteraction', this.handleAddSelectInteraction.bind(this));
    this.registerMethod('removeSelectInteraction', this.handleRemoveSelectInteraction.bind(this));

    // Graticule
    this.registerMethod('addGraticule', this.handleAddGraticule.bind(this));
    this.registerMethod('removeGraticule', this.handleRemoveGraticule.bind(this));
  }

  // =========================================================================
  // Initialization
  // =========================================================================

  async initialize(): Promise<void> {
    this.createMapContainer();

    this.map = this.createMap();
    this.createPopupOverlay();

    this.setupModelListeners();
    this.setupMapEvents();
    this.setupResizeObserver();

    this.processJsCalls();
    this.isMapReady = true;
    this.processPendingCalls();
  }

  protected createMap(): OLMap {
    const center = this.model.get('center') as [number, number] || [0, 0];
    const zoom = this.model.get('zoom') as number || 2;

    return new Map({
      target: this.mapContainer!,
      view: new View({
        center: fromLonLat(center),
        zoom: zoom,
      }),
      controls: [],
      interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    });
  }

  private setupMapEvents(): void {
    if (!this.map) return;

    this.map.on('click', (evt) => {
      const coordinate = toLonLat(evt.coordinate);
      this.model.set('clicked', {
        lng: coordinate[0],
        lat: coordinate[1],
        point: [evt.pixel[0], evt.pixel[1]],
      });
      this.sendEvent('click', {
        lngLat: coordinate,
        point: evt.pixel,
      });
      this.model.save_changes();

      // Show feature info popup if click is on a feature
      const features: any[] = [];
      this.map!.forEachFeatureAtPixel(evt.pixel, (feature) => {
        features.push(feature);
      });
      if (features.length > 0) {
        const props = features[0].getProperties();
        delete props.geometry;
        this.sendEvent('featureClick', {
          properties: props,
          lngLat: coordinate,
        });
      }
    });

    this.map.getView().on('change:center', () => {
      if (this.map && !this.isSyncingFromView) {
        this.isSyncingFromView = true;
        const center = toLonLat(this.map.getView().getCenter() || [0, 0]);
        this.model.set('center', center);
        this.model.set('current_center', center);
        this.model.save_changes();
        this.isSyncingFromView = false;
      }
    });

    this.map.getView().on('change:resolution', () => {
      if (this.map && !this.isSyncingFromView) {
        this.isSyncingFromView = true;
        const zoom = this.map.getView().getZoom() || 0;
        this.model.set('zoom', zoom);
        this.model.set('current_zoom', zoom);
        this.model.save_changes();
        this.isSyncingFromView = false;
      }
    });

    this.map.on('moveend', () => {
      if (!this.map) return;
      const view = this.map.getView();
      const extent = view.calculateExtent(this.map.getSize());
      const bounds = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      this.model.set('current_bounds', [bounds[0], bounds[1], bounds[2], bounds[3]]);
      this.sendEvent('moveend', {
        center: toLonLat(view.getCenter() || [0, 0]),
        zoom: view.getZoom(),
        bounds: bounds,
      });
      this.model.save_changes();
    });
  }

  private setupResizeObserver(): void {
    if (!this.mapContainer || !this.map) return;

    this.resizeObserver = new ResizeObserver(() => {
      if (this.resizeDebounceTimer !== null) {
        window.clearTimeout(this.resizeDebounceTimer);
      }
      this.resizeDebounceTimer = window.setTimeout(() => {
        if (this.map) {
          this.map.updateSize();
        }
        this.resizeDebounceTimer = null;
      }, 100);
    });

    this.resizeObserver.observe(this.mapContainer);
    this.resizeObserver.observe(this.el);
  }

  private createPopupOverlay(): void {
    if (!this.map) return;

    this.popupElement = document.createElement('div');
    this.popupElement.className = 'ol-popup';
    this.popupElement.style.cssText = `
      position: absolute; background-color: white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      padding: 12px; border-radius: 8px; border: 1px solid #ccc; bottom: 12px;
      left: -50px; min-width: 200px; font-size: 13px; max-width: 300px; color: #333;
    `;

    this.popupCloser = document.createElement('a');
    this.popupCloser.href = '#';
    this.popupCloser.className = 'ol-popup-closer';
    this.popupCloser.style.cssText = `
      text-decoration: none; position: absolute; top: 4px; right: 8px;
      font-size: 16px; color: #999; cursor: pointer;
    `;
    this.popupCloser.textContent = '✕';
    this.popupElement.appendChild(this.popupCloser);

    this.popupContent = document.createElement('div');
    this.popupContent.className = 'ol-popup-content';
    this.popupElement.appendChild(this.popupContent);

    this.popupOverlay = new Overlay({
      element: this.popupElement,
      autoPan: {
        animation: { duration: 250 },
      },
    });

    this.popupCloser.onclick = () => {
      this.popupOverlay!.setPosition(undefined);
      this.popupCloser!.blur();
      return false;
    };

    this.map.addOverlay(this.popupOverlay);
  }

  // =========================================================================
  // Trait change handlers
  // =========================================================================

  protected onCenterChange(): void {
    if (this.isSyncingFromView) return;
    const newCenter = this.model.get('center') as [number, number];
    if (this.map) {
      this.map.getView().setCenter(fromLonLat(newCenter));
    }
  }

  protected onZoomChange(): void {
    if (this.isSyncingFromView) return;
    const newZoom = this.model.get('zoom') as number;
    if (this.map) {
      this.map.getView().setZoom(newZoom);
    }
  }

  protected onStyleChange(): void {
    // OpenLayers doesn't have a global style concept
  }

  // =========================================================================
  // Basemap
  // =========================================================================

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = args[0] as string;
    const name = kwargs.name as string || 'basemap';
    const attribution = kwargs.attribution as string || '';

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

  // =========================================================================
  // Tile Layer
  // =========================================================================

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
    this.updateLayerControl();
  }

  // =========================================================================
  // Vector / GeoJSON
  // =========================================================================

  private handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `geojson-${this.layersMap.size}`;
    const fitBounds = kwargs.fitBounds !== false;
    const style = kwargs.style as Record<string, unknown> || {};
    const popup = kwargs.popup as string | undefined;
    const popupProperties = kwargs.popupProperties as string[] | undefined;

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
    this.updateLayerControl();

    if (popup || popupProperties) {
      this.setupFeaturePopup(name, popup, popupProperties);
    }

    if (fitBounds) {
      const extent = vectorSource.getExtent();
      if (extent && extent.every(v => isFinite(v))) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500,
        });
      }
    }
  }

  private handleAddGeoJSONFromURL(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `geojson-url-${this.layersMap.size}`;
    const fitBounds = kwargs.fitBounds !== false;
    const style = kwargs.style as Record<string, unknown> || {};

    const vectorSource = new VectorSource({
      url: url,
      format: new GeoJSON(),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: this.createVectorStyle(style),
    });

    this.map.addLayer(vectorLayer);
    this.layersMap.set(name, vectorLayer);
    this.updateLayerControl();

    if (fitBounds) {
      vectorSource.once('change', () => {
        if (vectorSource.getState() === 'ready') {
          const extent = vectorSource.getExtent();
          if (extent && extent.every(v => isFinite(v)) && this.map) {
            this.map.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 500,
            });
          }
        }
      });
    }
  }

  private setupFeaturePopup(layerName: string, popup?: string, popupProperties?: string[]): void {
    if (!this.map) return;

    this.map.on('click', (evt) => {
      let featureFound = false;
      this.map!.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (featureFound) return;
        const olLayer = this.layersMap.get(layerName);
        if (layer === olLayer) {
          featureFound = true;
          const props = feature.getProperties();
          delete props.geometry;

          let content = '';
          if (popup) {
            content = popup;
            for (const [key, value] of Object.entries(props)) {
              content = content.replace(`{${key}}`, String(value));
            }
          } else if (popupProperties) {
            content = '<table style="border-collapse:collapse;">';
            for (const key of popupProperties) {
              if (props[key] !== undefined) {
                content += `<tr><td style="padding:2px 8px;font-weight:bold;">${key}</td><td style="padding:2px 8px;">${props[key]}</td></tr>`;
              }
            }
            content += '</table>';
          } else {
            content = '<table style="border-collapse:collapse;">';
            for (const [key, value] of Object.entries(props)) {
              content += `<tr><td style="padding:2px 8px;font-weight:bold;">${key}</td><td style="padding:2px 8px;">${value}</td></tr>`;
            }
            content += '</table>';
          }

          this.popupContent!.innerHTML = content;
          this.popupOverlay!.setPosition(evt.coordinate);
        }
      });
    });
  }

  private createVectorStyle(styleConfig: Record<string, unknown>): Style | ((feature: any) => Style) {
    if (styleConfig.styleFunction) {
      return styleConfig.styleFunction as (feature: any) => Style;
    }

    const fill = new Fill({
      color: styleConfig.fillColor as string || 'rgba(51, 136, 255, 0.5)',
    });

    const stroke = new Stroke({
      color: styleConfig.strokeColor as string || '#3388ff',
      width: styleConfig.strokeWidth as number ?? 2,
      lineDash: styleConfig.lineDash as number[] || undefined,
    });

    const circle = new CircleStyle({
      radius: styleConfig.radius as number ?? 6,
      fill: fill,
      stroke: stroke,
    });

    const options: any = {
      fill: fill,
      stroke: stroke,
      image: circle,
    };

    if (styleConfig.text) {
      options.text = new Text({
        text: styleConfig.text as string,
        fill: new Fill({ color: styleConfig.textColor as string || '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        font: styleConfig.font as string || '12px sans-serif',
        offsetY: styleConfig.textOffsetY as number || -15,
      });
    }

    return new Style(options);
  }

  // =========================================================================
  // Heatmap
  // =========================================================================

  private handleAddHeatmap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `heatmap-${this.layersMap.size}`;
    const blur = kwargs.blur as number ?? 15;
    const radius = kwargs.radius as number ?? 8;
    const weight = kwargs.weight as string || undefined;
    const gradient = kwargs.gradient as string[] || undefined;
    const opacity = kwargs.opacity as number ?? 0.8;
    const fitBounds = kwargs.fitBounds !== false;

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(data, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const heatmapLayer = new HeatmapLayer({
      source: vectorSource,
      blur: blur,
      radius: radius,
      opacity: opacity,
      weight: weight ? (feature: any) => {
        const val = feature.get(weight);
        return val !== undefined ? Number(val) : 1;
      } : undefined,
      gradient: gradient || undefined,
    });

    this.map.addLayer(heatmapLayer);
    this.layersMap.set(name, heatmapLayer);
    this.updateLayerControl();

    if (fitBounds) {
      const extent = vectorSource.getExtent();
      if (extent && extent.every(v => isFinite(v))) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500,
        });
      }
    }
  }

  // =========================================================================
  // Clustering
  // =========================================================================

  private handleAddClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `cluster-${this.layersMap.size}`;
    const distance = kwargs.distance as number ?? 40;
    const minDistance = kwargs.minDistance as number ?? 20;
    const fitBounds = kwargs.fitBounds !== false;
    const clusterColor = kwargs.clusterColor as string || 'rgba(51, 136, 255, 0.7)';
    const pointColor = kwargs.pointColor as string || 'rgba(51, 136, 255, 0.9)';
    const textColor = kwargs.textColor as string || '#fff';

    const features = new GeoJSON().readFeatures(data, {
      featureProjection: 'EPSG:3857',
    });

    const source = new VectorSource({ features });

    const clusterSource = new Cluster({
      distance: distance,
      minDistance: minDistance,
      source: source,
    });

    const styleCache: Record<number, Style> = {};
    const clusterLayer = new VectorLayer({
      source: clusterSource,
      style: (feature) => {
        const clusterFeatures = feature.get('features');
        const size = clusterFeatures.length;
        let style = styleCache[size];
        if (!style) {
          if (size === 1) {
            style = new Style({
              image: new CircleStyle({
                radius: 8,
                fill: new Fill({ color: pointColor }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
              }),
            });
          } else {
            const radius = Math.min(8 + Math.sqrt(size) * 3, 30);
            style = new Style({
              image: new CircleStyle({
                radius: radius,
                fill: new Fill({ color: clusterColor }),
                stroke: new Stroke({ color: '#fff', width: 2 }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({ color: textColor }),
                font: 'bold 12px sans-serif',
              }),
            });
          }
          styleCache[size] = style;
        }
        return style;
      },
    });

    this.map.addLayer(clusterLayer);
    this.layersMap.set(name, clusterLayer);
    this.updateLayerControl();

    if (fitBounds) {
      const extent = source.getExtent();
      if (extent && extent.every(v => isFinite(v))) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500,
        });
      }
    }
  }

  private handleRemoveClusterLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    const [name] = args as [string];
    this.handleRemoveLayer([name], kwargs);
  }

  // =========================================================================
  // WMS / WMTS
  // =========================================================================

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
    this.updateLayerControl();
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
    this.updateLayerControl();
  }

  private handleAddWMTSLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `wmts-${this.layersMap.size}`;
    const layerName = kwargs.layer as string;
    const matrixSet = kwargs.matrixSet as string || 'EPSG:3857';
    const format = kwargs.format as string || 'image/png';
    const attribution = kwargs.attribution as string || '';
    const style = kwargs.style as string || 'default';
    const opacity = kwargs.opacity as number ?? 1;

    const projection = getProjection(matrixSet);
    const projectionExtent = projection!.getExtent();
    const size = getWidth(projectionExtent) / 256;
    const resolutions = new Array(19);
    const matrixIds = new Array(19);
    for (let z = 0; z < 19; ++z) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z.toString();
    }

    const layer = new TileLayer({
      opacity: opacity,
      source: new WMTS({
        url: url,
        layer: layerName,
        matrixSet: matrixSet,
        format: format,
        style: style,
        attributions: attribution ? [attribution] : undefined,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds,
        }),
      }),
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
    this.updateLayerControl();
  }

  // =========================================================================
  // Vector Tiles
  // =========================================================================

  private handleAddVectorTileLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `vectortile-${this.layersMap.size}`;
    const style = kwargs.style as Record<string, unknown> || {};
    const attribution = kwargs.attribution as string || '';
    const minZoom = kwargs.minZoom as number ?? 0;
    const maxZoom = kwargs.maxZoom as number ?? 22;

    const layer = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),
        url: url,
        attributions: attribution ? [attribution] : undefined,
        minZoom: minZoom,
        maxZoom: maxZoom,
      }),
      style: Object.keys(style).length > 0 ? this.createVectorStyle(style) as Style : undefined,
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
    this.updateLayerControl();
  }

  // =========================================================================
  // Image Overlay
  // =========================================================================

  private handleAddImageLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `image-${this.layersMap.size}`;
    const bounds = kwargs.bounds as [number, number, number, number];
    const opacity = kwargs.opacity as number ?? 1;

    const extent = transformExtent(
      [bounds[0], bounds[1], bounds[2], bounds[3]],
      'EPSG:4326',
      'EPSG:3857'
    );

    const layer = new ImageLayer({
      source: new ImageStatic({
        url: url,
        imageExtent: extent,
      }),
      opacity: opacity,
    });

    this.map.addLayer(layer);
    this.layersMap.set(name, layer);
    this.updateLayerControl();
  }

  // =========================================================================
  // Choropleth
  // =========================================================================

  private handleAddChoropleth(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `choropleth-${this.layersMap.size}`;
    const column = kwargs.column as string;
    const breaks = kwargs.breaks as number[];
    const colors = kwargs.colors as string[];
    const strokeColor = kwargs.strokeColor as string || '#333';
    const strokeWidth = kwargs.strokeWidth as number ?? 1;
    const opacity = kwargs.opacity as number ?? 0.7;
    const fitBounds = kwargs.fitBounds !== false;
    const legend = kwargs.legend as boolean ?? true;

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(data, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const getColorForValue = (value: number): string => {
      for (let i = 0; i < breaks.length - 1; i++) {
        if (value <= breaks[i + 1]) {
          return colors[Math.min(i, colors.length - 1)];
        }
      }
      return colors[colors.length - 1];
    };

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const value = feature.get(column);
        const color = value !== undefined ? getColorForValue(Number(value)) : colors[0];
        return new Style({
          fill: new Fill({ color: color }),
          stroke: new Stroke({
            color: strokeColor,
            width: strokeWidth,
          }),
        });
      },
      opacity: opacity,
    });

    this.map.addLayer(vectorLayer);
    this.layersMap.set(name, vectorLayer);
    this.updateLayerControl();

    if (legend) {
      this.addChoroplethLegend(name, column, breaks, colors);
    }

    if (fitBounds) {
      const extent = vectorSource.getExtent();
      if (extent && extent.every(v => isFinite(v))) {
        this.map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500,
        });
      }
    }
  }

  private addChoroplethLegend(name: string, column: string, breaks: number[], colors: string[]): void {
    if (!this.mapContainer) return;

    const legendDiv = document.createElement('div');
    legendDiv.className = `ol-legend ol-legend-${name}`;
    legendDiv.style.cssText = `
      position: absolute; bottom: 30px; right: 10px; background: rgba(255,255,255,0.9);
      padding: 10px 14px; border-radius: 6px; font-size: 12px; z-index: 1000;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15); max-height: 300px; overflow-y: auto;
      color: #333;
    `;

    let html = `<div style="font-weight:bold;margin-bottom:6px;color:#333;">${column}</div>`;
    for (let i = 0; i < colors.length; i++) {
      const low = breaks[i] !== undefined ? breaks[i].toFixed(1) : '';
      const high = breaks[i + 1] !== undefined ? breaks[i + 1].toFixed(1) : '';
      html += `
        <div style="display:flex;align-items:center;margin:2px 0;">
          <div style="width:18px;height:18px;background:${colors[i]};border:1px solid #ccc;margin-right:6px;border-radius:2px;"></div>
          <span style="color:#333;">${low} – ${high}</span>
        </div>`;
    }
    legendDiv.innerHTML = html;
    this.mapContainer.appendChild(legendDiv);
  }

  // =========================================================================
  // Layer Management
  // =========================================================================

  private handleRemoveLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [layerId] = args as [string];
    const layer = this.layersMap.get(layerId);

    if (layer) {
      this.map.removeLayer(layer);
      this.layersMap.delete(layerId);
      this.updateLayerControl();
    }

    const legendEl = this.mapContainer?.querySelector(`.ol-legend-${layerId}`);
    if (legendEl) legendEl.remove();
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

  private handleSetLayerStyle(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId] = args as [string];
    const style = kwargs.style as Record<string, unknown>;
    const layer = this.layersMap.get(layerId);
    if (layer && layer instanceof VectorLayer) {
      (layer as VectorLayer<any>).setStyle(this.createVectorStyle(style) as Style);
    }
  }

  private handleSetLayerZIndex(args: unknown[], kwargs: Record<string, unknown>): void {
    const [layerId, zIndex] = args as [string, number];
    const layer = this.layersMap.get(layerId);
    if (layer) {
      layer.setZIndex(zIndex);
    }
  }

  // =========================================================================
  // Controls
  // =========================================================================

  private handleAddControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const controlType = args[0] as string;
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
          coordinateFormat: createStringXY(kwargs.precision as number ?? 4),
          projection: 'EPSG:4326',
        });
        break;
      case 'overviewMap':
        control = new OverviewMap({
          collapsed: kwargs.collapsed !== false,
          layers: [new TileLayer({ source: new OSM() })],
        });
        break;
      case 'zoomSlider':
        control = new ZoomSlider();
        break;
      case 'zoomToExtent':
        control = new ZoomToExtent({
          extent: kwargs.extent as [number, number, number, number] || undefined,
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

  // =========================================================================
  // Layer Control
  // =========================================================================

  private handleAddLayerControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.mapContainer) return;

    this.handleRemoveLayerControl([], {});

    const collapsed = kwargs.collapsed as boolean ?? true;

    const container = document.createElement('div');
    container.className = 'ol-layer-control';
    container.style.cssText = `
      position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.95);
      padding: 8px 12px; border-radius: 6px; font-size: 13px; z-index: 1000;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15); max-height: 400px; overflow-y: auto;
      min-width: 150px; color: #333;
    `;

    const header = document.createElement('div');
    header.style.cssText = 'font-weight:bold;margin-bottom:6px;cursor:pointer;user-select:none;';
    header.textContent = '☰ Layers';
    container.appendChild(header);

    const list = document.createElement('div');
    list.className = 'ol-layer-list';
    if (collapsed) {
      list.style.display = 'none';
    }
    container.appendChild(list);

    header.onclick = () => {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    };

    this.layerControlElement = container;
    this.mapContainer.appendChild(container);

    this.updateLayerControl();
  }

  private handleRemoveLayerControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.layerControlElement) {
      this.layerControlElement.remove();
      this.layerControlElement = null;
    }
  }

  private updateLayerControl(): void {
    if (!this.layerControlElement) return;

    const list = this.layerControlElement.querySelector('.ol-layer-list');
    if (!list) return;

    list.innerHTML = '';

    this.layersMap.forEach((layer, name) => {
      if (name.startsWith('basemap-')) return;

      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;margin:3px 0;';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = layer.getVisible();
      checkbox.style.marginRight = '6px';
      checkbox.onchange = () => {
        layer.setVisible(checkbox.checked);
      };

      const label = document.createElement('span');
      label.textContent = name;
      label.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

      item.appendChild(checkbox);
      item.appendChild(label);
      list.appendChild(item);
    });
  }

  // =========================================================================
  // Navigation
  // =========================================================================

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

  private handleSetRotation(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [rotation] = args as [number];
    this.map.getView().setRotation(rotation);
  }

  // =========================================================================
  // Markers
  // =========================================================================

  private handleAddMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const [lng, lat] = args as [number, number];
    const name = kwargs.id as string || kwargs.name as string || `marker-${this.markersMap.size}`;
    const popup = kwargs.popup as string;
    const color = kwargs.color as string || '#3388ff';
    const radius = kwargs.radius as number ?? 8;
    const draggable = kwargs.draggable as boolean ?? false;

    const feature = new Feature({
      geometry: new Point(fromLonLat([lng, lat])),
      popup: popup,
      name: name,
    });

    const vectorSource = new VectorSource({ features: [feature] });

    const markerStyle = new Style({
      image: new CircleStyle({
        radius: radius,
        fill: new Fill({ color: color }),
        stroke: new Stroke({ color: '#ffffff', width: 2 }),
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: markerStyle,
    });

    this.map.addLayer(vectorLayer);
    this.markersMap.set(name, vectorLayer);

    if (popup) {
      this.map.on('click', (evt) => {
        this.map!.forEachFeatureAtPixel(evt.pixel, (f) => {
          if (f === feature && popup) {
            this.popupContent!.innerHTML = popup;
            this.popupOverlay!.setPosition(evt.coordinate);
          }
        });
      });
    }

    if (draggable) {
      const modify = new Modify({ source: vectorSource });
      modify.on('modifyend', () => {
        const coords = (feature.getGeometry() as Point).getCoordinates();
        const lonLat = toLonLat(coords);
        this.sendEvent('markerDrag', { id: name, lngLat: lonLat });
      });
      this.map.addInteraction(modify);
    }
  }

  private handleRemoveMarker(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;
    const [name] = args as [string];

    const layer = this.markersMap.get(name);
    if (layer) {
      this.map.removeLayer(layer);
      this.markersMap.delete(name);
    }
  }

  // =========================================================================
  // Popups / Overlays
  // =========================================================================

  private handleAddPopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const name = kwargs.name as string || `popup-${this.overlaysMap.size}`;
    const content = kwargs.content as string || '';
    const lng = kwargs.lng as number;
    const lat = kwargs.lat as number;

    this.popupContent!.innerHTML = content;
    this.popupOverlay!.setPosition(fromLonLat([lng, lat]));
  }

  private handleRemovePopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.popupOverlay) {
      this.popupOverlay.setPosition(undefined);
    }
  }

  private handleShowPopup(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const content = kwargs.content as string || '';
    const lng = kwargs.lng as number;
    const lat = kwargs.lat as number;

    this.popupContent!.innerHTML = content;
    this.popupOverlay!.setPosition(fromLonLat([lng, lat]));
  }

  // =========================================================================
  // Draw Interaction
  // =========================================================================

  private handleAddDrawControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    this.handleRemoveDrawControl([], {});

    const drawType = kwargs.type as string || 'Polygon';

    this.drawSource = new VectorSource();
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.3)' }),
        stroke: new Stroke({ color: '#ffcc33', width: 2 }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: '#ffcc33' }),
        }),
      }),
    });
    this.map.addLayer(this.drawLayer);

    const draw = new Draw({
      source: this.drawSource,
      type: drawType as any,
    });

    const modify = new Modify({ source: this.drawSource });
    const snap = new Snap({ source: this.drawSource });

    draw.on('drawend', () => {
      setTimeout(() => this.syncDrawData(), 100);
    });

    modify.on('modifyend', () => {
      this.syncDrawData();
    });

    this.map.addInteraction(draw);
    this.map.addInteraction(modify);
    this.map.addInteraction(snap);

    this.interactionsMap.set('draw', draw);
    this.interactionsMap.set('draw-modify', modify);
    this.interactionsMap.set('draw-snap', snap);
  }

  private handleRemoveDrawControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    ['draw', 'draw-modify', 'draw-snap'].forEach(key => {
      const interaction = this.interactionsMap.get(key);
      if (interaction) {
        this.map!.removeInteraction(interaction);
        this.interactionsMap.delete(key);
      }
    });

    if (this.drawLayer) {
      this.map.removeLayer(this.drawLayer);
      this.drawLayer = null;
      this.drawSource = null;
    }
  }

  private handleClearDrawData(args: unknown[], kwargs: Record<string, unknown>): void {
    if (this.drawSource) {
      this.drawSource.clear();
      this.syncDrawData();
    }
  }

  private syncDrawData(): void {
    if (!this.drawSource) return;

    const features = this.drawSource.getFeatures();
    const geojson = new GeoJSON().writeFeaturesObject(features, {
      featureProjection: 'EPSG:3857',
    });

    this.model.set('_draw_data', geojson);
    this.model.save_changes();
    this.sendEvent('drawChange', geojson);
  }

  // =========================================================================
  // Measure
  // =========================================================================

  private handleAddMeasureControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    this.handleRemoveMeasureControl([], {});

    const measureType = kwargs.type as string || 'LineString';

    this.measureSource = new VectorSource();
    this.measureLayer = new VectorLayer({
      source: this.measureSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        stroke: new Stroke({
          color: '#e74c3c',
          width: 3,
          lineDash: [10, 10],
        }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: '#e74c3c' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    });
    this.map.addLayer(this.measureLayer);

    this.measureTooltipElement = document.createElement('div');
    this.measureTooltipElement.className = 'ol-measure-tooltip';
    this.measureTooltipElement.style.cssText = `
      position: relative; background: rgba(0,0,0,0.7); color: #fff;
      border-radius: 4px; padding: 4px 8px; font-size: 12px; white-space: nowrap;
    `;

    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
    });
    this.map.addOverlay(this.measureTooltip);

    const draw = new Draw({
      source: this.measureSource,
      type: measureType as any,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        stroke: new Stroke({
          color: 'rgba(231, 76, 60, 0.5)',
          width: 2,
          lineDash: [10, 10],
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({ color: 'rgba(231, 76, 60, 0.7)' }),
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        }),
      }),
    });

    draw.on('drawstart', (evt) => {
      const sketch = evt.feature;
      sketch.getGeometry()!.on('change', (geomEvt) => {
        const geom = geomEvt.target;
        let output = '';
        let tooltipCoord: any;
        if (geom instanceof Polygon) {
          const area = getArea(geom);
          output = area > 10000
            ? `${(area / 1000000).toFixed(2)} km²`
            : `${area.toFixed(2)} m²`;
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else if (geom instanceof LineString) {
          const length = getLength(geom);
          output = length > 1000
            ? `${(length / 1000).toFixed(2)} km`
            : `${length.toFixed(2)} m`;
          tooltipCoord = geom.getLastCoordinate();
        }
        if (this.measureTooltipElement) {
          this.measureTooltipElement.textContent = output;
        }
        if (this.measureTooltip) {
          this.measureTooltip.setPosition(tooltipCoord);
        }
      });
    });

    draw.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry();
      let result: Record<string, unknown> = {};
      if (geom instanceof Polygon) {
        result = { type: 'area', value: getArea(geom), unit: 'm²' };
      } else if (geom instanceof LineString) {
        result = { type: 'distance', value: getLength(geom), unit: 'm' };
      }
      this.sendEvent('measureResult', result);

      const tooltip = document.createElement('div');
      tooltip.style.cssText = `
        background: rgba(0,0,0,0.7); color: #fff; border-radius: 4px;
        padding: 3px 6px; font-size: 11px; white-space: nowrap;
      `;
      tooltip.textContent = this.measureTooltipElement?.textContent || '';
      const overlay = new Overlay({
        element: tooltip,
        offset: [0, -10],
        positioning: 'bottom-center',
        position: this.measureTooltip?.getPosition(),
      });
      this.map!.addOverlay(overlay);

      this.measureTooltipElement = document.createElement('div');
      this.measureTooltipElement.className = 'ol-measure-tooltip';
      this.measureTooltipElement.style.cssText = `
        position: relative; background: rgba(0,0,0,0.7); color: #fff;
        border-radius: 4px; padding: 4px 8px; font-size: 12px; white-space: nowrap;
      `;
      this.measureTooltip!.setElement(this.measureTooltipElement);
    });

    this.map.addInteraction(draw);
    this.interactionsMap.set('measure', draw);
  }

  private handleRemoveMeasureControl(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const interaction = this.interactionsMap.get('measure');
    if (interaction) {
      this.map.removeInteraction(interaction);
      this.interactionsMap.delete('measure');
    }

    if (this.measureLayer) {
      this.map.removeLayer(this.measureLayer);
      this.measureLayer = null;
      this.measureSource = null;
    }

    if (this.measureTooltip) {
      this.map.removeOverlay(this.measureTooltip);
      this.measureTooltip = null;
      this.measureTooltipElement = null;
    }
  }

  // =========================================================================
  // Select Interaction
  // =========================================================================

  private handleAddSelectInteraction(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    this.handleRemoveSelectInteraction([], {});

    const multi = kwargs.multi as boolean ?? false;

    const highlightStyle = new Style({
      fill: new Fill({ color: 'rgba(255, 200, 0, 0.4)' }),
      stroke: new Stroke({ color: '#ff8800', width: 3 }),
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: 'rgba(255, 200, 0, 0.6)' }),
        stroke: new Stroke({ color: '#ff8800', width: 2 }),
      }),
    });

    const select = new Select({
      condition: click,
      multi: multi,
      style: highlightStyle,
    });

    select.on('select', (evt) => {
      const selected = evt.selected.map((feature: any) => {
        const props = feature.getProperties();
        delete props.geometry;
        return props;
      });

      this.sendEvent('featureSelect', { selected });
      this.model.set('_queried_features', { selected });
      this.model.save_changes();
    });

    this.map.addInteraction(select);
    this.interactionsMap.set('select', select);
  }

  private handleRemoveSelectInteraction(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const interaction = this.interactionsMap.get('select');
    if (interaction) {
      this.map.removeInteraction(interaction);
      this.interactionsMap.delete('select');
    }
  }

  // =========================================================================
  // Graticule
  // =========================================================================

  private handleAddGraticule(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    this.handleRemoveGraticule([], {});

    const strokeColor = kwargs.strokeColor as string || 'rgba(0, 0, 0, 0.2)';
    const strokeWidth = kwargs.strokeWidth as number ?? 1;
    const showLabels = kwargs.showLabels !== false;

    const graticule = new Graticule({
      strokeStyle: new Stroke({
        color: strokeColor,
        width: strokeWidth,
        lineDash: [4, 4],
      }),
      showLabels: showLabels,
      wrapX: false,
    });

    this.map.addLayer(graticule);
    this.layersMap.set('graticule', graticule);
  }

  private handleRemoveGraticule(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.map) return;

    const graticule = this.layersMap.get('graticule');
    if (graticule) {
      this.map.removeLayer(graticule);
      this.layersMap.delete('graticule');
    }
  }

  // =========================================================================
  // Cleanup
  // =========================================================================

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

    this.interactionsMap.forEach((interaction) => {
      if (this.map) {
        this.map.removeInteraction(interaction);
      }
    });
    this.interactionsMap.clear();

    this.overlaysMap.forEach((overlay) => {
      if (this.map) {
        this.map.removeOverlay(overlay);
      }
    });
    this.overlaysMap.clear();

    this.markersMap.forEach((layer) => {
      if (this.map) {
        this.map.removeLayer(layer);
      }
    });
    this.markersMap.clear();

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

    if (this.layerControlElement) {
      this.layerControlElement.remove();
      this.layerControlElement = null;
    }

    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
    }

    if (this.mapContainer) {
      this.mapContainer.remove();
      this.mapContainer = null;
    }
  }
}
