import{K as ee,N as L,O as te,W as ne,L as ie,H as j,a4 as oe,P as se,I as re,J as N,U as D,ad as T,ae,R as le,ac as ce,D as ue,af as de}from"./polygon-utils-Bl0lNSY2.js";class ge extends ee{constructor(e){const{indices:t,attributes:n}=fe(e);super({...e,indices:t,attributes:n})}}function fe(r){const{radius:e,height:t=1,nradial:n=10}=r;let{vertices:i}=r;i&&(L.assert(i.length>=n),i=i.flatMap(g=>[g[0],g[1]]),te(i,ne.COUNTER_CLOCKWISE));const o=t>0,s=n+1,a=o?s*3+1:n,l=Math.PI*2/n,d=new Uint16Array(o?n*3*2:0),c=new Float32Array(a*3),f=new Float32Array(a*3);let u=0;if(o){for(let g=0;g<s;g++){const h=g*l,p=g%n,m=Math.sin(h),b=Math.cos(h);for(let v=0;v<2;v++)c[u+0]=i?i[p*2]:b*e,c[u+1]=i?i[p*2+1]:m*e,c[u+2]=(1/2-v)*t,f[u+0]=i?i[p*2]:b,f[u+1]=i?i[p*2+1]:m,u+=3}c[u+0]=c[u-3],c[u+1]=c[u-2],c[u+2]=c[u-1],u+=3}for(let g=o?0:1;g<s;g++){const h=Math.floor(g/2)*Math.sign(.5-g%2),p=h*l,m=(h+n)%n,b=Math.sin(p),v=Math.cos(p);c[u+0]=i?i[m*2]:v*e,c[u+1]=i?i[m*2+1]:b*e,c[u+2]=t/2,f[u+2]=1,u+=3}if(o){let g=0;for(let h=0;h<n;h++)d[g++]=h*2+0,d[g++]=h*2+2,d[g++]=h*2+0,d[g++]=h*2+1,d[g++]=h*2+1,d[g++]=h*2+3}return{indices:d,attributes:{POSITION:{size:3,value:c},NORMAL:{size:3,value:f}}}}const R=`uniform columnUniforms {
  float radius;
  float angle;
  vec2 offset;
  bool extruded;
  bool stroked;
  bool isStroke;
  float coverage;
  float elevationScale;
  float edgeDistance;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int radiusUnits;
  highp int widthUnits;
} column;
`,he={name:"column",vs:R,fs:R,uniformTypes:{radius:"f32",angle:"f32",offset:"vec2<f32>",extruded:"f32",stroked:"f32",isStroke:"f32",coverage:"f32",elevationScale:"f32",edgeDistance:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",radiusUnits:"i32",widthUnits:"i32"}},me=`#version 300 es
#define SHADER_NAME column-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;
in vec3 instancePickingColors;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec3 cameraPosition;
out vec4 position_commonspace;
#endif
void main(void) {
geometry.worldPosition = instancePositions;
vec4 color = column.isStroke ? instanceLineColors : instanceFillColors;
mat2 rotationMatrix = mat2(cos(column.angle), sin(column.angle), -sin(column.angle), cos(column.angle));
float elevation = 0.0;
float strokeOffsetRatio = 1.0;
if (column.extruded) {
elevation = instanceElevations * (positions.z + 1.0) / 2.0 * column.elevationScale;
} else if (column.stroked) {
float widthPixels = clamp(
project_size_to_pixel(instanceStrokeWidths * column.widthScale, column.widthUnits),
column.widthMinPixels, column.widthMaxPixels) / 2.0;
float halfOffset = project_pixel_size(widthPixels) / project_size(column.edgeDistance * column.coverage * column.radius);
if (column.isStroke) {
strokeOffsetRatio -= sign(positions.z) * halfOffset;
} else {
strokeOffsetRatio -= halfOffset;
}
}
float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
float dotRadius = column.radius * column.coverage * shouldRender;
geometry.pickingColor = instancePickingColors;
vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
vec3 centroidPosition64Low = instancePositions64Low;
vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
if (column.radiusUnits == UNIT_METERS) {
offset = project_size(offset);
}
vec3 pos = vec3(offset, 0.);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (column.extruded && !column.isStroke) {
#ifdef FLAT_SHADING
cameraPosition = project.cameraPosition;
position_commonspace = geometry.position;
vColor = vec4(color.rgb, color.a * layer.opacity);
#else
vec3 lightColor = lighting_getLightColor(color.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, color.a * layer.opacity);
#endif
} else {
vColor = vec4(color.rgb, color.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,pe=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader
precision highp float;
out vec4 fragColor;
in vec4 vColor;
#ifdef FLAT_SHADING
in vec3 cameraPosition;
in vec4 position_commonspace;
#endif
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
#ifdef FLAT_SHADING
if (column.extruded && !column.isStroke && !bool(picking.isActive)) {
vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
fragColor.rgb = lighting_getLightColor(vColor.rgb, cameraPosition, position_commonspace.xyz, normal);
}
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,M=[0,0,0,255],ve={diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,flatShading:!1,getPosition:{type:"accessor",value:r=>r.position},getFillColor:{type:"accessor",value:M},getLineColor:{type:"accessor",value:M},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class O extends ie{getShaders(){const e={},{flatShading:t}=this.props;return t&&(e.FLAT_SHADING=1),super.getShaders({vs:me,fs:pe,defines:e,modules:[j,t?oe:se,re,he]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getFillColor",defaultValue:M},instanceLineColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getLineColor",defaultValue:M},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(e){var a;super.updateState(e);const{props:t,oldProps:n,changeFlags:i}=e,o=i.extensionsChanged||t.flatShading!==n.flatShading;o&&((a=this.state.models)==null||a.forEach(l=>l.destroy()),this.setState(this._getModels()),this.getAttributeManager().invalidateAll());const s=this.getNumInstances();this.state.fillModel.setInstanceCount(s),this.state.wireframeModel.setInstanceCount(s),(o||t.diskResolution!==n.diskResolution||t.vertices!==n.vertices||(t.extruded||t.stroked)!==(n.extruded||n.stroked))&&this._updateGeometry(t)}getGeometry(e,t,n){const i=new ge({radius:1,height:n?2:0,vertices:t,nradial:e});let o=0;if(t)for(let s=0;s<e;s++){const a=t[s],l=Math.sqrt(a[0]*a[0]+a[1]*a[1]);o+=l/e}else o=1;return this.setState({edgeDistance:Math.cos(Math.PI/e)*o}),i}_getModels(){const e=this.getShaders(),t=this.getAttributeManager().getBufferLayouts(),n=new N(this.context.device,{...e,id:`${this.props.id}-fill`,bufferLayout:t,isInstanced:!0}),i=new N(this.context.device,{...e,id:`${this.props.id}-wireframe`,bufferLayout:t,isInstanced:!0});return{fillModel:n,wireframeModel:i,models:[i,n]}}_updateGeometry({diskResolution:e,vertices:t,extruded:n,stroked:i}){const o=this.getGeometry(e,t,n||i);this.setState({fillVertexCount:o.attributes.POSITION.value.length/3});const s=this.state.fillModel,a=this.state.wireframeModel;s.setGeometry(o),s.setTopology("triangle-strip"),s.setIndexBuffer(null),a.setGeometry(o),a.setTopology("line-list")}draw({uniforms:e}){const{lineWidthUnits:t,lineWidthScale:n,lineWidthMinPixels:i,lineWidthMaxPixels:o,radiusUnits:s,elevationScale:a,extruded:l,filled:d,stroked:c,wireframe:f,offset:u,coverage:g,radius:h,angle:p}=this.props,m=this.state.fillModel,b=this.state.wireframeModel,{fillVertexCount:v,edgeDistance:_}=this.state,y={radius:h,angle:p/180*Math.PI,offset:u,extruded:l,stroked:c,coverage:g,elevationScale:a,edgeDistance:_,radiusUnits:D[s],widthUnits:D[t],widthScale:n,widthMinPixels:i,widthMaxPixels:o};l&&f&&(b.shaderInputs.setProps({column:{...y,isStroke:!0}}),b.draw(this.context.renderPass)),d&&(m.setVertexCount(v),m.shaderInputs.setProps({column:{...y,isStroke:!1}}),m.draw(this.context.renderPass)),!l&&c&&(m.setVertexCount(v*2/3),m.shaderInputs.setProps({column:{...y,isStroke:!0}}),m.draw(this.context.renderPass))}}O.layerName="ColumnLayer";O.defaultProps=ve;function be({pointCount:r,getBinId:e}){const t=new Map;for(let n=0;n<r;n++){const i=e(n);if(i===null)continue;let o=t.get(String(i));o?o.points.push(n):(o={id:i,index:t.size,points:[n]},t.set(String(i),o))}return Array.from(t.values())}function ye({bins:r,dimensions:e,target:t}){const n=r.length*e;(!t||t.length<n)&&(t=new Float32Array(n));for(let i=0;i<r.length;i++){const{id:o}=r[i];Array.isArray(o)?t.set(o,i*e):t[i]=o}return t}const xe=r=>r.length,G=(r,e)=>{let t=0;for(const n of r)t+=e(n);return t},Ce=(r,e)=>r.length===0?NaN:G(r,e)/r.length,Se=(r,e)=>{let t=1/0;for(const n of r){const i=e(n);i<t&&(t=i)}return t},Me=(r,e)=>{let t=-1/0;for(const n of r){const i=e(n);i>t&&(t=i)}return t},Ie={COUNT:xe,SUM:G,MEAN:Ce,MIN:Se,MAX:Me};function Ae({bins:r,getValue:e,operation:t,target:n}){(!n||n.length<r.length)&&(n=new Float32Array(r.length));let i=1/0,o=-1/0;for(let s=0;s<r.length;s++){const{points:a}=r[s];n[s]=t(a,e),n[s]<i&&(i=n[s]),n[s]>o&&(o=n[s])}return{value:n,domain:[i,o]}}function F(r,e,t){const n={};for(const o of r.sources||[]){const s=e[o];if(s)n[o]=Pe(s);else throw new Error(`Cannot find attribute ${o}`)}const i={};return o=>{for(const s in n)i[s]=n[s](o);return r.getValue(i,o,t)}}function Pe(r){const e=r.value,{offset:t=0,stride:n,size:i}=r.getAccessor(),o=e.BYTES_PER_ELEMENT,s=t/o,a=n?n/o:i;if(i===1)return r.isConstant?()=>e[0]:d=>{const c=s+a*d;return e[c]};let l;return r.isConstant?(l=Array.from(e),()=>l):(l=new Array(i),d=>{const c=s+a*d;for(let f=0;f<i;f++)l[f]=e[c+f];return l})}class _e{constructor(e){this.bins=[],this.binIds=null,this.results=[],this.dimensions=e.dimensions,this.channelCount=e.getValue.length,this.props={...e,binOptions:{},pointCount:0,operations:[],customOperations:[],attributes:{}},this.needsUpdate=!0,this.setProps(e)}destroy(){}get binCount(){return this.bins.length}setProps(e){const t=this.props;if(e.binOptions&&(T(e.binOptions,t.binOptions,2)||this.setNeedsUpdate()),e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.customOperations)for(let n=0;n<this.channelCount;n++)!!e.customOperations[n]!=!!t.customOperations[n]&&this.setNeedsUpdate(n);e.pointCount!==void 0&&e.pointCount!==t.pointCount&&this.setNeedsUpdate(),e.attributes&&(e.attributes={...t.attributes,...e.attributes}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate=!0:this.needsUpdate!==!0&&(this.needsUpdate=this.needsUpdate||[],this.needsUpdate[e]=!0)}update(){var e,t,n,i;if(this.needsUpdate===!0){this.bins=be({pointCount:this.props.pointCount,getBinId:F(this.props.getBin,this.props.attributes,this.props.binOptions)});const o=ye({bins:this.bins,dimensions:this.dimensions,target:(e=this.binIds)==null?void 0:e.value});this.binIds={value:o,type:"float32",size:this.dimensions}}for(let o=0;o<this.channelCount;o++)if(this.needsUpdate===!0||this.needsUpdate[o]){const s=this.props.customOperations[o]||Ie[this.props.operations[o]],{value:a,domain:l}=Ae({bins:this.bins,getValue:F(this.props.getValue[o],this.props.attributes,void 0),operation:s,target:(t=this.results[o])==null?void 0:t.value});this.results[o]={value:a,domain:l,type:"float32",size:1},(i=(n=this.props).onUpdate)==null||i.call(n,{channel:o})}this.needsUpdate=!1}preDraw(){}getBins(){return this.binIds}getResult(e){return this.results[e]}getResultDomain(e){var t;return((t=this.results[e])==null?void 0:t.domain)??[1/0,-1/0]}getBin(e){const t=this.bins[e];if(!t)return null;const n=new Array(this.channelCount);for(let i=0;i<n.length;i++){const o=this.results[i];n[i]=o==null?void 0:o.value[e]}return{id:t.id,value:n,count:t.points.length,pointIndices:t.points}}}function $(r,e,t){return r.createFramebuffer({width:e,height:t,colorAttachments:[r.createTexture({width:e,height:t,format:"rgba32float",sampler:{minFilter:"nearest",magFilter:"nearest"}})]})}const we=`uniform binSorterUniforms {
  ivec4 binIdRange;
  ivec2 targetSize;
} binSorter;
`,Ne={name:"binSorter",vs:we,uniformTypes:{binIdRange:"vec4<i32>",targetSize:"vec2<i32>"}},X=[1,2,4,8],B=3e38,Te={SUM:0,MEAN:0,MIN:0,MAX:0,COUNT:0},S=1024;class Le{constructor(e,t){this.binsFBO=null,this.device=e,this.model=Ee(e,t)}get texture(){return this.binsFBO?this.binsFBO.colorAttachments[0].texture:null}destroy(){var e,t;this.model.destroy(),(e=this.binsFBO)==null||e.colorAttachments[0].texture.destroy(),(t=this.binsFBO)==null||t.destroy()}getBinValues(e){if(!this.binsFBO)return null;const t=e%S,n=Math.floor(e/S),i=this.device.readPixelsToArrayWebGL(this.binsFBO,{sourceX:t,sourceY:n,sourceWidth:1,sourceHeight:1}).buffer;return new Float32Array(i)}setDimensions(e,t){var s,a;const n=S,i=Math.ceil(e/n);this.binsFBO?this.binsFBO.height<i&&this.binsFBO.resize({width:n,height:i}):this.binsFBO=$(this.device,n,i);const o={binIdRange:[t[0][0],t[0][1],((s=t[1])==null?void 0:s[0])||0,((a=t[1])==null?void 0:a[1])||0],targetSize:[this.binsFBO.width,this.binsFBO.height]};this.model.shaderInputs.setProps({binSorter:o})}setModelProps(e){const t=this.model;e.attributes&&t.setAttributes(e.attributes),e.constantAttributes&&t.setConstantAttributes(e.constantAttributes),e.vertexCount!==void 0&&t.setVertexCount(e.vertexCount),e.shaderModuleProps&&t.shaderInputs.setProps(e.shaderModuleProps)}update(e){if(!this.binsFBO)return;const t=Oe(e);this._updateBins("SUM",t.SUM+t.MEAN),this._updateBins("MIN",t.MIN),this._updateBins("MAX",t.MAX)}_updateBins(e,t){if(t===0)return;t|=X[3];const n=this.model,i=this.binsFBO,o=e==="MAX"?-B:e==="MIN"?B:0,s=this.device.beginRenderPass({id:`gpu-aggregation-${e}`,framebuffer:i,parameters:{viewport:[0,0,i.width,i.height],colorMask:t},clearColor:[o,o,o,0],clearDepth:!1,clearStencil:!1});n.setParameters({blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendColorOperation:e==="MAX"?"max":e==="MIN"?"min":"add",blendAlphaOperation:"add"}),n.draw(s),s.end()}}function Oe(r){const e={...Te};for(let t=0;t<r.length;t++){const n=r[t];n&&(e[n]+=X[t])}return e}function Ee(r,e){let t=e.vs;e.dimensions===2&&(t+=`
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
`,i=`#version 300 es
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
`;return new N(r,{bufferLayout:e.bufferLayout,modules:[...e.modules||[],Ne],defines:{...e.defines,NON_INSTANCED_MODEL:1,NUM_CHANNELS:e.channelCount},isInstanced:!1,vs:n,fs:i,topology:"point-list",disableWarnings:!0})}const Ue=`uniform aggregatorTransformUniforms {
  ivec4 binIdRange;
  bvec3 isCount;
  bvec3 isMean;
  float naN;
} aggregatorTransform;
`,De={name:"aggregatorTransform",vs:Ue,uniformTypes:{binIdRange:"vec4<i32>",isCount:"vec3<f32>",isMean:"vec3<f32>"}};class Re{constructor(e,t){this.binBuffer=null,this.valueBuffer=null,this._domains=null,this.device=e,this.channelCount=t.channelCount,this.transform=Fe(e,t),this.domainFBO=$(e,2,1)}destroy(){var e,t;this.transform.destroy(),(e=this.binBuffer)==null||e.destroy(),(t=this.valueBuffer)==null||t.destroy(),this.domainFBO.colorAttachments[0].texture.destroy(),this.domainFBO.destroy()}get domains(){if(!this._domains){const e=this.device.readPixelsToArrayWebGL(this.domainFBO).buffer,t=new Float32Array(e);this._domains=[[-t[4],t[0]],[-t[5],t[1]],[-t[6],t[2]]].slice(0,this.channelCount)}return this._domains}setDimensions(e,t){var l,d,c,f;const{model:n,transformFeedback:i}=this.transform;n.setVertexCount(e);const o={binIdRange:[t[0][0],t[0][1],((l=t[1])==null?void 0:l[0])||0,((d=t[1])==null?void 0:d[1])||0]};n.shaderInputs.setProps({aggregatorTransform:o});const s=e*t.length*4;(!this.binBuffer||this.binBuffer.byteLength<s)&&((c=this.binBuffer)==null||c.destroy(),this.binBuffer=this.device.createBuffer({byteLength:s}),i.setBuffer("binIds",this.binBuffer));const a=e*this.channelCount*4;(!this.valueBuffer||this.valueBuffer.byteLength<a)&&((f=this.valueBuffer)==null||f.destroy(),this.valueBuffer=this.device.createBuffer({byteLength:a}),i.setBuffer("values",this.valueBuffer))}update(e,t){if(!e)return;const n=this.transform,i=this.domainFBO,o=[0,1,2].map(l=>t[l]==="COUNT"?1:0),s=[0,1,2].map(l=>t[l]==="MEAN"?1:0),a={isCount:o,isMean:s,bins:e};n.model.shaderInputs.setProps({aggregatorTransform:a}),n.run({id:"gpu-aggregation-domain",framebuffer:i,parameters:{viewport:[0,0,2,1]},clearColor:[-3e38,-3e38,-3e38,0],clearDepth:!1,clearStencil:!1}),this._domains=null}}function Fe(r,e){const t=`#version 300 es
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
`;return new ae(r,{vs:t,fs:n,topology:"point-list",modules:[De],parameters:{blend:!0,blendColorSrcFactor:"one",blendColorDstFactor:"one",blendColorOperation:"max",blendAlphaSrcFactor:"one",blendAlphaDstFactor:"one",blendAlphaOperation:"max"},defines:{NUM_DIMS:e.dimensions,NUM_CHANNELS:e.channelCount,SAMPLER_WIDTH:S},varyings:["binIds","values"],disableWarnings:!0})}class V{static isSupported(e){return e.features.has("float32-renderable-webgl")&&e.features.has("texture-blend-float-webgl")}constructor(e,t){this.binCount=0,this.binIds=null,this.results=[],this.device=e,this.dimensions=t.dimensions,this.channelCount=t.channelCount,this.props={...t,pointCount:0,binIdRange:[[0,0]],operations:[],attributes:{},binOptions:{}},this.needsUpdate=new Array(this.channelCount).fill(!0),this.binSorter=new Le(e,t),this.aggregationTransform=new Re(e,t),this.setProps(t)}getBins(){var t;const e=this.aggregationTransform.binBuffer;return e?(((t=this.binIds)==null?void 0:t.buffer)!==e&&(this.binIds={buffer:e,type:"float32",size:this.dimensions}),this.binIds):null}getResult(e){var n;const t=this.aggregationTransform.valueBuffer;return!t||e>=this.channelCount?null:(((n=this.results[e])==null?void 0:n.buffer)!==t&&(this.results[e]={buffer:t,type:"float32",size:1,stride:this.channelCount*4,offset:e*4}),this.results[e])}getResultDomain(e){return this.aggregationTransform.domains[e]}getBin(e){if(e<0||e>=this.binCount)return null;const{binIdRange:t}=this.props;let n;if(this.dimensions===1)n=[e+t[0][0]];else{const[[a,l],[d]]=t,c=l-a;n=[e%c+a,Math.floor(e/c)+d]}const i=this.binSorter.getBinValues(e);if(!i)return null;const o=i[3],s=[];for(let a=0;a<this.channelCount;a++){const l=this.props.operations[a];l==="COUNT"?s[a]=o:o===0?s[a]=NaN:s[a]=l==="MEAN"?i[a]/o:i[a]}return{id:n,value:s,count:o}}destroy(){this.binSorter.destroy(),this.aggregationTransform.destroy()}setProps(e){const t=this.props;if("binIdRange"in e&&!T(e.binIdRange,t.binIdRange,2)){const n=e.binIdRange;if(L.assert(n.length===this.dimensions),this.dimensions===1){const[[i,o]]=n;this.binCount=o-i}else{const[[i,o],[s,a]]=n;this.binCount=(o-i)*(a-s)}this.binSorter.setDimensions(this.binCount,n),this.aggregationTransform.setDimensions(this.binCount,n),this.setNeedsUpdate()}if(e.operations)for(let n=0;n<this.channelCount;n++)e.operations[n]!==t.operations[n]&&this.setNeedsUpdate(n);if(e.pointCount!==void 0&&e.pointCount!==t.pointCount&&(this.binSorter.setModelProps({vertexCount:e.pointCount}),this.setNeedsUpdate()),e.binOptions&&(T(e.binOptions,t.binOptions,2)||this.setNeedsUpdate(),this.binSorter.model.shaderInputs.setProps({binOptions:e.binOptions})),e.attributes){const n={},i={};for(const o of Object.values(e.attributes))for(const[s,a]of Object.entries(o.getValue()))ArrayBuffer.isView(a)?i[s]=a:a&&(n[s]=a);this.binSorter.setModelProps({attributes:n,constantAttributes:i})}e.shaderModuleProps&&this.binSorter.setModelProps({shaderModuleProps:e.shaderModuleProps}),Object.assign(this.props,e)}setNeedsUpdate(e){e===void 0?this.needsUpdate.fill(!0):this.needsUpdate[e]=!0}update(){}preDraw(){var n,i;if(!this.needsUpdate.some(Boolean))return;const{operations:e}=this.props,t=this.needsUpdate.map((o,s)=>o?e[s]:null);this.binSorter.update(t),this.aggregationTransform.update(this.binSorter.texture,e);for(let o=0;o<this.channelCount;o++)this.needsUpdate[o]&&(this.needsUpdate[o]=!1,(i=(n=this.props).onUpdate)==null||i.call(n,{channel:o}))}}class q extends le{get isDrawable(){return!0}initializeState(){this.getAttributeManager().remove(["instancePickingColors"])}updateState(e){var n,i;super.updateState(e);const t=this.getAggregatorType();if(e.changeFlags.extensionsChanged||this.state.aggregatorType!==t){(n=this.state.aggregator)==null||n.destroy();const o=this.createAggregator(t);return o.setProps({attributes:(i=this.getAttributeManager())==null?void 0:i.attributes}),this.setState({aggregator:o,aggregatorType:t}),!0}return!1}finalizeState(e){super.finalizeState(e),this.state.aggregator.destroy()}updateAttributes(e){const{aggregator:t}=this.state;t.setProps({attributes:e});for(const n in e)this.onAttributeChange(n);t.update()}draw({shaderModuleProps:e}){const{aggregator:t}=this.state;t.setProps({shaderModuleProps:e}),t.preDraw()}_getAttributeManager(){return new ce(this.context.device,{id:this.props.id,stats:this.context.stats})}}q.layerName="AggregationLayer";const Be=[[255,255,178],[254,217,118],[254,178,76],[253,141,60],[240,59,32],[189,0,38]];function Ve(r,e=!1,t=Float32Array){let n;if(Number.isFinite(r[0]))n=new t(r);else{n=new t(r.length*4);let i=0;for(let o=0;o<r.length;o++){const s=r[o];n[i++]=s[0],n[i++]=s[1],n[i++]=s[2],n[i++]=Number.isFinite(s[3])?s[3]:255}}if(e)for(let i=0;i<n.length;i++)n[i]/=255;return n}const I={linear:"linear",quantile:"nearest",quantize:"nearest",ordinal:"nearest"};function ze(r,e){r.setSampler({minFilter:I[e],magFilter:I[e]})}function ke(r,e,t="linear"){const n=Ve(e,!1,Uint8Array);return r.createTexture({format:"rgba8unorm",sampler:{minFilter:I[t],magFilter:I[t],addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},data:n,width:n.length/4,height:1})}class z{constructor(e,t){this.props={scaleType:"linear",lowerPercentile:0,upperPercentile:100},this.domain=null,this.cutoff=null,this.input=e,this.inputLength=t,this.attribute=e}getScalePercentile(){if(!this._percentile){const e=k(this.input,this.inputLength);this._percentile=He(e)}return this._percentile}getScaleOrdinal(){if(!this._ordinal){const e=k(this.input,this.inputLength);this._ordinal=We(e)}return this._ordinal}getCutoff({scaleType:e,lowerPercentile:t,upperPercentile:n}){if(e==="quantile")return[t,n-1];if(t>0||n<100){const{domain:i}=this.getScalePercentile();let o=i[Math.floor(t)-1]??-1/0,s=i[Math.floor(n)-1]??1/0;if(e==="ordinal"){const{domain:a}=this.getScaleOrdinal();o=a.findIndex(l=>l>=o),s=a.findIndex(l=>l>s)-1,s===-2&&(s=a.length-1)}return[o,s]}return null}update(e){const t=this.props;if(e.scaleType!==t.scaleType)switch(e.scaleType){case"quantile":{const{attribute:n}=this.getScalePercentile();this.attribute=n,this.domain=[0,99];break}case"ordinal":{const{attribute:n,domain:i}=this.getScaleOrdinal();this.attribute=n,this.domain=[0,i.length-1];break}default:this.attribute=this.input,this.domain=null}return(e.scaleType!==t.scaleType||e.lowerPercentile!==t.lowerPercentile||e.upperPercentile!==t.upperPercentile)&&(this.cutoff=this.getCutoff(e)),this.props=e,this}}function We(r){const e=new Set;for(const i of r)Number.isFinite(i)&&e.add(i);const t=Array.from(e).sort(),n=new Map;for(let i=0;i<t.length;i++)n.set(t[i],i);return{attribute:{value:r.map(i=>Number.isFinite(i)?n.get(i):NaN),type:"float32",size:1},domain:t}}function He(r,e=100){const t=Array.from(r).filter(Number.isFinite).sort(je);let n=0;const i=Math.max(1,e),o=new Array(i-1);for(;++n<i;)o[n-1]=Ge(t,n/i);return{attribute:{value:r.map(s=>Number.isFinite(s)?$e(o,s):NaN),type:"float32",size:1},domain:o}}function k(r,e){var s;const t=(r.stride??4)/4,n=(r.offset??0)/4;let i=r.value;if(!i){const a=(s=r.buffer)==null?void 0:s.readSyncWebGL(0,t*4*e);a&&(i=new Float32Array(a.buffer),r.value=i)}if(t===1)return i.subarray(0,e);const o=new Float32Array(e);for(let a=0;a<e;a++)o[a]=i[a*t+n];return o}function je(r,e){return r-e}function Ge(r,e){const t=r.length;if(e<=0||t<2)return r[0];if(e>=1)return r[t-1];const n=(t-1)*e,i=Math.floor(n),o=r[i],s=r[i+1];return o+(s-o)*(n-i)}function $e(r,e){let t=0,n=r.length;for(;t<n;){const i=t+n>>>1;r[i]>e?n=i:t=i+1}return t}function Xe({dataBounds:r,getBinId:e,padding:t=0}){const n=[r[0],r[1],[r[0][0],r[1][1]],[r[1][0],r[0][1]]].map(l=>e(l)),i=Math.min(...n.map(l=>l[0]))-t,o=Math.min(...n.map(l=>l[1]))-t,s=Math.max(...n.map(l=>l[0]))+t+1,a=Math.max(...n.map(l=>l[1]))+t+1;return[[i,s],[o,a]]}const K=Math.PI/3,A=2*Math.sin(K),P=1.5,qe=Array.from({length:6},(r,e)=>{const t=e*K;return[Math.sin(t),-Math.cos(t)]});function w([r,e],t){let n=Math.round(e=e/t/P),i=Math.round(r=r/t/A-(n&1)/2);const o=e-n;if(Math.abs(o)*3>1){const s=r-i,a=i+(r<i?-1:1)/2,l=n+(e<n?-1:1),d=r-a,c=e-l;s*s+o*o>d*d+c*c&&(i=a+(n&1?1:-1)/2,n=l)}return[i,n]}const Ke=`
const vec2 DIST = vec2(${A}, ${P});

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
`;function W([r,e],t){return[(r+(e&1)/2)*t*A,e*t*P]}const Ye=`
const vec2 DIST = vec2(${A}, ${P});

vec2 hexbinCentroid(vec2 binId, float radius) {
  binId.x += fract(binId.y * 0.5);
  return binId * DIST * radius;
}
`,Je=`#version 300 es
#define SHADER_NAME hexagon-cell-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec2 instancePositions;
in float instanceElevationValues;
in float instanceColorValues;
in vec3 instancePickingColors;
uniform sampler2D colorRange;
out vec4 vColor;
${Ye}
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
`,Qe=`uniform hexagonUniforms {
  vec4 colorDomain;
  vec4 elevationDomain;
  vec2 elevationRange;
  vec2 originCommon;
} hexagon;
`,Ze={name:"hexagon",vs:Qe,uniformTypes:{colorDomain:"vec4<f32>",elevationDomain:"vec4<f32>",elevationRange:"vec2<f32>",originCommon:"vec2<f32>"}};class Y extends O{getShaders(){const e=super.getShaders();return e.modules.push(Ze),{...e,vs:Je}}initializeState(){super.initializeState();const e=this.getAttributeManager();e.remove(["instanceElevations","instanceFillColors","instanceLineColors","instanceStrokeWidths"]),e.addInstanced({instancePositions:{size:2,type:"float32",accessor:"getBin"},instanceColorValues:{size:1,type:"float32",accessor:"getColorValue"},instanceElevationValues:{size:1,type:"float32",accessor:"getElevationValue"}})}updateState(e){var o;super.updateState(e);const{props:t,oldProps:n}=e,i=this.state.fillModel;if(n.colorRange!==t.colorRange){(o=this.state.colorTexture)==null||o.destroy(),this.state.colorTexture=ke(this.context.device,t.colorRange,t.colorScaleType);const s={colorRange:this.state.colorTexture};i.shaderInputs.setProps({hexagon:s})}else n.colorScaleType!==t.colorScaleType&&ze(this.state.colorTexture,t.colorScaleType)}finalizeState(e){var t;super.finalizeState(e),(t=this.state.colorTexture)==null||t.destroy()}draw({uniforms:e}){const{radius:t,hexOriginCommon:n,elevationRange:i,elevationScale:o,extruded:s,coverage:a,colorDomain:l,elevationDomain:d}=this.props,c=this.props.colorCutoff||[-1/0,1/0],f=this.props.elevationCutoff||[-1/0,1/0],u=this.state.fillModel;u.vertexArray.indexBuffer&&u.setIndexBuffer(null),u.setVertexCount(this.state.fillVertexCount);const g={colorDomain:[Math.max(l[0],c[0]),Math.min(l[1],c[1]),Math.max(l[0]-1,c[0]),Math.min(l[1]+1,c[1])],elevationDomain:[Math.max(d[0],f[0]),Math.min(d[1],f[1]),Math.max(d[0]-1,f[0]),Math.min(d[1]+1,f[1])],elevationRange:[i[0]*o,i[1]*o],originCommon:n};u.shaderInputs.setProps({column:{extruded:s,coverage:a,radius:t},hexagon:g}),u.draw(this.context.renderPass)}}Y.layerName="HexagonCellLayer";const et=`uniform binOptionsUniforms {
  vec2 hexOriginCommon;
  float radiusCommon;
} binOptions;
`,tt={name:"binOptions",vs:et,uniformTypes:{hexOriginCommon:"vec2<f32>",radiusCommon:"f32"}};function H(){}const nt={gpuAggregation:!0,colorDomain:null,colorRange:Be,getColorValue:{type:"accessor",value:null},getColorWeight:{type:"accessor",value:1},colorAggregation:"SUM",lowerPercentile:{type:"number",min:0,max:100,value:0},upperPercentile:{type:"number",min:0,max:100,value:100},colorScaleType:"quantize",onSetColorDomain:H,elevationDomain:null,elevationRange:[0,1e3],getElevationValue:{type:"accessor",value:null},getElevationWeight:{type:"accessor",value:1},elevationAggregation:"SUM",elevationScale:{type:"number",min:0,value:1},elevationLowerPercentile:{type:"number",min:0,max:100,value:0},elevationUpperPercentile:{type:"number",min:0,max:100,value:100},elevationScaleType:"linear",onSetElevationDomain:H,radius:{type:"number",min:1,value:1e3},coverage:{type:"number",min:0,max:1,value:1},getPosition:{type:"accessor",value:r=>r.position},hexagonAggregator:{type:"function",optional:!0,value:null},extruded:!1,material:!0};class J extends q{getAggregatorType(){const{gpuAggregation:e,hexagonAggregator:t,getColorValue:n,getElevationValue:i}=this.props;return e&&(t||n||i)?(L.warn("Features not supported by GPU aggregation, falling back to CPU")(),"cpu"):e&&V.isSupported(this.context.device)?"gpu":"cpu"}createAggregator(e){if(e==="cpu"){const{hexagonAggregator:t,radius:n}=this.props;return new _e({dimensions:2,getBin:{sources:["positions"],getValue:({positions:i},o,s)=>{if(t)return t(i,n);const l=this.state.aggregatorViewport.projectPosition(i),{radiusCommon:d,hexOriginCommon:c}=s;return w([l[0]-c[0],l[1]-c[1]],d)}},getValue:[{sources:["colorWeights"],getValue:({colorWeights:i})=>i},{sources:["elevationWeights"],getValue:({elevationWeights:i})=>i}]})}return new V(this.context.device,{dimensions:2,channelCount:2,bufferLayout:this.getAttributeManager().getBufferLayouts({isInstanced:!1}),...super.getShaders({modules:[j,tt],vs:`
  in vec3 positions;
  in vec3 positions64Low;
  in float colorWeights;
  in float elevationWeights;
  
  ${Ke}

  void getBin(out ivec2 binId) {
    vec3 positionCommon = project_position(positions, positions64Low);
    binId = pointToHexbin(positionCommon.xy, binOptions.radiusCommon);
  }
  void getValue(out vec2 value) {
    value = vec2(colorWeights, elevationWeights);
  }
  `})})}initializeState(){super.initializeState(),this.getAttributeManager().add({positions:{size:3,accessor:"getPosition",type:"float64",fp64:this.use64bitPositions()},colorWeights:{size:1,accessor:"getColorWeight"},elevationWeights:{size:1,accessor:"getElevationWeight"}})}updateState(e){const t=super.updateState(e),{props:n,oldProps:i,changeFlags:o}=e,{aggregator:s}=this.state;if((o.dataChanged||!this.state.dataAsArray)&&(n.getColorValue||n.getElevationValue)&&(this.state.dataAsArray=Array.from(ue(n.data).iterable)),t||o.dataChanged||n.radius!==i.radius||n.getColorValue!==i.getColorValue||n.getElevationValue!==i.getElevationValue||n.colorAggregation!==i.colorAggregation||n.elevationAggregation!==i.elevationAggregation){this._updateBinOptions();const{radiusCommon:a,hexOriginCommon:l,binIdRange:d,dataAsArray:c}=this.state;if(s.setProps({binIdRange:d,pointCount:this.getNumInstances(),operations:[n.colorAggregation,n.elevationAggregation],binOptions:{radiusCommon:a,hexOriginCommon:l},onUpdate:this._onAggregationUpdate.bind(this)}),c){const{getColorValue:f,getElevationValue:u}=this.props;s.setProps({customOperations:[f&&(g=>f(g.map(h=>c[h]),{indices:g,data:n.data})),u&&(g=>u(g.map(h=>c[h]),{indices:g,data:n.data}))]})}}return o.updateTriggersChanged&&o.updateTriggersChanged.getColorValue&&s.setNeedsUpdate(0),o.updateTriggersChanged&&o.updateTriggersChanged.getElevationValue&&s.setNeedsUpdate(1),t}_updateBinOptions(){const e=this.getBounds();let t=1,n=[0,0],i=[[0,1],[0,1]],o=this.context.viewport;if(e&&Number.isFinite(e[0][0])){let s=[(e[0][0]+e[1][0])/2,(e[0][1]+e[1][1])/2];const{radius:a}=this.props,{unitsPerMeter:l}=o.getDistanceScales(s);t=l[0]*a;const d=w(o.projectFlat(s),t);s=o.unprojectFlat(W(d,t));const c=o.constructor;o=o.isGeospatial?new c({longitude:s[0],latitude:s[1],zoom:12}):new de({position:[s[0],s[1],0],zoom:12}),n=[Math.fround(o.center[0]),Math.fround(o.center[1])],i=Xe({dataBounds:e,getBinId:f=>{const u=o.projectFlat(f);return u[0]-=n[0],u[1]-=n[1],w(u,t)},padding:1})}this.setState({radiusCommon:t,hexOriginCommon:n,binIdRange:i,aggregatorViewport:o})}draw(e){e.shaderModuleProps.project&&(e.shaderModuleProps.project.viewport=this.state.aggregatorViewport),super.draw(e)}_onAggregationUpdate({channel:e}){const t=this.getCurrentLayer().props,{aggregator:n}=this.state;if(e===0){const i=n.getResult(0);this.setState({colors:new z(i,n.binCount)}),t.onSetColorDomain(n.getResultDomain(0))}else if(e===1){const i=n.getResult(1);this.setState({elevations:new z(i,n.binCount)}),t.onSetElevationDomain(n.getResultDomain(1))}}onAttributeChange(e){const{aggregator:t}=this.state;switch(e){case"positions":t.setNeedsUpdate(),this._updateBinOptions();const{radiusCommon:n,hexOriginCommon:i,binIdRange:o}=this.state;t.setProps({binIdRange:o,binOptions:{radiusCommon:n,hexOriginCommon:i}});break;case"colorWeights":t.setNeedsUpdate(0);break;case"elevationWeights":t.setNeedsUpdate(1);break}}renderLayers(){var E,U;const{aggregator:e,radiusCommon:t,hexOriginCommon:n}=this.state,{elevationScale:i,colorRange:o,elevationRange:s,extruded:a,coverage:l,material:d,transitions:c,colorScaleType:f,lowerPercentile:u,upperPercentile:g,colorDomain:h,elevationScaleType:p,elevationLowerPercentile:m,elevationUpperPercentile:b,elevationDomain:v}=this.props,_=this.getSubLayerClass("cells",Y),y=e.getBins(),x=(E=this.state.colors)==null?void 0:E.update({scaleType:f,lowerPercentile:u,upperPercentile:g}),C=(U=this.state.elevations)==null?void 0:U.update({scaleType:p,lowerPercentile:m,upperPercentile:b});return!x||!C?null:new _(this.getSubLayerProps({id:"cells"}),{data:{length:e.binCount,attributes:{getBin:y,getColorValue:x.attribute,getElevationValue:C.attribute}},dataComparator:(Q,Z)=>Q.length===Z.length,updateTriggers:{getBin:[y],getColorValue:[x.attribute],getElevationValue:[C.attribute]},diskResolution:6,vertices:qe,radius:t,hexOriginCommon:n,elevationScale:i,colorRange:o,colorScaleType:f,elevationRange:s,extruded:a,coverage:l,material:d,colorDomain:x.domain||h||e.getResultDomain(0),elevationDomain:C.domain||v||e.getResultDomain(1),colorCutoff:x.cutoff,elevationCutoff:C.cutoff,transitions:c&&{getFillColor:c.getColorValue||c.getColorWeight,getElevation:c.getElevationValue||c.getElevationWeight},extensions:[]})}getPickingInfo(e){const t=e.info,{index:n}=t;if(n>=0){const i=this.state.aggregator.getBin(n);let o;if(i){const s=W(i.id,this.state.radiusCommon),a=this.context.viewport.unprojectFlat(s);o={col:i.id[0],row:i.id[1],position:a,colorValue:i.value[0],elevationValue:i.value[1],count:i.count},i.pointIndices&&(o.pointIndices=i.pointIndices,o.points=Array.isArray(this.props.data)?i.pointIndices.map(l=>this.props.data[l]):[])}t.object=o}return t}}J.layerName="HexagonLayer";J.defaultProps=nt;export{J as H,Ve as c,Be as d};
