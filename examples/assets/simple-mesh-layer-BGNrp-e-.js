import{M as y,s as x}from"./matrix-Ba-izLHt.js";import{L as M,p as C,T as _,b as T,d as P}from"./mapbox-overlay-CxTWue1x.js";import{p as S}from"./picking-CN0D5Hbh.js";import{p as I}from"./phong-material-B-yZMgo2.js";import{G as d}from"./geometry-TT6-M3o5.js";const g=`uniform simpleMeshUniforms {
  float sizeScale;
  bool composeModelMatrix;
  bool hasTexture;
  bool flatShading;
} simpleMesh;
`,L={name:"simpleMesh",vs:g,fs:g,uniformTypes:{sizeScale:"f32",composeModelMatrix:"f32",hasTexture:"f32",flatShading:"f32"}},O=`#version 300 es
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
`,b=`#version 300 es
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
`;function A(s){let o=1/0,e=1/0,t=1/0,i=-1/0,n=-1/0,a=-1/0;const r=s.POSITION?s.POSITION.value:[],u=r&&r.length;for(let l=0;l<u;l+=3){const c=r[l],m=r[l+1],p=r[l+2];o=c<o?c:o,e=m<e?m:e,t=p<t?p:t,i=c>i?c:i,n=m>n?m:n,a=p>a?p:a}return[[o,e,t],[i,n,a]]}function h(s){const o=s.positions||s.POSITION;P.assert(o,'no "postions" or "POSITION" attribute in mesh');const e=o.value.length/o.size;let t=s.COLOR_0||s.colors;t||(t={size:3,value:new Float32Array(e*3).fill(1)});let i=s.NORMAL||s.normals;i||(i={size:3,value:new Float32Array(e*3).fill(0)});let n=s.TEXCOORD_0||s.texCoords;return n||(n={size:2,value:new Float32Array(e*2).fill(0)}),{positions:o,colors:t,normals:i,texCoords:n}}function f(s){return s instanceof d?(s.attributes=h(s.attributes),s):s.attributes?new d({...s,topology:"triangle-list",attributes:h(s.attributes)}):new d({topology:"triangle-list",attributes:h(s)})}const z=[0,0,0,255],E={mesh:{type:"object",value:null,async:!0},texture:{type:"image",value:null,async:!0},sizeScale:{type:"number",value:1,min:0},_instanced:!0,wireframe:!1,material:!0,getPosition:{type:"accessor",value:s=>s.position},getColor:{type:"accessor",value:z},getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},textureParameters:{type:"object",ignore:!0,value:null}};class v extends M{getShaders(){return super.getShaders({vs:O,fs:b,modules:[C,I,S,L]})}getBounds(){if(this.props._instanced)return super.getBounds();let o=this.state.positionBounds;if(o)return o;const{mesh:e}=this.props;if(!e)return null;if(o=e.header?.boundingBox,!o){const{attributes:t}=f(e);t.POSITION=t.POSITION||t.positions,o=A(t)}return this.state.positionBounds=o,o}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{transition:!0,type:"float64",fp64:this.use64bitPositions(),size:3,accessor:"getPosition"},instanceColors:{type:"unorm8",transition:!0,size:this.props.colorFormat.length,accessor:"getColor",defaultValue:[0,0,0,255]},instanceModelMatrix:y}),this.setState({emptyTexture:this.context.device.createTexture({data:new Uint8Array(4),width:1,height:1})})}updateState(o){super.updateState(o);const{props:e,oldProps:t,changeFlags:i}=o;if(e.mesh!==t.mesh||i.extensionsChanged){if(this.state.positionBounds=null,this.state.model?.destroy(),e.mesh){this.state.model=this.getModel(e.mesh);const n=e.mesh.attributes||e.mesh;this.setState({hasNormals:!!(n.NORMAL||n.normals)})}this.getAttributeManager().invalidateAll()}e.texture!==t.texture&&e.texture instanceof _&&this.setTexture(e.texture),this.state.model&&this.state.model.setTopology(this.props.wireframe?"line-strip":"triangle-list")}finalizeState(o){super.finalizeState(o),this.state.emptyTexture.delete()}draw({uniforms:o}){const{model:e}=this.state;if(!e)return;const{viewport:t,renderPass:i}=this.context,{sizeScale:n,coordinateSystem:a,_instanced:r}=this.props,u={sizeScale:n,composeModelMatrix:!r||x(t,a),flatShading:!this.state.hasNormals};e.shaderInputs.setProps({simpleMesh:u}),e.draw(i)}get isLoaded(){return!!(this.state?.model&&super.isLoaded)}getModel(o){const e=new T(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),geometry:f(o),isInstanced:!0}),{texture:t}=this.props,{emptyTexture:i}=this.state,n={sampler:t||i,hasTexture:!!t};return e.shaderInputs.setProps({simpleMesh:n}),e}setTexture(o){const{emptyTexture:e,model:t}=this.state;if(t){const i={sampler:o||e,hasTexture:!!o};t.shaderInputs.setProps({simpleMesh:i})}}}v.defaultProps=E;v.layerName="SimpleMeshLayer";export{v as S};
