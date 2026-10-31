import{I as ie}from"./icon-layer-CgHHGKT6.js";import{a as I,L as ne,p as ae,U as re,e as le,c as ce}from"./mapbox-overlay-SHCiFDVh.js";import{p as ge}from"./picking-CN0D5Hbh.js";import{G as fe}from"./geometry-Mod_uJZu.js";import{C as de}from"./composite-layer-Cph5cNWR.js";const N=`uniform sdfUniforms {
  float gamma;
  bool enabled;
  float buffer;
  float outlineBuffer;
  vec4 outlineColor;
} sdf;
`,ue={name:"sdf",vs:N,fs:N,uniformTypes:{gamma:"f32",enabled:"f32",buffer:"f32",outlineBuffer:"f32",outlineColor:"vec4<f32>"}},he=`#version 300 es
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
`,k=192/256,G=[],pe={getIconOffsets:{type:"accessor",value:g=>g.offsets},alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]}};class R extends ie{getShaders(){const e=super.getShaders();return{...e,modules:[...e.modules,ue],fs:he}}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({instanceOffsets:{size:2,accessor:"getIconOffsets"},instancePickingColors:{type:"uint8",size:3,accessor:(t,{index:i,target:o})=>this.encodePickingColor(i,o)}})}updateState(e){super.updateState(e);const{props:t,oldProps:i}=e;let{outlineColor:o}=t;o!==i.outlineColor&&(o=o.map(a=>a/255),o[3]=Number.isFinite(o[3])?o[3]:1,this.setState({outlineColor:o})),!t.sdf&&t.outlineWidth&&I.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){const{sdf:t,smoothing:i,outlineWidth:o}=this.props,{outlineColor:a}=this.state,r=o?Math.max(i,k*(1-o)):-1,n=this.state.model,s={buffer:k,outlineBuffer:r,gamma:i,enabled:!!t,outlineColor:a};if(n.shaderInputs.setProps({sdf:s}),super.draw(e),t&&o){const{iconManager:c}=this.state;c.getTexture()&&(n.shaderInputs.setProps({sdf:{...s,outlineBuffer:k}}),n.draw(this.context.renderPass))}}getInstanceOffset(e){return e?Array.from(e).flatMap(t=>super.getInstanceOffset(t)):G}getInstanceColorMode(e){return 1}getInstanceIconFrame(e){return e?Array.from(e).flatMap(t=>super.getInstanceIconFrame(t)):G}}R.defaultProps=pe;R.layerName="MultiIconLayer";const M=1e20,W=new Float64Array(256);for(let g=0;g<256;g++){const e=.5-Math.pow(g/255,.45454545454545453);W[g]=e*Math.abs(e)}W[255]=-M;class me{constructor({fontSize:e=24,buffer:t=3,radius:i=8,cutoff:o=.25,fontFamily:a="sans-serif",fontWeight:r="normal",fontStyle:n="normal",lang:s=null}={}){t=this.buffer=Math.round(t),this.radius=i,this.cutoff=o,this.lang=s;const c=this.size=Math.ceil(e)+t*4,l=this._createCanvas(c),f=this.ctx=l.getContext("2d",{willReadFrequently:!0});f.font=`${n} ${r} ${e}px ${a}`,f.textBaseline="alphabetic",f.textAlign="left",f.fillStyle="black",s&&(f.lang=s);const u=(this.maxGlyphDim=c-t)+2*t;this.gridOuter=new Float64Array(u*u),this.gridInner=new Float64Array(u*u),this.f=new Float64Array(u),this.z=new Float64Array(u+1),this.v=new Uint16Array(u)}_createCanvas(e){if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(e,e);const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:i,actualBoundingBoxDescent:o,actualBoundingBoxLeft:a,actualBoundingBoxRight:r}=this.ctx.measureText(e),n=Math.ceil(i),s=Math.floor(-a),c=Math.max(0,Math.min(this.maxGlyphDim,Math.ceil(r)-s)),l=Math.max(0,Math.min(this.maxGlyphDim,n+Math.ceil(o))),f=c+2*this.buffer,d=l+2*this.buffer,u=f*d,h=new Uint8ClampedArray(u),x={data:h,width:f,height:d,glyphWidth:c,glyphHeight:l,glyphTop:n,glyphLeft:s,glyphAdvance:t};if(c===0||l===0)return x;const{ctx:p,buffer:m,gridInner:P,gridOuter:_}=this;p.clearRect(m,m,c,l),p.fillText(e,m-s,m+n);const S=p.getImageData(m,m,c,l);_.fill(M,0,u),P.fill(0,0,u);let A=3;for(let b=0;b<l;b++){let L=(b+m)*f+m;for(let z=0;z<c;z++,A+=4,L++){const O=S.data[A];if(O===0)continue;const v=W[O];_[L]=Math.max(0,v),P[L]=Math.max(0,-v)}}$(_,0,0,f,d,f,this.f,this.v,this.z,m);const y=Math.min(m,1);$(P,m-y,m-y,c+2*y,l+2*y,f,this.f,this.v,this.z);const w=255/this.radius,T=255*(1-this.cutoff);for(let b=0;b<u;b++){const L=Math.sqrt(_[b])-Math.sqrt(P[b]);h[b]=T-w*L}return x}}function $(g,e,t,i,o,a,r,n,s,c=0){for(let l=e+c;l<e+i-c;l++)H(g,t*a+l,a,o,r,n,s);for(let l=t;l<t+o;l++)H(g,l*a+e,1,i,r,n,s)}function H(g,e,t,i,o,a,r){a[0]=0,r[0]=-M,r[1]=M,o[0]=g[e];for(let n=1,s=0;n<i;n++){const c=o[n]=g[e+n*t],l=n*n;let f;do{const d=a[s];f=(c-o[d]+l-d*d)/(n-d)/2}while(f<=r[s]&&--s>-1);s++,a[s]=n,r[s]=f,r[s+1]=M}for(let n=0,s=0;n<i;n++){for(;r[s+1]<n;)s++;const c=a[s],l=n-c;g[e+n*t]=o[c]+l*l}}const xe=32,ye=[];function Ce(g){return Math.pow(2,Math.ceil(Math.log2(g)))}function ve({characterSet:g,getFontWidth:e,fontHeight:t,buffer:i,maxCanvasWidth:o,mapping:a={},xOffset:r=0,yOffset:n=0}){let s=0,c=r;const l=t+i*2;for(const f of g)if(!a[f]){const d=e(f);c+d+i*2>o&&(c=0,s++),a[f]={x:c+i,y:n+s*l+i,width:d,height:l,layoutWidth:d,layoutHeight:t},c+=d+i*2}return{mapping:a,xOffset:c,yOffset:n+s*l,canvasHeight:Ce(n+(s+1)*l)}}function Z(g,e,t,i){let o=0;for(let a=e;a<t;a++){const r=g[a];o+=i[r]?.layoutWidth||0}return o}function J(g,e,t,i,o,a){let r=e,n=0;for(let s=e;s<t;s++){const c=Z(g,s,s+1,o);n+c>i&&(r<s&&a.push(s),r=s,n=0),n+=c}return n}function _e(g,e,t,i,o,a){let r=e,n=e,s=e,c=0;for(let l=e;l<t;l++)if((g[l]===" "||g[l+1]===" "||l+1===t)&&(s=l+1),s>n){let f=Z(g,n,s,o);c+f>i&&(r<n&&(a.push(n),r=n,c=0),f>i&&(f=J(g,n,s,i,o,a),r=a[a.length-1])),n=s,c+=f}return c}function Pe(g,e,t,i,o=0,a){a===void 0&&(a=g.length);const r=[];return e==="break-all"?J(g,o,a,t,i,r):_e(g,o,a,t,i,r),r}function be(g,e,t,i,o,a){let r=0,n=0;for(let s=e;s<t;s++){const c=g[s],l=i[c];l?(n||(n=l.layoutHeight),o[s]=r+l.layoutWidth/2,r+=l.layoutWidth):(I.warn(`Missing character: ${c} (${c.codePointAt(0)})`)(),o[s]=r,r+=xe)}a[0]=r,a[1]=n}function Ae(g,e,t,i,o){const a=Array.from(g),r=a.length,n=new Array(r),s=new Array(r),c=new Array(r),l=(t==="break-word"||t==="break-all")&&isFinite(i)&&i>0,f=[0,0],d=[0,0];let u=0,h=0,x=0;for(let p=0;p<=r;p++){const m=a[p];if((m===`
`||p===r)&&(x=p),x>h){const P=l?Pe(a,t,i,o,h,x):ye;for(let _=0;_<=P.length;_++){const S=_===0?h:P[_-1],A=_<P.length?P[_]:x;be(a,S,A,o,n,d);for(let y=S;y<A;y++){const w=a[y],T=o[w]?.layoutOffsetY||0;s[y]=u+d[1]/2+T,c[y]=d[0]}u=u+d[1]*e,f[0]=Math.max(f[0],d[0])}h=x}m===`
`&&(n[h]=0,s[h]=0,c[h]=0,h++)}return f[1]=u,{x:n,y:s,rowWidth:c,size:f}}function Se({value:g,length:e,stride:t,offset:i,startIndices:o,characterSet:a}){const r=g.BYTES_PER_ELEMENT,n=t?t/r:1,s=i?i/r:0,c=o[e]||Math.ceil((g.length-s)/n),l=a&&new Set,f=new Array(e);let d=g;if(n>1||s>0){const u=g.constructor;d=new u(c);for(let h=0;h<c;h++)d[h]=g[h*n+s]}for(let u=0;u<e;u++){const h=o[u],x=o[u+1]||c,p=d.subarray(h,x);f[u]=String.fromCodePoint.apply(null,p),l&&p.forEach(l.add,l)}if(l)for(const u of l)a.add(String.fromCodePoint(u));return{texts:f,characterCount:c}}class Q{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function Le(){const g=[];for(let e=32;e<128;e++)g.push(String.fromCharCode(e));return g}const B={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:Le(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},U=1024,q=.9,j=1.2,ee=3;let E=new Q(ee);function Be(g,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const i=E.get(g);if(!i)return t;for(const o in i.mapping)t.has(o)&&t.delete(o);return t}function we(g,e){for(let t=0;t<g.length;t++)e.data[4*t+3]=g[t]}function K(g,e,t,i){g.font=`${i} ${t}px ${e}`,g.fillStyle="#000",g.textBaseline="alphabetic",g.textAlign="left"}function Te(g){I.assert(Number.isFinite(g)&&g>=ee,"Invalid cache limit"),E=new Q(g)}class ze{constructor(){this.props={...B}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}get scale(){const{fontSize:e,buffer:t}=this.props;return(e*j+t*2)/e}setProps(e={}){Object.assign(this.props,e),this._key=this._getKey();const t=Be(this._key,this.props.characterSet),i=E.get(this._key);if(i&&t.size===0){this._atlas!==i&&(this._atlas=i);return}const o=this._generateFontAtlas(t,i);this._atlas=o,E.set(this._key,o)}_generateFontAtlas(e,t){const{fontFamily:i,fontWeight:o,fontSize:a,buffer:r,sdf:n,radius:s,cutoff:c}=this.props;let l=t&&t.data;l||(l=document.createElement("canvas"),l.width=U);const f=l.getContext("2d",{willReadFrequently:!0});K(f,i,a,o);const{mapping:d,canvasHeight:u,xOffset:h,yOffset:x}=ve({getFontWidth:p=>f.measureText(p).width,fontHeight:a*j,buffer:r,characterSet:e,maxCanvasWidth:U,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffset:t.yOffset}});if(l.height!==u){const p=f.getImageData(0,0,l.width,l.height);l.height=u,f.putImageData(p,0,0)}if(K(f,i,a,o),n){const p=new me({fontSize:a,buffer:r,radius:s,cutoff:c,fontFamily:i,fontWeight:`${o}`});for(const m of e){const{data:P,width:_,height:S,glyphTop:A}=p.draw(m);d[m].width=_,d[m].layoutOffsetY=a*q-A;const y=f.createImageData(_,S);we(P,y),f.putImageData(y,d[m].x,d[m].y)}}else for(const p of e)f.fillText(p,d[p].x,d[p].y+r+a*q);return{xOffset:h,yOffset:x,mapping:d,data:l,width:l.width,height:l.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:i,buffer:o,sdf:a,radius:r,cutoff:n}=this.props;return a?`${e} ${t} ${i} ${o} ${r} ${n}`:`${e} ${t} ${i} ${o}`}}const V=`uniform textBackgroundUniforms {
  bool billboard;
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  vec4 borderRadius;
  vec4 padding;
  highp int sizeUnits;
  bool stroked;
} textBackground;
`,Oe={name:"textBackground",vs:V,fs:V,uniformTypes:{billboard:"f32",sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",borderRadius:"vec4<f32>",padding:"vec4<f32>",sizeUnits:"i32",stroked:"f32"}},Me=`#version 300 es
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
`,Ie={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:g=>g.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class D extends ne{getShaders(){return super.getShaders({vs:Me,fs:Ee,modules:[ae,ge,Oe]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);const{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{billboard:t,sizeScale:i,sizeUnits:o,sizeMinPixels:a,sizeMaxPixels:r,getLineWidth:n}=this.props;let{padding:s,borderRadius:c}=this.props;s.length<4&&(s=[s[0],s[1],s[0],s[1]]),Array.isArray(c)||(c=[c,c,c,c]);const l=this.state.model,f={billboard:t,stroked:!!n,borderRadius:c,padding:s,sizeUnits:re[o],sizeScale:i,sizeMinPixels:a,sizeMaxPixels:r};l.shaderInputs.setProps({textBackground:f}),l.draw(this.context.renderPass)}_getModel(){const e=[0,0,1,0,0,1,1,1];return new le(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new fe({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}}D.defaultProps=Ie;D.layerName="TextBackgroundLayer";const Y={start:1,middle:0,end:-1},X={top:1,center:0,bottom:-1},F=[0,0,0,255],ke=1,Fe={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:F},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:B.characterSet},fontFamily:B.fontFamily,fontWeight:B.fontWeight,lineHeight:ke,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:F},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},getText:{type:"accessor",value:g=>g.text},getPosition:{type:"accessor",value:g=>g.position},getColor:{type:"accessor",value:F},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class te extends de{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[i,o]}=this.transformParagraph(e,t);const{fontSize:a}=this.state.fontAtlasManager.props;i/=a,o/=a;const{getTextAnchor:r,getAlignmentBaseline:n}=this.props,s=Y[typeof r=="function"?r(e,t):r],c=X[typeof n=="function"?n(e,t):n];return[(s-1)*i/2,(c-1)*o/2,i,o]},this.getIconOffsets=(e,t)=>{const{getTextAnchor:i,getAlignmentBaseline:o}=this.props,{x:a,y:r,rowWidth:n,size:[s,c]}=this.transformParagraph(e,t),l=Y[typeof i=="function"?i(e,t):i],f=X[typeof o=="function"?o(e,t):o],d=a.length,u=new Array(d*2);let h=0;for(let x=0;x<d;x++){const p=(1-l)*(s-n[x])/2;u[h++]=(l-1)*s/2+p+a[x],u[h++]=(f-1)*c/2+r[x]}return u}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new ze},this.props.maxWidth>0&&I.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:i,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==i.lineHeight||t.wordBreak!==i.wordBreak||t.maxWidth!==i.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:i}=this.props,{fontAtlasManager:o,characterSet:a}=this.state,r={...e,characterSet:a,fontFamily:t,fontWeight:i};if(!o.mapping)return o.setProps(r),!0;for(const n in r)if(r[n]!==o.props[n])return o.setProps(r),!0;return!1}_updateText(){const{data:e,characterSet:t}=this.props,i=e.attributes?.getText;let{getText:o}=this.props,a=e.startIndices,r;const n=t==="auto"&&new Set;if(i&&a){const{texts:s,characterCount:c}=Se({...ArrayBuffer.isView(i)?{value:i}:i,length:e.length,startIndices:a,characterSet:n});r=c,o=(l,{index:f})=>s[f]}else{const{iterable:s,objectInfo:c}=ce(e);a=[0],r=0;for(const l of s){c.index++;const f=Array.from(o(l,c)||"");n&&f.forEach(n.add,n),r+=f.length,a.push(r)}}this.setState({getText:o,startIndices:a,numInstances:r,characterSet:n||t})}transformParagraph(e,t){const{fontAtlasManager:i}=this.state,o=i.mapping,a=this.state.getText,{wordBreak:r,lineHeight:n,maxWidth:s}=this.props,c=a(e,t)||"";return Ae(c,n,r,s*i.props.fontSize,o)}renderLayers(){const{startIndices:e,numInstances:t,getText:i,fontAtlasManager:{scale:o,atlas:a,mapping:r},styleVersion:n}=this.state,{data:s,_dataDiff:c,getPosition:l,getColor:f,getSize:d,getAngle:u,getPixelOffset:h,getBackgroundColor:x,getBorderColor:p,getBorderWidth:m,backgroundBorderRadius:P,backgroundPadding:_,background:S,billboard:A,fontSettings:y,outlineWidth:w,outlineColor:T,sizeScale:b,sizeUnits:L,sizeMinPixels:z,sizeMaxPixels:O,transitions:v,updateTriggers:C}=this.props,oe=this.getSubLayerClass("characters",R),se=this.getSubLayerClass("background",D);return[S&&new se({getFillColor:x,getLineColor:p,getLineWidth:m,borderRadius:P,padding:_,getPosition:l,getSize:d,getAngle:u,getPixelOffset:h,billboard:A,sizeScale:b,sizeUnits:L,sizeMinPixels:z,sizeMaxPixels:O,transitions:v&&{getPosition:v.getPosition,getAngle:v.getAngle,getSize:v.getSize,getFillColor:v.getBackgroundColor,getLineColor:v.getBorderColor,getLineWidth:v.getBorderWidth,getPixelOffset:v.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:C.getPosition,getAngle:C.getAngle,getSize:C.getSize,getFillColor:C.getBackgroundColor,getLineColor:C.getBorderColor,getLineWidth:C.getBorderWidth,getPixelOffset:C.getPixelOffset,getBoundingRect:{getText:C.getText,getTextAnchor:C.getTextAnchor,getAlignmentBaseline:C.getAlignmentBaseline,styleVersion:n}}}),{data:s.attributes&&s.attributes.background?{length:s.length,attributes:s.attributes.background}:s,_dataDiff:c,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new oe({sdf:y.sdf,smoothing:Number.isFinite(y.smoothing)?y.smoothing:B.smoothing,outlineWidth:w/(y.radius||B.radius),outlineColor:T,iconAtlas:a,iconMapping:r,getPosition:l,getColor:f,getSize:d,getAngle:u,getPixelOffset:h,billboard:A,sizeScale:b*o,sizeUnits:L,sizeMinPixels:z*o,sizeMaxPixels:O*o,transitions:v&&{getPosition:v.getPosition,getAngle:v.getAngle,getColor:v.getColor,getSize:v.getSize,getPixelOffset:v.getPixelOffset}},this.getSubLayerProps({id:"characters",updateTriggers:{all:C.getText,getPosition:C.getPosition,getAngle:C.getAngle,getColor:C.getColor,getSize:C.getSize,getPixelOffset:C.getPixelOffset,getIconOffsets:{getTextAnchor:C.getTextAnchor,getAlignmentBaseline:C.getAlignmentBaseline,styleVersion:n}}}),{data:s,_dataDiff:c,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:i})]}static set fontAtlasCacheLimit(e){Te(e)}}te.defaultProps=Fe;te.layerName="TextLayer";export{te as T};
