import{I as ie}from"./icon-layer-Ds4K3rfp.js";import{d as I,L as ne,p as ae,U as re,b as le,c as ce}from"./mapbox-overlay-CxTWue1x.js";import{p as ge}from"./picking-CN0D5Hbh.js";import{G as fe}from"./geometry-TT6-M3o5.js";import{C as de}from"./index-4rp0wRYr.js";const N=`uniform sdfUniforms {
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
`,k=192/256,$=[],pe={getIconOffsets:{type:"accessor",value:c=>c.offsets},alphaCutoff:.001,smoothing:.1,outlineWidth:0,outlineColor:{type:"color",value:[0,0,0,255]}};class R extends ie{getShaders(){const e=super.getShaders();return{...e,modules:[...e.modules,ue],fs:he}}initializeState(){super.initializeState(),this.getAttributeManager().addInstanced({instanceOffsets:{size:2,accessor:"getIconOffsets"},instancePickingColors:{type:"uint8",size:3,accessor:(t,{index:s,target:o})=>this.encodePickingColor(s,o)}})}updateState(e){super.updateState(e);const{props:t,oldProps:s}=e;let{outlineColor:o}=t;o!==s.outlineColor&&(o=o.map(r=>r/255),o[3]=Number.isFinite(o[3])?o[3]:1,this.setState({outlineColor:o})),!t.sdf&&t.outlineWidth&&I.warn(`${this.id}: fontSettings.sdf is required to render outline`)()}draw(e){const{sdf:t,smoothing:s,outlineWidth:o}=this.props,{outlineColor:r}=this.state,l=o?Math.max(s,k*(1-o)):-1,n=this.state.model,i={buffer:k,outlineBuffer:l,gamma:s,enabled:!!t,outlineColor:r};if(n.shaderInputs.setProps({sdf:i}),super.draw(e),t&&o){const{iconManager:a}=this.state;a.getTexture()&&(n.shaderInputs.setProps({sdf:{...i,outlineBuffer:k}}),n.draw(this.context.renderPass))}}getInstanceOffset(e){return e?Array.from(e).flatMap(t=>super.getInstanceOffset(t)):$}getInstanceColorMode(e){return 1}getInstanceIconFrame(e){return e?Array.from(e).flatMap(t=>super.getInstanceIconFrame(t)):$}}R.defaultProps=pe;R.layerName="MultiIconLayer";const M=1e20,W=new Float64Array(256);for(let c=0;c<256;c++){const e=.5-Math.pow(c/255,.45454545454545453);W[c]=e*Math.abs(e)}W[255]=-M;class xe{constructor({fontSize:e=24,buffer:t=3,radius:s=8,cutoff:o=.25,fontFamily:r="sans-serif",fontWeight:l="normal",fontStyle:n="normal",lang:i=null}={}){this.buffer=t,this.radius=s,this.cutoff=o,this.lang=i;const a=this.size=e+t*4,g=this._createCanvas(a),f=this.ctx=g.getContext("2d",{willReadFrequently:!0});f.font=`${n} ${l} ${e}px ${r}`,f.textBaseline="alphabetic",f.textAlign="left",f.fillStyle="black",this.gridOuter=new Float64Array(a*a),this.gridInner=new Float64Array(a*a),this.f=new Float64Array(a),this.z=new Float64Array(a+1),this.v=new Uint16Array(a)}_createCanvas(e){if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(e,e);const t=document.createElement("canvas");return t.width=t.height=e,t}draw(e){const{width:t,actualBoundingBoxAscent:s,actualBoundingBoxDescent:o,actualBoundingBoxLeft:r,actualBoundingBoxRight:l}=this.ctx.measureText(e),n=Math.ceil(s),i=Math.floor(r),a=Math.max(0,Math.min(this.size-this.buffer,Math.ceil(l)-i)),g=Math.max(0,Math.min(this.size-this.buffer,n+Math.ceil(o))),f=a+2*this.buffer,d=g+2*this.buffer,u=Math.max(f*d,0),p=new Uint8ClampedArray(u),m={data:p,width:f,height:d,glyphWidth:a,glyphHeight:g,glyphTop:n,glyphLeft:i,glyphAdvance:t};if(a===0||g===0)return m;const{ctx:h,buffer:x,gridInner:b,gridOuter:C}=this;this.lang&&(h.lang=this.lang),h.clearRect(x,x,a,g),h.fillText(e,x-i,x+n);const S=h.getImageData(x,x,a,g);C.fill(M,0,u),b.fill(0,0,u);let A=3;for(let P=0;P<g;P++){let L=(P+x)*f+x;for(let w=0;w<a;w++,A+=4,L++){const T=S.data[A];if(T===0)continue;const O=W[T];C[L]=Math.max(0,O),b[L]=Math.max(0,-O)}}H(C,0,0,f,d,f,this.f,this.v,this.z),H(b,x,x,a,g,f,this.f,this.v,this.z);const v=255/this.radius,z=255*(1-this.cutoff);for(let P=0;P<u;P++){const L=Math.sqrt(C[P])-Math.sqrt(b[P]);p[P]=Math.round(z-v*L)}return m}}function H(c,e,t,s,o,r,l,n,i){for(let a=e;a<e+s;a++)U(c,t*r+a,r,o,l,n,i);for(let a=t;a<t+o;a++)U(c,a*r+e,1,s,l,n,i)}function U(c,e,t,s,o,r,l){r[0]=0,l[0]=-M,l[1]=M,o[0]=c[e];for(let n=1,i=0,a=0;n<s;n++){o[n]=c[e+n*t];const g=n*n;do{const f=r[i];a=(o[n]-o[f]+g-f*f)/(n-f)/2}while(a<=l[i]&&--i>-1);i++,r[i]=n,l[i]=a,l[i+1]=M}for(let n=0,i=0;n<s;n++){for(;l[i+1]<n;)i++;const a=r[i],g=n-a;c[e+n*t]=o[a]+g*g}}const me=32,ye=[];function Ce(c){return Math.pow(2,Math.ceil(Math.log2(c)))}function ve({characterSet:c,getFontWidth:e,fontHeight:t,buffer:s,maxCanvasWidth:o,mapping:r={},xOffset:l=0,yOffset:n=0}){let i=0,a=l;const g=t+s*2;for(const f of c)if(!r[f]){const d=e(f);a+d+s*2>o&&(a=0,i++),r[f]={x:a+s,y:n+i*g+s,width:d,height:g,layoutWidth:d,layoutHeight:t},a+=d+s*2}return{mapping:r,xOffset:a,yOffset:n+i*g,canvasHeight:Ce(n+(i+1)*g)}}function Z(c,e,t,s){let o=0;for(let r=e;r<t;r++){const l=c[r];o+=s[l]?.layoutWidth||0}return o}function J(c,e,t,s,o,r){let l=e,n=0;for(let i=e;i<t;i++){const a=Z(c,i,i+1,o);n+a>s&&(l<i&&r.push(i),l=i,n=0),n+=a}return n}function _e(c,e,t,s,o,r){let l=e,n=e,i=e,a=0;for(let g=e;g<t;g++)if((c[g]===" "||c[g+1]===" "||g+1===t)&&(i=g+1),i>n){let f=Z(c,n,i,o);a+f>s&&(l<n&&(r.push(n),l=n,a=0),f>s&&(f=J(c,n,i,s,o,r),l=r[r.length-1])),n=i,a+=f}return a}function be(c,e,t,s,o=0,r){r===void 0&&(r=c.length);const l=[];return e==="break-all"?J(c,o,r,t,s,l):_e(c,o,r,t,s,l),l}function Pe(c,e,t,s,o,r){let l=0,n=0;for(let i=e;i<t;i++){const a=c[i],g=s[a];g?(n||(n=g.layoutHeight),o[i]=l+g.layoutWidth/2,l+=g.layoutWidth):(I.warn(`Missing character: ${a} (${a.codePointAt(0)})`)(),o[i]=l,l+=me)}r[0]=l,r[1]=n}function Ae(c,e,t,s,o){const r=Array.from(c),l=r.length,n=new Array(l),i=new Array(l),a=new Array(l),g=(t==="break-word"||t==="break-all")&&isFinite(s)&&s>0,f=[0,0],d=[0,0];let u=0,p=0,m=0;for(let h=0;h<=l;h++){const x=r[h];if((x===`
`||h===l)&&(m=h),m>p){const b=g?be(r,t,s,o,p,m):ye;for(let C=0;C<=b.length;C++){const S=C===0?p:b[C-1],A=C<b.length?b[C]:m;Pe(r,S,A,o,n,d);for(let v=S;v<A;v++){const z=r[v],P=o[z]?.layoutOffsetY||0;i[v]=u+d[1]/2+P,a[v]=d[0]}u=u+d[1]*e,f[0]=Math.max(f[0],d[0])}p=m}x===`
`&&(n[p]=0,i[p]=0,a[p]=0,p++)}return f[1]=u,{x:n,y:i,rowWidth:a,size:f}}function Se({value:c,length:e,stride:t,offset:s,startIndices:o,characterSet:r}){const l=c.BYTES_PER_ELEMENT,n=t?t/l:1,i=s?s/l:0,a=o[e]||Math.ceil((c.length-i)/n),g=r&&new Set,f=new Array(e);let d=c;if(n>1||i>0){const u=c.constructor;d=new u(a);for(let p=0;p<a;p++)d[p]=c[p*n+i]}for(let u=0;u<e;u++){const p=o[u],m=o[u+1]||a,h=d.subarray(p,m);f[u]=String.fromCodePoint.apply(null,h),g&&h.forEach(g.add,g)}if(g)for(const u of g)r.add(String.fromCodePoint(u));return{texts:f,characterCount:a}}class Q{constructor(e=5){this._cache={},this._order=[],this.limit=e}get(e){const t=this._cache[e];return t&&(this._deleteOrder(e),this._appendOrder(e)),t}set(e,t){this._cache[e]?(this.delete(e),this._cache[e]=t,this._appendOrder(e)):(Object.keys(this._cache).length===this.limit&&this.delete(this._order[0]),this._cache[e]=t,this._appendOrder(e))}delete(e){this._cache[e]&&(delete this._cache[e],this._deleteOrder(e))}_deleteOrder(e){const t=this._order.indexOf(e);t>=0&&this._order.splice(t,1)}_appendOrder(e){this._order.push(e)}}function Le(){const c=[];for(let e=32;e<128;e++)c.push(String.fromCharCode(e));return c}const B={fontFamily:"Monaco, monospace",fontWeight:"normal",characterSet:Le(),fontSize:64,buffer:4,sdf:!1,cutoff:.25,radius:12,smoothing:.1},G=1024,q=.9,j=1.2,ee=3;let E=new Q(ee);function Be(c,e){let t;typeof e=="string"?t=new Set(Array.from(e)):t=new Set(e);const s=E.get(c);if(!s)return t;for(const o in s.mapping)t.has(o)&&t.delete(o);return t}function ze(c,e){for(let t=0;t<c.length;t++)e.data[4*t+3]=c[t]}function K(c,e,t,s){c.font=`${s} ${t}px ${e}`,c.fillStyle="#000",c.textBaseline="alphabetic",c.textAlign="left"}function we(c){I.assert(Number.isFinite(c)&&c>=ee,"Invalid cache limit"),E=new Q(c)}class Te{constructor(){this.props={...B}}get atlas(){return this._atlas}get mapping(){return this._atlas&&this._atlas.mapping}get scale(){const{fontSize:e,buffer:t}=this.props;return(e*j+t*2)/e}setProps(e={}){Object.assign(this.props,e),this._key=this._getKey();const t=Be(this._key,this.props.characterSet),s=E.get(this._key);if(s&&t.size===0){this._atlas!==s&&(this._atlas=s);return}const o=this._generateFontAtlas(t,s);this._atlas=o,E.set(this._key,o)}_generateFontAtlas(e,t){const{fontFamily:s,fontWeight:o,fontSize:r,buffer:l,sdf:n,radius:i,cutoff:a}=this.props;let g=t&&t.data;g||(g=document.createElement("canvas"),g.width=G);const f=g.getContext("2d",{willReadFrequently:!0});K(f,s,r,o);const{mapping:d,canvasHeight:u,xOffset:p,yOffset:m}=ve({getFontWidth:h=>f.measureText(h).width,fontHeight:r*j,buffer:l,characterSet:e,maxCanvasWidth:G,...t&&{mapping:t.mapping,xOffset:t.xOffset,yOffset:t.yOffset}});if(g.height!==u){const h=f.getImageData(0,0,g.width,g.height);g.height=u,f.putImageData(h,0,0)}if(K(f,s,r,o),n){const h=new xe({fontSize:r,buffer:l,radius:i,cutoff:a,fontFamily:s,fontWeight:`${o}`});for(const x of e){const{data:b,width:C,height:S,glyphTop:A}=h.draw(x);d[x].width=C,d[x].layoutOffsetY=r*q-A;const v=f.createImageData(C,S);ze(b,v),f.putImageData(v,d[x].x,d[x].y)}}else for(const h of e)f.fillText(h,d[h].x,d[h].y+l+r*q);return{xOffset:p,yOffset:m,mapping:d,data:g,width:g.width,height:g.height}}_getKey(){const{fontFamily:e,fontWeight:t,fontSize:s,buffer:o,sdf:r,radius:l,cutoff:n}=this.props;return r?`${e} ${t} ${s} ${o} ${l} ${n}`:`${e} ${t} ${s} ${o}`}}const V=`uniform textBackgroundUniforms {
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
`,Ie={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,borderRadius:{type:"object",value:0},padding:{type:"array",value:[0,0,0,0]},getPosition:{type:"accessor",value:c=>c.position},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},getBoundingRect:{type:"accessor",value:[0,0,0,0]},getFillColor:{type:"accessor",value:[0,0,0,255]},getLineColor:{type:"accessor",value:[0,0,0,255]},getLineWidth:{type:"accessor",value:1}};class D extends ne{getShaders(){return super.getShaders({vs:Me,fs:Ee,modules:[ae,ge,Oe]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instanceRects:{size:4,accessor:"getBoundingRect"},instancePixelOffsets:{size:2,transition:!0,accessor:"getPixelOffset"},instanceFillColors:{size:4,transition:!0,type:"unorm8",accessor:"getFillColor",defaultValue:[0,0,0,255]},instanceLineColors:{size:4,transition:!0,type:"unorm8",accessor:"getLineColor",defaultValue:[0,0,0,255]},instanceLineWidths:{size:1,transition:!0,accessor:"getLineWidth",defaultValue:1}})}updateState(e){super.updateState(e);const{changeFlags:t}=e;t.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),this.getAttributeManager().invalidateAll())}draw({uniforms:e}){const{billboard:t,sizeScale:s,sizeUnits:o,sizeMinPixels:r,sizeMaxPixels:l,getLineWidth:n}=this.props;let{padding:i,borderRadius:a}=this.props;i.length<4&&(i=[i[0],i[1],i[0],i[1]]),Array.isArray(a)||(a=[a,a,a,a]);const g=this.state.model,f={billboard:t,stroked:!!n,borderRadius:a,padding:i,sizeUnits:re[o],sizeScale:s,sizeMinPixels:r,sizeMaxPixels:l};g.shaderInputs.setProps({textBackground:f}),g.draw(this.context.renderPass)}_getModel(){const e=[0,0,1,0,0,1,1,1];return new le(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new fe({topology:"triangle-strip",vertexCount:4,attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}}D.defaultProps=Ie;D.layerName="TextBackgroundLayer";const Y={start:1,middle:0,end:-1},X={top:1,center:0,bottom:-1},F=[0,0,0,255],ke=1,Fe={billboard:!0,sizeScale:1,sizeUnits:"pixels",sizeMinPixels:0,sizeMaxPixels:Number.MAX_SAFE_INTEGER,background:!1,getBackgroundColor:{type:"accessor",value:[255,255,255,255]},getBorderColor:{type:"accessor",value:F},getBorderWidth:{type:"accessor",value:0},backgroundBorderRadius:{type:"object",value:0},backgroundPadding:{type:"array",value:[0,0,0,0]},characterSet:{type:"object",value:B.characterSet},fontFamily:B.fontFamily,fontWeight:B.fontWeight,lineHeight:ke,outlineWidth:{type:"number",value:0,min:0},outlineColor:{type:"color",value:F},fontSettings:{type:"object",value:{},compare:1},wordBreak:"break-word",maxWidth:{type:"number",value:-1},getText:{type:"accessor",value:c=>c.text},getPosition:{type:"accessor",value:c=>c.position},getColor:{type:"accessor",value:F},getSize:{type:"accessor",value:32},getAngle:{type:"accessor",value:0},getTextAnchor:{type:"accessor",value:"middle"},getAlignmentBaseline:{type:"accessor",value:"center"},getPixelOffset:{type:"accessor",value:[0,0]},backgroundColor:{deprecatedFor:["background","getBackgroundColor"]}};class te extends de{constructor(){super(...arguments),this.getBoundingRect=(e,t)=>{let{size:[s,o]}=this.transformParagraph(e,t);const{fontSize:r}=this.state.fontAtlasManager.props;s/=r,o/=r;const{getTextAnchor:l,getAlignmentBaseline:n}=this.props,i=Y[typeof l=="function"?l(e,t):l],a=X[typeof n=="function"?n(e,t):n];return[(i-1)*s/2,(a-1)*o/2,s,o]},this.getIconOffsets=(e,t)=>{const{getTextAnchor:s,getAlignmentBaseline:o}=this.props,{x:r,y:l,rowWidth:n,size:[i,a]}=this.transformParagraph(e,t),g=Y[typeof s=="function"?s(e,t):s],f=X[typeof o=="function"?o(e,t):o],d=r.length,u=new Array(d*2);let p=0;for(let m=0;m<d;m++){const h=(1-g)*(i-n[m])/2;u[p++]=(g-1)*i/2+h+r[m],u[p++]=(f-1)*a/2+l[m]}return u}}initializeState(){this.state={styleVersion:0,fontAtlasManager:new Te},this.props.maxWidth>0&&I.once(1,"v8.9 breaking change: TextLayer maxWidth is now relative to text size")()}updateState(e){const{props:t,oldProps:s,changeFlags:o}=e;(o.dataChanged||o.updateTriggersChanged&&(o.updateTriggersChanged.all||o.updateTriggersChanged.getText))&&this._updateText(),(this._updateFontAtlas()||t.lineHeight!==s.lineHeight||t.wordBreak!==s.wordBreak||t.maxWidth!==s.maxWidth)&&this.setState({styleVersion:this.state.styleVersion+1})}getPickingInfo({info:e}){return e.object=e.index>=0?this.props.data[e.index]:null,e}_updateFontAtlas(){const{fontSettings:e,fontFamily:t,fontWeight:s}=this.props,{fontAtlasManager:o,characterSet:r}=this.state,l={...e,characterSet:r,fontFamily:t,fontWeight:s};if(!o.mapping)return o.setProps(l),!0;for(const n in l)if(l[n]!==o.props[n])return o.setProps(l),!0;return!1}_updateText(){const{data:e,characterSet:t}=this.props,s=e.attributes?.getText;let{getText:o}=this.props,r=e.startIndices,l;const n=t==="auto"&&new Set;if(s&&r){const{texts:i,characterCount:a}=Se({...ArrayBuffer.isView(s)?{value:s}:s,length:e.length,startIndices:r,characterSet:n});l=a,o=(g,{index:f})=>i[f]}else{const{iterable:i,objectInfo:a}=ce(e);r=[0],l=0;for(const g of i){a.index++;const f=Array.from(o(g,a)||"");n&&f.forEach(n.add,n),l+=f.length,r.push(l)}}this.setState({getText:o,startIndices:r,numInstances:l,characterSet:n||t})}transformParagraph(e,t){const{fontAtlasManager:s}=this.state,o=s.mapping,r=this.state.getText,{wordBreak:l,lineHeight:n,maxWidth:i}=this.props,a=r(e,t)||"";return Ae(a,n,l,i*s.props.fontSize,o)}renderLayers(){const{startIndices:e,numInstances:t,getText:s,fontAtlasManager:{scale:o,atlas:r,mapping:l},styleVersion:n}=this.state,{data:i,_dataDiff:a,getPosition:g,getColor:f,getSize:d,getAngle:u,getPixelOffset:p,getBackgroundColor:m,getBorderColor:h,getBorderWidth:x,backgroundBorderRadius:b,backgroundPadding:C,background:S,billboard:A,fontSettings:v,outlineWidth:z,outlineColor:P,sizeScale:L,sizeUnits:w,sizeMinPixels:T,sizeMaxPixels:O,transitions:_,updateTriggers:y}=this.props,oe=this.getSubLayerClass("characters",R),se=this.getSubLayerClass("background",D);return[S&&new se({getFillColor:m,getLineColor:h,getLineWidth:x,borderRadius:b,padding:C,getPosition:g,getSize:d,getAngle:u,getPixelOffset:p,billboard:A,sizeScale:L,sizeUnits:w,sizeMinPixels:T,sizeMaxPixels:O,transitions:_&&{getPosition:_.getPosition,getAngle:_.getAngle,getSize:_.getSize,getFillColor:_.getBackgroundColor,getLineColor:_.getBorderColor,getLineWidth:_.getBorderWidth,getPixelOffset:_.getPixelOffset}},this.getSubLayerProps({id:"background",updateTriggers:{getPosition:y.getPosition,getAngle:y.getAngle,getSize:y.getSize,getFillColor:y.getBackgroundColor,getLineColor:y.getBorderColor,getLineWidth:y.getBorderWidth,getPixelOffset:y.getPixelOffset,getBoundingRect:{getText:y.getText,getTextAnchor:y.getTextAnchor,getAlignmentBaseline:y.getAlignmentBaseline,styleVersion:n}}}),{data:i.attributes&&i.attributes.background?{length:i.length,attributes:i.attributes.background}:i,_dataDiff:a,autoHighlight:!1,getBoundingRect:this.getBoundingRect}),new oe({sdf:v.sdf,smoothing:Number.isFinite(v.smoothing)?v.smoothing:B.smoothing,outlineWidth:z/(v.radius||B.radius),outlineColor:P,iconAtlas:r,iconMapping:l,getPosition:g,getColor:f,getSize:d,getAngle:u,getPixelOffset:p,billboard:A,sizeScale:L*o,sizeUnits:w,sizeMinPixels:T*o,sizeMaxPixels:O*o,transitions:_&&{getPosition:_.getPosition,getAngle:_.getAngle,getColor:_.getColor,getSize:_.getSize,getPixelOffset:_.getPixelOffset}},this.getSubLayerProps({id:"characters",updateTriggers:{all:y.getText,getPosition:y.getPosition,getAngle:y.getAngle,getColor:y.getColor,getSize:y.getSize,getPixelOffset:y.getPixelOffset,getIconOffsets:{getTextAnchor:y.getTextAnchor,getAlignmentBaseline:y.getAlignmentBaseline,styleVersion:n}}}),{data:i,_dataDiff:a,startIndices:e,numInstances:t,getIconOffsets:this.getIconOffsets,getIcon:s})]}static set fontAtlasCacheLimit(e){we(e)}}te.defaultProps=Fe;te.layerName="TextLayer";export{te as T};
