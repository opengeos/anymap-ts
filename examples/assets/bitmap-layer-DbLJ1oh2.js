import{l as g,L,p as P,e as A,C as y,g as b}from"./mapbox-overlay-BJyTL8Fv.js";import{p as S}from"./picking-CN0D5Hbh.js";const E=new Uint32Array([0,2,1,0,3,2]),I=new Float32Array([0,1,0,0,1,0,1,1]);function T(i,t){if(!t)return M(i);const e=Math.max(Math.abs(i[0][0]-i[3][0]),Math.abs(i[1][0]-i[2][0])),o=Math.max(Math.abs(i[1][1]-i[0][1]),Math.abs(i[2][1]-i[3][1])),a=Math.ceil(e/t)+1,r=Math.ceil(o/t)+1,s=(a-1)*(r-1)*6,n=new Uint32Array(s),l=new Float32Array(a*r*2),d=new Float64Array(a*r*3);let c=0,p=0;for(let u=0;u<a;u++){const f=u/(a-1);for(let m=0;m<r;m++){const h=m/(r-1),v=R(i,f,h);d[c*3+0]=v[0],d[c*3+1]=v[1],d[c*3+2]=v[2]||0,l[c*2+0]=f,l[c*2+1]=1-h,u>0&&m>0&&(n[p++]=c-r,n[p++]=c-r-1,n[p++]=c-1,n[p++]=c-r,n[p++]=c-1,n[p++]=c),c++}}return{vertexCount:s,positions:d,indices:n,texCoords:l}}function M(i){const t=new Float64Array(12);for(let e=0;e<i.length;e++)t[e*3+0]=i[e][0],t[e*3+1]=i[e][1],t[e*3+2]=i[e][2]||0;return{vertexCount:6,positions:t,indices:E,texCoords:I}}function R(i,t,e){return g(g(i[0],i[1],e),g(i[3],i[2],e),t)}const C=`uniform bitmapUniforms {
  vec4 bounds;
  float coordinateConversion;
  float desaturate;
  vec3 tintColor;
  vec4 transparentColor;
} bitmap;
`,k={name:"bitmap",vs:C,fs:C,uniformTypes:{bounds:"vec4<f32>",coordinateConversion:"f32",desaturate:"f32",tintColor:"vec3<f32>",transparentColor:"vec4<f32>"}},w=`#version 300 es
#define SHADER_NAME bitmap-layer-vertex-shader

in vec2 texCoords;
in vec3 positions;
in vec3 positions64Low;

out vec2 vTexCoord;
out vec2 vTexPos;

const vec3 pickingColor = vec3(1.0, 0.0, 0.0);

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv = texCoords;
  geometry.pickingColor = pickingColor;

  gl_Position = project_position_to_clipspace(positions, positions64Low, vec3(0.0), geometry.position);
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vTexCoord = texCoords;

  if (bitmap.coordinateConversion < -0.5) {
    vTexPos = geometry.position.xy + project.commonOrigin.xy;
  } else if (bitmap.coordinateConversion > 0.5) {
    vTexPos = geometry.worldPosition.xy;
  }

  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`,F=`
vec3 packUVsIntoRGB(vec2 uv) {
  // Extract the top 8 bits. We want values to be truncated down so we can add a fraction
  vec2 uv8bit = floor(uv * 256.);

  // Calculate the normalized remainders of u and v parts that do not fit into 8 bits
  // Scale and clamp to 0-1 range
  vec2 uvFraction = fract(uv * 256.);
  vec2 uvFraction4bit = floor(uvFraction * 16.);

  // Remainder can be encoded in blue channel, encode as 4 bits for pixel coordinates
  float fractions = uvFraction4bit.x + uvFraction4bit.y * 16.;

  return vec3(uv8bit, fractions) / 255.;
}
`,U=`#version 300 es
#define SHADER_NAME bitmap-layer-fragment-shader

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D bitmapTexture;

in vec2 vTexCoord;
in vec2 vTexPos;

out vec4 fragColor;

/* projection utils */
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / PI / 2.0;

// from degrees to Web Mercator
vec2 lnglat_to_mercator(vec2 lnglat) {
  float x = lnglat.x;
  float y = clamp(lnglat.y, -89.9, 89.9);
  return vec2(
    radians(x) + PI,
    PI + log(tan(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// from Web Mercator to degrees
vec2 mercator_to_lnglat(vec2 xy) {
  xy /= WORLD_SCALE;
  return degrees(vec2(
    xy.x - PI,
    atan(exp(xy.y - PI)) * 2.0 - PI * 0.5
  ));
}
/* End projection utils */

// apply desaturation
vec3 color_desaturate(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333;
  return mix(color, vec3(luminance), bitmap.desaturate);
}

// apply tint
vec3 color_tint(vec3 color) {
  return color * bitmap.tintColor;
}

// blend with background color
vec4 apply_opacity(vec3 color, float alpha) {
  if (bitmap.transparentColor.a == 0.0) {
    return vec4(color, alpha);
  }
  float blendedAlpha = alpha + bitmap.transparentColor.a * (1.0 - alpha);
  float highLightRatio = alpha / blendedAlpha;
  vec3 blendedRGB = mix(bitmap.transparentColor.rgb, color, highLightRatio);
  return vec4(blendedRGB, blendedAlpha);
}

vec2 getUV(vec2 pos) {
  return vec2(
    (pos.x - bitmap.bounds[0]) / (bitmap.bounds[2] - bitmap.bounds[0]),
    (pos.y - bitmap.bounds[3]) / (bitmap.bounds[1] - bitmap.bounds[3])
  );
}

${F}

void main(void) {
  vec2 uv = vTexCoord;
  if (bitmap.coordinateConversion < -0.5) {
    vec2 lnglat = mercator_to_lnglat(vTexPos);
    uv = getUV(lnglat);
  } else if (bitmap.coordinateConversion > 0.5) {
    vec2 commonPos = lnglat_to_mercator(vTexPos);
    uv = getUV(commonPos);
  }
  vec4 bitmapColor = texture(bitmapTexture, uv);

  fragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * layer.opacity);

  geometry.uv = uv;
  DECKGL_FILTER_COLOR(fragColor, geometry);

  if (bool(picking.isActive) && !bool(picking.isAttribute)) {
    // Since instance information is not used, we can use picking color for pixel index
    fragColor.rgb = packUVsIntoRGB(uv);
  }
}
`,D={image:{type:"image",value:null,async:!0},bounds:{type:"array",value:[1,0,0,1],compare:!0},_imageCoordinateSystem:y.DEFAULT,desaturate:{type:"number",min:0,max:1,value:0},transparentColor:{type:"color",value:[0,0,0,0]},tintColor:{type:"color",value:[255,255,255]},textureParameters:{type:"object",ignore:!0,value:null}};class _ extends L{getShaders(){return super.getShaders({vs:w,fs:U,modules:[P,S,k]})}initializeState(){const t=this.getAttributeManager();t.remove(["instancePickingColors"]);const e=!0;t.add({indices:{size:1,isIndexed:!0,update:o=>o.value=this.state.mesh.indices,noAlloc:e},positions:{size:3,type:"float64",fp64:this.use64bitPositions(),update:o=>o.value=this.state.mesh.positions,noAlloc:e},texCoords:{size:2,update:o=>o.value=this.state.mesh.texCoords,noAlloc:e}})}updateState({props:t,oldProps:e,changeFlags:o}){const a=this.getAttributeManager();if(o.extensionsChanged&&(this.state.model?.destroy(),this.state.model=this._getModel(),a.invalidateAll()),t.bounds!==e.bounds){const r=this.state.mesh,s=this._createMesh();this.state.model.setVertexCount(s.vertexCount);for(const n in s)r&&r[n]!==s[n]&&a.invalidate(n);this.setState({mesh:s,...this._getCoordinateUniforms()})}else t._imageCoordinateSystem!==e._imageCoordinateSystem&&this.setState(this._getCoordinateUniforms())}getPickingInfo(t){const{image:e}=this.props,o=t.info;if(!o.color||!e)return o.bitmap=null,o;const{width:a,height:r}=e;o.index=0;const s=O(o.color);return o.bitmap={size:{width:a,height:r},uv:s,pixel:[Math.floor(s[0]*a),Math.floor(s[1]*r)]},o}disablePickingIndex(){this.setState({disablePicking:!0})}restorePickingColors(){this.setState({disablePicking:!1})}_updateAutoHighlight(t){super._updateAutoHighlight({...t,color:this.encodePickingColor(0)})}_createMesh(){const{bounds:t}=this.props;let e=t;return x(t)&&(e=[[t[0],t[1]],[t[0],t[3]],[t[2],t[3]],[t[2],t[1]]]),T(e,this.context.viewport.resolution)}_getModel(){return new A(this.context.device,{...this.getShaders(),id:this.props.id,bufferLayout:this.getAttributeManager().getBufferLayouts(),topology:"triangle-list",isInstanced:!1})}draw(t){const{shaderModuleProps:e}=t,{model:o,coordinateConversion:a,bounds:r,disablePicking:s}=this.state,{image:n,desaturate:l,transparentColor:d,tintColor:c}=this.props;if(!(e.picking.isActive&&s)&&n&&o){const p={bitmapTexture:n,bounds:r,coordinateConversion:a,desaturate:l,tintColor:c.slice(0,3).map(u=>u/255),transparentColor:d.map(u=>u/255)};o.shaderInputs.setProps({bitmap:p}),o.draw(this.context.renderPass)}}_getCoordinateUniforms(){const{LNGLAT:t,CARTESIAN:e,DEFAULT:o}=y;let{_imageCoordinateSystem:a}=this.props;if(a!==o){const{bounds:r}=this.props;if(!x(r))throw new Error("_imageCoordinateSystem only supports rectangular bounds");const s=this.context.viewport.resolution?t:e;if(a=a===t?t:e,a===t&&s===e)return{coordinateConversion:-1,bounds:r};if(a===e&&s===t){const n=b([r[0],r[1]]),l=b([r[2],r[3]]);return{coordinateConversion:1,bounds:[n[0],n[1],l[0],l[1]]}}}return{coordinateConversion:0,bounds:[0,0,0,0]}}}_.layerName="BitmapLayer";_.defaultProps=D;function O(i){const[t,e,o]=i,a=(o&240)/256,r=(o&15)/16;return[(t+r)/256,(e+a)/256]}function x(i){return Number.isFinite(i[0])}export{_ as B};
