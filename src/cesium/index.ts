/**
 * Cesium 3D globe widget entry point.
 *
 * Cesium is loaded dynamically from CDN since it's too large to bundle
 * and the browser can't resolve bare module specifiers.
 */

import type { AnyModel } from '@anywidget/types';

// Cesium CDN URLs
const CESIUM_VERSION = '1.120';
const CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;
const CESIUM_JS_URL = `${CESIUM_BASE_URL}/Cesium.js`;
const CESIUM_CSS_URL = `${CESIUM_BASE_URL}/Widgets/widgets.css`;

// Declare Cesium on window
declare global {
  interface Window {
    Cesium: any;
    CESIUM_BASE_URL: string;
  }
}

interface CesiumModel extends AnyModel {
  get(key: 'center'): [number, number];
  get(key: 'zoom'): number;
  get(key: 'width'): string;
  get(key: 'height'): string;
  get(key: 'access_token'): string;
  get(key: '_js_calls'): Array<{ id: number; method: string; args: unknown[]; kwargs: Record<string, unknown> }>;
}

/**
 * Load Cesium CSS dynamically.
 */
function loadCesiumCSS(): void {
  if (!document.querySelector(`link[href="${CESIUM_CSS_URL}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CESIUM_CSS_URL;
    document.head.appendChild(link);
  }
}

/**
 * Load Cesium JS dynamically.
 */
function loadCesiumJS(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Cesium) {
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector(`script[src="${CESIUM_JS_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Cesium')));
      return;
    }

    // Set Cesium base URL for asset loading
    window.CESIUM_BASE_URL = CESIUM_BASE_URL;

    // Load script
    const script = document.createElement('script');
    script.src = CESIUM_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cesium'));
    document.head.appendChild(script);
  });
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
    const Cesium = window.Cesium;
    if (!Cesium) {
      throw new Error('Cesium not loaded');
    }

    const accessToken = this.model.get('access_token') || '';
    const center = this.model.get('center') || [0, 0];
    const zoom = this.model.get('zoom') || 2;

    // Set access token
    if (accessToken) {
      Cesium.Ion.defaultAccessToken = accessToken;
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

    // Create viewer
    this.viewer = new Cesium.Viewer(this.container, {
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
    const Cesium = window.Cesium;
    const newCenter = this.model.get('center');
    if (this.viewer && Cesium) {
      const currentHeight = this.viewer.camera.positionCartographic.height;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(newCenter[0], newCenter[1], currentHeight),
      });
    }
  }

  // Method handlers
  handle_addBasemap(args: unknown[], kwargs: Record<string, unknown>): void {
    const Cesium = window.Cesium;
    if (!this.viewer || !Cesium) return;

    const url = args[0] as string;
    const name = kwargs.name as string || 'basemap';

    const imageryProvider = new Cesium.UrlTemplateImageryProvider({ url });
    const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider);
    this.imageryLayers.set(name, layer);
  }

  handle_setTerrain(args: unknown[], kwargs: Record<string, unknown>): void {
    const Cesium = window.Cesium;
    if (!this.viewer || !Cesium) return;

    const url = kwargs.url as string;
    if (url === 'cesium-world-terrain' || !url) {
      this.viewer.scene.setTerrain(
        Cesium.Terrain.fromWorldTerrain({
          requestVertexNormals: true,
          requestWaterMask: true,
        })
      );
    }
  }

  handle_flyTo(args: unknown[], kwargs: Record<string, unknown>): void {
    const Cesium = window.Cesium;
    if (!this.viewer || !Cesium) return;

    const lng = args[0] as number;
    const lat = args[1] as number;
    const height = kwargs.height as number || zoomToHeight(kwargs.zoom as number || 10);
    const heading = kwargs.heading as number || 0;
    const pitch = kwargs.pitch as number || -90;
    const duration = kwargs.duration as number ?? 2;

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(heading),
        pitch: Cesium.Math.toRadians(pitch),
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
    const Cesium = window.Cesium;
    if (!this.viewer || !Cesium) return;

    const data = kwargs.data as object;
    const name = kwargs.name as string || `geojson-${this.dataSources.size}`;
    const stroke = kwargs.stroke as string || '#3388ff';
    const fill = kwargs.fill as string || 'rgba(51, 136, 255, 0.5)';

    try {
      const dataSource = await Cesium.GeoJsonDataSource.load(data, {
        stroke: Cesium.Color.fromCssColorString(stroke),
        fill: Cesium.Color.fromCssColorString(fill),
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
  // Load Cesium CSS and JS
  loadCesiumCSS();

  try {
    await loadCesiumJS();
  } catch (error) {
    console.error('Failed to load Cesium:', error);
    el.innerHTML = '<div style="padding: 20px; color: red;">Failed to load Cesium library</div>';
    return () => {};
  }

  // Create widget
  widget = new CesiumWidget(model as CesiumModel, el);

  // Initialize
  try {
    await widget.initialize();
  } catch (error) {
    console.error('Failed to initialize Cesium viewer:', error);
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
