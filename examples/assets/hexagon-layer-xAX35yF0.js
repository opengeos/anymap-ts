import{A as U,W as P,C as W,g as N}from"./bounds-utils-BpcTu37T.js";import{c as B,u as F,d as H}from"./color-utils-CH0udO2m.js";import{C as k}from"./column-layer-1kteMgOt.js";import{d as G,I as $,N as q,au as K}from"./mapbox-overlay-CtMyNbGZ.js";class V{constructor(e,o){this.props={scaleType:"linear",lowerPercentile:0,upperPercentile:100},this.domain=null,this.cutoff=null,this.input=e,this.inputLength=o,this.attribute=e}getScalePercentile(){if(!this._percentile){const e=w(this.input,this.inputLength);this._percentile=X(e)}return this._percentile}getScaleOrdinal(){if(!this._ordinal){const e=w(this.input,this.inputLength);this._ordinal=Q(e)}return this._ordinal}getCutoff({scaleType:e,lowerPercentile:o,upperPercentile:n}){if(e==="quantile")return[o,n-1];if(o>0||n<100){const{domain:t}=this.getScalePercentile();let i=t[Math.floor(o)-1]??-1/0,a=t[Math.floor(n)-1]??1/0;if(e==="ordinal"){const{domain:s}=this.getScaleOrdinal();i=s.findIndex(l=>l>=i),a=s.findIndex(l=>l>a)-1,a===-2&&(a=s.length-1)}return[i,a]}return null}update(e){const o=this.props;if(e.scaleType!==o.scaleType)switch(e.scaleType){case"quantile":{const{attribute:n}=this.getScalePercentile();this.attribute=n,this.domain=[0,99];break}case"ordinal":{const{attribute:n,domain:t}=this.getScaleOrdinal();this.attribute=n,this.domain=[0,t.length-1];break}default:this.attribute=this.input,this.domain=null}return(e.scaleType!==o.scaleType||e.lowerPercentile!==o.lowerPercentile||e.upperPercentile!==o.upperPercentile)&&(this.cutoff=this.getCutoff(e)),this.props=e,this}}function Q(r){const e=new Set;for(const t of r)Number.isFinite(t)&&e.add(t);const o=Array.from(e).sort(),n=new Map;for(let t=0;t<o.length;t++)n.set(o[t],t);return{attribute:{value:r.map(t=>Number.isFinite(t)?n.get(t):NaN),type:"float32",size:1},domain:o}}function X(r,e=100){const o=Array.from(r).filter(Number.isFinite).sort(Y);let n=0;const t=Math.max(1,e),i=new Array(t-1);for(;++n<t;)i[n-1]=J(o,n/t);return{attribute:{value:r.map(a=>Number.isFinite(a)?Z(i,a):NaN),type:"float32",size:1},domain:i}}function w(r,e){var a;const o=(r.stride??4)/4,n=(r.offset??0)/4;let t=r.value;if(!t){const s=(a=r.buffer)==null?void 0:a.readSyncWebGL(0,o*4*e);s&&(t=new Float32Array(s.buffer),r.value=t)}if(o===1)return t.subarray(0,e);const i=new Float32Array(e);for(let s=0;s<e;s++)i[s]=t[s*o+n];return i}function Y(r,e){return r-e}function J(r,e){const o=r.length;if(e<=0||o<2)return r[0];if(e>=1)return r[o-1];const n=(o-1)*e,t=Math.floor(n),i=r[t],a=r[t+1];return i+(a-i)*(n-t)}function Z(r,e){let o=0,n=r.length;for(;o<n;){const t=o+n>>>1;r[t]>e?n=t:o=t+1}return o}const T=Math.PI/3,v=2*Math.sin(T),C=1.5,ee=Array.from({length:6},(r,e)=>{const o=e*T;return[Math.sin(o),-Math.cos(o)]});function y([r,e],o){let n=Math.round(e=e/o/C),t=Math.round(r=r/o/v-(n&1)/2);const i=e-n;if(Math.abs(i)*3>1){const a=r-t,s=t+(r<t?-1:1)/2,l=n+(e<n?-1:1),u=r-s,c=e-l;a*a+i*i>u*u+c*c&&(t=s+(n&1?1:-1)/2,n=l)}return[t,n]}const te=`
const vec2 DIST = vec2(${v}, ${C});

ivec2 pointToHexbin(vec2 p, float radius) {
  p /= radius * DIST;
  float pj = round(p.y);
  float pjm2 = mod(pj, 2.0);
  p.x -= pjm2 * 0.5;
  float pi = round(p.x);
  vec2 d1 = p - vec2(pi, pj);

  if (abs(d1.y) * 3. > 1.) {
    vec2 v2 = step(0.0, d1) - 0.5;
    v2.y *= 2.0;
    vec2 d2 = d1 - v2;
    if (dot(d1, d1) > dot(d2, d2)) {
      pi += v2.x + pjm2 - 0.5;
      pj += v2.y;
    }
  }
  return ivec2(pi, pj);
}
`;function A([r,e],o){return[(r+(e&1)/2)*o*v,e*o*C]}const oe=`
const vec2 DIST = vec2(${v}, ${C});

vec2 hexbinCentroid(vec2 binId, float radius) {
  binId.x += fract(binId.y * 0.5);
  return binId * DIST * radius;
}
`,ne=`#version 300 es
#define SHADER_NAME hexagon-cell-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec2 instancePositions;
in float instanceElevationValues;
in float instanceColorValues;
in vec3 instancePickingColors;
uniform sampler2D colorRange;
out vec4 vColor;
${oe}
float interp(float value, vec2 domain, vec2 range) {
float r = min(max((value - domain.x) / (domain.y - domain.x), 0.), 1.);
return mix(range.x, range.y, r);
}
vec4 interp(float value, vec2 domain, sampler2D range) {
float r = (value - domain.x) / (domain.y - domain.x);
return texture(range, vec2(r, 0.5));
}
void main(void) {
geometry.pickingColor = instancePickingColors;
if (isnan(instanceColorValues) ||
instanceColorValues < hexagon.colorDomain.z ||
instanceColorValues > hexagon.colorDomain.w ||
instanceElevationValues < hexagon.elevationDomain.z ||
instanceElevationValues > hexagon.elevationDomain.w
) {
gl_Position = vec4(0.);
return;
}
vec2 commonPosition = hexbinCentroid(instancePositions, column.radius) + (hexagon.originCommon - project.commonOrigin.xy);
commonPosition += positions.xy * column.radius * column.coverage;
geometry.position = vec4(commonPosition, 0.0, 1.0);
geometry.normal = project_normal(normals);
float elevation = 0.0;
if (column.extruded) {
elevation = interp(instanceElevationValues, hexagon.elevationDomain.xy, hexagon.elevationRange);
elevation = project_size(elevation);
geometry.position.z = (positions.z + 1.0) / 2.0 * elevation;
}
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vColor = interp(instanceColorValues, hexagon.colorDomain.xy, colorRange);
vColor.a *= layer.opacity;
if (column.extruded) {
vColor.rgb = lighting_getLightColor(vColor.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,ie=`uniform hexagonUniforms {
  vec4 colorDomain;
  vec4 elevationDomain;
  vec2 elevationRange;
  vec2 originCommon;
} hexagon;
`,ae={name:"hexagon",vs:ie,uniformTypes:{colorDomain:"vec4<f32>",elevationDomain:"vec4<f32>",elevationRange:"vec2<f32>",originCommon:"vec2<f32>"}};class D extends k{getShaders(){const e=super.getShaders();return e.modules.push(ae),{...e,vs:ne}}initializeState(){super.initializeState();const e=this.getAttributeManager();e.remove(["instanceElevations","instanceFillColors","instanceLineColors","instanceStrokeWidths"]),e.addInstanced({instancePositions:{size:2,type:"float32",accessor:"getBin"},instanceColorValues:{size:1,type:"float32",accessor:"getColorValue"},instanceElevationValues:{size:1,type:"float32",accessor:"getElevationValue"}})}updateState(e){var i;super.updateState(e);const{props:o,oldProps:n}=e,t=this.state.fillModel;if(n.colorRange!==o.colorRange){(i=this.state.colorTexture)==null||i.destroy(),this.state.colorTexture=B(this.context.device,o.colorRange,o.colorScaleType);const a={colorRange:this.state.colorTexture};t.shaderInputs.setProps({hexagon:a})}else n.colorScaleType!==o.colorScaleType&&F(this.state.colorTexture,o.colorScaleType)}finalizeState(e){var o;super.finalizeState(e),(o=this.state.colorTexture)==null||o.destroy()}draw({uniforms:e}){const{radius:o,hexOriginCommon:n,elevationRange:t,elevationScale:i,extruded:a,coverage:s,colorDomain:l,elevationDomain:u}=this.props,c=this.props.colorCutoff||[-1/0,1/0],p=this.props.elevationCutoff||[-1/0,1/0],g=this.state.fillModel;g.vertexArray.indexBuffer&&g.setIndexBuffer(null),g.setVertexCount(this.state.fillVertexCount);const d={colorDomain:[Math.max(l[0],c[0]),Math.min(l[1],c[1]),Math.max(l[0]-1,c[0]),Math.min(l[1]+1,c[1])],elevationDomain:[Math.max(u[0],p[0]),Math.min(u[1],p[1]),Math.max(u[0]-1,p[0]),Math.min(u[1]+1,p[1])],elevationRange:[t[0]*i,t[1]*i],originCommon:n};g.shaderInputs.setProps({column:{extruded:a,coverage:s,radius:o},hexagon:d}),g.draw(this.context.renderPass)}}D.layerName="HexagonCellLayer";const re=`uniform binOptionsUniforms {
  vec2 hexOriginCommon;
  float radiusCommon;
} binOptions;
`,se={name:"binOptions",vs:re,uniformTypes:{hexOriginCommon:"vec2<f32>",radiusCommon:"f32"}};function I(){}const le={gpuAggregation:!0,colorDomain:null,colorRange:H,getColorValue:{type:"accessor",value:null},getColorWeight:{type:"accessor",value:1},colorAggregation:"SUM",lowerPercentile:{type:"number",min:0,max:100,value:0},upperPercentile:{type:"number",min:0,max:100,value:100},colorScaleType:"quantize",onSetColorDomain:I,elevationDomain:null,elevationRange:[0,1e3],getElevationValue:{type:"accessor",value:null},getElevationWeight:{type:"accessor",value:1},elevationAggregation:"SUM",elevationScale:{type:"number",min:0,value:1},elevationLowerPercentile:{type:"number",min:0,max:100,value:0},elevationUpperPercentile:{type:"number",min:0,max:100,value:100},elevationScaleType:"linear",onSetElevationDomain:I,radius:{type:"number",min:1,value:1e3},coverage:{type:"number",min:0,max:1,value:1},getPosition:{type:"accessor",value:r=>r.position},hexagonAggregator:{type:"function",optional:!0,value:null},extruded:!1,material:!0};class M extends U{getAggregatorType(){const{gpuAggregation:e,hexagonAggregator:o,getColorValue:n,getElevationValue:t}=this.props;return e&&(o||n||t)?(G.warn("Features not supported by GPU aggregation, falling back to CPU")(),"cpu"):e&&P.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){if(e==="cpu"){const{hexagonAggregator:o,radius:n}=this.props;return new W({dimensions:2,getBin:{sources:["positions"],getValue:({positions:t},i,a)=>{if(o)return o(t,n);const l=this.state.aggregatorViewport.projectPosition(t),{radiusCommon:u,hexOriginCommon:c}=a;return y([l[0]-c[0],l[1]-c[1]],u)}},getValue:[{sources:["colorWeights"],getValue:({colorWeights:t})=>t},{sources:["elevationWeights"],getValue:({elevationWeights:t})=>t}]})}return new P(this.context.device,{dimensions:2,channelCount:2,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[$,se],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float colorWeights;
  in float elevationWeights;
  
  ${te}

  void getBin(out ivec2 binId) {
    vec3 positionCommon = project_position(positions, positions64Low);
    binId = pointToHexbin(positionCommon.xy, binOptions.radiusCommon);
  }
  void getValue(out vec2 value) {
    value = vec2(colorWeights, elevationWeights);
  }
  `})})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},colorWeights:{size:1,accessor:"getColorWeight"},elevationWeights:{size:1,accessor:"getElevationWeight"}})}updateState(e){const o=super.updateState(e),{props:n,oldProps:t,changeFlags:i}=e,{aggregator:a}=this.state;if((i.dataChanged||!this.state.dataAsArray)&&(n.getColorValue||n.getElevationValue)&&(this.state.dataAsArray=Array.from(q(n.data).iterable)),o||i.dataChanged||n.radius!==t.radius||n.getColorValue!==t.getColorValue||n.getElevationValue!==t.getElevationValue||n.colorAggregation!==t.colorAggregation||n.elevationAggregation!==t.elevationAggregation){this._updateBinOptions();const{radiusCommon:s,hexOriginCommon:l,binIdRange:u,dataAsArray:c}=this.state;if(a.setProps({binIdRange:u,pointCount:this.getNumInstances(),operations:[n.colorAggregation,n.elevationAggregation],binOptions:{radiusCommon:s,hexOriginCommon:l},onUpdate:this._onAggregationUpdate.bind(this)}),c){const{getColorValue:p,getElevationValue:g}=this.props;a.setProps({customOperations:[p&&(d=>p(d.map(m=>c[m]),{indices:d,data:n.data})),g&&(d=>g(d.map(m=>c[m]),{indices:d,data:n.data}))]})}}return i.updateTriggersChanged&&i.updateTriggersChanged.getColorValue&&a.setNeedsUpdate(0),i.updateTriggersChanged&&i.updateTriggersChanged.getElevationValue&&a.setNeedsUpdate(1),o}_updateBinOptions(){const e=this.getBounds();let o=1,n=[0,0],t=[[0,1],[0,1]],i=this.context.viewport;if(e&&Number.isFinite(e[0][0])){let a=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2];const{radius:s}=this.props,{unitsPerMeter:l}=i.getDistanceScales(a);o=l[0]*s;const u=y(i.projectFlat(a),o);a=i.unprojectFlat(A(u,o));const c=i.constructor;i=i.isGeospatial?new c({longitude:a[0],latitude:a[1],zoom:12}):new K({position:[a[0],a[1],0],zoom:12}),n=[Math.fround(i.center[0]),Math.fround(i.center[1])],t=N({dataBounds:e,getBinId:p=>{const g=i.projectFlat(p);return g[0]-=n[0],g[1]-=n[1],y(g,o)},padding:1})}this.setState({radiusCommon:o,hexOriginCommon:n,binIdRange:t,aggregatorViewport:i})}draw(e){e.shaderModuleProps.project&&(e.shaderModuleProps.project.viewport=this.state.aggregatorViewport),super.draw(e)}_onAggregationUpdate({channel:e}){const o=this.getCurrentLayer().props,{aggregator:n}=this.state;if(e===0){const t=n.getResult(0);this.setState({colors:new V(t,n.binCount)}),o.onSetColorDomain(n.getResultDomain(0))}else if(e===1){const t=n.getResult(1);this.setState({elevations:new V(t,n.binCount)}),o.onSetElevationDomain(n.getResultDomain(1))}}onAttributeChange(e){const{aggregator:o}=this.state;switch(e){case"positions":o.setNeedsUpdate(),this._updateBinOptions();const{radiusCommon:n,hexOriginCommon:t,binIdRange:i}=this.state;o.setProps({binIdRange:i,binOptions:{radiusCommon:n,hexOriginCommon:t}});break;case"colorWeights":o.setNeedsUpdate(0);break;case"elevationWeights":o.setNeedsUpdate(1);break}}renderLayers(){var b,S;const{aggregator:e,radiusCommon:o,hexOriginCommon:n}=this.state,{elevationScale:t,colorRange:i,elevationRange:a,extruded:s,coverage:l,material:u,transitions:c,colorScaleType:p,lowerPercentile:g,upperPercentile:d,colorDomain:m,elevationScaleType:L,elevationLowerPercentile:R,elevationUpperPercentile:_,elevationDomain:E}=this.props,O=this.getSubLayerClass("cells",D),x=e.getBins(),h=(b=this.state.colors)==null?void 0:b.update({scaleType:p,lowerPercentile:g,upperPercentile:d}),f=(S=this.state.elevations)==null?void 0:S.update({scaleType:L,lowerPercentile:R,upperPercentile:_});return!h||!f?null:new O(this.getSubLayerProps({id:"cells"}),{data:{length:e.binCount,attributes:{getBin:x,getColorValue:h.attribute,getElevationValue:f.attribute}},dataComparator:(j,z)=>j.length===z.length,updateTriggers:{getBin:[x],getColorValue:[h.attribute],getElevationValue:[f.attribute]},diskResolution:6,vertices:ee,radius:o,hexOriginCommon:n,elevationScale:t,colorRange:i,colorScaleType:p,elevationRange:a,extruded:s,coverage:l,material:u,colorDomain:h.domain||m||e.getResultDomain(0),elevationDomain:f.domain||E||e.getResultDomain(1),colorCutoff:h.cutoff,elevationCutoff:f.cutoff,transitions:c&&{getFillColor:c.getColorValue||c.getColorWeight,getElevation:c.getElevationValue||c.getElevationWeight},extensions:[]})}getPickingInfo(e){const o=e.info,{index:n}=o;if(n>=0){const t=this.state.aggregator.getBin(n);let i;if(t){const a=A(t.id,this.state.radiusCommon),s=this.context.viewport.unprojectFlat(a);i={col:t.id[0],row:t.id[1],position:s,colorValue:t.value[0],elevationValue:t.value[1],count:t.count},t.pointIndices&&(i.pointIndices=t.pointIndices,i.points=Array.isArray(this.props.data)?t.pointIndices.map(l=>this.props.data[l]):[])}o.object=i}return o}}M.layerName="HexagonLayer";M.defaultProps=le;export{M as H};
