import{A as C,N as P,H as z,I as T,U as b,o as L,d as E}from"./mapbox-overlay-CtMyNbGZ.js";import{p as w}from"./picking-CN0D5Hbh.js";import{G as S}from"./geometry-CwO1uo58.js";const m=`uniform iconUniforms {
  float sizeScale;
  vec2 iconsTextureDim;
  float sizeBasis;
  float sizeMinPixels;
  float sizeMaxPixels;
  bool billboard;
  highp int sizeUnits;
  float alphaCutoff;
} icon;
`,O={name:"icon",vs:m,fs:m,uniformTypes:{sizeScale:"f32",iconsTextureDim:"vec2<f32>",sizeBasis:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",billboard:"f32",sizeUnits:"i32",alphaCutoff:"f32"}},A=`#version 300 es
#define SHADER_NAME icon-layer-vertex-shader
in vec2 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceSizes;
in float instanceAngles;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec4 instanceIconFrames;
in float instanceColorModes;
in vec2 instanceOffsets;
in vec2 instancePixelOffset;
out float vColorMode;
out vec4 vColor;
out vec2 vTextureCoords;
out vec2 uv;
vec2 rotate_by_angle(vec2 vertex, float angle) {
float angle_radian = angle * PI / 180.0;
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
vec2 iconSize = instanceIconFrames.zw;
float sizePixels = clamp(
project_size_to_pixel(instanceSizes * icon.sizeScale, icon.sizeUnits),
icon.sizeMinPixels, icon.sizeMaxPixels
);
float iconConstraint = icon.sizeBasis == 0.0 ? iconSize.x : iconSize.y;
float instanceScale = iconConstraint == 0.0 ? 0.0 : sizePixels / iconConstraint;
vec2 pixelOffset = positions / 2.0 * iconSize + instanceOffsets;
pixelOffset = rotate_by_angle(pixelOffset, instanceAngles) * instanceScale;
pixelOffset += instancePixelOffset;
pixelOffset.y *= -1.0;
if (icon.billboard)  {
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
vTextureCoords = mix(
instanceIconFrames.xy,
instanceIconFrames.xy + iconSize,
(positions.xy + 1.0) / 2.0
) / icon.iconsTextureDim;
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
vColorMode = instanceColorModes;
}
`,F=`#version 300 es
#define SHADER_NAME icon-layer-fragment-shader
precision highp float;
uniform sampler2D iconsTexture;
in float vColorMode;
in vec4 vColor;
in vec2 vTextureCoords;
in vec2 uv;
out vec4 fragColor;
void main(void) {
geometry.uv = uv;
vec4 texColor = texture(iconsTexture, vTextureCoords);
vec3 color = mix(texColor.rgb, vColor.rgb, vColorMode);
float a = texColor.a * layer.opacity * vColor.a;
if (a < icon.alphaCutoff) {
discard;
}
fragColor = vec4(color, a);
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,U=1024,R=4,x=()=>{},v={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},G={x:0,y:0,width:0,height:0};function H(a){return Math.pow(2,Math.ceil(Math.log2(a)))}function k(a,e,i,t){const s=Math.min(i/e.width,t/e.height),n=Math.floor(e.width*s),o=Math.floor(e.height*s);return s===1?{image:e,width:n,height:o}:(a.canvas.height=o,a.canvas.width=n,a.clearRect(0,0,n,o),a.drawImage(e,0,0,e.width,e.height,0,0,n,o),{image:a.canvas,width:n,height:o})}function f(a){return a&&(a.id||a.url)}function D(a,e,i,t){const{width:s,height:n,device:o}=a,r=o.createTexture({format:"rgba8unorm",width:e,height:i,sampler:t,mipLevels:o.getMipLevelCount(e,i)}),c=o.createCommandEncoder();return c.copyTextureToTexture({sourceTexture:a,destinationTexture:r,width:s,height:n}),c.finish(),r.generateMipmapsWebGL(),a.destroy(),r}function y(a,e,i){for(let t=0;t<e.length;t++){const{icon:s,xOffset:n}=e[t],o=f(s);a[o]={...s,x:n,y:i}}}function N({icons:a,buffer:e,mapping:i={},xOffset:t=0,yOffset:s=0,rowHeight:n=0,canvasWidth:o}){let r=[];for(let c=0;c<a.length;c++){const l=a[c],u=f(l);if(!i[u]){const{height:g,width:h}=l;t+h+e>o&&(y(i,r,s),t=0,s=n+s+e,n=0,r=[]),r.push({icon:l,xOffset:t}),t=t+h+e,n=Math.max(n,g)}}return r.length>0&&y(i,r,s),{mapping:i,rowHeight:n,xOffset:t,yOffset:s,canvasWidth:o,canvasHeight:H(n+s+e)}}function j(a,e,i){if(!a||!e)return null;i=i||{};const t={},{iterable:s,objectInfo:n}=P(a);for(const o of s){n.index++;const r=e(o,n),c=f(r);if(!r)throw new Error("Icon is missing.");if(!r.url)throw new Error("Icon url is missing.");!t[c]&&(!i[c]||r.url!==i[c].url)&&(t[c]={...r,source:o,sourceIndex:n.index})}return t}class W{constructor(e,{onUpdate:i=x,onError:t=x}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=R,this._canvasWidth=U,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=i,this.onError=t}finalize(){var e;(e=this._texture)==null||e.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){const i=this._autoPacking?f(e):e;return this._mapping[i]||G}setProps({loadOptions:e,autoPacking:i,iconAtlas:t,iconMapping:s,textureParameters:n}){var o;e&&(this._loadOptions=e),i!==void 0&&(this._autoPacking=i),s&&(this._mapping=s),t&&((o=this._texture)==null||o.delete(),this._texture=null,this._externalTexture=t),n&&(this._samplerParameters=n)}get isLoaded(){return this._pendingCount===0}packIcons(e,i){var s;if(!this._autoPacking||typeof document>"u")return;const t=Object.values(j(e,i,this._mapping)||{});if(t.length>0){const{mapping:n,xOffset:o,yOffset:r,rowHeight:c,canvasHeight:l}=N({icons:t,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=c,this._mapping=n,this._xOffset=o,this._yOffset=r,this._canvasHeight=l,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||v,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=D(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||v)),this.onUpdate(),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(t),(s=this._texture)==null||s.generateMipmapsWebGL()}}_loadIcons(e){const i=this._canvas.getContext("2d",{willReadFrequently:!0});for(const t of e)this._pendingCount++,C(t.url,this._loadOptions).then(s=>{var d,_;const n=f(t),o=this._mapping[n],{x:r,y:c,width:l,height:u}=o,{image:g,width:h,height:p}=k(i,s,l,u);(d=this._texture)==null||d.copyExternalImage({image:g,x:r+(l-h)/2,y:c+(u-p)/2,width:h,height:p}),o.width=h,o.height=p,(_=this._texture)==null||_.generateMipmapsWebGL(),this.onUpdate()}).catch(s=>{this.onError({url:t.url,source:t.source,sourceIndex:t.sourceIndex,loadOptions:this._loadOptions,error:s})}).finally(()=>{this._pendingCount--})}}const M=[0,0,0,255],B={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:a=>a.position},getIcon:{type:"accessor",value:a=>a.icon},getColor:{type:"accessor",value:M},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class I extends z{getShaders(){return super.getShaders({vs:A,fs:F,modules:[T,w,O]})}initializeState(){this.state={iconManager:new W(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceOffsets:{size:2,accessor:"getIcon",transform:this.getInstanceOffset},instanceIconFrames:{size:4,accessor:"getIcon",transform:this.getInstanceIconFrame},instanceColorModes:{size:1,type:"uint8",accessor:"getIcon",transform:this.getInstanceColorMode},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:M},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset"}})}updateState(e){var p;super.updateState(e);const{props:i,oldProps:t,changeFlags:s}=e,n=this.getAttributeManager(),{iconAtlas:o,iconMapping:r,data:c,getIcon:l,textureParameters:u}=i,{iconManager:g}=this.state;if(typeof o=="string")return;const h=o||this.internalState.isAsyncPropLoading("iconAtlas");g.setProps({loadOptions:i.loadOptions,autoPacking:!h,iconAtlas:o,iconMapping:h?r:null,textureParameters:u}),h?t.iconMapping!==i.iconMapping&&n.invalidate("getIcon"):(s.dataChanged||s.updateTriggersChanged&&(s.updateTriggersChanged.all||s.updateTriggersChanged.getIcon))&&g.packIcons(c,l),s.extensionsChanged&&((p=this.state.model)==null||p.destroy(),this.state.model=this._getModel(),n.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){const{sizeScale:i,sizeBasis:t,sizeMinPixels:s,sizeMaxPixels:n,sizeUnits:o,billboard:r,alphaCutoff:c}=this.props,{iconManager:l}=this.state,u=l.getTexture();if(u){const g=this.state.model,h={iconsTexture:u,iconsTextureDim:[u.width,u.height],sizeUnits:b[o],sizeScale:i,sizeBasis:t==="height"?1:0,sizeMinPixels:s,sizeMaxPixels:n,billboard:r,alphaCutoff:c};g.shaderInputs.setProps({icon:h}),g.draw(this.context.renderPass)}}_getModel(){const e=[-1,-1,1,-1,-1,1,1,1];return new L(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new S({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}_onUpdate(){this.setNeedsRedraw()}_onError(e){var t;const i=(t=this.getCurrentLayer())==null?void 0:t.props.onIconError;i?i(e):E.error(e.error.message)()}getInstanceOffset(e){const{width:i,height:t,anchorX:s=i/2,anchorY:n=t/2}=this.state.iconManager.getIconMapping(e);return[i/2-s,t/2-n]}getInstanceColorMode(e){return this.state.iconManager.getIconMapping(e).mask?1:0}getInstanceIconFrame(e){const{x:i,y:t,width:s,height:n}=this.state.iconManager.getIconMapping(e);return[i,t,s,n]}}I.defaultProps=B;I.layerName="IconLayer";export{I};
