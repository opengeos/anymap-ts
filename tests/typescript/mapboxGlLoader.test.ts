/**
 * Tests for loading Mapbox GL JS from its CDN.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadMapboxGl,
  MAPBOX_GL_SCRIPT_INTEGRITY,
  MAPBOX_GL_SCRIPT_URL,
  MAPBOX_GL_STYLE_INTEGRITY,
  MAPBOX_GL_STYLE_URL,
  MAPBOX_GL_VERSION,
} from '../../src/mapbox/mapboxGlLoader';

const page = globalThis as unknown as {
  mapboxgl?: unknown;
  define?: { amd?: unknown };
};

const packageDir = resolve('node_modules/mapbox-gl');
const sri = (file: string): string =>
  `sha384-${createHash('sha384')
    .update(readFileSync(resolve(packageDir, 'dist', file)))
    .digest('base64')}`;

const script = () =>
  document.head.querySelector<HTMLScriptElement>(`script[src="${MAPBOX_GL_SCRIPT_URL}"]`)!;
const link = () =>
  document.head.querySelector<HTMLLinkElement>(`link[href="${MAPBOX_GL_STYLE_URL}"]`)!;

describe('loadMapboxGl', () => {
  // jsdom does not fetch either element, so each test fires their events itself.
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  afterEach(() => {
    delete (globalThis as Record<symbol, unknown>)[
      Symbol.for(`anymap-ts.mapbox-gl.${MAPBOX_GL_VERSION}`)
    ];
    delete page.mapboxgl;
    delete page.define;
    vi.unstubAllGlobals();
  });

  it('pins the installed package version and bytes', () => {
    const installed = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8'));
    expect(MAPBOX_GL_VERSION).toBe(installed.version);
    expect(MAPBOX_GL_SCRIPT_INTEGRITY).toBe(sri('mapbox-gl.js'));
    expect(MAPBOX_GL_STYLE_INTEGRITY).toBe(sri('mapbox-gl.css'));
  });

  it('requests both files from the CDN with SRI and resolves the namespace', async () => {
    const load = loadMapboxGl();
    expect(script().src).toMatch(/^https:\/\/api\.mapbox\.com\/mapbox-gl-js\//);
    expect(script().integrity).toBe(MAPBOX_GL_SCRIPT_INTEGRITY);
    expect(script().crossOrigin).toBe('anonymous');
    expect(link().integrity).toBe(MAPBOX_GL_STYLE_INTEGRITY);
    expect(link().crossOrigin).toBe('anonymous');

    page.mapboxgl = { Map: class {} };
    script().dispatchEvent(new Event('load'));
    link().dispatchEvent(new Event('load'));
    await expect(load).resolves.toBe(page.mapboxgl);
  });

  it('loads once for all widgets on the page', async () => {
    const first = loadMapboxGl();
    const second = loadMapboxGl();
    expect(second).toBe(first);
    expect(document.head.querySelectorAll('script')).toHaveLength(1);

    page.mapboxgl = {};
    script().dispatchEvent(new Event('load'));
    link().dispatchEvent(new Event('load'));
    await first;
    await loadMapboxGl();
    expect(document.head.querySelectorAll('script')).toHaveLength(1);
  });

  it('waits for both files before rejecting, then retries', async () => {
    const failed = loadMapboxGl();
    link().dispatchEvent(new Event('error'));
    await new Promise((done) => setTimeout(done));
    // The script is still loading, so a new widget shares this attempt.
    expect(loadMapboxGl()).toBe(failed);

    script().dispatchEvent(new Event('error'));
    await expect(failed).rejects.toThrow('Could not load');

    const retried = loadMapboxGl();
    expect(retried).not.toBe(failed);
    page.mapboxgl = {};
    script().dispatchEvent(new Event('load'));
    link().dispatchEvent(new Event('load'));
    await expect(retried).resolves.toBe(page.mapboxgl);
  });

  it('rejects when the script runs but defines no global', async () => {
    const load = loadMapboxGl();
    script().dispatchEvent(new Event('load'));
    link().dispatchEvent(new Event('load'));
    await expect(load).rejects.toThrow('did not define');
  });

  it('hides an AMD loader only while the script runs', async () => {
    const amd = { jQuery: true };
    page.define = { amd };
    let amdDuringDownload: unknown;
    let amdDuringRun: unknown = 'unset';
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      amdDuringDownload = page.define?.amd;
      expect(init.integrity).toBe(MAPBOX_GL_SCRIPT_INTEGRITY);
      return new Response('mapbox source');
    });
    vi.stubGlobal('fetch', fetchMock);
    // jsdom does not run scripts, so observe the flag at the moment of the append.
    const append = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      if ((node as HTMLElement).tagName === 'SCRIPT') {
        amdDuringRun = page.define?.amd;
        expect(node.textContent).toBe('mapbox source');
        page.mapboxgl = {};
      }
      return append(node);
    });

    const load = loadMapboxGl();
    link().dispatchEvent(new Event('load'));
    await load;
    expect(fetchMock).toHaveBeenCalledWith(MAPBOX_GL_SCRIPT_URL, expect.anything());
    expect(amdDuringDownload).toBe(amd);
    expect(amdDuringRun).toBeUndefined();
    expect(page.define?.amd).toBe(amd);
    vi.restoreAllMocks();
  });
});

describe('isolateMaplibreRegistry', () => {
  it('renames every occurrence of the shared property', () => {
    const dir = mkdtempSync(join(tmpdir(), 'anymap-registry-'));
    try {
      const bundle = join(dir, 'bundle.js');
      writeFileSync(bundle, 'defineProperty(k,"_classRegistryKey",{});k._classRegistryKey;');
      execFileSync(process.execPath, ['scripts/isolateMaplibreRegistry.mjs', bundle]);
      expect(readFileSync(bundle, 'utf8')).toBe(
        'defineProperty(k,"_anymapMaplibreRegistryKey",{});k._anymapMaplibreRegistryKey;',
      );
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
