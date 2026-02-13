import{e as _,a9 as E,u as O,L as U,p as M,aa as j,a8 as P,C as f,d as N}from"./mapbox-overlay-CjL5nCza.js";import{C as V}from"./composite-layer-dQcQCi_n.js";import{a as H,d as k}from"./color-utils-CH0udO2m.js";const G="transform_output";class y{device;model;sampler;currentIndex=0;samplerTextureMap=null;bindings=[];resources={};constructor(t,e){this.device=t,this.sampler=t.createSampler({addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge",minFilter:"nearest",magFilter:"nearest",mipmapFilter:"nearest"}),this.model=new _(this.device,{id:e.id||O("texture-transform-model"),fs:e.fs||E({input:e.targetTextureVarying,inputChannels:e.targetTextureChannels,output:G}),vertexCount:e.vertexCount,...e}),this._initialize(e),Object.seal(this)}destroy(){this.model.destroy();for(const t of this.bindings)t.framebuffer?.destroy()}delete(){this.destroy()}run(t){const{framebuffer:e}=this.bindings[this.currentIndex],o=this.device.beginRenderPass({framebuffer:e,...t});this.model.draw(o),o.end(),this.device.submit()}getTargetTexture(){const{targetTexture:t}=this.bindings[this.currentIndex];return t}getFramebuffer(){return this.bindings[this.currentIndex].framebuffer}_initialize(t){this._updateBindings(t)}_updateBindings(t){this.bindings[this.currentIndex]=this._updateBinding(this.bindings[this.currentIndex],t)}_updateBinding(t,{sourceBuffers:e,sourceTextures:o,targetTexture:s}){if(t||(t={sourceBuffers:{},sourceTextures:{},targetTexture:null}),Object.assign(t.sourceTextures,o),Object.assign(t.sourceBuffers,e),s){t.targetTexture=s;const{width:r,height:a}=s;t.framebuffer&&t.framebuffer.destroy(),t.framebuffer=this.device.createFramebuffer({id:"transform-framebuffer",width:r,height:a,colorAttachments:[s]}),t.framebuffer.resize({width:r,height:a})}return t}_setSourceTextureParameters(){const t=this.currentIndex,{sourceTextures:e}=this.bindings[t];for(const o in e)e[o].sampler=this.sampler}}function $(u){const t=u.map(n=>n[0]),e=u.map(n=>n[1]),o=Math.min.apply(null,t),s=Math.max.apply(null,t),r=Math.min.apply(null,e),a=Math.max.apply(null,e);return[o,r,s,a]}function K(u,t){return t[0]>=u[0]&&t[2]<=u[2]&&t[1]>=u[1]&&t[3]<=u[3]}const w=new Float32Array(12);function S(u,t=2){let e=0;for(const o of u)for(let s=0;s<t;s++)w[e++]=o[s]||0;return w}function Z(u,t,e){const[o,s,r,a]=u,n=r-o,i=a-s;let c=n,h=i;n/i<t/e?c=t/e*i:h=e/t*n,c<t&&(c=t,h=e);const l=(r+o)/2,d=(a+s)/2;return[l-c/2,d-h/2,l+c/2,d+h/2]}function X(u,t){const[e,o,s,r]=t;return[(u[0]-e)/(s-e),(u[1]-o)/(r-o)]}const Y=`#version 300 es
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
`,q=`#version 300 es
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
`,C=`uniform triangleUniforms {
  float aggregationMode;
  vec2 colorDomain;
  float intensity;
  float threshold;
} triangle;
`,J={name:"triangle",vs:C,fs:C,uniformTypes:{aggregationMode:"f32",colorDomain:"vec2<f32>",intensity:"f32",threshold:"f32"}};class A extends U{getShaders(){return super.getShaders({vs:Y,fs:q,modules:[M,J]})}initializeState({device:t}){this.setState({model:this._getModel(t)})}_getModel(t){const{vertexCount:e,data:o}=this.props;return new _(t,{...this.getShaders(),id:this.props.id,attributes:o.attributes,bufferLayout:[{name:"positions",format:"float32x3"},{name:"texCoords",format:"float32x2"}],topology:"triangle-strip",vertexCount:e})}draw(){const{model:t}=this.state,{aggregationMode:e,colorDomain:o,intensity:s,threshold:r,colorTexture:a,maxTexture:n,weightsTexture:i}=this.props,c={aggregationMode:e,colorDomain:o,intensity:s,threshold:r,colorTexture:a,maxTexture:n,weightsTexture:i};t.shaderInputs.setProps({triangle:c}),t.draw(this.context.renderPass)}}A.layerName="TriangleLayer";function Q(u,t){const e={};for(const o in u)t.includes(o)||(e[o]=u[o]);return e}class L extends V{initializeAggregationLayer(t){super.initializeState(this.context),this.setState({ignoreProps:Q(this.constructor._propTypes,t.data.props),dimensions:t})}updateState(t){super.updateState(t);const{changeFlags:e}=t;if(e.extensionsChanged){const o=this.getShaders({});o&&o.defines&&(o.defines.NON_INSTANCED_MODEL=1),this.updateShaders(o)}this._updateAttributes()}updateAttributes(t){this.setState({changedAttributes:t})}getAttributes(){return this.getAttributeManager().getAttributes()}getModuleSettings(){const{viewport:t,mousePosition:e,device:o}=this.context;return Object.assign(Object.create(this.props),{viewport:t,mousePosition:e,picking:{isActive:0},devicePixelRatio:o.canvasContext.cssToDeviceRatio()})}updateShaders(t){}isAggregationDirty(t,e={}){const{props:o,oldProps:s,changeFlags:r}=t,{compareAll:a=!1,dimension:n}=e,{ignoreProps:i}=this.state,{props:c,accessors:h=[]}=n,{updateTriggersChanged:l}=r;if(r.dataChanged)return!0;if(l){if(l.all)return!0;for(const d of h)if(l[d])return!0}if(a)return r.extensionsChanged?!0:j({oldProps:s,newProps:o,ignoreProps:i,propTypes:this.constructor._propTypes});for(const d of c)if(o[d]!==s[d])return!0;return!1}isAttributeChanged(t){const{changedAttributes:e}=this.state;return t?e&&e[t]!==void 0:!tt(e)}_getAttributeManager(){return new P(this.context.device,{id:this.props.id,stats:this.context.stats})}}L.layerName="AggregationLayer";function tt(u){let t=!0;for(const e in u){t=!1;break}return t}const x=`#version 300 es
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
`,T=`#version 300 es
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
`,et=`#version 300 es
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
`,ot=`#version 300 es
in vec4 outTexture;
out vec4 fragColor;
void main() {
fragColor = outTexture;
fragColor.g = outTexture.r / max(1.0, outTexture.a);
}
`,st=`uniform weightUniforms {
  vec4 commonBounds;
  float radiusPixels;
  float textureWidth;
  float weightsScale;
} weight;
`,rt={name:"weight",vs:st,uniformTypes:{commonBounds:"vec4<f32>",radiusPixels:"f32",textureWidth:"f32",weightsScale:"f32"}},it={name:"maxWeight",vs:`uniform maxWeightUniforms {
  float textureSize;
} maxWeight;
`,uniformTypes:{textureSize:"f32"}},at=2,v={format:"rgba8unorm",dimension:"2d",width:1,height:1,sampler:{minFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}},b=[0,0],nt={SUM:0,MEAN:1},ut={getPosition:{type:"accessor",value:u=>u.position},getWeight:{type:"accessor",value:1},intensity:{type:"number",min:0,value:1},radiusPixels:{type:"number",min:1,max:100,value:50},colorRange:k,threshold:{type:"number",min:0,max:1,value:.05},colorDomain:{type:"array",value:null,optional:!0},aggregation:"SUM",weightsTextureSize:{type:"number",min:128,max:2048,value:2048},debounceTimeout:{type:"number",min:0,max:1e3,value:500}},ct=["float32-renderable-webgl","texture-blend-float-webgl"],dt={data:{props:["radiusPixels"]}};class W extends L{getShaders(t){let e=[M];return t.modules&&(e=[...e,...t.modules]),super.getShaders({...t,modules:e})}initializeState(){super.initializeAggregationLayer(dt),this.setState({colorDomain:b}),this._setupTextureParams(),this._setupAttributes(),this._setupResources()}shouldUpdateState({changeFlags:t}){return t.somethingChanged}updateState(t){super.updateState(t),this._updateHeatmapState(t)}_updateHeatmapState(t){const{props:e,oldProps:o}=t,s=this._getChangeFlags(t);if((s.dataChanged||s.viewportChanged)&&(s.boundsChanged=this._updateBounds(s.dataChanged),this._updateTextureRenderingBounds()),s.dataChanged||s.boundsChanged){if(clearTimeout(this.state.updateTimer),this.setState({isWeightMapDirty:!0}),s.dataChanged){const r=this.getShaders({vs:x,fs:T});this._createWeightsTransform(r)}}else s.viewportZoomChanged&&this._debouncedUpdateWeightmap();e.colorRange!==o.colorRange&&this._updateColorTexture(t),this.state.isWeightMapDirty&&this._updateWeightmap(),this.setState({zoom:t.context.viewport.zoom})}renderLayers(){const{weightsTexture:t,triPositionBuffer:e,triTexCoordBuffer:o,maxWeightsTexture:s,colorTexture:r,colorDomain:a}=this.state,{updateTriggers:n,intensity:i,threshold:c,aggregation:h}=this.props,l=this.getSubLayerClass("triangle",A);return new l(this.getSubLayerProps({id:"triangle-layer",updateTriggers:n}),{coordinateSystem:f.DEFAULT,data:{attributes:{positions:e,texCoords:o}},vertexCount:4,maxTexture:s,colorTexture:r,aggregationMode:nt[h]||0,weightsTexture:t,intensity:i,threshold:c,colorDomain:a})}finalizeState(t){super.finalizeState(t);const{weightsTransform:e,weightsTexture:o,maxWeightTransform:s,maxWeightsTexture:r,triPositionBuffer:a,triTexCoordBuffer:n,colorTexture:i,updateTimer:c}=this.state;e?.destroy(),o?.destroy(),s?.destroy(),r?.destroy(),a?.destroy(),n?.destroy(),i?.destroy(),c&&clearTimeout(c)}_getAttributeManager(){return new P(this.context.device,{id:this.props.id,stats:this.context.stats})}_getChangeFlags(t){const e={},{dimensions:o}=this.state;e.dataChanged=this.isAttributeChanged()&&"attribute changed"||this.isAggregationDirty(t,{compareAll:!0,dimension:o.data})&&"aggregation is dirty",e.viewportChanged=t.changeFlags.viewportChanged;const{zoom:s}=this.state;return(!t.context.viewport||t.context.viewport.zoom!==s)&&(e.viewportZoomChanged=!0),e}_createTextures(){const{textureSize:t,format:e}=this.state;this.setState({weightsTexture:this.context.device.createTexture({...v,width:t,height:t,format:e}),maxWeightsTexture:this.context.device.createTexture({...v,width:1,height:1,format:e})})}_setupAttributes(){this.getAttributeManager().add({positions:{size:3,type:"float64",accessor:"getPosition"},weights:{size:1,accessor:"getWeight"}}),this.setState({positionAttributeName:"positions"})}_setupTextureParams(){const{device:t}=this.context,{weightsTextureSize:e}=this.props,o=Math.min(e,t.limits.maxTextureDimension2D),s=ct.every(n=>t.features.has(n)),r=s?"rgba32float":"rgba8unorm",a=s?1:1/255;this.setState({textureSize:o,format:r,weightsScale:a}),s||N.warn(`HeatmapLayer: ${this.id} rendering to float texture not supported, falling back to low precision format`)()}_createWeightsTransform(t){let{weightsTransform:e}=this.state;const{weightsTexture:o}=this.state,s=this.getAttributeManager();e?.destroy(),e=new y(this.context.device,{id:`${this.id}-weights-transform`,bufferLayout:s.getBufferLayouts(),vertexCount:1,targetTexture:o,parameters:{depthWriteEnabled:!1,blendColorOperation:"add",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"},topology:"point-list",...t,modules:[...t.modules,rt]}),this.setState({weightsTransform:e})}_setupResources(){this._createTextures();const{device:t}=this.context,{textureSize:e,weightsTexture:o,maxWeightsTexture:s}=this.state,r=this.getShaders({vs:x,fs:T});this._createWeightsTransform(r);const a=this.getShaders({vs:et,fs:ot,modules:[it]}),n=new y(t,{id:`${this.id}-max-weights-transform`,targetTexture:s,...a,vertexCount:e*e,topology:"point-list",parameters:{depthWriteEnabled:!1,blendColorOperation:"max",blendAlphaOperation:"max",blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one"}}),i={inTexture:o,textureSize:e};n.model.shaderInputs.setProps({maxWeight:i}),this.setState({weightsTexture:o,maxWeightsTexture:s,maxWeightTransform:n,zoom:null,triPositionBuffer:t.createBuffer({byteLength:48}),triTexCoordBuffer:t.createBuffer({byteLength:48})})}updateShaders(t){this._createWeightsTransform({vs:x,fs:T,...t})}_updateMaxWeightValue(){const{maxWeightTransform:t}=this.state;t.run({parameters:{viewport:[0,0,1,1]},clearColor:[0,0,0,0]})}_updateBounds(t=!1){const{viewport:e}=this.context,o=[e.unproject([0,0]),e.unproject([e.width,0]),e.unproject([0,e.height]),e.unproject([e.width,e.height])].map(n=>n.map(Math.fround)),s=$(o),r={visibleWorldBounds:s,viewportCorners:o};let a=!1;if(t||!this.state.worldBounds||!K(this.state.worldBounds,s)){const n=this._worldToCommonBounds(s),i=this._commonToWorldBounds(n);this.props.coordinateSystem===f.LNGLAT&&(i[1]=Math.max(i[1],-85.051129),i[3]=Math.min(i[3],85.051129),i[0]=Math.max(i[0],-360),i[2]=Math.min(i[2],360));const c=this._worldToCommonBounds(i);r.worldBounds=i,r.normalizedCommonBounds=c,a=!0}return this.setState(r),a}_updateTextureRenderingBounds(){const{triPositionBuffer:t,triTexCoordBuffer:e,normalizedCommonBounds:o,viewportCorners:s}=this.state,{viewport:r}=this.context;t.write(S(s,3));const a=s.map(n=>X(r.projectPosition(n),o));e.write(S(a,2))}_updateColorTexture(t){const{colorRange:e}=t.props;let{colorTexture:o}=this.state;const s=H(e,!1,Uint8Array);o?.destroy(),o=this.context.device.createTexture({...v,data:s,width:e.length,height:1}),this.setState({colorTexture:o})}_updateWeightmap(){const{radiusPixels:t,colorDomain:e,aggregation:o}=this.props,{worldBounds:s,textureSize:r,weightsScale:a,weightsTexture:n}=this.state,i=this.state.weightsTransform;this.state.isWeightMapDirty=!1;const c=this._worldToCommonBounds(s,{useLayerCoordinateSystem:!0});if(e&&o==="SUM"){const{viewport:F}=this.context,I=F.distanceScales.metersPerUnit[2]*(c[2]-c[0])/r;this.state.colorDomain=e.map(R=>R*I*a)}else this.state.colorDomain=e||b;const l=this.getAttributeManager().getAttributes(),d=this.getModuleSettings();this._setModelAttributes(i.model,l),i.model.setVertexCount(this.getNumInstances());const p={radiusPixels:t,commonBounds:c,textureWidth:r,weightsScale:a,weightsTexture:n},{viewport:g,devicePixelRatio:m,coordinateSystem:B,coordinateOrigin:D}=d,{modelMatrix:z}=this.props;i.model.shaderInputs.setProps({project:{viewport:g,devicePixelRatio:m,modelMatrix:z,coordinateSystem:B,coordinateOrigin:D},weight:p}),i.run({parameters:{viewport:[0,0,r,r]},clearColor:[0,0,0,0]}),this._updateMaxWeightValue()}_debouncedUpdateWeightmap(t=!1){let{updateTimer:e}=this.state;const{debounceTimeout:o}=this.props;t?(e=null,this._updateBounds(!0),this._updateTextureRenderingBounds(),this.setState({isWeightMapDirty:!0})):(this.setState({isWeightMapDirty:!1}),clearTimeout(e),e=setTimeout(this._debouncedUpdateWeightmap.bind(this,!0),o)),this.setState({updateTimer:e})}_worldToCommonBounds(t,e={}){const{useLayerCoordinateSystem:o=!1}=e,[s,r,a,n]=t,{viewport:i}=this.context,{textureSize:c}=this.state,{coordinateSystem:h}=this.props,l=o&&(h===f.LNGLAT_OFFSETS||h===f.METER_OFFSETS),d=l?i.projectPosition(this.props.coordinateOrigin):[0,0],p=c*at/i.scale;let g,m;return o&&!l?(g=this.projectPosition([s,r,0]),m=this.projectPosition([a,n,0])):(g=i.projectPosition([s,r,0]),m=i.projectPosition([a,n,0])),Z([g[0]-d[0],g[1]-d[1],m[0]-d[0],m[1]-d[1]],p,p)}_commonToWorldBounds(t){const[e,o,s,r]=t,{viewport:a}=this.context,n=a.unprojectPosition([e,o]),i=a.unprojectPosition([s,r]);return n.slice(0,2).concat(i.slice(0,2))}}W.layerName="HeatmapLayer";W.defaultProps=ut;export{W as H};
