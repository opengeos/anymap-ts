import{$ as s}from"./mapbox-overlay-CtMyNbGZ.js";const a=`precision highp int;

// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  vec3 color;
};

struct PointLight {
  vec3 color;
  vec3 position;
  vec3 attenuation; // 2nd order x:Constant-y:Linear-z:Exponential
};

struct DirectionalLight {
  vec3 color;
  vec3 direction;
};

uniform lightingUniforms {
  int enabled;
  int lightType;

  int directionalLightCount;
  int pointLightCount;

  vec3 ambientColor;

  vec3 lightColor0;
  vec3 lightPosition0;
  vec3 lightDirection0;
  vec3 lightAttenuation0;

  vec3 lightColor1;
  vec3 lightPosition1;
  vec3 lightDirection1;
  vec3 lightAttenuation1;

  vec3 lightColor2;
  vec3 lightPosition2;
  vec3 lightDirection2;
  vec3 lightAttenuation2;
} lighting;

PointLight lighting_getPointLight(int index) {
  switch (index) {
    case 0:
      return PointLight(lighting.lightColor0, lighting.lightPosition0, lighting.lightAttenuation0);
    case 1:
      return PointLight(lighting.lightColor1, lighting.lightPosition1, lighting.lightAttenuation1);
    case 2:
    default:  
      return PointLight(lighting.lightColor2, lighting.lightPosition2, lighting.lightAttenuation2);
  }
}

DirectionalLight lighting_getDirectionalLight(int index) {
  switch (index) {
    case 0:
      return DirectionalLight(lighting.lightColor0, lighting.lightDirection0);
    case 1:
      return DirectionalLight(lighting.lightColor1, lighting.lightDirection1);
    case 2:
    default:   
      return DirectionalLight(lighting.lightColor2, lighting.lightDirection2);
  }
} 

float getPointLightAttenuation(PointLight pointLight, float distance) {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}

// #endif
`,u=`// #if (defined(SHADER_TYPE_FRAGMENT) && defined(LIGHTING_FRAGMENT)) || (defined(SHADER_TYPE_VERTEX) && defined(LIGHTING_VERTEX))
struct AmbientLight {
  color: vec3<f32>,
};

struct PointLight {
  color: vec3<f32>,
  position: vec3<f32>,
  attenuation: vec3<f32>, // 2nd order x:Constant-y:Linear-z:Exponential
};

struct DirectionalLight {
  color: vec3<f32>,
  direction: vec3<f32>,
};

struct lightingUniforms {
  enabled: i32,
  pointLightCount: i32,
  directionalLightCount: i32,

  ambientColor: vec3<f32>,

  // TODO - support multiple lights by uncommenting arrays below
  lightType: i32,
  lightColor: vec3<f32>,
  lightDirection: vec3<f32>,
  lightPosition: vec3<f32>,
  lightAttenuation: vec3<f32>,

  // AmbientLight ambientLight;
  // PointLight pointLight[MAX_LIGHTS];
  // DirectionalLight directionalLight[MAX_LIGHTS];
};

// Binding 0:1 is reserved for lighting (Note: could go into separate bind group as it is stable across draw calls)
@binding(1) @group(0) var<uniform> lighting : lightingUniforms;

fn lighting_getPointLight(index: i32) -> PointLight {
  return PointLight(lighting.lightColor, lighting.lightPosition, lighting.lightAttenuation);
}

fn lighting_getDirectionalLight(index: i32) -> DirectionalLight {
  return DirectionalLight(lighting.lightColor, lighting.lightDirection);
} 

fn getPointLightAttenuation(pointLight: PointLight, distance: f32) -> f32 {
  return pointLight.attenuation.x
       + pointLight.attenuation.y * distance
       + pointLight.attenuation.z * distance * distance;
}
`,f=5,L=255;var h;(function(i){i[i.POINT=0]="POINT",i[i.DIRECTIONAL=1]="DIRECTIONAL"})(h||(h={}));const r={props:{},uniforms:{},name:"lighting",defines:{},uniformTypes:{enabled:"i32",lightType:"i32",directionalLightCount:"i32",pointLightCount:"i32",ambientColor:"vec3<f32>",lightColor0:"vec3<f32>",lightPosition0:"vec3<f32>",lightDirection0:"vec3<f32>",lightAttenuation0:"vec3<f32>",lightColor1:"vec3<f32>",lightPosition1:"vec3<f32>",lightDirection1:"vec3<f32>",lightAttenuation1:"vec3<f32>",lightColor2:"vec3<f32>",lightPosition2:"vec3<f32>",lightDirection2:"vec3<f32>",lightAttenuation2:"vec3<f32>"},defaultUniforms:{enabled:1,lightType:h.POINT,directionalLightCount:0,pointLightCount:0,ambientColor:[.1,.1,.1],lightColor0:[1,1,1],lightPosition0:[1,1,2],lightDirection0:[1,1,1],lightAttenuation0:[1,0,0],lightColor1:[1,1,1],lightPosition1:[1,1,2],lightDirection1:[1,1,1],lightAttenuation1:[1,0,0],lightColor2:[1,1,1],lightPosition2:[1,1,2],lightDirection2:[1,1,1],lightAttenuation2:[1,0,0]},source:u,vs:a,fs:a,getUniforms:d};function d(i,o={}){if(i=i&&{...i},!i)return{...r.defaultUniforms};i.lights&&(i={...i,...C(i.lights),lights:void 0});const{ambientLight:e,pointLights:t,directionalLights:n}=i||{};if(!(e||t&&t.length>0||n&&n.length>0))return{...r.defaultUniforms,enabled:0};const g={...r.defaultUniforms,...o,...v({ambientLight:e,pointLights:t,directionalLights:n})};return i.enabled!==void 0&&(g.enabled=i.enabled?1:0),g}function v({ambientLight:i,pointLights:o=[],directionalLights:e=[]}){const t={};t.ambientColor=c(i);let n=0;for(const l of o){t.lightType=h.POINT;const g=n;t[`lightColor${g}`]=c(l),t[`lightPosition${g}`]=l.position,t[`lightAttenuation${g}`]=l.attenuation||[1,0,0],n++}for(const l of e){t.lightType=h.DIRECTIONAL;const g=n;t[`lightColor${g}`]=c(l),t[`lightDirection${g}`]=l.direction,n++}return n>f&&s.warn("MAX_LIGHTS exceeded")(),t.directionalLightCount=e.length,t.pointLightCount=o.length,t}function C(i){var e,t;const o={pointLights:[],directionalLights:[]};for(const n of i||[])switch(n.type){case"ambient":o.ambientLight=n;break;case"directional":(e=o.directionalLights)==null||e.push(n);break;case"point":(t=o.pointLights)==null||t.push(n);break}return o}function c(i={}){const{color:o=[0,0,0],intensity:e=1}=i;return o.map(t=>t*e/L)}export{r as l};
