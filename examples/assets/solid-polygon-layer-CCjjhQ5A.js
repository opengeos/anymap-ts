import{g as we}from"./_commonjsHelpers-CqkleIqs.js";import{m as ce,W as fe}from"./polygon-utils-B8iYQ3Og.js";import{T as _e,b as Ce,d as Le}from"./cut-by-mercator-bounds-jPAie1s4.js";import{H as Ie,I as Ae,C as K,o as Y}from"./mapbox-overlay-dETm6WBN.js";import{p as Me}from"./picking-CN0D5Hbh.js";import{g as Te}from"./gouraud-material-Dz7aR_BC.js";import{G as re}from"./geometry-C3q6ySK1.js";var b={exports:{}},ne;function Ee(){if(ne)return b.exports;ne=1,b.exports=c,b.exports.default=c;function c(e,r,t){t=t||2;var n=r&&r.length,i=n?r[0]*t:e.length,l=s(e,0,i,t,!0),a=[];if(!l||l.next===l.prev)return a;var x,g,h,A,C,P,T;if(n&&(l=y(e,r,l,t)),e.length>80*t){x=h=e[0],g=A=e[1];for(var L=t;L<i;L+=t)C=e[L],P=e[L+1],C<x&&(x=C),P<g&&(g=P),C>h&&(h=C),P>A&&(A=P);T=Math.max(h-x,A-g),T=T!==0?32767/T:0}return f(l,a,t,x,g,T,0),a}function s(e,r,t,n,i){var l,a;if(i===$(e,r,t,n)>0)for(l=r;l<t;l+=n)a=q(l,e[l],e[l+1],a);else for(l=t-n;l>=r;l-=n)a=q(l,e[l],e[l+1],a);return a&&R(a,a.next)&&(N(a),a=a.next),a}function o(e,r){if(!e)return e;r||(r=e);var t=e,n;do if(n=!1,!t.steiner&&(R(t,t.next)||I(t.prev,t,t.next)===0)){if(N(t),t=r=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==r);return r}function f(e,r,t,n,i,l,a){if(e){!a&&l&&ve(e,n,i,l);for(var x=e,g,h;e.prev!==e.next;){if(g=e.prev,h=e.next,l?u(e,n,i,l):p(e)){r.push(g.i/t|0),r.push(e.i/t|0),r.push(h.i/t|0),N(e),e=h.next,x=h.next;continue}if(e=h,e===x){a?a===1?(e=v(o(e),r,t),f(e,r,t,n,i,l,2)):a===2&&d(e,r,t,n,i,l):f(o(e),r,t,n,i,l,1);break}}}}function p(e){var r=e.prev,t=e,n=e.next;if(I(r,t,n)>=0)return!1;for(var i=r.x,l=t.x,a=n.x,x=r.y,g=t.y,h=n.y,A=i<l?i<a?i:a:l<a?l:a,C=x<g?x<h?x:h:g<h?g:h,P=i>l?i>a?i:a:l>a?l:a,T=x>g?x>h?x:h:g>h?g:h,L=n.next;L!==r;){if(L.x>=A&&L.x<=P&&L.y>=C&&L.y<=T&&z(i,x,l,g,a,h,L.x,L.y)&&I(L.prev,L,L.next)>=0)return!1;L=L.next}return!0}function u(e,r,t,n){var i=e.prev,l=e,a=e.next;if(I(i,l,a)>=0)return!1;for(var x=i.x,g=l.x,h=a.x,A=i.y,C=l.y,P=a.y,T=x<g?x<h?x:h:g<h?g:h,L=A<C?A<P?A:P:C<P?C:P,G=x>g?x>h?x:h:g>h?g:h,V=A>C?A>P?A:P:C>P?C:P,ee=U(T,L,r,t,n),te=U(G,V,r,t,n),w=e.prevZ,_=e.nextZ;w&&w.z>=ee&&_&&_.z<=te;){if(w.x>=T&&w.x<=G&&w.y>=L&&w.y<=V&&w!==i&&w!==a&&z(x,A,g,C,h,P,w.x,w.y)&&I(w.prev,w,w.next)>=0||(w=w.prevZ,_.x>=T&&_.x<=G&&_.y>=L&&_.y<=V&&_!==i&&_!==a&&z(x,A,g,C,h,P,_.x,_.y)&&I(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;w&&w.z>=ee;){if(w.x>=T&&w.x<=G&&w.y>=L&&w.y<=V&&w!==i&&w!==a&&z(x,A,g,C,h,P,w.x,w.y)&&I(w.prev,w,w.next)>=0)return!1;w=w.prevZ}for(;_&&_.z<=te;){if(_.x>=T&&_.x<=G&&_.y>=L&&_.y<=V&&_!==i&&_!==a&&z(x,A,g,C,h,P,_.x,_.y)&&I(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function v(e,r,t){var n=e;do{var i=n.prev,l=n.next.next;!R(i,l)&&Q(i,n,n.next,l)&&F(i,l)&&F(l,i)&&(r.push(i.i/t|0),r.push(n.i/t|0),r.push(l.i/t|0),N(n),N(n.next),n=e=l),n=n.next}while(n!==e);return o(n)}function d(e,r,t,n,i,l){var a=e;do{for(var x=a.next.next;x!==a.prev;){if(a.i!==x.i&&ye(a,x)){var g=X(a,x);a=o(a,a.next),g=o(g,g.next),f(a,r,t,n,i,l,0),f(g,r,t,n,i,l,0);return}x=x.next}a=a.next}while(a!==e)}function y(e,r,t,n){var i=[],l,a,x,g,h;for(l=0,a=r.length;l<a;l++)x=r[l]*n,g=l<a-1?r[l+1]*n:e.length,h=s(e,x,g,n,!1),h===h.next&&(h.steiner=!0),i.push(ge(h));for(i.sort(m),l=0;l<i.length;l++)t=M(i[l],t);return t}function m(e,r){return e.x-r.x}function M(e,r){var t=S(e,r);if(!t)return r;var n=X(t,e);return o(n,n.next),o(t,t.next)}function S(e,r){var t=r,n=e.x,i=e.y,l=-1/0,a;do{if(i<=t.y&&i>=t.next.y&&t.next.y!==t.y){var x=t.x+(i-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(x<=n&&x>l&&(l=x,a=t.x<t.next.x?t:t.next,x===n))return a}t=t.next}while(t!==r);if(!a)return null;var g=a,h=a.x,A=a.y,C=1/0,P;t=a;do n>=t.x&&t.x>=h&&n!==t.x&&z(i<A?n:l,i,h,A,i<A?l:n,i,t.x,t.y)&&(P=Math.abs(i-t.y)/(n-t.x),F(t,e)&&(P<C||P===C&&(t.x>a.x||t.x===a.x&&de(a,t)))&&(a=t,C=P)),t=t.next;while(t!==g);return a}function de(e,r){return I(e.prev,e,r.prev)<0&&I(r.next,e,e.next)<0}function ve(e,r,t,n){var i=e;do i.z===0&&(i.z=U(i.x,i.y,r,t,n)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,he(i)}function he(e){var r,t,n,i,l,a,x,g,h=1;do{for(t=e,e=null,l=null,a=0;t;){for(a++,n=t,x=0,r=0;r<h&&(x++,n=n.nextZ,!!n);r++);for(g=h;x>0||g>0&&n;)x!==0&&(g===0||!n||t.z<=n.z)?(i=t,t=t.nextZ,x--):(i=n,n=n.nextZ,g--),l?l.nextZ=i:e=i,i.prevZ=l,l=i;t=n}l.nextZ=null,h*=2}while(a>1);return e}function U(e,r,t,n,i){return e=(e-t)*i|0,r=(r-n)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,r=(r|r<<8)&16711935,r=(r|r<<4)&252645135,r=(r|r<<2)&858993459,r=(r|r<<1)&1431655765,e|r<<1}function ge(e){var r=e,t=e;do(r.x<t.x||r.x===t.x&&r.y<t.y)&&(t=r),r=r.next;while(r!==e);return t}function z(e,r,t,n,i,l,a,x){return(i-a)*(r-x)>=(e-a)*(l-x)&&(e-a)*(n-x)>=(t-a)*(r-x)&&(t-a)*(l-x)>=(i-a)*(n-x)}function ye(e,r){return e.next.i!==r.i&&e.prev.i!==r.i&&!me(e,r)&&(F(e,r)&&F(r,e)&&Pe(e,r)&&(I(e.prev,e,r.prev)||I(e,r.prev,r))||R(e,r)&&I(e.prev,e,e.next)>0&&I(r.prev,r,r.next)>0)}function I(e,r,t){return(r.y-e.y)*(t.x-r.x)-(r.x-e.x)*(t.y-r.y)}function R(e,r){return e.x===r.x&&e.y===r.y}function Q(e,r,t,n){var i=D(I(e,r,t)),l=D(I(e,r,n)),a=D(I(t,n,e)),x=D(I(t,n,r));return!!(i!==l&&a!==x||i===0&&Z(e,t,r)||l===0&&Z(e,n,r)||a===0&&Z(t,e,n)||x===0&&Z(t,r,n))}function Z(e,r,t){return r.x<=Math.max(e.x,t.x)&&r.x>=Math.min(e.x,t.x)&&r.y<=Math.max(e.y,t.y)&&r.y>=Math.min(e.y,t.y)}function D(e){return e>0?1:e<0?-1:0}function me(e,r){var t=e;do{if(t.i!==e.i&&t.next.i!==e.i&&t.i!==r.i&&t.next.i!==r.i&&Q(t,t.next,e,r))return!0;t=t.next}while(t!==e);return!1}function F(e,r){return I(e.prev,e,e.next)<0?I(e,r,e.next)>=0&&I(e,e.prev,r)>=0:I(e,r,e.prev)<0||I(e,e.next,r)<0}function Pe(e,r){var t=e,n=!1,i=(e.x+r.x)/2,l=(e.y+r.y)/2;do t.y>l!=t.next.y>l&&t.next.y!==t.y&&i<(t.next.x-t.x)*(l-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==e);return n}function X(e,r){var t=new j(e.i,e.x,e.y),n=new j(r.i,r.x,r.y),i=e.next,l=r.prev;return e.next=r,r.prev=e,t.next=i,i.prev=t,n.next=t,t.prev=n,l.next=n,n.prev=l,n}function q(e,r,t,n){var i=new j(e,r,t);return n?(i.next=n.next,i.prev=n,n.next.prev=i,n.next=i):(i.prev=i,i.next=i),i}function N(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function j(e,r,t){this.i=e,this.x=r,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}c.deviation=function(e,r,t,n){var i=r&&r.length,l=i?r[0]*t:e.length,a=Math.abs($(e,0,l,t));if(i)for(var x=0,g=r.length;x<g;x++){var h=r[x]*t,A=x<g-1?r[x+1]*t:e.length;a-=Math.abs($(e,h,A,t))}var C=0;for(x=0;x<n.length;x+=3){var P=n[x]*t,T=n[x+1]*t,L=n[x+2]*t;C+=Math.abs((e[P]-e[L])*(e[T+1]-e[P+1])-(e[P]-e[T])*(e[L+1]-e[P+1]))}return a===0&&C===0?0:Math.abs((C-a)/a)};function $(e,r,t,n){for(var i=0,l=r,a=t-n;l<t;l+=n)i+=(e[a]-e[l])*(e[l+1]+e[a+1]),a=l;return i}return c.flatten=function(e){for(var r=e[0][0].length,t={vertices:[],holes:[],dimensions:r},n=0,i=0;i<e.length;i++){for(var l=0;l<e[i].length;l++)for(var a=0;a<r;a++)t.vertices.push(e[i][l][a]);i>0&&(n+=e[i-1].length,t.holes.push(n))}return t},b.exports}var Se=Ee();const ze=we(Se),W=fe.CLOCKWISE,oe=fe.COUNTER_CLOCKWISE,E={};function Fe(c){if(c=c&&c.positions||c,!Array.isArray(c)&&!ArrayBuffer.isView(c))throw new Error("invalid polygon")}function O(c){return"positions"in c?c.positions:c}function B(c){return"holeIndices"in c?c.holeIndices:null}function Ne(c){return Array.isArray(c[0])}function Ge(c){return c.length>=1&&c[0].length>=2&&Number.isFinite(c[0][0])}function Ve(c){const s=c[0],o=c[c.length-1];return s[0]===o[0]&&s[1]===o[1]&&s[2]===o[2]}function Oe(c,s,o,f){for(let p=0;p<s;p++)if(c[o+p]!==c[f-s+p])return!1;return!0}function ie(c,s,o,f,p){let u=s;const v=o.length;for(let d=0;d<v;d++)for(let y=0;y<f;y++)c[u++]=o[d][y]||0;if(!Ve(o))for(let d=0;d<f;d++)c[u++]=o[0][d]||0;return E.start=s,E.end=u,E.size=f,ce(c,p,E),u}function se(c,s,o,f,p=0,u,v){u=u||o.length;const d=u-p;if(d<=0)return s;let y=s;for(let m=0;m<d;m++)c[y++]=o[p+m];if(!Oe(o,f,p,u))for(let m=0;m<f;m++)c[y++]=o[p+m];return E.start=s,E.end=y,E.size=f,ce(c,v,E),y}function Re(c,s){Fe(c);const o=[],f=[];if("positions"in c){const{positions:p,holeIndices:u}=c;if(u){let v=0;for(let d=0;d<=u.length;d++)v=se(o,v,p,s,u[d-1],u[d],d===0?W:oe),f.push(v);return f.pop(),{positions:o,holeIndices:f}}c=p}if(!Ne(c))return se(o,0,c,s,0,o.length,W),o;if(!Ge(c)){let p=0;for(const[u,v]of c.entries())p=ie(o,p,v,s,u===0?W:oe),f.push(p);return f.pop(),{positions:o,holeIndices:f}}return ie(o,0,c,s,W),o}function J(c,s,o){const f=c.length/3;let p=0;for(let u=0;u<f;u++){const v=(u+1)%f;p+=c[u*3+s]*c[v*3+o],p-=c[v*3+s]*c[u*3+o]}return Math.abs(p/2)}function le(c,s,o,f){const p=c.length/3;for(let u=0;u<p;u++){const v=u*3,d=c[v+0],y=c[v+1],m=c[v+2];c[v+s]=d,c[v+o]=y,c[v+f]=m}}function Ze(c,s,o,f){let p=B(c);p&&(p=p.map(d=>d/s));let u=O(c);const v=f&&s===3;if(o){const d=u.length;u=u.slice();const y=[];for(let m=0;m<d;m+=s){y[0]=u[m],y[1]=u[m+1],v&&(y[2]=u[m+2]);const M=o(y);u[m]=M[0],u[m+1]=M[1],v&&(u[m+2]=M[2])}}if(v){const d=J(u,0,1),y=J(u,0,2),m=J(u,1,2);if(!d&&!y&&!m)return[];d>y&&d>m||(y>m?(o||(u=u.slice()),le(u,0,2,1)):(o||(u=u.slice()),le(u,2,0,1)))}return ze(u,p,s)}class De extends _e{constructor(s){const{fp64:o,IndexType:f=Uint32Array}=s;super({...s,attributes:{positions:{size:3,type:o?Float64Array:Float32Array},vertexValid:{type:Uint16Array,size:1},indices:{type:f,size:1}}})}get(s){const{attributes:o}=this;return s==="indices"?o.indices&&o.indices.subarray(0,this.vertexCount):o[s]}updateGeometry(s){super.updateGeometry(s);const o=this.buffers.indices;if(o)this.vertexCount=(o.value||o).length;else if(this.data&&!this.getGeometry)throw new Error("missing indices buffer")}normalizeGeometry(s){if(this.normalize){const o=Re(s,this.positionSize);return this.opts.resolution?Ce(O(o),B(o),{size:this.positionSize,gridResolution:this.opts.resolution,edgeTypes:!0}):this.opts.wrapLongitude?Le(O(o),B(o),{size:this.positionSize,maxLatitude:86,edgeTypes:!0}):o}return s}getGeometrySize(s){if(ae(s)){let o=0;for(const f of s)o+=this.getGeometrySize(f);return o}return O(s).length/this.positionSize}getGeometryFromBuffer(s){return this.normalize||!this.buffers.indices?super.getGeometryFromBuffer(s):null}updateGeometryAttributes(s,o){if(s&&ae(s))for(const f of s){const p=this.getGeometrySize(f);o.geometrySize=p,this.updateGeometryAttributes(f,o),o.vertexStart+=p,o.indexStart=this.indexStarts[o.geometryIndex+1]}else{const f=s;this._updateIndices(f,o),this._updatePositions(f,o),this._updateVertexValid(f,o)}}_updateIndices(s,{geometryIndex:o,vertexStart:f,indexStart:p}){const{attributes:u,indexStarts:v,typedArrayManager:d}=this;let y=u.indices;if(!y||!s)return;let m=p;const M=Ze(s,this.positionSize,this.opts.preproject,this.opts.full3d);y=d.allocate(y,p+M.length,{copy:!0});for(let S=0;S<M.length;S++)y[m++]=M[S]+f;v[o+1]=p+M.length,u.indices=y}_updatePositions(s,{vertexStart:o,geometrySize:f}){const{attributes:{positions:p},positionSize:u}=this;if(!p||!s)return;const v=O(s);for(let d=o,y=0;y<f;d++,y++){const m=v[y*u],M=v[y*u+1],S=u>2?v[y*u+2]:0;p[d*3]=m,p[d*3+1]=M,p[d*3+2]=S}}_updateVertexValid(s,{vertexStart:o,geometrySize:f}){const{positionSize:p}=this,u=this.attributes.vertexValid,v=s&&B(s);if(s&&s.edgeTypes?u.set(s.edgeTypes,o):u.fill(1,o,o+f),v)for(let d=0;d<v.length;d++)u[o+v[d]/p-1]=0;u[o+f-1]=0}}function ae(c){return Array.isArray(c)&&c.length>0&&!Number.isFinite(c[0])}const ue=`uniform solidPolygonUniforms {
  bool extruded;
  bool isWireframe;
  float elevationScale;
} solidPolygon;
`,be={name:"solidPolygon",vs:ue,fs:ue,uniformTypes:{extruded:"f32",isWireframe:"f32",elevationScale:"f32"}},xe=`in vec4 fillColors;
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
`,We=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader
in vec3 vertexPositions;
in vec3 vertexPositions64Low;
in float elevations;
${xe}
void main(void) {
PolygonProps props;
props.positions = vertexPositions;
props.positions64Low = vertexPositions64Low;
props.elevations = elevations;
props.normal = vec3(0.0, 0.0, 1.0);
calculatePosition(props);
}
`,ke=`#version 300 es
#define SHADER_NAME solid-polygon-layer-vertex-shader-side
#define IS_SIDE_VERTEX
in vec2 positions;
in vec3 vertexPositions;
in vec3 nextVertexPositions;
in vec3 vertexPositions64Low;
in vec3 nextVertexPositions64Low;
in float elevations;
in float instanceVertexValid;
${xe}
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
`,Be=`#version 300 es
#define SHADER_NAME solid-polygon-layer-fragment-shader
precision highp float;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,H=[0,0,0,255],He={filled:!0,extruded:!1,wireframe:!1,_normalize:!0,_windingOrder:"CW",_full3d:!1,elevationScale:{type:"number",min:0,value:1},getPolygon:{type:"accessor",value:c=>c.polygon},getElevation:{type:"accessor",value:1e3},getFillColor:{type:"accessor",value:H},getLineColor:{type:"accessor",value:H},material:!0},k={enter:(c,s)=>s.length?s.subarray(s.length-c.length):c};class pe extends Ie{getShaders(s){return super.getShaders({vs:s==="top"?We:ke,fs:Be,defines:{RING_WINDING_ORDER_CW:!this.props._normalize&&this.props._windingOrder==="CCW"?0:1},modules:[Ae,Te,Me,be]})}get wrapLongitude(){return!1}getBounds(){return this.getAttributeManager()?.getBounds(["vertexPositions"])}initializeState(){const{viewport:s}=this.context;let{coordinateSystem:o}=this.props;const{_full3d:f}=this.props;s.isGeospatial&&o===K.DEFAULT&&(o=K.LNGLAT);let p;o===K.LNGLAT&&(f?p=s.projectPosition.bind(s):p=s.projectFlat.bind(s)),this.setState({numInstances:0,polygonTesselator:new De({preproject:p,fp64:this.use64bitPositions(),IndexType:Uint32Array})});const u=this.getAttributeManager(),v=!0;u.remove(["instancePickingColors"]),u.add({indices:{size:1,isIndexed:!0,update:this.calculateIndices,noAlloc:v},vertexPositions:{size:3,type:"float64",stepMode:"dynamic",fp64:this.use64bitPositions(),transition:k,accessor:"getPolygon",update:this.calculatePositions,noAlloc:v,shaderAttributes:{nextVertexPositions:{vertexOffset:1}}},instanceVertexValid:{size:1,type:"uint16",stepMode:"instance",update:this.calculateVertexValid,noAlloc:v},elevations:{size:1,stepMode:"dynamic",transition:k,accessor:"getElevation"},fillColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:k,accessor:"getFillColor",defaultValue:H},lineColors:{size:this.props.colorFormat.length,type:"unorm8",stepMode:"dynamic",transition:k,accessor:"getLineColor",defaultValue:H},pickingColors:{size:4,type:"uint8",stepMode:"dynamic",accessor:(d,{index:y,target:m})=>this.encodePickingColor(d&&d.__source?d.__source.index:y,m)}})}getPickingInfo(s){const o=super.getPickingInfo(s),{index:f}=o,p=this.props.data;return p[0]&&p[0].__source&&(o.object=p.find(u=>u.__source.index===f)),o}disablePickingIndex(s){const o=this.props.data;if(o[0]&&o[0].__source)for(let f=0;f<o.length;f++)o[f].__source.index===s&&this._disablePickingIndex(f);else super.disablePickingIndex(s)}draw({uniforms:s}){const{extruded:o,filled:f,wireframe:p,elevationScale:u}=this.props,{topModel:v,sideModel:d,wireframeModel:y,polygonTesselator:m}=this.state,M={extruded:!!o,elevationScale:u,isWireframe:!1};y&&p&&(y.setInstanceCount(m.instanceCount-1),y.shaderInputs.setProps({solidPolygon:{...M,isWireframe:!0}}),y.draw(this.context.renderPass)),d&&f&&(d.setInstanceCount(m.instanceCount-1),d.shaderInputs.setProps({solidPolygon:M}),d.draw(this.context.renderPass)),v&&f&&(v.setVertexCount(m.vertexCount),v.shaderInputs.setProps({solidPolygon:M}),v.draw(this.context.renderPass))}updateState(s){super.updateState(s),this.updateGeometry(s);const{props:o,oldProps:f,changeFlags:p}=s,u=this.getAttributeManager();(p.extensionsChanged||o.filled!==f.filled||o.extruded!==f.extruded)&&(this.state.models?.forEach(d=>d.destroy()),this.setState(this._getModels()),u.invalidateAll())}updateGeometry({props:s,oldProps:o,changeFlags:f}){if(f.dataChanged||f.updateTriggersChanged&&(f.updateTriggersChanged.all||f.updateTriggersChanged.getPolygon)){const{polygonTesselator:u}=this.state,v=s.data.attributes||{};u.updateGeometry({data:s.data,normalize:s._normalize,geometryBuffer:v.getPolygon,buffers:v,getGeometry:s.getPolygon,positionFormat:s.positionFormat,wrapLongitude:s.wrapLongitude,resolution:this.context.viewport.resolution,fp64:this.use64bitPositions(),dataChanged:f.dataChanged,full3d:s._full3d}),this.setState({numInstances:u.instanceCount,startIndices:u.vertexStarts}),f.dataChanged||this.getAttributeManager().invalidateAll()}}_getModels(){const{id:s,filled:o,extruded:f}=this.props;let p,u,v;if(o){const d=this.getShaders("top");d.defines.NON_INSTANCED_MODEL=1;const y=this.getAttributeManager().getBufferLayouts({isInstanced:!1});p=new Y(this.context.device,{...d,id:`${s}-top`,topology:"triangle-list",bufferLayout:y,isIndexed:!0,userData:{excludeAttributes:{instanceVertexValid:!0}}})}if(f){const d=this.getAttributeManager().getBufferLayouts({isInstanced:!0});u=new Y(this.context.device,{...this.getShaders("side"),id:`${s}-side`,bufferLayout:d,geometry:new re({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,1,1,0,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}}),v=new Y(this.context.device,{...this.getShaders("side"),id:`${s}-wireframe`,bufferLayout:d,geometry:new re({topology:"line-strip",attributes:{positions:{size:2,value:new Float32Array([1,0,0,0,0,1,1,1])}}}),isInstanced:!0,userData:{excludeAttributes:{indices:!0}}})}return{models:[u,v,p].filter(Boolean),topModel:p,sideModel:u,wireframeModel:v}}calculateIndices(s){const{polygonTesselator:o}=this.state;s.startIndices=o.indexStarts,s.value=o.get("indices")}calculatePositions(s){const{polygonTesselator:o}=this.state;s.startIndices=o.vertexStarts,s.value=o.get("positions")}calculateVertexValid(s){s.value=this.state.polygonTesselator.get("vertexValid")}}pe.defaultProps=He;pe.layerName="SolidPolygonLayer";export{pe as S,Re as n};
