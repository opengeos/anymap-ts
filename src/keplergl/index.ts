/**
 * KeplerGL widget entry point.
 *
 * KeplerGL is a React-based visualization library. This widget provides
 * a simple display showing the configured datasets and settings.
 * For full interactivity, use the to_html() export method.
 */

import type { AnyModel } from '@anywidget/types';

interface KeplerGLModel extends AnyModel {
  get(key: 'center'): [number, number];
  get(key: 'zoom'): number;
  get(key: 'width'): string;
  get(key: 'height'): string;
  get(key: 'config'): Record<string, unknown>;
  get(key: 'datasets'): Record<string, unknown>;
  get(key: 'mapbox_token'): string;
  get(key: 'read_only'): boolean;
  get(key: '_js_calls'): Array<{ id: number; method: string; args: unknown[]; kwargs: Record<string, unknown> }>;
}

/**
 * Format bytes to human readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Create the widget content.
 */
function createWidgetContent(model: KeplerGLModel): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #fff;
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;

  const center = model.get('center') || [-122.4, 37.8];
  const zoom = model.get('zoom') || 10;
  const datasets = model.get('datasets') || {};
  const readOnly = model.get('read_only') || false;

  const datasetCount = Object.keys(datasets).length;
  let totalDataSize = 0;
  const datasetItems = Object.entries(datasets).map(([id, dataset]: [string, any]) => {
    const dataStr = JSON.stringify(dataset);
    totalDataSize += dataStr.length;
    const rows = dataset?.data?.rows?.length || dataset?.data?.data?.features?.length || 0;
    return `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <span style="color: #4fc3f7;">${id}</span>
        <span style="color: #81c784;">${rows.toLocaleString()} rows</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>
      <div>
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">KeplerGL Map</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #888;">Interactive geospatial visualization</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #4fc3f7;">${datasetCount}</div>
        <div style="font-size: 12px; color: #888; margin-top: 4px;">Datasets</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #81c784;">${formatBytes(totalDataSize)}</div>
        <div style="font-size: 12px; color: #888; margin-top: 4px;">Data Size</div>
      </div>
      <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #feca57;">${readOnly ? 'Read Only' : 'Interactive'}</div>
        <div style="font-size: 12px; color: #888; margin-top: 4px;">Mode</div>
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Map View</h3>
      <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #888;">Center</span>
          <span style="color: #fff;">[${center[0].toFixed(4)}, ${center[1].toFixed(4)}]</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #888;">Zoom</span>
          <span style="color: #fff;">${zoom}</span>
        </div>
      </div>
    </div>

    ${datasetCount > 0 ? `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Datasets</h3>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px;">
          ${datasetItems}
        </div>
      </div>
    ` : `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>No datasets loaded. Use <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">add_data()</code> to add data.</p>
      </div>
    `}

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #666;">
        Use <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">to_html()</code> to export as standalone interactive map
      </p>
    </div>
  `;

  return container;
}

/**
 * anywidget render function.
 */
function render({ model, el }: { model: KeplerGLModel; el: HTMLElement }): () => void {
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

  model.on('change:datasets', updateContent);
  model.on('change:config', updateContent);
  model.on('change:center', updateContent);
  model.on('change:zoom', updateContent);

  // Return cleanup function
  return () => {
    model.off('change:datasets', updateContent);
    model.off('change:config', updateContent);
    model.off('change:center', updateContent);
    model.off('change:zoom', updateContent);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
}

export default { render };
