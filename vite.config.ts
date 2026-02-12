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
      external: ['@duckdb/duckdb-wasm'],
      input: {
        main: resolve(__dirname, 'examples/index.html'),
        // MapLibre examples
        maplibre: resolve(__dirname, 'examples/maplibre/index.html'),
        'maplibre-cog': resolve(__dirname, 'examples/maplibre/cog_layer.html'),
        'maplibre-arc': resolve(__dirname, 'examples/maplibre/arc_layer.html'),
        'maplibre-pointcloud': resolve(__dirname, 'examples/maplibre/pointcloud_layer.html'),
        'maplibre-lidar': resolve(__dirname, 'examples/maplibre/lidar_layer.html'),
        'maplibre-zarr': resolve(__dirname, 'examples/maplibre/zarr_layer.html'),
        'maplibre-scatterplot': resolve(__dirname, 'examples/maplibre/scatterplot_layer.html'),
        'maplibre-hexagon': resolve(__dirname, 'examples/maplibre/hexagon_layer.html'),
        'maplibre-trips': resolve(__dirname, 'examples/maplibre/trips_layer.html'),
        'maplibre-heatmap': resolve(__dirname, 'examples/maplibre/heatmap_layer.html'),
        'maplibre-path': resolve(__dirname, 'examples/maplibre/path_layer.html'),
        // New DeckGL layers
        'maplibre-bitmap': resolve(__dirname, 'examples/maplibre/bitmap_layer.html'),
        'maplibre-column': resolve(__dirname, 'examples/maplibre/column_layer.html'),
        'maplibre-terrain': resolve(__dirname, 'examples/maplibre/terrain_layer.html'),
        'maplibre-greatcircle': resolve(__dirname, 'examples/maplibre/greatcircle_layer.html'),
        'maplibre-h3hexagon': resolve(__dirname, 'examples/maplibre/h3hexagon_layer.html'),
        'maplibre-tile': resolve(__dirname, 'examples/maplibre/tile_layer.html'),
        'maplibre-mvt': resolve(__dirname, 'examples/maplibre/mvt_layer.html'),
        'maplibre-tile3d': resolve(__dirname, 'examples/maplibre/tile3d_layer.html'),
        'maplibre-gridcell': resolve(__dirname, 'examples/maplibre/gridcell_layer.html'),
        'maplibre-solidpolygon': resolve(__dirname, 'examples/maplibre/solidpolygon_layer.html'),
        'maplibre-s2': resolve(__dirname, 'examples/maplibre/s2_layer.html'),
        'maplibre-quadkey': resolve(__dirname, 'examples/maplibre/quadkey_layer.html'),
        'maplibre-geohash': resolve(__dirname, 'examples/maplibre/geohash_layer.html'),
        'maplibre-h3cluster': resolve(__dirname, 'examples/maplibre/h3cluster_layer.html'),
        'maplibre-wms': resolve(__dirname, 'examples/maplibre/wms_layer.html'),
        'maplibre-simplemesh': resolve(__dirname, 'examples/maplibre/simplemesh_layer.html'),
        'maplibre-scenegraph': resolve(__dirname, 'examples/maplibre/scenegraph_layer.html'),
        'maplibre-geojson': resolve(__dirname, 'examples/maplibre/geojson_layer.html'),
        'maplibre-icon': resolve(__dirname, 'examples/maplibre/icon_layer.html'),
        'maplibre-polygon': resolve(__dirname, 'examples/maplibre/polygon_layer.html'),
        'maplibre-text': resolve(__dirname, 'examples/maplibre/text_layer.html'),
        'maplibre-contour': resolve(__dirname, 'examples/maplibre/contour_layer.html'),
        'maplibre-control-grid': resolve(__dirname, 'examples/maplibre/control_grid.html'),
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
