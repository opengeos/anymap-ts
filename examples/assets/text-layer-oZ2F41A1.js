import{I as se}from"./icon-layer-BKQRWK27.js";import{d as O,H as ie,I as ne,U as ae,o as re,N as le}from"./mapbox-overlay-CtMyNbGZ.js";import{p as ce}from"./picking-CN0D5Hbh.js";import{G as ge}from"./geometry-CwO1uo58.js";import{C as fe}from"./composite-layer-D5nYxRM9.js";const N=`uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,de={name:"sdf",vs:N,fs:N,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},ue=`#version 300 es
#define SHADER_NAME multi-icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
if (!bool(picking.isActive)) {
float alpha = texture(iconsTexture, vTextureCoords).a;
vec4 color = vColor;
if (sdf.enabled) {
float distance = alpha;
alpha = smoothstep(sdf.buffer - sdf.gamma, sdf.buffer + sdf.gamma, distance);
if (sdf.outlineBuffer > 0.0) {
float inFill = alpha;
float inBorder = smoothstep(sdf.outlineBuffer - sdf.gamma, sdf.outlineBuffer + sdf.gamma, distance);
color = mix(sdf.outlineColor, vColor, inFill);
alpha = inBorder;
}
}
float a = alpha * color.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color.rgb, a * layer.opacity);
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,E=192/256,D=[],he={getIconOffsets:{type:"accessor",value:g=>g.offsets},alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]}};class k extends se{getShaders(){const e=super.getShaders();return{...e,modules:[...e.modules,de],fs:ue}}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({instanceOffsets:{size:2,accessor:"getIconOffsets"},instancePickingColors:{type:"uint8",size:3,accessor:(t,{index:s,target:o})=>this.encodePickingColor(s,o)}})}updateState(e){super.updateState(e);const{props:t,oldProps:s}=e;let{outlineColor:o}=t;o!==s.outlineColor&&(o=o.map(r=>r/255),o[3]=Number.isFinite(o[3])?o[3]:1,this.setState({outlineColor:o})),!t.sdf&&t.outlineWidth&&O.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){const{sdf:t,smoothing:s,outlineWidth:o}=this.props,{outlineColor:r}=this.state,l=o?Math.max(s,E*(1-o)):-1,i=this.state.model,a={buffer:E,outlineBuffer:l,gamma:s,enabled:!!t,outlineColor:r};if(i.shaderInputs.setProps({sdf:a}),super.draw(e),t&&o){const{iconManager:n}=this.state;n.getTexture()&&(i.shaderInputs.setProps({sdf:{...a,outlineBuffer:E}}),i.draw(this.context.renderPass))}}getInstanceOffset(e){return e?Array.from(e).flatMap(t=>super.getInstanceOffset(t)):D}getInstanceColorMode(e){return 1}getInstanceIconFrame(e){return e?Array.from(e).flatMap(t=>super.getInstanceIconFrame(t)):D}}k.defaultProps=he;k.layerName="MultiIconLayer";const T=1e20;class pe{constructor({fontSize:e=24,buffer:t=3,radius:s=8,cutoff:o=.25,fontFamily:r="sans-serif",fontWeight:l="normal",fontStyle:i="normal",lang:a=null}={}){this.buffer=t,this.cutoff=o,this.radius=s,this.lang=a;const n=this.size=e+t*4,c=this._createCanvas(n),f=this.ctx=c.getContext("2d",{willReadFrequently:!0});f.font=`${i} ${l} ${e}px ${r}`,f.textBaseline="alphabetic",f.textAlign="left",f.fillStyle="black",this.gridOuter=new Float64Array(n*n),this.gridInner=new Float64Array(n*n),this.f=new Float64Array(n),this.z=new Float64Array(n+1),this.v=new Uint16Array(n)}_createCanvas(e){const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:s,actualBoundingBoxDescent:o,actualBoundingBoxLeft:r,actualBoundingBoxRight:l}=this.ctx.measureText(e),i=Math.ceil(s),a=0,n=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(l-r))),c=Math.min(this.size-this.buffer,i+Math.ceil(o)),f=n+2*this.buffer,d=c+2*this.buffer,u=Math.max(f*d,0),h=new Uint8ClampedArray(u),m={data:h,width:f,height:d,glyphWidth:n,glyphHeight:c,glyphTop:i,glyphLeft:a,glyphAdvance:t};if(n===0||c===0)return m;const{ctx:p,buffer:x,gridInner:P,gridOuter:_}=this;this.lang&&(p.lang=this.lang),p.clearRect(x,x,n,c),p.fillText(e,x,x+i);const A=p.getImageData(x,x,n,c);_.fill(T,0,u),P.fill(0,0,u);for(let y=0;y<c;y++)for(let v=0;v<n;v++){const S=A.data[4*(y*n+v)+3]/255;if(S===0)continue;const z=(y+x)*f+v+x;if(S===1)_[z]=0,P[z]=T;else{const L=.5-S;_[z]=L>0?L*L:0,P[z]=L<0?L*L:0}}H(_,0,0,f,d,f,this.f,this.v,this.z),H(P,x,x,n,c,f,this.f,this.v,this.z);for(let y=0;y<u;y++){const v=Math.sqrt(_[y])-Math.sqrt(P[y]);h[y]=Math.round(255-255*(v/this.radius+this.cutoff))}return m}}function H(g,e,t,s,o,r,l,i,a){for(let n=e;n<e+s;n++)$(g,t*r+n,r,o,l,i,a);for(let n=t;n<t+o;n++)$(g,n*r+e,1,s,l,i,a)}function $(g,e,t,s,o,r,l){r[0]=0,l[0]=-T,l[1]=T,o[0]=g[e];for(let i=1,a=0,n=0;i<s;i++){o[i]=g[e+i*t];const c=i*i;do{const f=r[a];n=(o[i]-o[f]+c-f*f)/(i-f)/2}while(n<=l[a]&&--a>-1);a++,r[a]=i,l[a]=n,l[a+1]=T}for(let i=0,a=0;i<s;i++){for(;l[a+1]<i;)a++;const n=r[a],c=i-n;g[e+i*t]=o[n]+c*c}}const xe=32,me=[];function ye(g){return Math.pow(2,Math.ceil(Math.log2(g)))}function Ce({characterSet:g,getFontWidth:e,fontHeight:t,buffer:s,maxCanvasWidth:o,mapping:r={},xOffset:l=0,yOffset:i=0}){let a=0,n=l;const c=t+s*2;for(const f of g)if(!r[f]){const d=e(f);n+d+s*2>o&&(n=0,a++),r[f]={x:n+s,y:i+a*c+s,width:d,height:c,layoutWidth:d,layoutHeight:t},n+=d+s*2}return{mapping:r,xOffset:n,yOffset:i+a*c,canvasHeight:ye(i+(a+1)*c)}}function X(g,e,t,s){var r;let o=0;for(let l=e;l<t;l++){const i=g[l];o+=((r=s[i])==null?void 0:r.layoutWidth)||0}return o}function Z(g,e,t,s,o,r){let l=e,i=0;for(let a=e;a<t;a++){const n=X(g,a,a+1,o);i+n>s&&(l<a&&r.push(a),l=a,i=0),i+=n}return i}function ve(g,e,t,s,o,r){let l=e,i=e,a=e,n=0;for(let c=e;c<t;c++)if((g[c]===" "||g[c+1]===" "||c+1===t)&&(a=c+1),a>i){let f=X(g,i,a,o);n+f>s&&(l<i&&(r.push(i),l=i,n=0),f>s&&(f=Z(g,i,a,s,o,r),l=r[r.length-1])),i=a,n+=f}return n}function _e(g,e,t,s,o=0,r){r===void 0&&(r=g.length);const l=[];return e==="break-all"?Z(g,o,r,t,s,l):ve(g,o,r,t,s,l),l}function be(g,e,t,s,o,r){let l=0,i=0;for(let a=e;a<t;a++){const n=g[a],c=s[n];c?(i||(i=c.layoutHeight),o[a]=l+c.layoutWidth/2,l+=c.layoutWidth):(O.warn(`Missing character: ${n} (${n.codePointAt(0)})`)(),o[a]=l,l+=xe)}r[0]=l,r[1]=i}function Pe(g,e,t,s,o){var p;const r=Array.from(g),l=r.length,i=new Array(l),a=new Array(l),n=new Array(l),c=(t==="break-word"||t==="break-all")&&isFinite(s)&&s>0,f=[0,0],d=[0,0];let u=0,h=0,m=0;for(let x=0;x<=l;x++){const P=r[x];if((P===`
`||x===l)&&(m=x),m>h){const _=c?_e(r,t,s,o,h,m):me;for(let A=0;A<=_.length;A++){const y=A===0?h:_[A-1],v=A<_.length?_[A]:m;be(r,y,v,o,i,d);for(let S=y;S<v;S++){const z=r[S],L=((p=o[z])==null?void 0:p.layoutOffsetY)||0;a[S]=u+d[1]/2+L,n[S]=d[0]}u=u+d[1]*e,f[0]=Math.max(f[0],d[0])}h=m}P===`
`&&(i[h]=0,a[h]=0,n[h]=0,h++)}return f[1]=u,{x:i,y:a,rowWidth:n,size:f}}function Ae({value:g,length:e,stride:t,offset:s,startIndices:o,characterSet:r}){const l=g.BYTES_PER_ELEMENT,i=t?t/l:1,a=s?s/l:0,n=o[e]||Math.ceil((g.length-a)/i),c=r&&new Set,f=new Array(e);let d=g;if(i>1||a>0){const u=g.constructor;d=new u(n);for(let h=0;h<n;h++)d[h]=g[h*i+a]}for(let u=0;u<e;u++){const h=o[u],m=o[u+1]||n,p=d.subarray(h,m);f[u]=String.fromCodePoint.apply(null,p),c&&p.forEach(c.add,c)}if(c)for(const u of c)r.add(String.fromCodePoint(u));return{texts:f,characterCount:n}}class J{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function Se(){const g=[];for(let e=32;e<128;e++)g.push(String.fromCharCode(e));return g}const B={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:Se(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},U=1024,G=.9,q=1.2,Q=3;let w=new J(Q);function Le(g,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const s=w.get(g);if(!s)return t;for(const o in s.mapping)t.has(o)&&t.delete(o);return t}function ze(g,e){for(let t=0;t<g.length;t++)e.data[4*t+3]=g[t]}function j(g,e,t,s){g.font=`${s} ${t}px ${e}`,g.fillStyle="#000",g.textBaseline="alphabetic",g.textAlign="left"}function Be(g){O.assert(Number.isFinite(g)&&g>=Q,"Invalid cache limit"),w=new J(g)}class Te{constructor(){this.props={...B}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}get scale(){const{fontSize:e,buffer:t}=this.props;return(e*q+t*2)/e}setProps(e={}){Object.assign(this.props,e),this._key=this._getKey();const t=Le(this._key,this.props.characterSet),s=w.get(this._key);if(s&&t.size===0){this._atlas!==s&&(this._atlas=s);return}const o=this._generateFontAtlas(t,s);this._atlas=o,w.set(this._key,o)}_generateFontAtlas(e,t){const{fontFamily:s,fontWeight:o,fontSize:r,buffer:l,sdf:i,radius:a,cutoff:n}=this.props;let c=t&&t.data;c||(c=document.createElement("canvas"),c.width=U);const f=c.getContext("2d",{willReadFrequently:!0});j(f,s,r,o);const{mapping:d,canvasHeight:u,xOffset:h,yOffset:m}=Ce({getFontWidth:p=>f.measureText(p).width,fontHeight:r*q,buffer:l,characterSet:e,maxCanvasWidth:U,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffset:t.yOffset}});if(c.height!==u){const p=f.getImageData(0,0,c.width,c.height);c.height=u,f.putImageData(p,0,0)}if(j(f,s,r,o),i){const p=new pe({fontSize:r,buffer:l,radius:a,cutoff:n,fontFamily:s,fontWeight:`${o}`});for(const x of e){const{data:P,width:_,height:A,glyphTop:y}=p.draw(x);d[x].width=_,d[x].layoutOffsetY=r*G-y;const v=f.createImageData(_,A);ze(P,v),f.putImageData(v,d[x].x,d[x].y)}}else for(const p of e)f.fillText(p,d[p].x,d[p].y+l+r*G);return{xOffset:h,yOffset:m,mapping:d,data:c,width:c.width,height:c.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:s,buffer:o,sdf:r,radius:l,cutoff:i}=this.props;return r?`${e} ${t} ${s} ${o} ${l} ${i}`:`${e} ${t} ${s} ${o}`}}const K=`uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,we={name:"textBackground",vs:K,fs:K,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},Oe=`#version 300 es
#define SHADER_NAME text-background-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceRects;
in float instanceSizes;
in float instanceAngles;
in vec2 instancePixelOffsets;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
out vec4 vFillColor;
out vec4 vLineColor;
out float vLineWidth;
out vec2 uv;
out vec2 dimensions;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = radians(angle);
float cos_angle = cos(angle_radian);
float sin_angle = sin(angle_radian);
mat2 rotationMatrix = mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
return rotationMatrix * vertex;
}
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = positions;
geometry.pickingColor = instancePickingColors;
uv = positions;
vLineWidth = instanceLineWidths;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * textBackground.sizeScale, textBackground.sizeUnits),
textBackground.sizeMinPixels, textBackground.sizeMaxPixels
);
dimensions = instanceRects.zw * sizePixels + textBackground.padding.xy + textBackground.padding.zw;
vec2 pixelOffset = (positions * instanceRects.zw + instanceRects.xy) * sizePixels + mix(-textBackground.padding.xy, textBackground.padding.zw, positions);
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles);
pixelOffset += instancePixelOffsets;
pixelOffset.y *= -1.0;
if (textBackground.billboard)  {
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
vec3 offset = vec3(pixelOffset, 0.0);
DECKGL_FILTER_SIZE(offset, geometry);
gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
} else {
vec3 offset_common = vec3(project_pixel_size(pixelOffset), 0.0);
DECKGL_FILTER_SIZE(offset_common, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset_common, geometry.position);
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
}
vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vFillColor, geometry);
vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`,Ee=`#version 300 es
#define SHADER_NAME text-background-layer-fragment-shader
precision highp float;
in vec4 vFillColor;
in vec4 vLineColor;
in float vLineWidth;
in vec2 uv;
in vec2 dimensions;
out vec4 fragColor;
float round_rect(vec2 p, vec2 size, vec4 radii) {
vec2 pixelPositionCB = (p - 0.5) * size;
vec2 sizeCB = size * 0.5;
float maxBorderRadius = min(size.x, size.y) * 0.5;
vec4 borderRadius = vec4(min(radii, maxBorderRadius));
borderRadius.xy =
(pixelPositionCB.x > 0.0) ? borderRadius.xy : borderRadius.zw;
borderRadius.x = (pixelPositionCB.y > 0.0) ? borderRadius.x : borderRadius.y;
vec2 q = abs(pixelPositionCB) - sizeCB + borderRadius.x;
return -(min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - borderRadius.x);
}
float rect(vec2 p, vec2 size) {
vec2 pixelPosition = p * size;
return min(min(pixelPosition.x, size.x - pixelPosition.x),
min(pixelPosition.y, size.y - pixelPosition.y));
}
vec4 get_stroked_fragColor(float dist) {
float isBorder = smoothedge(dist, vLineWidth);
return mix(vFillColor, vLineColor, isBorder);
}
void main(void) {
geometry.uv = uv;
if (textBackground.borderRadius != vec4(0.0)) {
float distToEdge = round_rect(uv, dimensions, textBackground.borderRadius);
if (textBackground.stroked) {
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
float shapeAlpha = smoothedge(-distToEdge, 0.0);
fragColor.a *= shapeAlpha;
} else {
if (textBackground.stroked) {
float distToEdge = rect(uv, dimensions);
fragColor = get_stroked_fragColor(distToEdge);
} else {
fragColor = vFillColor;
}
}
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,Ie={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:g=>g.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class M extends ie{getShaders(){return super.getShaders({vs:Oe,fs:Ee,modules:[ne,ce,we]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){var s;super.updateState(e);const{changeFlags:t}=e;t.extensionsChanged&&((s=this.state.model)==null||s.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{billboard:t,sizeScale:s,sizeUnits:o,sizeMinPixels:r,sizeMaxPixels:l,getLineWidth:i}=this.props;let{padding:a,borderRadius:n}=this.props;a.length<4&&(a=[a[0],a[1],a[0],a[1]]),Array.isArray(n)||(n=[n,n,n,n]);const c=this.state.model,f={billboard:t,stroked:!!i,borderRadius:n,padding:a,sizeUnits:ae[o],sizeScale:s,sizeMinPixels:r,sizeMaxPixels:l};c.shaderInputs.setProps({textBackground:f}),c.draw(this.context.renderPass)}_getModel(){const e=[0,0,1,0,0,1,1,1];return new re(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new ge({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}}M.defaultProps=Ie;M.layerName="TextBackgroundLayer";const V={start:1,middle:0,end:-1},Y={top:1,center:0,bottom:-1},I=[0,0,0,255],ke=1,Me={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:I},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:B.characterSet},fontFamily:B.fontFamily,fontWeight:B.fontWeight,lineHeight:ke,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:I},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},getText:{type:"accessor",value:g=>g.text},getPosition:{type:"accessor",value:g=>g.position},getColor:{type:"accessor",value:I},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class ee extends fe{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[s,o]}=this.transformParagraph(e,t);const{fontSize:r}=this.state.fontAtlasManager.props;s/=r,o/=r;const{getTextAnchor:l,getAlignmentBaseline:i}=this.props,a=V[typeof l=="function"?l(e,t):l],n=Y[typeof i=="function"?i(e,t):i];return[(a-1)*s/2,(n-1)*o/2,s,o]},this.getIconOffsets=(e,t)=>{const{getTextAnchor:s,getAlignmentBaseline:o}=this.props,{x:r,y:l,rowWidth:i,size:[a,n]}=this.transformParagraph(e,t),c=V[typeof s=="function"?s(e,t):s],f=Y[typeof o=="function"?o(e,t):o],d=r.length,u=new Array(d*2);let h=0;for(let m=0;m<d;m++){const p=(1-c)*(a-i[m])/2;u[h++]=(c-1)*a/2+p+r[m],u[h++]=(f-1)*n/2+l[m]}return u}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new Te},this.props.maxWidth>0&&O.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:s,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==s.lineHeight||t.wordBreak!==s.wordBreak||t.maxWidth!==s.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:s}=this.props,{fontAtlasManager:o,characterSet:r}=this.state,l={...e,characterSet:r,fontFamily:t,fontWeight:s};if(!o.mapping)return o.setProps(l),!0;for(const i in l)if(l[i]!==o.props[i])return o.setProps(l),!0;return!1}_updateText(){var a;const{data:e,characterSet:t}=this.props,s=(a=e.attributes)==null?void 0:a.getText;let{getText:o}=this.props,r=e.startIndices,l;const i=t==="auto"&&new Set;if(s&&r){const{texts:n,characterCount:c}=Ae({...ArrayBuffer.isView(s)?{value:s}:s,length:e.length,startIndices:r,characterSet:i});l=c,o=(f,{index:d})=>n[d]}else{const{iterable:n,objectInfo:c}=le(e);r=[0],l=0;for(const f of n){c.index++;const d=Array.from(o(f,c)||"");i&&d.forEach(i.add,i),l+=d.length,r.push(l)}}this.setState({getText:o,startIndices:r,numInstances:l,characterSet:i||t})}transformParagraph(e,t){const{fontAtlasManager:s}=this.state,o=s.mapping,r=this.state.getText,{wordBreak:l,lineHeight:i,maxWidth:a}=this.props,n=r(e,t)||"";return Pe(n,i,l,a*s.props.fontSize,o)}renderLayers(){const{startIndices:e,numInstances:t,getText:s,fontAtlasManager:{scale:o,atlas:r,mapping:l},styleVersion:i}=this.state,{data:a,_dataDiff:n,getPosition:c,getColor:f,getSize:d,getAngle:u,getPixelOffset:h,getBackgroundColor:m,getBorderColor:p,getBorderWidth:x,backgroundBorderRadius:P,backgroundPadding:_,background:A,billboard:y,fontSettings:v,outlineWidth:S,outlineColor:z,sizeScale:L,sizeUnits:F,sizeMinPixels:R,sizeMaxPixels:W,transitions:b,updateTriggers:C}=this.props,te=this.getSubLayerClass("characters",k),oe=this.getSubLayerClass("background",M);return[A&&new oe({getFillColor:m,getLineColor:p,getLineWidth:x,borderRadius:P,padding:_,getPosition:c,getSize:d,getAngle:u,getPixelOffset:h,billboard:y,sizeScale:L,sizeUnits:F,sizeMinPixels:R,sizeMaxPixels:W,transitions:b&&{getPosition:b.getPosition,getAngle:b.getAngle,getSize:b.getSize,getFillColor:b.getBackgroundColor,getLineColor:b.getBorderColor,getLineWidth:b.getBorderWidth,getPixelOffset:b.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:C.getPosition,getAngle:C.getAngle,getSize:C.getSize,getFillColor:C.getBackgroundColor,getLineColor:C.getBorderColor,getLineWidth:C.getBorderWidth,getPixelOffset:C.getPixelOffset,getBoundingRect:{getText:C.getText,getTextAnchor:C.getTextAnchor,getAlignmentBaseline:C.getAlignmentBaseline,styleVersion:i}}}),{data:a.attributes&&a.attributes.background?{length:a.length,attributes:a.attributes.background}:a,_dataDiff:n,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new te({sdf:v.sdf,smoothing:Number.isFinite(v.smoothing)?v.smoothing:B.smoothing,outlineWidth:S/(v.radius||B.radius),outlineColor:z,iconAtlas:r,iconMapping:l,getPosition:c,getColor:f,getSize:d,getAngle:u,getPixelOffset:h,billboard:y,sizeScale:L*o,sizeUnits:F,sizeMinPixels:R*o,sizeMaxPixels:W*o,transitions:b&&{getPosition:b.getPosition,getAngle:b.getAngle,getColor:b.getColor,getSize:b.getSize,getPixelOffset:b.getPixelOffset}},this.getSubLayerProps({id:"characters",updateTriggers:{all:C.getText,getPosition:C.getPosition,getAngle:C.getAngle,getColor:C.getColor,getSize:C.getSize,getPixelOffset:C.getPixelOffset,getIconOffsets:{getTextAnchor:C.getTextAnchor,getAlignmentBaseline:C.getAlignmentBaseline,styleVersion:i}}}),{data:a,_dataDiff:n,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:s})]}static set fontAtlasCacheLimit(e){Be(e)}}ee.defaultProps=Me;ee.layerName="TextLayer";export{ee as T};
