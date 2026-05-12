import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { GeoEditor } from 'maplibre-gl-geo-editor';
import { Geoman } from '@geoman-io/maplibre-geoman-free';
import { GeoEditorPlugin } from '../../src/maplibre/plugins/GeoEditorPlugin';

interface MockEditorState {
  boundKeyHandler: ((e: KeyboardEvent) => void) | null;
}

function setupMocks(): {
  mapContainer: HTMLElement;
  outsideElement: HTMLElement;
  map: any;
  editorState: MockEditorState;
  capturedKeyEvents: KeyboardEvent[];
} {
  const mapContainer = document.createElement('div');
  mapContainer.id = 'map-root';
  document.body.appendChild(mapContainer);

  const outsideElement = document.createElement('textarea');
  outsideElement.id = 'notebook-cell';
  document.body.appendChild(outsideElement);

  const editorState: MockEditorState = { boundKeyHandler: null };
  const capturedKeyEvents: KeyboardEvent[] = [];

  // Simulate the upstream geo-editor: register a document-level keydown
  // listener as part of `addControl` (which fires the editor's onAdd).
  const map: any = {
    addControl: vi.fn().mockImplementation(() => {
      const handler = (event: KeyboardEvent) => {
        capturedKeyEvents.push(event);
      };
      editorState.boundKeyHandler = handler;
      document.addEventListener('keydown', handler);
    }),
    removeControl: vi.fn().mockImplementation(() => {
      if (editorState.boundKeyHandler) {
        document.removeEventListener('keydown', editorState.boundKeyHandler);
        editorState.boundKeyHandler = null;
      }
    }),
    on: vi.fn(),
    getContainer: vi.fn().mockReturnValue(mapContainer),
  };

  vi.mocked(GeoEditor).mockImplementationOnce(function MockGeoEditor() {
    const instance: any = {
      setGeoman: vi.fn(),
      getFeatures: vi.fn().mockReturnValue({ type: 'FeatureCollection', features: [] }),
      loadGeoJson: vi.fn(),
      selectFeatures: vi.fn(),
      deleteSelectedFeatures: vi.fn(),
      getSelectedFeatures: vi.fn().mockReturnValue([]),
      enableDrawMode: vi.fn(),
      enableEditMode: vi.fn(),
      disableAllModes: vi.fn(),
    };
    // The plugin reads `boundKeyHandler` directly off the editor after
    // addControl runs, so expose it as a live getter on the mock.
    Object.defineProperty(instance, 'boundKeyHandler', {
      configurable: true,
      get: () => editorState.boundKeyHandler,
      set: (value: ((e: KeyboardEvent) => void) | null) => {
        editorState.boundKeyHandler = value;
      },
    });
    return instance;
  });

  vi.mocked(Geoman).mockImplementationOnce(function MockGeoman() {
    return {} as any;
  });

  return { mapContainer, outsideElement, map, editorState, capturedKeyEvents };
}

describe('GeoEditorPlugin keyboard scoping (issue #175)', () => {
  let activePlugin: GeoEditorPlugin | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Always destroy the plugin so the document-level keydown listener it
    // installs doesn't leak across tests (jsdom keeps `document` between
    // tests; clearing `document.body.innerHTML` does not remove listeners).
    activePlugin?.destroy();
    activePlugin = null;
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('does not forward keydown events fired outside the map container', () => {
    const { mapContainer, outsideElement, map, editorState, capturedKeyEvents } = setupMocks();

    const plugin = new GeoEditorPlugin(map);
    activePlugin = plugin;
    plugin.initialize({}, vi.fn());

    // Force the gm:loaded fallback timeout to create the GeoEditor.
    vi.advanceTimersByTime(1100);

    expect(map.addControl).toHaveBeenCalledTimes(1);
    // The plugin must have replaced the upstream listener: the upstream
    // boundKeyHandler is no longer registered on `document`.
    expect(editorState.boundKeyHandler).not.toBeNull();

    // Fire a Ctrl+C from a "notebook cell" outside the map — the upstream
    // handler must NOT see it.
    outsideElement.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );

    expect(capturedKeyEvents).toHaveLength(0);

    // Fire the same shortcut from inside the map container — the upstream
    // handler must still receive it so map shortcuts keep working.
    mapContainer.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );

    expect(capturedKeyEvents).toHaveLength(1);
    expect(capturedKeyEvents[0].key).toBe('c');
  });

  it('removes the wrapped keydown listener on destroy', () => {
    const { mapContainer, map, capturedKeyEvents } = setupMocks();

    const plugin = new GeoEditorPlugin(map);
    activePlugin = plugin;
    plugin.initialize({}, vi.fn());
    vi.advanceTimersByTime(1100);

    plugin.destroy();
    activePlugin = null;

    mapContainer.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'c',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );

    expect(capturedKeyEvents).toHaveLength(0);
  });
});
