# KeplerGL

KeplerGL is a powerful data exploration tool built on deck.gl.

## Python Example

```python
from anymap_ts import KeplerGLMap
import pandas as pd
import random

m = KeplerGLMap(center=[-122.4, 37.8], zoom=10)

# Create sample data
df = pd.DataFrame({
    "latitude": [37.8 + random.uniform(-0.2, 0.2) for _ in range(100)],
    "longitude": [-122.4 + random.uniform(-0.2, 0.2) for _ in range(100)],
    "value": [random.randint(1, 100) for _ in range(100)],
    "category": [random.choice(["A", "B", "C"]) for _ in range(100)],
})

m.add_data(df, name="sample_points")
m
```

**Note:** For best results, use the anywidget interface in Jupyter. HTML export has limited interactivity.

## TypeScript Implementation

KeplerGL is loaded dynamically and requires React:

```typescript
class KeplerGLWidget {
  private keplerGl: any = null;
  private store: any = null;

  async initialize(): Promise<void> {
    await loadKeplerGL();

    const { KeplerGl, keplerGlReducer, addDataToMap } = window.KeplerGl;

    // Create Redux store
    this.store = createStore(
      combineReducers({ keplerGl: keplerGlReducer }),
      applyMiddleware(taskMiddleware)
    );

    // Render KeplerGL component
    const root = createRoot(this.container);
    root.render(
      <Provider store={this.store}>
        <KeplerGl
          id="map"
          mapboxApiAccessToken={this.model.get('access_token')}
          width={this.container.clientWidth}
          height={this.container.clientHeight}
        />
      </Provider>
    );
  }
}
```

## Key Methods

### Adding Data

```typescript
handle_addData(args: unknown[], kwargs: Record<string, unknown>): void {
  const { addDataToMap } = window.KeplerGl;

  const data = kwargs.data;
  const name = kwargs.name as string;

  // Determine data format
  let processedData;
  if (this.isDataFrame(data)) {
    processedData = this.convertDataFrameToRows(data);
  } else if (this.isGeoJSON(data)) {
    processedData = data;
  }

  // Dispatch to KeplerGL store
  this.store.dispatch(
    addDataToMap({
      datasets: {
        info: { label: name, id: name },
        data: processedData,
      },
    })
  );
}

private convertDataFrameToRows(df: any): { fields: any[]; rows: any[] } {
  const columns = Object.keys(df);
  const fields = columns.map((name) => ({
    name,
    type: this.inferType(df[name][0]),
  }));

  const rows = [];
  const length = df[columns[0]].length;
  for (let i = 0; i < length; i++) {
    rows.push(columns.map((col) => df[col][i]));
  }

  return { fields, rows };
}
```

### Configuration

```typescript
handle_setConfig(args: unknown[], kwargs: Record<string, unknown>): void {
  const { receiveMapConfig } = window.KeplerGl;
  const config = kwargs.config as object;

  this.store.dispatch(receiveMapConfig(config));
}

handle_setFilter(args: unknown[], kwargs: Record<string, unknown>): void {
  const { setFilter } = window.KeplerGl;

  this.store.dispatch(setFilter({
    idx: kwargs.idx as number,
    prop: kwargs.prop as string,
    value: kwargs.value,
  }));
}
```

### Layer Management

```typescript
handle_addLayer(args: unknown[], kwargs: Record<string, unknown>): void {
  const { addLayer } = window.KeplerGl;

  this.store.dispatch(addLayer({
    type: kwargs.type as string,
    dataId: kwargs.dataId as string,
    config: kwargs.config as object,
  }));
}

handle_updateLayerConfig(args: unknown[], kwargs: Record<string, unknown>): void {
  const { layerConfigChange } = window.KeplerGl;

  this.store.dispatch(layerConfigChange({
    oldLayer: this.getLayerById(kwargs.layerId as string),
    newConfig: kwargs.config as object,
  }));
}
```

## Data Formats

KeplerGL supports multiple data formats:

### DataFrame-like Objects

```typescript
const data = {
  latitude: [37.7749, 37.8044, 37.3382],
  longitude: [-122.4194, -122.2712, -122.0308],
  value: [100, 80, 60],
  category: ['A', 'B', 'A'],
};
```

### GeoJSON

```typescript
const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[-122.5, 37.7], [-122.3, 37.7], [-122.3, 37.9], [-122.5, 37.9], [-122.5, 37.7]]],
      },
      properties: { name: 'Area' },
    },
  ],
};
```

## Built-in Layer Types

- **Point** - Render points as circles or icons
- **Arc** - Render arcs between points
- **Line** - Render line segments
- **Polygon** - Render filled polygons
- **Hexagon** - Hexagonal aggregation
- **Heatmap** - Density heatmap
- **Grid** - Grid-based aggregation
- **Cluster** - Point clustering
- **H3** - H3 hexagonal tiles
- **Trip** - Animated path visualization

## Source Files

- **Widget**: `src/keplergl/index.ts`
- **Types**: `src/types/keplergl.ts`

See also: [Python notebook example](../../notebooks/keplergl.ipynb)
