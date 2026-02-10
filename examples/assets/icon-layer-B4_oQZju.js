import{A as C,N as P,H as z,I as T,U as b,o as E,d as L}from"./mapbox-overlay-dETm6WBN.js";import{p as w}from"./picking-CN0D5Hbh.js";import{G as S}from"./geometry-C3q6ySK1.js";const m=`uniform iconUniforms {
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
`,U=1024,R=4,x=()=>{},v={minFilter:"linear",mipmapFilter:"linear",magFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"},G={x:0,y:0,width:0,height:0};function H(a){return Math.pow(2,Math.ceil(Math.log2(a)))}function N(a,e,t,i){const s=Math.min(t/e.width,i/e.height),n=Math.floor(e.width*s),o=Math.floor(e.height*s);return s===1?{image:e,width:n,height:o}:(a.canvas.height=o,a.canvas.width=n,a.clearRect(0,0,n,o),a.drawImage(e,0,0,e.width,e.height,0,0,n,o),{image:a.canvas,width:n,height:o})}function p(a){return a&&(a.id||a.url)}function k(a,e,t,i){const{width:s,height:n,device:o}=a,r=o.createTexture({format:"rgba8unorm",width:e,height:t,sampler:i,mipLevels:o.getMipLevelCount(e,t)}),c=o.createCommandEncoder();return c.copyTextureToTexture({sourceTexture:a,destinationTexture:r,width:s,height:n}),c.finish(),r.generateMipmapsWebGL(),a.destroy(),r}function y(a,e,t){for(let i=0;i<e.length;i++){const{icon:s,xOffset:n}=e[i],o=p(s);a[o]={...s,x:n,y:t}}}function D({icons:a,buffer:e,mapping:t={},xOffset:i=0,yOffset:s=0,rowHeight:n=0,canvasWidth:o}){let r=[];for(let c=0;c<a.length;c++){const g=a[c],h=p(g);if(!t[h]){const{height:u,width:l}=g;i+l+e>o&&(y(t,r,s),i=0,s=n+s+e,n=0,r=[]),r.push({icon:g,xOffset:i}),i=i+l+e,n=Math.max(n,u)}}return r.length>0&&y(t,r,s),{mapping:t,rowHeight:n,xOffset:i,yOffset:s,canvasWidth:o,canvasHeight:H(n+s+e)}}function j(a,e,t){if(!a||!e)return null;t=t||{};const i={},{iterable:s,objectInfo:n}=P(a);for(const o of s){n.index++;const r=e(o,n),c=p(r);if(!r)throw new Error("Icon is missing.");if(!r.url)throw new Error("Icon url is missing.");!i[c]&&(!t[c]||r.url!==t[c].url)&&(i[c]={...r,source:o,sourceIndex:n.index})}return i}class W{constructor(e,{onUpdate:t=x,onError:i=x}){this._loadOptions=null,this._texture=null,this._externalTexture=null,this._mapping={},this._samplerParameters=null,this._pendingCount=0,this._autoPacking=!1,this._xOffset=0,this._yOffset=0,this._rowHeight=0,this._buffer=R,this._canvasWidth=U,this._canvasHeight=0,this._canvas=null,this.device=e,this.onUpdate=t,this.onError=i}finalize(){this._texture?.delete()}getTexture(){return this._texture||this._externalTexture}getIconMapping(e){const t=this._autoPacking?p(e):e;return this._mapping[t]||G}setProps({loadOptions:e,autoPacking:t,iconAtlas:i,iconMapping:s,textureParameters:n}){e&&(this._loadOptions=e),t!==void 0&&(this._autoPacking=t),s&&(this._mapping=s),i&&(this._texture?.delete(),this._texture=null,this._externalTexture=i),n&&(this._samplerParameters=n)}get isLoaded(){return this._pendingCount===0}packIcons(e,t){if(!this._autoPacking||typeof document>"u")return;const i=Object.values(j(e,t,this._mapping)||{});if(i.length>0){const{mapping:s,xOffset:n,yOffset:o,rowHeight:r,canvasHeight:c}=D({icons:i,buffer:this._buffer,canvasWidth:this._canvasWidth,mapping:this._mapping,rowHeight:this._rowHeight,xOffset:this._xOffset,yOffset:this._yOffset});this._rowHeight=r,this._mapping=s,this._xOffset=n,this._yOffset=o,this._canvasHeight=c,this._texture||(this._texture=this.device.createTexture({format:"rgba8unorm",data:null,width:this._canvasWidth,height:this._canvasHeight,sampler:this._samplerParameters||v,mipLevels:this.device.getMipLevelCount(this._canvasWidth,this._canvasHeight)})),this._texture.height!==this._canvasHeight&&(this._texture=k(this._texture,this._canvasWidth,this._canvasHeight,this._samplerParameters||v)),this.onUpdate(!0),this._canvas=this._canvas||document.createElement("canvas"),this._loadIcons(i)}}_loadIcons(e){const t=this._canvas.getContext("2d",{willReadFrequently:!0});for(const i of e)this._pendingCount++,C(i.url,this._loadOptions).then(s=>{const n=p(i),o=this._mapping[n],{x:r,y:c,width:g,height:h}=o,{image:u,width:l,height:d}=N(t,s,g,h),f=r+(g-l)/2,_=c+(h-d)/2;this._texture?.copyExternalImage({image:u,x:f,y:_,width:l,height:d}),o.x=f,o.y=_,o.width=l,o.height=d,this._texture?.generateMipmapsWebGL(),this.onUpdate(l!==g||d!==h)}).catch(s=>{this.onError({url:i.url,source:i.source,sourceIndex:i.sourceIndex,loadOptions:this._loadOptions,error:s})}).finally(()=>{this._pendingCount--})}}const M=[0,0,0,255],B={iconAtlas:{type:"image",value:null,async:!0},iconMapping:{type:"object",value:{},async:!0},sizeScale:{type:"number",value:1,min:0},billboard:!0,sizeUnits:"pixels",sizeBasis:"height",sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},alphaCutoff:{type:"number",value:.05,min:0,max:1},getPosition:{type:"accessor",value:a=>a.position},getIcon:{type:"accessor",value:a=>a.icon},getColor:{type:"accessor",value:M},getSize:{type:"accessor",value:1},getAngle:{type:"accessor",value:0},getPixelOffset:{type:"accessor",value:[0,0]},onIconError:{type:"function",value:null,optional:!0},textureParameters:{type:"object",ignore:!0,value:null}};class I extends z{getShaders(){return super.getShaders({vs:A,fs:F,modules:[T,w,O]})}initializeState(){this.state={iconManager:new W(this.context.device,{onUpdate:this._onUpdate.bind(this),onError:this._onError.bind(this)})},this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceSizes:{size:1,transition:!0,accessor:"getSize",defaultValue:1},instanceOffsets:{size:2,accessor:"getIcon",transform:this.getInstanceOffset},instanceIconFrames:{size:4,accessor:"getIcon",transform:this.getInstanceIconFrame},instanceColorModes:{size:1,type:"uint8",accessor:"getIcon",transform:this.getInstanceColorMode},instanceColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getColor",defaultValue:M},instanceAngles:{size:1,transition:!0,accessor:"getAngle"},instancePixelOffset:{size:2,transition:!0,accessor:"getPixelOffset"}})}updateState(e){super.updateState(e);const{props:t,oldProps:i,changeFlags:s}=e,n=this.getAttributeManager(),{iconAtlas:o,iconMapping:r,data:c,getIcon:g,textureParameters:h}=t,{iconManager:u}=this.state;if(typeof o=="string")return;const l=o||this.internalState.isAsyncPropLoading("iconAtlas");u.setProps({loadOptions:t.loadOptions,autoPacking:!l,iconAtlas:o,iconMapping:l?r:null,textureParameters:h}),l?i.iconMapping!==t.iconMapping&&n.invalidate("getIcon"):(s.dataChanged||s.updateTriggersChanged&&(s.updateTriggersChanged.all||s.updateTriggersChanged.getIcon))&&u.packIcons(c,g),s.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),n.invalidateAll())}get isLoaded(){return super.isLoaded&&this.state.iconManager.isLoaded}finalizeState(e){super.finalizeState(e),this.state.iconManager.finalize()}draw({uniforms:e}){const{sizeScale:t,sizeBasis:i,sizeMinPixels:s,sizeMaxPixels:n,sizeUnits:o,billboard:r,alphaCutoff:c}=this.props,{iconManager:g}=this.state,h=g.getTexture();if(h){const u=this.state.model,l={iconsTexture:h,iconsTextureDim:[h.width,h.height],sizeUnits:b[o],sizeScale:t,sizeBasis:i==="height"?1:0,sizeMinPixels:s,sizeMaxPixels:n,billboard:r,alphaCutoff:c};u.shaderInputs.setProps({icon:l}),u.draw(this.context.renderPass)}}_getModel(){const e=[-1,-1,1,-1,-1,1,1,1];return new E(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:new S({topology:"triangle-strip",attributes:{positions:{size:2,value:new Float32Array(e)}}}),isInstanced:!0})}_onUpdate(e){e?(this.getAttributeManager()?.invalidate("getIcon"),this.setNeedsUpdate()):this.setNeedsRedraw()}_onError(e){const t=this.getCurrentLayer()?.props.onIconError;t?t(e):L.error(e.error.message)()}getInstanceOffset(e){const{width:t,height:i,anchorX:s=t/2,anchorY:n=i/2}=this.state.iconManager.getIconMapping(e);return[t/2-s,i/2-n]}getInstanceColorMode(e){return this.state.iconManager.getIconMapping(e).mask?1:0}getInstanceIconFrame(e){const{x:t,y:i,width:s,height:n}=this.state.iconManager.getIconMapping(e);return[t,i,s,n]}}I.defaultProps=B;I.layerName="IconLayer";export{I};
