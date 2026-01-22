import{g as ie}from"./_commonjsHelpers-Cpj98o6Y.js";import{m as X,W as q}from"./polygon-utils-B8iYQ3Og.js";import{T as se,b as le,d as ae}from"./cut-by-mercator-bounds-B6TPDI4I.js";import{H as ue,I as ce,C as V,o as O}from"./mapbox-overlay-C46bI65L.js";import{p as fe}from"./picking-CN0D5Hbh.js";import{g as xe}from"./gouraud-material-BXO_wMX3.js";import{G as H}from"./geometry-xuRZU0MX.js";var W={exports:{}};W.exports=N;W.exports.default=N;function N(e,n,t){t=t||2;var o=n&&n.length,i=o?n[0]*t:e.length,r=ee(e,0,i,t,!0),s=[];if(!r||r.next===r.prev)return s;var l,a,u,c,f,x,g;if(o&&(r=ge(e,n,r,t)),e.length>80*t){l=u=e[0],a=c=e[1];for(var v=t;v<i;v+=t)f=e[v],x=e[v+1],f<l&&(l=f),x<a&&(a=x),f>u&&(u=f),x>c&&(c=x);g=Math.max(u-l,c-a),g=g!==0?32767/g:0}return L(r,s,t,l,a,g,0),s}function ee(e,n,t,o,i){var r,s;if(i===b(e,n,t,o)>0)for(r=n;r<t;r+=o)s=U(r,e[r],e[r+1],s);else for(r=t-o;r>=n;r-=o)s=U(r,e[r],e[r+1],s);return s&&G(s,s.next)&&(A(s),s=s.next),s}function m(e,n){if(!e)return e;n||(n=e);var t=e,o;do if(o=!1,!t.steiner&&(G(t,t.next)||h(t.prev,t,t.next)===0)){if(A(t),t=n=t.prev,t===t.next)break;o=!0}else t=t.next;while(o||t!==n);return n}function L(e,n,t,o,i,r,s){if(e){!s&&r&&_e(e,o,i,r);for(var l=e,a,u;e.prev!==e.next;){if(a=e.prev,u=e.next,r?de(e,o,i,r):pe(e)){n.push(a.i/t|0),n.push(e.i/t|0),n.push(u.i/t|0),A(e),e=u.next,l=u.next;continue}if(e=u,e===l){s?s===1?(e=ve(m(e),n,t),L(e,n,t,o,i,r,2)):s===2&&he(e,n,t,o,i,r):L(m(e),n,t,o,i,r,1);break}}}}function pe(e){var n=e.prev,t=e,o=e.next;if(h(n,t,o)>=0)return!1;for(var i=n.x,r=t.x,s=o.x,l=n.y,a=t.y,u=o.y,c=i<r?i<s?i:s:r<s?r:s,f=l<a?l<u?l:u:a<u?a:u,x=i>r?i>s?i:s:r>s?r:s,g=l>a?l>u?l:u:a>u?a:u,v=o.next;v!==n;){if(v.x>=c&&v.x<=x&&v.y>=f&&v.y<=g&&P(i,l,r,a,s,u,v.x,v.y)&&h(v.prev,v,v.next)>=0)return!1;v=v.next}return!0}function de(e,n,t,o){var i=e.prev,r=e,s=e.next;if(h(i,r,s)>=0)return!1;for(var l=i.x,a=r.x,u=s.x,c=i.y,f=r.y,x=s.y,g=l<a?l<u?l:u:a<u?a:u,v=c<f?c<x?c:x:f<x?f:x,w=l>a?l>u?l:u:a>u?a:u,_=c>f?c>x?c:x:f>x?f:x,k=Z(g,v,n,t,o),B=Z(w,_,n,t,o),p=e.prevZ,d=e.nextZ;p&&p.z>=k&&d&&d.z<=B;){if(p.x>=g&&p.x<=w&&p.y>=v&&p.y<=_&&p!==i&&p!==s&&P(l,c,a,f,u,x,p.x,p.y)&&h(p.prev,p,p.next)>=0||(p=p.prevZ,d.x>=g&&d.x<=w&&d.y>=v&&d.y<=_&&d!==i&&d!==s&&P(l,c,a,f,u,x,d.x,d.y)&&h(d.prev,d,d.next)>=0))return!1;d=d.nextZ}for(;p&&p.z>=k;){if(p.x>=g&&p.x<=w&&p.y>=v&&p.y<=_&&p!==i&&p!==s&&P(l,c,a,f,u,x,p.x,p.y)&&h(p.prev,p,p.next)>=0)return!1;p=p.prevZ}for(;d&&d.z<=B;){if(d.x>=g&&d.x<=w&&d.y>=v&&d.y<=_&&d!==i&&d!==s&&P(l,c,a,f,u,x,d.x,d.y)&&h(d.prev,d,d.next)>=0)return!1;d=d.nextZ}return!0}function ve(e,n,t){var o=e;do{var i=o.prev,r=o.next.next;!G(i,r)&&te(i,o,o.next,r)&&I(i,r)&&I(r,i)&&(n.push(i.i/t|0),n.push(o.i/t|0),n.push(r.i/t|0),A(o),A(o.next),o=e=r),o=o.next}while(o!==e);return m(o)}function he(e,n,t,o,i,r){var s=e;do{for(var l=s.next.next;l!==s.prev;){if(s.i!==l.i&&Ie(s,l)){var a=ne(s,l);s=m(s,s.next),a=m(a,a.next),L(s,n,t,o,i,r,0),L(a,n,t,o,i,r,0);return}l=l.next}s=s.next}while(s!==e)}function ge(e,n,t,o){var i=[],r,s,l,a,u;for(r=0,s=n.length;r<s;r++)l=n[r]*o,a=r<s-1?n[r+1]*o:e.length,u=ee(e,l,a,o,!1),u===u.next&&(u.steiner=!0),i.push(Le(u));for(i.sort(ye),r=0;r<i.length;r++)t=me(i[r],t);return t}function ye(e,n){return e.x-n.x}function me(e,n){var t=Pe(e,n);if(!t)return n;var o=ne(t,e);return m(o,o.next),m(t,t.next)}function Pe(e,n){var t=n,o=e.x,i=e.y,r=-1/0,s;do{if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){var l=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(l<=o&&l>r&&(r=l,s=t.x<t.next.x?t:t.next,l===o))return s}t=t.next}while(t!==n);if(!s)return null;var a=s,u=s.x,c=s.y,f=1/0,x;t=s;do o>=t.x&&t.x>=u&&o!==t.x&&P(i<c?o:r,i,u,c,i<c?r:o,i,t.x,t.y)&&(x=Math.abs(i-t.y)/(o-t.x),I(t,e)&&(x<f||x===f&&(t.x>s.x||t.x===s.x&&we(s,t)))&&(s=t,f=x)),t=t.next;while(t!==a);return s}function we(e,n){return h(e.prev,e,n.prev)<0&&h(n.next,e,e.next)<0}function _e(e,n,t,o){var i=e;do i.z===0&&(i.z=Z(i.x,i.y,n,t,o)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,Ce(i)}function Ce(e){var n,t,o,i,r,s,l,a,u=1;do{for(t=e,e=null,r=null,s=0;t;){for(s++,o=t,l=0,n=0;n<u&&(l++,o=o.nextZ,!!o);n++);for(a=u;l>0||a>0&&o;)l!==0&&(a===0||!o||t.z<=o.z)?(i=t,t=t.nextZ,l--):(i=o,o=o.nextZ,a--),r?r.nextZ=i:e=i,i.prevZ=r,r=i;t=o}r.nextZ=null,u*=2}while(s>1);return e}function Z(e,n,t,o,i){return e=(e-t)*i|0,n=(n-o)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e|n<<1}function Le(e){var n=e,t=e;do(n.x<t.x||n.x===t.x&&n.y<t.y)&&(t=n),n=n.next;while(n!==e);return t}function P(e,n,t,o,i,r,s,l){return(i-s)*(n-l)>=(e-s)*(r-l)&&(e-s)*(o-l)>=(t-s)*(n-l)&&(t-s)*(r-l)>=(i-s)*(o-l)}function Ie(e,n){return e.next.i!==n.i&&e.prev.i!==n.i&&!Ae(e,n)&&(I(e,n)&&I(n,e)&&Me(e,n)&&(h(e.prev,e,n.prev)||h(e,n.prev,n))||G(e,n)&&h(e.prev,e,e.next)>0&&h(n.prev,n,n.next)>0)}function h(e,n,t){return(n.y-e.y)*(t.x-n.x)-(n.x-e.x)*(t.y-n.y)}function G(e,n){return e.x===n.x&&e.y===n.y}function te(e,n,t,o){var i=T(h(e,n,t)),r=T(h(e,n,o)),s=T(h(t,o,e)),l=T(h(t,o,n));return!!(i!==r&&s!==l||i===0&&M(e,t,n)||r===0&&M(e,o,n)||s===0&&M(t,e,o)||l===0&&M(t,n,o))}function M(e,n,t){return n.x<=Math.max(e.x,t.x)&&n.x>=Math.min(e.x,t.x)&&n.y<=Math.max(e.y,t.y)&&n.y>=Math.min(e.y,t.y)}function T(e){return e>0?1:e<0?-1:0}function Ae(e,n){var t=e;do{if(t.i!==e.i&&t.next.i!==e.i&&t.i!==n.i&&t.next.i!==n.i&&te(t,t.next,e,n))return!0;t=t.next}while(t!==e);return!1}function I(e,n){return h(e.prev,e,e.next)<0?h(e,n,e.next)>=0&&h(e,e.prev,n)>=0:h(e,n,e.prev)<0||h(e,e.next,n)<0}function Me(e,n){var t=e,o=!1,i=(e.x+n.x)/2,r=(e.y+n.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&i<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(o=!o),t=t.next;while(t!==e);return o}function ne(e,n){var t=new D(e.i,e.x,e.y),o=new D(n.i,n.x,n.y),i=e.next,r=n.prev;return e.next=n,n.prev=e,t.next=i,i.prev=t,o.next=t,t.prev=o,r.next=o,o.prev=r,o}function U(e,n,t,o){var i=new D(e,n,t);return o?(i.next=o.next,i.prev=o,o.next.prev=i,o.next=i):(i.prev=i,i.next=i),i}function A(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function D(e,n,t){this.i=e,this.x=n,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}N.deviation=function(e,n,t,o){var i=n&&n.length,r=i?n[0]*t:e.length,s=Math.abs(b(e,0,r,t));if(i)for(var l=0,a=n.length;l<a;l++){var u=n[l]*t,c=l<a-1?n[l+1]*t:e.length;s-=Math.abs(b(e,u,c,t))}var f=0;for(l=0;l<o.length;l+=3){var x=o[l]*t,g=o[l+1]*t,v=o[l+2]*t;f+=Math.abs((e[x]-e[v])*(e[g+1]-e[x+1])-(e[x]-e[g])*(e[v+1]-e[x+1]))}return s===0&&f===0?0:Math.abs((f-s)/s)};function b(e,n,t,o){for(var i=0,r=n,s=t-o;r<t;r+=o)i+=(e[s]-e[r])*(e[r+1]+e[s+1]),s=r;return i}N.flatten=function(e){for(var n=e[0][0].length,t={vertices:[],holes:[],dimensions:n},o=0,i=0;i<e.length;i++){for(var r=0;r<e[i].length;r++)for(var s=0;s<n;s++)t.vertices.push(e[i][r][s]);i>0&&(o+=e[i-1].length,t.holes.push(o))}return t};var Te=W.exports;const Ee=ie(Te),E=q.CLOCKWISE,j=q.COUNTER_CLOCKWISE,y={};function Se(e){if(e=e&&e.positions||e,!Array.isArray(e)&&!ArrayBuffer.isView(e))throw new Error("invalid polygon")}function C(e){return"positions"in e?e.positions:e}function z(e){return"holeIndices"in e?e.holeIndices:null}function ze(e){return Array.isArray(e[0])}function Fe(e){return e.length>=1&&e[0].length>=2&&Number.isFinite(e[0][0])}function Ne(e){const n=e[0],t=e[e.length-1];return n[0]===t[0]&&n[1]===t[1]&&n[2]===t[2]}function Ge(e,n,t,o){for(let i=0;i<n;i++)if(e[t+i]!==e[o-n+i])return!1;return!0}function $(e,n,t,o,i){let r=n;const s=t.length;for(let l=0;l<s;l++)for(let a=0;a<o;a++)e[r++]=t[l][a]||0;if(!Ne(t))for(let l=0;l<o;l++)e[r++]=t[0][l]||0;return y.start=n,y.end=r,y.size=o,X(e,i,y),r}function K(e,n,t,o,i=0,r,s){r=r||t.length;const l=r-i;if(l<=0)return n;let a=n;for(let u=0;u<l;u++)e[a++]=t[i+u];if(!Ge(t,o,i,r))for(let u=0;u<o;u++)e[a++]=t[i+u];return y.start=n,y.end=a,y.size=o,X(e,s,y),a}function Ve(e,n){Se(e);const t=[],o=[];if("positions"in e){const{positions:i,holeIndices:r}=e;if(r){let s=0;for(let l=0;l<=r.length;l++)s=K(t,s,i,n,r[l-1],r[l],l===0?E:j),o.push(s);return o.pop(),{positions:t,holeIndices:o}}e=i}if(!ze(e))return K(t,0,e,n,0,t.length,E),t;if(!Fe(e)){let i=0;for(const[r,s]of e.entries())i=$(t,i,s,n,r===0?E:j),o.push(i);return o.pop(),{positions:t,holeIndices:o}}return $(t,0,e,n,E),t}function R(e,n,t){const o=e.length/3;let i=0;for(let r=0;r<o;r++){const s=(r+1)%o;i+=e[r*3+n]*e[s*3+t],i-=e[s*3+n]*e[r*3+t]}return Math.abs(i/2)}function Y(e,n,t,o){const i=e.length/3;for(let r=0;r<i;r++){const s=r*3,l=e[s+0],a=e[s+1],u=e[s+2];e[s+n]=l,e[s+t]=a,e[s+o]=u}}function Oe(e,n,t,o){let i=z(e);i&&(i=i.map(l=>l/n));let r=C(e);const s=o&&n===3;if(t){const l=r.length;r=r.slice();const a=[];for(let u=0;u<l;u+=n){a[0]=r[u],a[1]=r[u+1],s&&(a[2]=r[u+2]);const c=t(a);r[u]=c[0],r[u+1]=c[1],s&&(r[u+2]=c[2])}}if(s){const l=R(r,0,1),a=R(r,0,2),u=R(r,1,2);if(!l&&!a&&!u)return[];l>a&&l>u||(a>u?(t||(r=r.slice()),Y(r,0,2,1)):(t||(r=r.slice()),Y(r,2,0,1)))}return Ee(r,i,n)}class Re extends se{constructor(n){const{fp64:t,IndexType:o=Uint32Array}=n;super({...n,attributes:{positions:{size:3,type:t?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:o,size:1}}})}get(n){const{attributes:t}=this;return n==="indices"?t.indices&&t.indices.subarray(0,this.vertexCount):t[n]}updateGeometry(n){super.updateGeometry(n);const t=this.buffers.indices;if(t)this.vertexCount=(t.value||t).length;else if(this.data&&!this.getGeometry)throw new Error("missing indices buffer")}normalizeGeometry(n){if(this.normalize){const t=Ve(n,this.positionSize);return this.opts.resolution?le(C(t),z(t),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?ae(C(t),z(t),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):t}return n}getGeometrySize(n){if(J(n)){let t=0;for(const o of n)t+=this.getGeometrySize(o);return t}return C(n).length/this.positionSize}getGeometryFromBuffer(n){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(n):null}updateGeometryAttributes(n,t){if(n&&J(n))for(const o of n){const i=this.getGeometrySize(o);t.geometrySize=i,this.updateGeometryAttributes(o,t),t.vertexStart+=i,t.indexStart=this.indexStarts[t.geometryIndex+1]}else{const o=n;this._updateIndices(o,t),this._updatePositions(o,t),this._updateVertexValid(o,t)}}_updateIndices(n,{geometryIndex:t,vertexStart:o,indexStart:i}){const{attributes:r,indexStarts:s,typedArrayManager:l}=this;let a=r.indices;if(!a||!n)return;let u=i;const c=Oe(n,this.positionSize,this.opts.preproject,this.opts.full3d);a=l.allocate(a,i+c.length,{copy:!0});for(let f=0;f<c.length;f++)a[u++]=c[f]+o;s[t+1]=i+c.length,r.indices=a}_updatePositions(n,{vertexStart:t,geometrySize:o}){const{attributes:{positions:i},positionSize:r}=this;if(!i||!n)return;const s=C(n);for(let l=t,a=0;a<o;l++,a++){const u=s[a*r],c=s[a*r+1],f=r>2?s[a*r+2]:0;i[l*3]=u,i[l*3+1]=c,i[l*3+2]=f}}_updateVertexValid(n,{vertexStart:t,geometrySize:o}){const{positionSize:i}=this,r=this.attributes.vertexValid,s=n&&z(n);if(n&&n.edgeTypes?r.set(n.edgeTypes,t):r.fill(1,t,t+o),s)for(let l=0;l<s.length;l++)r[t+s[l]/i-1]=0;r[t+o-1]=0}}function J(e){return Array.isArray(e)&&e.length>0&&!Number.isFinite(e[0])}const Q=`uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,Ze={name:"solidPolygon",vs:Q,fs:Q,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},oe=`in vec4 fillColors;
in vec4 lineColors;
in vec3 pickingColors;
out vec4 vColor;
struct PolygonProps {
vec3 positions;
vec3 positions64Low;
vec3 normal;
float elevations;
};
vec3 project_offset_normal(vec3 vector) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT_OFFSETS) {
return normalize(vector * project.commonUnitsPerWorldUnit);
}
return project_normal(vector);
}
void calculatePosition(PolygonProps props) {
vec3 pos = props.positions;
vec3 pos64Low = props.positions64Low;
vec3 normal = props.normal;
vec4 colors = solidPolygon.isWireframe ? lineColors : fillColors;
geometry.worldPosition = props.positions;
geometry.pickingColor = pickingColors;
if (solidPolygon.extruded) {
pos.z += props.elevations * solidPolygon.elevationScale;
}
gl_Position = project_position_to_clipspace(pos, pos64Low, vec3(0.), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (solidPolygon.extruded) {
#ifdef IS_SIDE_VERTEX
normal = project_offset_normal(normal);
#else
normal = project_normal(normal);
#endif
geometry.normal = normal;
vec3 lightColor = lighting_getLightColor(colors.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, colors.a * layer.opacity);
} else {
vColor = vec4(colors.rgb, colors.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,De=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${oe}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,be=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${oe}
void main(void) {
if(instanceVertexValid < 0.5){
gl_Position = vec4(0.);
return;
}
PolygonProps props;
vec3 pos;
vec3 pos64Low;
vec3 nextPos;
vec3 nextPos64Low;
#if RING_WINDING_ORDER_CW == 1
pos = vertexPositions;
pos64Low = vertexPositions64Low;
nextPos = nextVertexPositions;
nextPos64Low = nextVertexPositions64Low;
#else
pos = nextVertexPositions;
pos64Low = nextVertexPositions64Low;
nextPos = vertexPositions;
nextPos64Low = vertexPositions64Low;
#endif
props.positions = mix(pos, nextPos, positions.x);
props.positions64Low = mix(pos64Low, nextPos64Low, positions.x);
props.normal = vec3(
pos.y - nextPos.y + (pos64Low.y - nextPos64Low.y),
nextPos.x - pos.x + (nextPos64Low.x - pos64Low.x),
0.0);
props.elevations = elevations * positions.y;
calculatePosition(props);
}
`,We=`#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,F=[0,0,0,255],ke={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:e=>e.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:F},getLineColor:{type:"accessor",value:F},material:!0},S={enter:(e,n)=>n.length?n.subarray(n.length-e.length):e};class re extends ue{getShaders(n){return super.getShaders({vs:n==="top"?De:be,fs:We,defines:{RING_WINDING_ORDER_CW:!this.props._normalize&&this.props._windingOrder==="CCW"?0:1},modules:[ce,xe,fe,Ze]})}get wrapLongitude(){return!1}getBounds(){var n;return(n=this.getAttributeManager())==null?void 0:n.getBounds(["vertexPositions"])}initializeState(){const{viewport:n}=this.context;let{coordinateSystem:t}=this.props;const{_full3d:o}=this.props;n.isGeospatial&&t===V.DEFAULT&&(t=V.LNGLAT);let i;t===V.LNGLAT&&(o?i=n.projectPosition.bind(n):i=n.projectFlat.bind(n)),this.setState({numInstances:0,polygonTesselator:new Re({preproject:i,fp64:this.use64bitPositions(),IndexType:Uint32Array})});const r=this.getAttributeManager(),s=!0;r.remove(["instancePickingColors"]),r.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:s},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:S,accessor:"getPolygon",update:this.calculatePositions,noAlloc:s,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},instanceVertexValid:{size:1,type:"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:s},elevations:{size:1,stepMode:"dynamic",transition:S,accessor:"getElevation"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:S,accessor:"getFillColor",defaultValue:F},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:S,accessor:"getLineColor",defaultValue:F},pickingColors:{size:4,type:"uint8",stepMode:"dynamic",accessor:(l,{index:a,target:u})=>this.encodePickingColor(l&&l.__source?l.__source.index:a,u)}})}getPickingInfo(n){const t=super.getPickingInfo(n),{index:o}=t,i=this.props.data;return i[0]&&i[0].__source&&(t.object=i.find(r=>r.__source.index===o)),t}disablePickingIndex(n){const t=this.props.data;if(t[0]&&t[0].__source)for(let o=0;o<t.length;o++)t[o].__source.index===n&&this._disablePickingIndex(o);else super.disablePickingIndex(n)}draw({uniforms:n}){const{extruded:t,filled:o,wireframe:i,elevationScale:r}=this.props,{topModel:s,sideModel:l,wireframeModel:a,polygonTesselator:u}=this.state,c={extruded:!!t,elevationScale:r,isWireframe:!1};a&&i&&(a.setInstanceCount(u.instanceCount-1),a.shaderInputs.setProps({solidPolygon:{...c,isWireframe:!0}}),a.draw(this.context.renderPass)),l&&o&&(l.setInstanceCount(u.instanceCount-1),l.shaderInputs.setProps({solidPolygon:c}),l.draw(this.context.renderPass)),s&&o&&(s.setVertexCount(u.vertexCount),s.shaderInputs.setProps({solidPolygon:c}),s.draw(this.context.renderPass))}updateState(n){var l;super.updateState(n),this.updateGeometry(n);const{props:t,oldProps:o,changeFlags:i}=n,r=this.getAttributeManager();(i.extensionsChanged||t.filled!==o.filled||t.extruded!==o.extruded)&&((l=this.state.models)==null||l.forEach(a=>a.destroy()),this.setState(this._getModels()),r.invalidateAll())}updateGeometry({props:n,oldProps:t,changeFlags:o}){if(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getPolygon)){const{polygonTesselator:r}=this.state,s=n.data.attributes||{};r.updateGeometry({data:n.data,normalize:n._normalize,geometryBuffer:s.getPolygon,buffers:s,getGeometry:n.getPolygon,positionFormat:n.positionFormat,wrapLongitude:n.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:o.dataChanged,full3d:n._full3d}),this.setState({numInstances:r.instanceCount,startIndices:r.vertexStarts}),o.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){const{id:n,filled:t,extruded:o}=this.props;let i,r,s;if(t){const l=this.getShaders("top");l.defines.NON_INSTANCED_MODEL=1;const a=this.getAttributeManager().getBufferLayouts({isInstanced:!1});i=new O(this.context.device,{...l,id:`${n}-top`,topology:"triangle-list",bufferLayout:a,isIndexed:!0,userData:{excludeAttributes:{instanceVertexValid:!0}}})}if(o){const l=this.getAttributeManager().getBufferLayouts({isInstanced:!0});r=new O(this.context.device,{...this.getShaders("side"),id:`${n}-side`,bufferLayout:l,geometry:new H({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),s=new O(this.context.device,{...this.getShaders("side"),id:`${n}-wireframe`,bufferLayout:l,geometry:new H({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[r,s,i].filter(Boolean),topModel:i,sideModel:r,wireframeModel:s}}calculateIndices(n){const{polygonTesselator:t}=this.state;n.startIndices=t.indexStarts,n.value=t.get("indices")}calculatePositions(n){const{polygonTesselator:t}=this.state;n.startIndices=t.vertexStarts,n.value=t.get("positions")}calculateVertexValid(n){n.value=this.state.polygonTesselator.get("vertexValid")}}re.defaultProps=ke;re.layerName="SolidPolygonLayer";export{re as S,Ve as n};
