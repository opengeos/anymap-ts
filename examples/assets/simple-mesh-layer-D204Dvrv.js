import{g as h,M as g,s as v}from"./matrix-9tpK3zBe.js";import{L as f,p as M,T as x,e as y,d as C}from"./mapbox-overlay-BJyTL8Fv.js";import{p as _}from"./picking-CN0D5Hbh.js";import{p as T}from"./phong-material-C1qbrL1g.js";import{G as r}from"./geometry-CoDDy0BW.js";const l=`uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,P={name:"simpleMesh",vs:l,fs:l,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},S=`#version 300 es
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
`;function a(t){const o=t.positions||t.POSITION;C.assert(o,'no "postions" or "POSITION" attribute in mesh');const e=o.value.length/o.size;let s=t.COLOR_0||t.colors;s||(s={size:3,value:new Float32Array(e*3).fill(1)});let i=t.NORMAL||t.normals;i||(i={size:3,value:new Float32Array(e*3).fill(0)});let n=t.TEXCOORD_0||t.texCoords;return n||(n={size:2,value:new Float32Array(e*2).fill(0)}),{positions:o,colors:s,normals:i,texCoords:n}}function c(t){return t instanceof r?(t.attributes=a(t.attributes),t):t.attributes?new r({...t,topology:"triangle-list",attributes:a(t.attributes)}):new r({topology:"triangle-list",attributes:a(t)})}const b=[0,0,0,255],I={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:t=>t.position},getColor:{type:"accessor",value:b},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}};class m extends f{getShaders(){return super.getShaders({vs:S,fs:L,modules:[M,T,_,P]})}getBounds(){if(this.props._instanced)return super.getBounds();let o=this.state.positionBounds;if(o)return o;const{mesh:e}=this.props;if(!e)return null;if(o=e.header?.boundingBox,!o){const{attributes:s}=c(e);s.POSITION=s.POSITION||s.positions,o=h(s)}return this.state.positionBounds=o,o}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:g}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(o){super.updateState(o);const{props:e,oldProps:s,changeFlags:i}=o;if(e.mesh!==s.mesh||i.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),e.mesh){this.state.model=this.getModel(e.mesh);const n=e.mesh.attributes||e.mesh;this.setState({hasNormals:!!(n.NORMAL||n.normals)})}this.getAttributeManager().invalidateAll()}e.texture!==s.texture&&e.texture instanceof x&&this.setTexture(e.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(o){super.finalizeState(o),this.state.emptyTexture.delete()}draw({uniforms:o}){const{model:e}=this.state;if(!e)return;const{viewport:s,renderPass:i}=this.context,{sizeScale:n,coordinateSystem:p,_instanced:u}=this.props,d={sizeScale:n,composeModelMatrix:!u||v(s,p),flatShading:!this.state.hasNormals};e.shaderInputs.setProps({simpleMesh:d}),e.draw(i)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(o){const e=new y(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:c(o),isInstanced:!0}),{texture:s}=this.props,{emptyTexture:i}=this.state,n={sampler:s||i,hasTexture:!!s};return e.shaderInputs.setProps({simpleMesh:n}),e}setTexture(o){const{emptyTexture:e,model:s}=this.state;if(s){const i={sampler:o||e,hasTexture:!!o};s.shaderInputs.setProps({simpleMesh:i})}}}m.defaultProps=I;m.layerName="SimpleMeshLayer";export{m as S};
