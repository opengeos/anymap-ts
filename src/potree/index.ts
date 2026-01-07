/**
 * Potree point cloud viewer widget entry point.
 *
 * Potree is a Three.js-based point cloud renderer. This widget provides
 * a simple display showing the configured point clouds and settings.
 * For full interactivity, use the to_html() export method.
 */

import type { AnyModel } from '@anywidget/types';

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
 * Format number with appropriate suffix.
 */
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

/**
 * Create the widget content.
 */
function createWidgetContent(model: PotreeModel): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);
    color: #fff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;

  const pointBudget = model.get('point_budget') || 1000000;
  const pointSize = model.get('point_size') || 1.0;
  const fov = model.get('fov') || 60;
  const background = model.get('background') || '#000000';
  const edlEnabled = model.get('edl_enabled') !== false;
  const pointClouds = model.get('point_clouds') || {};
  const cameraPosition = model.get('camera_position') || [0, 0, 100];
  const cameraTarget = model.get('camera_target') || [0, 0, 0];

  const pointCloudCount = Object.keys(pointClouds).length;
  const pointCloudItems = Object.entries(pointClouds).map(([id, pc]: [string, any]) => {
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div>
          <span style="color: #64b5f6;">${pc.name || id}</span>
          <div style="font-size: 11px; color: #666; margin-top: 2px;">${pc.url ? pc.url.substring(0, 40) + '...' : 'No URL'}</div>
        </div>
        <span style="color: ${pc.visible ? '#81c784' : '#e57373'}; font-size: 12px;">
          ${pc.visible ? '● Visible' : '○ Hidden'}
        </span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #64b5f6, #42a5f5); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <circle cx="4" cy="4" r="2"/>
          <circle cx="12" cy="4" r="2"/>
          <circle cx="20" cy="4" r="2"/>
          <circle cx="4" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="20" cy="12" r="2"/>
          <circle cx="4" cy="20" r="2"/>
          <circle cx="12" cy="20" r="2"/>
          <circle cx="20" cy="20" r="2"/>
        </svg>
      </div>
      <div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Potree Viewer</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #888;">WebGL Point Cloud Visualization</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #64b5f6;">${pointCloudCount}</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">Point Clouds</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #81c784;">${formatNumber(pointBudget)}</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">Point Budget</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #ffd54f;">${pointSize}</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">Point Size</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px; text-align: center;">
        <div style="font-size: 20px; font-weight: bold; color: #ce93d8;">${fov}°</div>
        <div style="font-size: 11px; color: #888; margin-top: 4px;">FOV</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Camera</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #888;">Position</span>
            <span style="color: #fff; font-family: monospace; font-size: 12px;">
              [${cameraPosition.map(v => v.toFixed(1)).join(', ')}]
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #888;">Target</span>
            <span style="color: #fff; font-family: monospace; font-size: 12px;">
              [${cameraTarget.map(v => v.toFixed(1)).join(', ')}]
            </span>
          </div>
        </div>
      </div>
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Rendering</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #888;">EDL</span>
            <span style="color: ${edlEnabled ? '#81c784' : '#e57373'};">${edlEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #888;">Background</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 20px; height: 20px; background: ${background}; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);"></div>
              <span style="color: #fff; font-family: monospace; font-size: 12px;">${background}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    ${pointCloudCount > 0 ? `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Point Clouds</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
          ${pointCloudItems}
        </div>
      </div>
    ` : `
      <div style="text-align: center; padding: 24px; color: #666; background: rgba(255,255,255,0.03); border-radius: 8px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3; margin-bottom: 12px;">
          <circle cx="4" cy="4" r="2"/>
          <circle cx="12" cy="4" r="2"/>
          <circle cx="20" cy="4" r="2"/>
          <circle cx="4" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="20" cy="12" r="2"/>
        </svg>
        <p style="margin: 0;">No point clouds loaded</p>
        <p style="margin: 8px 0 0 0; font-size: 12px;">Use <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">load_point_cloud(url)</code> to add a point cloud</p>
      </div>
    `}

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        Use <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">to_html()</code> to export as standalone 3D viewer
      </p>
    </div>
  `;

  return container;
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: PotreeModel; el: HTMLElement }): () => void {
  el.style.width = '100%';
  el.style.display = 'block';

  // Create container
  const container = document.createElement('div');
  container.style.width = model.get('width') || '100%';
  container.style.height = model.get('height') || 'auto';
  container.style.minHeight = '300px';
  container.style.position = 'relative';
  el.appendChild(container);

  // Create widget content
  const content = createWidgetContent(model);
  container.appendChild(content);

  // Handle model changes
  const updateContent = () => {
    container.innerHTML = '';
    const newContent = createWidgetContent(model);
    container.appendChild(newContent);
  };

  model.on('change:point_clouds', updateContent);
  model.on('change:point_budget', updateContent);
  model.on('change:point_size', updateContent);
  model.on('change:background', updateContent);
  model.on('change:camera_position', updateContent);
  model.on('change:camera_target', updateContent);

  // Return cleanup function
  return () => {
    model.off('change:point_clouds', updateContent);
    model.off('change:point_budget', updateContent);
    model.off('change:point_size', updateContent);
    model.off('change:background', updateContent);
    model.off('change:camera_position', updateContent);
    model.off('change:camera_target', updateContent);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
}

export default { render };
