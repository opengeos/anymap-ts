/**
 * Cesium 3D globe widget entry point.
 *
 * Cesium is bundled from the npm package to avoid CORS issues
 * in VS Code/Cursor notebook webviews.
 */

import type { AnyModel } from '@anywidget/types';
import {
  Viewer,
  Cartesian3,
  Ion,
  UrlTemplateImageryProvider,
  Terrain,
  GeoJsonDataSource,
  Color,
  Math as CesiumMath,
} from 'cesium';

// Import Cesium widget CSS from the pre-built bundle
import 'cesium-widgets-css';

interface CesiumModel extends AnyModel {
  get(key: 'center'): [number, number];
  get(key: 'zoom'): number;
  get(key: 'width'): string;
  get(key: 'height'): string;
  get(key: 'access_token'): string;
  get(key: '_js_calls'): Array<{ id: number; method: string; args: unknown[]; kwargs: Record<string, unknown> }>;
}

/**
 * Convert zoom level to camera height.
 */
function zoomToHeight(zoom: number): number {
  return 40000000 / Math.pow(2, zoom);
}

/**
 * Create and manage a Cesium viewer.
 */
class CesiumWidget {
  private model: CesiumModel;
  private el: HTMLElement;
  private container: HTMLDivElement | null = null;
  private viewer: any = null;
  private imageryLayers: Map<string, any> = new Map();
  private tilesets: Map<string, any> = new Map();
  private dataSources: Map<string, any> = new Map();
  private lastProcessedCallId: number = 0;

  constructor(model: CesiumModel, el: HTMLElement) {
    this.model = model;
    this.el = el;
  }

  async initialize(): Promise<void> {
    const accessToken = this.model.get('access_token') || '';
    const center = this.model.get('center') || [0, 0];
    const zoom = this.model.get('zoom') || 2;

    // Set access token
    if (accessToken) {
      Ion.defaultAccessToken = accessToken;
    }

    // Set up parent element
    this.el.style.width = '100%';
    this.el.style.display = 'block';

    // Create container
    this.container = document.createElement('div');
    this.container.style.width = this.model.get('width') || '100%';
    this.container.style.height = this.model.get('height') || '600px';
    this.container.style.position = 'relative';
    this.container.style.minWidth = '200px';
    this.el.appendChild(this.container);

    // Calculate camera height from zoom
    const height = zoomToHeight(zoom);

    // Create viewer without default Ion imagery (which fails in VS Code webviews due to CORS).
    // Use OpenStreetMap as the default base layer instead.
    this.viewer = new Viewer(this.container, {
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
      baseLayer: false,
    });

    // Add OpenStreetMap as default basemap
    const osmProvider = new UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: 19,
    });
    this.viewer.imageryLayers.addImageryProvider(osmProvider);

    // Set initial camera position
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(center[0], center[1], height),
    });

    // Process pending JS calls
    this.processJsCalls();

    // Listen for model changes
    this.model.on('change:_js_calls', () => this.processJsCalls());
    this.model.on('change:center', () => this.onCenterChange());
  }

  private processJsCalls(): void {
    const jsCalls = this.model.get('_js_calls') || [];
    for (const call of jsCalls) {
      if (call.id > this.lastProcessedCallId) {
        this.executeMethod(call);
        this.lastProcessedCallId = call.id;
      }
    }
  }

  private executeMethod(call: { method: string; args: unknown[]; kwargs: Record<string, unknown> }): void {
    const { method, args, kwargs } = call;
    const handler = (this as any)[`handle_${method}`];
    if (handler) {
      try {
        handler.call(this, args, kwargs);
      } catch (error) {
        console.error(`Error executing method ${method}:`, error);
      }
    } else {
      console.warn(`Unknown method: ${method}`);
    }
  }

  private onCenterChange(): void {
    const newCenter = this.model.get('center');
    if (this.viewer) {
      const currentHeight = this.viewer.camera.positionCartographic.height;
      this.viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(newCenter[0], newCenter[1], currentHeight),
      });
    }
  }

  // Method handlers
  handle_addBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const url = args[0] as string;
    const name = kwargs.name as string || 'basemap';

    const imageryProvider = new UrlTemplateImageryProvider({ url });
    const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
    this.imageryLayers.set(name, layer);
  }

  handle_setTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const url = kwargs.url as string;
    if (url === 'cesium-world-terrain' || !url) {
      this.viewer.scene.setTerrain(
        Terrain.fromWorldTerrain({
          requestVertexNormals: true,
          requestWaterMask: true,
        })
      );
    }
  }

  handle_flyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;

    const lng = args[0] as number;
    const lat = args[1] as number;
    const height = kwargs.height as number || zoomToHeight(kwargs.zoom as number || 10);
    const heading = kwargs.heading as number || 0;
    const pitch = kwargs.pitch as number || -90;
    const duration = kwargs.duration as number ?? 2;

    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: CesiumMath.toRadians(heading),
        pitch: CesiumMath.toRadians(pitch),
        roll: 0,
      },
      duration: duration,
    });
  }

  handle_resetView(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.viewer) return;
    this.viewer.camera.flyHome(kwargs.duration as number ?? 2);
  }

  async handle_addGeoJSON(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
    if (!this.viewer) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `geojson-${this.dataSources.size}`;
    const stroke = kwargs.stroke as string || '#3388ff';
    const fill = kwargs.fill as string || 'rgba(51, 136, 255, 0.5)';

    try {
      const dataSource = await GeoJsonDataSource.load(data, {
        stroke: Color.fromCssColorString(stroke),
        fill: Color.fromCssColorString(fill),
        clampToGround: true,
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

  destroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.imageryLayers.clear();
    this.tilesets.clear();
    this.dataSources.clear();
  }
}

let widget: CesiumWidget | null = null;

/**
 * anywidget render function.
 */
async function render({ model, el }: { model: CesiumModel; el: HTMLElement }): Promise<() => void> {
  // Create widget
  widget = new CesiumWidget(model as CesiumModel, el);

  // Initialize
  try {
    await widget.initialize();
  } catch (error) {
    console.error('Failed to initialize Cesium viewer:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to initialize Cesium viewer</div>';
  }

  // Return cleanup function
  return () => {
    if (widget) {
      widget.destroy();
      widget = null;
    }
  };
}

export default { render };
