/**
 * Potree point cloud viewer widget entry point.
 *
 * Uses potree-core (npm) + Three.js for bundled point cloud rendering.
 * No CDN loading required — everything is bundled by esbuild.
 */

import type { AnyModel } from '@anywidget/types';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Vector3,
  Box3,
  AmbientLight,
  Euler,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Potree, PointCloudOctree, PotreeRenderer } from 'potree-core';

interface PotreeModel extends AnyModel {
  get(key: 'width'): string;
  get(key: 'height'): string;
  get(key: 'point_budget'): number;
  get(key: 'point_size'): number;
  get(key: 'fov'): number;
  get(key: 'background'): string;
  get(key: 'edl_enabled'): boolean;
  get(key: 'edl_radius'): number;
  get(key: 'edl_strength'): number;
  get(key: 'point_clouds'): Record<string, {
    url: string;
    name: string;
    visible: boolean;
    material: Record<string, unknown>;
  }>;
  get(key: 'camera_position'): [number, number, number];
  get(key: 'camera_target'): [number, number, number];
  get(key: '_js_calls'): Array<{ id: number; method: string; args: unknown[]; kwargs: Record<string, unknown> }>;
}

/**
 * Potree point cloud viewer widget using potree-core + Three.js.
 */
class PotreeWidget {
  private model: PotreeModel;
  private el: HTMLElement;
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;

  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private renderer: WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private potree: Potree | null = null;
  private potreeRenderer: PotreeRenderer | null = null;

  private pointClouds: Map<string, PointCloudOctree> = new Map();
  private pointCloudList: PointCloudOctree[] = [];
  private lastProcessedCallId: number = 0;
  private animationId: number = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(model: PotreeModel, el: HTMLElement) {
    this.model = model;
    this.el = el;
  }

  async initialize(): Promise<void> {
    this.el.style.width = '100%';
    this.el.style.display = 'block';

    // Create container
    this.container = document.createElement('div');
    this.container.style.width = this.model.get('width') || '100%';
    this.container.style.height = this.model.get('height') || '600px';
    this.container.style.position = 'relative';
    this.container.style.minWidth = '200px';
    this.el.appendChild(this.container);

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.container.appendChild(this.canvas);

    // Three.js setup
    const fov = this.model.get('fov') || 60;
    const bg = this.model.get('background') || '#000000';

    this.scene = new Scene();
    this.scene.background = new Color(bg);
    this.scene.add(new AmbientLight(0xffffff));

    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    this.camera = new PerspectiveCamera(fov, width / height, 0.1, 10000);
    const camPos = this.model.get('camera_position') || [0, 0, 100];
    this.camera.position.set(camPos[0], camPos[1], camPos[2]);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      precision: 'highp',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // OrbitControls for mouse navigation
    this.controls = new OrbitControls(this.camera, this.canvas);
    const camTarget = this.model.get('camera_target') || [0, 0, 0];
    this.controls.target.set(camTarget[0], camTarget[1], camTarget[2]);
    this.controls.update();

    // Potree setup
    this.potree = new Potree();
    this.potree.pointBudget = this.model.get('point_budget') || 1000000;

    const edlEnabled = this.model.get('edl_enabled') !== false;
    const edlRadius = this.model.get('edl_radius') || 1.4;
    const edlStrength = this.model.get('edl_strength') || 0.4;

    this.potreeRenderer = new PotreeRenderer({
      edl: {
        enabled: edlEnabled,
        strength: edlStrength,
        radius: edlRadius,
        opacity: 1.0,
      },
    });

    // Load point clouds from state
    const pointCloudsState = this.model.get('point_clouds') || {};
    for (const [name, config] of Object.entries(pointCloudsState)) {
      await this.loadPointCloud(config.url, name, config.material, config.visible);
    }

    // Process pending JS calls
    this.processJsCalls();

    // Listen for model changes
    this.model.on('change:_js_calls', () => this.processJsCalls());

    // Resize observer
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    // Start animation loop
    this.loop();
  }

  private onResize(): void {
    if (!this.container || !this.renderer || !this.camera) return;
    const rect = this.container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.renderer.setSize(rect.width, rect.height);
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop);
    if (!this.potree || !this.camera || !this.renderer || !this.scene || !this.controls || !this.potreeRenderer) return;

