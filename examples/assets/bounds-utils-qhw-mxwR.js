import{b as g,o as C,av as N,d as y,aw as I}from"./mapbox-overlay-dETm6WBN.js";import{C as x}from"./composite-layer-DS4VCTQb.js";function A({pointCount:i,getBinId:e}){const t=new Map;for(let n=0;n<i;n++){const s=e(n);if(s===null)continue;let r=t.get(String(s));r?r.points.push(n):(r={id:s,index:t.size,points:[n]},t.set(String(s),r))}return Array.from(t.values())}function S({bins:i,dimensions:e,target:t}){const n=i.length*e;(!t||t.length<n)&&(t=new Float32Array(n));for(let s=0;s<i.length;s++){const{id:r}=i[s];Array.isArray(r)?t.set(r,s*e):t[s]=r}return t}const M=i=>i.length,m=(i,e)=>{let t=0;for(const n of i)t+=e(n);return t},B=(i,e)=>i.length===0?NaN:m(i,e)/i.length,_=(i,e)=>{let t=1/0;for(const n of i){const s=e(n);s<t&&(t=s)}return t},O=(i,e)=>{let t=-1/0;for(const n of i){const s=e(n);s>t&&(t=s)}return t},T={COUNT:M,SUM:m,MEAN:B,MIN:_,MAX:O};function U({bins:i,getValue:e,operation:t,target:n}){(!n||n.length<i.length)&&(n=new Float32Array(i.length));let s=1/0,r=-1/0;for(let o=0;o<i.length;o++){const{points:a}=i[o];n[o]=t(a,e),n[o]<s&&(s=n[o]),n[o]>r&&(r=n[o])}return{value:n,domain:[s,r]}}function c(i,e,t){const n={};for(const r of i.sources||[]){const o=e[r];if(o)n[r]=E(o);else throw new Error(`Cannot find attribute ${r}`)}const s={};return r=>{for(const o in n)s[o]=n[o](r);return i.getValue(s,r,t)}}function E(i){const e=i.value,{offset:t=0,stride:n,size:s}=i.getAccessor(),r=e.BYTES_PER_ELEMENT,o=t/r,a=n?n/r:s;if(s===1)return i.isConstant?()=>e[0]:f=>{const u=o+a*f;return e[u]};let l;return i.isConstant?(l=Array.from(e),()=>l):(l=new Array(s),f=>{const u=o+a*f;for(let h=0;h<s;h++)l[h]=e[u+h];return l})}class Y{constructor(e){this.bins=[],this.binIds=null,this.results=[],this.dimensions=e.dimensions,this.channelCount=e.getValue.length,this.props={...e,binOptions:{},pointCount:0,operations:[],customOperations:[],attributes:{}},this.needsUpdate=!0,this.setProps(e)}destroy(){}get binCount(){return this.bins.length}setProps(e){const t=this.props;if(e.binOptions&&(g(e.binOptions,t.binOptions,2)||this.setNeedsUpdate()),e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.customOperations)for(let n=0;n<this.channelCount;n++)!!e.customOperations[n]!=!!t.customOperations[n]&&this.setNeedsUpdate(n);e.pointCount!==void 0&&e.pointCount!==t.pointCount&&this.setNeedsUpdate(),e.attributes&&(e.attributes={...t.attributes,...e.attributes}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate=!0:this.needsUpdate!==!0&&(this.needsUpdate=this.needsUpdate||[],this.needsUpdate[e]=!0)}update(){if(this.needsUpdate===!0){this.bins=A({pointCount:this.props.pointCount,getBinId:c(this.props.getBin,this.props.attributes,this.props.binOptions)});const e=S({bins:this.bins,dimensions:this.dimensions,target:this.binIds?.value});this.binIds={value:e,type:"float32",size:this.dimensions}}for(let e=0;e<this.channelCount;e++)if(this.needsUpdate===!0||this.needsUpdate[e]){const t=this.props.customOperations[e]||T[this.props.operations[e]],{value:n,domain:s}=U({bins:this.bins,getValue:c(this.props.getValue[e],this.props.attributes,void 0),operation:t,target:this.results[e]?.value});this.results[e]={value:n,domain:s,type:"float32",size:1},this.props.onUpdate?.({channel:e})}this.needsUpdate=!1}preDraw(){}getBins(){return this.binIds}getResult(e){return this.results[e]}getResultDomain(e){return this.results[e]?.domain??[1/0,-1/0]}getBin(e){const t=this.bins[e];if(!t)return null;const n=new Array(this.channelCount);for(let s=0;s<n.length;s++){const r=this.results[s];n[s]=r?.value[e]}return{id:t.id,value:n,count:t.points.length,pointIndices:t.points}}}function p(i,e,t){return i.createFramebuffer({width:e,height:t,colorAttachments:[i.createTexture({width:e,height:t,format:"rgba32float",sampler:{minFilter:"nearest",magFilter:"nearest"}})]})}const P=`uniform binSorterUniforms {
  ivec4 binIdRange;
  ivec2 targetSize;
} binSorter;
`,w={name:"binSorter",vs:P,uniformTypes:{binIdRange:"vec4<i32>",targetSize:"vec2<i32>"}},v=[1,2,4,8],b=3e38,L={SUM:0,MEAN:0,MIN:0,MAX:0,COUNT:0},d=1024;class F{constructor(e,t){this.binsFBO=null,this.device=e,this.model=D(e,t)}get texture(){return this.binsFBO?this.binsFBO.colorAttachments[0].texture:null}destroy(){this.model.destroy(),this.binsFBO?.colorAttachments[0].texture.destroy(),this.binsFBO?.destroy()}getBinValues(e){if(!this.binsFBO)return null;const t=e%d,n=Math.floor(e/d),s=this.device.readPixelsToArrayWebGL(this.binsFBO,{sourceX:t,sourceY:n,sourceWidth:1,sourceHeight:1}).buffer;return new Float32Array(s)}setDimensions(e,t){const n=d,s=Math.ceil(e/n);this.binsFBO?this.binsFBO.height<s&&this.binsFBO.resize({width:n,height:s}):this.binsFBO=p(this.device,n,s);const r={binIdRange:[t[0][0],t[0][1],t[1]?.[0]||0,t[1]?.[1]||0],targetSize:[this.binsFBO.width,this.binsFBO.height]};this.model.shaderInputs.setProps({binSorter:r})}setModelProps(e){const t=this.model;e.attributes&&t.setAttributes(e.attributes),e.constantAttributes&&t.setConstantAttributes(e.constantAttributes),e.vertexCount!==void 0&&t.setVertexCount(e.vertexCount),e.shaderModuleProps&&t.shaderInputs.setProps(e.shaderModuleProps)}update(e){if(!this.binsFBO)return;const t=R(e);this._updateBins("SUM",t.SUM+t.MEAN),this._updateBins("MIN",t.MIN),this._updateBins("MAX",t.MAX)}_updateBins(e,t){if(t===0)return;t|=v[3];const n=this.model,s=this.binsFBO,r=e==="MAX"?-b:e==="MIN"?b:0,o=this.device.beginRenderPass({id:`gpu-aggregation-${e}`,framebuffer:s,parameters:{viewport:[0,0,s.width,s.height],colorMask:t},clearColor:[r,r,r,0],clearDepth:!1,clearStencil:!1});n.setParameters({blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendColorOperation:e==="MAX"?"max":e==="MIN"?"min":"add",blendAlphaOperation:"add"}),n.draw(o),o.end()}}function R(i){const e={...L};for(let t=0;t<i.length;t++){const n=i[t];n&&(e[n]+=v[t])}return e}function D(i,e){let t=e.vs;e.dimensions===2&&(t+=`
void getBin(out int binId) {
  ivec2 binId2;
  getBin(binId2);
  if (binId2.x < binSorter.binIdRange.x || binId2.x >= binSorter.binIdRange.y) {
    binId = -1;
  } else {
    binId = (binId2.y - binSorter.binIdRange.z) * (binSorter.binIdRange.y - binSorter.binIdRange.x) + binId2.x;
  }
}
`);const n=`#version 300 es
#define SHADER_NAME gpu-aggregation-sort-bins-vertex

${t}

out vec3 v_Value;

void main() {
  int binIndex;
  getBin(binIndex);
  binIndex = binIndex - binSorter.binIdRange.x;
  if (binIndex < 0) {
    gl_Position = vec4(0.);
    return;
  }
  int row = binIndex / binSorter.targetSize.x;
  int col = binIndex - row * binSorter.targetSize.x;
  vec2 position = (vec2(col, row) + 0.5) / vec2(binSorter.targetSize) * 2.0 - 1.0;
  gl_Position = vec4(position, 0.0, 1.0);
  gl_PointSize = 1.0;

#if NUM_CHANNELS == 3
  getValue(v_Value);
#elif NUM_CHANNELS == 2
  getValue(v_Value.xy);
#else
  getValue(v_Value.x);
#endif
}
`,s=`#version 300 es
#define SHADER_NAME gpu-aggregation-sort-bins-fragment

precision highp float;

in vec3 v_Value;
out vec4 fragColor;

void main() {
  fragColor.xyz = v_Value;

  #ifdef MODULE_GEOMETRY
  geometry.uv = vec2(0.);
  DECKGL_FILTER_COLOR(fragColor, geometry);
  #endif

  fragColor.w = 1.0;
}
`;return new C(i,{bufferLayout:e.bufferLayout,modules:[...e.modules||[],w],defines:{...e.defines,NON_INSTANCED_MODEL:1,NUM_CHANNELS:e.channelCount},isInstanced:!1,vs:n,fs:s,topology:"point-list",disableWarnings:!0})}const V=`uniform aggregatorTransformUniforms {
  ivec4 binIdRange;
  bvec3 isCount;
  bvec3 isMean;
  float naN;
} aggregatorTransform;
`,H={name:"aggregatorTransform",vs:V,uniformTypes:{binIdRange:"vec4<i32>",isCount:"vec3<f32>",isMean:"vec3<f32>"}};class z{constructor(e,t){this.binBuffer=null,this.valueBuffer=null,this._domains=null,this.device=e,this.channelCount=t.channelCount,this.transform=W(e,t),this.domainFBO=p(e,2,1)}destroy(){this.transform.destroy(),this.binBuffer?.destroy(),this.valueBuffer?.destroy(),this.domainFBO.colorAttachments[0].texture.destroy(),this.domainFBO.destroy()}get domains(){if(!this._domains){const e=this.device.readPixelsToArrayWebGL(this.domainFBO).buffer,t=new Float32Array(e);this._domains=[[-t[4],t[0]],[-t[5],t[1]],[-t[6],t[2]]].slice(0,this.channelCount)}return this._domains}setDimensions(e,t){const{model:n,transformFeedback:s}=this.transform;n.setVertexCount(e);const r={binIdRange:[t[0][0],t[0][1],t[1]?.[0]||0,t[1]?.[1]||0]};n.shaderInputs.setProps({aggregatorTransform:r});const o=e*t.length*4;(!this.binBuffer||this.binBuffer.byteLength<o)&&(this.binBuffer?.destroy(),this.binBuffer=this.device.createBuffer({byteLength:o}),s.setBuffer("binIds",this.binBuffer));const a=e*this.channelCount*4;(!this.valueBuffer||this.valueBuffer.byteLength<a)&&(this.valueBuffer?.destroy(),this.valueBuffer=this.device.createBuffer({byteLength:a}),s.setBuffer("values",this.valueBuffer))}update(e,t){if(!e)return;const n=this.transform,s=this.domainFBO,r=[0,1,2].map(l=>t[l]==="COUNT"?1:0),o=[0,1,2].map(l=>t[l]==="MEAN"?1:0),a={isCount:r,isMean:o,bins:e};n.model.shaderInputs.setProps({aggregatorTransform:a}),n.run({id:"gpu-aggregation-domain",framebuffer:s,parameters:{viewport:[0,0,2,1]},clearColor:[-3e38,-3e38,-3e38,0],clearDepth:!1,clearStencil:!1}),this._domains=null}}function W(i,e){const t=`#version 300 es
#define SHADER_NAME gpu-aggregation-domain-vertex

uniform sampler2D bins;

#if NUM_DIMS == 1
out float binIds;
#else
out vec2 binIds;
#endif

#if NUM_CHANNELS == 1
flat out float values;
#elif NUM_CHANNELS == 2
flat out vec2 values;
#else
flat out vec3 values;
#endif

const float NAN = intBitsToFloat(-1);

void main() {
  int row = gl_VertexID / SAMPLER_WIDTH;
  int col = gl_VertexID - row * SAMPLER_WIDTH;
  vec4 weights = texelFetch(bins, ivec2(col, row), 0);
  vec3 value3 = mix(
    mix(weights.rgb, vec3(weights.a), aggregatorTransform.isCount),
    weights.rgb / max(weights.a, 1.0),
    aggregatorTransform.isMean
  );
  if (weights.a == 0.0) {
    value3 = vec3(NAN);
  }

#if NUM_DIMS == 1
  binIds = float(gl_VertexID + aggregatorTransform.binIdRange.x);
#else
  int y = gl_VertexID / (aggregatorTransform.binIdRange.y - aggregatorTransform.binIdRange.x);
  int x = gl_VertexID - y * (aggregatorTransform.binIdRange.y - aggregatorTransform.binIdRange.x);
  binIds.y = float(y + aggregatorTransform.binIdRange.z);
  binIds.x = float(x + aggregatorTransform.binIdRange.x);
#endif

#if NUM_CHANNELS == 3
  values = value3;
#elif NUM_CHANNELS == 2
  values = value3.xy;
#else
  values = value3.x;
#endif

  gl_Position = vec4(0., 0., 0., 1.);
  // This model renders into a 2x1 texture to obtain min and max simultaneously.
  // See comments in fragment shader
  gl_PointSize = 2.0;
}
`,n=`#version 300 es
#define SHADER_NAME gpu-aggregation-domain-fragment

precision highp float;

#if NUM_CHANNELS == 1
flat in float values;
#elif NUM_CHANNELS == 2
flat in vec2 values;
#else
flat in vec3 values;
#endif

out vec4 fragColor;

void main() {
  vec3 value3;
#if NUM_CHANNELS == 3
  value3 = values;
#elif NUM_CHANNELS == 2
  value3.xy = values;
#else
  value3.x = values;
#endif
  if (isnan(value3.x)) discard;
  // This shader renders into a 2x1 texture with blending=max
  // The left pixel yields the max value of each channel
  // The right pixel yields the min value of each channel
  if (gl_FragCoord.x < 1.0) {
    fragColor = vec4(value3, 1.0);
  } else {
    fragColor = vec4(-value3, 1.0);
  }
}
`;return new N(i,{vs:t,fs:n,topology:"point-list",modules:[H],parameters:{blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendColorOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendAlphaOperation:"max"},defines:{NUM_DIMS:e.dimensions,NUM_CHANNELS:e.channelCount,SAMPLER_WIDTH:d},varyings:["binIds","values"],disableWarnings:!0})}class k{static isSupported(e){return e.features.has("float32-renderable-webgl")&&e.features.has("texture-blend-float-webgl")}constructor(e,t){this.binCount=0,this.binIds=null,this.results=[],this.device=e,this.dimensions=t.dimensions,this.channelCount=t.channelCount,this.props={...t,pointCount:0,binIdRange:[[0,0]],operations:[],attributes:{},binOptions:{}},this.needsUpdate=new Array(this.channelCount).fill(!0),this.binSorter=new F(e,t),this.aggregationTransform=new z(e,t),this.setProps(t)}getBins(){const e=this.aggregationTransform.binBuffer;return e?(this.binIds?.buffer!==e&&(this.binIds={buffer:e,type:"float32",size:this.dimensions}),this.binIds):null}getResult(e){const t=this.aggregationTransform.valueBuffer;return!t||e>=this.channelCount?null:(this.results[e]?.buffer!==t&&(this.results[e]={buffer:t,type:"float32",size:1,stride:this.channelCount*4,offset:e*4}),this.results[e])}getResultDomain(e){return this.aggregationTransform.domains[e]}getBin(e){if(e<0||e>=this.binCount)return null;const{binIdRange:t}=this.props;let n;if(this.dimensions===1)n=[e+t[0][0]];else{const[[a,l],[f]]=t,u=l-a;n=[e%u+a,Math.floor(e/u)+f]}const s=this.binSorter.getBinValues(e);if(!s)return null;const r=s[3],o=[];for(let a=0;a<this.channelCount;a++){const l=this.props.operations[a];l==="COUNT"?o[a]=r:r===0?o[a]=NaN:o[a]=l==="MEAN"?s[a]/r:s[a]}return{id:n,value:o,count:r}}destroy(){this.binSorter.destroy(),this.aggregationTransform.destroy()}setProps(e){const t=this.props;if("binIdRange"in e&&!g(e.binIdRange,t.binIdRange,2)){const n=e.binIdRange;if(y.assert(n.length===this.dimensions),this.dimensions===1){const[[s,r]]=n;this.binCount=r-s}else{const[[s,r],[o,a]]=n;this.binCount=(r-s)*(a-o)}this.binSorter.setDimensions(this.binCount,n),this.aggregationTransform.setDimensions(this.binCount,n),this.setNeedsUpdate()}if(e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.pointCount!==void 0&&e.pointCount!==t.pointCount&&(this.binSorter.setModelProps({vertexCount:e.pointCount}),this.setNeedsUpdate()),e.binOptions&&(g(e.binOptions,t.binOptions,2)||this.setNeedsUpdate(),this.binSorter.model.shaderInputs.setProps({binOptions:e.binOptions})),e.attributes){const n={},s={};for(const r of Object.values(e.attributes))for(const[o,a]of Object.entries(r.getValue()))ArrayBuffer.isView(a)?s[o]=a:a&&(n[o]=a);this.binSorter.setModelProps({attributes:n,constantAttributes:s})}e.shaderModuleProps&&this.binSorter.setModelProps({shaderModuleProps:e.shaderModuleProps}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate.fill(!0):this.needsUpdate[e]=!0}update(){}preDraw(){if(!this.needsUpdate.some(Boolean))return;const{operations:e}=this.props,t=this.needsUpdate.map((n,s)=>n?e[s]:null);this.binSorter.update(t),this.aggregationTransform.update(this.binSorter.texture,e);for(let n=0;n<this.channelCount;n++)this.needsUpdate[n]&&(this.needsUpdate[n]=!1,this.props.onUpdate?.({channel:n}))}}class X extends x{get isDrawable(){return!0}initializeState(){this.getAttributeManager().remove(["instancePickingColors"])}updateState(e){super.updateState(e);const t=this.getAggregatorType();if(e.changeFlags.extensionsChanged||this.state.aggregatorType!==t){this.state.aggregator?.destroy();const n=this.createAggregator(t);return n.setProps({attributes:this.getAttributeManager()?.attributes}),this.setState({aggregator:n,aggregatorType:t}),!0}return!1}finalizeState(e){super.finalizeState(e),this.state.aggregator.destroy()}updateAttributes(e){const{aggregator:t}=this.state;t.setProps({attributes:e});for(const n in e)this.onAttributeChange(n);t.update()}draw({shaderModuleProps:e}){const{aggregator:t}=this.state;t.setProps({shaderModuleProps:e}),t.preDraw()}_getAttributeManager(){return new I(this.context.device,{id:this.props.id,stats:this.context.stats})}}X.layerName="AggregationLayer";function $({dataBounds:i,getBinId:e,padding:t=0}){const n=[i[0],i[1],[i[0][0],i[1][1]],[i[1][0],i[0][1]]].map(l=>e(l)),s=Math.min(...n.map(l=>l[0]))-t,r=Math.min(...n.map(l=>l[1]))-t,o=Math.max(...n.map(l=>l[0]))+t+1,a=Math.max(...n.map(l=>l[1]))+t+1;return[[s,o],[r,a]]}export{X as A,Y as C,k as W,$ as g};
