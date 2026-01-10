import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'examples',
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
    fs: {
      allow: [resolve(__dirname)],
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html'),
        // MapLibre examples
        maplibre: resolve(__dirname, 'examples/maplibre/index.html'),
        'maplibre-cog': resolve(__dirname, 'examples/maplibre/cog_layer.html'),
        'maplibre-arc': resolve(__dirname, 'examples/maplibre/arc_layer.html'),
        'maplibre-pointcloud': resolve(__dirname, 'examples/maplibre/pointcloud_layer.html'),
        'maplibre-zarr': resolve(__dirname, 'examples/maplibre/zarr_layer.html'),
        'maplibre-scatterplot': resolve(__dirname, 'examples/maplibre/scatterplot_layer.html'),
        'maplibre-hexagon': resolve(__dirname, 'examples/maplibre/hexagon_layer.html'),
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
      },
    },
  },
});
