// Cesium is loaded globally via script tag
declare const Cesium: any;

// Initialize Cesium without token for basic usage
Cesium.Ion.defaultAccessToken = undefined;

const viewer = new Cesium.Viewer('cesiumContainer', {
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  vrButton: false,
  selectionIndicator: false,
  infoBox: false,
});

// Add OpenStreetMap imagery
viewer.imageryLayers.removeAll();
viewer.imageryLayers.addImageryProvider(
  new Cesium.UrlTemplateImageryProvider({
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    credit: '© OpenStreetMap contributors',
  })
);

// Set initial view
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-122.4, 37.8, 500000),
});

// Add GeoJSON (matching notebook example)
Cesium.GeoJsonDataSource.load({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] },
      properties: { name: 'San Francisco' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-122.5, 37.7],
          [-122.3, 37.7],
          [-122.3, 37.9],
          [-122.5, 37.9],
          [-122.5, 37.7],
        ]],
      },
      properties: { name: 'Bay Area' },
    },
  ],
}, {
  stroke: Cesium.Color.CYAN,
  fill: Cesium.Color.CYAN.withAlpha(0.3),
  strokeWidth: 3,
  clampToGround: true,
}).then((dataSource: any) => {
  viewer.dataSources.add(dataSource);
});

// State
let terrainEnabled = false;

// Action functions (matching notebook example)
function flyToSF(): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-122.4194, 37.7749, 50000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration: 2,
  });
}

function flyToGrandCanyon(): void {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-112.1129, 36.0544, 15000),
    orientation: {
      heading: Cesium.Math.toRadians(45),
      pitch: Cesium.Math.toRadians(-30),
      roll: 0,
    },
    duration: 3,
  });
}

function resetView(): void {
  viewer.camera.flyHome(2);
}

function toggleTerrain(): void {
  terrainEnabled = !terrainEnabled;
  if (terrainEnabled) {
    viewer.scene.setTerrain(
      Cesium.Terrain.fromWorldTerrain({
        requestVertexNormals: true,
      })
    );
  } else {
    viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
}

// Bind event listeners
document.getElementById('btn-sf')?.addEventListener('click', flyToSF);
document.getElementById('btn-canyon')?.addEventListener('click', flyToGrandCanyon);
document.getElementById('btn-reset')?.addEventListener('click', resetView);
document.getElementById('btn-terrain')?.addEventListener('click', toggleTerrain);
