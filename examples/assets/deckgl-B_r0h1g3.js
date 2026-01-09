var J=Object.defineProperty;var X=(r,t,e)=>t in r?J(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var h=(r,t,e)=>X(r,typeof t!="symbol"?t+"":t,e);import"./modulepreload-polyfill-B5Qt9EMX.js";import{m as F}from"./maplibre-gl-BTjYUjN0.js";import{J as R,a2 as Y,a3 as Q,L as tt,H as O,a4 as et,a5 as j,N as y,K as ot,a1 as st}from"./mapbox-overlay-CcF19Pc8.js";import{C as rt,S as it}from"./polygon-utils-DnOoNwHd.js";import{c as at,d as nt,H as ct}from"./hexagon-layer-DwnnlNH1.js";import{A as ut}from"./arc-layer-DeZueGaL.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./geometry-B-6Jnco5.js";const lt="transform_output";class _{constructor(t,e){h(this,"device");h(this,"model");h(this,"sampler");h(this,"currentIndex",0);h(this,"samplerTextureMap",null);h(this,"bindings",[]);h(this,"resources",{});this.device=t,this.sampler=t.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}),this.model=new R(this.device,{id:e.id||Q("texture-transform-model"),fs:e.fs||Y({input:e.targetTextureVarying,inputChannels:e.targetTextureChannels,output:lt}),vertexCount:e.vertexCount,...e}),this._initialize(e),Object.seal(this)}destroy(){var t;this.model.destroy();for(const e of this.bindings)(t=e.framebuffer)==null||t.destroy()}delete(){this.destroy()}run(t){const{framebuffer:e}=this.bindings[this.currentIndex],o=this.device.beginRenderPass({framebuffer:e,...t});this.model.draw(o),o.end(),this.device.submit()}getTargetTexture(){const{targetTexture:t}=this.bindings[this.currentIndex];return t}getFramebuffer(){return this.bindings[this.currentIndex].framebuffer}_initialize(t){this._updateBindings(t)}_updateBindings(t){this.bindings[this.currentIndex]=this._updateBinding(this.bindings[this.currentIndex],t)}_updateBinding(t,{sourceBuffers:e,sourceTextures:o,targetTexture:s}){if(t||(t={sourceBuffers:{},sourceTextures:{},targetTexture:null}),Object.assign(t.sourceTextures,o),Object.assign(t.sourceBuffers,e),s){t.targetTexture=s;const{width:i,height:n}=s;t.framebuffer&&t.framebuffer.destroy(),t.framebuffer=this.device.createFramebuffer({id:"transform-framebuffer",width:i,height:n,colorAttachments:[s]}),t.framebuffer.resize({width:i,height:n})}return t}_setSourceTextureParameters(){const t=this.currentIndex,{sourceTextures:e}=this.bindings[t];for(const o in e)e[o].sampler=this.sampler}}function dt(r){const t=r.map(c=>c[0]),e=r.map(c=>c[1]),o=Math.min.apply(null,t),s=Math.max.apply(null,t),i=Math.min.apply(null,e),n=Math.max.apply(null,e);return[o,i,s,n]}function gt(r,t){return t[0]>=r[0]&&t[2]<=r[2]&&t[1]>=r[1]&&t[3]<=r[3]}const P=new Float32Array(12);function A(r,t=2){let e=0;for(const o of r)for(let s=0;s<t;s++)P[e++]=o[s]||0;return P}function ht(r,t,e){const[o,s,i,n]=r,c=i-o,a=n-s;let u=c,g=a;c/a<t/e?u=t/e*a:g=e/t*c,u<t&&(u=t,g=e);const d=(i+o)/2,l=(n+s)/2;return[d-u/2,l-g/2,d+u/2,l+g/2]}function mt(r,t){const[e,o,s,i]=t;return[(r[0]-e)/(s-e),(r[1]-o)/(i-o)]}const pt=`#version 300 es
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
`,ft=`#version 300 es
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
`,L=`uniform triangleUniforms {
  float aggregationMode;
  vec2 colorDomain;
  float intensity;
  float threshold;
} triangle;
`,xt={name:"triangle",vs:L,fs:L,uniformTypes:{aggregationMode:"f32",colorDomain:"vec2<f32>",intensity:"f32",threshold:"f32"}};class U extends tt{getShaders(){return super.getShaders({vs:pt,fs:ft,modules:[O,xt]})}initializeState({device:t}){this.setState({model:this._getModel(t)})}_getModel(t){const{vertexCount:e,data:o}=this.props;return new R(t,{...this.getShaders(),id:this.props.id,attributes:o.attributes,bufferLayout:[{name:"positions",format:"float32x3"},{name:"texCoords",format:"float32x2"}],topology:"triangle-strip",vertexCount:e})}draw(){const{model:t}=this.state,{aggregationMode:e,colorDomain:o,intensity:s,threshold:i,colorTexture:n,maxTexture:c,weightsTexture:a}=this.props,u={aggregationMode:e,colorDomain:o,intensity:s,threshold:i,colorTexture:n,maxTexture:c,weightsTexture:a};t.shaderInputs.setProps({triangle:u}),t.draw(this.context.renderPass)}}U.layerName="TriangleLayer";function yt(r,t){const e={};for(const o in r)t.includes(o)||(e[o]=r[o]);return e}class N extends rt{initializeAggregationLayer(t){super.initializeState(this.context),this.setState({ignoreProps:yt(this.constructor._propTypes,t.data.props),dimensions:t})}updateState(t){super.updateState(t);const{changeFlags:e}=t;if(e.extensionsChanged){const o=this.getShaders({});o&&o.defines&&(o.defines.NON_INSTANCED_MODEL=1),this.updateShaders(o)}this._updateAttributes()}updateAttributes(t){this.setState({changedAttributes:t})}getAttributes(){return this.getAttributeManager().getAttributes()}getModuleSettings(){const{viewport:t,mousePosition:e,device:o}=this.context;return Object.assign(Object.create(this.props),{viewport:t,mousePosition:e,picking:{isActive:0},devicePixelRatio:o.canvasContext.cssToDeviceRatio()})}updateShaders(t){}isAggregationDirty(t,e={}){const{props:o,oldProps:s,changeFlags:i}=t,{compareAll:n=!1,dimension:c}=e,{ignoreProps:a}=this.state,{props:u,accessors:g=[]}=c,{updateTriggersChanged:d}=i;if(i.dataChanged)return!0;if(d){if(d.all)return!0;for(const l of g)if(d[l])return!0}if(n)return i.extensionsChanged?!0:et({oldProps:s,newProps:o,ignoreProps:a,propTypes:this.constructor._propTypes});for(const l of u)if(o[l]!==s[l])return!0;return!1}isAttributeChanged(t){const{changedAttributes:e}=this.state;return t?e&&e[t]!==void 0:!vt(e)}_getAttributeManager(){return new j(this.context.device,{id:this.props.id,stats:this.context.stats})}}N.layerName="AggregationLayer";function vt(r){let t=!0;for(const e in r){t=!1;break}return t}const w=`#version 300 es
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
`,S=`#version 300 es
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
`,Tt=`#version 300 es
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
`,wt=`#version 300 es
in vec4 outTexture;
out vec4 fragColor;
void main() {
fragColor = outTexture;
fragColor.g = outTexture.r / max(1.0, outTexture.a);
}
`,St=`uniform weightUniforms {
  vec4 commonBounds;
  float radiusPixels;
  float textureWidth;
  float weightsScale;
} weight;
`,bt={name:"weight",vs:St,uniformTypes:{commonBounds:"vec4<f32>",radiusPixels:"f32",textureWidth:"f32",weightsScale:"f32"}},Ct={name:"maxWeight",vs:`uniform maxWeightUniforms {
  float textureSize;
} maxWeight;
`,uniformTypes:{textureSize:"f32"}},Mt=2,b={format:"rgba8unorm",dimension:"2d",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}},B=[0,0],_t={SUM:0,MEAN:1},Pt={getPosition:{type:"accessor",value:r=>r.position},getWeight:{type:"accessor",value:1},intensity:{type:"number",min:0,value:1},radiusPixels:{type:"number",min:1,max:100,value:50},colorRange:nt,threshold:{type:"number",min:0,max:1,value:.05},colorDomain:{type:"array",value:null,optional:!0},aggregation:"SUM",weightsTextureSize:{type:"number",min:128,max:2048,value:2048},debounceTimeout:{type:"number",min:0,max:1e3,value:500}},At=["float32-renderable-webgl","texture-blend-float-webgl"],Lt={data:{props:["radiusPixels"]}};class M extends N{getShaders(t){let e=[O];return t.modules&&(e=[...e,...t.modules]),super.getShaders({...t,modules:e})}initializeState(){super.initializeAggregationLayer(Lt),this.setState({colorDomain:B}),this._setupTextureParams(),this._setupAttributes(),this._setupResources()}shouldUpdateState({changeFlags:t}){return t.somethingChanged}updateState(t){super.updateState(t),this._updateHeatmapState(t)}_updateHeatmapState(t){const{props:e,oldProps:o}=t,s=this._getChangeFlags(t);if((s.dataChanged||s.viewportChanged)&&(s.boundsChanged=this._updateBounds(s.dataChanged),this._updateTextureRenderingBounds()),s.dataChanged||s.boundsChanged){if(clearTimeout(this.state.updateTimer),this.setState({isWeightMapDirty:!0}),s.dataChanged){const i=this.getShaders({vs:w,fs:S});this._createWeightsTransform(i)}}else s.viewportZoomChanged&&this._debouncedUpdateWeightmap();e.colorRange!==o.colorRange&&this._updateColorTexture(t),this.state.isWeightMapDirty&&this._updateWeightmap(),this.setState({zoom:t.context.viewport.zoom})}renderLayers(){const{weightsTexture:t,triPositionBuffer:e,triTexCoordBuffer:o,maxWeightsTexture:s,colorTexture:i,colorDomain:n}=this.state,{updateTriggers:c,intensity:a,threshold:u,aggregation:g}=this.props,d=this.getSubLayerClass("triangle",U);return new d(this.getSubLayerProps({id:"triangle-layer",updateTriggers:c}),{coordinateSystem:y.DEFAULT,data:{attributes:{positions:e,texCoords:o}},vertexCount:4,maxTexture:s,colorTexture:i,aggregationMode:_t[g]||0,weightsTexture:t,intensity:a,threshold:u,colorDomain:n})}finalizeState(t){super.finalizeState(t);const{weightsTransform:e,weightsTexture:o,maxWeightTransform:s,maxWeightsTexture:i,triPositionBuffer:n,triTexCoordBuffer:c,colorTexture:a,updateTimer:u}=this.state;e==null||e.destroy(),o==null||o.destroy(),s==null||s.destroy(),i==null||i.destroy(),n==null||n.destroy(),c==null||c.destroy(),a==null||a.destroy(),u&&clearTimeout(u)}_getAttributeManager(){return new j(this.context.device,{id:this.props.id,stats:this.context.stats})}_getChangeFlags(t){const e={},{dimensions:o}=this.state;e.dataChanged=this.isAttributeChanged()&&"attribute changed"||this.isAggregationDirty(t,{compareAll:!0,dimension:o.data})&&"aggregation is dirty",e.viewportChanged=t.changeFlags.viewportChanged;const{zoom:s}=this.state;return(!t.context.viewport||t.context.viewport.zoom!==s)&&(e.viewportZoomChanged=!0),e}_createTextures(){const{textureSize:t,format:e}=this.state;this.setState({weightsTexture:this.context.device.createTexture({...b,width:t,height:t,format:e}),maxWeightsTexture:this.context.device.createTexture({...b,width:1,height:1,format:e})})}_setupAttributes(){this.getAttributeManager().add({positions:{size:3,type:"float64",accessor:"getPosition"},weights:{size:1,accessor:"getWeight"}}),this.setState({positionAttributeName:"positions"})}_setupTextureParams(){const{device:t}=this.context,{weightsTextureSize:e}=this.props,o=Math.min(e,t.limits.maxTextureDimension2D),s=At.every(c=>t.features.has(c)),i=s?"rgba32float":"rgba8unorm",n=s?1:1/255;this.setState({textureSize:o,format:i,weightsScale:n}),s||ot.warn(`HeatmapLayer: ${this.id} rendering to float texture not supported, falling back to low precision format`)()}_createWeightsTransform(t){let{weightsTransform:e}=this.state;const{weightsTexture:o}=this.state,s=this.getAttributeManager();e==null||e.destroy(),e=new _(this.context.device,{id:`${this.id}-weights-transform`,bufferLayout:s.getBufferLayouts(),vertexCount:1,targetTexture:o,parameters:{depthWriteEnabled:!1,blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"},topology:"point-list",...t,modules:[...t.modules,bt]}),this.setState({weightsTransform:e})}_setupResources(){this._createTextures();const{device:t}=this.context,{textureSize:e,weightsTexture:o,maxWeightsTexture:s}=this.state,i=this.getShaders({vs:w,fs:S});this._createWeightsTransform(i);const n=this.getShaders({vs:Tt,fs:wt,modules:[Ct]}),c=new _(t,{id:`${this.id}-max-weights-transform`,targetTexture:s,...n,vertexCount:e*e,topology:"point-list",parameters:{depthWriteEnabled:!1,blendColorOperation:"max",blendAlphaOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}),a={inTexture:o,textureSize:e};c.model.shaderInputs.setProps({maxWeight:a}),this.setState({weightsTexture:o,maxWeightsTexture:s,maxWeightTransform:c,zoom:null,triPositionBuffer:t.createBuffer({byteLength:48}),triTexCoordBuffer:t.createBuffer({byteLength:48})})}updateShaders(t){this._createWeightsTransform({vs:w,fs:S,...t})}_updateMaxWeightValue(){const{maxWeightTransform:t}=this.state;t.run({parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]})}_updateBounds(t=!1){const{viewport:e}=this.context,o=[e.unproject([0,0]),e.unproject([e.width,0]),e.unproject([0,e.height]),e.unproject([e.width,e.height])].map(c=>c.map(Math.fround)),s=dt(o),i={visibleWorldBounds:s,viewportCorners:o};let n=!1;if(t||!this.state.worldBounds||!gt(this.state.worldBounds,s)){const c=this._worldToCommonBounds(s),a=this._commonToWorldBounds(c);this.props.coordinateSystem===y.LNGLAT&&(a[1]=Math.max(a[1],-85.051129),a[3]=Math.min(a[3],85.051129),a[0]=Math.max(a[0],-360),a[2]=Math.min(a[2],360));const u=this._worldToCommonBounds(a);i.worldBounds=a,i.normalizedCommonBounds=u,n=!0}return this.setState(i),n}_updateTextureRenderingBounds(){const{triPositionBuffer:t,triTexCoordBuffer:e,normalizedCommonBounds:o,viewportCorners:s}=this.state,{viewport:i}=this.context;t.write(A(s,3));const n=s.map(c=>mt(i.projectPosition(c),o));e.write(A(n,2))}_updateColorTexture(t){const{colorRange:e}=t.props;let{colorTexture:o}=this.state;const s=at(e,!1,Uint8Array);o==null||o.destroy(),o=this.context.device.createTexture({...b,data:s,width:e.length,height:1}),this.setState({colorTexture:o})}_updateWeightmap(){const{radiusPixels:t,colorDomain:e,aggregation:o}=this.props,{worldBounds:s,textureSize:i,weightsScale:n,weightsTexture:c}=this.state,a=this.state.weightsTransform;this.state.isWeightMapDirty=!1;const u=this._worldToCommonBounds(s,{useLayerCoordinateSystem:!0});if(e&&o==="SUM"){const{viewport:$}=this.context,q=$.distanceScales.metersPerUnit[2]*(u[2]-u[0])/i;this.state.colorDomain=e.map(Z=>Z*q*n)}else this.state.colorDomain=e||B;const d=this.getAttributeManager().getAttributes(),l=this.getModuleSettings();this._setModelAttributes(a.model,d),a.model.setVertexCount(this.getNumInstances());const x={radiusPixels:t,commonBounds:u,textureWidth:i,weightsScale:n,weightsTexture:c},{viewport:m,devicePixelRatio:p,coordinateSystem:H,coordinateOrigin:G}=l,{modelMatrix:K}=this.props;a.model.shaderInputs.setProps({project:{viewport:m,devicePixelRatio:p,modelMatrix:K,coordinateSystem:H,coordinateOrigin:G},weight:x}),a.run({parameters:{viewport:[0,0,i,i]},clearColor:[0,0,0,0]}),this._updateMaxWeightValue()}_debouncedUpdateWeightmap(t=!1){let{updateTimer:e}=this.state;const{debounceTimeout:o}=this.props;t?(e=null,this._updateBounds(!0),this._updateTextureRenderingBounds(),this.setState({isWeightMapDirty:!0})):(this.setState({isWeightMapDirty:!1}),clearTimeout(e),e=setTimeout(this._debouncedUpdateWeightmap.bind(this,!0),o)),this.setState({updateTimer:e})}_worldToCommonBounds(t,e={}){const{useLayerCoordinateSystem:o=!1}=e,[s,i,n,c]=t,{viewport:a}=this.context,{textureSize:u}=this.state,{coordinateSystem:g}=this.props,d=o&&(g===y.LNGLAT_OFFSETS||g===y.METER_OFFSETS),l=d?a.projectPosition(this.props.coordinateOrigin):[0,0],x=u*Mt/a.scale;let m,p;return o&&!d?(m=this.projectPosition([s,i,0]),p=this.projectPosition([n,c,0])):(m=a.projectPosition([s,i,0]),p=a.projectPosition([n,c,0])),ht([m[0]-l[0],m[1]-l[1],p[0]-l[0],p[1]-l[1]],x,x)}_commonToWorldBounds(t){const[e,o,s,i]=t,{viewport:n}=this.context,c=n.unprojectPosition([e,o]),a=n.unprojectPosition([s,i]);return c.slice(0,2).concat(a.slice(0,2))}}M.layerName="HeatmapLayer";M.defaultProps=Pt;function k(r=1e3){return Array.from({length:r},()=>({coordinates:[-122.4+(Math.random()-.5)*.4,37.8+(Math.random()-.5)*.4],value:Math.floor(Math.random()*100)+1}))}function Bt(){const r=[[-122.4194,37.7749],[-122.2712,37.8044],[-122.0308,37.3382],[-121.8853,37.3387]];return[{source:r[0],target:r[1]},{source:r[0],target:r[2]},{source:r[1],target:r[3]}]}let v=k();const Dt=Bt(),C=new F.Map({container:"map",style:"https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",center:[-122.4,37.8],zoom:10});C.addControl(new F.NavigationControl,"top-right");const f=new st({layers:[]});C.on("load",()=>{C.addControl(f),V()});function T(r){var t;document.querySelectorAll(".controls button").forEach(e=>e.classList.remove("active")),(t=document.getElementById(r))==null||t.classList.add("active")}function V(){T("btn-scatter");const r=new it({id:"scatterplot",data:v,pickable:!0,opacity:.8,stroked:!0,filled:!0,radiusMinPixels:3,radiusMaxPixels:30,getPosition:t=>t.coordinates,getRadius:t=>t.value*3,getFillColor:[255,140,0,200],getLineColor:[255,255,255,255]});f.setProps({layers:[r]})}function Wt(){T("btn-hexagon");const r=new ct({id:"hexagon",data:v,pickable:!0,extruded:!0,radius:500,elevationScale:50,getPosition:t=>t.coordinates,colorRange:[[1,152,189],[73,227,206],[216,254,181],[254,237,177],[254,173,84],[209,55,78]]});f.setProps({layers:[r]})}function Et(){T("btn-heatmap");const r=new M({id:"heatmap",data:v,radiusPixels:50,intensity:1,threshold:.05,getPosition:t=>t.coordinates,getWeight:t=>t.value});f.setProps({layers:[r]})}function It(){T("btn-arcs");const r=new ut({id:"arcs",data:Dt,pickable:!0,getWidth:3,getSourcePosition:t=>t.source,getTargetPosition:t=>t.target,getSourceColor:[0,128,255,255],getTargetColor:[255,0,128,255]});f.setProps({layers:[r]})}function zt(){v=k();const r=document.querySelector(".controls button.active");r&&r.click()}var D;(D=document.getElementById("btn-scatter"))==null||D.addEventListener("click",V);var W;(W=document.getElementById("btn-hexagon"))==null||W.addEventListener("click",Wt);var E;(E=document.getElementById("btn-heatmap"))==null||E.addEventListener("click",Et);var I;(I=document.getElementById("btn-arcs"))==null||I.addEventListener("click",It);var z;(z=document.getElementById("btn-regenerate"))==null||z.addEventListener("click",zt);
