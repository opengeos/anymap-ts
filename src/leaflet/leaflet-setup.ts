/**
 * Leaflet setup module — imports Leaflet and exposes it globally so that
 * traditional Leaflet plugins (leaflet.heat, etc.) can attach to L.
 *
 * This module MUST be imported before any plugin side-effect imports.
 */

// @ts-ignore - Import from explicit ESM path to avoid baseUrl conflict
import * as L from 'leaflet/dist/leaflet-src.esm.js';

(globalThis as any).L = L;

export { L };