    this.potree.updatePointClouds(this.pointCloudList, this.camera, this.renderer);
    this.controls.update();
    this.potreeRenderer.render({
      renderer: this.renderer,
      scene: this.scene,
      camera: this.camera,
      pointClouds: this.pointCloudList,
    });
  };

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
      console.warn(`Unknown Potree method: ${method}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Point Cloud Methods
  // ---------------------------------------------------------------------------

  private async loadPointCloud(
    url: string,
    name: string,
    material?: Record<string, unknown>,
    visible?: boolean
  ): Promise<void> {
    if (!this.potree || !this.scene) return;

    try {
      // Split URL into baseUrl + filename for potree-core API
      const lastSlash = url.lastIndexOf('/');
      const baseUrl = url.substring(0, lastSlash + 1);
      const filename = url.substring(lastSlash + 1);

      const pco = await this.potree.loadPointCloud(filename, baseUrl);

      // Point clouds typically need rotation to align Y-up to Z-up
      pco.rotation.copy(new Euler(-Math.PI / 2, 0, 0));

      // Apply material settings
      pco.material.inputColorEncoding = 1;
      pco.material.outputColorEncoding = 1;

      if (material) {
        if (material.size !== undefined) pco.material.size = material.size as number;
        if (material.pointSizeType) {
          const types: Record<string, number> = { fixed: 0, attenuated: 1, adaptive: 2 };
          pco.material.pointSizeType = types[material.pointSizeType as string] ?? 2;
        }
        if (material.shape) {
          const shapes: Record<string, number> = { square: 0, circle: 1, paraboloid: 2 };
          pco.material.shape = shapes[material.shape as string] ?? 1;
        }
      } else {
        pco.material.size = this.model.get('point_size') || 1.0;
        pco.material.shape = 1; // circle
        pco.material.pointSizeType = 2; // adaptive
      }

      pco.visible = visible !== false;

      this.scene.add(pco);
      this.pointClouds.set(name, pco);
      this.pointCloudList = Array.from(this.pointClouds.values());

      // Fit camera to show the point cloud
      this.fitToPointClouds();
    } catch (error) {
      console.error('Error loading point cloud:', error);
    }
  }

  private fitToPointClouds(): void {
    if (!this.camera || !this.controls || this.pointCloudList.length === 0) return;

    const box = new Box3();
    for (const pco of this.pointCloudList) {
      if (pco.pcoGeometry?.boundingBox) {
        const pcBox = pco.pcoGeometry.boundingBox.clone();
        pcBox.applyMatrix4(pco.matrixWorld);
        box.union(pcBox);
      }
    }

    if (box.isEmpty()) return;

    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    this.camera.position.copy(center).add(new Vector3(0, -maxDim * 1.5, maxDim * 0.8));
    this.controls.target.copy(center);
    this.controls.update();
  }

  handle_loadPointCloud(args: unknown[], kwargs: Record<string, unknown>): void {
    this.loadPointCloud(
      kwargs.url as string,
      kwargs.name as string,
      kwargs.material as Record<string, unknown>,
      kwargs.visible as boolean
    );
  }

  handle_removePointCloud(args: unknown[], kwargs: Record<string, unknown>): void {
    const name = kwargs.name as string;
    const pco = this.pointClouds.get(name);
    if (pco && this.scene) {
      this.scene.remove(pco);
      pco.dispose();
      this.pointClouds.delete(name);
      this.pointCloudList = Array.from(this.pointClouds.values());
    }
  }

  handle_setPointCloudVisibility(args: unknown[], kwargs: Record<string, unknown>): void {
    const pco = this.pointClouds.get(kwargs.name as string);
    if (pco) {
      pco.visible = kwargs.visible as boolean;
    }
  }

  // ---------------------------------------------------------------------------
  // Camera Methods
  // ---------------------------------------------------------------------------

  handle_setCameraPosition(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.camera) return;
    this.camera.position.set(
      kwargs.x as number,
      kwargs.y as number,
      kwargs.z as number
    );
  }

  handle_setCameraTarget(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.controls) return;
    this.controls.target.set(
      kwargs.x as number,
      kwargs.y as number,
      kwargs.z as number
    );
    this.controls.update();
  }

  handle_flyToPointCloud(args: unknown[], kwargs: Record<string, unknown>): void {
    const name = kwargs.name as string;
    if (name) {
      const pco = this.pointClouds.get(name);
      if (pco && this.camera && this.controls && pco.pcoGeometry?.boundingBox) {
        const box = pco.pcoGeometry.boundingBox.clone();
        box.applyMatrix4(pco.matrixWorld);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        this.camera.position.copy(center).add(new Vector3(0, -maxDim * 1.5, maxDim * 0.8));
        this.controls.target.copy(center);
        this.controls.update();
      }
    } else {
      this.fitToPointClouds();
    }
  }

  handle_resetCamera(): void {
    this.fitToPointClouds();
  }

  // ---------------------------------------------------------------------------
  // Visualization Settings
  // ---------------------------------------------------------------------------

  handle_setPointBudget(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.potree) return;
    this.potree.pointBudget = kwargs.budget as number;
  }

  handle_setPointSize(args: unknown[], kwargs: Record<string, unknown>): void {
    const size = kwargs.size as number;
    this.pointClouds.forEach(pco => {
      pco.material.size = size;
    });
  }

  handle_setFOV(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.camera) return;
    this.camera.fov = kwargs.fov as number;
    this.camera.updateProjectionMatrix();
  }

  handle_setBackground(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.scene) return;
    this.scene.background = new Color(kwargs.color as string);
  }

  handle_setEDL(args: unknown[], kwargs: Record<string, unknown>): void {
    if (!this.potreeRenderer) return;
    this.potreeRenderer.setEDL({
      enabled: kwargs.enabled as boolean,
      radius: kwargs.radius as number,
      strength: kwargs.strength as number,
      opacity: 1.0,
    });
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  destroy(): void {
    cancelAnimationFrame(this.animationId);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.pointClouds.forEach(pco => pco.dispose());
    this.pointClouds.clear();
    this.pointCloudList = [];

    this.potreeRenderer?.dispose();
    this.potreeRenderer = null;

    this.controls?.dispose();
    this.controls = null;

    this.renderer?.dispose();
    this.renderer = null;

    this.scene = null;
    this.camera = null;
    this.potree = null;

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.canvas = null;
  }
}

/**
 * anywidget render function.
 */
async function render({ model, el }: { model: PotreeModel; el: HTMLElement }): Promise<() => void> {
  const widget = new PotreeWidget(model as PotreeModel, el);

  try {
    await widget.initialize();
  } catch (error) {
    console.error('Failed to initialize Potree viewer:', error);
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:400px;
        background:linear-gradient(135deg,#0f0f23,#1a1a3e);color:#e57373;font-family:sans-serif;
        border-radius:8px;padding:24px;">
        <div style="text-align:center">
          <div style="font-size:20px;margin-bottom:12px;">Failed to initialize Potree viewer</div>
          <div style="font-size:12px;color:#666;margin-top:12px;">${error}</div>
        </div>
      </div>
    `;
  }

  return () => {
    widget.destroy();
  };
}

export default { render };
