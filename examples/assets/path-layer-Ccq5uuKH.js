import{Z as j,R as V,$ as k,B as U,a0 as J,L as H,C as Z,U as K,D as Y}from"./mapbox-overlay-DuGg2Dfa.js";import{p as W}from"./picking-CN0D5Hbh.js";import{G as X}from"./geometry-BGUg4AMQ.js";class q{constructor(t){this.indexStarts=[0],this.vertexStarts=[0],this.vertexCount=0,this.instanceCount=0;const{attributes:e={}}=t;this.typedArrayManager=j,this.attributes={},this._attributeDefs=e,this.opts=t,this.updateGeometry(t)}updateGeometry(t){Object.assign(this.opts,t);const{data:e,buffers:i={},getGeometry:n,geometryBuffer:s,positionFormat:r,dataChanged:a,normalize:l=!0}=this.opts;if(this.data=e,this.getGeometry=n,this.positionSize=s&&s.size||(r==="XY"?2:3),this.buffers=i,this.normalize=l,s&&(V(e.startIndices),this.getGeometry=this.getGeometryFromBuffer(s),l||(i.vertexPositions=s)),this.geometryBuffer=i.vertexPositions,Array.isArray(a))for(const f of a)this._rebuildGeometry(f);else this._rebuildGeometry()}updatePartialGeometry({startRow:t,endRow:e}){this._rebuildGeometry({startRow:t,endRow:e})}getGeometryFromBuffer(t){const e=t.value||t;return ArrayBuffer.isView(e)?k(e,{size:this.positionSize,offset:t.offset,stride:t.stride,startIndices:this.data.startIndices}):null}_allocate(t,e){const{attributes:i,buffers:n,_attributeDefs:s,typedArrayManager:r}=this;for(const a in s)if(a in n)r.release(i[a]),i[a]=null;else{const l=s[a];l.copy=e,i[a]=r.allocate(i[a],t,l)}}_forEachGeometry(t,e,i){const{data:n,getGeometry:s}=this,{iterable:r,objectInfo:a}=U(n,e,i);for(const l of r){a.index++;const f=s?s(l,a):null;t(f,a.index)}}_rebuildGeometry(t){if(!this.data)return;let{indexStarts:e,vertexStarts:i,instanceCount:n}=this;const{data:s,geometryBuffer:r}=this,{startRow:a=0,endRow:l=1/0}=t||{},f={};if(t||(e=[0],i=[0]),this.normalize||!r)this._forEachGeometry((c,u)=>{const d=c&&this.normalizeGeometry(c);f[u]=d,i[u+1]=i[u]+(d?this.getGeometrySize(d):0)},a,l),n=i[i.length-1];else if(i=s.startIndices,n=i[s.length]||0,ArrayBuffer.isView(r))n=n||r.length/this.positionSize;else if(r instanceof J){const c=this.positionSize*4;n=n||r.byteLength/c}else if(r.buffer){const c=r.stride||this.positionSize*4;n=n||r.buffer.byteLength/c}else if(r.value){const c=r.value,u=r.stride/c.BYTES_PER_ELEMENT||this.positionSize;n=n||c.length/u}this._allocate(n,!!t),this.indexStarts=e,this.vertexStarts=i,this.instanceCount=n;const p={};this._forEachGeometry((c,u)=>{const d=f[u]||c;p.vertexStart=i[u],p.indexStart=e[u];const g=u<i.length-1?i[u+1]:n;p.geometrySize=g-i[u],p.geometryIndex=u,this.updateGeometryAttributes(d,p)},a,l),this.vertexCount=e[e.length-1]}}function m(o,t){const e=t.length,i=o.length;if(i>0){let n=!0;for(let s=0;s<e;s++)if(o[i-e+s]!==t[s]){n=!1;break}if(n)return!1}for(let n=0;n<e;n++)o[i+n]=t[n];return!0}function T(o,t){const e=t.length;for(let i=0;i<e;i++)o[i]=t[i]}function S(o,t,e,i,n=[]){const s=i+t*e;for(let r=0;r<e;r++)n[r]=o[s+r];return n}function A(o,t,e,i,n=[]){let s,r;if(e&8)s=(i[3]-o[1])/(t[1]-o[1]),r=3;else if(e&4)s=(i[1]-o[1])/(t[1]-o[1]),r=1;else if(e&2)s=(i[2]-o[0])/(t[0]-o[0]),r=2;else if(e&1)s=(i[0]-o[0])/(t[0]-o[0]),r=0;else return null;for(let a=0;a<o.length;a++)n[a]=(r&1)===a?i[r]:s*(t[a]-o[a])+o[a];return n}function _(o,t){let e=0;return o[0]<t[0]?e|=1:o[0]>t[2]&&(e|=2),o[1]<t[1]?e|=4:o[1]>t[3]&&(e|=8),e}function B(o,t){const{size:e=2,broken:i=!1,gridResolution:n=10,gridOffset:s=[0,0],startIndex:r=0,endIndex:a=o.length}=t||{},l=(a-r)/e;let f=[];const p=[f],c=S(o,0,e,r);let u,d;const g=G(c,n,s,[]),h=[];m(f,c);for(let P=1;P<l;P++){for(u=S(o,P,e,r,u),d=_(u,g);d;){A(c,u,d,g,h);const y=_(h,g);y&&(A(c,h,y,g,h),d=y),m(f,h),T(c,h),tt(g,n,d),i&&f.length>e&&(f=[],p.push(f),m(f,c)),d=_(u,g)}m(f,u),T(c,u)}return i?p:p[0]}const I=0,$=1;function Q(o,t=null,e){if(!o.length)return[];const{size:i=2,gridResolution:n=10,gridOffset:s=[0,0],edgeTypes:r=!1}=e||{},a=[],l=[{pos:o,types:r?new Array(o.length/i).fill($):null,holes:t||[]}],f=[[],[]];let p=[];for(;l.length;){const{pos:c,types:u,holes:d}=l.shift();et(c,i,d[0]||c.length,f),p=G(f[0],n,s,p);const g=_(f[1],p);if(g){let h=z(c,u,i,0,d[0]||c.length,p,g);const P={pos:h[0].pos,types:h[0].types,holes:[]},y={pos:h[1].pos,types:h[1].types,holes:[]};l.push(P,y);for(let v=0;v<d.length;v++)h=z(c,u,i,d[v],d[v+1]||c.length,p,g),h[0]&&(P.holes.push(P.pos.length),P.pos=L(P.pos,h[0].pos),r&&(P.types=L(P.types,h[0].types))),h[1]&&(y.holes.push(y.pos.length),y.pos=L(y.pos,h[1].pos),r&&(y.types=L(y.types,h[1].types)))}else{const h={positions:c};r&&(h.edgeTypes=u),d.length&&(h.holeIndices=d),a.push(h)}}return a}function z(o,t,e,i,n,s,r){const a=(n-i)/e,l=[],f=[],p=[],c=[],u=[];let d,g,h;const P=S(o,a-1,e,i);let y=Math.sign(r&8?P[1]-s[3]:P[0]-s[2]),v=t&&t[a-1],C=0,b=0;for(let x=0;x<a;x++)d=S(o,x,e,i,d),g=Math.sign(r&8?d[1]-s[3]:d[0]-s[2]),h=t&&t[i/e+x],g&&y&&y!==g&&(A(P,d,r,s,u),m(l,u)&&p.push(v),m(f,u)&&c.push(v)),g<=0?(m(l,d)&&p.push(h),C-=g):p.length&&(p[p.length-1]=I),g>=0?(m(f,d)&&c.push(h),b+=g):c.length&&(c[c.length-1]=I),T(P,d),y=g,v=h;return[C?{pos:l,types:t&&p}:null,b?{pos:f,types:t&&c}:null]}function G(o,t,e,i){const n=Math.floor((o[0]-e[0])/t)*t+e[0],s=Math.floor((o[1]-e[1])/t)*t+e[1];return i[0]=n,i[1]=s,i[2]=n+t,i[3]=s+t,i}function tt(o,t,e){e&8?(o[1]+=t,o[3]+=t):e&4?(o[1]-=t,o[3]-=t):e&2?(o[0]+=t,o[2]+=t):e&1&&(o[0]-=t,o[2]-=t)}function et(o,t,e,i){let n=1/0,s=-1/0,r=1/0,a=-1/0;for(let l=0;l<e;l+=t){const f=o[l],p=o[l+1];n=f<n?f:n,s=f>s?f:s,r=p<r?p:r,a=p>a?p:a}return i[0][0]=n,i[0][1]=r,i[1][0]=s,i[1][1]=a,i}function L(o,t){for(let e=0;e<t.length;e++)o.push(t[e]);return o}const it=85.051129;function nt(o,t){const{size:e=2,startIndex:i=0,endIndex:n=o.length,normalize:s=!0}=t||{},r=o.slice(i,n);F(r,e,0,n-i);const a=B(r,{size:e,broken:!0,gridResolution:360,gridOffset:[-180,-180]});if(s)for(const l of a)R(l,e);return a}function yt(o,t=null,e){const{size:i=2,normalize:n=!0,edgeTypes:s=!1}=e||{};t=t||[];const r=[],a=[];let l=0,f=0;for(let c=0;c<=t.length;c++){const u=t[c]||o.length,d=f,g=ot(o,i,l,u);for(let h=g;h<u;h++)r[f++]=o[h];for(let h=l;h<g;h++)r[f++]=o[h];F(r,i,d,f),st(r,i,d,f,e==null?void 0:e.maxLatitude),l=u,a[c]=f}a.pop();const p=Q(r,a,{size:i,gridResolution:360,gridOffset:[-180,-180],edgeTypes:s});if(n)for(const c of p)R(c.positions,i);return p}function ot(o,t,e,i){let n=-1,s=-1;for(let r=e+1;r<i;r+=t){const a=Math.abs(o[r]);a>n&&(n=a,s=r-1)}return s}function st(o,t,e,i,n=it){const s=o[e],r=o[i-t];if(Math.abs(s-r)>180){const a=S(o,0,t,e);a[0]+=Math.round((r-s)/360)*360,m(o,a),a[1]=Math.sign(a[1])*n,m(o,a),a[0]=s,m(o,a)}}function F(o,t,e,i){let n=o[0],s;for(let r=e;r<i;r+=t){s=o[r];const a=s-n;(a>180||a<-180)&&(s-=Math.round(a/360)*360),o[r]=n=s}}function R(o,t){let e;const i=o.length/t;for(let s=0;s<i&&(e=o[s*t],(e+180)%360===0);s++);const n=-Math.round(e/360)*360;if(n!==0)for(let s=0;s<i;s++)o[s*t]+=n}function rt(o,t,e,i){let n;if(Array.isArray(o[0])){const s=o.length*t;n=new Array(s);for(let r=0;r<o.length;r++)for(let a=0;a<t;a++)n[r*t+a]=o[r][a]||0}else n=o;return e?B(n,{size:t,gridResolution:e}):i?nt(n,{size:t}):n}const at=1,ct=2,w=4;class lt extends q{constructor(t){super({...t,attributes:{positions:{size:3,padding:18,initialize:!0,type:t.fp64?Float64Array:Float32Array},segmentTypes:{size:1,type:Uint8ClampedArray}}})}get(t){return this.attributes[t]}getGeometryFromBuffer(t){return this.normalize?super.getGeometryFromBuffer(t):null}normalizeGeometry(t){return this.normalize?rt(t,this.positionSize,this.opts.resolution,this.opts.wrapLongitude):t}getGeometrySize(t){if(M(t)){let i=0;for(const n of t)i+=this.getGeometrySize(n);return i}const e=this.getPathLength(t);return e<2?0:this.isClosed(t)?e<3?0:e+2:e}updateGeometryAttributes(t,e){if(e.geometrySize!==0)if(t&&M(t))for(const i of t){const n=this.getGeometrySize(i);e.geometrySize=n,this.updateGeometryAttributes(i,e),e.vertexStart+=n}else this._updateSegmentTypes(t,e),this._updatePositions(t,e)}_updateSegmentTypes(t,e){const i=this.attributes.segmentTypes,n=t?this.isClosed(t):!1,{vertexStart:s,geometrySize:r}=e;i.fill(0,s,s+r),n?(i[s]=w,i[s+r-2]=w):(i[s]+=at,i[s+r-2]+=ct),i[s+r-1]=w}_updatePositions(t,e){const{positions:i}=this.attributes;if(!i||!t)return;const{vertexStart:n,geometrySize:s}=e,r=new Array(3);for(let a=n,l=0;l<s;a++,l++)this.getPointOnPath(t,l,r),i[a*3]=r[0],i[a*3+1]=r[1],i[a*3+2]=r[2]}getPathLength(t){return t.length/this.positionSize}getPointOnPath(t,e,i=[]){const{positionSize:n}=this;e*n>=t.length&&(e+=1-t.length/n);const s=e*n;return i[0]=t[s],i[1]=t[s+1],i[2]=n===3&&t[s+2]||0,i}isClosed(t){if(!this.normalize)return!!this.opts.loop;const{positionSize:e}=this,i=t.length-e;return t[0]===t[i]&&t[1]===t[i+1]&&(e===2||t[2]===t[i+2])}}function M(o){return Array.isArray(o[0])}const O=`uniform pathUniforms {
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  float jointType;
  float capType;
  float miterLimit;
  bool billboard;
  highp int widthUnits;
} path;
`,ft={name:"path",vs:O,fs:O,uniformTypes:{widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",jointType:"f32",capType:"f32",miterLimit:"f32",billboard:"f32",widthUnits:"i32"}},ht=`#version 300 es
#define SHADER_NAME path-layer-vertex-shader
in vec2 positions;
in float instanceTypes;
in vec3 instanceStartPositions;
in vec3 instanceEndPositions;
in vec3 instanceLeftPositions;
in vec3 instanceRightPositions;
in vec3 instanceLeftPositions64Low;
in vec3 instanceStartPositions64Low;
in vec3 instanceEndPositions64Low;
in vec3 instanceRightPositions64Low;
in float instanceStrokeWidths;
in vec4 instanceColors;
in vec3 instancePickingColors;
uniform float opacity;
out vec4 vColor;
out vec2 vCornerOffset;
out float vMiterLength;
out vec2 vPathPosition;
out float vPathLength;
out float vJointType;
const float EPSILON = 0.001;
const vec3 ZERO_OFFSET = vec3(0.0);
float flipIfTrue(bool flag) {
return -(float(flag) * 2. - 1.);
}
vec3 getLineJoinOffset(
vec3 prevPoint, vec3 currPoint, vec3 nextPoint,
vec2 width
) {
bool isEnd = positions.x > 0.0;
float sideOfPath = positions.y;
float isJoint = float(sideOfPath == 0.0);
vec3 deltaA3 = (currPoint - prevPoint);
vec3 deltaB3 = (nextPoint - currPoint);
mat3 rotationMatrix;
bool needsRotation = !path.billboard && project_needs_rotation(currPoint, rotationMatrix);
if (needsRotation) {
deltaA3 = deltaA3 * rotationMatrix;
deltaB3 = deltaB3 * rotationMatrix;
}
vec2 deltaA = deltaA3.xy / width;
vec2 deltaB = deltaB3.xy / width;
float lenA = length(deltaA);
float lenB = length(deltaB);
vec2 dirA = lenA > 0. ? normalize(deltaA) : vec2(0.0, 0.0);
vec2 dirB = lenB > 0. ? normalize(deltaB) : vec2(0.0, 0.0);
vec2 perpA = vec2(-dirA.y, dirA.x);
vec2 perpB = vec2(-dirB.y, dirB.x);
vec2 tangent = dirA + dirB;
tangent = length(tangent) > 0. ? normalize(tangent) : perpA;
vec2 miterVec = vec2(-tangent.y, tangent.x);
vec2 dir = isEnd ? dirA : dirB;
vec2 perp = isEnd ? perpA : perpB;
float L = isEnd ? lenA : lenB;
float sinHalfA = abs(dot(miterVec, perp));
float cosHalfA = abs(dot(dirA, miterVec));
float turnDirection = flipIfTrue(dirA.x * dirB.y >= dirA.y * dirB.x);
float cornerPosition = sideOfPath * turnDirection;
float miterSize = 1.0 / max(sinHalfA, EPSILON);
miterSize = mix(
min(miterSize, max(lenA, lenB) / max(cosHalfA, EPSILON)),
miterSize,
step(0.0, cornerPosition)
);
vec2 offsetVec = mix(miterVec * miterSize, perp, step(0.5, cornerPosition))
* (sideOfPath + isJoint * turnDirection);
bool isStartCap = lenA == 0.0 || (!isEnd && (instanceTypes == 1.0 || instanceTypes == 3.0));
bool isEndCap = lenB == 0.0 || (isEnd && (instanceTypes == 2.0 || instanceTypes == 3.0));
bool isCap = isStartCap || isEndCap;
if (isCap) {
offsetVec = mix(perp * sideOfPath, dir * path.capType * 4.0 * flipIfTrue(isStartCap), isJoint);
vJointType = path.capType;
} else {
vJointType = path.jointType;
}
vPathLength = L;
vCornerOffset = offsetVec;
vMiterLength = dot(vCornerOffset, miterVec * turnDirection);
vMiterLength = isCap ? isJoint : vMiterLength;
vec2 offsetFromStartOfPath = vCornerOffset + deltaA * float(isEnd);
vPathPosition = vec2(
dot(offsetFromStartOfPath, perp),
dot(offsetFromStartOfPath, dir)
);
geometry.uv = vPathPosition;
float isValid = step(instanceTypes, 3.5);
vec3 offset = vec3(offsetVec * width * isValid, 0.0);
if (needsRotation) {
offset = rotationMatrix * offset;
}
return offset;
}
void clipLine(inout vec4 position, vec4 refPosition) {
if (position.w < EPSILON) {
float r = (EPSILON - refPosition.w) / (position.w - refPosition.w);
position = refPosition + (position - refPosition) * r;
}
}
void main() {
geometry.pickingColor = instancePickingColors;
vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity);
float isEnd = positions.x;
vec3 prevPosition = mix(instanceLeftPositions, instanceStartPositions, isEnd);
vec3 prevPosition64Low = mix(instanceLeftPositions64Low, instanceStartPositions64Low, isEnd);
vec3 currPosition = mix(instanceStartPositions, instanceEndPositions, isEnd);
vec3 currPosition64Low = mix(instanceStartPositions64Low, instanceEndPositions64Low, isEnd);
vec3 nextPosition = mix(instanceEndPositions, instanceRightPositions, isEnd);
vec3 nextPosition64Low = mix(instanceEndPositions64Low, instanceRightPositions64Low, isEnd);
geometry.worldPosition = currPosition;
vec2 widthPixels = vec2(clamp(
project_size_to_pixel(instanceStrokeWidths * path.widthScale, path.widthUnits),
path.widthMinPixels, path.widthMaxPixels) / 2.0);
vec3 width;
if (path.billboard) {
vec4 prevPositionScreen = project_position_to_clipspace(prevPosition, prevPosition64Low, ZERO_OFFSET);
vec4 currPositionScreen = project_position_to_clipspace(currPosition, currPosition64Low, ZERO_OFFSET, geometry.position);
vec4 nextPositionScreen = project_position_to_clipspace(nextPosition, nextPosition64Low, ZERO_OFFSET);
clipLine(prevPositionScreen, currPositionScreen);
clipLine(nextPositionScreen, currPositionScreen);
clipLine(currPositionScreen, mix(nextPositionScreen, prevPositionScreen, isEnd));
width = vec3(widthPixels, 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(
prevPositionScreen.xyz / prevPositionScreen.w,
currPositionScreen.xyz / currPositionScreen.w,
nextPositionScreen.xyz / nextPositionScreen.w,
project_pixel_size_to_clipspace(width.xy)
);
DECKGL_FILTER_GL_POSITION(currPositionScreen, geometry);
gl_Position = vec4(currPositionScreen.xyz + offset * currPositionScreen.w, currPositionScreen.w);
} else {
prevPosition = project_position(prevPosition, prevPosition64Low);
currPosition = project_position(currPosition, currPosition64Low);
nextPosition = project_position(nextPosition, nextPosition64Low);
width = vec3(project_pixel_size(widthPixels), 0.0);
DECKGL_FILTER_SIZE(width, geometry);
vec3 offset = getLineJoinOffset(prevPosition, currPosition, nextPosition, width.xy);
geometry.position = vec4(currPosition + offset, 1.0);
gl_Position = project_common_position_to_clipspace(geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,pt=`#version 300 es
#define SHADER_NAME path-layer-fragment-shader
precision highp float;
in vec4 vColor;
in vec2 vCornerOffset;
in float vMiterLength;
in vec2 vPathPosition;
in float vPathLength;
in float vJointType;
out vec4 fragColor;
void main(void) {
geometry.uv = vPathPosition;
if (vPathPosition.y < 0.0 || vPathPosition.y > vPathLength) {
if (vJointType > 0.5 && length(vCornerOffset) > 1.0) {
discard;
}
if (vJointType < 0.5 && vMiterLength > path.miterLimit + 1.0) {
discard;
}
}
fragColor = vColor;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,N=[0,0,0,255],ut={widthUnits:"meters",widthScale:{type:"number",min:0,value:1},widthMinPixels:{type:"number",min:0,value:0},widthMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},jointRounded:!1,capRounded:!1,miterLimit:{type:"number",min:0,value:4},billboard:!1,_pathType:null,getPath:{type:"accessor",value:o=>o.path},getColor:{type:"accessor",value:N},getWidth:{type:"accessor",value:1},rounded:{deprecatedFor:["jointRounded","capRounded"]}},E={enter:(o,t)=>t.length?t.subarray(t.length-o.length):o};class D extends H{getShaders(){return super.getShaders({vs:ht,fs:pt,modules:[Z,W,ft]})}get wrapLongitude(){return!1}getBounds(){var t;return(t=this.getAttributeManager())==null?void 0:t.getBounds(["vertexPositions"])}initializeState(){this.getAttributeManager().addInstanced({vertexPositions:{size:3,vertexOffset:1,type:"float64",fp64:this.use64bitPositions(),transition:E,accessor:"getPath",update:this.calculatePositions,noAlloc:!0,shaderAttributes:{instanceLeftPositions:{vertexOffset:0},instanceStartPositions:{vertexOffset:1},instanceEndPositions:{vertexOffset:2},instanceRightPositions:{vertexOffset:3}}},instanceTypes:{size:1,type:"uint8",update:this.calculateSegmentTypes,noAlloc:!0},instanceStrokeWidths:{size:1,accessor:"getWidth",transition:E,defaultValue:1},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",accessor:"getColor",transition:E,defaultValue:N},instancePickingColors:{size:4,type:"uint8",accessor:(i,{index:n,target:s})=>this.encodePickingColor(i&&i.__source?i.__source.index:n,s)}}),this.setState({pathTesselator:new lt({fp64:this.use64bitPositions()})})}updateState(t){var r;super.updateState(t);const{props:e,changeFlags:i}=t,n=this.getAttributeManager();if(i.dataChanged||i.updateTriggersChanged&&(i.updateTriggersChanged.all||i.updateTriggersChanged.getPath)){const{pathTesselator:a}=this.state,l=e.data.attributes||{};a.updateGeometry({data:e.data,geometryBuffer:l.getPath,buffers:l,normalize:!e._pathType,loop:e._pathType==="loop",getGeometry:e.getPath,positionFormat:e.positionFormat,wrapLongitude:e.wrapLongitude,resolution:this.context.viewport.resolution,dataChanged:i.dataChanged}),this.setState({numInstances:a.instanceCount,startIndices:a.vertexStarts}),i.dataChanged||n.invalidateAll()}i.extensionsChanged&&((r=this.state.model)==null||r.destroy(),this.state.model=this._getModel(),n.invalidateAll())}getPickingInfo(t){const e=super.getPickingInfo(t),{index:i}=e,n=this.props.data;return n[0]&&n[0].__source&&(e.object=n.find(s=>s.__source.index===i)),e}disablePickingIndex(t){const e=this.props.data;if(e[0]&&e[0].__source)for(let i=0;i<e.length;i++)e[i].__source.index===t&&this._disablePickingIndex(i);else super.disablePickingIndex(t)}draw({uniforms:t}){const{jointRounded:e,capRounded:i,billboard:n,miterLimit:s,widthUnits:r,widthScale:a,widthMinPixels:l,widthMaxPixels:f}=this.props,p=this.state.model,c={jointType:Number(e),capType:Number(i),billboard:n,widthUnits:K[r],widthScale:a,miterLimit:s,widthMinPixels:l,widthMaxPixels:f};p.shaderInputs.setProps({path:c}),p.draw(this.context.renderPass)}_getModel(){const t=[0,1,2,1,4,2,1,3,4,3,5,4],e=[0,0,0,-1,0,1,1,-1,1,1,1,0];return new Y(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new X({topology:"triangle-list",attributes:{indices:new Uint16Array(t),positions:{value:new Float32Array(e),size:2}}}),isInstanced:!0})}calculatePositions(t){const{pathTesselator:e}=this.state;t.startIndices=e.vertexStarts,t.value=e.get("positions")}calculateSegmentTypes(t){const{pathTesselator:e}=this.state;t.startIndices=e.vertexStarts,t.value=e.get("segmentTypes")}}D.defaultProps=ut;D.layerName="PathLayer";export{D as P,q as T,yt as a,Q as c};
