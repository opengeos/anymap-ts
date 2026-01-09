var ee=Object.defineProperty;var te=(i,e,t)=>e in i?ee(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var h=(i,e,t)=>te(i,typeof e!="symbol"?e+"":e,t);import"./modulepreload-polyfill-B5Qt9EMX.js";import{m as V}from"./maplibre-gl-BTjYUjN0.js";import{J as b,a9 as oe,aa as se,L as N,H as M,I as ie,U as re,R as ae,ab as ne,ac as k,Q as v,N as ce,a8 as le,T as ue}from"./polygon-utils-Bl0lNSY2.js";import{c as de,d as ge,H as he}from"./hexagon-layer-Tga1FHEf.js";import"./_commonjsHelpers-Cpj98o6Y.js";const me="transform_output";class A{constructor(e,t){h(this,"device");h(this,"model");h(this,"sampler");h(this,"currentIndex",0);h(this,"samplerTextureMap",null);h(this,"bindings",[]);h(this,"resources",{});this.device=e,this.sampler=e.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}),this.model=new b(this.device,{id:t.id||se("texture-transform-model"),fs:t.fs||oe({input:t.targetTextureVarying,inputChannels:t.targetTextureChannels,output:me}),vertexCount:t.vertexCount,...t}),this._initialize(t),Object.seal(this)}destroy(){var e;this.model.destroy();for(const t of this.bindings)(e=t.framebuffer)==null||e.destroy()}delete(){this.destroy()}run(e){const{framebuffer:t}=this.bindings[this.currentIndex],o=this.device.beginRenderPass({framebuffer:t,...e});this.model.draw(o),o.end(),this.device.submit()}getTargetTexture(){const{targetTexture:e}=this.bindings[this.currentIndex];return e}getFramebuffer(){return this.bindings[this.currentIndex].framebuffer}_initialize(e){this._updateBindings(e)}_updateBindings(e){this.bindings[this.currentIndex]=this._updateBinding(this.bindings[this.currentIndex],e)}_updateBinding(e,{sourceBuffers:t,sourceTextures:o,targetTexture:s}){if(e||(e={sourceBuffers:{},sourceTextures:{},targetTexture:null}),Object.assign(e.sourceTextures,o),Object.assign(e.sourceBuffers,t),s){e.targetTexture=s;const{width:r,height:n}=s;e.framebuffer&&e.framebuffer.destroy(),e.framebuffer=this.device.createFramebuffer({id:"transform-framebuffer",width:r,height:n,colorAttachments:[s]}),e.framebuffer.resize({width:r,height:n})}return e}_setSourceTextureParameters(){const e=this.currentIndex,{sourceTextures:t}=this.bindings[e];for(const o in t)t[o].sampler=this.sampler}}const D=`uniform arcUniforms {
  bool greatCircle;
  bool useShortestPath;
  float numSegments;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int widthUnits;
} arc;
`,pe={name:"arc",vs:D,fs:D,uniformTypes:{greatCircle:"f32",useShortestPath:"f32",numSegments:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",widthUnits:"i32"}},fe=`#version 300 es
#define SHADER_NAME arc-layer-vertex-shader
in vec4 instanceSourceColors;
in vec4 instanceTargetColors;
in vec3 instanceSourcePositions;
in vec3 instanceSourcePositions64Low;
in vec3 instanceTargetPositions;
in vec3 instanceTargetPositions64Low;
in vec3 instancePickingColors;
in float instanceWidths;
in float instanceHeights;
in float instanceTilts;
out vec4 vColor;
out vec2 uv;
out float isValid;
float paraboloid(float distance, float sourceZ, float targetZ, float ratio) {
float deltaZ = targetZ - sourceZ;
float dh = distance * instanceHeights;
if (dh == 0.0) {
return sourceZ + deltaZ * ratio;
}
float unitZ = deltaZ / dh;
float p2 = unitZ * unitZ + 1.0;
float dir = step(deltaZ, 0.0);
float z0 = mix(sourceZ, targetZ, dir);
float r = mix(ratio, 1.0 - ratio, dir);
return sqrt(r * (p2 - r)) * dh + z0;
}
vec2 getExtrusionOffset(vec2 line_clipspace, float offset_direction, float width) {
vec2 dir_screenspace = normalize(line_clipspace * project.viewportSize);
dir_screenspace = vec2(-dir_screenspace.y, dir_screenspace.x);
return dir_screenspace * offset_direction * width / 2.0;
}
float getSegmentRatio(float index) {
return smoothstep(0.0, 1.0, index / (arc.numSegments - 1.0));
}
vec3 interpolateFlat(vec3 source, vec3 target, float segmentRatio) {
float distance = length(source.xy - target.xy);
float z = paraboloid(distance, source.z, target.z, segmentRatio);
float tiltAngle = radians(instanceTilts);
vec2 tiltDirection = normalize(target.xy - source.xy);
vec2 tilt = vec2(-tiltDirection.y, tiltDirection.x) * z * sin(tiltAngle);
return vec3(
mix(source.xy, target.xy, segmentRatio) + tilt,
z * cos(tiltAngle)
);
}
float getAngularDist (vec2 source, vec2 target) {
vec2 sourceRadians = radians(source);
vec2 targetRadians = radians(target);
vec2 sin_half_delta = sin((sourceRadians - targetRadians) / 2.0);
vec2 shd_sq = sin_half_delta * sin_half_delta;
float a = shd_sq.y + cos(sourceRadians.y) * cos(targetRadians.y) * shd_sq.x;
return 2.0 * asin(sqrt(a));
}
vec3 interpolateGreatCircle(vec3 source, vec3 target, vec3 source3D, vec3 target3D, float angularDist, float t) {
vec2 lngLat;
if(abs(angularDist - PI) < 0.001) {
lngLat = (1.0 - t) * source.xy + t * target.xy;
} else {
float a = sin((1.0 - t) * angularDist);
float b = sin(t * angularDist);
vec3 p = source3D.yxz * a + target3D.yxz * b;
lngLat = degrees(vec2(atan(p.y, -p.x), atan(p.z, length(p.xy))));
}
float z = paraboloid(angularDist * EARTH_RADIUS, source.z, target.z, t);
return vec3(lngLat, z);
}
void main(void) {
geometry.worldPosition = instanceSourcePositions;
geometry.worldPositionAlt = instanceTargetPositions;
float segmentIndex = float(gl_VertexID / 2);
float segmentSide = mod(float(gl_VertexID), 2.) == 0. ? -1. : 1.;
float segmentRatio = getSegmentRatio(segmentIndex);
float prevSegmentRatio = getSegmentRatio(max(0.0, segmentIndex - 1.0));
float nextSegmentRatio = getSegmentRatio(min(arc.numSegments - 1.0, segmentIndex + 1.0));
float indexDir = mix(-1.0, 1.0, step(segmentIndex, 0.0));
isValid = 1.0;
uv = vec2(segmentRatio, segmentSide);
geometry.uv = uv;
geometry.pickingColor = instancePickingColors;
vec4 curr;
vec4 next;
vec3 source;
vec3 target;
if ((arc.greatCircle || project.projectionMode == PROJECTION_MODE_GLOBE) && project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
source = project_globe_(vec3(instanceSourcePositions.xy, 0.0));
target = project_globe_(vec3(instanceTargetPositions.xy, 0.0));
float angularDist = getAngularDist(instanceSourcePositions.xy, instanceTargetPositions.xy);
vec3 prevPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, prevSegmentRatio);
vec3 currPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, segmentRatio);
vec3 nextPos = interpolateGreatCircle(instanceSourcePositions, instanceTargetPositions, source, target, angularDist, nextSegmentRatio);
if (abs(currPos.x - prevPos.x) > 180.0) {
indexDir = -1.0;
isValid = 0.0;
} else if (abs(currPos.x - nextPos.x) > 180.0) {
indexDir = 1.0;
isValid = 0.0;
}
nextPos = indexDir < 0.0 ? prevPos : nextPos;
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
if (isValid == 0.0) {
nextPos.x += nextPos.x > 0.0 ? -360.0 : 360.0;
float t = ((currPos.x > 0.0 ? 180.0 : -180.0) - currPos.x) / (nextPos.x - currPos.x);
currPos = mix(currPos, nextPos, t);
segmentRatio = mix(segmentRatio, nextSegmentRatio, t);
}
vec3 currPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, segmentRatio);
vec3 nextPos64Low = mix(instanceSourcePositions64Low, instanceTargetPositions64Low, nextSegmentRatio);
curr = project_position_to_clipspace(currPos, currPos64Low, vec3(0.0), geometry.position);
next = project_position_to_clipspace(nextPos, nextPos64Low, vec3(0.0));
} else {
vec3 source_world = instanceSourcePositions;
vec3 target_world = instanceTargetPositions;
if (arc.useShortestPath) {
source_world.x = mod(source_world.x + 180., 360.0) - 180.;
target_world.x = mod(target_world.x + 180., 360.0) - 180.;
float deltaLng = target_world.x - source_world.x;
if (deltaLng > 180.) target_world.x -= 360.;
if (deltaLng < -180.) source_world.x -= 360.;
}
source = project_position(source_world, instanceSourcePositions64Low);
target = project_position(target_world, instanceTargetPositions64Low);
float antiMeridianX = 0.0;
if (arc.useShortestPath) {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
antiMeridianX = -(project.coordinateOrigin.x + 180.) / 360. * TILE_SIZE;
}
float thresholdRatio = (antiMeridianX - source.x) / (target.x - source.x);
if (prevSegmentRatio <= thresholdRatio && nextSegmentRatio > thresholdRatio) {
isValid = 0.0;
indexDir = sign(segmentRatio - thresholdRatio);
segmentRatio = thresholdRatio;
}
}
nextSegmentRatio = indexDir < 0.0 ? prevSegmentRatio : nextSegmentRatio;
vec3 currPos = interpolateFlat(source, target, segmentRatio);
vec3 nextPos = interpolateFlat(source, target, nextSegmentRatio);
if (arc.useShortestPath) {
if (nextPos.x < antiMeridianX) {
currPos.x += TILE_SIZE;
nextPos.x += TILE_SIZE;
}
}
curr = project_common_position_to_clipspace(vec4(currPos, 1.0));
next = project_common_position_to_clipspace(vec4(nextPos, 1.0));
geometry.position = vec4(currPos, 1.0);
}
float widthPixels = clamp(
project_size_to_pixel(instanceWidths * arc.widthScale, arc.widthUnits),
arc.widthMinPixels, arc.widthMaxPixels
);
vec3 offset = vec3(
getExtrusionOffset((next.xy - curr.xy) * indexDir, segmentSide, widthPixels),
0.0);
DECKGL_FILTER_SIZE(offset, geometry);
DECKGL_FILTER_GL_POSITION(curr, geometry);
gl_Position = curr + vec4(project_pixel_size_to_clipspace(offset.xy), 0.0, 0.0);
vec4 color = mix(instanceSourceColors, instanceTargetColors, segmentRatio);
vColor = vec4(color.rgb, color.a * layer.opacity);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,xe=`#version 300 es
#define SHADER_NAME arc-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 uv;
in float isValid;
out vec4 fragColor;
void main(void) {
if (isValid == 0.0) {
discard;
}
fragColor = vColor;
geometry.uv = uv;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,y=[0,0,0,255],ve={getSourcePosition:{type:"accessor",value:i=>i.sourcePosition},getTargetPosition:{type:"accessor",value:i=>i.targetPosition},getSourceColor:{type:"accessor",value:y},getTargetColor:{type:"accessor",value:y},getWidth:{type:"accessor",value:1},getHeight:{type:"accessor",value:1},getTilt:{type:"accessor",value:0},greatCircle:!1,numSegments:{type:"number",value:50,min:1},widthUnits:"pixels",widthScale:{type:"number",value:1,min:0},widthMinPixels:{type:"number",value:0,min:0},widthMaxPixels:{type:"number",value:Number.MAX_SAFE_INTEGER,min:0}};class L extends N{getBounds(){var e;return(e=this.getAttributeManager())==null?void 0:e.getBounds(["instanceSourcePositions","instanceTargetPositions"])}getShaders(){return super.getShaders({vs:fe,fs:xe,modules:[M,ie,pe]})}get wrapLongitude(){return!1}initializeState(){this.getAttributeManager().addInstanced({instanceSourcePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getSourcePosition"},instanceTargetPositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getTargetPosition"},instanceSourceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getSourceColor",defaultValue:y},instanceTargetColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getTargetColor",defaultValue:y},instanceWidths:{size:1,transition:!0,accessor:"getWidth",defaultValue:1},instanceHeights:{size:1,transition:!0,accessor:"getHeight",defaultValue:1},instanceTilts:{size:1,transition:!0,accessor:"getTilt",defaultValue:0}})}updateState(e){var t;super.updateState(e),e.changeFlags.extensionsChanged&&((t=this.state.model)==null||t.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{widthUnits:t,widthScale:o,widthMinPixels:s,widthMaxPixels:r,greatCircle:n,wrapLongitude:c,numSegments:a}=this.props,l={numSegments:a,widthUnits:re[t],widthScale:o,widthMinPixels:s,widthMaxPixels:r,greatCircle:n,useShortestPath:c},u=this.state.model;u.shaderInputs.setProps({arc:l}),u.setVertexCount(a*2),u.draw(this.context.renderPass)}_getModel(){return new b(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),topology:"triangle-strip",isInstanced:!0})}}L.layerName="ArcLayer";L.defaultProps=ve;function ye(i){const e=i.map(c=>c[0]),t=i.map(c=>c[1]),o=Math.min.apply(null,e),s=Math.max.apply(null,e),r=Math.min.apply(null,t),n=Math.max.apply(null,t);return[o,r,s,n]}function Se(i,e){return e[0]>=i[0]&&e[2]<=i[2]&&e[1]>=i[1]&&e[3]<=i[3]}const E=new Float32Array(12);function I(i,e=2){let t=0;for(const o of i)for(let s=0;s<e;s++)E[t++]=o[s]||0;return E}function Te(i,e,t){const[o,s,r,n]=i,c=r-o,a=n-s;let l=c,u=a;c/a<e/t?l=e/t*a:u=t/e*c,l<e&&(l=e,u=t);const g=(r+o)/2,d=(n+s)/2;return[g-l/2,d-u/2,g+l/2,d+u/2]}function Pe(i,e){const[t,o,s,r]=e;return[(i[0]-t)/(s-t),(i[1]-o)/(r-o)]}const _e=`#version 300 es
#define SHADER_NAME heatp-map-layer-vertex-shader
uniform sampler2D maxTexture;
in vec3 positions;
in vec2 texCoords;
out vec2 vTexCoords;
out float vIntensityMin;
out float vIntensityMax;
void main(void) {
gl_Position = project_position_to_clipspace(positions, vec3(0.0), vec3(0.0));
vTexCoords = texCoords;
vec4 maxTexture = texture(maxTexture, vec2(0.5));
float maxValue = triangle.aggregationMode < 0.5 ? maxTexture.r : maxTexture.g;
float minValue = maxValue * triangle.threshold;
if (triangle.colorDomain[1] > 0.) {
maxValue = triangle.colorDomain[1];
minValue = triangle.colorDomain[0];
}
vIntensityMax = triangle.intensity / maxValue;
vIntensityMin = triangle.intensity / minValue;
}
`,we=`#version 300 es
#define SHADER_NAME triangle-layer-fragment-shader
precision highp float;
uniform sampler2D weightsTexture;
uniform sampler2D colorTexture;
in vec2 vTexCoords;
in float vIntensityMin;
in float vIntensityMax;
out vec4 fragColor;
vec4 getLinearColor(float value) {
float factor = clamp(value * vIntensityMax, 0., 1.);
vec4 color = texture(colorTexture, vec2(factor, 0.5));
color.a *= min(value * vIntensityMin, 1.0);
return color;
}
void main(void) {
vec4 weights = texture(weightsTexture, vTexCoords);
float weight = weights.r;
if (triangle.aggregationMode > 0.5) {
weight /= max(1.0, weights.a);
}
if (weight <= 0.) {
discard;
}
vec4 linearColor = getLinearColor(weight);
linearColor.a *= layer.opacity;
fragColor = linearColor;
}
`,z=`uniform triangleUniforms {
  float aggregationMode;
  vec2 colorDomain;
  float intensity;
  float threshold;
} triangle;
`,Ce={name:"triangle",vs:z,fs:z,uniformTypes:{aggregationMode:"f32",colorDomain:"vec2<f32>",intensity:"f32",threshold:"f32"}};class H extends N{getShaders(){return super.getShaders({vs:_e,fs:we,modules:[M,Ce]})}initializeState({device:e}){this.setState({model:this._getModel(e)})}_getModel(e){const{vertexCount:t,data:o}=this.props;return new b(e,{...this.getShaders(),id:this.props.id,attributes:o.attributes,bufferLayout:[{name:"positions",format:"float32x3"},{name:"texCoords",format:"float32x2"}],topology:"triangle-strip",vertexCount:t})}draw(){const{model:e}=this.state,{aggregationMode:t,colorDomain:o,intensity:s,threshold:r,colorTexture:n,maxTexture:c,weightsTexture:a}=this.props,l={aggregationMode:t,colorDomain:o,intensity:s,threshold:r,colorTexture:n,maxTexture:c,weightsTexture:a};e.shaderInputs.setProps({triangle:l}),e.draw(this.context.renderPass)}}H.layerName="TriangleLayer";function be(i,e){const t={};for(const o in i)e.includes(o)||(t[o]=i[o]);return t}class Z extends ae{initializeAggregationLayer(e){super.initializeState(this.context),this.setState({ignoreProps:be(this.constructor._propTypes,e.data.props),dimensions:e})}updateState(e){super.updateState(e);const{changeFlags:t}=e;if(t.extensionsChanged){const o=this.getShaders({});o&&o.defines&&(o.defines.NON_INSTANCED_MODEL=1),this.updateShaders(o)}this._updateAttributes()}updateAttributes(e){this.setState({changedAttributes:e})}getAttributes(){return this.getAttributeManager().getAttributes()}getModuleSettings(){const{viewport:e,mousePosition:t,device:o}=this.context;return Object.assign(Object.create(this.props),{viewport:e,mousePosition:t,picking:{isActive:0},devicePixelRatio:o.canvasContext.cssToDeviceRatio()})}updateShaders(e){}isAggregationDirty(e,t={}){const{props:o,oldProps:s,changeFlags:r}=e,{compareAll:n=!1,dimension:c}=t,{ignoreProps:a}=this.state,{props:l,accessors:u=[]}=c,{updateTriggersChanged:g}=r;if(r.dataChanged)return!0;if(g){if(g.all)return!0;for(const d of u)if(g[d])return!0}if(n)return r.extensionsChanged?!0:ne({oldProps:s,newProps:o,ignoreProps:a,propTypes:this.constructor._propTypes});for(const d of l)if(o[d]!==s[d])return!0;return!1}isAttributeChanged(e){const{changedAttributes:t}=this.state;return e?t&&t[e]!==void 0:!Me(t)}_getAttributeManager(){return new k(this.context.device,{id:this.props.id,stats:this.context.stats})}}Z.layerName="AggregationLayer";function Me(i){let e=!0;for(const t in i){e=!1;break}return e}const P=`#version 300 es
in vec3 positions;
in vec3 positions64Low;
in float weights;
out vec4 weightsTexture;
void main()
{
weightsTexture = vec4(weights * weight.weightsScale, 0., 0., 1.);
float radiusTexels = project_pixel_size(weight.radiusPixels) * weight.textureWidth / (weight.commonBounds.z - weight.commonBounds.x);
gl_PointSize = radiusTexels * 2.;
vec3 commonPosition = project_position(positions, positions64Low);
gl_Position.xy = (commonPosition.xy - weight.commonBounds.xy) / (weight.commonBounds.zw - weight.commonBounds.xy) ;
gl_Position.xy = (gl_Position.xy * 2.) - (1.);
gl_Position.w = 1.0;
}
`,_=`#version 300 es
in vec4 weightsTexture;
out vec4 fragColor;
float gaussianKDE(float u){
return pow(2.71828, -u*u/0.05555)/(1.77245385*0.166666);
}
void main()
{
float dist = length(gl_PointCoord - vec2(0.5, 0.5));
if (dist > 0.5) {
discard;
}
fragColor = weightsTexture * gaussianKDE(2. * dist);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Le=`#version 300 es
uniform sampler2D inTexture;
out vec4 outTexture;
void main()
{
int yIndex = gl_VertexID / int(maxWeight.textureSize);
int xIndex = gl_VertexID - (yIndex * int(maxWeight.textureSize));
vec2 uv = (0.5 + vec2(float(xIndex), float(yIndex))) / maxWeight.textureSize;
outTexture = texture(inTexture, uv);
gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
gl_PointSize = 1.0;
}
`,Re=`#version 300 es
in vec4 outTexture;
out vec4 fragColor;
void main() {
fragColor = outTexture;
fragColor.g = outTexture.r / max(1.0, outTexture.a);
}
`,Ae=`uniform weightUniforms {
  vec4 commonBounds;
  float radiusPixels;
  float textureWidth;
  float weightsScale;
} weight;
`,De={name:"weight",vs:Ae,uniformTypes:{commonBounds:"vec4<f32>",radiusPixels:"f32",textureWidth:"f32",weightsScale:"f32"}},Ee={name:"maxWeight",vs:`uniform maxWeightUniforms {
  float textureSize;
} maxWeight;
`,uniformTypes:{textureSize:"f32"}},Ie=2,w={format:"rgba8unorm",dimension:"2d",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}},B=[0,0],ze={SUM:0,MEAN:1},Be={getPosition:{type:"accessor",value:i=>i.position},getWeight:{type:"accessor",value:1},intensity:{type:"number",min:0,value:1},radiusPixels:{type:"number",min:1,max:100,value:50},colorRange:ge,threshold:{type:"number",min:0,max:1,value:.05},colorDomain:{type:"array",value:null,optional:!0},aggregation:"SUM",weightsTextureSize:{type:"number",min:128,max:2048,value:2048},debounceTimeout:{type:"number",min:0,max:1e3,value:500}},Oe=["float32-renderable-webgl","texture-blend-float-webgl"],Fe={data:{props:["radiusPixels"]}};class R extends Z{getShaders(e){let t=[M];return e.modules&&(t=[...t,...e.modules]),super.getShaders({...e,modules:t})}initializeState(){super.initializeAggregationLayer(Fe),this.setState({colorDomain:B}),this._setupTextureParams(),this._setupAttributes(),this._setupResources()}shouldUpdateState({changeFlags:e}){return e.somethingChanged}updateState(e){super.updateState(e),this._updateHeatmapState(e)}_updateHeatmapState(e){const{props:t,oldProps:o}=e,s=this._getChangeFlags(e);if((s.dataChanged||s.viewportChanged)&&(s.boundsChanged=this._updateBounds(s.dataChanged),this._updateTextureRenderingBounds()),s.dataChanged||s.boundsChanged){if(clearTimeout(this.state.updateTimer),this.setState({isWeightMapDirty:!0}),s.dataChanged){const r=this.getShaders({vs:P,fs:_});this._createWeightsTransform(r)}}else s.viewportZoomChanged&&this._debouncedUpdateWeightmap();t.colorRange!==o.colorRange&&this._updateColorTexture(e),this.state.isWeightMapDirty&&this._updateWeightmap(),this.setState({zoom:e.context.viewport.zoom})}renderLayers(){const{weightsTexture:e,triPositionBuffer:t,triTexCoordBuffer:o,maxWeightsTexture:s,colorTexture:r,colorDomain:n}=this.state,{updateTriggers:c,intensity:a,threshold:l,aggregation:u}=this.props,g=this.getSubLayerClass("triangle",H);return new g(this.getSubLayerProps({id:"triangle-layer",updateTriggers:c}),{coordinateSystem:v.DEFAULT,data:{attributes:{positions:t,texCoords:o}},vertexCount:4,maxTexture:s,colorTexture:r,aggregationMode:ze[u]||0,weightsTexture:e,intensity:a,threshold:l,colorDomain:n})}finalizeState(e){super.finalizeState(e);const{weightsTransform:t,weightsTexture:o,maxWeightTransform:s,maxWeightsTexture:r,triPositionBuffer:n,triTexCoordBuffer:c,colorTexture:a,updateTimer:l}=this.state;t==null||t.destroy(),o==null||o.destroy(),s==null||s.destroy(),r==null||r.destroy(),n==null||n.destroy(),c==null||c.destroy(),a==null||a.destroy(),l&&clearTimeout(l)}_getAttributeManager(){return new k(this.context.device,{id:this.props.id,stats:this.context.stats})}_getChangeFlags(e){const t={},{dimensions:o}=this.state;t.dataChanged=this.isAttributeChanged()&&"attribute changed"||this.isAggregationDirty(e,{compareAll:!0,dimension:o.data})&&"aggregation is dirty",t.viewportChanged=e.changeFlags.viewportChanged;const{zoom:s}=this.state;return(!e.context.viewport||e.context.viewport.zoom!==s)&&(t.viewportZoomChanged=!0),t}_createTextures(){const{textureSize:e,format:t}=this.state;this.setState({weightsTexture:this.context.device.createTexture({...w,width:e,height:e,format:t}),maxWeightsTexture:this.context.device.createTexture({...w,width:1,height:1,format:t})})}_setupAttributes(){this.getAttributeManager().add({positions:{size:3,type:"float64",accessor:"getPosition"},weights:{size:1,accessor:"getWeight"}}),this.setState({positionAttributeName:"positions"})}_setupTextureParams(){const{device:e}=this.context,{weightsTextureSize:t}=this.props,o=Math.min(t,e.limits.maxTextureDimension2D),s=Oe.every(c=>e.features.has(c)),r=s?"rgba32float":"rgba8unorm",n=s?1:1/255;this.setState({textureSize:o,format:r,weightsScale:n}),s||ce.warn(`HeatmapLayer: ${this.id} rendering to float texture not supported, falling back to low precision format`)()}_createWeightsTransform(e){let{weightsTransform:t}=this.state;const{weightsTexture:o}=this.state,s=this.getAttributeManager();t==null||t.destroy(),t=new A(this.context.device,{id:`${this.id}-weights-transform`,bufferLayout:s.getBufferLayouts(),vertexCount:1,targetTexture:o,parameters:{depthWriteEnabled:!1,blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"},topology:"point-list",...e,modules:[...e.modules,De]}),this.setState({weightsTransform:t})}_setupResources(){this._createTextures();const{device:e}=this.context,{textureSize:t,weightsTexture:o,maxWeightsTexture:s}=this.state,r=this.getShaders({vs:P,fs:_});this._createWeightsTransform(r);const n=this.getShaders({vs:Le,fs:Re,modules:[Ee]}),c=new A(e,{id:`${this.id}-max-weights-transform`,targetTexture:s,...n,vertexCount:t*t,topology:"point-list",parameters:{depthWriteEnabled:!1,blendColorOperation:"max",blendAlphaOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}),a={inTexture:o,textureSize:t};c.model.shaderInputs.setProps({maxWeight:a}),this.setState({weightsTexture:o,maxWeightsTexture:s,maxWeightTransform:c,zoom:null,triPositionBuffer:e.createBuffer({byteLength:48}),triTexCoordBuffer:e.createBuffer({byteLength:48})})}updateShaders(e){this._createWeightsTransform({vs:P,fs:_,...e})}_updateMaxWeightValue(){const{maxWeightTransform:e}=this.state;e.run({parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]})}_updateBounds(e=!1){const{viewport:t}=this.context,o=[t.unproject([0,0]),t.unproject([t.width,0]),t.unproject([0,t.height]),t.unproject([t.width,t.height])].map(c=>c.map(Math.fround)),s=ye(o),r={visibleWorldBounds:s,viewportCorners:o};let n=!1;if(e||!this.state.worldBounds||!Se(this.state.worldBounds,s)){const c=this._worldToCommonBounds(s),a=this._commonToWorldBounds(c);this.props.coordinateSystem===v.LNGLAT&&(a[1]=Math.max(a[1],-85.051129),a[3]=Math.min(a[3],85.051129),a[0]=Math.max(a[0],-360),a[2]=Math.min(a[2],360));const l=this._worldToCommonBounds(a);r.worldBounds=a,r.normalizedCommonBounds=l,n=!0}return this.setState(r),n}_updateTextureRenderingBounds(){const{triPositionBuffer:e,triTexCoordBuffer:t,normalizedCommonBounds:o,viewportCorners:s}=this.state,{viewport:r}=this.context;e.write(I(s,3));const n=s.map(c=>Pe(r.projectPosition(c),o));t.write(I(n,2))}_updateColorTexture(e){const{colorRange:t}=e.props;let{colorTexture:o}=this.state;const s=de(t,!1,Uint8Array);o==null||o.destroy(),o=this.context.device.createTexture({...w,data:s,width:t.length,height:1}),this.setState({colorTexture:o})}_updateWeightmap(){const{radiusPixels:e,colorDomain:t,aggregation:o}=this.props,{worldBounds:s,textureSize:r,weightsScale:n,weightsTexture:c}=this.state,a=this.state.weightsTransform;this.state.isWeightMapDirty=!1;const l=this._worldToCommonBounds(s,{useLayerCoordinateSystem:!0});if(t&&o==="SUM"){const{viewport:J}=this.context,Y=J.distanceScales.metersPerUnit[2]*(l[2]-l[0])/r;this.state.colorDomain=t.map(Q=>Q*Y*n)}else this.state.colorDomain=t||B;const g=this.getAttributeManager().getAttributes(),d=this.getModuleSettings();this._setModelAttributes(a.model,g),a.model.setVertexCount(this.getNumInstances());const x={radiusPixels:e,commonBounds:l,textureWidth:r,weightsScale:n,weightsTexture:c},{viewport:m,devicePixelRatio:p,coordinateSystem:q,coordinateOrigin:K}=d,{modelMatrix:X}=this.props;a.model.shaderInputs.setProps({project:{viewport:m,devicePixelRatio:p,modelMatrix:X,coordinateSystem:q,coordinateOrigin:K},weight:x}),a.run({parameters:{viewport:[0,0,r,r]},clearColor:[0,0,0,0]}),this._updateMaxWeightValue()}_debouncedUpdateWeightmap(e=!1){let{updateTimer:t}=this.state;const{debounceTimeout:o}=this.props;e?(t=null,this._updateBounds(!0),this._updateTextureRenderingBounds(),this.setState({isWeightMapDirty:!0})):(this.setState({isWeightMapDirty:!1}),clearTimeout(t),t=setTimeout(this._debouncedUpdateWeightmap.bind(this,!0),o)),this.setState({updateTimer:t})}_worldToCommonBounds(e,t={}){const{useLayerCoordinateSystem:o=!1}=t,[s,r,n,c]=e,{viewport:a}=this.context,{textureSize:l}=this.state,{coordinateSystem:u}=this.props,g=o&&(u===v.LNGLAT_OFFSETS||u===v.METER_OFFSETS),d=g?a.projectPosition(this.props.coordinateOrigin):[0,0],x=l*Ie/a.scale;let m,p;return o&&!g?(m=this.projectPosition([s,r,0]),p=this.projectPosition([n,c,0])):(m=a.projectPosition([s,r,0]),p=a.projectPosition([n,c,0])),Te([m[0]-d[0],m[1]-d[1],p[0]-d[0],p[1]-d[1]],x,x)}_commonToWorldBounds(e){const[t,o,s,r]=e,{viewport:n}=this.context,c=n.unprojectPosition([t,o]),a=n.unprojectPosition([s,r]);return c.slice(0,2).concat(a.slice(0,2))}}R.layerName="HeatmapLayer";R.defaultProps=Be;function G(i=1e3){return Array.from({length:i},()=>({coordinates:[-122.4+(Math.random()-.5)*.4,37.8+(Math.random()-.5)*.4],value:Math.floor(Math.random()*100)+1}))}function We(){const i=[[-122.4194,37.7749],[-122.2712,37.8044],[-122.0308,37.3382],[-121.8853,37.3387]];return[{source:i[0],target:i[1]},{source:i[0],target:i[2]},{source:i[1],target:i[3]}]}let S=G();const je=We(),C=new V.Map({container:"map",style:"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",center:[-122.4,37.8],zoom:10});C.addControl(new V.NavigationControl,"top-right");const f=new le({layers:[]});C.on("load",()=>{C.addControl(f),$()});function T(i){var e;document.querySelectorAll(".controls button").forEach(t=>t.classList.remove("active")),(e=document.getElementById(i))==null||e.classList.add("active")}function $(){T("btn-scatter");const i=new ue({id:"scatterplot",data:S,pickable:!0,opacity:.8,stroked:!0,filled:!0,radiusMinPixels:3,radiusMaxPixels:30,getPosition:e=>e.coordinates,getRadius:e=>e.value*3,getFillColor:[255,140,0,200],getLineColor:[255,255,255,255]});f.setProps({layers:[i]})}function Ue(){T("btn-hexagon");const i=new he({id:"hexagon",data:S,pickable:!0,extruded:!0,radius:500,elevationScale:50,getPosition:e=>e.coordinates,colorRange:[[1,152,189],[73,227,206],[216,254,181],[254,237,177],[254,173,84],[209,55,78]]});f.setProps({layers:[i]})}function Ve(){T("btn-heatmap");const i=new R({id:"heatmap",data:S,radiusPixels:50,intensity:1,threshold:.05,getPosition:e=>e.coordinates,getWeight:e=>e.value});f.setProps({layers:[i]})}function Ne(){T("btn-arcs");const i=new L({id:"arcs",data:je,pickable:!0,getWidth:3,getSourcePosition:e=>e.source,getTargetPosition:e=>e.target,getSourceColor:[0,128,255,255],getTargetColor:[255,0,128,255]});f.setProps({layers:[i]})}function ke(){S=G();const i=document.querySelector(".controls button.active");i&&i.click()}var O;(O=document.getElementById("btn-scatter"))==null||O.addEventListener("click",$);var F;(F=document.getElementById("btn-hexagon"))==null||F.addEventListener("click",Ue);var W;(W=document.getElementById("btn-heatmap"))==null||W.addEventListener("click",Ve);var j;(j=document.getElementById("btn-arcs"))==null||j.addEventListener("click",Ne);var U;(U=document.getElementById("btn-regenerate"))==null||U.addEventListener("click",ke);
