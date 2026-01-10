var O=Object.defineProperty;var U=(u,t,e)=>t in u?O(u,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):u[t]=e;var g=(u,t,e)=>U(u,typeof t!="symbol"?t+"":t,e);import{o as M,ax as j,K as N,H as V,I as P,ay as H,aw as A,C as x,d as k}from"./mapbox-overlay-CtMyNbGZ.js";import{C as G}from"./composite-layer-D5nYxRM9.js";import{a as K,d as $}from"./color-utils-CH0udO2m.js";const Z="transform_output";class w{constructor(t,e){g(this,"device");g(this,"model");g(this,"sampler");g(this,"currentIndex",0);g(this,"samplerTextureMap",null);g(this,"bindings",[]);g(this,"resources",{});this.device=t,this.sampler=t.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}),this.model=new M(this.device,{id:e.id||N("texture-transform-model"),fs:e.fs||j({input:e.targetTextureVarying,inputChannels:e.targetTextureChannels,output:Z}),vertexCount:e.vertexCount,...e}),this._initialize(e),Object.seal(this)}destroy(){var t;this.model.destroy();for(const e of this.bindings)(t=e.framebuffer)==null||t.destroy()}delete(){this.destroy()}run(t){const{framebuffer:e}=this.bindings[this.currentIndex],o=this.device.beginRenderPass({framebuffer:e,...t});this.model.draw(o),o.end(),this.device.submit()}getTargetTexture(){const{targetTexture:t}=this.bindings[this.currentIndex];return t}getFramebuffer(){return this.bindings[this.currentIndex].framebuffer}_initialize(t){this._updateBindings(t)}_updateBindings(t){this.bindings[this.currentIndex]=this._updateBinding(this.bindings[this.currentIndex],t)}_updateBinding(t,{sourceBuffers:e,sourceTextures:o,targetTexture:s}){if(t||(t={sourceBuffers:{},sourceTextures:{},targetTexture:null}),Object.assign(t.sourceTextures,o),Object.assign(t.sourceBuffers,e),s){t.targetTexture=s;const{width:i,height:a}=s;t.framebuffer&&t.framebuffer.destroy(),t.framebuffer=this.device.createFramebuffer({id:"transform-framebuffer",width:i,height:a,colorAttachments:[s]}),t.framebuffer.resize({width:i,height:a})}return t}_setSourceTextureParameters(){const t=this.currentIndex,{sourceTextures:e}=this.bindings[t];for(const o in e)e[o].sampler=this.sampler}}function X(u){const t=u.map(n=>n[0]),e=u.map(n=>n[1]),o=Math.min.apply(null,t),s=Math.max.apply(null,t),i=Math.min.apply(null,e),a=Math.max.apply(null,e);return[o,i,s,a]}function Y(u,t){return t[0]>=u[0]&&t[2]<=u[2]&&t[1]>=u[1]&&t[3]<=u[3]}const S=new Float32Array(12);function C(u,t=2){let e=0;for(const o of u)for(let s=0;s<t;s++)S[e++]=o[s]||0;return S}function q(u,t,e){const[o,s,i,a]=u,n=i-o,r=a-s;let c=n,h=r;n/r<t/e?c=t/e*r:h=e/t*n,c<t&&(c=t,h=e);const l=(i+o)/2,d=(a+s)/2;return[l-c/2,d-h/2,l+c/2,d+h/2]}function J(u,t){const[e,o,s,i]=t;return[(u[0]-e)/(s-e),(u[1]-o)/(i-o)]}const Q=`#version 300 es
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
`,tt=`#version 300 es
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
`,b=`uniform triangleUniforms {
  float aggregationMode;
  vec2 colorDomain;
  float intensity;
  float threshold;
} triangle;
`,et={name:"triangle",vs:b,fs:b,uniformTypes:{aggregationMode:"f32",colorDomain:"vec2<f32>",intensity:"f32",threshold:"f32"}};class L extends V{getShaders(){return super.getShaders({vs:Q,fs:tt,modules:[P,et]})}initializeState({device:t}){this.setState({model:this._getModel(t)})}_getModel(t){const{vertexCount:e,data:o}=this.props;return new M(t,{...this.getShaders(),id:this.props.id,attributes:o.attributes,bufferLayout:[{name:"positions",format:"float32x3"},{name:"texCoords",format:"float32x2"}],topology:"triangle-strip",vertexCount:e})}draw(){const{model:t}=this.state,{aggregationMode:e,colorDomain:o,intensity:s,threshold:i,colorTexture:a,maxTexture:n,weightsTexture:r}=this.props,c={aggregationMode:e,colorDomain:o,intensity:s,threshold:i,colorTexture:a,maxTexture:n,weightsTexture:r};t.shaderInputs.setProps({triangle:c}),t.draw(this.context.renderPass)}}L.layerName="TriangleLayer";function ot(u,t){const e={};for(const o in u)t.includes(o)||(e[o]=u[o]);return e}class D extends G{initializeAggregationLayer(t){super.initializeState(this.context),this.setState({ignoreProps:ot(this.constructor._propTypes,t.data.props),dimensions:t})}updateState(t){super.updateState(t);const{changeFlags:e}=t;if(e.extensionsChanged){const o=this.getShaders({});o&&o.defines&&(o.defines.NON_INSTANCED_MODEL=1),this.updateShaders(o)}this._updateAttributes()}updateAttributes(t){this.setState({changedAttributes:t})}getAttributes(){return this.getAttributeManager().getAttributes()}getModuleSettings(){const{viewport:t,mousePosition:e,device:o}=this.context;return Object.assign(Object.create(this.props),{viewport:t,mousePosition:e,picking:{isActive:0},devicePixelRatio:o.canvasContext.cssToDeviceRatio()})}updateShaders(t){}isAggregationDirty(t,e={}){const{props:o,oldProps:s,changeFlags:i}=t,{compareAll:a=!1,dimension:n}=e,{ignoreProps:r}=this.state,{props:c,accessors:h=[]}=n,{updateTriggersChanged:l}=i;if(i.dataChanged)return!0;if(l){if(l.all)return!0;for(const d of h)if(l[d])return!0}if(a)return i.extensionsChanged?!0:H({oldProps:s,newProps:o,ignoreProps:r,propTypes:this.constructor._propTypes});for(const d of c)if(o[d]!==s[d])return!0;return!1}isAttributeChanged(t){const{changedAttributes:e}=this.state;return t?e&&e[t]!==void 0:!st(e)}_getAttributeManager(){return new A(this.context.device,{id:this.props.id,stats:this.context.stats})}}D.layerName="AggregationLayer";function st(u){let t=!0;for(const e in u){t=!1;break}return t}const T=`#version 300 es
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
`,y=`#version 300 es
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
`,it=`#version 300 es
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
`,rt=`#version 300 es
in vec4 outTexture;
out vec4 fragColor;
void main() {
fragColor = outTexture;
fragColor.g = outTexture.r / max(1.0, outTexture.a);
}
`,at=`uniform weightUniforms {
  vec4 commonBounds;
  float radiusPixels;
  float textureWidth;
  float weightsScale;
} weight;
`,nt={name:"weight",vs:at,uniformTypes:{commonBounds:"vec4<f32>",radiusPixels:"f32",textureWidth:"f32",weightsScale:"f32"}},ut={name:"maxWeight",vs:`uniform maxWeightUniforms {
  float textureSize;
} maxWeight;
`,uniformTypes:{textureSize:"f32"}},ct=2,v={format:"rgba8unorm",dimension:"2d",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}},_=[0,0],dt={SUM:0,MEAN:1},lt={getPosition:{type:"accessor",value:u=>u.position},getWeight:{type:"accessor",value:1},intensity:{type:"number",min:0,value:1},radiusPixels:{type:"number",min:1,max:100,value:50},colorRange:$,threshold:{type:"number",min:0,max:1,value:.05},colorDomain:{type:"array",value:null,optional:!0},aggregation:"SUM",weightsTextureSize:{type:"number",min:128,max:2048,value:2048},debounceTimeout:{type:"number",min:0,max:1e3,value:500}},ht=["float32-renderable-webgl","texture-blend-float-webgl"],gt={data:{props:["radiusPixels"]}};class W extends D{getShaders(t){let e=[P];return t.modules&&(e=[...e,...t.modules]),super.getShaders({...t,modules:e})}initializeState(){super.initializeAggregationLayer(gt),this.setState({colorDomain:_}),this._setupTextureParams(),this._setupAttributes(),this._setupResources()}shouldUpdateState({changeFlags:t}){return t.somethingChanged}updateState(t){super.updateState(t),this._updateHeatmapState(t)}_updateHeatmapState(t){const{props:e,oldProps:o}=t,s=this._getChangeFlags(t);if((s.dataChanged||s.viewportChanged)&&(s.boundsChanged=this._updateBounds(s.dataChanged),this._updateTextureRenderingBounds()),s.dataChanged||s.boundsChanged){if(clearTimeout(this.state.updateTimer),this.setState({isWeightMapDirty:!0}),s.dataChanged){const i=this.getShaders({vs:T,fs:y});this._createWeightsTransform(i)}}else s.viewportZoomChanged&&this._debouncedUpdateWeightmap();e.colorRange!==o.colorRange&&this._updateColorTexture(t),this.state.isWeightMapDirty&&this._updateWeightmap(),this.setState({zoom:t.context.viewport.zoom})}renderLayers(){const{weightsTexture:t,triPositionBuffer:e,triTexCoordBuffer:o,maxWeightsTexture:s,colorTexture:i,colorDomain:a}=this.state,{updateTriggers:n,intensity:r,threshold:c,aggregation:h}=this.props,l=this.getSubLayerClass("triangle",L);return new l(this.getSubLayerProps({id:"triangle-layer",updateTriggers:n}),{coordinateSystem:x.DEFAULT,data:{attributes:{positions:e,texCoords:o}},vertexCount:4,maxTexture:s,colorTexture:i,aggregationMode:dt[h]||0,weightsTexture:t,intensity:r,threshold:c,colorDomain:a})}finalizeState(t){super.finalizeState(t);const{weightsTransform:e,weightsTexture:o,maxWeightTransform:s,maxWeightsTexture:i,triPositionBuffer:a,triTexCoordBuffer:n,colorTexture:r,updateTimer:c}=this.state;e==null||e.destroy(),o==null||o.destroy(),s==null||s.destroy(),i==null||i.destroy(),a==null||a.destroy(),n==null||n.destroy(),r==null||r.destroy(),c&&clearTimeout(c)}_getAttributeManager(){return new A(this.context.device,{id:this.props.id,stats:this.context.stats})}_getChangeFlags(t){const e={},{dimensions:o}=this.state;e.dataChanged=this.isAttributeChanged()&&"attribute changed"||this.isAggregationDirty(t,{compareAll:!0,dimension:o.data})&&"aggregation is dirty",e.viewportChanged=t.changeFlags.viewportChanged;const{zoom:s}=this.state;return(!t.context.viewport||t.context.viewport.zoom!==s)&&(e.viewportZoomChanged=!0),e}_createTextures(){const{textureSize:t,format:e}=this.state;this.setState({weightsTexture:this.context.device.createTexture({...v,width:t,height:t,format:e}),maxWeightsTexture:this.context.device.createTexture({...v,width:1,height:1,format:e})})}_setupAttributes(){this.getAttributeManager().add({positions:{size:3,type:"float64",accessor:"getPosition"},weights:{size:1,accessor:"getWeight"}}),this.setState({positionAttributeName:"positions"})}_setupTextureParams(){const{device:t}=this.context,{weightsTextureSize:e}=this.props,o=Math.min(e,t.limits.maxTextureDimension2D),s=ht.every(n=>t.features.has(n)),i=s?"rgba32float":"rgba8unorm",a=s?1:1/255;this.setState({textureSize:o,format:i,weightsScale:a}),s||k.warn(`HeatmapLayer: ${this.id} rendering to float texture not supported, falling back to low precision format`)()}_createWeightsTransform(t){let{weightsTransform:e}=this.state;const{weightsTexture:o}=this.state,s=this.getAttributeManager();e==null||e.destroy(),e=new w(this.context.device,{id:`${this.id}-weights-transform`,bufferLayout:s.getBufferLayouts(),vertexCount:1,targetTexture:o,parameters:{depthWriteEnabled:!1,blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"},topology:"point-list",...t,modules:[...t.modules,nt]}),this.setState({weightsTransform:e})}_setupResources(){this._createTextures();const{device:t}=this.context,{textureSize:e,weightsTexture:o,maxWeightsTexture:s}=this.state,i=this.getShaders({vs:T,fs:y});this._createWeightsTransform(i);const a=this.getShaders({vs:it,fs:rt,modules:[ut]}),n=new w(t,{id:`${this.id}-max-weights-transform`,targetTexture:s,...a,vertexCount:e*e,topology:"point-list",parameters:{depthWriteEnabled:!1,blendColorOperation:"max",blendAlphaOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}),r={inTexture:o,textureSize:e};n.model.shaderInputs.setProps({maxWeight:r}),this.setState({weightsTexture:o,maxWeightsTexture:s,maxWeightTransform:n,zoom:null,triPositionBuffer:t.createBuffer({byteLength:48}),triTexCoordBuffer:t.createBuffer({byteLength:48})})}updateShaders(t){this._createWeightsTransform({vs:T,fs:y,...t})}_updateMaxWeightValue(){const{maxWeightTransform:t}=this.state;t.run({parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]})}_updateBounds(t=!1){const{viewport:e}=this.context,o=[e.unproject([0,0]),e.unproject([e.width,0]),e.unproject([0,e.height]),e.unproject([e.width,e.height])].map(n=>n.map(Math.fround)),s=X(o),i={visibleWorldBounds:s,viewportCorners:o};let a=!1;if(t||!this.state.worldBounds||!Y(this.state.worldBounds,s)){const n=this._worldToCommonBounds(s),r=this._commonToWorldBounds(n);this.props.coordinateSystem===x.LNGLAT&&(r[1]=Math.max(r[1],-85.051129),r[3]=Math.min(r[3],85.051129),r[0]=Math.max(r[0],-360),r[2]=Math.min(r[2],360));const c=this._worldToCommonBounds(r);i.worldBounds=r,i.normalizedCommonBounds=c,a=!0}return this.setState(i),a}_updateTextureRenderingBounds(){const{triPositionBuffer:t,triTexCoordBuffer:e,normalizedCommonBounds:o,viewportCorners:s}=this.state,{viewport:i}=this.context;t.write(C(s,3));const a=s.map(n=>J(i.projectPosition(n),o));e.write(C(a,2))}_updateColorTexture(t){const{colorRange:e}=t.props;let{colorTexture:o}=this.state;const s=K(e,!1,Uint8Array);o==null||o.destroy(),o=this.context.device.createTexture({...v,data:s,width:e.length,height:1}),this.setState({colorTexture:o})}_updateWeightmap(){const{radiusPixels:t,colorDomain:e,aggregation:o}=this.props,{worldBounds:s,textureSize:i,weightsScale:a,weightsTexture:n}=this.state,r=this.state.weightsTransform;this.state.isWeightMapDirty=!1;const c=this._worldToCommonBounds(s,{useLayerCoordinateSystem:!0});if(e&&o==="SUM"){const{viewport:I}=this.context,R=I.distanceScales.metersPerUnit[2]*(c[2]-c[0])/i;this.state.colorDomain=e.map(E=>E*R*a)}else this.state.colorDomain=e||_;const l=this.getAttributeManager().getAttributes(),d=this.getModuleSettings();this._setModelAttributes(r.model,l),r.model.setVertexCount(this.getNumInstances());const f={radiusPixels:t,commonBounds:c,textureWidth:i,weightsScale:a,weightsTexture:n},{viewport:m,devicePixelRatio:p,coordinateSystem:B,coordinateOrigin:z}=d,{modelMatrix:F}=this.props;r.model.shaderInputs.setProps({project:{viewport:m,devicePixelRatio:p,modelMatrix:F,coordinateSystem:B,coordinateOrigin:z},weight:f}),r.run({parameters:{viewport:[0,0,i,i]},clearColor:[0,0,0,0]}),this._updateMaxWeightValue()}_debouncedUpdateWeightmap(t=!1){let{updateTimer:e}=this.state;const{debounceTimeout:o}=this.props;t?(e=null,this._updateBounds(!0),this._updateTextureRenderingBounds(),this.setState({isWeightMapDirty:!0})):(this.setState({isWeightMapDirty:!1}),clearTimeout(e),e=setTimeout(this._debouncedUpdateWeightmap.bind(this,!0),o)),this.setState({updateTimer:e})}_worldToCommonBounds(t,e={}){const{useLayerCoordinateSystem:o=!1}=e,[s,i,a,n]=t,{viewport:r}=this.context,{textureSize:c}=this.state,{coordinateSystem:h}=this.props,l=o&&(h===x.LNGLAT_OFFSETS||h===x.METER_OFFSETS),d=l?r.projectPosition(this.props.coordinateOrigin):[0,0],f=c*ct/r.scale;let m,p;return o&&!l?(m=this.projectPosition([s,i,0]),p=this.projectPosition([a,n,0])):(m=r.projectPosition([s,i,0]),p=r.projectPosition([a,n,0])),q([m[0]-d[0],m[1]-d[1],p[0]-d[0],p[1]-d[1]],f,f)}_commonToWorldBounds(t){const[e,o,s,i]=t,{viewport:a}=this.context,n=a.unprojectPosition([e,o]),r=a.unprojectPosition([s,i]);return n.slice(0,2).concat(r.slice(0,2))}}W.layerName="HeatmapLayer";W.defaultProps=lt;export{W as H};
