import{M as ht,s as gt}from"./matrix-Ba-izLHt.js";import{ar as x,as as Et,at as It,au as Ce,al as J,av as Ft,Y as G,a3 as T,u as Mt,a as D,b as Tt,aw as _t,ax as Rt,ay as Z,ap as We,ac as yt,az as Gt,L as Dt,p as vt,d as ne}from"./mapbox-overlay-CxTWue1x.js";import{p as St}from"./picking-CN0D5Hbh.js";import{l as xt}from"./lighting-Cu1Oz65y.js";import{G as Ot}from"./geometry-TT6-M3o5.js";import{Q as Lt,M as he}from"./quaternion-DExcOjez.js";async function ke(r,e,t,n){return n._parse(r,e,t,n)}function Ht(r){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,r)}function Pt(r){return globalThis.loaders?.modules?.[r]||null}const re={};function ze(r={}){const e=r.useLocalLibraries??r.core?.useLocalLibraries,t=r.CDN??r.core?.CDN,n=r.modules;return{...e!==void 0?{useLocalLibraries:e}:{},...t!==void 0?{CDN:t}:{},...n!==void 0?{modules:n}:{}}}async function E(r,e=null,t={},n=null){return e&&(r=Ut(r,e,t,n)),re[r]=re[r]||Nt(r),await re[r]}function Ut(r,e,t={},n=null){if(t?.core)throw new Error("loadLibrary: options.core must be pre-normalized");if(!t.useLocalLibraries&&r.startsWith("http"))return r;n=n||r;const o=t.modules||{};return o[n]?o[n]:x?t.CDN?(Et(t.CDN.startsWith("http")),`${t.CDN}/${e}@${It}/dist/libs/${n}`):Ce?`../src/libs/${n}`:`modules/${e}/src/libs/${n}`:`modules/${e}/dist/libs/${n}`}async function Nt(r){if(r.endsWith("wasm"))return await wt(r);if(!x){const{requireFromFile:t}=globalThis.loaders||{};try{const n=await t?.(r);return n||!r.includes("/dist/libs/")?n:await t?.(r.replace("/dist/libs/","/src/libs/"))}catch(n){if(r.includes("/dist/libs/"))try{return await t?.(r.replace("/dist/libs/","/src/libs/"))}catch{}return console.error(n),null}}if(Ce)return importScripts(r);const e=await jt(r);return Jt(e,r)}function Jt(r,e){if(!x){const{requireFromString:n}=globalThis.loaders||{};return n?.(r,e)}if(Ce)return eval.call(globalThis,r),null;const t=document.createElement("script");t.id=e;try{t.appendChild(document.createTextNode(r))}catch{t.text=r}return document.body.appendChild(t),null}async function wt(r){const{readFileAsArrayBuffer:e}=globalThis.loaders||{};if(x||!e||r.startsWith("http"))return await(await fetch(r)).arrayBuffer();try{return await e(r)}catch{if(r.includes("/dist/libs/"))return await e(r.replace("/dist/libs/","/src/libs/"));throw new Error(`Failed to load ArrayBuffer from ${r}`)}}async function jt(r){const{readFileAsText:e}=globalThis.loaders||{};if(x||!e||r.startsWith("http"))return await(await fetch(r)).text();try{return await e(r)}catch{if(r.includes("/dist/libs/"))return await e(r.replace("/dist/libs/","/src/libs/"));throw new Error(`Failed to load text from ${r}`)}}function Kt(r,e=5){return typeof r=="string"?r.slice(0,e):ArrayBuffer.isView(r)?_e(r.buffer,r.byteOffset,e):r instanceof ArrayBuffer?_e(r,0,e):""}function _e(r,e,t){if(r.byteLength<=e+t)return"";const n=new DataView(r);let o="";for(let s=0;s<t;s++)o+=String.fromCharCode(n.getUint8(e+s));return o}function Vt(r){try{return JSON.parse(r)}catch{throw new Error(`Failed to parse JSON from data starting with "${Kt(r)}"`)}}function j(r,e){return J(r>=0),J(e>0),r+(e-1)&-4}function Xt(r,e,t){let n;if(r instanceof ArrayBuffer)n=new Uint8Array(r);else{const o=r.byteOffset,s=r.byteLength;n=new Uint8Array(r.buffer||r.arrayBuffer,o,s)}return e.set(n,t),t+j(n.byteLength,4)}function Qt(r){switch(r.constructor){case Int8Array:return"int8";case Uint8Array:case Uint8ClampedArray:return"uint8";case Int16Array:return"int16";case Uint16Array:return"uint16";case Int32Array:return"int32";case Uint32Array:return"uint32";case Float32Array:return"float32";case Float64Array:return"float64";default:return"null"}}function Yt(r){let e=1/0,t=1/0,n=1/0,o=-1/0,s=-1/0,i=-1/0;const a=r.POSITION?r.POSITION.value:[],c=a&&a.length;for(let f=0;f<c;f+=3){const u=a[f],l=a[f+1],A=a[f+2];e=u<e?u:e,t=l<t?l:t,n=A<n?A:n,o=u>o?u:o,s=l>s?l:s,i=A>i?A:i}return[[e,t,n],[o,s,i]]}function Wt(r,e,t){const n=Qt(e.value),o=t||kt(e);return{name:r,type:{type:"fixed-size-list",listSize:e.size,children:[{name:"value",type:n}]},nullable:!1,metadata:o}}function kt(r){const e={};return"byteOffset"in r&&(e.byteOffset=r.byteOffset.toString(10)),"byteStride"in r&&(e.byteStride=r.byteStride.toString(10)),"normalized"in r&&(e.normalized=r.normalized.toString()),e}const oe={};function zt(r){if(oe[r]===void 0){const e=Ft?qt(r):Zt(r);oe[r]=e}return oe[r]}function Zt(r){const e=["image/png","image/jpeg","image/gif"],t=globalThis.loaders?.imageFormatsNode||e;return!!globalThis.loaders?.parseImageNode&&t.includes(r)}function qt(r){switch(r){case"image/avif":case"image/webp":return $t(r);default:return!0}}function $t(r){try{return document.createElement("canvas").toDataURL(r).indexOf(`data:${r}`)===0}catch{return!1}}const en=`out vec3 pbr_vPosition;
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
`,tn=`precision highp float;

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
`,nn=`struct PBRFragmentInputs {
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
`,Re=`uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,rn={name:"pbrProjection",vs:Re,fs:Re,getUniforms:r=>r,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<i32>"}},Ze={props:{},uniforms:{},name:"pbrMaterial",dependencies:[xt,rn],source:nn,vs:en,fs:tn,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:r=>r,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>"}};class Y{id;matrix=new G;display=!0;position=new T;rotation=new T;scale=new T(1,1,1);userData={};props={};constructor(e={}){const{id:t}=e;this.id=t||Mt(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return this.position=e,this}setRotation(e){return this.rotation=e,this}setScale(e){return this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){const{position:t,rotation:n,scale:o,update:s=!0}=e;return t&&this.setPosition(t),n&&this.setRotation(n),o&&this.setScale(o),s&&this.updateMatrix(),this}updateMatrix(){const e=this.position,t=this.rotation,n=this.scale;return this.matrix.identity(),this.matrix.translate(e),this.matrix.rotateXYZ(t),this.matrix.scale(n),this}update(e={}){const{position:t,rotation:n,scale:o}=e;return t&&this.setPosition(t),n&&this.setRotation(n),o&&this.setScale(o),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;const n=new G(e).multiplyRight(t),o=n.invert(),s=o.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:n,worldInverseMatrix:o,worldInverseTransposeMatrix:s}}_setScenegraphNodeProps(e){"position"in e&&this.setPosition(e.position),"rotation"in e&&this.setRotation(e.rotation),"scale"in e&&this.setScale(e.scale),"matrix"in e&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}class O extends Y{children;constructor(e={}){e=Array.isArray(e)?{children:e}:e;const{children:t=[]}=e;D.assert(t.every(n=>n instanceof Y),"every child must an instance of ScenegraphNode"),super(e),this.children=t}getBounds(){const e=[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]];return this.traverse((t,{worldMatrix:n})=>{const o=t.getBounds();if(!o)return;const[s,i]=o,a=new T(s).add(i).divide([2,2,2]);n.transformAsPoint(a,a);const c=new T(i).subtract(s).divide([2,2,2]);n.transformAsVector(c,c);for(let f=0;f<8;f++){const u=new T(f&1?-1:1,f&2?-1:1,f&4?-1:1).multiply(c).add(a);for(let l=0;l<3;l++)e[0][l]=Math.min(e[0][l],u[l]),e[1][l]=Math.max(e[1][l],u[l])}}),Number.isFinite(e[0][0])?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(const t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){const t=this.children,n=t.indexOf(e);return n>-1&&t.splice(n,1),this}removeAll(){return this.children=[],this}traverse(e,{worldMatrix:t=new G}={}){const n=new G(t).multiplyRight(this.matrix);for(const o of this.children)o instanceof O?o.traverse(e,{worldMatrix:n}):e(o,{worldMatrix:n})}}class de extends Y{model;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.bounds=e.bounds||null,this.setProps(e)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}}const on="4.4.1",W={TRANSCODER:"basis_transcoder.js",TRANSCODER_WASM:"basis_transcoder.wasm",ENCODER:"basis_encoder.js",ENCODER_WASM:"basis_encoder.wasm"};let ye;async function Ge(r){Ht(r.modules);const e=Pt("basis");return e||(ye||=sn(r),await ye)}async function sn(r){let e=null,t=null;return[e,t]=await Promise.all([await E(W.TRANSCODER,"textures",r),await E(W.TRANSCODER_WASM,"textures",r)]),e=e||globalThis.BASIS,await an(e,t)}function an(r,e){const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r(t).then(o=>{const{BasisFile:s,initializeBasis:i}=o;i(),n({BasisFile:s})})})}let se;async function De(r){const e=r.modules||{};return e.basisEncoder?e.basisEncoder:(se=se||cn(r),await se)}async function cn(r){let e=null,t=null;return[e,t]=await Promise.all([await E(W.ENCODER,"textures",r),await E(W.ENCODER_WASM,"textures",r)]),e=e||globalThis.BASIS,await fn(e,t)}function fn(r,e){const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r(t).then(o=>{const{BasisFile:s,KTX2File:i,initializeBasis:a,BasisEncoder:c}=o;a(),n({BasisFile:s,KTX2File:i,BasisEncoder:c})})})}const un=32854,ln=32856,ve=36194,An=33776,dn=33779,Bn=37493,mn=35840,bn=35842,pn=36196,Cn=35986,hn=34798,gn=37808,En=36283,In=36285,Se=36492,Fn=["","WEBKIT_","MOZ_"],xe={WEBGL_compressed_texture_s3tc:["bc1-rgb-unorm-webgl","bc1-rgba-unorm","bc2-rgba-unorm","bc3-rgba-unorm"],WEBGL_compressed_texture_s3tc_srgb:["bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm-srgb","bc2-rgba-unorm-srgb","bc3-rgba-unorm-srgb"],EXT_texture_compression_rgtc:["bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm"],EXT_texture_compression_bptc:["bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb"],WEBGL_compressed_texture_etc1:["etc1-rgb-unorm-webgl"],WEBGL_compressed_texture_etc:["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"],WEBGL_compressed_texture_pvrtc:["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"],WEBGL_compressed_texture_atc:["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"],WEBGL_compressed_texture_astc:["astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"]};let V=null;function Mn(r){if(!V){r=r||Tn()||void 0,V=new Set;for(const e of Fn)for(const t in xe)if(r&&r.getExtension(`${e}${t}`))for(const n of xe[t])V.add(n)}return V}function Tn(){try{return document.createElement("canvas").getContext("webgl")}catch{return null}}const b=[171,75,84,88,32,50,48,187,13,10,26,10];function _n(r){const e=new Uint8Array(r);return!(e.byteLength<b.length||e[0]!==b[0]||e[1]!==b[1]||e[2]!==b[2]||e[3]!==b[3]||e[4]!==b[4]||e[5]!==b[5]||e[6]!==b[6]||e[7]!==b[7]||e[8]!==b[8]||e[9]!==b[9]||e[10]!==b[10]||e[11]!==b[11])}let Oe=Promise.resolve();const qe={etc1:{basisFormat:0,compressed:!0,format:pn,textureFormat:"etc1-rgb-unorm-webgl"},etc2:{basisFormat:1,compressed:!0,format:Bn,textureFormat:"etc2-rgba8unorm"},bc1:{basisFormat:2,compressed:!0,format:An,textureFormat:"bc1-rgb-unorm-webgl"},bc3:{basisFormat:3,compressed:!0,format:dn,textureFormat:"bc3-rgba-unorm"},bc4:{basisFormat:4,compressed:!0,format:En,textureFormat:"bc4-r-unorm"},bc5:{basisFormat:5,compressed:!0,format:In,textureFormat:"bc5-rg-unorm"},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:Se,textureFormat:"bc7-rgba-unorm"},"bc7-m5":{basisFormat:7,compressed:!0,format:Se,textureFormat:"bc7-rgba-unorm"},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:mn,textureFormat:"pvrtc-rgb4unorm-webgl"},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:bn,textureFormat:"pvrtc-rgba4unorm-webgl"},"astc-4x4":{basisFormat:10,compressed:!0,format:gn,textureFormat:"astc-4x4-unorm"},"atc-rgb":{basisFormat:11,compressed:!0,format:Cn,textureFormat:"atc-rgb-unorm-webgl"},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:hn,textureFormat:"atc-rgbai-unorm-webgl"},rgba32:{basisFormat:13,compressed:!1,format:ln,textureFormat:"rgba8unorm"},rgb565:{basisFormat:14,compressed:!1,format:ve,textureFormat:"rgb565unorm-webgl"},bgr565:{basisFormat:15,compressed:!1,format:ve,textureFormat:"rgb565unorm-webgl"},rgba4444:{basisFormat:16,compressed:!1,format:un,textureFormat:"rgba4unorm-webgl"}};Object.freeze(Object.keys(qe));async function Rn(r){const e=Oe;let t;Oe=new Promise(n=>{t=n}),await e;try{return await r()}finally{t()}}async function yn(r,e={}){const t=ze(e);return await Rn(async()=>{if(!e.basis?.containerFormat||e.basis.containerFormat==="auto"){if(_n(r)){const o=await De(t);return Le(o.KTX2File,r,e)}const{BasisFile:n}=await Ge(t);return ie(n,r,e)}if(e.basis.module==="encoder"){const n=await De(t);return e.basis.containerFormat==="ktx2"?Le(n.KTX2File,r,e):ie(n.BasisFile,r,e)}else{const{BasisFile:o}=await Ge(t);return ie(o,r,e)}})}function ie(r,e,t){const n=new r(new Uint8Array(e));try{if(!n.startTranscoding())throw new Error("Failed to start basis transcoding");const o=n.getNumImages(),s=[];for(let i=0;i<o;i++){const a=n.getNumLevels(i),c=[];for(let f=0;f<a;f++)c.push(Gn(n,i,f,t));s.push(c)}return s}finally{n.close(),n.delete()}}function Gn(r,e,t,n){const o=r.getImageWidth(e,t),s=r.getImageHeight(e,t),i=r.getHasAlpha(),{compressed:a,format:c,basisFormat:f,textureFormat:u}=$e(n,i),l=r.getImageTranscodedSizeInBytes(e,t,f),A=new Uint8Array(l);if(!r.transcodeImage(A,e,t,f,0,0))throw new Error("failed to start Basis transcoding");return{shape:"texture-level",width:o,height:s,data:A,compressed:a,...c!==void 0?{format:c}:{},...u!==void 0?{textureFormat:u}:{},hasAlpha:i}}function Le(r,e,t){const n=new r(new Uint8Array(e));try{if(!n.startTranscoding())throw new Error("failed to start KTX2 transcoding");const o=n.getLevels(),s=[];for(let i=0;i<o;i++)s.push(Dn(n,i,t));return[s]}finally{n.close(),n.delete()}}function Dn(r,e,t){const{alphaFlag:n,height:o,width:s}=r.getImageLevelInfo(e,0,0),{compressed:i,format:a,basisFormat:c,textureFormat:f}=$e(t,n),u=r.getImageTranscodedSizeInBytes(e,0,0,c),l=new Uint8Array(u);if(!r.transcodeImage(l,e,0,0,c,0,-1,-1))throw new Error("Failed to transcode KTX2 image");return{shape:"texture-level",width:s,height:o,data:l,compressed:i,...a!==void 0?{format:a}:{},...f!==void 0?{textureFormat:f}:{},levelSize:u,hasAlpha:n}}function $e(r,e){let t=r.basis?.format||"auto";t==="auto"&&(t=r.basis?.supportedTextureFormats?He(r.basis.supportedTextureFormats):He()),typeof t=="object"&&(t=e?t.alpha:t.noAlpha);const n=t.toLowerCase(),o=qe[n];if(!o)throw new Error(`Unknown Basis format ${t}`);return o}function He(r=Mn()){const e=new Set(r);return _(e,["astc-4x4-unorm","astc-4x4-unorm-srgb"])?"astc-4x4":_(e,["bc7-rgba-unorm","bc7-rgba-unorm-srgb"])?{alpha:"bc7-m5",noAlpha:"bc7-m6-opaque-only"}:_(e,["bc1-rgb-unorm-webgl","bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb"])?{alpha:"bc3",noAlpha:"bc1"}:_(e,["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"])?{alpha:"pvrtc1-4-rgba",noAlpha:"pvrtc1-4-rgb"}:_(e,["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"])?"etc2":e.has("etc1-rgb-unorm-webgl")?"etc1":_(e,["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"])?{alpha:"atc-rgba-interpolated-alpha",noAlpha:"atc-rgb"}:"rgb565"}function _(r,e){return e.some(t=>r.has(t))}const vn={dataType:null,batchType:null,name:"Basis",id:"basis",module:"textures",version:on,worker:!0,extensions:["basis","ktx2"],mimeTypes:["application/octet-stream","image/ktx2"],tests:["sB"],binary:!0,options:{basis:{format:"auto",containerFormat:"auto",module:"transcoder"}}},Sn={...vn,parse:yn};function xn(r){return{addressModeU:Pe(r.wrapS),addressModeV:Pe(r.wrapT),magFilter:On(r.magFilter),...Ln(r.minFilter)}}function Pe(r){switch(r){case 33071:return"clamp-to-edge";case 10497:return"repeat";case 33648:return"mirror-repeat";default:return}}function On(r){switch(r){case 9728:return"nearest";case 9729:return"linear";default:return}}function Ln(r){switch(r){case 9728:return{minFilter:"nearest"};case 9729:return{minFilter:"linear"};case 9984:return{minFilter:"nearest",mipmapFilter:"nearest"};case 9985:return{minFilter:"linear",mipmapFilter:"nearest"};case 9986:return{minFilter:"nearest",mipmapFilter:"linear"};case 9987:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}function Hn(r,e,t,n){const o={defines:{MANUAL_SRGB:!0,SRGB_FAST_APPROXIMATION:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};o.defines.USE_TEX_LOD=!0;const{imageBasedLightingEnvironment:s}=n;return s&&(o.bindings.pbr_diffuseEnvSampler=s.diffuseEnvSampler.texture,o.bindings.pbr_specularEnvSampler=s.specularEnvSampler.texture,o.bindings.pbr_BrdfLUT=s.brdfLutTexture.texture,o.uniforms.scaleIBLAmbient=[1,1]),n?.pbrDebug&&(o.defines.PBR_DEBUG=!0,o.uniforms.scaleDiffBaseMR=[0,0,0,0],o.uniforms.scaleFGDSpec=[0,0,0,0]),t.NORMAL&&(o.defines.HAS_NORMALS=!0),t.TANGENT&&n?.useTangents&&(o.defines.HAS_TANGENTS=!0),t.TEXCOORD_0&&(o.defines.HAS_UV=!0),n?.imageBasedLightingEnvironment&&(o.defines.USE_IBL=!0),n?.lights&&(o.defines.USE_LIGHTS=!0),e&&Pn(r,e,o),o}function Pn(r,e,t){if(t.uniforms.unlit=!!e.unlit,e.pbrMetallicRoughness&&Un(r,e.pbrMetallicRoughness,t),e.normalTexture){N(r,e.normalTexture,"pbr_normalSampler","HAS_NORMALMAP",t);const{scale:n=1}=e.normalTexture;t.uniforms.normalScale=n}if(e.occlusionTexture){N(r,e.occlusionTexture,"pbr_occlusionSampler","HAS_OCCLUSIONMAP",t);const{strength:n=1}=e.occlusionTexture;t.uniforms.occlusionStrength=n}switch(e.emissiveTexture&&(N(r,e.emissiveTexture,"pbr_emissiveSampler","HAS_EMISSIVEMAP",t),t.uniforms.emissiveFactor=e.emissiveFactor||[0,0,0]),e.alphaMode||"MASK"){case"MASK":const{alphaCutoff:n=.5}=e;t.defines.ALPHA_CUTOFF=!0,t.uniforms.alphaCutoff=n;break;case"BLEND":D.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),t.parameters.blend=!0,t.parameters.blendColorOperation="add",t.parameters.blendColorSrcFactor="src-alpha",t.parameters.blendColorDstFactor="one-minus-src-alpha",t.parameters.blendAlphaOperation="add",t.parameters.blendAlphaSrcFactor="one",t.parameters.blendAlphaDstFactor="one-minus-src-alpha",t.glParameters.blend=!0,t.glParameters.blendEquation=32774,t.glParameters.blendFunc=[770,771,1,771];break}}function Un(r,e,t){e.baseColorTexture&&N(r,e.baseColorTexture,"pbr_baseColorSampler","HAS_BASECOLORMAP",t),t.uniforms.baseColorFactor=e.baseColorFactor||[1,1,1,1],e.metallicRoughnessTexture&&N(r,e.metallicRoughnessTexture,"pbr_metallicRoughnessSampler","HAS_METALROUGHNESSMAP",t);const{metallicFactor:n=1,roughnessFactor:o=1}=e;t.uniforms.metallicRoughnessValues=[n,o]}function N(r,e,t,n,o){const s=e.texture.source.image;let i;s.compressed?i=s:i={data:s};const a={wrapS:10497,wrapT:10497,...e?.texture?.sampler},c=r.createTexture({id:e.uniformName||e.id,sampler:xn(a),...i});o.bindings[t]=c,n&&(o.defines[n]=!0),o.generatedTextures.push(c)}var F;(function(r){r[r.POINTS=0]="POINTS",r[r.LINES=1]="LINES",r[r.LINE_LOOP=2]="LINE_LOOP",r[r.LINE_STRIP=3]="LINE_STRIP",r[r.TRIANGLES=4]="TRIANGLES",r[r.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",r[r.TRIANGLE_FAN=6]="TRIANGLE_FAN"})(F||(F={}));function Nn(r){switch(r){case F.POINTS:return"point-list";case F.LINES:return"line-list";case F.LINE_STRIP:return"line-strip";case F.TRIANGLES:return"triangle-list";case F.TRIANGLE_STRIP:return"triangle-strip";default:throw new Error(String(r))}}const Jn=`
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
`,wn=`#version 300 es

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
`,jn=`#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function Kn(r,e){const{id:t,geometry:n,parsedPPBRMaterial:o,vertexCount:s,modelOptions:i={}}=e;D.info(4,"createGLTFModel defines: ",o.defines)();const a=[],c={depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back"},f={id:t,source:Jn,vs:wn,fs:jn,geometry:n,topology:n.topology,vertexCount:s,modules:[Ze],...i,defines:{...o.defines,...i.defines},parameters:{...c,...o.parameters,...i.parameters}},u=new Tt(r,f),{camera:l,...A}={...o.uniforms,...i.uniforms,...o.bindings,...i.bindings};return u.shaderInputs.setProps({pbrMaterial:A,pbrProjection:{camera:l}}),new de({managedResources:a,model:u})}const Vn={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1};function Xn(r,e,t={}){const n={...Vn,...t};return e.scenes.map(s=>Qn(r,s,e.nodes,n))}function Qn(r,e,t,n){const s=(e.nodes||[]).map(a=>et(r,a,t,n));return new O({id:e.name||e.id,children:s})}function et(r,e,t,n){if(!e._node){const i=(e.children||[]).map(c=>et(r,c,t,n));e.mesh&&i.push(Yn(r,e.mesh,n));const a=new O({id:e.name||e.id,children:i});if(e.matrix)a.setMatrix(e.matrix);else{if(a.matrix.identity(),e.translation&&a.matrix.translate(e.translation),e.rotation){const c=new G().fromQuaternion(e.rotation);a.matrix.multiplyRight(c)}e.scale&&a.matrix.scale(e.scale)}e._node=a}const o=t.find(s=>s.id===e.id);return o._node=e._node,e._node}function Yn(r,e,t){if(!e._mesh){const o=(e.primitives||[]).map((i,a)=>Wn(r,i,a,e,t)),s=new O({id:e.name||e.id,children:o});e._mesh=s}return e._mesh}function Wn(r,e,t,n,o){const s=e.name||`${n.name||n.id}-primitive-${t}`,i=Nn(e.mode||4),a=e.indices?e.indices.count:kn(e.attributes),c=Ue(s,e,i),f=Hn(r,e.material,c.attributes,o),u=Kn(r,{id:s,geometry:Ue(s,e,i),parsedPPBRMaterial:f,modelOptions:o.modelOptions,vertexCount:a});return u.bounds=[e.attributes.POSITION.min,e.attributes.POSITION.max],u}function kn(r){throw new Error("getVertexCount not implemented")}function Ue(r,e,t){const n={};for(const[o,s]of Object.entries(e.attributes)){const{components:i,size:a,value:c}=s;n[o]={size:a??i,value:c}}return new Ot({id:r,topology:t,indices:e.indices.value,attributes:n})}const ae=new Lt;function zn(r,{input:e,interpolation:t,output:n},o,s){const i=e[e.length-1],a=r%i,c=e.findIndex(A=>A>=a),f=Math.max(0,c-1);if(!Array.isArray(o[s]))switch(s){case"translation":o[s]=[0,0,0];break;case"rotation":o[s]=[0,0,0,1];break;case"scale":o[s]=[1,1,1];break;default:D.warn(`Bad animation path ${s}`)()}const u=e[f],l=e[c];switch(t){case"STEP":$n(o,s,n[f]);break;case"LINEAR":if(l>u){const A=(a-u)/(l-u);Zn(o,s,n[f],n[c],A)}break;case"CUBICSPLINE":if(l>u){const A=(a-u)/(l-u),d=l-u,g=n[3*f+1],C=n[3*f+2],L=n[3*c+0],H=n[3*c+1];qn(o,s,{p0:g,outTangent0:C,inTangent1:L,p1:H,tDiff:d,ratio:A})}break;default:D.warn(`Interpolation ${t} not supported`)();break}}function Zn(r,e,t,n,o){if(!r[e])throw new Error;if(e==="rotation"){ae.slerp({start:t,target:n,ratio:o});for(let s=0;s<ae.length;s++)r[e][s]=ae[s]}else for(let s=0;s<t.length;s++)r[e][s]=o*n[s]+(1-o)*t[s]}function qn(r,e,{p0:t,outTangent0:n,inTangent1:o,p1:s,tDiff:i,ratio:a}){if(!r[e])throw new Error;for(let c=0;c<r[e].length;c++){const f=n[c]*i,u=o[c]*i;r[e][c]=(2*Math.pow(a,3)-3*Math.pow(a,2)+1)*t[c]+(Math.pow(a,3)-2*Math.pow(a,2)+a)*f+(-2*Math.pow(a,3)+3*Math.pow(a,2))*s[c]+(Math.pow(a,3)-Math.pow(a,2))*u}}function $n(r,e,t){if(!r[e])throw new Error;for(let n=0;n<t.length;n++)r[e][n]=t[n]}class er{animation;startTime=0;playing=!0;speed=1;constructor(e){this.animation=e.animation,this.animation.name||="unnamed",Object.assign(this,e)}setTime(e){if(!this.playing)return;const n=(e/1e3-this.startTime)*this.speed;this.animation.channels.forEach(({sampler:o,target:s,path:i})=>{zn(n,o,s,i),rr(s,s._node)})}}class tr{animations;constructor(e){this.animations=e.animations.map((t,n)=>{const o=t.name||`Animation-${n}`;return new er({animation:{name:o,channels:t.channels}})})}animate(e){D.warn("GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead")(),this.setTime(e)}setTime(e){this.animations.forEach(t=>t.setTime(e))}getAnimations(){return this.animations}}const nr=new G;function rr(r,e){if(e.matrix.identity(),r.translation&&e.matrix.translate(r.translation),r.rotation){const t=nr.fromQuaternion(r.rotation);e.matrix.multiplyRight(t)}r.scale&&e.matrix.scale(r.scale)}const or={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},sr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function ir(r){const e=sr[r.componentType],t=or[r.type],n=t*r.count,{buffer:o,byteOffset:s=0}=r.bufferView?.data??{};return{typedArray:new e(o,s+(r.byteOffset||0),n),components:t}}function ar(r){return(r.animations||[]).map((t,n)=>{const o=t.name||`Animation-${n}`,s=t.samplers.map(({input:a,interpolation:c="LINEAR",output:f})=>({input:Ne(r.accessors[a]),interpolation:c,output:Ne(r.accessors[f])})),i=t.channels.map(({sampler:a,target:c})=>({sampler:s[a],target:r.nodes[c.node??0],path:c.path}));return{name:o,channels:i}})}function Ne(r){if(!r._animation){const{typedArray:e,components:t}=ir(r);if(t===1)r._animation=Array.from(e);else{const n=[];for(let o=0;o<e.length;o+=t)n.push(Array.from(e.slice(o,o+t)));r._animation=n}}return r._animation}function Be(r){if(ArrayBuffer.isView(r)||r instanceof ArrayBuffer||r instanceof ImageBitmap)return r;if(Array.isArray(r))return r.map(Be);if(r&&typeof r=="object"){const e={};for(const t in r)e[t]=Be(r[t]);return e}return r}function cr(r,e,t){e=Be(e);const n=Xn(r,e,t),o=ar(e),s=new tr({animations:o});return{scenes:n,animator:s}}function p(r,e){if(!r)throw new Error(e||"assert failed: gltf")}const tt={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},nt={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},fr=1.33,Je=["SCALAR","VEC2","VEC3","VEC4"],ur=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],lr=new Map(ur),Ar={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},dr={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Br={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function rt(r){return Je[r-1]||Je[0]}function q(r){const e=lr.get(r.constructor);if(!e)throw new Error("Illegal typed array");return e}function ge(r,e){const t=Br[r.componentType],n=Ar[r.type],o=dr[r.componentType],s=r.count*n,i=r.count*n*o;p(i>=0&&i<=e.byteLength);const a=nt[r.componentType],c=tt[r.type];return{ArrayType:t,length:s,byteLength:i,componentByteSize:a,numberOfComponentsInElement:c}}function Ui(r){let{images:e,bufferViews:t}=r;e=e||[],t=t||[];const n=e.map(i=>i.bufferView);t=t.filter(i=>!n.includes(i));const o=t.reduce((i,a)=>i+a.byteLength,0),s=e.reduce((i,a)=>{const{width:c,height:f}=a.image;return i+c*f},0);return o+Math.ceil(4*s*fr)}function mr(r,e,t){const n=r.bufferViews[t];p(n);const o=n.buffer,s=e[o];p(s);const i=(n.byteOffset||0)+s.byteOffset;return new Uint8Array(s.arrayBuffer,i,n.byteLength)}function br(r,e,t){const n=typeof t=="number"?r.accessors?.[t]:t;if(!n)throw new Error(`No gltf accessor ${JSON.stringify(t)}`);const o=r.bufferViews?.[n.bufferView||0];if(!o)throw new Error(`No gltf buffer view for accessor ${o}`);const{arrayBuffer:s,byteOffset:i}=e[o.buffer],a=(i||0)+(n.byteOffset||0)+(o.byteOffset||0),{ArrayType:c,length:f,componentByteSize:u,numberOfComponentsInElement:l}=ge(n,o),A=u*l,d=o.byteStride||A;if(typeof o.byteStride>"u"||o.byteStride===A)return new c(s,a,f);const g=new c(f);for(let C=0;C<n.count;C++){const L=new c(s,a+C*d,l);g.set(L,C*l)}return g}function pr(){return{asset:{version:"2.0",generator:"loaders.gl"},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}class m{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||pr(),buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){const t=this.getUsedExtensions().find(o=>o===e),n=this.getRequiredExtensions().find(o=>o===e);return typeof t=="string"||typeof n=="string"}getExtension(e){const t=this.getUsedExtensions().find(o=>o===e),n=this.json.extensions||{};return t?n[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(n=>n===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject("scenes",e)}getNode(e){return this.getObject("nodes",e)}getSkin(e){return this.getObject("skins",e)}getMesh(e){return this.getObject("meshes",e)}getMaterial(e){return this.getObject("materials",e)}getAccessor(e){return this.getObject("accessors",e)}getTexture(e){return this.getObject("textures",e)}getSampler(e){return this.getObject("samplers",e)}getImage(e){return this.getObject("images",e)}getBufferView(e){return this.getObject("bufferViews",e)}getBuffer(e){return this.getObject("buffers",e)}getObject(e,t){if(typeof t=="object")return t;const n=this.json[e]&&this.json[e][t];if(!n)throw new Error(`glTF file error: Could not find ${e}[${t}]`);return n}getTypedArrayForBufferView(e){e=this.getBufferView(e);const t=e.buffer,n=this.gltf.buffers[t];p(n);const o=(e.byteOffset||0)+n.byteOffset;return new Uint8Array(n.arrayBuffer,o,e.byteLength)}getTypedArrayForAccessor(e){const t=this.getAccessor(e);return br(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);const t=this.getBufferView(e.bufferView),o=this.getBuffer(t.buffer).data,s=t.byteOffset||0;return new Uint8Array(o,s,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,n){return e.extensions=e.extensions||{},e.extensions[t]=n,this.registerUsedExtension(t),this}setObjectExtension(e,t,n){const o=e.extensions||{};o[t]=n}removeObjectExtension(e,t){const n=e?.extensions||{};if(n[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const o=this.json.extensionsRemoved;o.includes(t)||o.push(t)}delete n[t]}addExtension(e,t={}){return p(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return p(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){const{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){const{meshIndex:t,matrix:n}=e;this.json.nodes=this.json.nodes||[];const o={mesh:t};return n&&(o.matrix=n),this.json.nodes.push(o),this.json.nodes.length-1}addMesh(e){const{attributes:t,indices:n,material:o,mode:s=4}=e,a={primitives:[{attributes:this._addAttributes(t),mode:s}]};if(n){const c=this._addIndices(n);a.primitives[0].indices=c}return Number.isFinite(o)&&(a.primitives[0].material=o),this.json.meshes=this.json.meshes||[],this.json.meshes.push(a),this.json.meshes.length-1}addPointCloud(e){const n={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(n),this.json.meshes.length-1}addImage(e,t){const n=_t(e),o=t||n?.mimeType,i={bufferView:this.addBufferView(e),mimeType:o};return this.json.images=this.json.images||[],this.json.images.push(i),this.json.images.length-1}addBufferView(e,t=0,n=this.byteLength){const o=e.byteLength;p(Number.isFinite(o)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);const s={buffer:t,byteOffset:n,byteLength:o};return this.byteLength+=j(o,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(s),this.json.bufferViews.length-1}addAccessor(e,t){const n={bufferView:e,type:rt(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(n),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){const n=this.addBufferView(e);let o={min:t.min,max:t.max};(!o.min||!o.max)&&(o=this._getAccessorMinMax(e,t.size));const s={size:t.size,componentType:q(e),count:Math.round(e.length/t.size),min:o.min,max:o.max};return this.addAccessor(n,Object.assign(s,t))}addTexture(e){const{imageIndex:t}=e,n={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(n),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){const e=this.byteLength,t=new ArrayBuffer(e),n=new Uint8Array(t);let o=0;for(const s of this.sourceBuffers||[])o=Xt(s,n,o);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let n=!0;for(;n;){const o=e.indexOf(t);o>-1?e.splice(o,1):n=!1}}_addAttributes(e={}){const t={};for(const n in e){const o=e[n],s=this._getGltfAttributeName(n),i=this.addBinaryBuffer(o.value,o);t[s]=i}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case"position":case"positions":case"vertices":return"POSITION";case"normal":case"normals":return"NORMAL";case"color":case"colors":return"COLOR_0";case"texcoord":case"texcoords":return"TEXCOORD_0";default:return e}}_getAccessorMinMax(e,t){const n={min:null,max:null};if(e.length<t)return n;n.min=[],n.max=[];const o=e.subarray(0,t);for(const s of o)n.min.push(s),n.max.push(s);for(let s=t;s<e.length;s+=t)for(let i=0;i<t;i++)n.min[0+i]=Math.min(n.min[0+i],e[s+i]),n.max[0+i]=Math.max(n.max[0+i],e[s+i]);return n}}function we(r){return(r%1+1)%1}const ot={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},Cr={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},st={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function Ee(r,e){return st[e]*ot[r]}function $(r,e,t,n){if(t!=="UINT8"&&t!=="UINT16"&&t!=="UINT32"&&t!=="UINT64")return null;const o=r.getTypedArrayForBufferView(e),s=ee(o,"SCALAR",t,n+1);return s instanceof BigInt64Array||s instanceof BigUint64Array?null:s}function ee(r,e,t,n=1){const o=ot[e],s=Cr[t],i=st[t],a=n*o,c=a*i;let f=r.buffer,u=r.byteOffset;return u%i!==0&&(f=new Uint8Array(f).slice(u,u+c).buffer,u=0),new s(Z(f),u,a)}function Ie(r,e,t){const n=`TEXCOORD_${e.texCoord||0}`,o=t.attributes[n],s=r.getTypedArrayForAccessor(o),i=r.gltf.json,a=e.index,c=i.textures?.[a]?.source;if(typeof c<"u"){const f=i.images?.[c]?.mimeType,u=r.gltf.images?.[c];if(u&&typeof u.width<"u"){const l=[];for(let A=0;A<s.length;A+=2){const d=hr(u,f,s,A,e.channels);l.push(d)}return l}}return[]}function it(r,e,t,n,o){if(!t?.length)return;const s=[];for(const u of t){let l=n.findIndex(A=>A===u);l===-1&&(l=n.push(u)-1),s.push(l)}const i=new Uint32Array(s),a=r.gltf.buffers.push({arrayBuffer:i.buffer,byteOffset:i.byteOffset,byteLength:i.byteLength})-1,c=r.addBufferView(i,a,0),f=r.addAccessor(c,{size:1,componentType:q(i),count:i.length});o.attributes[e]=f}function hr(r,e,t,n,o=[0]){const s={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},i=t[n],a=t[n+1];let c=1;e&&(e.indexOf("image/jpeg")!==-1||e.indexOf("image/png")!==-1)&&(c=4);const f=gr(i,a,r,c);let u=0;for(const l of o){const A=typeof l=="number"?Object.values(s)[l]:s[l],d=f+A.offset,g=Rt(r);if(g.data.length<=d)throw new Error(`${g.data.length} <= ${d}`);const C=g.data[d];u|=C<<A.shift}return u}function gr(r,e,t,n=1){const o=t.width,s=we(r)*(o-1),i=Math.round(s),a=t.height,c=we(e)*(a-1),f=Math.round(c),u=t.components?t.components:n;return(f*o+i)*u}function at(r,e,t,n,o){const s=[];for(let i=0;i<e;i++){const a=t[i],c=t[i+1]-t[i];if(c+a>n)break;const f=a/o,u=c/o;s.push(r.slice(f,f+u))}return s}function ct(r,e,t){const n=[];for(let o=0;o<e;o++){const s=o*t;n.push(r.slice(s,s+t))}return n}function ft(r,e,t,n){if(t)throw new Error("Not implemented - arrayOffsets for strings is specified");if(n){const o=[],s=new TextDecoder("utf8");let i=0;for(let a=0;a<r;a++){const c=n[a+1]-n[a];if(c+i<=e.length){const f=e.subarray(i,c+i),u=s.decode(f);o.push(u),i+=c}}return o}return[]}const y="EXT_mesh_features",Er=y;async function Ir(r,e){const t=new m(r);Mr(t,e)}function Fr(r,e){const t=new m(r);return _r(t),t.createBinaryChunk(),t.gltf}function Mr(r,e){const t=r.gltf.json;if(t.meshes)for(const n of t.meshes)for(const o of n.primitives)Tr(r,o,e)}function Tr(r,e,t){if(!t?.gltf?.loadBuffers)return;const o=e.extensions?.[y]?.featureIds;if(o)for(const s of o){let i;if(typeof s.attribute<"u"){const a=`_FEATURE_ID_${s.attribute}`,c=e.attributes[a];i=r.getTypedArrayForAccessor(c)}else typeof s.texture<"u"&&t?.gltf?.loadImages?i=Ie(r,s.texture,e):i=[];s.data=i}}function _r(r,e){const t=r.gltf.json.meshes;if(t)for(const n of t)for(const o of n.primitives)yr(r,o)}function Rr(r,e,t,n){e.extensions||(e.extensions={});let o=e.extensions[y];o||(o={featureIds:[]},e.extensions[y]=o);const{featureIds:s}=o,i={featureCount:t.length,propertyTable:n,data:t};s.push(i),r.addObjectExtension(e,y,o)}function yr(r,e){const t=e.extensions?.[y];if(!t)return;const n=t.featureIds;n.forEach((o,s)=>{if(o.data){const{accessorKey:i,index:a}=Gr(e.attributes),c=new Uint32Array(o.data);n[s]={featureCount:c.length,propertyTable:o.propertyTable,attribute:a},r.gltf.buffers.push({arrayBuffer:c.buffer,byteOffset:c.byteOffset,byteLength:c.byteLength});const f=r.addBufferView(c),u=r.addAccessor(f,{size:1,componentType:q(c),count:c.length});e.attributes[i]=u}})}function Gr(r){const e="_FEATURE_ID_",t=Object.keys(r).filter(s=>s.indexOf(e)===0);let n=-1;for(const s of t){const i=Number(s.substring(e.length));i>n&&(n=i)}return n++,{accessorKey:`${e}${n}`,index:n}}const Dr=Object.freeze(Object.defineProperty({__proto__:null,createExtMeshFeatures:Rr,decode:Ir,encode:Fr,name:Er},Symbol.toStringTag,{value:"Module"})),v="EXT_structural_metadata",vr=v;async function Sr(r,e){const t=new m(r);Or(t,e)}function xr(r,e){const t=new m(r);return zr(t),t.createBinaryChunk(),t.gltf}function Or(r,e){if(!e.gltf?.loadBuffers)return;const t=r.getExtension(v);t&&(e.gltf?.loadImages&&Lr(r,t),Hr(r,t))}function Lr(r,e){const t=e.propertyTextures,n=r.gltf.json;if(t&&n.meshes)for(const o of n.meshes)for(const s of o.primitives)Ur(r,t,s,e)}function Hr(r,e){const t=e.schema;if(!t)return;const n=t.classes,o=e.propertyTables;if(n&&o)for(const s in n){const i=Pr(o,s);i&&Jr(r,t,i)}}function Pr(r,e){for(const t of r)if(t.class===e)return t;return null}function Ur(r,e,t,n){if(!e)return;const s=t.extensions?.[v]?.propertyTextures;if(s)for(const i of s){const a=e[i];Nr(r,a,t,n)}}function Nr(r,e,t,n){if(!e.properties)return;n.dataAttributeNames||(n.dataAttributeNames=[]);const o=e.class;for(const s in e.properties){const i=`${o}_${s}`,a=e.properties?.[s];if(!a)continue;a.data||(a.data=[]);const c=a.data,f=Ie(r,a,t);f!==null&&(it(r,i,f,c,t),a.data=c,n.dataAttributeNames.push(i))}}function Jr(r,e,t){const n=e.classes?.[t.class];if(!n)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const o=t.count;for(const s in n.properties){const i=n.properties[s],a=t.properties?.[s];if(a){const c=wr(r,e,i,o,a);a.data=c}}}function wr(r,e,t,n,o){let s=[];const i=o.values,a=r.getTypedArrayForBufferView(i),c=jr(r,t,o,n),f=Kr(r,o,n);switch(t.type){case"SCALAR":case"VEC2":case"VEC3":case"VEC4":case"MAT2":case"MAT3":case"MAT4":{s=Vr(t,n,a,c);break}case"BOOLEAN":throw new Error(`Not implemented - classProperty.type=${t.type}`);case"STRING":{s=ft(n,a,c,f);break}case"ENUM":{s=Xr(e,t,n,a,c);break}default:throw new Error(`Unknown classProperty type ${t.type}`)}return s}function jr(r,e,t,n){return e.array&&typeof e.count>"u"&&typeof t.arrayOffsets<"u"?$(r,t.arrayOffsets,t.arrayOffsetType||"UINT32",n):null}function Kr(r,e,t){return typeof e.stringOffsets<"u"?$(r,e.stringOffsets,e.stringOffsetType||"UINT32",t):null}function Vr(r,e,t,n){const o=r.array,s=r.count,i=Ee(r.type,r.componentType),a=t.byteLength/i;let c;return r.componentType?c=ee(t,r.type,r.componentType,a):c=t,o?n?at(c,e,n,t.length,i):s?ct(c,e,s):[]:c}function Xr(r,e,t,n,o){const s=e.enumType;if(!s)throw new Error("Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM");const i=r.enums?.[s];if(!i)throw new Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${s}`);const a=i.valueType||"UINT16",c=Ee(e.type,a),f=n.byteLength/c;let u=ee(n,e.type,a,f);if(u||(u=n),e.array){if(o)return Qr({valuesData:u,numberOfElements:t,arrayOffsets:o,valuesDataBytesLength:n.length,elementSize:c,enumEntry:i});const l=e.count;return l?Yr(u,t,l,i):[]}return Fe(u,0,t,i)}function Qr(r){const{valuesData:e,numberOfElements:t,arrayOffsets:n,valuesDataBytesLength:o,elementSize:s,enumEntry:i}=r,a=[];for(let c=0;c<t;c++){const f=n[c],u=n[c+1]-n[c];if(u+f>o)break;const l=f/s,A=u/s,d=Fe(e,l,A,i);a.push(d)}return a}function Yr(r,e,t,n){const o=[];for(let s=0;s<e;s++){const i=t*s,a=Fe(r,i,t,n);o.push(a)}return o}function Fe(r,e,t,n){const o=[];for(let s=0;s<t;s++)if(r instanceof BigInt64Array||r instanceof BigUint64Array)o.push("");else{const i=r[e+s],a=Wr(n,i);a?o.push(a.name):o.push("")}return o}function Wr(r,e){for(const t of r.values)if(t.value===e)return t;return null}const kr="schemaClassId";function zr(r,e){const t=r.getExtension(v);if(t&&t.propertyTables)for(const n of t.propertyTables){const o=n.class,s=t.schema?.classes?.[o];n.properties&&s&&Zr(n,s,r)}}function Zr(r,e,t){for(const n in r.properties){const o=r.properties[n].data;if(o){const s=e.properties[n];if(s){const i=to(o,s,t);r.properties[n]=i}}}}function qr(r,e,t=kr){let n=r.getExtension(v);n||(n=r.addExtension(v)),n.schema=$r(e,t,n.schema);const o=eo(e,t,n.schema);return n.propertyTables||(n.propertyTables=[]),n.propertyTables.push(o)-1}function $r(r,e,t){const n=t??{id:"schema_id"},o={properties:{}};for(const s of r){const i={type:s.elementType,componentType:s.componentType};o.properties[s.name]=i}return n.classes={},n.classes[e]=o,n}function eo(r,e,t){const n={class:e,count:0};let o=0;const s=t.classes?.[e];for(const i of r){if(o===0&&(o=i.values.length),o!==i.values.length&&i.values.length)throw new Error("Illegal values in attributes");s?.properties[i.name]&&(n.properties||(n.properties={}),n.properties[i.name]={values:0,data:i.values})}return n.count=o,n}function to(r,e,t){const n={values:0};if(e.type==="STRING"){const{stringData:o,stringOffsets:s}=oo(r);n.stringOffsets=ce(s,t),n.values=ce(o,t)}else if(e.type==="SCALAR"&&e.componentType){const o=ro(r,e.componentType);n.values=ce(o,t)}return n}const no={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function ro(r,e){const t=[];for(const o of r)t.push(Number(o));const n=no[e];if(!n)throw new Error("Illegal component type");return new n(t)}function oo(r){const e=new TextEncoder,t=[];let n=0;for(const c of r){const f=e.encode(c);n+=f.length,t.push(f)}const o=new Uint8Array(n),s=[];let i=0;for(const c of t)o.set(c,i),s.push(i),i+=c.length;s.push(i);const a=new Uint32Array(s);return{stringData:o,stringOffsets:a}}function ce(r,e){return e.gltf.buffers.push({arrayBuffer:Z(r.buffer),byteOffset:r.byteOffset,byteLength:r.byteLength}),e.addBufferView(r)}const so=Object.freeze(Object.defineProperty({__proto__:null,createExtStructuralMetadata:qr,decode:Sr,encode:xr,name:vr},Symbol.toStringTag,{value:"Module"})),ut="EXT_feature_metadata",io=ut;async function ao(r,e){const t=new m(r);co(t,e)}function co(r,e){if(!e.gltf?.loadBuffers)return;const t=r.getExtension(ut);t&&(e.gltf?.loadImages&&fo(r,t),uo(r,t))}function fo(r,e){const t=e.schema;if(!t)return;const n=t.classes,{featureTextures:o}=e;if(n&&o)for(const s in n){const i=n[s],a=Ao(o,s);a&&mo(r,a,i)}}function uo(r,e){const t=e.schema;if(!t)return;const n=t.classes,o=e.featureTables;if(n&&o)for(const s in n){const i=lo(o,s);i&&Bo(r,t,i)}}function lo(r,e){for(const t in r){const n=r[t];if(n.class===e)return n}return null}function Ao(r,e){for(const t in r){const n=r[t];if(n.class===e)return n}return null}function Bo(r,e,t){if(!t.class)return;const n=e.classes?.[t.class];if(!n)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const o=t.count;for(const s in n.properties){const i=n.properties[s],a=t.properties?.[s];if(a){const c=bo(r,e,i,o,a);a.data=c}}}function mo(r,e,t){const n=e.class;for(const o in t.properties){const s=e?.properties?.[o];if(s){const i=Eo(r,s,n);s.data=i}}}function bo(r,e,t,n,o){let s=[];const i=o.bufferView,a=r.getTypedArrayForBufferView(i),c=po(r,t,o,n),f=Co(r,t,o,n);return t.type==="STRING"||t.componentType==="STRING"?s=ft(n,a,c,f):ho(t)&&(s=go(t,n,a,c)),s}function po(r,e,t,n){return e.type==="ARRAY"&&typeof e.componentCount>"u"&&typeof t.arrayOffsetBufferView<"u"?$(r,t.arrayOffsetBufferView,t.offsetType||"UINT32",n):null}function Co(r,e,t,n){return typeof t.stringOffsetBufferView<"u"?$(r,t.stringOffsetBufferView,t.offsetType||"UINT32",n):null}function ho(r){const e=["UINT8","INT16","UINT16","INT32","UINT32","INT64","UINT64","FLOAT32","FLOAT64"];return e.includes(r.type)||typeof r.componentType<"u"&&e.includes(r.componentType)}function go(r,e,t,n){const o=r.type==="ARRAY",s=r.componentCount,i="SCALAR",a=r.componentType||r.type,c=Ee(i,a),f=t.byteLength/c,u=ee(t,i,a,f);return o?n?at(u,e,n,t.length,c):s?ct(u,e,s):[]:u}function Eo(r,e,t){const n=r.gltf.json;if(!n.meshes)return[];const o=[];for(const s of n.meshes)for(const i of s.primitives)Io(r,t,e,o,i);return o}function Io(r,e,t,n,o){const s={channels:t.channels,...t.texture},i=Ie(r,s,o);i&&it(r,e,i,n,o)}const Fo=Object.freeze(Object.defineProperty({__proto__:null,decode:ao,name:io},Symbol.toStringTag,{value:"Module"})),Mo="4.4.1",S=!0,je=1735152710,Me=12,k=8,To=1313821514,_o=5130562,Ro=0,yo=0,Go=1;function Do(r,e=0){return`${String.fromCharCode(r.getUint8(e+0))}${String.fromCharCode(r.getUint8(e+1))}${String.fromCharCode(r.getUint8(e+2))}${String.fromCharCode(r.getUint8(e+3))}`}function vo(r,e=0,t={}){const n=new DataView(r),{magic:o=je}=t,s=n.getUint32(e,!1);return s===o||s===je}function So(r,e,t=0,n={}){const o=new DataView(e),s=Do(o,t+0),i=o.getUint32(t+4,S),a=o.getUint32(t+8,S);switch(Object.assign(r,{header:{byteOffset:t,byteLength:a,hasBinChunk:!1},type:s,version:i,json:{},binChunks:[]}),t+=Me,r.version){case 1:return xo(r,o,t);case 2:return Oo(r,o,t,n={});default:throw new Error(`Invalid GLB version ${r.version}. Only supports version 1 and 2.`)}}function xo(r,e,t){J(r.header.byteLength>Me+k);const n=e.getUint32(t+0,S),o=e.getUint32(t+4,S);return t+=k,J(o===Ro),me(r,e,t,n),t+=n,t+=be(r,e,t,r.header.byteLength),t}function Oo(r,e,t,n){return J(r.header.byteLength>Me+k),Lo(r,e,t,n),t+r.header.byteLength}function Lo(r,e,t,n){for(;t+8<=r.header.byteLength;){const o=e.getUint32(t+0,S),s=e.getUint32(t+4,S);switch(t+=k,s){case To:me(r,e,t,o);break;case _o:be(r,e,t,o);break;case yo:n.strict||me(r,e,t,o);break;case Go:n.strict||be(r,e,t,o);break}t+=j(o,4)}return t}function me(r,e,t,n){const o=new Uint8Array(e.buffer,t,n),i=new TextDecoder("utf8").decode(o);return r.json=JSON.parse(i),j(n,4)}function be(r,e,t,n){return r.header.hasBinChunk=!0,r.binChunks.push({byteOffset:t,byteLength:n,arrayBuffer:e.buffer}),j(n,4)}function lt(r,e,t){if(r.startsWith("data:")||r.startsWith("http:")||r.startsWith("https:"))return r;const o=t?.baseUrl||Ho(e?.core?.baseUrl);if(!o)throw new Error(`'baseUrl' must be provided to resolve relative url ${r}`);return o.endsWith("/")?`${o}${r}`:`${o}/${r}`}function Ho(r){if(!r)return;if(r.endsWith("/"))return r;const e=r.lastIndexOf("/");return e>=0?r.slice(0,e+1):""}const Po="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",Uo="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",No=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),Jo=new Uint8Array([32,0,65,253,3,1,2,34,4,106,6,5,11,8,7,20,13,33,12,16,128,9,116,64,19,113,127,15,10,21,22,14,255,66,24,54,136,107,18,23,192,26,114,118,132,17,77,101,130,144,27,87,131,44,45,74,156,154,70,167]),wo={0:"",1:"meshopt_decodeFilterOct",2:"meshopt_decodeFilterQuat",3:"meshopt_decodeFilterExp",NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp"},jo={0:"meshopt_decodeVertexBuffer",1:"meshopt_decodeIndexBuffer",2:"meshopt_decodeIndexSequence",ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"};async function Ko(r,e,t,n,o,s="NONE"){const i=await Vo();Yo(i,i.exports[jo[o]],r,e,t,n,i.exports[wo[s||"NONE"]])}let fe;async function Vo(){return fe||(fe=Xo()),fe}async function Xo(){let r=Po;WebAssembly.validate(No)&&(r=Uo,console.log("Warning: meshopt_decoder is using experimental SIMD support"));const e=await WebAssembly.instantiate(Qo(r),{});return await e.instance.exports.__wasm_call_ctors(),e.instance}function Qo(r){const e=new Uint8Array(r.length);for(let n=0;n<r.length;++n){const o=r.charCodeAt(n);e[n]=o>96?o-71:o>64?o-65:o>47?o+4:o>46?63:62}let t=0;for(let n=0;n<r.length;++n)e[t++]=e[n]<60?Jo[e[n]]:(e[n]-60)*64+e[++n];return e.buffer.slice(0,t)}function Yo(r,e,t,n,o,s,i){const a=r.exports.sbrk,c=n+3&-4,f=a(c*o),u=a(s.length),l=new Uint8Array(r.exports.memory.buffer);l.set(s,u);const A=e(f,n,o,u,s.length);if(A===0&&i&&i(f,c,o),t.set(l.subarray(f,f+n*o)),a(f-a(0)),A!==0)throw new Error(`Malformed buffer data: ${A}`)}const z="EXT_meshopt_compression",Wo=z;async function ko(r,e){const t=new m(r);if(!e?.gltf?.decompressMeshes||!e.gltf?.loadBuffers)return;const n=[];for(const o of r.json.bufferViews||[])n.push(zo(t,o));await Promise.all(n),t.removeExtension(z)}async function zo(r,e){const t=r.getObjectExtension(e,z);if(t){const{byteOffset:n=0,byteLength:o=0,byteStride:s,count:i,mode:a,filter:c="NONE",buffer:f}=t,u=r.gltf.buffers[f],l=new Uint8Array(u.arrayBuffer,u.byteOffset+n,o),A=new Uint8Array(r.gltf.buffers[e.buffer].arrayBuffer,e.byteOffset,e.byteLength);await Ko(A,i,s,l,a,c),r.removeObjectExtension(e,z)}}const Zo=Object.freeze(Object.defineProperty({__proto__:null,decode:ko,name:Wo},Symbol.toStringTag,{value:"Module"})),R="EXT_texture_webp",qo=R;function $o(r,e){const t=new m(r);if(!zt("image/webp")){if(t.getRequiredExtensions().includes(R))throw new Error(`gltf: Required extension ${R} not supported by browser`);return}const{json:n}=t;for(const o of n.textures||[]){const s=t.getObjectExtension(o,R);s&&(o.source=s.source),t.removeObjectExtension(o,R)}t.removeExtension(R)}const es=Object.freeze(Object.defineProperty({__proto__:null,name:qo,preprocess:$o},Symbol.toStringTag,{value:"Module"})),Q="KHR_texture_basisu",ts=Q;function ns(r,e){const t=new m(r),{json:n}=t;for(const o of n.textures||[]){const s=t.getObjectExtension(o,Q);s&&(o.source=s.source,t.removeObjectExtension(o,Q))}t.removeExtension(Q)}const rs=Object.freeze(Object.defineProperty({__proto__:null,name:ts,preprocess:ns},Symbol.toStringTag,{value:"Module"})),os="1.5.6",ss="1.4.1",ue=`https://www.gstatic.com/draco/versioned/decoders/${os}`,B={DECODER:"draco_wasm_wrapper.js",DECODER_WASM:"draco_decoder.wasm",FALLBACK_DECODER:"draco_decoder.js",ENCODER:"draco_encoder.js"},P={[B.DECODER]:`${ue}/${B.DECODER}`,[B.DECODER_WASM]:`${ue}/${B.DECODER_WASM}`,[B.FALLBACK_DECODER]:`${ue}/${B.FALLBACK_DECODER}`,[B.ENCODER]:`https://raw.githubusercontent.com/google/draco/${ss}/javascript/${B.ENCODER}`};let le;async function is(r={},e){const t=r.modules||{};return t.draco3d?le||=t.draco3d.createDecoderModule({}).then(n=>({draco:n})):le||=as(r,e),await le}function Ke(r,e){if(r&&typeof r=="object"){if(r.default)return r.default;if(r[e])return r[e]}return r}async function as(r,e){let t,n;switch(e){case"js":t=await E(P[B.FALLBACK_DECODER],"draco",r,B.FALLBACK_DECODER);break;default:try{[t,n]=await Promise.all([await E(P[B.DECODER],"draco",r,B.DECODER),await E(P[B.DECODER_WASM],"draco",r,B.DECODER_WASM)])}catch{t=null,n=null}}return t=Ke(t,"DracoDecoderModule"),t=t||globalThis.DracoDecoderModule,!t&&!x&&([t,n]=await Promise.all([await E(P[B.DECODER],"draco",{...r,useLocalLibraries:!0},B.DECODER),await E(P[B.DECODER_WASM],"draco",{...r,useLocalLibraries:!0},B.DECODER_WASM)]),t=Ke(t,"DracoDecoderModule"),t=t||globalThis.DracoDecoderModule),await cs(t,n)}function cs(r,e){if(typeof r!="function")throw new Error("DracoDecoderModule could not be loaded");const t={};return e&&(t.wasmBinary=e),new Promise(n=>{r({...t,onModuleLoaded:o=>n({draco:o})})})}const fs="4.4.1";function us(r,e,t){const n=At(e.metadata),o=[],s=ls(e.attributes);for(const i in r){const a=r[i],c=Ve(i,a,s[i]);o.push(c)}if(t){const i=Ve("indices",t);o.push(i)}return{fields:o,metadata:n}}function ls(r){const e={};for(const t in r){const n=r[t];e[n.name||"undefined"]=n}return e}function Ve(r,e,t){const n=t?At(t.metadata):void 0;return Wt(r,e,n)}function At(r){Object.entries(r);const e={};for(const t in r)e[`${t}.string`]=JSON.stringify(r[t]);return e}const Xe={POSITION:"POSITION",NORMAL:"NORMAL",COLOR:"COLOR_0",TEX_COORD:"TEXCOORD_0"},As={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},ds=4;class Bs{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){const n=new this.draco.DecoderBuffer;n.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);const o=this.decoder.GetEncodedGeometryType(n),s=o===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let i;switch(o){case this.draco.TRIANGULAR_MESH:i=this.decoder.DecodeBufferToMesh(n,s);break;case this.draco.POINT_CLOUD:i=this.decoder.DecodeBufferToPointCloud(n,s);break;default:throw new Error("DRACO: Unknown geometry type.")}if(!i.ok()||!s.ptr){const A=`DRACO decompression failed: ${i.error_msg()}`;throw new Error(A)}const a=this._getDracoLoaderData(s,o,t),c=this._getMeshData(s,a,t),f=Yt(c.attributes),u=us(c.attributes,a,c.indices);return{loader:"draco",loaderData:a,header:{vertexCount:s.num_points(),boundingBox:f},...c,schema:u}}finally{this.draco.destroy(n),s&&this.draco.destroy(s)}}_getDracoLoaderData(e,t,n){const o=this._getTopLevelMetadata(e),s=this._getDracoAttributes(e,n);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:o,attributes:s}}_getDracoAttributes(e,t){const n={};for(let o=0;o<e.num_attributes();o++){const s=this.decoder.GetAttribute(e,o),i=this._getAttributeMetadata(e,o);n[s.unique_id()]={unique_id:s.unique_id(),attribute_type:s.attribute_type(),data_type:s.data_type(),num_components:s.num_components(),byte_offset:s.byte_offset(),byte_stride:s.byte_stride(),normalized:s.normalized(),attribute_index:o,metadata:i};const a=this._getQuantizationTransform(s,t);a&&(n[s.unique_id()].quantization_transform=a);const c=this._getOctahedronTransform(s,t);c&&(n[s.unique_id()].octahedron_transform=c)}return n}_getMeshData(e,t,n){const o=this._getMeshAttributes(t,e,n);if(!o.POSITION)throw new Error("DRACO: No position attribute found.");return e instanceof this.draco.Mesh?n.topology==="triangle-strip"?{topology:"triangle-strip",mode:4,attributes:o,indices:{value:this._getTriangleStripIndices(e),size:1}}:{topology:"triangle-list",mode:5,attributes:o,indices:{value:this._getTriangleListIndices(e),size:1}}:{topology:"point-list",mode:0,attributes:o}}_getMeshAttributes(e,t,n){const o={};for(const s of Object.values(e.attributes)){const i=this._deduceAttributeName(s,n);s.name=i;const a=this._getAttributeValues(t,s);if(a){const{value:c,size:f}=a;o[i]={value:c,size:f,byteOffset:s.byte_offset,byteStride:s.byte_stride,normalized:s.normalized}}}return o}_getTriangleListIndices(e){const n=e.num_faces()*3,o=n*ds,s=this.draco._malloc(o);try{return this.decoder.GetTrianglesUInt32Array(e,o,s),new Uint32Array(this.draco.HEAPF32.buffer,s,n).slice()}finally{this.draco._free(s)}}_getTriangleStripIndices(e){const t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),ps(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){const n=As[t.data_type];if(!n)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;const o=t.num_components,i=e.num_points()*o,a=i*n.BYTES_PER_ELEMENT,c=ms(this.draco,n);let f;const u=this.draco._malloc(a);try{const l=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,l,c,a,u),f=new n(this.draco.HEAPF32.buffer,u,i).slice()}finally{this.draco._free(u)}return{value:f,size:o}}_deduceAttributeName(e,t){const n=e.unique_id;for(const[i,a]of Object.entries(t.extraAttributes||{}))if(a===n)return i;const o=e.attribute_type;for(const i in Xe)if(this.draco[i]===o)return Xe[i];const s=t.attributeNameEntry||"name";return e.metadata[s]?e.metadata[s].string:`CUSTOM_ATTRIBUTE_${n}`}_getTopLevelMetadata(e){const t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){const n=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(n)}_getDracoMetadata(e){if(!e||!e.ptr)return{};const t={},n=this.metadataQuerier.NumEntries(e);for(let o=0;o<n;o++){const s=this.metadataQuerier.GetEntryName(e,o);t[s]=this._getDracoMetadataField(e,s)}return t}_getDracoMetadataField(e,t){const n=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,n);const o=bs(n);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:o}}finally{this.draco.destroy(n)}}_disableAttributeTransforms(e){const{quantizedAttributes:t=[],octahedronAttributes:n=[]}=e,o=[...t,...n];for(const s of o)this.decoder.SkipAttributeTransform(this.draco[s])}_getQuantizationTransform(e,t){const{quantizedAttributes:n=[]}=t,o=e.attribute_type();if(n.map(i=>this.decoder[i]).includes(o)){const i=new this.draco.AttributeQuantizationTransform;try{if(i.InitFromAttribute(e))return{quantization_bits:i.quantization_bits(),range:i.range(),min_values:new Float32Array([1,2,3]).map(a=>i.min_value(a))}}finally{this.draco.destroy(i)}}return null}_getOctahedronTransform(e,t){const{octahedronAttributes:n=[]}=t,o=e.attribute_type();if(n.map(i=>this.decoder[i]).includes(o)){const i=new this.draco.AttributeQuantizationTransform;try{if(i.InitFromAttribute(e))return{quantization_bits:i.quantization_bits()}}finally{this.draco.destroy(i)}}return null}}function ms(r,e){switch(e){case Float32Array:return r.DT_FLOAT32;case Int8Array:return r.DT_INT8;case Int16Array:return r.DT_INT16;case Int32Array:return r.DT_INT32;case Uint8Array:return r.DT_UINT8;case Uint16Array:return r.DT_UINT16;case Uint32Array:return r.DT_UINT32;default:return r.DT_INVALID}}function bs(r){const e=r.size(),t=new Int32Array(e);for(let n=0;n<e;n++)t[n]=r.GetValue(n);return t}function ps(r){const e=r.size(),t=new Int32Array(e);for(let n=0;n<e;n++)t[n]=r.GetValue(n);return t}const Cs={dataType:null,batchType:null,name:"Draco",id:"draco",module:"draco",version:fs,worker:!0,extensions:["drc"],mimeTypes:["application/octet-stream"],binary:!0,tests:["DRACO"],options:{draco:{decoderType:typeof WebAssembly=="object"?"wasm":"js",extraAttributes:{},attributeNameEntry:void 0}}},hs={...Cs,parse:gs};async function gs(r,e){const{draco:t}=await is(ze(e),e?.draco?.decoderType||"wasm"),n=new Bs(t);try{return n.parseSync(r,e?.draco)}finally{n.destroy()}}function Es(r){const e={};for(const t in r){const n=r[t];if(t!=="indices"){const o=dt(n);e[t]=o}}return e}function dt(r){const{buffer:e,size:t,count:n}=Is(r);return{value:e,size:t,byteOffset:0,count:n,type:rt(t),componentType:q(e)}}function Is(r){let e=r,t=1,n=0;return r&&r.value&&(e=r.value,t=r.size||1),e&&(ArrayBuffer.isView(e)||(e=Fs(e,Float32Array)),n=e.length/t),{buffer:e,size:t,count:n}}function Fs(r,e,t=!1){return r?Array.isArray(r)?new e(r):t&&!(r instanceof e)?new e(r):r:null}const I="KHR_draco_mesh_compression",Ms=I;function Ts(r,e,t){const n=new m(r);for(const o of Bt(n))n.getObjectExtension(o,I)}async function _s(r,e,t){if(!e?.gltf?.decompressMeshes)return;const n=new m(r),o=[];for(const s of Bt(n))n.getObjectExtension(s,I)&&o.push(ys(n,s,e,t));await Promise.all(o),n.removeExtension(I)}function Rs(r,e={}){const t=new m(r);for(const n of t.json.meshes||[])Gs(n),t.addRequiredExtension(I)}async function ys(r,e,t,n){const o=r.getObjectExtension(e,I);if(!o)return;const s=r.getTypedArrayForBufferView(o.bufferView),i=We(s.buffer,s.byteOffset),a={...t};delete a["3d-tiles"];const c=await ke(i,hs,a,n),f=Es(c.attributes);for(const[u,l]of Object.entries(f))if(u in e.attributes){const A=e.attributes[u],d=r.getAccessor(A);d?.min&&d?.max&&(l.min=d.min,l.max=d.max)}e.attributes=f,c.indices&&(e.indices=dt(c.indices)),r.removeObjectExtension(e,I),Ds(e)}function Gs(r,e,t=4,n,o){if(!n.DracoWriter)throw new Error("options.gltf.DracoWriter not provided");const s=n.DracoWriter.encodeSync({attributes:r}),i=o?.parseSync?.({attributes:r}),a=n._addFauxAttributes(i.attributes),c=n.addBufferView(s);return{primitives:[{attributes:a,mode:t,extensions:{[I]:{bufferView:c,attributes:a}}}]}}function Ds(r){if(!r.attributes&&Object.keys(r.attributes).length>0)throw new Error("glTF: Empty primitive detected: Draco decompression failure?")}function*Bt(r){for(const e of r.json.meshes||[])for(const t of e.primitives)yield t}const vs=Object.freeze(Object.defineProperty({__proto__:null,decode:_s,encode:Rs,name:Ms,preprocess:Ts},Symbol.toStringTag,{value:"Module"})),te="KHR_texture_transform",Ss=te,X=new T,xs=new he,Os=new he;async function Ls(r,e){if(!new m(r).hasExtension(te)||!e.gltf?.loadBuffers)return;const o=r.json.materials||[];for(let s=0;s<o.length;s++)Hs(s,r)}function Hs(r,e){const t=e.json.materials?.[r],n=[t?.pbrMetallicRoughness?.baseColorTexture,t?.emissiveTexture,t?.normalTexture,t?.occlusionTexture,t?.pbrMetallicRoughness?.metallicRoughnessTexture],o=[];for(const s of n)s&&s?.extensions?.[te]&&Ps(e,r,s,o)}function Ps(r,e,t,n){const o=Us(t,n);if(!o)return;const s=r.json.meshes||[];for(const i of s)for(const a of i.primitives){const c=a.material;Number.isFinite(c)&&e===c&&Ns(r,a,o)}}function Us(r,e){const t=r.extensions?.[te],{texCoord:n=0}=r,{texCoord:o=n}=t;if(!(e.findIndex(([i,a])=>i===n&&a===o)!==-1)){const i=js(t);return n!==o&&(r.texCoord=o),e.push([n,o]),{originalTexCoord:n,texCoord:o,matrix:i}}return null}function Ns(r,e,t){const{originalTexCoord:n,texCoord:o,matrix:s}=t,i=e.attributes[`TEXCOORD_${n}`];if(Number.isFinite(i)){const a=r.json.accessors?.[i];if(a&&a.bufferView!==void 0){const c=r.json.bufferViews?.[a.bufferView];if(c){const{arrayBuffer:f,byteOffset:u}=r.buffers[c.buffer],l=(u||0)+(a.byteOffset||0)+(c.byteOffset||0),{ArrayType:A,length:d}=ge(a,c),g=nt[a.componentType],C=tt[a.type],L=c.byteStride||g*C,H=new Float32Array(d);for(let K=0;K<a.count;K++){const Te=new A(f,l+K*L,2);X.set(Te[0],Te[1],1),X.transformByMatrix3(s),H.set([X[0],X[1]],K*C)}n===o?Js(a,r,H,a.bufferView):ws(o,a,e,r,H)}}}}function Js(r,e,t,n){r.componentType=5126,r.byteOffset=0;const i=(e.json.accessors||[]).reduce((f,u)=>u.bufferView===n?f+1:f,0)>1;e.buffers.push({arrayBuffer:Z(t.buffer),byteOffset:0,byteLength:t.buffer.byteLength});const a=e.buffers.length-1;if(e.json.bufferViews=e.json.bufferViews||[],i){e.json.bufferViews.push({buffer:a,byteLength:t.buffer.byteLength,byteOffset:0}),r.bufferView=e.json.bufferViews.length-1;return}const c=e.json.bufferViews[n];c&&(c.buffer=a,c.byteOffset=0,c.byteLength=t.buffer.byteLength,c.byteStride!==void 0&&delete c.byteStride)}function ws(r,e,t,n,o){n.buffers.push({arrayBuffer:Z(o.buffer),byteOffset:0,byteLength:o.buffer.byteLength}),n.json.bufferViews=n.json.bufferViews||[];const s=n.json.bufferViews;s.push({buffer:n.buffers.length-1,byteLength:o.buffer.byteLength,byteOffset:0});const i=n.json.accessors;i&&(i.push({bufferView:s?.length-1,byteOffset:0,componentType:5126,count:e.count,type:"VEC2"}),t.attributes[`TEXCOORD_${r}`]=i.length-1)}function js(r){const{offset:e=[0,0],rotation:t=0,scale:n=[1,1]}=r,o=new he().set(1,0,0,0,1,0,e[0],e[1],1),s=xs.set(Math.cos(t),Math.sin(t),0,-Math.sin(t),Math.cos(t),0,0,0,1),i=Os.set(n[0],0,0,0,n[1],0,0,0,1);return o.multiplyRight(s).multiplyRight(i)}const Ks=Object.freeze(Object.defineProperty({__proto__:null,decode:Ls,name:Ss},Symbol.toStringTag,{value:"Module"})),M="KHR_lights_punctual",Vs=M;async function Xs(r){const e=new m(r),{json:t}=e,n=e.getExtension(M);n&&(e.json.lights=n.lights,e.removeExtension(M));for(const o of t.nodes||[]){const s=e.getObjectExtension(o,M);s&&(o.light=s.light),e.removeObjectExtension(o,M)}}async function Qs(r){const e=new m(r),{json:t}=e;if(t.lights){const n=e.addExtension(M);p(!n.lights),n.lights=t.lights,delete t.lights}if(e.json.lights){for(const n of e.json.lights){const o=n.node;e.addObjectExtension(o,M,n)}delete e.json.lights}}const Ys=Object.freeze(Object.defineProperty({__proto__:null,decode:Xs,encode:Qs,name:Vs},Symbol.toStringTag,{value:"Module"})),w="KHR_materials_unlit",Ws=w;async function ks(r){const e=new m(r),{json:t}=e;for(const n of t.materials||[])n.extensions&&n.extensions.KHR_materials_unlit&&(n.unlit=!0),e.removeObjectExtension(n,w);e.removeExtension(w)}function zs(r){const e=new m(r),{json:t}=e;if(e.materials)for(const n of t.materials||[])n.unlit&&(delete n.unlit,e.addObjectExtension(n,w,{}),e.addExtension(w))}const Zs=Object.freeze(Object.defineProperty({__proto__:null,decode:ks,encode:zs,name:Ws},Symbol.toStringTag,{value:"Module"})),U="KHR_techniques_webgl",qs=U;async function $s(r){const e=new m(r),{json:t}=e,n=e.getExtension(U);if(n){const o=ti(n,e);for(const s of t.materials||[]){const i=e.getObjectExtension(s,U);i&&(s.technique=Object.assign({},i,o[i.technique]),s.technique.values=ni(s.technique,e)),e.removeObjectExtension(s,U)}e.removeExtension(U)}}async function ei(r,e){}function ti(r,e){const{programs:t=[],shaders:n=[],techniques:o=[]}=r,s=new TextDecoder;return n.forEach(i=>{if(Number.isFinite(i.bufferView))i.code=s.decode(e.getTypedArrayForBufferView(i.bufferView));else throw new Error("KHR_techniques_webgl: no shader code")}),t.forEach(i=>{i.fragmentShader=n[i.fragmentShader],i.vertexShader=n[i.vertexShader]}),o.forEach(i=>{i.program=t[i.program]}),o}function ni(r,e){const t=Object.assign({},r.values);return Object.keys(r.uniforms||{}).forEach(n=>{r.uniforms[n].value&&!(n in t)&&(t[n]=r.uniforms[n].value)}),Object.keys(t).forEach(n=>{typeof t[n]=="object"&&t[n].index!==void 0&&(t[n].texture=e.getTexture(t[n].index))}),t}const ri=Object.freeze(Object.defineProperty({__proto__:null,decode:$s,encode:ei,name:qs},Symbol.toStringTag,{value:"Module"})),mt=[so,Dr,Zo,es,rs,vs,Ys,Zs,ri,Ks,Fo];function oi(r,e={},t){const n=mt.filter(o=>bt(o.name,e));for(const o of n)o.preprocess?.(r,e,t)}async function si(r,e={},t){const n=mt.filter(o=>bt(o.name,e));for(const o of n)await o.decode?.(r,e,t)}function bt(r,e){const t=e?.gltf?.excludeExtensions||{};return!(r in t&&!t[r])}const Ae="KHR_binary_glTF";function ii(r){const e=new m(r),{json:t}=e;for(const n of t.images||[]){const o=e.getObjectExtension(n,Ae);o&&Object.assign(n,o),e.removeObjectExtension(n,Ae)}t.buffers&&t.buffers[0]&&delete t.buffers[0].uri,e.removeExtension(Ae)}const Qe={accessors:"accessor",animations:"animation",buffers:"buffer",bufferViews:"bufferView",images:"image",materials:"material",meshes:"mesh",nodes:"node",samplers:"sampler",scenes:"scene",skins:"skin",textures:"texture"},ai={accessor:"accessors",animations:"animation",buffer:"buffers",bufferView:"bufferViews",image:"images",material:"materials",mesh:"meshes",node:"nodes",sampler:"samplers",scene:"scenes",skin:"skins",texture:"textures"};class ci{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;const n=e.json;switch(n.asset&&n.asset.version){case"2.0":return;case void 0:case"1.0":break;default:console.warn(`glTF: Unknown version ${n.asset.version}`);return}if(!t.normalize)throw new Error("glTF v1 is not supported.");console.warn("Converting glTF v1 to glTF v2 format. This is experimental and may fail."),this._addAsset(n),this._convertTopLevelObjectsToArrays(n),ii(e),this._convertObjectIdsToArrayIndices(n),this._updateObjects(n),this._updateMaterial(n)}_addAsset(e){e.asset=e.asset||{},e.asset.version="2.0",e.asset.generator=e.asset.generator||"Normalized to glTF 2.0 by loaders.gl"}_convertTopLevelObjectsToArrays(e){for(const t in Qe)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){const n=e[t];if(!(!n||Array.isArray(n))){e[t]=[];for(const o in n){const s=n[o];s.id=s.id||o;const i=e[t].length;e[t].push(s),this.idToIndexMap[t][o]=i}}}_convertObjectIdsToArrayIndices(e){for(const t in Qe)this._convertIdsToIndices(e,t);"scene"in e&&(e.scene=this._convertIdToIndex(e.scene,"scene"));for(const t of e.textures)this._convertTextureIds(t);for(const t of e.meshes)this._convertMeshIds(t);for(const t of e.nodes)this._convertNodeIds(t);for(const t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&(e.source=this._convertIdToIndex(e.source,"image"))}_convertMeshIds(e){for(const t of e.primitives){const{attributes:n,indices:o,material:s}=t;for(const i in n)n[i]=this._convertIdToIndex(n[i],"accessor");o&&(t.indices=this._convertIdToIndex(o,"accessor")),s&&(t.material=this._convertIdToIndex(s,"material"))}}_convertNodeIds(e){e.children&&(e.children=e.children.map(t=>this._convertIdToIndex(t,"node"))),e.meshes&&(e.meshes=e.meshes.map(t=>this._convertIdToIndex(t,"mesh")))}_convertSceneIds(e){e.nodes&&(e.nodes=e.nodes.map(t=>this._convertIdToIndex(t,"node")))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(const n of e[t])for(const o in n){const s=n[o],i=this._convertIdToIndex(s,o);n[o]=i}}_convertIdToIndex(e,t){const n=ai[t];if(n in this.idToIndexMap){const o=this.idToIndexMap[n][e];if(!Number.isFinite(o))throw new Error(`gltf v1: failed to resolve ${t} with id ${e}`);return o}return e}_updateObjects(e){for(const t of this.json.buffers)delete t.type}_updateMaterial(e){for(const t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};const n=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,o=e.textures.findIndex(s=>s.id===n);o!==-1&&(t.pbrMetallicRoughness.baseColorTexture={index:o})}}}function fi(r,e={}){return new ci().normalize(r,e)}async function ui(r,e,t=0,n,o){return li(r,e,t,n),fi(r,{normalize:n?.gltf?.normalize}),oi(r,n,o),n?.gltf?.loadBuffers&&r.json.buffers&&await Ai(r,n,o),n?.gltf?.loadImages&&await di(r,n,o),await si(r,n,o),r}function li(r,e,t,n){if(n.core?.baseUrl&&(r.baseUri=n.core?.baseUrl),e instanceof ArrayBuffer&&!vo(e,t,n.glb)&&(e=new TextDecoder().decode(e)),typeof e=="string")r.json=Vt(e);else if(e instanceof ArrayBuffer){const i={};t=So(i,e,t,n.glb),p(i.type==="glTF",`Invalid GLB magic string ${i.type}`),r._glb=i,r.json=i.json}else p(!1,"GLTF: must be ArrayBuffer or string");const o=r.json.buffers||[];if(r.buffers=new Array(o.length).fill(null),r._glb&&r._glb.header.hasBinChunk){const{binChunks:i}=r._glb;r.buffers[0]={arrayBuffer:i[0].arrayBuffer,byteOffset:i[0].byteOffset,byteLength:i[0].byteLength}}const s=r.json.images||[];r.images=new Array(s.length).fill({})}async function Ai(r,e,t){const n=r.json.buffers||[];for(let o=0;o<n.length;++o){const s=n[o];if(s.uri){const{fetch:i}=t;p(i);const a=lt(s.uri,e,t),f=await(await t?.fetch?.(a))?.arrayBuffer?.();r.buffers[o]={arrayBuffer:f,byteOffset:0,byteLength:f.byteLength},delete s.uri}else r.buffers[o]===null&&(r.buffers[o]={arrayBuffer:new ArrayBuffer(s.byteLength),byteOffset:0,byteLength:s.byteLength})}}async function di(r,e,t){const n=Bi(r),o=r.json.images||[],s=[];for(const i of n)s.push(mi(r,o[i],i,e,t));return await Promise.all(s)}function Bi(r){const e=new Set,t=r.json.textures||[];for(const n of t)n.source!==void 0&&e.add(n.source);return Array.from(e).sort()}async function mi(r,e,t,n,o){let s;if(e.uri&&!e.hasOwnProperty("bufferView")){const f=lt(e.uri,n,o),{fetch:u}=o;s=await(await u(f)).arrayBuffer(),e.bufferView={data:s}}if(Number.isFinite(e.bufferView)){const f=mr(r.json,r.buffers,e.bufferView);s=We(f.buffer,f.byteOffset,f.byteLength)}p(s,"glTF image has no data");const i=n,a={...i,core:{...i?.core,mimeType:e.mimeType}};let c=await ke(s,[yt,Sn],a,o);c&&c[0]&&(c={compressed:!0,mipmaps:!1,width:c[0].width,height:c[0].height,data:c[0]}),r.images=r.images||[],r.images[t]=c}const pe={dataType:null,batchType:null,name:"glTF",id:"gltf",module:"gltf",version:Mo,extensions:["gltf","glb"],mimeTypes:["model/gltf+json","model/gltf-binary"],text:!0,binary:!0,tests:["glTF"],parse:bi,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function bi(r,e={},t){const n={...pe.options,...e};n.gltf={...pe.options.gltf,...n.gltf};const o=e?.glb?.byteOffset||0;return await ui({},r,o,n,t)}const pi={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Ci={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},h={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},hi={magFilter:h.TEXTURE_MAG_FILTER,minFilter:h.TEXTURE_MIN_FILTER,wrapS:h.TEXTURE_WRAP_S,wrapT:h.TEXTURE_WRAP_T},gi={[h.TEXTURE_MAG_FILTER]:h.LINEAR,[h.TEXTURE_MIN_FILTER]:h.NEAREST_MIPMAP_LINEAR,[h.TEXTURE_WRAP_S]:h.REPEAT,[h.TEXTURE_WRAP_T]:h.REPEAT};function Ei(){return{id:"default-sampler",parameters:gi}}function Ii(r){return Ci[r]}function Fi(r){return pi[r]}class Mi{baseUri="";jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){const{json:n,buffers:o=[],images:s=[]}=e,{baseUri:i=""}=e;return p(n),this.baseUri=i,this.buffers=o,this.images=s,this.jsonUnprocessed=n,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){const n={...e};return this.json=n,e.bufferViews&&(n.bufferViews=e.bufferViews.map((o,s)=>this._resolveBufferView(o,s))),e.images&&(n.images=e.images.map((o,s)=>this._resolveImage(o,s))),e.samplers&&(n.samplers=e.samplers.map((o,s)=>this._resolveSampler(o,s))),e.textures&&(n.textures=e.textures.map((o,s)=>this._resolveTexture(o,s))),e.accessors&&(n.accessors=e.accessors.map((o,s)=>this._resolveAccessor(o,s))),e.materials&&(n.materials=e.materials.map((o,s)=>this._resolveMaterial(o,s))),e.meshes&&(n.meshes=e.meshes.map((o,s)=>this._resolveMesh(o,s))),e.nodes&&(n.nodes=e.nodes.map((o,s)=>this._resolveNode(o,s)),n.nodes=n.nodes.map((o,s)=>this._resolveNodeChildren(o))),e.skins&&(n.skins=e.skins.map((o,s)=>this._resolveSkin(o,s))),e.scenes&&(n.scenes=e.scenes.map((o,s)=>this._resolveScene(o,s))),typeof this.json.scene=="number"&&n.scenes&&(n.scene=n.scenes[this.json.scene]),n}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t=="object")return t;const n=e&&e[t];return n||console.warn(`glTF file error: Could not find ${e}[${t}]`),n}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(n=>this.getNode(n))}}_resolveNode(e,t){const n={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(n.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(n.camera=this.getCamera(e.camera)),e.skin!==void 0&&(n.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(n.mesh=e.meshes.reduce((o,s)=>{const i=this.getMesh(s);return o.id=i.id,o.primitives=o.primitives.concat(i.primitives),o},{primitives:[]})),n}_resolveNodeChildren(e){return e.children&&(e.children=e.children.map(t=>this.getNode(t))),e}_resolveSkin(e,t){const n=typeof e.inverseBindMatrices=="number"?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:n}}_resolveMesh(e,t){const n={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(n.primitives=e.primitives.map(o=>{const s={...o,attributes:{},indices:void 0,material:void 0},i=o.attributes;for(const a in i)s.attributes[a]=this.getAccessor(i[a]);return o.indices!==void 0&&(s.indices=this.getAccessor(o.indices)),o.material!==void 0&&(s.material=this.getMaterial(o.material)),s})),n}_resolveMaterial(e,t){const n={...e,id:e.id||`material-${t}`};if(n.normalTexture&&(n.normalTexture={...n.normalTexture},n.normalTexture.texture=this.getTexture(n.normalTexture.index)),n.occlusionTexture&&(n.occlusionTexture={...n.occlusionTexture},n.occlusionTexture.texture=this.getTexture(n.occlusionTexture.index)),n.emissiveTexture&&(n.emissiveTexture={...n.emissiveTexture},n.emissiveTexture.texture=this.getTexture(n.emissiveTexture.index)),n.emissiveFactor||(n.emissiveFactor=n.emissiveTexture?[1,1,1]:[0,0,0]),n.pbrMetallicRoughness){n.pbrMetallicRoughness={...n.pbrMetallicRoughness};const o=n.pbrMetallicRoughness;o.baseColorTexture&&(o.baseColorTexture={...o.baseColorTexture},o.baseColorTexture.texture=this.getTexture(o.baseColorTexture.index)),o.metallicRoughnessTexture&&(o.metallicRoughnessTexture={...o.metallicRoughnessTexture},o.metallicRoughnessTexture.texture=this.getTexture(o.metallicRoughnessTexture.index))}return n}_resolveAccessor(e,t){const n=Ii(e.componentType),o=Fi(e.type),s=n*o,i={...e,id:e.id||`accessor-${t}`,bytesPerComponent:n,components:o,bytesPerElement:s,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(i.bufferView=this.getBufferView(e.bufferView)),i.bufferView){const a=i.bufferView.buffer,{ArrayType:c,byteLength:f}=ge(i,i.bufferView),u=(i.bufferView.byteOffset||0)+(i.byteOffset||0)+a.byteOffset;let l=Gt(a.arrayBuffer,u,f);i.bufferView.byteStride&&(l=this._getValueFromInterleavedBuffer(a,u,i.bufferView.byteStride,i.bytesPerElement,i.count)),i.value=new c(l)}return i}_getValueFromInterleavedBuffer(e,t,n,o,s){const i=new Uint8Array(s*o);for(let a=0;a<s;a++){const c=t+a*n;i.set(new Uint8Array(e.arrayBuffer.slice(c,c+o)),a*o)}return i.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler=="number"?this.getSampler(e.sampler):Ei(),source:typeof e.source=="number"?this.getImage(e.source):void 0}}_resolveSampler(e,t){const n={id:e.id||`sampler-${t}`,...e,parameters:{}};for(const o in n){const s=this._enumSamplerParameter(o);s!==void 0&&(n.parameters[s]=n[o])}return n}_enumSamplerParameter(e){return hi[e]}_resolveImage(e,t){const n={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView!==void 0?this.getBufferView(e.bufferView):void 0},o=this.images[t];return o&&(n.image=o),n}_resolveBufferView(e,t){const n=e.buffer,o=this.buffers[n].arrayBuffer;let s=this.buffers[n].byteOffset||0;return e.byteOffset&&(s+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[n],data:new Uint8Array(o,s,e.byteLength)}}_resolveCamera(e,t){const n={...e,id:e.id||`camera-${t}`};return n.perspective,n.orthographic,n}}function Ti(r,e){return new Mi().postProcess(r,e)}async function _i(r){const e=[];return r.scenes.forEach(t=>{t.traverse(n=>{})}),await Ri(()=>e.some(t=>!t.loaded))}async function Ri(r){for(;r();)await new Promise(e=>requestAnimationFrame(e))}const Ye=`uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  bool composeModelMatrix;
} scenegraph;
`,yi={name:"scenegraph",vs:Ye,fs:Ye,uniformTypes:{sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},Gi=`#version 300 es
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
`,Di=`#version 300 es
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
`,pt=[255,255,255,255],vi={scenegraph:{type:"object",value:null,async:!0},getScene:r=>r&&r.scenes?typeof r.scene=="object"?r.scene:r.scenes[r.scene||0]:r,getAnimator:r=>r&&r.animator,_animations:null,sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},getPosition:{type:"accessor",value:r=>r.position},getColor:{type:"accessor",value:pt},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[pe]};class Ct extends Dt{getShaders(){const e={};let t;this.props._lighting==="pbr"?(t=Ze,e.LIGHTING_PBR=1):t={name:"pbrMaterial"};const n=[vt,St,yi,t];return super.getShaders({defines:e,vs:Gi,fs:Di,modules:n})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),accessor:"getPosition",transition:!0},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:pt,transition:!0},instanceModelMatrix:ht})}updateState(e){super.updateState(e);const{props:t,oldProps:n}=e;t.scenegraph!==n.scenegraph?this._updateScenegraph():t._animations!==n._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){super.finalizeState(e),this.state.scenegraph?.destroy()}get isLoaded(){return!!(this.state?.scenegraph&&super.isLoaded)}_updateScenegraph(){const e=this.props,{device:t}=this.context;let n=null;if(e.scenegraph instanceof Y)n={scenes:[e.scenegraph]};else if(e.scenegraph&&typeof e.scenegraph=="object"){const a=e.scenegraph,c=a.json?Ti(a):a,f=cr(t,c,this._getModelOptions());n={gltf:c,...f},_i(f).then(()=>{this.setNeedsRedraw()}).catch(u=>{this.raiseError(u,"loading glTF")})}const o={layer:this,device:this.context.device},s=e.getScene(n,o),i=e.getAnimator(n,o);if(s instanceof O){this.state.scenegraph?.destroy(),this._applyAnimationsProp(i,e._animations);const a=[];s.traverse(c=>{c instanceof de&&a.push(c.model)}),this.setState({scenegraph:s,animator:i,models:a}),this.getAttributeManager().invalidateAll()}else s!==null&&ne.warn("invalid scenegraph:",s)()}_applyAnimationsProp(e,t){if(!e||!t)return;const n=e.getAnimations();Object.keys(t).sort().forEach(o=>{const s=t[o];if(o==="*")n.forEach(i=>{Object.assign(i,s)});else if(Number.isFinite(Number(o))){const i=Number(o);i>=0&&i<n.length?Object.assign(n[i],s):ne.warn(`animation ${o} not found`)()}else{const i=n.find(({animation:a})=>a.name===o);i?Object.assign(i,s):ne.warn(`animation ${o} not found`)()}})}_getModelOptions(){const{_imageBasedLightingEnvironment:e}=this.props;let t;return e&&(typeof e=="function"?t=e({gl:this.context.gl,layer:this}):t=e),{imageBasedLightingEnvironment:t,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.animate(e.timeline.getTime()),this.setNeedsRedraw());const{viewport:t,renderPass:n}=this.context,{sizeScale:o,sizeMinPixels:s,sizeMaxPixels:i,coordinateSystem:a}=this.props,c={camera:t.cameraPosition},f=this.getNumInstances();this.state.scenegraph.traverse((u,{worldMatrix:l})=>{if(u instanceof de){const{model:A}=u;A.setInstanceCount(f);const d={sizeScale:o,sizeMinPixels:s,sizeMaxPixels:i,composeModelMatrix:gt(t,a),sceneModelMatrix:l};A.shaderInputs.setProps({pbrProjection:c,scenegraph:d}),A.draw(n)}})}}Ct.defaultProps=vi;Ct.layerName="ScenegraphLayer";export{hs as D,pe as G,Ct as S,Hn as a,ke as b,Ti as c,Ui as g,Ze as p};
