import{b as g,o as C,av as N,d as y,aw as I}from"./mapbox-overlay-C46bI65L.js";import{C as x}from"./composite-layer-BGeqYk6R.js";function A({pointCount:r,getBinId:e}){const t=new Map;for(let n=0;n<r;n++){const s=e(n);if(s===null)continue;let i=t.get(String(s));i?i.points.push(n):(i={id:s,index:t.size,points:[n]},t.set(String(s),i))}return Array.from(t.values())}function S({bins:r,dimensions:e,target:t}){const n=r.length*e;(!t||t.length<n)&&(t=new Float32Array(n));for(let s=0;s<r.length;s++){const{id:i}=r[s];Array.isArray(i)?t.set(i,s*e):t[s]=i}return t}const M=r=>r.length,m=(r,e)=>{let t=0;for(const n of r)t+=e(n);return t},B=(r,e)=>r.length===0?NaN:m(r,e)/r.length,_=(r,e)=>{let t=1/0;for(const n of r){const s=e(n);s<t&&(t=s)}return t},O=(r,e)=>{let t=-1/0;for(const n of r){const s=e(n);s>t&&(t=s)}return t},T={COUNT:M,SUM:m,MEAN:B,MIN:_,MAX:O};function U({bins:r,getValue:e,operation:t,target:n}){(!n||n.length<r.length)&&(n=new Float32Array(r.length));let s=1/0,i=-1/0;for(let o=0;o<r.length;o++){const{points:a}=r[o];n[o]=t(a,e),n[o]<s&&(s=n[o]),n[o]>i&&(i=n[o])}return{value:n,domain:[s,i]}}function c(r,e,t){const n={};for(const i of r.sources||[]){const o=e[i];if(o)n[i]=E(o);else throw new Error(`Cannot find attribute ${i}`)}const s={};return i=>{for(const o in n)s[o]=n[o](i);return r.getValue(s,i,t)}}function E(r){const e=r.value,{offset:t=0,stride:n,size:s}=r.getAccessor(),i=e.BYTES_PER_ELEMENT,o=t/i,a=n?n/i:s;if(s===1)return r.isConstant?()=>e[0]:f=>{const u=o+a*f;return e[u]};let l;return r.isConstant?(l=Array.from(e),()=>l):(l=new Array(s),f=>{const u=o+a*f;for(let h=0;h<s;h++)l[h]=e[u+h];return l})}class Y{constructor(e){this.bins=[],this.binIds=null,this.results=[],this.dimensions=e.dimensions,this.channelCount=e.getValue.length,this.props={...e,binOptions:{},pointCount:0,operations:[],customOperations:[],attributes:{}},this.needsUpdate=!0,this.setProps(e)}destroy(){}get binCount(){return this.bins.length}setProps(e){const t=this.props;if(e.binOptions&&(g(e.binOptions,t.binOptions,2)||this.setNeedsUpdate()),e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.customOperations)for(let n=0;n<this.channelCount;n++)!!e.customOperations[n]!=!!t.customOperations[n]&&this.setNeedsUpdate(n);e.pointCount!==void 0&&e.pointCount!==t.pointCount&&this.setNeedsUpdate(),e.attributes&&(e.attributes={...t.attributes,...e.attributes}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate=!0:this.needsUpdate!==!0&&(this.needsUpdate=this.needsUpdate||[],this.needsUpdate[e]=!0)}update(){var e,t,n,s;if(this.needsUpdate===!0){this.bins=A({pointCount:this.props.pointCount,getBinId:c(this.props.getBin,this.props.attributes,this.props.binOptions)});const i=S({bins:this.bins,dimensions:this.dimensions,target:(e=this.binIds)==null?void 0:e.value});this.binIds={value:i,type:"float32",size:this.dimensions}}for(let i=0;i<this.channelCount;i++)if(this.needsUpdate===!0||this.needsUpdate[i]){const o=this.props.customOperations[i]||T[this.props.operations[i]],{value:a,domain:l}=U({bins:this.bins,getValue:c(this.props.getValue[i],this.props.attributes,void 0),operation:o,target:(t=this.results[i])==null?void 0:t.value});this.results[i]={value:a,domain:l,type:"float32",size:1},(s=(n=this.props).onUpdate)==null||s.call(n,{channel:i})}this.needsUpdate=!1}preDraw(){}getBins(){return this.binIds}getResult(e){return this.results[e]}getResultDomain(e){var t;return((t=this.results[e])==null?void 0:t.domain)??[1/0,-1/0]}getBin(e){const t=this.bins[e];if(!t)return null;const n=new Array(this.channelCount);for(let s=0;s<n.length;s++){const i=this.results[s];n[s]=i==null?void 0:i.value[e]}return{id:t.id,value:n,count:t.points.length,pointIndices:t.points}}}function p(r,e,t){return r.createFramebuffer({width:e,height:t,colorAttachments:[r.createTexture({width:e,height:t,format:"rgba32float",sampler:{minFilter:"nearest",magFilter:"nearest"}})]})}const P=`uniform binSorterUniforms {
  ivec4 binIdRange;
  ivec2 targetSize;
} binSorter;
`,w={name:"binSorter",vs:P,uniformTypes:{binIdRange:"vec4<i32>",targetSize:"vec2<i32>"}},v=[1,2,4,8],b=3e38,L={SUM:0,MEAN:0,MIN:0,MAX:0,COUNT:0},d=1024;class F{constructor(e,t){this.binsFBO=null,this.device=e,this.model=D(e,t)}get texture(){return this.binsFBO?this.binsFBO.colorAttachments[0].texture:null}destroy(){var e,t;this.model.destroy(),(e=this.binsFBO)==null||e.colorAttachments[0].texture.destroy(),(t=this.binsFBO)==null||t.destroy()}getBinValues(e){if(!this.binsFBO)return null;const t=e%d,n=Math.floor(e/d),s=this.device.readPixelsToArrayWebGL(this.binsFBO,{sourceX:t,sourceY:n,sourceWidth:1,sourceHeight:1}).buffer;return new Float32Array(s)}setDimensions(e,t){var o,a;const n=d,s=Math.ceil(e/n);this.binsFBO?this.binsFBO.height<s&&this.binsFBO.resize({width:n,height:s}):this.binsFBO=p(this.device,n,s);const i={binIdRange:[t[0][0],t[0][1],((o=t[1])==null?void 0:o[0])||0,((a=t[1])==null?void 0:a[1])||0],targetSize:[this.binsFBO.width,this.binsFBO.height]};this.model.shaderInputs.setProps({binSorter:i})}setModelProps(e){const t=this.model;e.attributes&&t.setAttributes(e.attributes),e.constantAttributes&&t.setConstantAttributes(e.constantAttributes),e.vertexCount!==void 0&&t.setVertexCount(e.vertexCount),e.shaderModuleProps&&t.shaderInputs.setProps(e.shaderModuleProps)}update(e){if(!this.binsFBO)return;const t=R(e);this._updateBins("SUM",t.SUM+t.MEAN),this._updateBins("MIN",t.MIN),this._updateBins("MAX",t.MAX)}_updateBins(e,t){if(t===0)return;t|=v[3];const n=this.model,s=this.binsFBO,i=e==="MAX"?-b:e==="MIN"?b:0,o=this.device.beginRenderPass({id:`gpu-aggregation-${e}`,framebuffer:s,parameters:{viewport:[0,0,s.width,s.height],colorMask:t},clearColor:[i,i,i,0],clearDepth:!1,clearStencil:!1});n.setParameters({blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendColorOperation:e==="MAX"?"max":e==="MIN"?"min":"add",blendAlphaOperation:"add"}),n.draw(o),o.end()}}function R(r){const e={...L};for(let t=0;t<r.length;t++){const n=r[t];n&&(e[n]+=v[t])}return e}function D(r,e){let t=e.vs;e.dimensions===2&&(t+=`
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
`;return new C(r,{bufferLayout:e.bufferLayout,modules:[...e.modules||[],w],defines:{...e.defines,NON_INSTANCED_MODEL:1,NUM_CHANNELS:e.channelCount},isInstanced:!1,vs:n,fs:s,topology:"point-list",disableWarnings:!0})}const V=`uniform aggregatorTransformUniforms {
  ivec4 binIdRange;
  bvec3 isCount;
  bvec3 isMean;
  float naN;
} aggregatorTransform;
`,H={name:"aggregatorTransform",vs:V,uniformTypes:{binIdRange:"vec4<i32>",isCount:"vec3<f32>",isMean:"vec3<f32>"}};class z{constructor(e,t){this.binBuffer=null,this.valueBuffer=null,this._domains=null,this.device=e,this.channelCount=t.channelCount,this.transform=W(e,t),this.domainFBO=p(e,2,1)}destroy(){var e,t;this.transform.destroy(),(e=this.binBuffer)==null||e.destroy(),(t=this.valueBuffer)==null||t.destroy(),this.domainFBO.colorAttachments[0].texture.destroy(),this.domainFBO.destroy()}get domains(){if(!this._domains){const e=this.device.readPixelsToArrayWebGL(this.domainFBO).buffer,t=new Float32Array(e);this._domains=[[-t[4],t[0]],[-t[5],t[1]],[-t[6],t[2]]].slice(0,this.channelCount)}return this._domains}setDimensions(e,t){var l,f,u,h;const{model:n,transformFeedback:s}=this.transform;n.setVertexCount(e);const i={binIdRange:[t[0][0],t[0][1],((l=t[1])==null?void 0:l[0])||0,((f=t[1])==null?void 0:f[1])||0]};n.shaderInputs.setProps({aggregatorTransform:i});const o=e*t.length*4;(!this.binBuffer||this.binBuffer.byteLength<o)&&((u=this.binBuffer)==null||u.destroy(),this.binBuffer=this.device.createBuffer({byteLength:o}),s.setBuffer("binIds",this.binBuffer));const a=e*this.channelCount*4;(!this.valueBuffer||this.valueBuffer.byteLength<a)&&((h=this.valueBuffer)==null||h.destroy(),this.valueBuffer=this.device.createBuffer({byteLength:a}),s.setBuffer("values",this.valueBuffer))}update(e,t){if(!e)return;const n=this.transform,s=this.domainFBO,i=[0,1,2].map(l=>t[l]==="COUNT"?1:0),o=[0,1,2].map(l=>t[l]==="MEAN"?1:0),a={isCount:i,isMean:o,bins:e};n.model.shaderInputs.setProps({aggregatorTransform:a}),n.run({id:"gpu-aggregation-domain",framebuffer:s,parameters:{viewport:[0,0,2,1]},clearColor:[-3e38,-3e38,-3e38,0],clearDepth:!1,clearStencil:!1}),this._domains=null}}function W(r,e){const t=`#version 300 es
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
`;return new N(r,{vs:t,fs:n,topology:"point-list",modules:[H],parameters:{blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendColorOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendAlphaOperation:"max"},defines:{NUM_DIMS:e.dimensions,NUM_CHANNELS:e.channelCount,SAMPLER_WIDTH:d},varyings:["binIds","values"],disableWarnings:!0})}class k{static isSupported(e){return e.features.has("float32-renderable-webgl")&&e.features.has("texture-blend-float-webgl")}constructor(e,t){this.binCount=0,this.binIds=null,this.results=[],this.device=e,this.dimensions=t.dimensions,this.channelCount=t.channelCount,this.props={...t,pointCount:0,binIdRange:[[0,0]],operations:[],attributes:{},binOptions:{}},this.needsUpdate=new Array(this.channelCount).fill(!0),this.binSorter=new F(e,t),this.aggregationTransform=new z(e,t),this.setProps(t)}getBins(){var t;const e=this.aggregationTransform.binBuffer;return e?(((t=this.binIds)==null?void 0:t.buffer)!==e&&(this.binIds={buffer:e,type:"float32",size:this.dimensions}),this.binIds):null}getResult(e){var n;const t=this.aggregationTransform.valueBuffer;return!t||e>=this.channelCount?null:(((n=this.results[e])==null?void 0:n.buffer)!==t&&(this.results[e]={buffer:t,type:"float32",size:1,stride:this.channelCount*4,offset:e*4}),this.results[e])}getResultDomain(e){return this.aggregationTransform.domains[e]}getBin(e){if(e<0||e>=this.binCount)return null;const{binIdRange:t}=this.props;let n;if(this.dimensions===1)n=[e+t[0][0]];else{const[[a,l],[f]]=t,u=l-a;n=[e%u+a,Math.floor(e/u)+f]}const s=this.binSorter.getBinValues(e);if(!s)return null;const i=s[3],o=[];for(let a=0;a<this.channelCount;a++){const l=this.props.operations[a];l==="COUNT"?o[a]=i:i===0?o[a]=NaN:o[a]=l==="MEAN"?s[a]/i:s[a]}return{id:n,value:o,count:i}}destroy(){this.binSorter.destroy(),this.aggregationTransform.destroy()}setProps(e){const t=this.props;if("binIdRange"in e&&!g(e.binIdRange,t.binIdRange,2)){const n=e.binIdRange;if(y.assert(n.length===this.dimensions),this.dimensions===1){const[[s,i]]=n;this.binCount=i-s}else{const[[s,i],[o,a]]=n;this.binCount=(i-s)*(a-o)}this.binSorter.setDimensions(this.binCount,n),this.aggregationTransform.setDimensions(this.binCount,n),this.setNeedsUpdate()}if(e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.pointCount!==void 0&&e.pointCount!==t.pointCount&&(this.binSorter.setModelProps({vertexCount:e.pointCount}),this.setNeedsUpdate()),e.binOptions&&(g(e.binOptions,t.binOptions,2)||this.setNeedsUpdate(),this.binSorter.model.shaderInputs.setProps({binOptions:e.binOptions})),e.attributes){const n={},s={};for(const i of Object.values(e.attributes))for(const[o,a]of Object.entries(i.getValue()))ArrayBuffer.isView(a)?s[o]=a:a&&(n[o]=a);this.binSorter.setModelProps({attributes:n,constantAttributes:s})}e.shaderModuleProps&&this.binSorter.setModelProps({shaderModuleProps:e.shaderModuleProps}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate.fill(!0):this.needsUpdate[e]=!0}update(){}preDraw(){var n,s;if(!this.needsUpdate.some(Boolean))return;const{operations:e}=this.props,t=this.needsUpdate.map((i,o)=>i?e[o]:null);this.binSorter.update(t),this.aggregationTransform.update(this.binSorter.texture,e);for(let i=0;i<this.channelCount;i++)this.needsUpdate[i]&&(this.needsUpdate[i]=!1,(s=(n=this.props).onUpdate)==null||s.call(n,{channel:i}))}}class X extends x{get isDrawable(){return!0}initializeState(){this.getAttributeManager().remove(["instancePickingColors"])}updateState(e){var n,s;super.updateState(e);const t=this.getAggregatorType();if(e.changeFlags.extensionsChanged||this.state.aggregatorType!==t){(n=this.state.aggregator)==null||n.destroy();const i=this.createAggregator(t);return i.setProps({attributes:(s=this.getAttributeManager())==null?void 0:s.attributes}),this.setState({aggregator:i,aggregatorType:t}),!0}return!1}finalizeState(e){super.finalizeState(e),this.state.aggregator.destroy()}updateAttributes(e){const{aggregator:t}=this.state;t.setProps({attributes:e});for(const n in e)this.onAttributeChange(n);t.update()}draw({shaderModuleProps:e}){const{aggregator:t}=this.state;t.setProps({shaderModuleProps:e}),t.preDraw()}_getAttributeManager(){return new I(this.context.device,{id:this.props.id,stats:this.context.stats})}}X.layerName="AggregationLayer";function $({dataBounds:r,getBinId:e,padding:t=0}){const n=[r[0],r[1],[r[0][0],r[1][1]],[r[1][0],r[0][1]]].map(l=>e(l)),s=Math.min(...n.map(l=>l[0]))-t,i=Math.min(...n.map(l=>l[1]))-t,o=Math.max(...n.map(l=>l[0]))+t+1,a=Math.max(...n.map(l=>l[1]))+t+1;return[[s,o],[i,a]]}export{X as A,Y as C,k as W,$ as g};
