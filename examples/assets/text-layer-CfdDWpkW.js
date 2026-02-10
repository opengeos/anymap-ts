import{I as se}from"./icon-layer-B4_oQZju.js";import{d as O,H as ie,I as ne,U as ae,o as re,N as le}from"./mapbox-overlay-dETm6WBN.js";import{p as ce}from"./picking-CN0D5Hbh.js";import{G as ge}from"./geometry-C3q6ySK1.js";import{C as fe}from"./composite-layer-DS4VCTQb.js";const N=`uniform sdfUniforms {
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
`,E=192/256,D=[],he={getIconOffsets:{type:"accessor",value:g=>g.offsets},alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]}};class k extends se{getShaders(){const e=super.getShaders();return{...e,modules:[...e.modules,de],fs:ue}}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({instanceOffsets:{size:2,accessor:"getIconOffsets"},instancePickingColors:{type:"uint8",size:3,accessor:(t,{index:s,target:o})=>this.encodePickingColor(s,o)}})}updateState(e){super.updateState(e);const{props:t,oldProps:s}=e;let{outlineColor:o}=t;o!==s.outlineColor&&(o=o.map(r=>r/255),o[3]=Number.isFinite(o[3])?o[3]:1,this.setState({outlineColor:o})),!t.sdf&&t.outlineWidth&&O.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){const{sdf:t,smoothing:s,outlineWidth:o}=this.props,{outlineColor:r}=this.state,l=o?Math.max(s,E*(1-o)):-1,n=this.state.model,a={buffer:E,outlineBuffer:l,gamma:s,enabled:!!t,outlineColor:r};if(n.shaderInputs.setProps({sdf:a}),super.draw(e),t&&o){const{iconManager:i}=this.state;i.getTexture()&&(n.shaderInputs.setProps({sdf:{...a,outlineBuffer:E}}),n.draw(this.context.renderPass))}}getInstanceOffset(e){return e?Array.from(e).flatMap(t=>super.getInstanceOffset(t)):D}getInstanceColorMode(e){return 1}getInstanceIconFrame(e){return e?Array.from(e).flatMap(t=>super.getInstanceIconFrame(t)):D}}k.defaultProps=he;k.layerName="MultiIconLayer";const T=1e20;class pe{constructor({fontSize:e=24,buffer:t=3,radius:s=8,cutoff:o=.25,fontFamily:r="sans-serif",fontWeight:l="normal",fontStyle:n="normal",lang:a=null}={}){this.buffer=t,this.cutoff=o,this.radius=s,this.lang=a;const i=this.size=e+t*4,c=this._createCanvas(i),f=this.ctx=c.getContext("2d",{willReadFrequently:!0});f.font=`${n} ${l} ${e}px ${r}`,f.textBaseline="alphabetic",f.textAlign="left",f.fillStyle="black",this.gridOuter=new Float64Array(i*i),this.gridInner=new Float64Array(i*i),this.f=new Float64Array(i),this.z=new Float64Array(i+1),this.v=new Uint16Array(i)}_createCanvas(e){const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:s,actualBoundingBoxDescent:o,actualBoundingBoxLeft:r,actualBoundingBoxRight:l}=this.ctx.measureText(e),n=Math.ceil(s),a=0,i=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(l-r))),c=Math.min(this.size-this.buffer,n+Math.ceil(o)),f=i+2*this.buffer,d=c+2*this.buffer,u=Math.max(f*d,0),p=new Uint8ClampedArray(u),m={data:p,width:f,height:d,glyphWidth:i,glyphHeight:c,glyphTop:n,glyphLeft:a,glyphAdvance:t};if(i===0||c===0)return m;const{ctx:h,buffer:x,gridInner:b,gridOuter:_}=this;this.lang&&(h.lang=this.lang),h.clearRect(x,x,i,c),h.fillText(e,x,x+n);const S=h.getImageData(x,x,i,c);_.fill(T,0,u),b.fill(0,0,u);for(let C=0;C<c;C++)for(let y=0;y<i;y++){const z=S.data[4*(C*i+y)+3]/255;if(z===0)continue;const L=(C+x)*f+y+x;if(z===1)_[L]=0,b[L]=T;else{const A=.5-z;_[L]=A>0?A*A:0,b[L]=A<0?A*A:0}}H(_,0,0,f,d,f,this.f,this.v,this.z),H(b,x,x,i,c,f,this.f,this.v,this.z);for(let C=0;C<u;C++){const y=Math.sqrt(_[C])-Math.sqrt(b[C]);p[C]=Math.round(255-255*(y/this.radius+this.cutoff))}return m}}function H(g,e,t,s,o,r,l,n,a){for(let i=e;i<e+s;i++)$(g,t*r+i,r,o,l,n,a);for(let i=t;i<t+o;i++)$(g,i*r+e,1,s,l,n,a)}function $(g,e,t,s,o,r,l){r[0]=0,l[0]=-T,l[1]=T,o[0]=g[e];for(let n=1,a=0,i=0;n<s;n++){o[n]=g[e+n*t];const c=n*n;do{const f=r[a];i=(o[n]-o[f]+c-f*f)/(n-f)/2}while(i<=l[a]&&--a>-1);a++,r[a]=n,l[a]=i,l[a+1]=T}for(let n=0,a=0;n<s;n++){for(;l[a+1]<n;)a++;const i=r[a],c=n-i;g[e+n*t]=o[i]+c*c}}const xe=32,me=[];function ye(g){return Math.pow(2,Math.ceil(Math.log2(g)))}function Ce({characterSet:g,getFontWidth:e,fontHeight:t,buffer:s,maxCanvasWidth:o,mapping:r={},xOffset:l=0,yOffset:n=0}){let a=0,i=l;const c=t+s*2;for(const f of g)if(!r[f]){const d=e(f);i+d+s*2>o&&(i=0,a++),r[f]={x:i+s,y:n+a*c+s,width:d,height:c,layoutWidth:d,layoutHeight:t},i+=d+s*2}return{mapping:r,xOffset:i,yOffset:n+a*c,canvasHeight:ye(n+(a+1)*c)}}function X(g,e,t,s){let o=0;for(let r=e;r<t;r++){const l=g[r];o+=s[l]?.layoutWidth||0}return o}function Z(g,e,t,s,o,r){let l=e,n=0;for(let a=e;a<t;a++){const i=X(g,a,a+1,o);n+i>s&&(l<a&&r.push(a),l=a,n=0),n+=i}return n}function ve(g,e,t,s,o,r){let l=e,n=e,a=e,i=0;for(let c=e;c<t;c++)if((g[c]===" "||g[c+1]===" "||c+1===t)&&(a=c+1),a>n){let f=X(g,n,a,o);i+f>s&&(l<n&&(r.push(n),l=n,i=0),f>s&&(f=Z(g,n,a,s,o,r),l=r[r.length-1])),n=a,i+=f}return i}function _e(g,e,t,s,o=0,r){r===void 0&&(r=g.length);const l=[];return e==="break-all"?Z(g,o,r,t,s,l):ve(g,o,r,t,s,l),l}function be(g,e,t,s,o,r){let l=0,n=0;for(let a=e;a<t;a++){const i=g[a],c=s[i];c?(n||(n=c.layoutHeight),o[a]=l+c.layoutWidth/2,l+=c.layoutWidth):(O.warn(`Missing character: ${i} (${i.codePointAt(0)})`)(),o[a]=l,l+=xe)}r[0]=l,r[1]=n}function Pe(g,e,t,s,o){const r=Array.from(g),l=r.length,n=new Array(l),a=new Array(l),i=new Array(l),c=(t==="break-word"||t==="break-all")&&isFinite(s)&&s>0,f=[0,0],d=[0,0];let u=0,p=0,m=0;for(let h=0;h<=l;h++){const x=r[h];if((x===`
`||h===l)&&(m=h),m>p){const b=c?_e(r,t,s,o,p,m):me;for(let _=0;_<=b.length;_++){const S=_===0?p:b[_-1],C=_<b.length?b[_]:m;be(r,S,C,o,n,d);for(let y=S;y<C;y++){const z=r[y],L=o[z]?.layoutOffsetY||0;a[y]=u+d[1]/2+L,i[y]=d[0]}u=u+d[1]*e,f[0]=Math.max(f[0],d[0])}p=m}x===`
`&&(n[p]=0,a[p]=0,i[p]=0,p++)}return f[1]=u,{x:n,y:a,rowWidth:i,size:f}}function Ae({value:g,length:e,stride:t,offset:s,startIndices:o,characterSet:r}){const l=g.BYTES_PER_ELEMENT,n=t?t/l:1,a=s?s/l:0,i=o[e]||Math.ceil((g.length-a)/n),c=r&&new Set,f=new Array(e);let d=g;if(n>1||a>0){const u=g.constructor;d=new u(i);for(let p=0;p<i;p++)d[p]=g[p*n+a]}for(let u=0;u<e;u++){const p=o[u],m=o[u+1]||i,h=d.subarray(p,m);f[u]=String.fromCodePoint.apply(null,h),c&&h.forEach(c.add,c)}if(c)for(const u of c)r.add(String.fromCodePoint(u));return{texts:f,characterCount:i}}class J{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function Se(){const g=[];for(let e=32;e<128;e++)g.push(String.fromCharCode(e));return g}const B={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:Se(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},U=1024,G=.9,q=1.2,Q=3;let w=new J(Q);function Le(g,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const s=w.get(g);if(!s)return t;for(const o in s.mapping)t.has(o)&&t.delete(o);return t}function ze(g,e){for(let t=0;t<g.length;t++)e.data[4*t+3]=g[t]}function j(g,e,t,s){g.font=`${s} ${t}px ${e}`,g.fillStyle="#000",g.textBaseline="alphabetic",g.textAlign="left"}function Be(g){O.assert(Number.isFinite(g)&&g>=Q,"Invalid cache limit"),w=new J(g)}class Te{constructor(){this.props={...B}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}get scale(){const{fontSize:e,buffer:t}=this.props;return(e*q+t*2)/e}setProps(e={}){Object.assign(this.props,e),this._key=this._getKey();const t=Le(this._key,this.props.characterSet),s=w.get(this._key);if(s&&t.size===0){this._atlas!==s&&(this._atlas=s);return}const o=this._generateFontAtlas(t,s);this._atlas=o,w.set(this._key,o)}_generateFontAtlas(e,t){const{fontFamily:s,fontWeight:o,fontSize:r,buffer:l,sdf:n,radius:a,cutoff:i}=this.props;let c=t&&t.data;c||(c=document.createElement("canvas"),c.width=U);const f=c.getContext("2d",{willReadFrequently:!0});j(f,s,r,o);const{mapping:d,canvasHeight:u,xOffset:p,yOffset:m}=Ce({getFontWidth:h=>f.measureText(h).width,fontHeight:r*q,buffer:l,characterSet:e,maxCanvasWidth:U,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffset:t.yOffset}});if(c.height!==u){const h=f.getImageData(0,0,c.width,c.height);c.height=u,f.putImageData(h,0,0)}if(j(f,s,r,o),n){const h=new pe({fontSize:r,buffer:l,radius:a,cutoff:i,fontFamily:s,fontWeight:`${o}`});for(const x of e){const{data:b,width:_,height:S,glyphTop:C}=h.draw(x);d[x].width=_,d[x].layoutOffsetY=r*G-C;const y=f.createImageData(_,S);ze(b,y),f.putImageData(y,d[x].x,d[x].y)}}else for(const h of e)f.fillText(h,d[h].x,d[h].y+l+r*G);return{xOffset:p,yOffset:m,mapping:d,data:c,width:c.width,height:c.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:s,buffer:o,sdf:r,radius:l,cutoff:n}=this.props;return r?`${e} ${t} ${s} ${o} ${l} ${n}`:`${e} ${t} ${s} ${o}`}}const K=`uniform textBackgroundUniforms {
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
`,Ie={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:g=>g.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class M extends ie{getShaders(){return super.getShaders({vs:Oe,fs:Ee,modules:[ne,ce,we]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);const{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{billboard:t,sizeScale:s,sizeUnits:o,sizeMinPixels:r,sizeMaxPixels:l,getLineWidth:n}=this.props;let{padding:a,borderRadius:i}=this.props;a.length<4&&(a=[a[0],a[1],a[0],a[1]]),Array.isArray(i)||(i=[i,i,i,i]);const c=this.state.model,f={billboard:t,stroked:!!n,borderRadius:i,padding:a,sizeUnits:ae[o],sizeScale:s,sizeMinPixels:r,sizeMaxPixels:l};c.shaderInputs.setProps({textBackground:f}),c.draw(this.context.renderPass)}_getModel(){const e=[0,0,1,0,0,1,1,1];return new re(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new ge({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}}M.defaultProps=Ie;M.layerName="TextBackgroundLayer";const V={start:1,middle:0,end:-1},Y={top:1,center:0,bottom:-1},I=[0,0,0,255],ke=1,Me={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:I},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:B.characterSet},fontFamily:B.fontFamily,fontWeight:B.fontWeight,lineHeight:ke,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:I},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},getText:{type:"accessor",value:g=>g.text},getPosition:{type:"accessor",value:g=>g.position},getColor:{type:"accessor",value:I},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class ee extends fe{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[s,o]}=this.transformParagraph(e,t);const{fontSize:r}=this.state.fontAtlasManager.props;s/=r,o/=r;const{getTextAnchor:l,getAlignmentBaseline:n}=this.props,a=V[typeof l=="function"?l(e,t):l],i=Y[typeof n=="function"?n(e,t):n];return[(a-1)*s/2,(i-1)*o/2,s,o]},this.getIconOffsets=(e,t)=>{const{getTextAnchor:s,getAlignmentBaseline:o}=this.props,{x:r,y:l,rowWidth:n,size:[a,i]}=this.transformParagraph(e,t),c=V[typeof s=="function"?s(e,t):s],f=Y[typeof o=="function"?o(e,t):o],d=r.length,u=new Array(d*2);let p=0;for(let m=0;m<d;m++){const h=(1-c)*(a-n[m])/2;u[p++]=(c-1)*a/2+h+r[m],u[p++]=(f-1)*i/2+l[m]}return u}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new Te},this.props.maxWidth>0&&O.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:s,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==s.lineHeight||t.wordBreak!==s.wordBreak||t.maxWidth!==s.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:s}=this.props,{fontAtlasManager:o,characterSet:r}=this.state,l={...e,characterSet:r,fontFamily:t,fontWeight:s};if(!o.mapping)return o.setProps(l),!0;for(const n in l)if(l[n]!==o.props[n])return o.setProps(l),!0;return!1}_updateText(){const{data:e,characterSet:t}=this.props,s=e.attributes?.getText;let{getText:o}=this.props,r=e.startIndices,l;const n=t==="auto"&&new Set;if(s&&r){const{texts:a,characterCount:i}=Ae({...ArrayBuffer.isView(s)?{value:s}:s,length:e.length,startIndices:r,characterSet:n});l=i,o=(c,{index:f})=>a[f]}else{const{iterable:a,objectInfo:i}=le(e);r=[0],l=0;for(const c of a){i.index++;const f=Array.from(o(c,i)||"");n&&f.forEach(n.add,n),l+=f.length,r.push(l)}}this.setState({getText:o,startIndices:r,numInstances:l,characterSet:n||t})}transformParagraph(e,t){const{fontAtlasManager:s}=this.state,o=s.mapping,r=this.state.getText,{wordBreak:l,lineHeight:n,maxWidth:a}=this.props,i=r(e,t)||"";return Pe(i,n,l,a*s.props.fontSize,o)}renderLayers(){const{startIndices:e,numInstances:t,getText:s,fontAtlasManager:{scale:o,atlas:r,mapping:l},styleVersion:n}=this.state,{data:a,_dataDiff:i,getPosition:c,getColor:f,getSize:d,getAngle:u,getPixelOffset:p,getBackgroundColor:m,getBorderColor:h,getBorderWidth:x,backgroundBorderRadius:b,backgroundPadding:_,background:S,billboard:C,fontSettings:y,outlineWidth:z,outlineColor:L,sizeScale:A,sizeUnits:F,sizeMinPixels:R,sizeMaxPixels:W,transitions:P,updateTriggers:v}=this.props,te=this.getSubLayerClass("characters",k),oe=this.getSubLayerClass("background",M);return[S&&new oe({getFillColor:m,getLineColor:h,getLineWidth:x,borderRadius:b,padding:_,getPosition:c,getSize:d,getAngle:u,getPixelOffset:p,billboard:C,sizeScale:A,sizeUnits:F,sizeMinPixels:R,sizeMaxPixels:W,transitions:P&&{getPosition:P.getPosition,getAngle:P.getAngle,getSize:P.getSize,getFillColor:P.getBackgroundColor,getLineColor:P.getBorderColor,getLineWidth:P.getBorderWidth,getPixelOffset:P.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:v.getPosition,getAngle:v.getAngle,getSize:v.getSize,getFillColor:v.getBackgroundColor,getLineColor:v.getBorderColor,getLineWidth:v.getBorderWidth,getPixelOffset:v.getPixelOffset,getBoundingRect:{getText:v.getText,getTextAnchor:v.getTextAnchor,getAlignmentBaseline:v.getAlignmentBaseline,styleVersion:n}}}),{data:a.attributes&&a.attributes.background?{length:a.length,attributes:a.attributes.background}:a,_dataDiff:i,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new te({sdf:y.sdf,smoothing:Number.isFinite(y.smoothing)?y.smoothing:B.smoothing,outlineWidth:z/(y.radius||B.radius),outlineColor:L,iconAtlas:r,iconMapping:l,getPosition:c,getColor:f,getSize:d,getAngle:u,getPixelOffset:p,billboard:C,sizeScale:A*o,sizeUnits:F,sizeMinPixels:R*o,sizeMaxPixels:W*o,transitions:P&&{getPosition:P.getPosition,getAngle:P.getAngle,getColor:P.getColor,getSize:P.getSize,getPixelOffset:P.getPixelOffset}},this.getSubLayerProps({id:"characters",updateTriggers:{all:v.getText,getPosition:v.getPosition,getAngle:v.getAngle,getColor:v.getColor,getSize:v.getSize,getPixelOffset:v.getPixelOffset,getIconOffsets:{getTextAnchor:v.getTextAnchor,getAlignmentBaseline:v.getAlignmentBaseline,styleVersion:n}}}),{data:a,_dataDiff:i,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:s})]}static set fontAtlasCacheLimit(e){Be(e)}}ee.defaultProps=Me;ee.layerName="TextLayer";export{ee as T};
