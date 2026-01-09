# Potree

Potree is a WebGL-based point cloud viewer for large-scale LiDAR datasets.

## Python Example

```python
from anymap_ts import PotreeViewer

viewer = PotreeViewer(
    point_budget=1000000,
    point_size=1.0,
    background="#1a1a2e",
    edl_enabled=True
)

# Adjust settings
viewer.set_point_budget(2000000)
viewer.set_point_size(1.5)
viewer.set_edl(enabled=True, radius=1.8, strength=0.5)

# Set camera
viewer.set_camera_position(0, 0, 100)
viewer.set_camera_target(0, 0, 0)

# Add annotation
viewer.add_annotation(position=(10, 20, 30), title="Point of Interest", description="Important location")

viewer
```

## TypeScript Implementation

Potree is loaded dynamically from CDN:

```typescript
const POTREE_VERSION = '1.8.2';
const POTREE_BASE_URL = `https://unpkg.com/potree-core@${POTREE_VERSION}/build`;

class PotreeWidget {
  private viewer: any = null;
  private pointClouds: Map<string, any> = new Map();
  private annotations: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    await loadPotree();

    const Potree = window.Potree;

    // Create viewer
    this.viewer = new Potree.Viewer(this.container);

    // Configure settings
    this.viewer.setPointBudget(this.model.get('point_budget') || 1000000);
    this.viewer.setBackground(this.model.get('background') || '#1a1a2e');
    this.viewer.setEDLEnabled(this.model.get('edl_enabled') !== false);

    // Set initial camera position
    const position = this.model.get('camera_position') || [0, 0, 100];
    const target = this.model.get('camera_target') || [0, 0, 0];
    this.viewer.scene.view.position.set(...position);
    this.viewer.scene.view.lookAt(new Potree.Vector3(...target));
  }
}
```

## Key Methods

### Loading Point Clouds

```typescript
async handle_loadPointCloud(args: unknown[], kwargs: Record<string, unknown>): Promise<void> {
  const Potree = window.Potree;
  const url = kwargs.url as string;
  const name = kwargs.name as string;

  const pointCloud = await Potree.loadPointCloud(url, name);

  // Configure appearance
  pointCloud.material.size = kwargs.pointSize as number || 1.0;
  pointCloud.material.pointSizeType = kwargs.pointSizeType || Potree.PointSizeType.ADAPTIVE;
  pointCloud.material.shape = kwargs.shape || Potree.PointShape.CIRCLE;

  this.viewer.scene.addPointCloud(pointCloud);
  this.pointClouds.set(name, pointCloud);

  // Fit to point cloud bounds
  this.viewer.fitToScreen();
}
```

### Visualization Settings

```typescript
handle_setPointBudget(args: unknown[], kwargs: Record<string, unknown>): void {
  const budget = args[0] as number;
  this.viewer.setPointBudget(budget);
}

handle_setPointSize(args: unknown[], kwargs: Record<string, unknown>): void {
  const size = args[0] as number;
  this.pointClouds.forEach((pc) => {
    pc.material.size = size;
  });
}

handle_setEDL(args: unknown[], kwargs: Record<string, unknown>): void {
  const enabled = kwargs.enabled as boolean ?? true;
  const radius = kwargs.radius as number ?? 1.4;
  const strength = kwargs.strength as number ?? 0.4;

  this.viewer.setEDLEnabled(enabled);
  this.viewer.setEDLRadius(radius);
  this.viewer.setEDLStrength(strength);
}

handle_setBackground(args: unknown[], kwargs: Record<string, unknown>): void {
  const color = args[0] as string;
  this.viewer.setBackground(color);
}
```

### Camera Control

```typescript
handle_setCameraPosition(args: unknown[], kwargs: Record<string, unknown>): void {
  const [x, y, z] = args as [number, number, number];
  this.viewer.scene.view.position.set(x, y, z);
}

handle_setCameraTarget(args: unknown[], kwargs: Record<string, unknown>): void {
  const [x, y, z] = args as [number, number, number];
  const Potree = window.Potree;
  this.viewer.scene.view.lookAt(new Potree.Vector3(x, y, z));
}
```

### Annotations

```typescript
handle_addAnnotation(args: unknown[], kwargs: Record<string, unknown>): void {
  const Potree = window.Potree;
  const position = kwargs.position as [number, number, number];
  const title = kwargs.title as string;
  const description = kwargs.description as string;

  const annotation = new Potree.Annotation({
    position: new Potree.Vector3(...position),
    title,
    description,
  });

  this.viewer.scene.annotations.add(annotation);
  this.annotations.set(title, annotation);
}
```

### Measurement Tools

```typescript
handle_addMeasurementTool(args: unknown[], kwargs: Record<string, unknown>): void {
  const Potree = window.Potree;
  const type = args[0] as string;

  let tool;
  switch (type) {
    case 'distance':
      tool = new Potree.MeasuringTool(this.viewer);
      break;
    case 'area':
      tool = new Potree.AreaTool(this.viewer);
      break;
    case 'volume':
      tool = new Potree.VolumeTool(this.viewer);
      break;
    case 'height':
      tool = new Potree.HeightTool(this.viewer);
      break;
  }

  if (tool) {
    tool.startInsertion();
  }
}
```

## Eye Dome Lighting (EDL)

EDL enhances depth perception in point clouds:

```typescript
// Enable EDL with custom settings
this.viewer.setEDLEnabled(true);
this.viewer.setEDLRadius(1.8);    // Light radius
this.viewer.setEDLStrength(0.5);  // Effect strength
```

## Source Files

- **Widget**: `src/potree/index.ts`
- **Types**: `src/types/potree.ts`

See also: [Python notebook example](../../notebooks/potree.ipynb)
