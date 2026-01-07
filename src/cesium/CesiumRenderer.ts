/**
 * Cesium renderer implementation.
 * 3D globe visualization with terrain and 3D Tiles support.
 */

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { BaseMapRenderer } from '../core/BaseMapRenderer';
import type { MapWidgetModel, JsCallMessage } from '../types/anywidget';

type MethodHandler = (args: unknown[], kwargs: Record<string, unknown>) => void;

/**
 * Cesium 3D globe renderer.
 */
export class CesiumRenderer extends BaseMapRenderer {
  private viewer: Cesium.Viewer | null = null;
  private methodHandlers: Record<string, MethodHandler> = {};
  private imageryLayers: Map<string, Cesium.ImageryLayer> = new Map();
  private tilesets: Map<string, Cesium.Cesium3DTileset> = new Map();
  private dataSources: Map<string, Cesium.DataSource> = new Map();

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
    // Basemap/imagery
    this.registerMethod('addBasemap', this.handleAddBasemap.bind(this));
    this.registerMethod('addImageryLayer', this.handleAddImageryLayer.bind(this));
    this.registerMethod('removeImageryLayer', this.handleRemoveImageryLayer.bind(this));

    // Terrain
    this.registerMethod('setTerrain', this.handleSetTerrain.bind(this));
    this.registerMethod('removeTerrain', this.handleRemoveTerrain.bind(this));

    // 3D Tiles
    this.registerMethod('add3DTileset', this.handleAdd3DTileset.bind(this));
    this.registerMethod('remove3DTileset', this.handleRemove3DTileset.bind(this));

    // GeoJSON
    this.registerMethod('addGeoJSON', this.handleAddGeoJSON.bind(this));
    this.registerMethod('removeDataSource', this.handleRemoveDataSource.bind(this));

    // Camera
    this.registerMethod('flyTo', this.handleFlyTo.bind(this));
    this.registerMethod('zoomTo', this.handleZoomTo.bind(this));
    this.registerMethod('setCamera', this.handleSetCamera.bind(this));
    this.registerMethod('resetView', this.handleResetView.bind(this));

