var mt=Object.defineProperty;var Ct=(r,e,t)=>e in r?mt(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var d=(r,e,t)=>Ct(r,typeof e!="symbol"?e+"":e,t);import{g as pt,M as ht,s as bt}from"./matrix-Dj0fRW-l.js";import{Q as K,R as gt,X as Et,Y as ge,y as N,Z as It,e as v,r as R,K as Ft,$ as O,o as Mt,a0 as Tt,a1 as _t,E as Qe,O as Rt,H as yt,I as Gt,d as re}from"./mapbox-overlay-CtMyNbGZ.js";import{p as Dt}from"./picking-CN0D5Hbh.js";import{l as St}from"./lighting-p30x1bFT.js";import{G as vt}from"./geometry-CwO1uo58.js";import{Q as Ot,M as Ee}from"./quaternion-BcOn_HKL.js";async function Ve(r,e,t,n){return n._parse(r,e,t,n)}function Lt(r){var e;globalThis.loaders||(globalThis.loaders={}),(e=globalThis.loaders).modules||(e.modules={}),Object.assign(globalThis.loaders.modules,r)}function xt(r){var t,n;return((n=(t=globalThis.loaders)==null?void 0:t.modules)==null?void 0:n[r])||null}const se={};async function y(r,e=null,t={},n=null){return e&&(r=Ht(r,e,t,n)),se[r]=se[r]||Pt(r),await se[r]}function Ht(r,e,t={},n=null){if(!t.useLocalLibraries&&r.startsWith("http"))return r;n=n||r;const s=t.modules||{};return s[n]?s[n]:K?t.CDN?(gt(t.CDN.startsWith("http")),`${t.CDN}/${e}@${Et}/dist/libs/${n}`):ge?`../src/libs/${n}`:`modules/${e}/src/libs/${n}`:`modules/${e}/dist/libs/${n}`}async function Pt(r){if(r.endsWith("wasm"))return await Jt(r);if(!K)try{const{requireFromFile:t}=globalThis.loaders||{};return await(t==null?void 0:t(r))}catch(t){return console.error(t),null}if(ge)return importScripts(r);const e=await Nt(r);return Ut(e,r)}function Ut(r,e){if(!K){const{requireFromString:n}=globalThis.loaders||{};return n==null?void 0:n(r,e)}if(ge)return eval.call(globalThis,r),null;const t=document.createElement("script");t.id=e;try{t.appendChild(document.createTextNode(r))}catch{t.text=r}return document.body.appendChild(t),null}async function Jt(r){const{readFileAsArrayBuffer:e}=globalThis.loaders||{};return K||!e||r.startsWith("http")?await(await fetch(r)).arrayBuffer():await e(r)}async function Nt(r){const{readFileAsText:e}=globalThis.loaders||{};return K||!e||r.startsWith("http")?await(await fetch(r)).text():await e(r)}function wt(r,e=5){return typeof r=="string"?r.slice(0,e):ArrayBuffer.isView(r)?ye(r.buffer,r.byteOffset,e):r instanceof ArrayBuffer?ye(r,0,e):""}function ye(r,e,t){if(r.byteLength<=e+t)return"";const n=new DataView(r);let s="";for(let o=0;o<t;o++)s+=String.fromCharCode(n.getUint8(e+o));return s}function Kt(r){try{return JSON.parse(r)}catch{throw new Error(`Failed to parse JSON from data starting with "${wt(r)}"`)}}function j(r,e){return N(r>=0),N(e>0),r+(e-1)&-4}function jt(r,e,t){let n;if(r instanceof ArrayBuffer)n=new Uint8Array(r);else{const s=r.byteOffset,o=r.byteLength;n=new Uint8Array(r.buffer||r.arrayBuffer,s,o)}return e.set(n,t),t+j(n.byteLength,4)}function Xt(r){switch(r.constructor){case Int8Array:return"int8";case Uint8Array:case Uint8ClampedArray:return"uint8";case Int16Array:return"int16";case Uint16Array:return"uint16";case Int32Array:return"int32";case Uint32Array:return"uint32";case Float32Array:return"float32";case Float64Array:return"float64";default:return"null"}}function Qt(r,e,t){const n=Xt(e.value),s=t||Vt(e);return{name:r,type:{type:"fixed-size-list",listSize:e.size,children:[{name:"value",type:n}]},nullable:!1,metadata:s}}function Vt(r){const e={};return"byteOffset"in r&&(e.byteOffset=r.byteOffset.toString(10)),"byteStride"in r&&(e.byteStride=r.byteStride.toString(10)),"normalized"in r&&(e.normalized=r.normalized.toString()),e}const oe={};function Yt(r){if(oe[r]===void 0){const e=It?kt(r):Wt(r);oe[r]=e}return oe[r]}function Wt(r){var s,o;const e=["image/png","image/jpeg","image/gif"],t=((s=globalThis.loaders)==null?void 0:s.imageFormatsNode)||e;return!!((o=globalThis.loaders)==null?void 0:o.parseImageNode)&&t.includes(r)}function kt(r){switch(r){case"image/avif":case"image/webp":return zt(r);default:return!0}}function zt(r){try{return document.createElement("canvas").toDataURL(r).indexOf(`data:${r}`)===0}catch{return!1}}const Zt=`out vec3 pbr_vPosition;
out vec2 pbr_vUV;

#ifdef HAS_NORMALS
# ifdef HAS_TANGENTS
out mat3 pbr_vTBN;
# else
out vec3 pbr_vNormal;
# endif
#endif

void pbr_setPositionNormalTangentUV(vec4 position, vec4 normal, vec4 tangent, vec2 uv)
{
  vec4 pos = pbrProjection.modelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  vec3 normalW = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
  vec3 tangentW = normalize(vec3(pbrProjection.modelMatrix * vec4(tangent.xyz, 0.0)));
  vec3 bitangentW = cross(normalW, tangentW) * tangent.w;
  pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  pbr_vNormal = normalize(vec3(pbrProjection.modelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV = uv;
#else
  pbr_vUV = vec2(0.,0.);
#endif
}
`,qt=`precision highp float;

uniform pbrMaterialUniforms {
  // Material is unlit
  bool unlit;

  // Base color map
  bool baseColorMapEnabled;
  vec4 baseColorFactor;

  bool normalMapEnabled;  
  float normalScale; // #ifdef HAS_NORMALMAP

  bool emissiveMapEnabled;
  vec3 emissiveFactor; // #ifdef HAS_EMISSIVEMAP

  vec2 metallicRoughnessValues;
  bool metallicRoughnessMapEnabled;

  bool occlusionMapEnabled;
  float occlusionStrength; // #ifdef HAS_OCCLUSIONMAP
  
  bool alphaCutoffEnabled;
  float alphaCutoff; // #ifdef ALPHA_CUTOFF
  
  // IBL
  bool IBLenabled;
  vec2 scaleIBLAmbient; // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  vec4 scaleDiffBaseMR;
  vec4 scaleFGDSpec;
  // #endif
} pbrMaterial;

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D pbr_baseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D pbr_normalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D pbr_emissiveSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D pbr_metallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D pbr_occlusionSampler;
#endif
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif

// Inputs from vertex shader

in vec3 pbr_vPosition;
in vec2 pbr_vUV;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
in mat3 pbr_vTBN;
#else
in vec3 pbr_vNormal;
#endif
#endif

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  float NdotL;                  // cos angle between normal and light direction
  float NdotV;                  // cos angle between normal and view direction
  float NdotH;                  // cos angle between normal and half vector
  float LdotH;                  // cos angle between light direction and half vector
  float VdotH;                  // cos angle between view direction and half vector
  float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
  float metalness;              // metallic value at the surface
  vec3 reflectance0;            // full reflectance color (normal incidence angle)
  vec3 reflectance90;           // reflectance color at grazing angle
  float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
  vec3 diffuseColor;            // color contribution from diffuse lighting
  vec3 specularColor;           // color contribution from specular lighting
  vec3 n;                       // normal at surface point
  vec3 v;                       // vector from surface point to camera
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn)
{
#ifdef MANUAL_SRGB
#ifdef SRGB_FAST_APPROXIMATION
  vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
#else // SRGB_FAST_APPROXIMATION
  vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
  vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
#endif //SRGB_FAST_APPROXIMATION
  return vec4(linOut,srgbIn.w);;
#else //MANUAL_SRGB
  return srgbIn;
#endif //MANUAL_SRGB
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal()
{
  // Retrieve the tangent space matrix
#ifndef HAS_TANGENTS
  vec3 pos_dx = dFdx(pbr_vPosition);
  vec3 pos_dy = dFdy(pbr_vPosition);
  vec3 tex_dx = dFdx(vec3(pbr_vUV, 0.0));
  vec3 tex_dy = dFdy(vec3(pbr_vUV, 0.0));
  vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
  vec3 ng = normalize(pbr_vNormal);
#else
  vec3 ng = cross(pos_dx, pos_dy);
#endif

  t = normalize(t - ng * dot(ng, t));
  vec3 b = normalize(cross(ng, t));
  mat3 tbn = mat3(t, b, ng);
#else // HAS_TANGENTS
  mat3 tbn = pbr_vTBN;
#endif

#ifdef HAS_NORMALMAP
  vec3 n = texture(pbr_normalSampler, pbr_vUV).rgb;
  n = normalize(tbn * ((2.0 * n - 1.0) * vec3(pbrMaterial.normalScale, pbrMaterial.normalScale, 1.0)));
#else
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  vec3 n = normalize(tbn[2].xyz);
#endif

  return n;
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInfo, vec3 n, vec3 reflection)
{
  float mipCount = 9.0; // resolution of 512x512
  float lod = (pbrInfo.perceptualRoughness * mipCount);
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec3 brdf = SRGBtoLINEAR(texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness))).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, n)).rgb;

#ifdef USE_TEX_LOD
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection, lod)).rgb;
#else
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection)).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

  return diffuse + specular;
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInfo)
{
  return pbrInfo.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInfo)
{
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInfo)
{
  float NdotL = pbrInfo.NdotL;
  float NdotV = pbrInfo.NdotV;
  float r = pbrInfo.alphaRoughness;

  float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInfo)
{
  float roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  float f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (M_PI * f * f);
}

void PBRInfo_setAmbientLight(inout PBRInfo pbrInfo) {
  pbrInfo.NdotL = 1.0;
  pbrInfo.NdotH = 0.0;
  pbrInfo.LdotH = 0.0;
  pbrInfo.VdotH = 1.0;
}

void PBRInfo_setDirectionalLight(inout PBRInfo pbrInfo, vec3 lightDirection) {
  vec3 n = pbrInfo.n;
  vec3 v = pbrInfo.v;
  vec3 l = normalize(lightDirection);             // Vector from surface point to light
  vec3 h = normalize(l+v);                        // Half vector between both l and v

  pbrInfo.NdotL = clamp(dot(n, l), 0.001, 1.0);
  pbrInfo.NdotH = clamp(dot(n, h), 0.0, 1.0);
  pbrInfo.LdotH = clamp(dot(l, h), 0.0, 1.0);
  pbrInfo.VdotH = clamp(dot(v, h), 0.0, 1.0);
}

void PBRInfo_setPointLight(inout PBRInfo pbrInfo, PointLight pointLight) {
  vec3 light_direction = normalize(pointLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

vec3 calculateFinalColor(PBRInfo pbrInfo, vec3 lightColor) {
  // Calculate the shading terms for the microfacet specular shading model
  vec3 F = specularReflection(pbrInfo);
  float G = geometricOcclusion(pbrInfo);
  float D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  vec3 specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

vec4 pbr_filterColor(vec4 colorUnused)
{
  // The albedo may be defined from a base texture or a flat color
#ifdef HAS_BASECOLORMAP
  vec4 baseColor = SRGBtoLINEAR(texture(pbr_baseColorSampler, pbr_vUV)) * pbrMaterial.baseColorFactor;
#else
  vec4 baseColor = pbrMaterial.baseColorFactor;
#endif

#ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
#endif

  vec3 color = vec3(0, 0, 0);

  if(pbrMaterial.unlit){
    color.rgb = baseColor.rgb;
  }
  else{
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    float metallic = pbrMaterial.metallicRoughnessValues.x;
#ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    vec4 mrSample = texture(pbr_metallicRoughnessSampler, pbr_vUV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
#endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = getNormal();                          // normal at surface point
    vec3 v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera

    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    vec3 reflection = -normalize(reflect(v, n));

    PBRInfo pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v
    );


#ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(pbrInfo);
    color += calculateFinalColor(pbrInfo, lighting.ambientColor);

    // Apply directional light
    for(int i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
      }
    }

    // Apply point light
    for(int i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(pbrInfo, lighting_getPointLight(i));
        float attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
        color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
      }
    }
#endif

    // Calculate lighting contribution from image based lighting source (IBL)
#ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(pbrInfo, n, reflection);
    }
#endif

 // Apply optional PBR terms for additional (optional) shading
#ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled) {
      float ao = texture(pbr_occlusionSampler, pbr_vUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
#endif

#ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled) {
      vec3 emissive = SRGBtoLINEAR(texture(pbr_emissiveSampler, pbr_vUV)).rgb * pbrMaterial.emissiveFactor;
      color += emissive;
    }
#endif

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
#ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
#endif

  }

  return vec4(pow(color,vec3(1.0/2.2)), baseColor.a);
}
`,$t=`struct PBRFragmentInputs {
  pbr_vPosition: vec3f,
  pbr_vUV: vec2f,
  pbr_vTBN: mat3f,
  pbr_vNormal: vec3f
};

var fragmentInputs: PBRFragmentInputs;

fn pbr_setPositionNormalTangentUV(position: vec4f, normal: vec4f, tangent: vec4f, uv: vec2f)
{
  var pos: vec4f = pbrProjection.modelMatrix * position;
  pbr_vPosition = vec3(pos.xyz) / pos.w;

#ifdef HAS_NORMALS
#ifdef HAS_TANGENTS
  let normalW: vec3f = normalize(vec3(pbrProjection.normalMatrix * vec4(normal.xyz, 0.0)));
  let tangentW: vec3f = normalize(vec3(pbrProjection.modelMatrix * vec4(tangent.xyz, 0.0)));
  let bitangentW: vec3f = cross(normalW, tangentW) * tangent.w;
  fragmentInputs,pbr_vTBN = mat3(tangentW, bitangentW, normalW);
#else // HAS_TANGENTS != 1
  fragmentInputs.pbr_vNormal = normalize(vec3(pbrProjection.modelMatrix * vec4(normal.xyz, 0.0)));
#endif
#endif

#ifdef HAS_UV
  pbr_vUV = uv;
#else
  pbr_vUV = vec2(0.,0.);
#endif
}

struct pbrMaterialUniforms {
  // Material is unlit
  unlit: uint32,

  // Base color map
  baseColorMapEnabled: uint32,
  baseColorFactor: vec4f,

  normalMapEnabled : uint32,
  normalScale: f32,  // #ifdef HAS_NORMALMAP

  emissiveMapEnabled: uint32,
  emissiveFactor: vec3f, // #ifdef HAS_EMISSIVEMAP

  metallicRoughnessValues: vec2f,
  metallicRoughnessMapEnabled: uint32,

  occlusionMapEnabled: i32,
  occlusionStrength: f32, // #ifdef HAS_OCCLUSIONMAP
  
  alphaCutoffEnabled: i32,
  alphaCutoff: f32, // #ifdef ALPHA_CUTOFF
  
  // IBL
  IBLenabled: i32,
  scaleIBLAmbient: vec2f, // #ifdef USE_IBL
  
  // debugging flags used for shader output of intermediate PBR variables
  // #ifdef PBR_DEBUG
  scaleDiffBaseMR: vec4f,
  scaleFGDSpec: vec4f
  // #endif
} 
  
@binding(2) @group(0) var<uniform> material : pbrMaterialUniforms;

// Samplers
#ifdef HAS_BASECOLORMAP
uniform sampler2D pbr_baseColorSampler;
#endif
#ifdef HAS_NORMALMAP
uniform sampler2D pbr_normalSampler;
#endif
#ifdef HAS_EMISSIVEMAP
uniform sampler2D pbr_emissiveSampler;
#endif
#ifdef HAS_METALROUGHNESSMAP
uniform sampler2D pbr_metallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
uniform sampler2D pbr_occlusionSampler;
#endif
#ifdef USE_IBL
uniform samplerCube pbr_diffuseEnvSampler;
uniform samplerCube pbr_specularEnvSampler;
uniform sampler2D pbr_brdfLUT;
#endif

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
  NdotL: f32,                  // cos angle between normal and light direction
  NdotV: f32,                  // cos angle between normal and view direction
  NdotH: f32,                  // cos angle between normal and half vector
  LdotH: f32,                  // cos angle between light direction and half vector
  VdotH: f32,                  // cos angle between view direction and half vector
  perceptualRoughness: f32,    // roughness value, as authored by the model creator (input to shader)
  metalness: f32,              // metallic value at the surface
  reflectance0: vec3f,            // full reflectance color (normal incidence angle)
  reflectance90: vec3f,           // reflectance color at grazing angle
  alphaRoughness: f32,         // roughness mapped to a more linear change in the roughness (proposed by [2])
  diffuseColor: vec3f,            // color contribution from diffuse lighting
  specularColor: vec3f,           // color contribution from specular lighting
  n: vec3f,                       // normal at surface point
  v: vec3f,                       // vector from surface point to camera
};

const M_PI = 3.141592653589793;
const c_MinRoughness = 0.04;

fn SRGBtoLINEAR(srgbIn: vec4f ) -> vec4f
{
#ifdef MANUAL_SRGB
#ifdef SRGB_FAST_APPROXIMATION
  var linOut: vec3f = pow(srgbIn.xyz,vec3(2.2));
#else // SRGB_FAST_APPROXIMATION
  var bLess: vec3f = step(vec3(0.04045),srgbIn.xyz);
  var linOut: vec3f = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
#endif //SRGB_FAST_APPROXIMATION
  return vec4f(linOut,srgbIn.w);;
#else //MANUAL_SRGB
  return srgbIn;
#endif //MANUAL_SRGB
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
fn getNormal() -> vec3f
{
  // Retrieve the tangent space matrix
#ifndef HAS_TANGENTS
  var pos_dx: vec3f = dFdx(pbr_vPosition);
  var pos_dy: vec3f = dFdy(pbr_vPosition);
  var tex_dx: vec3f = dFdx(vec3(pbr_vUV, 0.0));
  var tex_dy: vec3f = dFdy(vec3(pbr_vUV, 0.0));
  var t: vec3f = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);

#ifdef HAS_NORMALS
  var ng: vec3f = normalize(pbr_vNormal);
#else
  var ng: vec3f = cross(pos_dx, pos_dy);
#endif

  t = normalize(t - ng * dot(ng, t));
  var b: vec3f = normalize(cross(ng, t));
  var tbn: mat3f = mat3f(t, b, ng);
#else // HAS_TANGENTS
  var tbn: mat3f = pbr_vTBN;
#endif

#ifdef HAS_NORMALMAP
  vec3 n = texture(pbr_normalSampler, pbr_vUV).rgb;
  n = normalize(tbn * ((2.0 * n - 1.0) * vec3(pbrMaterial.normalScale, pbrMaterial.normalScale, 1.0)));
#else
  // The tbn matrix is linearly interpolated, so we need to re-normalize
  vec3 n = normalize(tbn[2].xyz);
#endif

  return n;
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
fn getIBLContribution(PBRInfo pbrInfo, vec3 n, vec3 reflection) -> vec3f
{
  float mipCount = 9.0; // resolution of 512x512
  float lod = (pbrInfo.perceptualRoughness * mipCount);
  // retrieve a scale and bias to F0. See [1], Figure 3
  vec3 brdf = SRGBtoLINEAR(texture(pbr_brdfLUT,
    vec2(pbrInfo.NdotV, 1.0 - pbrInfo.perceptualRoughness))).rgb;
  vec3 diffuseLight = SRGBtoLINEAR(texture(pbr_diffuseEnvSampler, n)).rgb;

#ifdef USE_TEX_LOD
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection, lod)).rgb;
#else
  vec3 specularLight = SRGBtoLINEAR(texture(pbr_specularEnvSampler, reflection)).rgb;
#endif

  vec3 diffuse = diffuseLight * pbrInfo.diffuseColor;
  vec3 specular = specularLight * (pbrInfo.specularColor * brdf.x + brdf.y);

  // For presentation, this allows us to disable IBL terms
  diffuse *= pbrMaterial.scaleIBLAmbient.x;
  specular *= pbrMaterial.scaleIBLAmbient.y;

  return diffuse + specular;
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
fn diffuse(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.diffuseColor / PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
fn specularReflection(pbrInfo: PBRInfo) -> vec3<f32> {
  return pbrInfo.reflectance0 +
    (pbrInfo.reflectance90 - pbrInfo.reflectance0) *
    pow(clamp(1.0 - pbrInfo.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
fn geometricOcclusion(pbrInfo: PBRInfo) -> f32 {
  let NdotL: f32 = pbrInfo.NdotL;
  let NdotV: f32 = pbrInfo.NdotV;
  let r: f32 = pbrInfo.alphaRoughness;

  let attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
  let attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
  return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across
// the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface
// for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes
// from EPIC Games [1], Equation 3.
fn microfacetDistribution(pbrInfo: PBRInfo) -> f32 {
  let roughnessSq = pbrInfo.alphaRoughness * pbrInfo.alphaRoughness;
  let f = (pbrInfo.NdotH * roughnessSq - pbrInfo.NdotH) * pbrInfo.NdotH + 1.0;
  return roughnessSq / (PI * f * f);
}

fn PBRInfo_setAmbientLight(pbrInfo: ptr<function, PBRInfo>) {
  (*pbrInfo).NdotL = 1.0;
  (*pbrInfo).NdotH = 0.0;
  (*pbrInfo).LdotH = 0.0;
  (*pbrInfo).VdotH = 1.0;
}

fn PBRInfo_setDirectionalLight(pbrInfo: ptr<function, PBRInfo>, lightDirection: vec3<f32>) {
  let n = (*pbrInfo).n;
  let v = (*pbrInfo).v;
  let l = normalize(lightDirection);             // Vector from surface point to light
  let h = normalize(l + v);                      // Half vector between both l and v

  (*pbrInfo).NdotL = clamp(dot(n, l), 0.001, 1.0);
  (*pbrInfo).NdotH = clamp(dot(n, h), 0.0, 1.0);
  (*pbrInfo).LdotH = clamp(dot(l, h), 0.0, 1.0);
  (*pbrInfo).VdotH = clamp(dot(v, h), 0.0, 1.0);
}

fn PBRInfo_setPointLight(pbrInfo: ptr<function, PBRInfo>, pointLight: PointLight) {
  let light_direction = normalize(pointLight.position - pbr_vPosition);
  PBRInfo_setDirectionalLight(pbrInfo, light_direction);
}

fn calculateFinalColor(pbrInfo: PBRInfo, lightColor: vec3<f32>) -> vec3<f32> {
  // Calculate the shading terms for the microfacet specular shading model
  let F = specularReflection(pbrInfo);
  let G = geometricOcclusion(pbrInfo);
  let D = microfacetDistribution(pbrInfo);

  // Calculation of analytical lighting contribution
  let diffuseContrib = (1.0 - F) * diffuse(pbrInfo);
  let specContrib = F * G * D / (4.0 * pbrInfo.NdotL * pbrInfo.NdotV);
  // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
  return pbrInfo.NdotL * lightColor * (diffuseContrib + specContrib);
}

fn pbr_filterColor(colorUnused: vec4<f32>) -> vec4<f32> {
  // The albedo may be defined from a base texture or a flat color
  var baseColor: vec4<f32>;
  #ifdef HAS_BASECOLORMAP
  baseColor = SRGBtoLINEAR(textureSample(pbr_baseColorSampler, pbr_baseColorSampler, pbr_vUV)) * pbrMaterial.baseColorFactor;
  #else
  baseColor = pbrMaterial.baseColorFactor;
  #endif

  #ifdef ALPHA_CUTOFF
  if (baseColor.a < pbrMaterial.alphaCutoff) {
    discard;
  }
  #endif

  var color = vec3<f32>(0.0, 0.0, 0.0);

  if (pbrMaterial.unlit) {
    color = baseColor.rgb;
  } else {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    var perceptualRoughness = pbrMaterial.metallicRoughnessValues.y;
    var metallic = pbrMaterial.metallicRoughnessValues.x;
    #ifdef HAS_METALROUGHNESSMAP
    // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
    // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
    let mrSample = textureSample(pbr_metallicRoughnessSampler, pbr_metallicRoughnessSampler, pbr_vUV);
    perceptualRoughness = mrSample.g * perceptualRoughness;
    metallic = mrSample.b * metallic;
    #endif
    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);
    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    let alphaRoughness = perceptualRoughness * perceptualRoughness;

    let f0 = vec3<f32>(0.04);
    var diffuseColor = baseColor.rgb * (vec3<f32>(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    let specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    let reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing
    // reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%),
    // incrementally reduce grazing reflectance to 0%.
    let reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    let specularEnvironmentR0 = specularColor;
    let specularEnvironmentR90 = vec3<f32>(1.0, 1.0, 1.0) * reflectance90;

    let n = getNormal();                          // normal at surface point
    let v = normalize(pbrProjection.camera - pbr_vPosition);  // Vector from surface point to camera

    let NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);
    let reflection = -normalize(reflect(v, n));

    var pbrInfo = PBRInfo(
      0.0, // NdotL
      NdotV,
      0.0, // NdotH
      0.0, // LdotH
      0.0, // VdotH
      perceptualRoughness,
      metallic,
      specularEnvironmentR0,
      specularEnvironmentR90,
      alphaRoughness,
      diffuseColor,
      specularColor,
      n,
      v
    );

    #ifdef USE_LIGHTS
    // Apply ambient light
    PBRInfo_setAmbientLight(&pbrInfo);
    color += calculateFinalColor(pbrInfo, lighting.ambientColor);

    // Apply directional light
    for (var i = 0; i < lighting.directionalLightCount; i++) {
      if (i < lighting.directionalLightCount) {
        PBRInfo_setDirectionalLight(&pbrInfo, lighting_getDirectionalLight(i).direction);
        color += calculateFinalColor(pbrInfo, lighting_getDirectionalLight(i).color);
      }
    }

    // Apply point light
    for (var i = 0; i < lighting.pointLightCount; i++) {
      if (i < lighting.pointLightCount) {
        PBRInfo_setPointLight(&pbrInfo, lighting_getPointLight(i));
        let attenuation = getPointLightAttenuation(lighting_getPointLight(i), distance(lighting_getPointLight(i).position, pbr_vPosition));
        color += calculateFinalColor(pbrInfo, lighting_getPointLight(i).color / attenuation);
      }
    }
    #endif

    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
    if (pbrMaterial.IBLenabled) {
      color += getIBLContribution(pbrInfo, n, reflection);
    }
    #endif

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
    if (pbrMaterial.occlusionMapEnabled) {
      let ao = textureSample(pbr_occlusionSampler, pbr_occlusionSampler, pbr_vUV).r;
      color = mix(color, color * ao, pbrMaterial.occlusionStrength);
    }
    #endif

    #ifdef HAS_EMISSIVEMAP
    if (pbrMaterial.emissiveMapEnabled) {
      let emissive = SRGBtoLINEAR(textureSample(pbr_emissiveSampler, pbr_emissiveSampler, pbr_vUV)).rgb * pbrMaterial.emissiveFactor;
      color += emissive;
    }
    #endif

    // This section uses mix to override final color for reference app visualization
    // of various parameters in the lighting equation.
    #ifdef PBR_DEBUG
    // TODO: Figure out how to debug multiple lights

    // color = mix(color, F, pbr_scaleFGDSpec.x);
    // color = mix(color, vec3(G), pbr_scaleFGDSpec.y);
    // color = mix(color, vec3(D), pbr_scaleFGDSpec.z);
    // color = mix(color, specContrib, pbr_scaleFGDSpec.w);

    // color = mix(color, diffuseContrib, pbr_scaleDiffBaseMR.x);
    color = mix(color, baseColor.rgb, pbrMaterial.scaleDiffBaseMR.y);
    color = mix(color, vec3<f32>(metallic), pbrMaterial.scaleDiffBaseMR.z);
    color = mix(color, vec3<f32>(perceptualRoughness), pbrMaterial.scaleDiffBaseMR.w);
    #endif
  }

  return vec4<f32>(pow(color, vec3<f32>(1.0 / 2.2)), baseColor.a);
}
`,Ge=`uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,en={name:"pbrProjection",vs:Ge,fs:Ge,getUniforms:r=>r,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<i32>"}},Ye={props:{},uniforms:{},name:"pbrMaterial",dependencies:[St,en],source:$t,vs:Zt,fs:qt,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:r=>r,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>"}};class W{constructor(e={}){d(this,"id");d(this,"matrix",new v);d(this,"display",!0);d(this,"position",new R);d(this,"rotation",new R);d(this,"scale",new R(1,1,1));d(this,"userData",{});d(this,"props",{});const{id:t}=e;this.id=t||Ft(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return this.position=e,this}setRotation(e){return this.rotation=e,this}setScale(e){return this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){const{position:t,rotation:n,scale:s,update:o=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),s&&this.setScale(s),o&&this.updateMatrix(),this}updateMatrix(){const e=this.position,t=this.rotation,n=this.scale;return this.matrix.identity(),this.matrix.translate(e),this.matrix.rotateXYZ(t),this.matrix.scale(n),this}update(e={}){const{position:t,rotation:n,scale:s}=e;return t&&this.setPosition(t),n&&this.setRotation(n),s&&this.setScale(s),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;const n=new v(e).multiplyRight(t),s=n.invert(),o=s.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:s,worldInverseTransposeMatrix:o}}_setScenegraphNodeProps(e){"position"in e&&this.setPosition(e.position),"rotation"in e&&this.setRotation(e.rotation),"scale"in e&&this.setScale(e.scale),"matrix"in e&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}class H extends W{constructor(t={}){t=Array.isArray(t)?{children:t}:t;const{children:n=[]}=t;O.assert(n.every(s=>s instanceof W),"every child must an instance of ScenegraphNode");super(t);d(this,"children");this.children=n}getBounds(){const t=[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]];return this.traverse((n,{worldMatrix:s})=>{const o=n.getBounds();if(!o)return;const[i,a]=o,c=new R(i).add(a).divide([2,2,2]);s.transformAsPoint(c,c);const f=new R(a).subtract(i).divide([2,2,2]);s.transformAsVector(f,f);for(let A=0;A<8;A++){const l=new R(A&1?-1:1,A&2?-1:1,A&4?-1:1).multiply(f).add(c);for(let u=0;u<3;u++)t[0][u]=Math.min(t[0][u],l[u]),t[1][u]=Math.max(t[1][u],l[u])}}),Number.isFinite(t[0][0])?t:null}destroy(){this.children.forEach(t=>t.destroy()),this.removeAll(),super.destroy()}add(...t){for(const n of t)Array.isArray(n)?this.add(...n):this.children.push(n);return this}remove(t){const n=this.children,s=n.indexOf(t);return s>-1&&n.splice(s,1),this}removeAll(){return this.children=[],this}traverse(t,{worldMatrix:n=new v}={}){const s=new v(n).multiplyRight(this.matrix);for(const o of this.children)o instanceof H?o.traverse(t,{worldMatrix:s}):t(o,{worldMatrix:s})}}class me extends W{constructor(t){super(t);d(this,"model");d(this,"bounds",null);d(this,"managedResources");this.model=t.model,this.managedResources=t.managedResources||[],this.bounds=t.bounds||null,this.setProps(t)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(t=>t.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(t){return this.model.draw(t)}}const tn="4.3.3",k={TRANSCODER:"basis_transcoder.js",TRANSCODER_WASM:"basis_transcoder.wasm",ENCODER:"basis_encoder.js",ENCODER_WASM:"basis_encoder.wasm"};let De;async function Se(r){Lt(r.modules);const e=xt("basis");return e||(De||(De=nn(r)),await De)}async function nn(r){let e=null,t=null;return[e,t]=await Promise.all([await y(k.TRANSCODER,"textures",r),await y(k.TRANSCODER_WASM,"textures",r)]),e=e||globalThis.BASIS,await rn(e,t)}function rn(r,e){const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r(t).then(s=>{const{BasisFile:o,initializeBasis:i}=s;i(),n({BasisFile:o})})})}let ie;async function ve(r){const e=r.modules||{};return e.basisEncoder?e.basisEncoder:(ie=ie||sn(r),await ie)}async function sn(r){let e=null,t=null;return[e,t]=await Promise.all([await y(k.ENCODER,"textures",r),await y(k.ENCODER_WASM,"textures",r)]),e=e||globalThis.BASIS,await on(e,t)}function on(r,e){const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r(t).then(s=>{const{BasisFile:o,KTX2File:i,initializeBasis:a,BasisEncoder:c}=s;a(),n({BasisFile:o,KTX2File:i,BasisEncoder:c})})})}const G={COMPRESSED_RGB_S3TC_DXT1_EXT:33776,COMPRESSED_RGBA_S3TC_DXT5_EXT:33779,COMPRESSED_RGB_PVRTC_4BPPV1_IMG:35840,COMPRESSED_RGBA_PVRTC_4BPPV1_IMG:35842,COMPRESSED_RGB_ETC1_WEBGL:36196,COMPRESSED_RGBA_ASTC_4X4_KHR:37808},an=["","WEBKIT_","MOZ_"],Oe={WEBGL_compressed_texture_s3tc:"dxt",WEBGL_compressed_texture_s3tc_srgb:"dxt-srgb",WEBGL_compressed_texture_etc1:"etc1",WEBGL_compressed_texture_etc:"etc2",WEBGL_compressed_texture_pvrtc:"pvrtc",WEBGL_compressed_texture_atc:"atc",WEBGL_compressed_texture_astc:"astc",EXT_texture_compression_rgtc:"rgtc"};let Q=null;function cn(r){if(!Q){r=r||fn()||void 0,Q=new Set;for(const e of an)for(const t in Oe)if(r&&r.getExtension(`${e}${t}`)){const n=Oe[t];Q.add(n)}}return Q}function fn(){try{return document.createElement("canvas").getContext("webgl")}catch{return null}}const h=[171,75,84,88,32,50,48,187,13,10,26,10];function An(r){const e=new Uint8Array(r);return!(e.byteLength<h.length||e[0]!==h[0]||e[1]!==h[1]||e[2]!==h[2]||e[3]!==h[3]||e[4]!==h[4]||e[5]!==h[5]||e[6]!==h[6]||e[7]!==h[7]||e[8]!==h[8]||e[9]!==h[9]||e[10]!==h[10]||e[11]!==h[11])}const ln={etc1:{basisFormat:0,compressed:!0,format:G.COMPRESSED_RGB_ETC1_WEBGL},etc2:{basisFormat:1,compressed:!0},bc1:{basisFormat:2,compressed:!0,format:G.COMPRESSED_RGB_S3TC_DXT1_EXT},bc3:{basisFormat:3,compressed:!0,format:G.COMPRESSED_RGBA_S3TC_DXT5_EXT},bc4:{basisFormat:4,compressed:!0},bc5:{basisFormat:5,compressed:!0},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0},"bc7-m5":{basisFormat:7,compressed:!0},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:G.COMPRESSED_RGB_PVRTC_4BPPV1_IMG},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:G.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG},"astc-4x4":{basisFormat:10,compressed:!0,format:G.COMPRESSED_RGBA_ASTC_4X4_KHR},"atc-rgb":{basisFormat:11,compressed:!0},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0},rgba32:{basisFormat:13,compressed:!1},rgb565:{basisFormat:14,compressed:!1},bgr565:{basisFormat:15,compressed:!1},rgba4444:{basisFormat:16,compressed:!1}};async function un(r,e){if(e.basis.containerFormat==="auto"){if(An(r)){const n=await ve(e);return Le(n.KTX2File,r,e)}const{BasisFile:t}=await Se(e);return ae(t,r,e)}switch(e.basis.module){case"encoder":const t=await ve(e);switch(e.basis.containerFormat){case"ktx2":return Le(t.KTX2File,r,e);case"basis":default:return ae(t.BasisFile,r,e)}case"transcoder":default:const{BasisFile:n}=await Se(e);return ae(n,r,e)}}function ae(r,e,t){const n=new r(new Uint8Array(e));try{if(!n.startTranscoding())throw new Error("Failed to start basis transcoding");const s=n.getNumImages(),o=[];for(let i=0;i<s;i++){const a=n.getNumLevels(i),c=[];for(let f=0;f<a;f++)c.push(dn(n,i,f,t));o.push(c)}return o}finally{n.close(),n.delete()}}function dn(r,e,t,n){const s=r.getImageWidth(e,t),o=r.getImageHeight(e,t),i=r.getHasAlpha(),{compressed:a,format:c,basisFormat:f}=We(n,i),A=r.getImageTranscodedSizeInBytes(e,t,f),l=new Uint8Array(A);if(!r.transcodeImage(l,e,t,f,0,0))throw new Error("failed to start Basis transcoding");return{width:s,height:o,data:l,compressed:a,format:c,hasAlpha:i}}function Le(r,e,t){const n=new r(new Uint8Array(e));try{if(!n.startTranscoding())throw new Error("failed to start KTX2 transcoding");const s=n.getLevels(),o=[];for(let i=0;i<s;i++)o.push(Bn(n,i,t));return[o]}finally{n.close(),n.delete()}}function Bn(r,e,t){const{alphaFlag:n,height:s,width:o}=r.getImageLevelInfo(e,0,0),{compressed:i,format:a,basisFormat:c}=We(t,n),f=r.getImageTranscodedSizeInBytes(e,0,0,c),A=new Uint8Array(f);if(!r.transcodeImage(A,e,0,0,c,0,-1,-1))throw new Error("Failed to transcode KTX2 image");return{width:o,height:s,data:A,compressed:i,levelSize:f,hasAlpha:n,format:a}}function We(r,e){let t=r&&r.basis&&r.basis.format;return t==="auto"&&(t=ke()),typeof t=="object"&&(t=e?t.alpha:t.noAlpha),t=t.toLowerCase(),ln[t]}function ke(){const r=cn();return r.has("astc")?"astc-4x4":r.has("dxt")?{alpha:"bc3",noAlpha:"bc1"}:r.has("pvrtc")?{alpha:"pvrtc1-4-rgba",noAlpha:"pvrtc1-4-rgb"}:r.has("etc1")?"etc1":r.has("etc2")?"etc2":"rgb565"}const mn={dataType:null,batchType:null,name:"Basis",id:"basis",module:"textures",version:tn,worker:!0,extensions:["basis","ktx2"],mimeTypes:["application/octet-stream","image/ktx2"],tests:["sB"],binary:!0,options:{basis:{format:"auto",libraryPath:"libs/",containerFormat:"auto",module:"transcoder"}}},Cn={...mn,parse:un};function pn(r){return{addressModeU:xe(r.wrapS),addressModeV:xe(r.wrapT),magFilter:hn(r.magFilter),...bn(r.minFilter)}}function xe(r){switch(r){case 33071:return"clamp-to-edge";case 10497:return"repeat";case 33648:return"mirror-repeat";default:return}}function hn(r){switch(r){case 9728:return"nearest";case 9729:return"linear";default:return}}function bn(r){switch(r){case 9728:return{minFilter:"nearest"};case 9729:return{minFilter:"linear"};case 9984:return{minFilter:"nearest",mipmapFilter:"nearest"};case 9985:return{minFilter:"linear",mipmapFilter:"nearest"};case 9986:return{minFilter:"nearest",mipmapFilter:"linear"};case 9987:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}function gn(r,e,t,n){const s={defines:{MANUAL_SRGB:!0,SRGB_FAST_APPROXIMATION:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};s.defines.USE_TEX_LOD=!0;const{imageBasedLightingEnvironment:o}=n;return o&&(s.bindings.pbr_diffuseEnvSampler=o.diffuseEnvSampler.texture,s.bindings.pbr_specularEnvSampler=o.specularEnvSampler.texture,s.bindings.pbr_BrdfLUT=o.brdfLutTexture.texture,s.uniforms.scaleIBLAmbient=[1,1]),n!=null&&n.pbrDebug&&(s.defines.PBR_DEBUG=!0,s.uniforms.scaleDiffBaseMR=[0,0,0,0],s.uniforms.scaleFGDSpec=[0,0,0,0]),t.NORMAL&&(s.defines.HAS_NORMALS=!0),t.TANGENT&&(n!=null&&n.useTangents)&&(s.defines.HAS_TANGENTS=!0),t.TEXCOORD_0&&(s.defines.HAS_UV=!0),n!=null&&n.imageBasedLightingEnvironment&&(s.defines.USE_IBL=!0),n!=null&&n.lights&&(s.defines.USE_LIGHTS=!0),e&&En(r,e,s),s}function En(r,e,t){if(t.uniforms.unlit=!!e.unlit,e.pbrMetallicRoughness&&In(r,e.pbrMetallicRoughness,t),e.normalTexture){J(r,e.normalTexture,"pbr_normalSampler","HAS_NORMALMAP",t);const{scale:n=1}=e.normalTexture;t.uniforms.normalScale=n}if(e.occlusionTexture){J(r,e.occlusionTexture,"pbr_occlusionSampler","HAS_OCCLUSIONMAP",t);const{strength:n=1}=e.occlusionTexture;t.uniforms.occlusionStrength=n}switch(e.emissiveTexture&&(J(r,e.emissiveTexture,"pbr_emissiveSampler","HAS_EMISSIVEMAP",t),t.uniforms.emissiveFactor=e.emissiveFactor||[0,0,0]),e.alphaMode||"MASK"){case"MASK":const{alphaCutoff:n=.5}=e;t.defines.ALPHA_CUTOFF=!0,t.uniforms.alphaCutoff=n;break;case"BLEND":O.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),t.parameters.blend=!0,t.parameters.blendColorOperation="add",t.parameters.blendColorSrcFactor="src-alpha",t.parameters.blendColorDstFactor="one-minus-src-alpha",t.parameters.blendAlphaOperation="add",t.parameters.blendAlphaSrcFactor="one",t.parameters.blendAlphaDstFactor="one-minus-src-alpha",t.glParameters.blend=!0,t.glParameters.blendEquation=32774,t.glParameters.blendFunc=[770,771,1,771];break}}function In(r,e,t){e.baseColorTexture&&J(r,e.baseColorTexture,"pbr_baseColorSampler","HAS_BASECOLORMAP",t),t.uniforms.baseColorFactor=e.baseColorFactor||[1,1,1,1],e.metallicRoughnessTexture&&J(r,e.metallicRoughnessTexture,"pbr_metallicRoughnessSampler","HAS_METALROUGHNESSMAP",t);const{metallicFactor:n=1,roughnessFactor:s=1}=e;t.uniforms.metallicRoughnessValues=[n,s]}function J(r,e,t,n,s){var f;const o=e.texture.source.image;let i;o.compressed?i=o:i={data:o};const a={wrapS:10497,wrapT:10497,...(f=e==null?void 0:e.texture)==null?void 0:f.sampler},c=r.createTexture({id:e.uniformName||e.id,sampler:pn(a),...i});s.bindings[t]=c,n&&(s.defines[n]=!0),s.generatedTextures.push(c)}var T;(function(r){r[r.POINTS=0]="POINTS",r[r.LINES=1]="LINES",r[r.LINE_LOOP=2]="LINE_LOOP",r[r.LINE_STRIP=3]="LINE_STRIP",r[r.TRIANGLES=4]="TRIANGLES",r[r.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",r[r.TRIANGLE_FAN=6]="TRIANGLE_FAN"})(T||(T={}));function Fn(r){switch(r){case T.POINTS:return"point-list";case T.LINES:return"line-list";case T.LINE_STRIP:return"line-strip";case T.TRIANGLES:return"triangle-list";case T.TRIANGLE_STRIP:return"triangle-strip";default:throw new Error(String(r))}}const Mn=`
layout(0) positions: vec4; // in vec4 POSITION;

  #ifdef HAS_NORMALS
    in vec4 normals; // in vec4 NORMAL;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

@vertex
  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = u_MVPMatrix * positions;
  }

