import{m as L,W as I}from"./polygon-utils-B8iYQ3Og.js";import{G as k}from"./geometry-CwO1uo58.js";import{d as E,H as A,I as b,o as C,U as M}from"./mapbox-overlay-CtMyNbGZ.js";import{p as F}from"./picking-CN0D5Hbh.js";import{p as O}from"./phong-material-BoTCu5o1.js";import{g as z}from"./gouraud-material-NoqXAwxE.js";class G extends k{constructor(i){const{indices:t,attributes:o}=R(i);super({...i,indices:t,attributes:o})}}function R(v){const{radius:i,height:t=1,nradial:o=10}=v;let{vertices:e}=v;e&&(E.assert(e.length>=o),e=e.flatMap(s=>[s[0],s[1]]),L(e,I.COUNTER_CLOCKWISE));const r=t>0,a=o+1,d=r?a*3+1:o,u=Math.PI*2/o,m=new Uint16Array(r?o*3*2:0),l=new Float32Array(d*3),y=new Float32Array(d*3);let n=0;if(r){for(let s=0;s<a;s++){const c=s*u,g=s%o,f=Math.sin(c),p=Math.cos(c);for(let h=0;h<2;h++)l[n+0]=e?e[g*2]:p*i,l[n+1]=e?e[g*2+1]:f*i,l[n+2]=(1/2-h)*t,y[n+0]=e?e[g*2]:p,y[n+1]=e?e[g*2+1]:f,n+=3}l[n+0]=l[n-3],l[n+1]=l[n-2],l[n+2]=l[n-1],n+=3}for(let s=r?0:1;s<a;s++){const c=Math.floor(s/2)*Math.sign(.5-s%2),g=c*u,f=(c+o)%o,p=Math.sin(g),h=Math.cos(g);l[n+0]=e?e[f*2]:h*i,l[n+1]=e?e[f*2+1]:p*i,l[n+2]=t/2,y[n+2]=1,n+=3}if(r){let s=0;for(let c=0;c<o;c++)m[s++]=c*2+0,m[s++]=c*2+2,m[s++]=c*2+0,m[s++]=c*2+1,m[s++]=c*2+1,m[s++]=c*2+3}return{indices:m,attributes:{POSITION:{size:3,value:l},NORMAL:{size:3,value:y}}}}const S=`uniform columnUniforms {
  float radius;
  float angle;
  vec2 offset;
  bool extruded;
  bool stroked;
  bool isStroke;
  float coverage;
  float elevationScale;
  float edgeDistance;
  float widthScale;
  float widthMinPixels;
  float widthMaxPixels;
  highp int radiusUnits;
  highp int widthUnits;
} column;
`,T={name:"column",vs:S,fs:S,uniformTypes:{radius:"f32",angle:"f32",offset:"vec2<f32>",extruded:"f32",stroked:"f32",isStroke:"f32",coverage:"f32",elevationScale:"f32",edgeDistance:"f32",widthScale:"f32",widthMinPixels:"f32",widthMaxPixels:"f32",radiusUnits:"i32",widthUnits:"i32"}},D=`#version 300 es
#define SHADER_NAME column-layer-vertex-shader
in vec3 positions;
in vec3 normals;
in vec3 instancePositions;
in float instanceElevations;
in vec3 instancePositions64Low;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in float instanceStrokeWidths;
in vec3 instancePickingColors;
out vec4 vColor;
#ifdef FLAT_SHADING
out vec3 cameraPosition;
out vec4 position_commonspace;
#endif
void main(void) {
geometry.worldPosition = instancePositions;
vec4 color = column.isStroke ? instanceLineColors : instanceFillColors;
mat2 rotationMatrix = mat2(cos(column.angle), sin(column.angle), -sin(column.angle), cos(column.angle));
float elevation = 0.0;
float strokeOffsetRatio = 1.0;
if (column.extruded) {
elevation = instanceElevations * (positions.z + 1.0) / 2.0 * column.elevationScale;
} else if (column.stroked) {
float widthPixels = clamp(
project_size_to_pixel(instanceStrokeWidths * column.widthScale, column.widthUnits),
column.widthMinPixels, column.widthMaxPixels) / 2.0;
float halfOffset = project_pixel_size(widthPixels) / project_size(column.edgeDistance * column.coverage * column.radius);
if (column.isStroke) {
strokeOffsetRatio -= sign(positions.z) * halfOffset;
} else {
strokeOffsetRatio -= halfOffset;
}
}
float shouldRender = float(color.a > 0.0 && instanceElevations >= 0.0);
float dotRadius = column.radius * column.coverage * shouldRender;
geometry.pickingColor = instancePickingColors;
vec3 centroidPosition = vec3(instancePositions.xy, instancePositions.z + elevation);
vec3 centroidPosition64Low = instancePositions64Low;
vec2 offset = (rotationMatrix * positions.xy * strokeOffsetRatio + column.offset) * dotRadius;
if (column.radiusUnits == UNIT_METERS) {
offset = project_size(offset);
}
vec3 pos = vec3(offset, 0.);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(centroidPosition, centroidPosition64Low, pos, geometry.position);
geometry.normal = project_normal(vec3(rotationMatrix * normals.xy, normals.z));
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
if (column.extruded && !column.isStroke) {
#ifdef FLAT_SHADING
cameraPosition = project.cameraPosition;
position_commonspace = geometry.position;
vColor = vec4(color.rgb, color.a * layer.opacity);
#else
vec3 lightColor = lighting_getLightColor(color.rgb, project.cameraPosition, geometry.position.xyz, geometry.normal);
vColor = vec4(lightColor, color.a * layer.opacity);
#endif
} else {
vColor = vec4(color.rgb, color.a * layer.opacity);
}
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,N=`#version 300 es
#define SHADER_NAME column-layer-fragment-shader
precision highp float;
out vec4 fragColor;
in vec4 vColor;
#ifdef FLAT_SHADING
in vec3 cameraPosition;
in vec4 position_commonspace;
#endif
void main(void) {
fragColor = vColor;
geometry.uv = vec2(0.);
#ifdef FLAT_SHADING
if (column.extruded && !column.isStroke && !bool(picking.isActive)) {
vec3 normal = normalize(cross(dFdx(position_commonspace.xyz), dFdy(position_commonspace.xyz)));
fragColor.rgb = lighting_getLightColor(vColor.rgb, cameraPosition, position_commonspace.xyz, normal);
}
#endif
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,x=[0,0,0,255],U={diskResolution:{type:"number",min:4,value:20},vertices:null,radius:{type:"number",min:0,value:1e3},angle:{type:"number",value:0},offset:{type:"array",value:[0,0]},coverage:{type:"number",min:0,max:1,value:1},elevationScale:{type:"number",min:0,value:1},radiusUnits:"meters",lineWidthUnits:"meters",lineWidthScale:1,lineWidthMinPixels:0,lineWidthMaxPixels:Number.MAX_SAFE_INTEGER,extruded:!0,wireframe:!1,filled:!0,stroked:!1,flatShading:!1,getPosition:{type:"accessor",value:v=>v.position},getFillColor:{type:"accessor",value:x},getLineColor:{type:"accessor",value:x},getLineWidth:{type:"accessor",value:1},getElevation:{type:"accessor",value:1e3},material:!0,getColor:{deprecatedFor:["getFillColor","getLineColor"]}};class _ extends A{getShaders(){const i={},{flatShading:t}=this.props;return t&&(i.FLAT_SHADING=1),super.getShaders({vs:D,fs:N,defines:i,modules:[b,t?O:z,F,T]})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),transition:!0,accessor:"getPosition"},instanceElevations:{size:1,transition:!0,accessor:"getElevation"},instanceFillColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getFillColor",defaultValue:x},instanceLineColors:{size:this.props.colorFormat.length,type:"unorm8",transition:!0,accessor:"getLineColor",defaultValue:x},instanceStrokeWidths:{size:1,accessor:"getLineWidth",transition:!0}})}updateState(i){var d;super.updateState(i);const{props:t,oldProps:o,changeFlags:e}=i,r=e.extensionsChanged||t.flatShading!==o.flatShading;r&&((d=this.state.models)==null||d.forEach(u=>u.destroy()),this.setState(this._getModels()),this.getAttributeManager().invalidateAll());const a=this.getNumInstances();this.state.fillModel.setInstanceCount(a),this.state.wireframeModel.setInstanceCount(a),(r||t.diskResolution!==o.diskResolution||t.vertices!==o.vertices||(t.extruded||t.stroked)!==(o.extruded||o.stroked))&&this._updateGeometry(t)}getGeometry(i,t,o){const e=new G({radius:1,height:o?2:0,vertices:t,nradial:i});let r=0;if(t)for(let a=0;a<i;a++){const d=t[a],u=Math.sqrt(d[0]*d[0]+d[1]*d[1]);r+=u/i}else r=1;return this.setState({edgeDistance:Math.cos(Math.PI/i)*r}),e}_getModels(){const i=this.getShaders(),t=this.getAttributeManager().getBufferLayouts(),o=new C(this.context.device,{...i,id:`${this.props.id}-fill`,bufferLayout:t,isInstanced:!0}),e=new C(this.context.device,{...i,id:`${this.props.id}-wireframe`,bufferLayout:t,isInstanced:!0});return{fillModel:o,wireframeModel:e,models:[e,o]}}_updateGeometry({diskResolution:i,vertices:t,extruded:o,stroked:e}){const r=this.getGeometry(i,t,o||e);this.setState({fillVertexCount:r.attributes.POSITION.value.length/3});const a=this.state.fillModel,d=this.state.wireframeModel;a.setGeometry(r),a.setTopology("triangle-strip"),a.setIndexBuffer(null),d.setGeometry(r),d.setTopology("line-list")}draw({uniforms:i}){const{lineWidthUnits:t,lineWidthScale:o,lineWidthMinPixels:e,lineWidthMaxPixels:r,radiusUnits:a,elevationScale:d,extruded:u,filled:m,stroked:l,wireframe:y,offset:n,coverage:s,radius:c,angle:g}=this.props,f=this.state.fillModel,p=this.state.wireframeModel,{fillVertexCount:h,edgeDistance:w}=this.state,P={radius:c,angle:g/180*Math.PI,offset:n,extruded:u,stroked:l,coverage:s,elevationScale:d,edgeDistance:w,radiusUnits:M[a],widthUnits:M[t],widthScale:o,widthMinPixels:e,widthMaxPixels:r};u&&y&&(p.shaderInputs.setProps({column:{...P,isStroke:!0}}),p.draw(this.context.renderPass)),m&&(f.setVertexCount(h),f.shaderInputs.setProps({column:{...P,isStroke:!1}}),f.draw(this.context.renderPass)),!u&&l&&(f.setVertexCount(h*2/3),f.shaderInputs.setProps({column:{...P,isStroke:!0}}),f.draw(this.context.renderPass))}}_.layerName="ColumnLayer";_.defaultProps=U;export{_ as C};