    // Layer management
    this.registerMethod('setVisibility', this.handleSetVisibility.bind(this));
    this.registerMethod('setOpacity', this.handleSetOpacity.bind(this));
  }

  /**
   * Initialize the Cesium viewer.
   */
  async initialize(): Promise<void> {
    const accessToken = this.model.get('access_token') as string || '';
    const center = this.model.get('center') as [number, number] || [0, 0];
    const zoom = this.model.get('zoom') as number || 2;

    // Set Cesium Ion access token
    if (accessToken) {
      Cesium.Ion.defaultAccessToken = accessToken;
    }

    // Create container
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    this.el.appendChild(container);

    // Calculate camera height from zoom level (rough approximation)
    const height = this.zoomToHeight(zoom);

    // Create viewer
    this.viewer = new Cesium.Viewer(container, {
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
    });

    // Set initial camera position
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
    });

    // Process pending JS calls
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
      if (this.viewer) {
        const currentHeight = this.viewer.camera.positionCartographic.height;
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(newCenter[0], newCenter[1], currentHeight),
        });
      }
    });
  }

  /**
   * Convert zoom level to camera height.
   */
  private zoomToHeight(zoom: number): number {
    // Rough approximation: higher zoom = lower height
    return 40000000 / Math.pow(2, zoom);
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
  // Basemap/Imagery Handlers
  // -------------------------------------------------------------------------

  private handleAddBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const url = args[0] as string;
    const name = kwargs.name as string || 'basemap';

    // Create OpenStreetMap or XYZ imagery provider
    const imageryProvider = new Cesium.UrlTemplateImageryProvider({
      url: url,
    });

    const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
    this.imageryLayers.set(name, layer);
  }

  private handleAddImageryLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `imagery-${this.imageryLayers.size}`;
    const alpha = kwargs.alpha as number ?? 1;

    let imageryProvider: Cesium.ImageryProvider;

    if (kwargs.type === 'wms') {
      imageryProvider = new Cesium.WebMapServiceImageryProvider({
        url: url,
        layers: kwargs.layers as string,
        parameters: kwargs.parameters as Record<string, string>,
      });
    } else if (kwargs.type === 'wmts') {
      imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: url,
        layer: kwargs.layer as string,
        style: kwargs.style as string || 'default',
        tileMatrixSetID: kwargs.tileMatrixSetID as string,
      });
    } else if (kwargs.type === 'arcgis') {
      imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
        url: url,
      });
    } else {
      // Default XYZ tiles
      imageryProvider = new Cesium.UrlTemplateImageryProvider({
        url: url,
      });
    }

    const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = alpha;
    this.imageryLayers.set(name, layer);
  }

  private handleRemoveImageryLayer(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const [name] = args as [string];
    const layer = this.imageryLayers.get(name);

    if (layer) {
      this.viewer.imageryLayers.remove(layer);
      this.imageryLayers.delete(name);
    }
  }

  // -------------------------------------------------------------------------
  // Terrain Handlers
  // -------------------------------------------------------------------------

  private handleSetTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const url = kwargs.url as string;
    const requestVertexNormals = kwargs.requestVertexNormals !== false;
    const requestWaterMask = kwargs.requestWaterMask !== false;

    if (url === 'cesium-world-terrain' || !url) {
      // Use Cesium World Terrain (requires Ion token)
      this.viewer.scene.setTerrain(
        Cesium.Terrain.fromWorldTerrain({
          requestVertexNormals: requestVertexNormals,
          requestWaterMask: requestWaterMask,
        })
      );
    } else {
      // Custom terrain provider
      Cesium.CesiumTerrainProvider.fromUrl(url, {
        requestVertexNormals: requestVertexNormals,
        requestWaterMask: requestWaterMask,
      }).then((terrainProvider) => {
        if (this.viewer) {
          this.viewer.terrainProvider = terrainProvider;
        }
      });
    }
  }

  private handleRemoveTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;
    this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }

  // -------------------------------------------------------------------------
  // 3D Tiles Handlers
  // -------------------------------------------------------------------------

  private async handleAdd3DTileset(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.viewer) return;

    const url = kwargs.url as string;
    const name = kwargs.name as string || `tileset-${this.tilesets.size}`;
    const maximumScreenSpaceError = kwargs.maximumScreenSpaceError as number ?? 16;

    try {
      let tileset: Cesium.Cesium3DTileset;

      // Check if it's an Ion asset ID
      if (typeof url === 'number' || (typeof url === 'string' && /^\d+$/.test(url))) {
        tileset = await Cesium.Cesium3DTileset.fromIonAssetId(
          parseInt(url as string),
          {
            maximumScreenSpaceError: maximumScreenSpaceError,
          }
        );
      } else {
        tileset = await Cesium.Cesium3DTileset.fromUrl(url, {
          maximumScreenSpaceError: maximumScreenSpaceError,
        });
      }

      this.viewer.scene.primitives.add(tileset);
      this.tilesets.set(name, tileset);

      if (kwargs.flyTo !== false) {
        this.viewer.zoomTo(tileset);
      }
    } catch (error) {
      console.error('Error loading 3D Tileset:', error);
    }
  }

  private handleRemove3DTileset(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const [name] = args as [string];
    const tileset = this.tilesets.get(name);

    if (tileset) {
      this.viewer.scene.primitives.remove(tileset);
      this.tilesets.delete(name);
    }
  }

  // -------------------------------------------------------------------------
  // GeoJSON Handlers
  // -------------------------------------------------------------------------

  private async handleAddGeoJSON(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.viewer) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `geojson-${this.dataSources.size}`;
    const clampToGround = kwargs.clampToGround !== false;
    const stroke = kwargs.stroke as string || '#3388ff';
    const strokeWidth = kwargs.strokeWidth as number ?? 2;
    const fill = kwargs.fill as string || 'rgba(51, 136, 255, 0.5)';

    try {
      const dataSource = await Cesium.GeoJsonDataSource.load(data, {
        stroke: Cesium.Color.fromCssColorString(stroke),
        strokeWidth: strokeWidth,
        fill: Cesium.Color.fromCssColorString(fill),
        clampToGround: clampToGround,
      });

      await this.viewer.dataSources.add(dataSource);
      this.dataSources.set(name, dataSource);

      if (kwargs.flyTo !== false) {
        this.viewer.zoomTo(dataSource);
      }
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
    }
  }

  private handleRemoveDataSource(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const [name] = args as [string];
    const dataSource = this.dataSources.get(name);

    if (dataSource) {
      this.viewer.dataSources.remove(dataSource);
      this.dataSources.delete(name);
    }
  }

  // -------------------------------------------------------------------------
  // Camera Handlers
  // -------------------------------------------------------------------------

  private handleFlyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const lng = args[0] as number;
    const lat = args[1] as number;
    const height = kwargs.height as number || this.zoomToHeight(kwargs.zoom as number || 10);
    const heading = kwargs.heading as number || 0;
    const pitch = kwargs.pitch as number || -90;
    const roll = kwargs.roll as number || 0;
    const duration = kwargs.duration as number ?? 2;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
      duration: duration,
    });
  }

  private handleZoomTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const target = kwargs.target as string;

    if (target) {
      const dataSource = this.dataSources.get(target);
      if (dataSource) {
        this.viewer.zoomTo(dataSource);
        return;
      }

      const tileset = this.tilesets.get(target);
      if (tileset) {
        this.viewer.zoomTo(tileset);
        return;
      }
    }
  }

  private handleSetCamera(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const lng = kwargs.longitude as number || 0;
    const lat = kwargs.latitude as number || 0;
    const height = kwargs.height as number || 10000000;
    const heading = kwargs.heading as number || 0;
    const pitch = kwargs.pitch as number || -90;
    const roll = kwargs.roll as number || 0;

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
        roll: Cesium.Math.toRadians(roll),
      },
    });
  }

  private handleResetView(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    this.viewer.camera.flyHome(kwargs.duration as number ?? 2);
  }

  // -------------------------------------------------------------------------
  // Layer Management Handlers
  // -------------------------------------------------------------------------

  private handleSetVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const [name, visible] = args as [string, boolean];

    const imageryLayer = this.imageryLayers.get(name);
    if (imageryLayer) {
      imageryLayer.show = visible;
      return;
    }

    const tileset = this.tilesets.get(name);
    if (tileset) {
      tileset.show = visible;
      return;
    }

    const dataSource = this.dataSources.get(name);
    if (dataSource) {
      dataSource.show = visible;
      return;
    }
  }

  private handleSetOpacity(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const [name, opacity] = args as [string, number];

    const imageryLayer = this.imageryLayers.get(name);
    if (imageryLayer) {
      imageryLayer.alpha = opacity;
      return;
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  destroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this.imageryLayers.clear();
    this.tilesets.clear();
    this.dataSources.clear();
    super.destroy();
  }
}
