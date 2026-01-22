import{g as h,M as g,s as v}from"./matrix-Dv3v_1g4.js";import{H as f,I as M,T as x,o as y,d as C}from"./mapbox-overlay-C46bI65L.js";import{p as _}from"./picking-CN0D5Hbh.js";import{p as T}from"./phong-material-CVid1w7v.js";import{G as a}from"./geometry-xuRZU0MX.js";const c=`uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,P={name:"simpleMesh",vs:c,fs:c,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},S=`#version 300 es
#define SHADER_NAME simple-mesh-layer-vs
in vec3 positions;
in vec3 normals;
in vec3 colors;
in vec2 texCoords;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
out vec2 vTexCoord;
out vec3 cameraPosition;
out vec3 normals_commonspace;
out vec4 position_commonspace;
out vec4 vColor;
void main(void) {
geometry.worldPosition = instancePositions;
geometry.uv = texCoords;
geometry.pickingColor = instancePickingColors;
vTexCoord = texCoords;
cameraPosition = project.cameraPosition;
vColor = vec4(colors * instanceColors.rgb, instanceColors.a);
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 pos = (instanceModelMatrix * positions) * simpleMesh.sizeScale + instanceTranslation;
if (simpleMesh.composeModelMatrix) {
DECKGL_FILTER_SIZE(pos, geometry);
normals_commonspace = project_normal(instanceModelMatrix * normals);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), position_commonspace);
geometry.position = position_commonspace;
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, position_commonspace);
geometry.position = position_commonspace;
normals_commonspace = project_normal(instanceModelMatrix * normals);
}
geometry.normal = normals_commonspace;
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,L=`#version 300 es
#define SHADER_NAME simple-mesh-layer-fs
precision highp float;
uniform sampler2D sampler;
in vec2 vTexCoord;
in vec3 cameraPosition;
in vec3 normals_commonspace;
in vec4 position_commonspace;
in vec4 vColor;
out vec4 fragColor;
void main(void) {
geometry.uv = vTexCoord;
vec3 normal;
if (simpleMesh.flatShading) {
normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
} else {
normal = normals_commonspace;
}
vec4 color = simpleMesh.hasTexture ? texture(sampler, vTexCoord) : vColor;
DECKGL_FILTER_COLOR(color, geometry);
vec3 lightColor = lighting_getLightColor(color.rgb, cameraPosition, position_commonspace.xyz, normal);
fragColor = vec4(lightColor, color.a * layer.opacity);
}
`;function l(t){const e=t.positions||t.POSITION;C.assert(e,'no "postions" or "POSITION" attribute in mesh');const o=e.value.length/e.size;let s=t.COLOR_0||t.colors;s||(s={size:3,value:new Float32Array(o*3).fill(1)});let i=t.NORMAL||t.normals;i||(i={size:3,value:new Float32Array(o*3).fill(0)});let n=t.TEXCOORD_0||t.texCoords;return n||(n={size:2,value:new Float32Array(o*2).fill(0)}),{positions:e,colors:s,normals:i,texCoords:n}}function m(t){return t instanceof a?(t.attributes=l(t.attributes),t):t.attributes?new a({...t,topology:"triangle-list",attributes:l(t.attributes)}):new a({topology:"triangle-list",attributes:l(t)})}const I=[0,0,0,255],b={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:t=>t.position},getColor:{type:"accessor",value:I},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}};class p extends f{getShaders(){return super.getShaders({vs:S,fs:L,modules:[M,T,_,P]})}getBounds(){var s;if(this.props._instanced)return super.getBounds();let e=this.state.positionBounds;if(e)return e;const{mesh:o}=this.props;if(!o)return null;if(e=(s=o.header)==null?void 0:s.boundingBox,!e){const{attributes:i}=m(o);i.POSITION=i.POSITION||i.positions,e=h(i)}return this.state.positionBounds=e,e}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:g}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(e){var n;super.updateState(e);const{props:o,oldProps:s,changeFlags:i}=e;if(o.mesh!==s.mesh||i.extensionsChanged){if(this.state.positionBounds=null,(n=this.state.model)==null||n.destroy(),o.mesh){this.state.model=this.getModel(o.mesh);const r=o.mesh.attributes||o.mesh;this.setState({hasNormals:!!(r.NORMAL||r.normals)})}this.getAttributeManager().invalidateAll()}o.texture!==s.texture&&o.texture instanceof x&&this.setTexture(o.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(e){super.finalizeState(e),this.state.emptyTexture.delete()}draw({uniforms:e}){const{model:o}=this.state;if(!o)return;const{viewport:s,renderPass:i}=this.context,{sizeScale:n,coordinateSystem:r,_instanced:u}=this.props,d={sizeScale:n,composeModelMatrix:!u||v(s,r),flatShading:!this.state.hasNormals};o.shaderInputs.setProps({simpleMesh:d}),o.draw(i)}get isLoaded(){var e;return!!((e=this.state)!=null&&e.model&&super.isLoaded)}getModel(e){const o=new y(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:m(e),isInstanced:!0}),{texture:s}=this.props,{emptyTexture:i}=this.state,n={sampler:s||i,hasTexture:!!s};return o.shaderInputs.setProps({simpleMesh:n}),o}setTexture(e){const{emptyTexture:o,model:s}=this.state;if(s){const i={sampler:e||o,hasTexture:!!e};s.shaderInputs.setProps({simpleMesh:i})}}}p.defaultProps=b;p.layerName="SimpleMeshLayer";export{p as S};