@fragment
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`,Tn=`#version 300 es

  // in vec4 POSITION;
  in vec4 positions;

  #ifdef HAS_NORMALS
    // in vec4 NORMAL;
    in vec4 normals;
  #endif

  #ifdef HAS_TANGENTS
    in vec4 TANGENT;
  #endif

  #ifdef HAS_UV
    // in vec2 TEXCOORD_0;
    in vec2 texCoords;
  #endif

  void main(void) {
    vec4 _NORMAL = vec4(0.);
    vec4 _TANGENT = vec4(0.);
    vec2 _TEXCOORD_0 = vec2(0.);

    #ifdef HAS_NORMALS
      _NORMAL = normals;
    #endif

    #ifdef HAS_TANGENTS
      _TANGENT = TANGENT;
    #endif

    #ifdef HAS_UV
      _TEXCOORD_0 = texCoords;
    #endif

    pbr_setPositionNormalTangentUV(positions, _NORMAL, _TANGENT, _TEXCOORD_0);
    gl_Position = pbrProjection.modelViewProjectionMatrix * positions;
  }
`,_n=`#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function Rn(r,e){const{id:t,geometry:n,parsedPPBRMaterial:s,vertexCount:o,modelOptions:i={}}=e;O.info(4,"createGLTFModel defines: ",s.defines)();const a=[],c={depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back"},f={id:t,source:Mn,vs:Tn,fs:_n,geometry:n,topology:n.topology,vertexCount:o,modules:[Ye],...i,defines:{...s.defines,...i.defines},parameters:{...c,...s.parameters,...i.parameters}},A=new Mt(r,f),{camera:l,...u}={...s.uniforms,...i.uniforms,...s.bindings,...i.bindings};return A.shaderInputs.setProps({pbrMaterial:u,pbrProjection:{camera:l}}),new me({managedResources:a,model:A})}const yn={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1};function Gn(r,e,t={}){const n={...yn,...t};return e.scenes.map(o=>Dn(r,o,e.nodes,n))}function Dn(r,e,t,n){const o=(e.nodes||[]).map(a=>ze(r,a,t,n));return new H({id:e.name||e.id,children:o})}function ze(r,e,t,n){if(!e._node){const i=(e.children||[]).map(c=>ze(r,c,t,n));e.mesh&&i.push(Sn(r,e.mesh,n));const a=new H({id:e.name||e.id,children:i});if(e.matrix)a.setMatrix(e.matrix);else{if(a.matrix.identity(),e.translation&&a.matrix.translate(e.translation),e.rotation){const c=new v().fromQuaternion(e.rotation);a.matrix.multiplyRight(c)}e.scale&&a.matrix.scale(e.scale)}e._node=a}const s=t.find(o=>o.id===e.id);return s._node=e._node,e._node}function Sn(r,e,t){if(!e._mesh){const s=(e.primitives||[]).map((i,a)=>vn(r,i,a,e,t)),o=new H({id:e.name||e.id,children:s});e._mesh=o}return e._mesh}function vn(r,e,t,n,s){const o=e.name||`${n.name||n.id}-primitive-${t}`,i=Fn(e.mode||4),a=e.indices?e.indices.count:On(e.attributes),c=He(o,e,i),f=gn(r,e.material,c.attributes,s),A=Rn(r,{id:o,geometry:He(o,e,i),parsedPPBRMaterial:f,modelOptions:s.modelOptions,vertexCount:a});return A.bounds=[e.attributes.POSITION.min,e.attributes.POSITION.max],A}function On(r){throw new Error("getVertexCount not implemented")}function He(r,e,t){const n={};for(const[s,o]of Object.entries(e.attributes)){const{components:i,size:a,value:c}=o;n[s]={size:a??i,value:c}}return new vt({id:r,topology:t,indices:e.indices.value,attributes:n})}const ce=new Ot;function Ln(r,{input:e,interpolation:t,output:n},s,o){const i=e[e.length-1],a=r%i,c=e.findIndex(u=>u>=a),f=Math.max(0,c-1);if(!Array.isArray(s[o]))switch(o){case"translation":s[o]=[0,0,0];break;case"rotation":s[o]=[0,0,0,1];break;case"scale":s[o]=[1,1,1];break;default:O.warn(`Bad animation path ${o}`)()}const A=e[f],l=e[c];switch(t){case"STEP":Pn(s,o,n[f]);break;case"LINEAR":if(l>A){const u=(a-A)/(l-A);xn(s,o,n[f],n[c],u)}break;case"CUBICSPLINE":if(l>A){const u=(a-A)/(l-A),B=l-A,g=n[3*f+1],E=n[3*f+2],F=n[3*c+0],C=n[3*c+1];Hn(s,o,{p0:g,outTangent0:E,inTangent1:F,p1:C,tDiff:B,ratio:u})}break;default:O.warn(`Interpolation ${t} not supported`)();break}}function xn(r,e,t,n,s){if(!r[e])throw new Error;if(e==="rotation"){ce.slerp({start:t,target:n,ratio:s});for(let o=0;o<ce.length;o++)r[e][o]=ce[o]}else for(let o=0;o<t.length;o++)r[e][o]=s*n[o]+(1-s)*t[o]}function Hn(r,e,{p0:t,outTangent0:n,inTangent1:s,p1:o,tDiff:i,ratio:a}){if(!r[e])throw new Error;for(let c=0;c<r[e].length;c++){const f=n[c]*i,A=s[c]*i;r[e][c]=(2*Math.pow(a,3)-3*Math.pow(a,2)+1)*t[c]+(Math.pow(a,3)-2*Math.pow(a,2)+a)*f+(-2*Math.pow(a,3)+3*Math.pow(a,2))*o[c]+(Math.pow(a,3)-Math.pow(a,2))*A}}function Pn(r,e,t){if(!r[e])throw new Error;for(let n=0;n<t.length;n++)r[e][n]=t[n]}class Un{constructor(e){d(this,"animation");d(this,"startTime",0);d(this,"playing",!0);d(this,"speed",1);var t;this.animation=e.animation,(t=this.animation).name||(t.name="unnamed"),Object.assign(this,e)}setTime(e){if(!this.playing)return;const n=(e/1e3-this.startTime)*this.speed;this.animation.channels.forEach(({sampler:s,target:o,path:i})=>{Ln(n,s,o,i),wn(o,o._node)})}}class Jn{constructor(e){d(this,"animations");this.animations=e.animations.map((t,n)=>{const s=t.name||`Animation-${n}`;return new Un({animation:{name:s,channels:t.channels}})})}animate(e){O.warn("GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead")(),this.setTime(e)}setTime(e){this.animations.forEach(t=>t.setTime(e))}getAnimations(){return this.animations}}const Nn=new v;function wn(r,e){if(e.matrix.identity(),r.translation&&e.matrix.translate(r.translation),r.rotation){const t=Nn.fromQuaternion(r.rotation);e.matrix.multiplyRight(t)}r.scale&&e.matrix.scale(r.scale)}const Kn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},jn={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function Xn(r){var a;const e=jn[r.componentType],t=Kn[r.type],n=t*r.count,{buffer:s,byteOffset:o=0}=((a=r.bufferView)==null?void 0:a.data)??{};return{typedArray:new e(s,o+(r.byteOffset||0),n),components:t}}function Qn(r){return(r.animations||[]).map((t,n)=>{const s=t.name||`Animation-${n}`,o=t.samplers.map(({input:a,interpolation:c="LINEAR",output:f})=>({input:Pe(r.accessors[a]),interpolation:c,output:Pe(r.accessors[f])})),i=t.channels.map(({sampler:a,target:c})=>({sampler:o[a],target:r.nodes[c.node??0],path:c.path}));return{name:s,channels:i}})}function Pe(r){if(!r._animation){const{typedArray:e,components:t}=Xn(r);if(t===1)r._animation=Array.from(e);else{const n=[];for(let s=0;s<e.length;s+=t)n.push(Array.from(e.slice(s,s+t)));r._animation=n}}return r._animation}function Ce(r){if(ArrayBuffer.isView(r)||r instanceof ArrayBuffer||r instanceof ImageBitmap)return r;if(Array.isArray(r))return r.map(Ce);if(r&&typeof r=="object"){const e={};for(const t in r)e[t]=Ce(r[t]);return e}return r}function Vn(r,e,t){e=Ce(e);const n=Gn(r,e,t),s=Qn(e),o=new Jn({animations:s});return{scenes:n,animator:o}}function b(r,e){if(!r)throw new Error(e||"assert failed: gltf")}const Ze={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},qe={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Yn=1.33,Ue=["SCALAR","VEC2","VEC3","VEC4"],Wn=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],kn=new Map(Wn),zn={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Zn={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},qn={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function $e(r){return Ue[r-1]||Ue[0]}function q(r){const e=kn.get(r.constructor);if(!e)throw new Error("Illegal typed array");return e}function Ie(r,e){const t=qn[r.componentType],n=zn[r.type],s=Zn[r.componentType],o=r.count*n,i=r.count*n*s;b(i>=0&&i<=e.byteLength);const a=qe[r.componentType],c=Ze[r.type];return{ArrayType:t,length:o,byteLength:i,componentByteSize:a,numberOfComponentsInElement:c}}function Ii(r){let{images:e,bufferViews:t}=r;e=e||[],t=t||[];const n=e.map(i=>i.bufferView);t=t.filter(i=>!n.includes(i));const s=t.reduce((i,a)=>i+a.byteLength,0),o=e.reduce((i,a)=>{const{width:c,height:f}=a.image;return i+c*f},0);return s+Math.ceil(4*o*Yn)}function $n(r,e,t){const n=r.bufferViews[t];b(n);const s=n.buffer,o=e[s];b(o);const i=(n.byteOffset||0)+o.byteOffset;return new Uint8Array(o.arrayBuffer,i,n.byteLength)}function er(r,e,t){var E,F;const n=typeof t=="number"?(E=r.accessors)==null?void 0:E[t]:t;if(!n)throw new Error(`No gltf accessor ${JSON.stringify(t)}`);const s=(F=r.bufferViews)==null?void 0:F[n.bufferView||0];if(!s)throw new Error(`No gltf buffer view for accessor ${s}`);const{arrayBuffer:o,byteOffset:i}=e[s.buffer],a=(i||0)+(n.byteOffset||0)+(s.byteOffset||0),{ArrayType:c,length:f,componentByteSize:A,numberOfComponentsInElement:l}=Ie(n,s),u=A*l,B=s.byteStride||u;if(typeof s.byteStride>"u"||s.byteStride===u)return new c(o,a,f);const g=new c(f);for(let C=0;C<n.count;C++){const P=new c(o,a+C*B,l);g.set(P,C*l)}return g}function tr(){return{asset:{version:"2.0",generator:"loaders.gl"},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}class m{constructor(e){d(this,"gltf");d(this,"sourceBuffers");d(this,"byteLength");this.gltf={json:(e==null?void 0:e.json)||tr(),buffers:(e==null?void 0:e.buffers)||[],images:(e==null?void 0:e.images)||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){const t=this.getUsedExtensions().find(s=>s===e),n=this.getRequiredExtensions().find(s=>s===e);return typeof t=="string"||typeof n=="string"}getExtension(e){const t=this.getUsedExtensions().find(s=>s===e),n=this.json.extensions||{};return t?n[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(n=>n===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject("scenes",e)}getNode(e){return this.getObject("nodes",e)}getSkin(e){return this.getObject("skins",e)}getMesh(e){return this.getObject("meshes",e)}getMaterial(e){return this.getObject("materials",e)}getAccessor(e){return this.getObject("accessors",e)}getTexture(e){return this.getObject("textures",e)}getSampler(e){return this.getObject("samplers",e)}getImage(e){return this.getObject("images",e)}getBufferView(e){return this.getObject("bufferViews",e)}getBuffer(e){return this.getObject("buffers",e)}getObject(e,t){if(typeof t=="object")return t;const n=this.json[e]&&this.json[e][t];if(!n)throw new Error(`glTF file error: Could not find ${e}[${t}]`);return n}getTypedArrayForBufferView(e){e=this.getBufferView(e);const t=e.buffer,n=this.gltf.buffers[t];b(n);const s=(e.byteOffset||0)+n.byteOffset;return new Uint8Array(n.arrayBuffer,s,e.byteLength)}getTypedArrayForAccessor(e){const t=this.getAccessor(e);return er(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);const t=this.getBufferView(e.bufferView),s=this.getBuffer(t.buffer).data,o=t.byteOffset||0;return new Uint8Array(s,o,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,n){return e.extensions=e.extensions||{},e.extensions[t]=n,this.registerUsedExtension(t),this}setObjectExtension(e,t,n){const s=e.extensions||{};s[t]=n}removeObjectExtension(e,t){const n=(e==null?void 0:e.extensions)||{};if(n[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const s=this.json.extensionsRemoved;s.includes(t)||s.push(t)}delete n[t]}addExtension(e,t={}){return b(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return b(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){var t;if((t=this.json.extensions)!=null&&t[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const n=this.json.extensionsRemoved;n.includes(e)||n.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){const{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){const{meshIndex:t,matrix:n}=e;this.json.nodes=this.json.nodes||[];const s={mesh:t};return n&&(s.matrix=n),this.json.nodes.push(s),this.json.nodes.length-1}addMesh(e){const{attributes:t,indices:n,material:s,mode:o=4}=e,a={primitives:[{attributes:this._addAttributes(t),mode:o}]};if(n){const c=this._addIndices(n);a.primitives[0].indices=c}return Number.isFinite(s)&&(a.primitives[0].material=s),this.json.meshes=this.json.meshes||[],this.json.meshes.push(a),this.json.meshes.length-1}addPointCloud(e){const n={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(n),this.json.meshes.length-1}addImage(e,t){const n=Tt(e),s=t||(n==null?void 0:n.mimeType),i={bufferView:this.addBufferView(e),mimeType:s};return this.json.images=this.json.images||[],this.json.images.push(i),this.json.images.length-1}addBufferView(e,t=0,n=this.byteLength){const s=e.byteLength;b(Number.isFinite(s)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);const o={buffer:t,byteOffset:n,byteLength:s};return this.byteLength+=j(s,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(o),this.json.bufferViews.length-1}addAccessor(e,t){const n={bufferView:e,type:$e(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(n),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){const n=this.addBufferView(e);let s={min:t.min,max:t.max};(!s.min||!s.max)&&(s=this._getAccessorMinMax(e,t.size));const o={size:t.size,componentType:q(e),count:Math.round(e.length/t.size),min:s.min,max:s.max};return this.addAccessor(n,Object.assign(o,t))}addTexture(e){const{imageIndex:t}=e,n={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(n),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){var o,i;const e=this.byteLength,t=new ArrayBuffer(e),n=new Uint8Array(t);let s=0;for(const a of this.sourceBuffers||[])s=jt(a,n,s);(i=(o=this.json)==null?void 0:o.buffers)!=null&&i[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let n=!0;for(;n;){const s=e.indexOf(t);s>-1?e.splice(s,1):n=!1}}_addAttributes(e={}){const t={};for(const n in e){const s=e[n],o=this._getGltfAttributeName(n),i=this.addBinaryBuffer(s.value,s);t[o]=i}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case"position":case"positions":case"vertices":return"POSITION";case"normal":case"normals":return"NORMAL";case"color":case"colors":return"COLOR_0";case"texcoord":case"texcoords":return"TEXCOORD_0";default:return e}}_getAccessorMinMax(e,t){const n={min:null,max:null};if(e.length<t)return n;n.min=[],n.max=[];const s=e.subarray(0,t);for(const o of s)n.min.push(o),n.max.push(o);for(let o=t;o<e.length;o+=t)for(let i=0;i<t;i++)n.min[0+i]=Math.min(n.min[0+i],e[o+i]),n.max[0+i]=Math.max(n.max[0+i],e[o+i]);return n}}function Je(r){return(r%1+1)%1}const et={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},nr={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},tt={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function Fe(r,e){return tt[e]*et[r]}function $(r,e,t,n){if(t!=="UINT8"&&t!=="UINT16"&&t!=="UINT32"&&t!=="UINT64")return null;const s=r.getTypedArrayForBufferView(e),o=ee(s,"SCALAR",t,n+1);return o instanceof BigInt64Array||o instanceof BigUint64Array?null:o}function ee(r,e,t,n=1){const s=et[e],o=nr[t],i=tt[t],a=n*s,c=a*i;let f=r.buffer,A=r.byteOffset;return A%i!==0&&(f=new Uint8Array(f).slice(A,A+c).buffer,A=0),new o(f,A,a)}function Me(r,e,t){var f,A,l,u,B;const n=`TEXCOORD_${e.texCoord||0}`,s=t.attributes[n],o=r.getTypedArrayForAccessor(s),i=r.gltf.json,a=e.index,c=(A=(f=i.textures)==null?void 0:f[a])==null?void 0:A.source;if(typeof c<"u"){const g=(u=(l=i.images)==null?void 0:l[c])==null?void 0:u.mimeType,E=(B=r.gltf.images)==null?void 0:B[c];if(E&&typeof E.width<"u"){const F=[];for(let C=0;C<o.length;C+=2){const P=rr(E,g,o,C,e.channels);F.push(P)}return F}}return[]}function nt(r,e,t,n,s){if(!(t!=null&&t.length))return;const o=[];for(const A of t){let l=n.findIndex(u=>u===A);l===-1&&(l=n.push(A)-1),o.push(l)}const i=new Uint32Array(o),a=r.gltf.buffers.push({arrayBuffer:i.buffer,byteOffset:i.byteOffset,byteLength:i.byteLength})-1,c=r.addBufferView(i,a,0),f=r.addAccessor(c,{size:1,componentType:q(i),count:i.length});s.attributes[e]=f}function rr(r,e,t,n,s=[0]){const o={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},i=t[n],a=t[n+1];let c=1;e&&(e.indexOf("image/jpeg")!==-1||e.indexOf("image/png")!==-1)&&(c=4);const f=sr(i,a,r,c);let A=0;for(const l of s){const u=typeof l=="number"?Object.values(o)[l]:o[l],B=f+u.offset,g=_t(r);if(g.data.length<=B)throw new Error(`${g.data.length} <= ${B}`);const E=g.data[B];A|=E<<u.shift}return A}function sr(r,e,t,n=1){const s=t.width,o=Je(r)*(s-1),i=Math.round(o),a=t.height,c=Je(e)*(a-1),f=Math.round(c),A=t.components?t.components:n;return(f*s+i)*A}function rt(r,e,t,n,s){const o=[];for(let i=0;i<e;i++){const a=t[i],c=t[i+1]-t[i];if(c+a>n)break;const f=a/s,A=c/s;o.push(r.slice(f,f+A))}return o}function st(r,e,t){const n=[];for(let s=0;s<e;s++){const o=s*t;n.push(r.slice(o,o+t))}return n}function ot(r,e,t,n){if(t)throw new Error("Not implemented - arrayOffsets for strings is specified");if(n){const s=[],o=new TextDecoder("utf8");let i=0;for(let a=0;a<r;a++){const c=n[a+1]-n[a];if(c+i<=e.length){const f=e.subarray(i,c+i),A=o.decode(f);s.push(A),i+=c}}return s}return[]}const S="EXT_mesh_features",or=S;async function ir(r,e){const t=new m(r);cr(t,e)}function ar(r,e){const t=new m(r);return Ar(t),t.createBinaryChunk(),t.gltf}function cr(r,e){const t=r.gltf.json;if(t.meshes)for(const n of t.meshes)for(const s of n.primitives)fr(r,s,e)}function fr(r,e,t){var o,i,a;if(!((o=t==null?void 0:t.gltf)!=null&&o.loadBuffers))return;const n=(i=e.extensions)==null?void 0:i[S],s=n==null?void 0:n.featureIds;if(s)for(const c of s){let f;if(typeof c.attribute<"u"){const A=`_FEATURE_ID_${c.attribute}`,l=e.attributes[A];f=r.getTypedArrayForAccessor(l)}else typeof c.texture<"u"&&((a=t==null?void 0:t.gltf)!=null&&a.loadImages)?f=Me(r,c.texture,e):f=[];c.data=f}}function Ar(r,e){const t=r.gltf.json.meshes;if(t)for(const n of t)for(const s of n.primitives)ur(r,s)}function lr(r,e,t,n){e.extensions||(e.extensions={});let s=e.extensions[S];s||(s={featureIds:[]},e.extensions[S]=s);const{featureIds:o}=s,i={featureCount:t.length,propertyTable:n,data:t};o.push(i),r.addObjectExtension(e,S,s)}function ur(r,e){var s;const t=(s=e.extensions)==null?void 0:s[S];if(!t)return;const n=t.featureIds;n.forEach((o,i)=>{if(o.data){const{accessorKey:a,index:c}=dr(e.attributes),f=new Uint32Array(o.data);n[i]={featureCount:f.length,propertyTable:o.propertyTable,attribute:c},r.gltf.buffers.push({arrayBuffer:f.buffer,byteOffset:f.byteOffset,byteLength:f.byteLength});const A=r.addBufferView(f),l=r.addAccessor(A,{size:1,componentType:q(f),count:f.length});e.attributes[a]=l}})}function dr(r){const e="_FEATURE_ID_",t=Object.keys(r).filter(o=>o.indexOf(e)===0);let n=-1;for(const o of t){const i=Number(o.substring(e.length));i>n&&(n=i)}return n++,{accessorKey:`${e}${n}`,index:n}}const Br=Object.freeze(Object.defineProperty({__proto__:null,createExtMeshFeatures:lr,decode:ir,encode:ar,name:or},Symbol.toStringTag,{value:"Module"})),L="EXT_structural_metadata",mr=L;async function Cr(r,e){const t=new m(r);hr(t,e)}function pr(r,e){const t=new m(r);return Lr(t),t.createBinaryChunk(),t.gltf}function hr(r,e){var n,s;if(!((n=e.gltf)!=null&&n.loadBuffers))return;const t=r.getExtension(L);t&&((s=e.gltf)!=null&&s.loadImages&&br(r,t),gr(r,t))}function br(r,e){const t=e.propertyTextures,n=r.gltf.json;if(t&&n.meshes)for(const s of n.meshes)for(const o of s.primitives)Ir(r,t,o,e)}function gr(r,e){const t=e.schema;if(!t)return;const n=t.classes,s=e.propertyTables;if(n&&s)for(const o in n){const i=Er(s,o);i&&Mr(r,t,i)}}function Er(r,e){for(const t of r)if(t.class===e)return t;return null}function Ir(r,e,t,n){var i;if(!e)return;const s=(i=t.extensions)==null?void 0:i[L],o=s==null?void 0:s.propertyTextures;if(o)for(const a of o){const c=e[a];Fr(r,c,t,n)}}function Fr(r,e,t,n){var o;if(!e.properties)return;n.dataAttributeNames||(n.dataAttributeNames=[]);const s=e.class;for(const i in e.properties){const a=`${s}_${i}`,c=(o=e.properties)==null?void 0:o[i];if(!c)continue;c.data||(c.data=[]);const f=c.data,A=Me(r,c,t);A!==null&&(nt(r,a,A,f,t),c.data=f,n.dataAttributeNames.push(a))}}function Mr(r,e,t){var o,i;const n=(o=e.classes)==null?void 0:o[t.class];if(!n)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const s=t.count;for(const a in n.properties){const c=n.properties[a],f=(i=t.properties)==null?void 0:i[a];if(f){const A=Tr(r,e,c,s,f);f.data=A}}}function Tr(r,e,t,n,s){let o=[];const i=s.values,a=r.getTypedArrayForBufferView(i),c=_r(r,t,s,n),f=Rr(r,s,n);switch(t.type){case"SCALAR":case"VEC2":case"VEC3":case"VEC4":case"MAT2":case"MAT3":case"MAT4":{o=yr(t,n,a,c);break}case"BOOLEAN":throw new Error(`Not implemented - classProperty.type=${t.type}`);case"STRING":{o=ot(n,a,c,f);break}case"ENUM":{o=Gr(e,t,n,a,c);break}default:throw new Error(`Unknown classProperty type ${t.type}`)}return o}function _r(r,e,t,n){return e.array&&typeof e.count>"u"&&typeof t.arrayOffsets<"u"?$(r,t.arrayOffsets,t.arrayOffsetType||"UINT32",n):null}function Rr(r,e,t){return typeof e.stringOffsets<"u"?$(r,e.stringOffsets,e.stringOffsetType||"UINT32",t):null}function yr(r,e,t,n){const s=r.array,o=r.count,i=Fe(r.type,r.componentType),a=t.byteLength/i;let c;return r.componentType?c=ee(t,r.type,r.componentType,a):c=t,s?n?rt(c,e,n,t.length,i):o?st(c,e,o):[]:c}function Gr(r,e,t,n,s){var l;const o=e.enumType;if(!o)throw new Error("Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM");const i=(l=r.enums)==null?void 0:l[o];if(!i)throw new Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${o}`);const a=i.valueType||"UINT16",c=Fe(e.type,a),f=n.byteLength/c;let A=ee(n,e.type,a,f);if(A||(A=n),e.array){if(s)return Dr({valuesData:A,numberOfElements:t,arrayOffsets:s,valuesDataBytesLength:n.length,elementSize:c,enumEntry:i});const u=e.count;return u?Sr(A,t,u,i):[]}return Te(A,0,t,i)}function Dr(r){const{valuesData:e,numberOfElements:t,arrayOffsets:n,valuesDataBytesLength:s,elementSize:o,enumEntry:i}=r,a=[];for(let c=0;c<t;c++){const f=n[c],A=n[c+1]-n[c];if(A+f>s)break;const l=f/o,u=A/o,B=Te(e,l,u,i);a.push(B)}return a}function Sr(r,e,t,n){const s=[];for(let o=0;o<e;o++){const i=t*o,a=Te(r,i,t,n);s.push(a)}return s}function Te(r,e,t,n){const s=[];for(let o=0;o<t;o++)if(r instanceof BigInt64Array||r instanceof BigUint64Array)s.push("");else{const i=r[e+o],a=vr(n,i);a?s.push(a.name):s.push("")}return s}function vr(r,e){for(const t of r.values)if(t.value===e)return t;return null}const Or="schemaClassId";function Lr(r,e){var n,s;const t=r.getExtension(L);if(t&&t.propertyTables)for(const o of t.propertyTables){const i=o.class,a=(s=(n=t.schema)==null?void 0:n.classes)==null?void 0:s[i];o.properties&&a&&xr(o,a,r)}}function xr(r,e,t){for(const n in r.properties){const s=r.properties[n].data;if(s){const o=e.properties[n];if(o){const i=Jr(s,o,t);r.properties[n]=i}}}}function Hr(r,e,t=Or){let n=r.getExtension(L);n||(n=r.addExtension(L)),n.schema=Pr(e,t,n.schema);const s=Ur(e,t,n.schema);return n.propertyTables||(n.propertyTables=[]),n.propertyTables.push(s)-1}function Pr(r,e,t){const n=t??{id:"schema_id"},s={properties:{}};for(const o of r){const i={type:o.elementType,componentType:o.componentType};s.properties[o.name]=i}return n.classes={},n.classes[e]=s,n}function Ur(r,e,t){var i;const n={class:e,count:0};let s=0;const o=(i=t.classes)==null?void 0:i[e];for(const a of r){if(s===0&&(s=a.values.length),s!==a.values.length&&a.values.length)throw new Error("Illegal values in attributes");(o==null?void 0:o.properties[a.name])&&(n.properties||(n.properties={}),n.properties[a.name]={values:0,data:a.values})}return n.count=s,n}function Jr(r,e,t){const n={values:0};if(e.type==="STRING"){const{stringData:s,stringOffsets:o}=Kr(r);n.stringOffsets=fe(o,t),n.values=fe(s,t)}else if(e.type==="SCALAR"&&e.componentType){const s=wr(r,e.componentType);n.values=fe(s,t)}return n}const Nr={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function wr(r,e){const t=[];for(const s of r)t.push(Number(s));const n=Nr[e];if(!n)throw new Error("Illegal component type");return new n(t)}function Kr(r){const e=new TextEncoder,t=[];let n=0;for(const c of r){const f=e.encode(c);n+=f.length,t.push(f)}const s=new Uint8Array(n),o=[];let i=0;for(const c of t)s.set(c,i),o.push(i),i+=c.length;o.push(i);const a=new Uint32Array(o);return{stringData:s,stringOffsets:a}}function fe(r,e){return e.gltf.buffers.push({arrayBuffer:r.buffer,byteOffset:r.byteOffset,byteLength:r.byteLength}),e.addBufferView(r)}const jr=Object.freeze(Object.defineProperty({__proto__:null,createExtStructuralMetadata:Hr,decode:Cr,encode:pr,name:mr},Symbol.toStringTag,{value:"Module"})),it="EXT_feature_metadata",Xr=it;async function Qr(r,e){const t=new m(r);Vr(t,e)}function Vr(r,e){var n,s;if(!((n=e.gltf)!=null&&n.loadBuffers))return;const t=r.getExtension(it);t&&((s=e.gltf)!=null&&s.loadImages&&Yr(r,t),Wr(r,t))}function Yr(r,e){const t=e.schema;if(!t)return;const n=t.classes,{featureTextures:s}=e;if(n&&s)for(const o in n){const i=n[o],a=zr(s,o);a&&qr(r,a,i)}}function Wr(r,e){const t=e.schema;if(!t)return;const n=t.classes,s=e.featureTables;if(n&&s)for(const o in n){const i=kr(s,o);i&&Zr(r,t,i)}}function kr(r,e){for(const t in r){const n=r[t];if(n.class===e)return n}return null}function zr(r,e){for(const t in r){const n=r[t];if(n.class===e)return n}return null}function Zr(r,e,t){var o,i;if(!t.class)return;const n=(o=e.classes)==null?void 0:o[t.class];if(!n)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const s=t.count;for(const a in n.properties){const c=n.properties[a],f=(i=t.properties)==null?void 0:i[a];if(f){const A=$r(r,e,c,s,f);f.data=A}}}function qr(r,e,t){var s;const n=e.class;for(const o in t.properties){const i=(s=e==null?void 0:e.properties)==null?void 0:s[o];if(i){const a=ss(r,i,n);i.data=a}}}function $r(r,e,t,n,s){let o=[];const i=s.bufferView,a=r.getTypedArrayForBufferView(i),c=es(r,t,s,n),f=ts(r,t,s,n);return t.type==="STRING"||t.componentType==="STRING"?o=ot(n,a,c,f):ns(t)&&(o=rs(t,n,a,c)),o}function es(r,e,t,n){return e.type==="ARRAY"&&typeof e.componentCount>"u"&&typeof t.arrayOffsetBufferView<"u"?$(r,t.arrayOffsetBufferView,t.offsetType||"UINT32",n):null}function ts(r,e,t,n){return typeof t.stringOffsetBufferView<"u"?$(r,t.stringOffsetBufferView,t.offsetType||"UINT32",n):null}function ns(r){const e=["UINT8","INT16","UINT16","INT32","UINT32","INT64","UINT64","FLOAT32","FLOAT64"];return e.includes(r.type)||typeof r.componentType<"u"&&e.includes(r.componentType)}function rs(r,e,t,n){const s=r.type==="ARRAY",o=r.componentCount,i="SCALAR",a=r.componentType||r.type,c=Fe(i,a),f=t.byteLength/c,A=ee(t,i,a,f);return s?n?rt(A,e,n,t.length,c):o?st(A,e,o):[]:A}function ss(r,e,t){const n=r.gltf.json;if(!n.meshes)return[];const s=[];for(const o of n.meshes)for(const i of o.primitives)os(r,t,e,s,i);return s}function os(r,e,t,n,s){const o={channels:t.channels,...t.texture},i=Me(r,o,s);i&&nt(r,e,i,n,s)}const is=Object.freeze(Object.defineProperty({__proto__:null,decode:Qr,name:Xr},Symbol.toStringTag,{value:"Module"})),as="4.3.3",x=!0,Ne=1735152710,_e=12,z=8,cs=1313821514,fs=5130562,As=0,ls=0,us=1;function ds(r,e=0){return`${String.fromCharCode(r.getUint8(e+0))}${String.fromCharCode(r.getUint8(e+1))}${String.fromCharCode(r.getUint8(e+2))}${String.fromCharCode(r.getUint8(e+3))}`}function Bs(r,e=0,t={}){const n=new DataView(r),{magic:s=Ne}=t,o=n.getUint32(e,!1);return o===s||o===Ne}function ms(r,e,t=0,n={}){const s=new DataView(e),o=ds(s,t+0),i=s.getUint32(t+4,x),a=s.getUint32(t+8,x);switch(Object.assign(r,{header:{byteOffset:t,byteLength:a,hasBinChunk:!1},type:o,version:i,json:{},binChunks:[]}),t+=_e,r.version){case 1:return Cs(r,s,t);case 2:return ps(r,s,t,n={});default:throw new Error(`Invalid GLB version ${r.version}. Only supports version 1 and 2.`)}}function Cs(r,e,t){N(r.header.byteLength>_e+z);const n=e.getUint32(t+0,x),s=e.getUint32(t+4,x);return t+=z,N(s===As),pe(r,e,t,n),t+=n,t+=he(r,e,t,r.header.byteLength),t}function ps(r,e,t,n){return N(r.header.byteLength>_e+z),hs(r,e,t,n),t+r.header.byteLength}function hs(r,e,t,n){for(;t+8<=r.header.byteLength;){const s=e.getUint32(t+0,x),o=e.getUint32(t+4,x);switch(t+=z,o){case cs:pe(r,e,t,s);break;case fs:he(r,e,t,s);break;case ls:n.strict||pe(r,e,t,s);break;case us:n.strict||he(r,e,t,s);break}t+=j(s,4)}return t}function pe(r,e,t,n){const s=new Uint8Array(e.buffer,t,n),i=new TextDecoder("utf8").decode(s);return r.json=JSON.parse(i),j(n,4)}function he(r,e,t,n){return r.header.hasBinChunk=!0,r.binChunks.push({byteOffset:t,byteLength:n,arrayBuffer:e.buffer}),j(n,4)}function at(r,e){if(r.startsWith("data:")||r.startsWith("http:")||r.startsWith("https:"))return r;const n=e.baseUri||e.uri;if(!n)throw new Error(`'baseUri' must be provided to resolve relative url ${r}`);return n.substr(0,n.lastIndexOf("/")+1)+r}const bs="B9h9z9tFBBBF8fL9gBB9gLaaaaaFa9gEaaaB9gFaFa9gEaaaFaEMcBFFFGGGEIIILF9wFFFLEFBFKNFaFCx/IFMO/LFVK9tv9t9vq95GBt9f9f939h9z9t9f9j9h9s9s9f9jW9vq9zBBp9tv9z9o9v9wW9f9kv9j9v9kv9WvqWv94h919m9mvqBF8Z9tv9z9o9v9wW9f9kv9j9v9kv9J9u9kv94h919m9mvqBGy9tv9z9o9v9wW9f9kv9j9v9kv9J9u9kv949TvZ91v9u9jvBEn9tv9z9o9v9wW9f9kv9j9v9kv69p9sWvq9P9jWBIi9tv9z9o9v9wW9f9kv9j9v9kv69p9sWvq9R919hWBLn9tv9z9o9v9wW9f9kv9j9v9kv69p9sWvq9F949wBKI9z9iqlBOc+x8ycGBM/qQFTa8jUUUUBCU/EBlHL8kUUUUBC9+RKGXAGCFJAI9LQBCaRKAE2BBC+gF9HQBALAEAIJHOAGlAGTkUUUBRNCUoBAG9uC/wgBZHKCUGAKCUG9JyRVAECFJRICBRcGXEXAcAF9PQFAVAFAclAcAVJAF9JyRMGXGXAG9FQBAMCbJHKC9wZRSAKCIrCEJCGrRQANCUGJRfCBRbAIRTEXGXAOATlAQ9PQBCBRISEMATAQJRIGXAS9FQBCBRtCBREEXGXAOAIlCi9PQBCBRISLMANCU/CBJAEJRKGXGXGXGXGXATAECKrJ2BBAtCKZrCEZfIBFGEBMAKhB83EBAKCNJhB83EBSEMAKAI2BIAI2BBHmCKrHYAYCE6HYy86BBAKCFJAICIJAYJHY2BBAmCIrCEZHPAPCE6HPy86BBAKCGJAYAPJHY2BBAmCGrCEZHPAPCE6HPy86BBAKCEJAYAPJHY2BBAmCEZHmAmCE6Hmy86BBAKCIJAYAmJHY2BBAI2BFHmCKrHPAPCE6HPy86BBAKCLJAYAPJHY2BBAmCIrCEZHPAPCE6HPy86BBAKCKJAYAPJHY2BBAmCGrCEZHPAPCE6HPy86BBAKCOJAYAPJHY2BBAmCEZHmAmCE6Hmy86BBAKCNJAYAmJHY2BBAI2BGHmCKrHPAPCE6HPy86BBAKCVJAYAPJHY2BBAmCIrCEZHPAPCE6HPy86BBAKCcJAYAPJHY2BBAmCGrCEZHPAPCE6HPy86BBAKCMJAYAPJHY2BBAmCEZHmAmCE6Hmy86BBAKCSJAYAmJHm2BBAI2BEHICKrHYAYCE6HYy86BBAKCQJAmAYJHm2BBAICIrCEZHYAYCE6HYy86BBAKCfJAmAYJHm2BBAICGrCEZHYAYCE6HYy86BBAKCbJAmAYJHK2BBAICEZHIAICE6HIy86BBAKAIJRISGMAKAI2BNAI2BBHmCIrHYAYCb6HYy86BBAKCFJAICNJAYJHY2BBAmCbZHmAmCb6Hmy86BBAKCGJAYAmJHm2BBAI2BFHYCIrHPAPCb6HPy86BBAKCEJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCIJAmAYJHm2BBAI2BGHYCIrHPAPCb6HPy86BBAKCLJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCKJAmAYJHm2BBAI2BEHYCIrHPAPCb6HPy86BBAKCOJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCNJAmAYJHm2BBAI2BIHYCIrHPAPCb6HPy86BBAKCVJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCcJAmAYJHm2BBAI2BLHYCIrHPAPCb6HPy86BBAKCMJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCSJAmAYJHm2BBAI2BKHYCIrHPAPCb6HPy86BBAKCQJAmAPJHm2BBAYCbZHYAYCb6HYy86BBAKCfJAmAYJHm2BBAI2BOHICIrHYAYCb6HYy86BBAKCbJAmAYJHK2BBAICbZHIAICb6HIy86BBAKAIJRISFMAKAI8pBB83BBAKCNJAICNJ8pBB83BBAICTJRIMAtCGJRtAECTJHEAS9JQBMMGXAIQBCBRISEMGXAM9FQBANAbJ2BBRtCBRKAfREEXAEANCU/CBJAKJ2BBHTCFrCBATCFZl9zAtJHt86BBAEAGJREAKCFJHKAM9HQBMMAfCFJRfAIRTAbCFJHbAG9HQBMMABAcAG9sJANCUGJAMAG9sTkUUUBpANANCUGJAMCaJAG9sJAGTkUUUBpMAMCBAIyAcJRcAIQBMC9+RKSFMCBC99AOAIlAGCAAGCA9Ly6yRKMALCU/EBJ8kUUUUBAKM+OmFTa8jUUUUBCoFlHL8kUUUUBC9+RKGXAFCE9uHOCtJAI9LQBCaRKAE2BBHNC/wFZC/gF9HQBANCbZHVCF9LQBALCoBJCgFCUFT+JUUUBpALC84Jha83EBALC8wJha83EBALC8oJha83EBALCAJha83EBALCiJha83EBALCTJha83EBALha83ENALha83EBAEAIJC9wJRcAECFJHNAOJRMGXAF9FQBCQCbAVCF6yRSABRECBRVCBRQCBRfCBRICBRKEXGXAMAcuQBC9+RKSEMGXGXAN2BBHOC/vF9LQBALCoBJAOCIrCa9zAKJCbZCEWJHb8oGIRTAb8oGBRtGXAOCbZHbAS9PQBALAOCa9zAIJCbZCGWJ8oGBAVAbyROAb9FRbGXGXAGCG9HQBABAt87FBABCIJAO87FBABCGJAT87FBSFMAEAtjGBAECNJAOjGBAECIJATjGBMAVAbJRVALCoBJAKCEWJHmAOjGBAmATjGIALAICGWJAOjGBALCoBJAKCFJCbZHKCEWJHTAtjGBATAOjGIAIAbJRIAKCFJRKSGMGXGXAbCb6QBAQAbJAbC989zJCFJRQSFMAM1BBHbCgFZROGXGXAbCa9MQBAMCFJRMSFMAM1BFHbCgBZCOWAOCgBZqROGXAbCa9MQBAMCGJRMSFMAM1BGHbCgBZCfWAOqROGXAbCa9MQBAMCEJRMSFMAM1BEHbCgBZCdWAOqROGXAbCa9MQBAMCIJRMSFMAM2BIC8cWAOqROAMCLJRMMAOCFrCBAOCFZl9zAQJRQMGXGXAGCG9HQBABAt87FBABCIJAQ87FBABCGJAT87FBSFMAEAtjGBAECNJAQjGBAECIJATjGBMALCoBJAKCEWJHOAQjGBAOATjGIALAICGWJAQjGBALCoBJAKCFJCbZHKCEWJHOAtjGBAOAQjGIAICFJRIAKCFJRKSFMGXAOCDF9LQBALAIAcAOCbZJ2BBHbCIrHTlCbZCGWJ8oGBAVCFJHtATyROALAIAblCbZCGWJ8oGBAtAT9FHmJHtAbCbZHTyRbAT9FRTGXGXAGCG9HQBABAV87FBABCIJAb87FBABCGJAO87FBSFMAEAVjGBAECNJAbjGBAECIJAOjGBMALAICGWJAVjGBALCoBJAKCEWJHYAOjGBAYAVjGIALAICFJHICbZCGWJAOjGBALCoBJAKCFJCbZCEWJHYAbjGBAYAOjGIALAIAmJCbZHICGWJAbjGBALCoBJAKCGJCbZHKCEWJHOAVjGBAOAbjGIAKCFJRKAIATJRIAtATJRVSFMAVCBAM2BBHYyHTAOC/+F6HPJROAYCbZRtGXGXAYCIrHmQBAOCFJRbSFMAORbALAIAmlCbZCGWJ8oGBROMGXGXAtQBAbCFJRVSFMAbRVALAIAYlCbZCGWJ8oGBRbMGXGXAP9FQBAMCFJRYSFMAM1BFHYCgFZRTGXGXAYCa9MQBAMCGJRYSFMAM1BGHYCgBZCOWATCgBZqRTGXAYCa9MQBAMCEJRYSFMAM1BEHYCgBZCfWATqRTGXAYCa9MQBAMCIJRYSFMAM1BIHYCgBZCdWATqRTGXAYCa9MQBAMCLJRYSFMAMCKJRYAM2BLC8cWATqRTMATCFrCBATCFZl9zAQJHQRTMGXGXAmCb6QBAYRPSFMAY1BBHMCgFZROGXGXAMCa9MQBAYCFJRPSFMAY1BFHMCgBZCOWAOCgBZqROGXAMCa9MQBAYCGJRPSFMAY1BGHMCgBZCfWAOqROGXAMCa9MQBAYCEJRPSFMAY1BEHMCgBZCdWAOqROGXAMCa9MQBAYCIJRPSFMAYCLJRPAY2BIC8cWAOqROMAOCFrCBAOCFZl9zAQJHQROMGXGXAtCb6QBAPRMSFMAP1BBHMCgFZRbGXGXAMCa9MQBAPCFJRMSFMAP1BFHMCgBZCOWAbCgBZqRbGXAMCa9MQBAPCGJRMSFMAP1BGHMCgBZCfWAbqRbGXAMCa9MQBAPCEJRMSFMAP1BEHMCgBZCdWAbqRbGXAMCa9MQBAPCIJRMSFMAPCLJRMAP2BIC8cWAbqRbMAbCFrCBAbCFZl9zAQJHQRbMGXGXAGCG9HQBABAT87FBABCIJAb87FBABCGJAO87FBSFMAEATjGBAECNJAbjGBAECIJAOjGBMALCoBJAKCEWJHYAOjGBAYATjGIALAICGWJATjGBALCoBJAKCFJCbZCEWJHYAbjGBAYAOjGIALAICFJHICbZCGWJAOjGBALCoBJAKCGJCbZCEWJHOATjGBAOAbjGIALAIAm9FAmCb6qJHICbZCGWJAbjGBAIAt9FAtCb6qJRIAKCEJRKMANCFJRNABCKJRBAECSJREAKCbZRKAICbZRIAfCEJHfAF9JQBMMCBC99AMAc6yRKMALCoFJ8kUUUUBAKM/tIFGa8jUUUUBCTlRLC9+RKGXAFCLJAI9LQBCaRKAE2BBC/+FZC/QF9HQBALhB83ENAECFJRKAEAIJC98JREGXAF9FQBGXAGCG6QBEXGXAKAE9JQBC9+bMAK1BBHGCgFZRIGXGXAGCa9MQBAKCFJRKSFMAK1BFHGCgBZCOWAICgBZqRIGXAGCa9MQBAKCGJRKSFMAK1BGHGCgBZCfWAIqRIGXAGCa9MQBAKCEJRKSFMAK1BEHGCgBZCdWAIqRIGXAGCa9MQBAKCIJRKSFMAK2BIC8cWAIqRIAKCLJRKMALCNJAICFZCGWqHGAICGrCBAICFrCFZl9zAG8oGBJHIjGBABAIjGBABCIJRBAFCaJHFQBSGMMEXGXAKAE9JQBC9+bMAK1BBHGCgFZRIGXGXAGCa9MQBAKCFJRKSFMAK1BFHGCgBZCOWAICgBZqRIGXAGCa9MQBAKCGJRKSFMAK1BGHGCgBZCfWAIqRIGXAGCa9MQBAKCEJRKSFMAK1BEHGCgBZCdWAIqRIGXAGCa9MQBAKCIJRKSFMAK2BIC8cWAIqRIAKCLJRKMABAICGrCBAICFrCFZl9zALCNJAICFZCGWqHI8oGBJHG87FBAIAGjGBABCGJRBAFCaJHFQBMMCBC99AKAE6yRKMAKM+lLKFaF99GaG99FaG99GXGXAGCI9HQBAF9FQFEXGXGX9DBBB8/9DBBB+/ABCGJHG1BB+yAB1BBHE+yHI+L+TABCFJHL1BBHK+yHO+L+THN9DBBBB9gHVyAN9DBB/+hANAN+U9DBBBBANAVyHcAc+MHMAECa3yAI+SHIAI+UAcAMAKCa3yAO+SHcAc+U+S+S+R+VHO+U+SHN+L9DBBB9P9d9FQBAN+oRESFMCUUUU94REMAGAE86BBGXGX9DBBB8/9DBBB+/Ac9DBBBB9gyAcAO+U+SHN+L9DBBB9P9d9FQBAN+oRGSFMCUUUU94RGMALAG86BBGXGX9DBBB8/9DBBB+/AI9DBBBB9gyAIAO+U+SHN+L9DBBB9P9d9FQBAN+oRGSFMCUUUU94RGMABAG86BBABCIJRBAFCaJHFQBSGMMAF9FQBEXGXGX9DBBB8/9DBBB+/ABCIJHG8uFB+yAB8uFBHE+yHI+L+TABCGJHL8uFBHK+yHO+L+THN9DBBBB9gHVyAN9DB/+g6ANAN+U9DBBBBANAVyHcAc+MHMAECa3yAI+SHIAI+UAcAMAKCa3yAO+SHcAc+U+S+S+R+VHO+U+SHN+L9DBBB9P9d9FQBAN+oRESFMCUUUU94REMAGAE87FBGXGX9DBBB8/9DBBB+/Ac9DBBBB9gyAcAO+U+SHN+L9DBBB9P9d9FQBAN+oRGSFMCUUUU94RGMALAG87FBGXGX9DBBB8/9DBBB+/AI9DBBBB9gyAIAO+U+SHN+L9DBBB9P9d9FQBAN+oRGSFMCUUUU94RGMABAG87FBABCNJRBAFCaJHFQBMMM/SEIEaE99EaF99GXAF9FQBCBREABRIEXGXGX9D/zI818/AICKJ8uFBHLCEq+y+VHKAI8uFB+y+UHO9DB/+g6+U9DBBB8/9DBBB+/AO9DBBBB9gy+SHN+L9DBBB9P9d9FQBAN+oRVSFMCUUUU94RVMAICIJ8uFBRcAICGJ8uFBRMABALCFJCEZAEqCFWJAV87FBGXGXAKAM+y+UHN9DB/+g6+U9DBBB8/9DBBB+/AN9DBBBB9gy+SHS+L9DBBB9P9d9FQBAS+oRMSFMCUUUU94RMMABALCGJCEZAEqCFWJAM87FBGXGXAKAc+y+UHK9DB/+g6+U9DBBB8/9DBBB+/AK9DBBBB9gy+SHS+L9DBBB9P9d9FQBAS+oRcSFMCUUUU94RcMABALCaJCEZAEqCFWJAc87FBGXGX9DBBU8/AOAO+U+TANAN+U+TAKAK+U+THO9DBBBBAO9DBBBB9gy+R9DB/+g6+U9DBBB8/+SHO+L9DBBB9P9d9FQBAO+oRcSFMCUUUU94RcMABALCEZAEqCFWJAc87FBAICNJRIAECIJREAFCaJHFQBMMM9JBGXAGCGrAF9sHF9FQBEXABAB8oGBHGCNWCN91+yAGCi91CnWCUUU/8EJ+++U84GBABCIJRBAFCaJHFQBMMM9TFEaCBCB8oGUkUUBHFABCEJC98ZJHBjGUkUUBGXGXAB8/BCTWHGuQBCaREABAGlCggEJCTrXBCa6QFMAFREMAEM/lFFFaGXGXAFABqCEZ9FQBABRESFMGXGXAGCT9PQBABRESFMABREEXAEAF8oGBjGBAECIJAFCIJ8oGBjGBAECNJAFCNJ8oGBjGBAECSJAFCSJ8oGBjGBAECTJREAFCTJRFAGC9wJHGCb9LQBMMAGCI9JQBEXAEAF8oGBjGBAFCIJRFAECIJREAGC98JHGCE9LQBMMGXAG9FQBEXAEAF2BB86BBAECFJREAFCFJRFAGCaJHGQBMMABMoFFGaGXGXABCEZ9FQBABRESFMAFCgFZC+BwsN9sRIGXGXAGCT9PQBABRESFMABREEXAEAIjGBAECSJAIjGBAECNJAIjGBAECIJAIjGBAECTJREAGC9wJHGCb9LQBMMAGCI9JQBEXAEAIjGBAECIJREAGC98JHGCE9LQBMMGXAG9FQBEXAEAF86BBAECFJREAGCaJHGQBMMABMMMFBCUNMIT9kBB",gs="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",Es=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),Is=new Uint8Array([32,0,65,253,3,1,2,34,4,106,6,5,11,8,7,20,13,33,12,16,128,9,116,64,19,113,127,15,10,21,22,14,255,66,24,54,136,107,18,23,192,26,114,118,132,17,77,101,130,144,27,87,131,44,45,74,156,154,70,167]),Fs={0:"",1:"meshopt_decodeFilterOct",2:"meshopt_decodeFilterQuat",3:"meshopt_decodeFilterExp",NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},Ms={0:"meshopt_decodeVertexBuffer",1:"meshopt_decodeIndexBuffer",2:"meshopt_decodeIndexSequence",ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"};async function Ts(r,e,t,n,s,o="NONE"){const i=await _s();Gs(i,i.exports[Ms[s]],r,e,t,n,i.exports[Fs[o||"NONE"]])}let Ae;async function _s(){return Ae||(Ae=Rs()),Ae}async function Rs(){let r=bs;WebAssembly.validate(Es)&&(r=gs,console.log("Warning: meshopt_decoder is using experimental SIMD support"));const e=await WebAssembly.instantiate(ys(r),{});return await e.instance.exports.__wasm_call_ctors(),e.instance}function ys(r){const e=new Uint8Array(r.length);for(let n=0;n<r.length;++n){const s=r.charCodeAt(n);e[n]=s>96?s-71:s>64?s-65:s>47?s+4:s>46?63:62}let t=0;for(let n=0;n<r.length;++n)e[t++]=e[n]<60?Is[e[n]]:(e[n]-60)*64+e[++n];return e.buffer.slice(0,t)}function Gs(r,e,t,n,s,o,i){const a=r.exports.sbrk,c=n+3&-4,f=a(c*s),A=a(o.length),l=new Uint8Array(r.exports.memory.buffer);l.set(o,A);const u=e(f,n,s,A,o.length);if(u===0&&i&&i(f,c,s),t.set(l.subarray(f,f+n*s)),a(f-a(0)),u!==0)throw new Error(`Malformed buffer data: ${u}`)}const Z="EXT_meshopt_compression",Ds=Z;async function Ss(r,e){var s,o;const t=new m(r);if(!((s=e==null?void 0:e.gltf)!=null&&s.decompressMeshes)||!((o=e.gltf)!=null&&o.loadBuffers))return;const n=[];for(const i of r.json.bufferViews||[])n.push(vs(t,i));await Promise.all(n),t.removeExtension(Z)}async function vs(r,e){const t=r.getObjectExtension(e,Z);if(t){const{byteOffset:n=0,byteLength:s=0,byteStride:o,count:i,mode:a,filter:c="NONE",buffer:f}=t,A=r.gltf.buffers[f],l=new Uint8Array(A.arrayBuffer,A.byteOffset+n,s),u=new Uint8Array(r.gltf.buffers[e.buffer].arrayBuffer,e.byteOffset,e.byteLength);await Ts(u,i,o,l,a,c),r.removeObjectExtension(e,Z)}}const Os=Object.freeze(Object.defineProperty({__proto__:null,decode:Ss,name:Ds},Symbol.toStringTag,{value:"Module"})),D="EXT_texture_webp",Ls=D;function xs(r,e){const t=new m(r);if(!Yt("image/webp")){if(t.getRequiredExtensions().includes(D))throw new Error(`gltf: Required extension ${D} not supported by browser`);return}const{json:n}=t;for(const s of n.textures||[]){const o=t.getObjectExtension(s,D);o&&(s.source=o.source),t.removeObjectExtension(s,D)}t.removeExtension(D)}const Hs=Object.freeze(Object.defineProperty({__proto__:null,name:Ls,preprocess:xs},Symbol.toStringTag,{value:"Module"})),Y="KHR_texture_basisu",Ps=Y;function Us(r,e){const t=new m(r),{json:n}=t;for(const s of n.textures||[]){const o=t.getObjectExtension(s,Y);o&&(s.source=o.source,t.removeObjectExtension(s,Y))}t.removeExtension(Y)}const Js=Object.freeze(Object.defineProperty({__proto__:null,name:Ps,preprocess:Us},Symbol.toStringTag,{value:"Module"})),Ns="4.3.3",ws={dataType:null,batchType:null,name:"Draco",id:"draco",module:"draco",version:Ns,worker:!0,extensions:["drc"],mimeTypes:["application/octet-stream"],binary:!0,tests:["DRACO"],options:{draco:{decoderType:typeof WebAssembly=="object"?"wasm":"js",libraryPath:"libs/",extraAttributes:{},attributeNameEntry:void 0}}};function Ks(r,e,t){const n=ct(e.metadata),s=[],o=js(e.attributes);for(const i in r){const a=r[i],c=we(i,a,o[i]);s.push(c)}if(t){const i=we("indices",t);s.push(i)}return{fields:s,metadata:n}}function js(r){const e={};for(const t in r){const n=r[t];e[n.name||"undefined"]=n}return e}function we(r,e,t){const n=t?ct(t.metadata):void 0;return Qt(r,e,n)}function ct(r){Object.entries(r);const e={};for(const t in r)e[`${t}.string`]=JSON.stringify(r[t]);return e}const Ke={POSITION:"POSITION",NORMAL:"NORMAL",COLOR:"COLOR_0",TEX_COORD:"TEXCOORD_0"},Xs={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},Qs=4;class Vs{constructor(e){d(this,"draco");d(this,"decoder");d(this,"metadataQuerier");this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){const n=new this.draco.DecoderBuffer;n.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);const s=this.decoder.GetEncodedGeometryType(n),o=s===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let i;switch(s){case this.draco.TRIANGULAR_MESH:i=this.decoder.DecodeBufferToMesh(n,o);break;case this.draco.POINT_CLOUD:i=this.decoder.DecodeBufferToPointCloud(n,o);break;default:throw new Error("DRACO: Unknown geometry type.")}if(!i.ok()||!o.ptr){const u=`DRACO decompression failed: ${i.error_msg()}`;throw new Error(u)}const a=this._getDracoLoaderData(o,s,t),c=this._getMeshData(o,a,t),f=pt(c.attributes),A=Ks(c.attributes,a,c.indices);return{loader:"draco",loaderData:a,header:{vertexCount:o.num_points(),boundingBox:f},...c,schema:A}}finally{this.draco.destroy(n),o&&this.draco.destroy(o)}}_getDracoLoaderData(e,t,n){const s=this._getTopLevelMetadata(e),o=this._getDracoAttributes(e,n);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:s,attributes:o}}_getDracoAttributes(e,t){const n={};for(let s=0;s<e.num_attributes();s++){const o=this.decoder.GetAttribute(e,s),i=this._getAttributeMetadata(e,s);n[o.unique_id()]={unique_id:o.unique_id(),attribute_type:o.attribute_type(),data_type:o.data_type(),num_components:o.num_components(),byte_offset:o.byte_offset(),byte_stride:o.byte_stride(),normalized:o.normalized(),attribute_index:s,metadata:i};const a=this._getQuantizationTransform(o,t);a&&(n[o.unique_id()].quantization_transform=a);const c=this._getOctahedronTransform(o,t);c&&(n[o.unique_id()].octahedron_transform=c)}return n}_getMeshData(e,t,n){const s=this._getMeshAttributes(t,e,n);if(!s.POSITION)throw new Error("DRACO: No position attribute found.");if(e instanceof this.draco.Mesh)switch(n.topology){case"triangle-strip":return{topology:"triangle-strip",mode:4,attributes:s,indices:{value:this._getTriangleStripIndices(e),size:1}};case"triangle-list":default:return{topology:"triangle-list",mode:5,attributes:s,indices:{value:this._getTriangleListIndices(e),size:1}}}return{topology:"point-list",mode:0,attributes:s}}_getMeshAttributes(e,t,n){const s={};for(const o of Object.values(e.attributes)){const i=this._deduceAttributeName(o,n);o.name=i;const a=this._getAttributeValues(t,o);if(a){const{value:c,size:f}=a;s[i]={value:c,size:f,byteOffset:o.byte_offset,byteStride:o.byte_stride,normalized:o.normalized}}}return s}_getTriangleListIndices(e){const n=e.num_faces()*3,s=n*Qs,o=this.draco._malloc(s);try{return this.decoder.GetTrianglesUInt32Array(e,s,o),new Uint32Array(this.draco.HEAPF32.buffer,o,n).slice()}finally{this.draco._free(o)}}_getTriangleStripIndices(e){const t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),ks(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){const n=Xs[t.data_type];if(!n)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;const s=t.num_components,i=e.num_points()*s,a=i*n.BYTES_PER_ELEMENT,c=Ys(this.draco,n);let f;const A=this.draco._malloc(a);try{const l=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,l,c,a,A),f=new n(this.draco.HEAPF32.buffer,A,i).slice()}finally{this.draco._free(A)}return{value:f,size:s}}_deduceAttributeName(e,t){const n=e.unique_id;for(const[i,a]of Object.entries(t.extraAttributes||{}))if(a===n)return i;const s=e.attribute_type;for(const i in Ke)if(this.draco[i]===s)return Ke[i];const o=t.attributeNameEntry||"name";return e.metadata[o]?e.metadata[o].string:`CUSTOM_ATTRIBUTE_${n}`}_getTopLevelMetadata(e){const t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){const n=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(n)}_getDracoMetadata(e){if(!e||!e.ptr)return{};const t={},n=this.metadataQuerier.NumEntries(e);for(let s=0;s<n;s++){const o=this.metadataQuerier.GetEntryName(e,s);t[o]=this._getDracoMetadataField(e,o)}return t}_getDracoMetadataField(e,t){const n=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,n);const s=Ws(n);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:s}}finally{this.draco.destroy(n)}}_disableAttributeTransforms(e){const{quantizedAttributes:t=[],octahedronAttributes:n=[]}=e,s=[...t,...n];for(const o of s)this.decoder.SkipAttributeTransform(this.draco[o])}_getQuantizationTransform(e,t){const{quantizedAttributes:n=[]}=t,s=e.attribute_type();if(n.map(i=>this.decoder[i]).includes(s)){const i=new this.draco.AttributeQuantizationTransform;try{if(i.InitFromAttribute(e))return{quantization_bits:i.quantization_bits(),range:i.range(),min_values:new Float32Array([1,2,3]).map(a=>i.min_value(a))}}finally{this.draco.destroy(i)}}return null}_getOctahedronTransform(e,t){const{octahedronAttributes:n=[]}=t,s=e.attribute_type();if(n.map(i=>this.decoder[i]).includes(s)){const i=new this.draco.AttributeQuantizationTransform;try{if(i.InitFromAttribute(e))return{quantization_bits:i.quantization_bits()}}finally{this.draco.destroy(i)}}return null}}function Ys(r,e){switch(e){case Float32Array:return r.DT_FLOAT32;case Int8Array:return r.DT_INT8;case Int16Array:return r.DT_INT16;case Int32Array:return r.DT_INT32;case Uint8Array:return r.DT_UINT8;case Uint16Array:return r.DT_UINT16;case Uint32Array:return r.DT_UINT32;default:return r.DT_INVALID}}function Ws(r){const e=r.size(),t=new Int32Array(e);for(let n=0;n<e;n++)t[n]=r.GetValue(n);return t}function ks(r){const e=r.size(),t=new Int32Array(e);for(let n=0;n<e;n++)t[n]=r.GetValue(n);return t}const zs="1.5.6",Zs="1.4.1",le=`https://www.gstatic.com/draco/versioned/decoders/${zs}`,p={DECODER:"draco_wasm_wrapper.js",DECODER_WASM:"draco_decoder.wasm",FALLBACK_DECODER:"draco_decoder.js",ENCODER:"draco_encoder.js"},ue={[p.DECODER]:`${le}/${p.DECODER}`,[p.DECODER_WASM]:`${le}/${p.DECODER_WASM}`,[p.FALLBACK_DECODER]:`${le}/${p.FALLBACK_DECODER}`,[p.ENCODER]:`https://raw.githubusercontent.com/google/draco/${Zs}/javascript/${p.ENCODER}`};let de;async function qs(r){const e=r.modules||{};return e.draco3d?de||(de=e.draco3d.createDecoderModule({}).then(t=>({draco:t}))):de||(de=$s(r)),await de}async function $s(r){let e,t;switch(r.draco&&r.draco.decoderType){case"js":e=await y(ue[p.FALLBACK_DECODER],"draco",r,p.FALLBACK_DECODER);break;case"wasm":default:[e,t]=await Promise.all([await y(ue[p.DECODER],"draco",r,p.DECODER),await y(ue[p.DECODER_WASM],"draco",r,p.DECODER_WASM)])}return e=e||globalThis.DracoDecoderModule,await eo(e,t)}function eo(r,e){const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r({...t,onModuleLoaded:s=>n({draco:s})})})}const to={...ws,parse:no};async function no(r,e){const{draco:t}=await qs(e),n=new Vs(t);try{return n.parseSync(r,e==null?void 0:e.draco)}finally{n.destroy()}}function ro(r){const e={};for(const t in r){const n=r[t];if(t!=="indices"){const s=ft(n);e[t]=s}}return e}function ft(r){const{buffer:e,size:t,count:n}=so(r);return{value:e,size:t,byteOffset:0,count:n,type:$e(t),componentType:q(e)}}function so(r){let e=r,t=1,n=0;return r&&r.value&&(e=r.value,t=r.size||1),e&&(ArrayBuffer.isView(e)||(e=oo(e,Float32Array)),n=e.length/t),{buffer:e,size:t,count:n}}function oo(r,e,t=!1){return r?Array.isArray(r)?new e(r):t&&!(r instanceof e)?new e(r):r:null}const M="KHR_draco_mesh_compression",io=M;function ao(r,e,t){const n=new m(r);for(const s of At(n))n.getObjectExtension(s,M)}async function co(r,e,t){var o;if(!((o=e==null?void 0:e.gltf)!=null&&o.decompressMeshes))return;const n=new m(r),s=[];for(const i of At(n))n.getObjectExtension(i,M)&&s.push(Ao(n,i,e,t));await Promise.all(s),n.removeExtension(M)}function fo(r,e={}){const t=new m(r);for(const n of t.json.meshes||[])lo(n),t.addRequiredExtension(M)}async function Ao(r,e,t,n){const s=r.getObjectExtension(e,M);if(!s)return;const o=r.getTypedArrayForBufferView(s.bufferView),i=Qe(o.buffer,o.byteOffset),a={...t};delete a["3d-tiles"];const c=await Ve(i,to,a,n),f=ro(c.attributes);for(const[A,l]of Object.entries(f))if(A in e.attributes){const u=e.attributes[A],B=r.getAccessor(u);B!=null&&B.min&&(B!=null&&B.max)&&(l.min=B.min,l.max=B.max)}e.attributes=f,c.indices&&(e.indices=ft(c.indices)),r.removeObjectExtension(e,M),uo(e)}function lo(r,e,t=4,n,s){var A;if(!n.DracoWriter)throw new Error("options.gltf.DracoWriter not provided");const o=n.DracoWriter.encodeSync({attributes:r}),i=(A=s==null?void 0:s.parseSync)==null?void 0:A.call(s,{attributes:r}),a=n._addFauxAttributes(i.attributes),c=n.addBufferView(o);return{primitives:[{attributes:a,mode:t,extensions:{[M]:{bufferView:c,attributes:a}}}]}}function uo(r){if(!r.attributes&&Object.keys(r.attributes).length>0)throw new Error("glTF: Empty primitive detected: Draco decompression failure?")}function*At(r){for(const e of r.json.meshes||[])for(const t of e.primitives)yield t}const Bo=Object.freeze(Object.defineProperty({__proto__:null,decode:co,encode:fo,name:io,preprocess:ao},Symbol.toStringTag,{value:"Module"})),te="KHR_texture_transform",mo=te,V=new R,Co=new Ee,po=new Ee;async function ho(r,e){var o;if(!new m(r).hasExtension(te)||!((o=e.gltf)!=null&&o.loadBuffers))return;const s=r.json.materials||[];for(let i=0;i<s.length;i++)bo(i,r)}function bo(r,e){var o,i,a,c;const t=(o=e.json.materials)==null?void 0:o[r],n=[(i=t==null?void 0:t.pbrMetallicRoughness)==null?void 0:i.baseColorTexture,t==null?void 0:t.emissiveTexture,t==null?void 0:t.normalTexture,t==null?void 0:t.occlusionTexture,(a=t==null?void 0:t.pbrMetallicRoughness)==null?void 0:a.metallicRoughnessTexture],s=[];for(const f of n)f&&((c=f==null?void 0:f.extensions)!=null&&c[te])&&go(e,r,f,s)}function go(r,e,t,n){const s=Eo(t,n);if(!s)return;const o=r.json.meshes||[];for(const i of o)for(const a of i.primitives){const c=a.material;Number.isFinite(c)&&e===c&&Io(r,a,s)}}function Eo(r,e){var i;const t=(i=r.extensions)==null?void 0:i[te],{texCoord:n=0}=r,{texCoord:s=n}=t;if(!(e.findIndex(([a,c])=>a===n&&c===s)!==-1)){const a=To(t);return n!==s&&(r.texCoord=s),e.push([n,s]),{originalTexCoord:n,texCoord:s,matrix:a}}return null}function Io(r,e,t){var a,c;const{originalTexCoord:n,texCoord:s,matrix:o}=t,i=e.attributes[`TEXCOORD_${n}`];if(Number.isFinite(i)){const f=(a=r.json.accessors)==null?void 0:a[i];if(f&&f.bufferView){const A=(c=r.json.bufferViews)==null?void 0:c[f.bufferView];if(A){const{arrayBuffer:l,byteOffset:u}=r.buffers[A.buffer],B=(u||0)+(f.byteOffset||0)+(A.byteOffset||0),{ArrayType:g,length:E}=Ie(f,A),F=qe[f.componentType],C=Ze[f.type],P=A.byteStride||F*C,ne=new Float32Array(E);for(let X=0;X<f.count;X++){const Re=new g(l,B+X*P,2);V.set(Re[0],Re[1],1),V.transformByMatrix3(o),ne.set([V[0],V[1]],X*C)}n===s?Fo(f,A,r.buffers,ne):Mo(s,f,e,r,ne)}}}}function Fo(r,e,t,n){r.componentType=5126,t.push({arrayBuffer:n.buffer,byteOffset:0,byteLength:n.buffer.byteLength}),e.buffer=t.length-1,e.byteLength=n.buffer.byteLength,e.byteOffset=0,delete e.byteStride}function Mo(r,e,t,n,s){n.buffers.push({arrayBuffer:s.buffer,byteOffset:0,byteLength:s.buffer.byteLength});const o=n.json.bufferViews;if(!o)return;o.push({buffer:n.buffers.length-1,byteLength:s.buffer.byteLength,byteOffset:0});const i=n.json.accessors;i&&(i.push({bufferView:(o==null?void 0:o.length)-1,byteOffset:0,componentType:5126,count:e.count,type:"VEC2"}),t.attributes[`TEXCOORD_${r}`]=i.length-1)}function To(r){const{offset:e=[0,0],rotation:t=0,scale:n=[1,1]}=r,s=new Ee().set(1,0,0,0,1,0,e[0],e[1],1),o=Co.set(Math.cos(t),Math.sin(t),0,-Math.sin(t),Math.cos(t),0,0,0,1),i=po.set(n[0],0,0,0,n[1],0,0,0,1);return s.multiplyRight(o).multiplyRight(i)}const _o=Object.freeze(Object.defineProperty({__proto__:null,decode:ho,name:mo},Symbol.toStringTag,{value:"Module"})),_="KHR_lights_punctual",Ro=_;async function yo(r){const e=new m(r),{json:t}=e,n=e.getExtension(_);n&&(e.json.lights=n.lights,e.removeExtension(_));for(const s of t.nodes||[]){const o=e.getObjectExtension(s,_);o&&(s.light=o.light),e.removeObjectExtension(s,_)}}async function Go(r){const e=new m(r),{json:t}=e;if(t.lights){const n=e.addExtension(_);b(!n.lights),n.lights=t.lights,delete t.lights}if(e.json.lights){for(const n of e.json.lights){const s=n.node;e.addObjectExtension(s,_,n)}delete e.json.lights}}const Do=Object.freeze(Object.defineProperty({__proto__:null,decode:yo,encode:Go,name:Ro},Symbol.toStringTag,{value:"Module"})),w="KHR_materials_unlit",So=w;async function vo(r){const e=new m(r),{json:t}=e;for(const n of t.materials||[])n.extensions&&n.extensions.KHR_materials_unlit&&(n.unlit=!0),e.removeObjectExtension(n,w);e.removeExtension(w)}function Oo(r){const e=new m(r),{json:t}=e;if(e.materials)for(const n of t.materials||[])n.unlit&&(delete n.unlit,e.addObjectExtension(n,w,{}),e.addExtension(w))}const Lo=Object.freeze(Object.defineProperty({__proto__:null,decode:vo,encode:Oo,name:So},Symbol.toStringTag,{value:"Module"})),U="KHR_techniques_webgl",xo=U;async function Ho(r){const e=new m(r),{json:t}=e,n=e.getExtension(U);if(n){const s=Uo(n,e);for(const o of t.materials||[]){const i=e.getObjectExtension(o,U);i&&(o.technique=Object.assign({},i,s[i.technique]),o.technique.values=Jo(o.technique,e)),e.removeObjectExtension(o,U)}e.removeExtension(U)}}async function Po(r,e){}function Uo(r,e){const{programs:t=[],shaders:n=[],techniques:s=[]}=r,o=new TextDecoder;return n.forEach(i=>{if(Number.isFinite(i.bufferView))i.code=o.decode(e.getTypedArrayForBufferView(i.bufferView));else throw new Error("KHR_techniques_webgl: no shader code")}),t.forEach(i=>{i.fragmentShader=n[i.fragmentShader],i.vertexShader=n[i.vertexShader]}),s.forEach(i=>{i.program=t[i.program]}),s}function Jo(r,e){const t=Object.assign({},r.values);return Object.keys(r.uniforms||{}).forEach(n=>{r.uniforms[n].value&&!(n in t)&&(t[n]=r.uniforms[n].value)}),Object.keys(t).forEach(n=>{typeof t[n]=="object"&&t[n].index!==void 0&&(t[n].texture=e.getTexture(t[n].index))}),t}const No=Object.freeze(Object.defineProperty({__proto__:null,decode:Ho,encode:Po,name:xo},Symbol.toStringTag,{value:"Module"})),lt=[jr,Br,Os,Hs,Js,Bo,Do,Lo,No,_o,is];function wo(r,e={},t){var s;const n=lt.filter(o=>ut(o.name,e));for(const o of n)(s=o.preprocess)==null||s.call(o,r,e,t)}async function Ko(r,e={},t){var s;const n=lt.filter(o=>ut(o.name,e));for(const o of n)await((s=o.decode)==null?void 0:s.call(o,r,e,t))}function ut(r,e){var s;const t=((s=e==null?void 0:e.gltf)==null?void 0:s.excludeExtensions)||{};return!(r in t&&!t[r])}const Be="KHR_binary_glTF";function jo(r){const e=new m(r),{json:t}=e;for(const n of t.images||[]){const s=e.getObjectExtension(n,Be);s&&Object.assign(n,s),e.removeObjectExtension(n,Be)}t.buffers&&t.buffers[0]&&delete t.buffers[0].uri,e.removeExtension(Be)}const je={accessors:"accessor",animations:"animation",buffers:"buffer",bufferViews:"bufferView",images:"image",materials:"material",meshes:"mesh",nodes:"node",samplers:"sampler",scenes:"scene",skins:"skin",textures:"texture"},Xo={accessor:"accessors",animations:"animation",buffer:"buffers",bufferView:"bufferViews",image:"images",material:"materials",mesh:"meshes",node:"nodes",sampler:"samplers",scene:"scenes",skin:"skins",texture:"textures"};class Qo{constructor(){d(this,"idToIndexMap",{animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}});d(this,"json")}normalize(e,t){this.json=e.json;const n=e.json;switch(n.asset&&n.asset.version){case"2.0":return;case void 0:case"1.0":break;default:console.warn(`glTF: Unknown version ${n.asset.version}`);return}if(!t.normalize)throw new Error("glTF v1 is not supported.");console.warn("Converting glTF v1 to glTF v2 format. This is experimental and may fail."),this._addAsset(n),this._convertTopLevelObjectsToArrays(n),jo(e),this._convertObjectIdsToArrayIndices(n),this._updateObjects(n),this._updateMaterial(n)}_addAsset(e){e.asset=e.asset||{},e.asset.version="2.0",e.asset.generator=e.asset.generator||"Normalized to glTF 2.0 by loaders.gl"}_convertTopLevelObjectsToArrays(e){for(const t in je)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){const n=e[t];if(!(!n||Array.isArray(n))){e[t]=[];for(const s in n){const o=n[s];o.id=o.id||s;const i=e[t].length;e[t].push(o),this.idToIndexMap[t][s]=i}}}_convertObjectIdsToArrayIndices(e){for(const t in je)this._convertIdsToIndices(e,t);"scene"in e&&(e.scene=this._convertIdToIndex(e.scene,"scene"));for(const t of e.textures)this._convertTextureIds(t);for(const t of e.meshes)this._convertMeshIds(t);for(const t of e.nodes)this._convertNodeIds(t);for(const t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&(e.source=this._convertIdToIndex(e.source,"image"))}_convertMeshIds(e){for(const t of e.primitives){const{attributes:n,indices:s,material:o}=t;for(const i in n)n[i]=this._convertIdToIndex(n[i],"accessor");s&&(t.indices=this._convertIdToIndex(s,"accessor")),o&&(t.material=this._convertIdToIndex(o,"material"))}}_convertNodeIds(e){e.children&&(e.children=e.children.map(t=>this._convertIdToIndex(t,"node"))),e.meshes&&(e.meshes=e.meshes.map(t=>this._convertIdToIndex(t,"mesh")))}_convertSceneIds(e){e.nodes&&(e.nodes=e.nodes.map(t=>this._convertIdToIndex(t,"node")))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(const n of e[t])for(const s in n){const o=n[s],i=this._convertIdToIndex(o,s);n[s]=i}}_convertIdToIndex(e,t){const n=Xo[t];if(n in this.idToIndexMap){const s=this.idToIndexMap[n][e];if(!Number.isFinite(s))throw new Error(`gltf v1: failed to resolve ${t} with id ${e}`);return s}return e}_updateObjects(e){for(const t of this.json.buffers)delete t.type}_updateMaterial(e){var t,n,s;for(const o of e.materials){o.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};const i=((t=o.values)==null?void 0:t.tex)||((n=o.values)==null?void 0:n.texture2d_0)||((s=o.values)==null?void 0:s.diffuseTex),a=e.textures.findIndex(c=>c.id===i);a!==-1&&(o.pbrMetallicRoughness.baseColorTexture={index:a})}}}function Vo(r,e={}){return new Qo().normalize(r,e)}async function Yo(r,e,t=0,n,s){var o,i,a;return Wo(r,e,t,n),Vo(r,{normalize:(o=n==null?void 0:n.gltf)==null?void 0:o.normalize}),wo(r,n,s),(i=n==null?void 0:n.gltf)!=null&&i.loadBuffers&&r.json.buffers&&await ko(r,n,s),(a=n==null?void 0:n.gltf)!=null&&a.loadImages&&await zo(r,n,s),await Ko(r,n,s),r}function Wo(r,e,t,n){if(n.uri&&(r.baseUri=n.uri),e instanceof ArrayBuffer&&!Bs(e,t,n)&&(e=new TextDecoder().decode(e)),typeof e=="string")r.json=Kt(e);else if(e instanceof ArrayBuffer){const i={};t=ms(i,e,t,n.glb),b(i.type==="glTF",`Invalid GLB magic string ${i.type}`),r._glb=i,r.json=i.json}else b(!1,"GLTF: must be ArrayBuffer or string");const s=r.json.buffers||[];if(r.buffers=new Array(s.length).fill(null),r._glb&&r._glb.header.hasBinChunk){const{binChunks:i}=r._glb;r.buffers[0]={arrayBuffer:i[0].arrayBuffer,byteOffset:i[0].byteOffset,byteLength:i[0].byteLength}}const o=r.json.images||[];r.images=new Array(o.length).fill({})}async function ko(r,e,t){var s,o;const n=r.json.buffers||[];for(let i=0;i<n.length;++i){const a=n[i];if(a.uri){const{fetch:c}=t;b(c);const f=at(a.uri,e),A=await((s=t==null?void 0:t.fetch)==null?void 0:s.call(t,f)),l=await((o=A==null?void 0:A.arrayBuffer)==null?void 0:o.call(A));r.buffers[i]={arrayBuffer:l,byteOffset:0,byteLength:l.byteLength},delete a.uri}else r.buffers[i]===null&&(r.buffers[i]={arrayBuffer:new ArrayBuffer(a.byteLength),byteOffset:0,byteLength:a.byteLength})}}async function zo(r,e,t){const n=Zo(r),s=r.json.images||[],o=[];for(const i of n)o.push(qo(r,s[i],i,e,t));return await Promise.all(o)}function Zo(r){const e=new Set,t=r.json.textures||[];for(const n of t)n.source!==void 0&&e.add(n.source);return Array.from(e).sort()}async function qo(r,e,t,n,s){let o;if(e.uri&&!e.hasOwnProperty("bufferView")){const a=at(e.uri,n),{fetch:c}=s;o=await(await c(a)).arrayBuffer(),e.bufferView={data:o}}if(Number.isFinite(e.bufferView)){const a=$n(r.json,r.buffers,e.bufferView);o=Qe(a.buffer,a.byteOffset,a.byteLength)}b(o,"glTF image has no data");let i=await Ve(o,[Rt,Cn],{...n,mimeType:e.mimeType,basis:n.basis||{format:ke()}},s);i&&i[0]&&(i={compressed:!0,mipmaps:!1,width:i[0].width,height:i[0].height,data:i[0]}),r.images=r.images||[],r.images[t]=i}const be={dataType:null,batchType:null,name:"glTF",id:"gltf",module:"gltf",version:as,extensions:["gltf","glb"],mimeTypes:["model/gltf+json","model/gltf-binary"],text:!0,binary:!0,tests:["glTF"],parse:$o,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0},log:console}};async function $o(r,e={},t){e={...be.options,...e},e.gltf={...be.options.gltf,...e.gltf};const{byteOffset:n=0}=e;return await Yo({},r,n,e,t)}const ei={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},ti={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},I={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},ni={magFilter:I.TEXTURE_MAG_FILTER,minFilter:I.TEXTURE_MIN_FILTER,wrapS:I.TEXTURE_WRAP_S,wrapT:I.TEXTURE_WRAP_T},ri={[I.TEXTURE_MAG_FILTER]:I.LINEAR,[I.TEXTURE_MIN_FILTER]:I.NEAREST_MIPMAP_LINEAR,[I.TEXTURE_WRAP_S]:I.REPEAT,[I.TEXTURE_WRAP_T]:I.REPEAT};function si(){return{id:"default-sampler",parameters:ri}}function oi(r){return ti[r]}function ii(r){return ei[r]}class ai{constructor(){d(this,"baseUri","");d(this,"jsonUnprocessed");d(this,"json");d(this,"buffers",[]);d(this,"images",[])}postProcess(e,t={}){const{json:n,buffers:s=[],images:o=[]}=e,{baseUri:i=""}=e;return b(n),this.baseUri=i,this.buffers=s,this.images=o,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){const n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((s,o)=>this._resolveBufferView(s,o))),e.images&&(n.images=e.images.map((s,o)=>this._resolveImage(s,o))),e.samplers&&(n.samplers=e.samplers.map((s,o)=>this._resolveSampler(s,o))),e.textures&&(n.textures=e.textures.map((s,o)=>this._resolveTexture(s,o))),e.accessors&&(n.accessors=e.accessors.map((s,o)=>this._resolveAccessor(s,o))),e.materials&&(n.materials=e.materials.map((s,o)=>this._resolveMaterial(s,o))),e.meshes&&(n.meshes=e.meshes.map((s,o)=>this._resolveMesh(s,o))),e.nodes&&(n.nodes=e.nodes.map((s,o)=>this._resolveNode(s,o)),n.nodes=n.nodes.map((s,o)=>this._resolveNodeChildren(s))),e.skins&&(n.skins=e.skins.map((s,o)=>this._resolveSkin(s,o))),e.scenes&&(n.scenes=e.scenes.map((s,o)=>this._resolveScene(s,o))),typeof this.json.scene=="number"&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t=="object")return t;const n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(n=>this.getNode(n))}}_resolveNode(e,t){const n={...e,id:(e==null?void 0:e.id)||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((s,o)=>{const i=this.getMesh(o);return s.id=i.id,s.primitives=s.primitives.concat(i.primitives),s},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&(e.children=e.children.map(t=>this.getNode(t))),e}_resolveSkin(e,t){const n=typeof e.inverseBindMatrices=="number"?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){const n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map(s=>{const o={...s,attributes:{},indices:void 0,material:void 0},i=s.attributes;for(const a in i)o.attributes[a]=this.getAccessor(i[a]);return s.indices!==void 0&&(o.indices=this.getAccessor(s.indices)),s.material!==void 0&&(o.material=this.getMaterial(s.material)),o})),n}_resolveMaterial(e,t){const n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||(n.emissiveFactor=n.emissiveTexture?[1,1,1]:[0,0,0]),n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};const s=n.pbrMetallicRoughness;s.baseColorTexture&&(s.baseColorTexture={...s.baseColorTexture},s.baseColorTexture.texture=this.getTexture(s.baseColorTexture.index)),s.metallicRoughnessTexture&&(s.metallicRoughnessTexture={...s.metallicRoughnessTexture},s.metallicRoughnessTexture.texture=this.getTexture(s.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){const n=oi(e.componentType),s=ii(e.type),o=n*s,i={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:s,bytesPerElement:o,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(i.bufferView=this.getBufferView(e.bufferView)),i.bufferView){const a=i.bufferView.buffer,{ArrayType:c,byteLength:f}=Ie(i,i.bufferView),A=(i.bufferView.byteOffset||0)+(i.byteOffset||0)+a.byteOffset;let l=a.arrayBuffer.slice(A,A+f);i.bufferView.byteStride&&(l=this._getValueFromInterleavedBuffer(a,A,i.bufferView.byteStride,i.bytesPerElement,i.count)),i.value=new c(l)}return i}_getValueFromInterleavedBuffer(e,t,n,s,o){const i=new Uint8Array(o*s);for(let a=0;a<o;a++){const c=t+a*n;i.set(new Uint8Array(e.arrayBuffer.slice(c,c+s)),a*s)}return i.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler=="number"?this.getSampler(e.sampler):si(),source:typeof e.source=="number"?this.getImage(e.source):void 0}}_resolveSampler(e,t){const n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(const s in n){const o=this._enumSamplerParameter(s);o!==void 0&&(n.parameters[o]=n[s])}return n}_enumSamplerParameter(e){return ni[e]}_resolveImage(e,t){const n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView!==void 0?this.getBufferView(e.bufferView):void 0},s=this.images[t];return s&&(n.image=s),n}_resolveBufferView(e,t){const n=e.buffer,s=this.buffers[n].arrayBuffer;let o=this.buffers[n].byteOffset||0;return e.byteOffset&&(o+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(s,o,e.byteLength)}}_resolveCamera(e,t){const n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}}function ci(r,e){return new ai().postProcess(r,e)}async function fi(r){const e=[];return r.scenes.forEach(t=>{t.traverse(n=>{})}),await Ai(()=>e.some(t=>!t.loaded))}async function Ai(r){for(;r();)await new Promise(e=>requestAnimationFrame(e))}const Xe=`uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  bool composeModelMatrix;
} scenegraph;
`,li={name:"scenegraph",vs:Xe,fs:Xe,uniformTypes:{sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},ui=`#version 300 es
#define SHADER_NAME scenegraph-layer-vertex-shader
in vec3 instancePositions;
in vec3 instancePositions64Low;
in vec4 instanceColors;
in vec3 instancePickingColors;
in vec3 instanceModelMatrixCol0;
in vec3 instanceModelMatrixCol1;
in vec3 instanceModelMatrixCol2;
in vec3 instanceTranslation;
in vec3 positions;
#ifdef HAS_UV
in vec2 texCoords;
#endif
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
in vec3 normals;
#endif
#endif
out vec4 vColor;
#ifndef LIGHTING_PBR
#ifdef HAS_UV
out vec2 vTEXCOORD_0;
#endif
#endif
void main(void) {
#if defined(HAS_UV) && !defined(LIGHTING_PBR)
vTEXCOORD_0 = texCoords;
geometry.uv = texCoords;
#endif
geometry.worldPosition = instancePositions;
geometry.pickingColor = instancePickingColors;
mat3 instanceModelMatrix = mat3(instanceModelMatrixCol0, instanceModelMatrixCol1, instanceModelMatrixCol2);
vec3 normal = vec3(0.0, 0.0, 1.0);
#ifdef LIGHTING_PBR
#ifdef HAS_NORMALS
normal = instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(normals, 0.0)).xyz;
#endif
#endif
float originalSize = project_size_to_pixel(scenegraph.sizeScale);
float clampedSize = clamp(originalSize, scenegraph.sizeMinPixels, scenegraph.sizeMaxPixels);
vec3 pos = (instanceModelMatrix * (scenegraph.sceneModelMatrix * vec4(positions, 1.0)).xyz) * scenegraph.sizeScale * (clampedSize / originalSize) + instanceTranslation;
if(scenegraph.composeModelMatrix) {
DECKGL_FILTER_SIZE(pos, geometry);
geometry.normal = project_normal(normal);
geometry.worldPosition += pos;
gl_Position = project_position_to_clipspace(pos + instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
}
else {
pos = project_size(pos);
DECKGL_FILTER_SIZE(pos, geometry);
gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, pos, geometry.position);
geometry.normal = project_normal(normal);
}
DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
#ifdef LIGHTING_PBR
pbr_vPosition = geometry.position.xyz;
#ifdef HAS_NORMALS
pbr_vNormal = geometry.normal;
#endif
#ifdef HAS_UV
pbr_vUV = texCoords;
#else
pbr_vUV = vec2(0., 0.);
#endif
geometry.uv = pbr_vUV;
#endif
vColor = instanceColors;
DECKGL_FILTER_COLOR(vColor, geometry);
}
`,di=`#version 300 es
#define SHADER_NAME scenegraph-layer-fragment-shader
in vec4 vColor;
out vec4 fragColor;
#ifndef LIGHTING_PBR
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
in vec2 vTEXCOORD_0;
uniform sampler2D pbr_baseColorSampler;
#endif
#endif
void main(void) {
#ifdef LIGHTING_PBR
fragColor = vColor * pbr_filterColor(vec4(0));
geometry.uv = pbr_vUV;
#else
#if defined(HAS_UV) && defined(HAS_BASECOLORMAP)
fragColor = vColor * texture(pbr_baseColorSampler, vTEXCOORD_0);
geometry.uv = vTEXCOORD_0;
#else
fragColor = vColor;
#endif
#endif
fragColor.a *= layer.opacity;
DECKGL_FILTER_COLOR(fragColor, geometry);
}
`,dt=[255,255,255,255],Bi={scenegraph:{type:"object",value:null,async:!0},getScene:r=>r&&r.scenes?typeof r.scene=="object"?r.scene:r.scenes[r.scene||0]:r,getAnimator:r=>r&&r.animator,_animations:null,sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},getPosition:{type:"accessor",value:r=>r.position},getColor:{type:"accessor",value:dt},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[be]};class Bt extends yt{getShaders(){const e={};let t;this.props._lighting==="pbr"?(t=Ye,e.LIGHTING_PBR=1):t={name:"pbrMaterial"};const n=[Gt,Dt,li,t];return super.getShaders({defines:e,vs:ui,fs:di,modules:n})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),accessor:"getPosition",transition:!0},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:dt,transition:!0},instanceModelMatrix:ht})}updateState(e){super.updateState(e);const{props:t,oldProps:n}=e;t.scenegraph!==n.scenegraph?this._updateScenegraph():t._animations!==n._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){var t;super.finalizeState(e),(t=this.state.scenegraph)==null||t.destroy()}get isLoaded(){var e;return!!((e=this.state)!=null&&e.scenegraph&&super.isLoaded)}_updateScenegraph(){var a;const e=this.props,{device:t}=this.context;let n=null;if(e.scenegraph instanceof W)n={scenes:[e.scenegraph]};else if(e.scenegraph&&typeof e.scenegraph=="object"){const c=e.scenegraph,f=c.json?ci(c):c,A=Vn(t,f,this._getModelOptions());n={gltf:f,...A},fi(A).then(()=>{this.setNeedsRedraw()}).catch(l=>{this.raiseError(l,"loading glTF")})}const s={layer:this,device:this.context.device},o=e.getScene(n,s),i=e.getAnimator(n,s);if(o instanceof H){(a=this.state.scenegraph)==null||a.destroy(),this._applyAnimationsProp(i,e._animations);const c=[];o.traverse(f=>{f instanceof me&&c.push(f.model)}),this.setState({scenegraph:o,animator:i,models:c}),this.getAttributeManager().invalidateAll()}else o!==null&&re.warn("invalid scenegraph:",o)()}_applyAnimationsProp(e,t){if(!e||!t)return;const n=e.getAnimations();Object.keys(t).sort().forEach(s=>{const o=t[s];if(s==="*")n.forEach(i=>{Object.assign(i,o)});else if(Number.isFinite(Number(s))){const i=Number(s);i>=0&&i<n.length?Object.assign(n[i],o):re.warn(`animation ${s} not found`)()}else{const i=n.find(({animation:a})=>a.name===s);i?Object.assign(i,o):re.warn(`animation ${s} not found`)()}})}_getModelOptions(){const{_imageBasedLightingEnvironment:e}=this.props;let t;return e&&(typeof e=="function"?t=e({gl:this.context.gl,layer:this}):t=e),{imageBasedLightingEnvironment:t,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.animate(e.timeline.getTime()),this.setNeedsRedraw());const{viewport:t,renderPass:n}=this.context,{sizeScale:s,sizeMinPixels:o,sizeMaxPixels:i,coordinateSystem:a}=this.props,c={camera:t.cameraPosition},f=this.getNumInstances();this.state.scenegraph.traverse((A,{worldMatrix:l})=>{if(A instanceof me){const{model:u}=A;u.setInstanceCount(f);const B={sizeScale:s,sizeMinPixels:o,sizeMaxPixels:i,composeModelMatrix:bt(t,a),sceneModelMatrix:l};u.shaderInputs.setProps({pbrProjection:c,scenegraph:B}),u.draw(n)}})}}Bt.defaultProps=Bi;Bt.layerName="ScenegraphLayer";export{to as D,be as G,Bt as S,gn as a,Ve as b,ci as c,Ii as g,Ye as p};
