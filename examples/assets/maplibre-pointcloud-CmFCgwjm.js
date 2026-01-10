import"./modulepreload-polyfill-B5Qt9EMX.js";/* empty css               */import{m as l}from"./maplibre-gl-BTjYUjN0.js";import{L as _}from"./maplibre-gl-layer-control-CsWFEept.js";import{D as x}from"./DeckLayerAdapter-hp-VgOtN.js";import{L,C as b,U as O,D as M,Y as z}from"./mapbox-overlay-DuGg2Dfa.js";import{c as A}from"./color-CUNNsFV-.js";import{p as I}from"./picking-CN0D5Hbh.js";import{g as E}from"./gouraud-material-Bh_EEl0e.js";import{G as w}from"./geometry-BGUg4AMQ.js";import"./_commonjsHelpers-Cpj98o6Y.js";const N=`struct PointCloudUniforms {
  radiusPixels: f32,
  sizeUnits: i32,
};

@group(0) @binding(3)
var<uniform> pointCloud: PointCloudUniforms;
`,y=`uniform pointCloudUniforms {
  float radiusPixels;
  highp int sizeUnits;
} pointCloud;
`,R={name:"pointCloud",source:N,vs:y,fs:y,uniformTypes:{radiusPixels:"f32",sizeUnits:"i32"}},T=`#version 300 es
#define SHADER_NAME point-cloud-layer-vertex-shader
in vec3 positions;
in vec3 instanceNormals;
in vec4 instanceColors;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec3 instancePickingColors;
out vec4 vColor;
out vec2 unitPosition;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.normal = project_normal(instanceNormals);
unitPosition = positions.xy;
geometry.uv = unitPosition;
geometry.pickingColor = instancePickingColors;
vec3 offset = vec3(positions.xy * project_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
vec3 lightColor = lighting_getLightColor(instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, instanceColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,S=`#version 300 es
#define SHADER_NAME point-cloud-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 unitPosition;
out vec4 fragColor;
void main(void) {
geometry.uv = unitPosition.xy;
float distToCenter = length(unitPosition);
if (distToCenter > 1.0) {
discard;
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,U=`struct ConstantAttributes {
  instanceNormals: vec3<f32>,
  instanceColors: vec4<f32>,
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instancePickingColors: vec3<f32>
};

const constants = ConstantAttributes(
  vec3<f32>(1.0, 0.0, 0.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  vec3<f32>(0.0)
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceNormals: vec3<f32>,
  @location(4) instanceColors: vec4<f32>,
  @location(5) instancePickingColors: vec3<f32>
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vColor: vec4<f32>,
  @location(1) unitPosition: vec2<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;
  
  // var geometry: Geometry;
  // geometry.worldPosition = instancePositions;
  // geometry.normal = project_normal(instanceNormals);

  // position on the containing square in [-1, 1] space
  varyings.unitPosition = attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  // Find the center of the point and add the current vertex
  let offset = vec3<f32>(attributes.positions.xy * project_unit_size_to_pixel(pointCloud.radiusPixels, pointCloud.sizeUnits), 0.0);
  // DECKGL_FILTER_SIZE(offset, geometry);

  varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, vec3<f32>(0.0)); // TODO , geometry.position);
  // DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  let clipPixels = project_pixel_size_to_clipspace(offset.xy);
  varyings.position.x += clipPixels.x;
  varyings.position.y += clipPixels.y;

  // Apply lighting
  let lightColor = lighting_getLightColor2(attributes.instanceColors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);

  // Apply opacity to instance color, or return instance picking color
  varyings.vColor = vec4(lightColor, attributes.instanceColors.a * color.opacity);
  // DECKGL_FILTER_COLOR(vColor, geometry);

  return varyings;
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  // var geometry: Geometry;
  // geometry.uv = unitPosition.xy;

  let distToCenter = length(varyings.unitPosition);
  if (distToCenter > 1.0) {
    discard;
  }

  var fragColor: vec4<f32>;

  fragColor = varyings.vColor;
  // DECKGL_FILTER_COLOR(fragColor, geometry);

  // Apply premultiplied alpha as required by transparent canvas
  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
}
`,f=[0,0,0,255],v=[0,0,1],k={sizeUnits:"pixels",pointSize:{type:"number",min:0,value:10},getPosition:{type:"accessor",value:o=>o.position},getNormal:{type:"accessor",value:v},getColor:{type:"accessor",value:f},material:!0,radiusPixels:{deprecatedFor:"pointSize"}};function D(o){const{header:i,attributes:t}=o;if(!(!i||!t)&&(o.length=i.vertexCount,t.POSITION&&(t.instancePositions=t.POSITION),t.NORMAL&&(t.instanceNormals=t.NORMAL),t.COLOR_0)){const{size:n,value:e}=t.COLOR_0;t.instanceColors={size:n,type:"unorm8",value:e}}}class c extends L{getShaders(){return super.getShaders({vs:T,fs:S,source:U,modules:[b,A,E,I,R]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceNormals:{size:3,transition:!0,accessor:"getNormal",defaultValue:v},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:f}})}updateState(i){var e;const{changeFlags:t,props:n}=i;super.updateState(i),t.extensionsChanged&&((e=this.state.model)==null||e.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll()),t.dataChanged&&D(n.data)}draw({uniforms:i}){const{pointSize:t,sizeUnits:n}=this.props,e=this.state.model,r={sizeUnits:O[n],radiusPixels:t};e.shaderInputs.setProps({pointCloud:r}),this.context.device.type==="webgpu"&&(e.instanceCount=this.props.data.length),e.draw(this.context.renderPass)}_getModel(){const i=this.context.device.type==="webgpu"?{depthWriteEnabled:!0,depthCompare:"less-equal"}:void 0,t=[];for(let n=0;n<3;n++){const e=n/3*Math.PI*2;t.push(Math.cos(e)*2,Math.sin(e)*2,0)}return new M(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new w({topology:"triangle-list",attributes:{positions:new Float32Array(t)}}),parameters:i,isInstanced:!0})}}c.layerName="PointCloudLayer";c.defaultProps=k;function F(o,i,t=1e3,n=.01){const e=[];for(let r=0;r<t;r+=1){const d=o+(Math.random()-.5)*n*2,g=i+(Math.random()-.5)*n*2,h=Math.sqrt((d-o)**2+(g-i)**2),m=Math.max(0,500-h*5e4)+Math.random()*50,a=Math.min(m/500,1),P=[Math.round(255*a),Math.round(100*(1-a)),Math.round(255*(1-a)),255];e.push({position:[d,g,m],color:P})}return e}const G=F(-122.4194,37.7749),s=new l.Map({container:"map",style:"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",center:[-122.4194,37.7749],zoom:14,pitch:60});s.addControl(new l.NavigationControl,"top-right");s.addControl(new l.ScaleControl({unit:"metric"}),"bottom-right");const p=new z({layers:[]}),u=new Map,C=new x(s,p,u);function j(){p.setProps({layers:Array.from(u.values())})}function K(){const o="pointcloud-demo",i=new c({id:o,data:G,pickable:!0,opacity:.9,pointSize:3,sizeUnits:"pixels",getPosition:t=>t.position,getColor:t=>t.color});u.set(o,i),j(),C.notifyLayerAdded(o)}s.on("load",()=>{s.addControl(p);const o=new _({collapsed:!0,customLayerAdapters:[C],panelWidth:360});s.addControl(o,"top-right"),K()});
