/**
 * Loads Mapbox GL JS from Mapbox's CDN.
 *
 * Mapbox GL JS v2+ is proprietary, so anymap-ts must not bundle it into its
 * MIT-licensed builds. The npm package is a dev dependency used only for types
 * and for the SRI test: `tests/typescript/mapboxGlLoader.test.ts` fails until
 * these constants match the installed version, and the `mapbox-gl` esbuild alias
 * in package.json fails the build if a runtime import reaches any bundle.
 */
import type mapboxgl from 'mapbox-gl';

export const MAPBOX_GL_VERSION = '3.34.1';
const CDN_BASE = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}`;
export const MAPBOX_GL_SCRIPT_URL = `${CDN_BASE}/mapbox-gl.js`;
export const MAPBOX_GL_STYLE_URL = `${CDN_BASE}/mapbox-gl.css`;
export const MAPBOX_GL_SCRIPT_INTEGRITY =
  'sha384-bRGpP2/mvLNdh4nRXgIf97xnGmUJRpB58iFa5NaGLEFu8v+0T/Bc0c+iX+AvMgVP';
export const MAPBOX_GL_STYLE_INTEGRITY =
  'sha384-QWCpuitI3tz8lJHSbcFQpEAx5BkQcYir4RLGZBb8zOIH0es6XDO8Kv6Gat+wOJRN';

export type MapboxGl = typeof mapboxgl;

/**
 * anywidget can evaluate this module once per widget, so the load is cached on
 * the page rather than in a module variable.
 */
const LOAD_KEY = Symbol.for(`anymap-ts.mapbox-gl.${MAPBOX_GL_VERSION}`);

type LoaderGlobals = {
  [LOAD_KEY]?: Promise<MapboxGl>;
  mapboxgl?: MapboxGl;
  define?: { amd?: unknown };
};

/**
 * Add a script or stylesheet element to the page and wait for it.
 *
 * @param element The element, with its URL and integrity already set.
 * @param url The URL to name in the error message.
 * @returns A promise that settles with the element's load or error event.
 */
function appendAndWait(element: HTMLElement, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    element.addEventListener('load', () => resolve(), { once: true });
    element.addEventListener(
      'error',
      () => {
        element.remove();
        reject(new Error(`Could not load ${url}`));
      },
      { once: true },
    );
    document.head.appendChild(element);
  });
}

/**
 * Load the Mapbox GL JS script.
 *
 * Classic notebooks define an AMD loader, which would make the UMD script
 * register an anonymous module instead of setting `window.mapboxgl`. Hiding
 * `define.amd` during the load leaves that loader working for everything else.
 *
 * @returns A promise that settles once the script has run.
 */
async function loadScript(): Promise<void> {
  const script = document.createElement('script');
  script.src = MAPBOX_GL_SCRIPT_URL;
  script.integrity = MAPBOX_GL_SCRIPT_INTEGRITY;
  script.crossOrigin = 'anonymous';

  const define = (globalThis as unknown as LoaderGlobals).define;
  const amd = define?.amd;
  if (define) define.amd = undefined;
  try {
    await appendAndWait(script, MAPBOX_GL_SCRIPT_URL);
  } finally {
    if (define) define.amd = amd;
  }
}

/**
 * Load the Mapbox GL stylesheet.
 *
 * @returns A promise that settles once the stylesheet has loaded.
 */
function loadStyle(): Promise<void> {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MAPBOX_GL_STYLE_URL;
  link.integrity = MAPBOX_GL_STYLE_INTEGRITY;
  link.crossOrigin = 'anonymous';
  return appendAndWait(link, MAPBOX_GL_STYLE_URL);
}

/**
 * Load Mapbox GL JS and its stylesheet, once per page.
 *
 * A failed load is not cached, so the next widget tries again.
 *
 * @returns The `mapboxgl` namespace.
 */
export function loadMapboxGl(): Promise<MapboxGl> {
  const page = globalThis as unknown as LoaderGlobals;
  const cached = page[LOAD_KEY];
  if (cached) return cached;

  const load = Promise.all([loadScript(), loadStyle()])
    .then(() => {
      // A script that throws while running still fires `load`.
      if (!page.mapboxgl) throw new Error('Mapbox GL JS did not define `mapboxgl`.');
      return page.mapboxgl;
    })
    .catch((error: unknown) => {
      delete page[LOAD_KEY];
      throw error;
    });
  page[LOAD_KEY] = load;
  return load;
}
