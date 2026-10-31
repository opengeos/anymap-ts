/**
 * Renames MapLibre's private `_classRegistryKey` in built bundles.
 *
 * MapLibre sets that property permanently on the global `Set` and `Error`, and
 * Mapbox GL JS reads a property of the same name, so with both on one page every
 * Mapbox tile fails with "Cannot read properties of undefined (reading 'omit')".
 * A notebook can hold both, and mapbox.js itself bundles MapLibre through
 * maplibre-gl-components. Every bundle that carries MapLibre needs this step.
 *
 * Usage: node scripts/isolateMaplibreRegistry.mjs <bundle.js>...
 */
import { readFileSync, writeFileSync } from 'node:fs';

for (const file of process.argv.slice(2)) {
  const source = readFileSync(file, 'utf8');
  if (!source.includes('_classRegistryKey')) {
    console.warn(`${file}: no _classRegistryKey found; has MapLibre renamed it?`);
    continue;
  }
  writeFileSync(file, source.replaceAll('_classRegistryKey', '_anymapMaplibreRegistryKey'));
}
