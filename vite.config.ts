import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@examples': resolve(__dirname, 'examples'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // MapLibre examples
        maplibre: resolve(__dirname, 'examples/maplibre/index.html'),
        'maplibre-cog': resolve(__dirname, 'examples/maplibre/cog_layer.html'),
        // Other map libraries
        leaflet: resolve(__dirname, 'examples/leaflet/index.html'),
        mapbox: resolve(__dirname, 'examples/mapbox/index.html'),
        openlayers: resolve(__dirname, 'examples/openlayers/index.html'),
        // 3D visualization
        cesium: resolve(__dirname, 'examples/cesium/index.html'),
        potree: resolve(__dirname, 'examples/potree/index.html'),
        // GPU-accelerated
        deckgl: resolve(__dirname, 'examples/deckgl/index.html'),
        keplergl: resolve(__dirname, 'examples/keplergl/index.html'),
        zarr: resolve(__dirname, 'examples/zarr/index.html'),
      },
    },
  },
});
