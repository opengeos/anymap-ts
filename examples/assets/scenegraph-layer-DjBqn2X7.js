import{M as Gt,s as Dt}from"./matrix-BqM7Gdkv.js";import{at as K,au as Ut,av as Vt,aw as Oe,an as Q,ax as bt,$ as D,a6 as M,u as qt,b as U,e as zt,ay as Kt,az as Ht,aA as Fe,ar as ft,ad as Wt,aB as De,L as Jt,p as Xt,a as me}from"./mapbox-overlay-SHCiFDVh.js";import{p as $t}from"./picking-CN0D5Hbh.js";import{l as Yt}from"./lighting-nBava15z.js";import{G as Qt}from"./geometry-Mod_uJZu.js";import{Q as Zt,M as Pe}from"./quaternion-DkBQe9kP.js";async function lt(a,e,t,r){return r._parse(a,e,t,r)}function ea(a){globalThis.loaders||={},globalThis.loaders.modules||={},Object.assign(globalThis.loaders.modules,a)}function ta(a){return globalThis.loaders?.modules?.[a]||null}const he={};function dt(a={}){const e=a.useLocalLibraries??a.core?.useLocalLibraries,t=a.CDN??a.core?.CDN,r=a.modules;return{...e!==void 0?{useLocalLibraries:e}:{},...t!==void 0?{CDN:t}:{},...r!==void 0?{modules:r}:{}}}async function S(a,e=null,t={},r=null){if(e){const n=t.modules?.[r||a];if(n!==void 0&&typeof n!="string")return n;a=aa(a,e,t,r)}return he[a]=he[a]||ra(a),await he[a]}function aa(a,e,t={},r=null){if(t?.core)throw new Error("loadLibrary: options.core must be pre-normalized");r=r||a;const n=t.modules||{};return typeof n[r]=="string"?n[r]:!t.useLocalLibraries&&a.startsWith("http")?a:K?t.CDN?(Ut(t.CDN.startsWith("http")),`${t.CDN}/${e}@${Vt}/dist/libs/${r}`):Oe?`../src/libs/${r}`:`modules/${e}/src/libs/${r}`:`modules/${e}/dist/libs/${r}`}async function ra(a){if(a.endsWith("wasm"))return await oa(a);if(!K){const{requireFromFile:t}=globalThis.loaders||{};try{const r=await t?.(a);return r||!a.includes("/dist/libs/")?r:await t?.(a.replace("/dist/libs/","/src/libs/"))}catch(r){if(a.includes("/dist/libs/"))try{return await t?.(a.replace("/dist/libs/","/src/libs/"))}catch{}return console.error(r),null}}if(Oe)return importScripts(a);const e=await sa(a);return na(e,a)}function na(a,e){if(!K){const{requireFromString:r}=globalThis.loaders||{};return r?.(a,e)}if(Oe)return eval.call(globalThis,a),null;const t=document.createElement("script");t.id=e;try{t.appendChild(document.createTextNode(a))}catch{t.text=a}return document.body.appendChild(t),null}async function oa(a){const{readFileAsArrayBuffer:e}=globalThis.loaders||{};if(K||!e||a.startsWith("http"))return await(await fetch(a)).arrayBuffer();try{return await e(a)}catch{if(a.includes("/dist/libs/"))return await e(a.replace("/dist/libs/","/src/libs/"));throw new Error(`Failed to load ArrayBuffer from ${a}`)}}async function sa(a){const{readFileAsText:e}=globalThis.loaders||{};if(K||!e||a.startsWith("http"))return await(await fetch(a)).text();try{return await e(a)}catch{if(a.includes("/dist/libs/"))return await e(a.replace("/dist/libs/","/src/libs/"));throw new Error(`Failed to load text from ${a}`)}}function ia(a,e=5){return typeof a=="string"?a.slice(0,e):ArrayBuffer.isView(a)?Ue(a.buffer,a.byteOffset,e):a instanceof ArrayBuffer?Ue(a,0,e):""}function Ue(a,e,t){if(a.byteLength<=e+t)return"";const r=new DataView(a);let n="";for(let o=0;o<t;o++)n+=String.fromCharCode(r.getUint8(e+o));return n}function ca(a){try{return JSON.parse(a)}catch{throw new Error(`Failed to parse JSON from data starting with "${ia(a)}"`)}}function ee(a,e){return Q(a>=0),Q(e>0),a+(e-1)&-4}function ba(a,e,t){let r;if(a instanceof ArrayBuffer)r=new Uint8Array(a);else{const n=a.byteOffset,o=a.byteLength;r=new Uint8Array(a.buffer||a.arrayBuffer,n,o)}return e.set(r,t),t+ee(r.byteLength,4)}function fe(a,e){return new Promise((t,r)=>{let n=!1;function o(i){n||(n=!0,r(i))}function s(i){if(!n){n=!0;try{t(e(i))}catch(c){r(c)}}}try{a(s,o)?.then(s,o)}catch(i){o(i)}})}function fa(a){switch(a.constructor){case Int8Array:return"int8";case Uint8Array:case Uint8ClampedArray:return"uint8";case Int16Array:return"int16";case Uint16Array:return"uint16";case Int32Array:return"int32";case Uint32Array:return"uint32";case Float32Array:return"float32";case Float64Array:return"float64";default:return"null"}}function la(a){let e=1/0,t=1/0,r=1/0,n=-1/0,o=-1/0,s=-1/0;const i=a.POSITION?a.POSITION.value:[],c=i&&i.length;for(let b=0;b<c;b+=3){const f=i[b],l=i[b+1],u=i[b+2];e=f<e?f:e,t=l<t?l:t,r=u<r?u:r,n=f>n?f:n,o=l>o?l:o,s=u>s?u:s}return[[e,t,r],[n,o,s]]}function da(a,e,t){const r=fa(e.value),n=t||ua(e);return{name:a,type:{type:"fixed-size-list",listSize:e.size,children:[{name:"value",type:r}]},nullable:!1,metadata:n}}function ua(a){const e={};return"byteOffset"in a&&(e.byteOffset=a.byteOffset.toString(10)),"byteStride"in a&&(e.byteStride=a.byteStride.toString(10)),"normalized"in a&&(e.normalized=a.normalized.toString()),e}const pa=["image/png","image/jpeg","image/gif","image/webp","image/avif","image/tiff","image/svg","image/svg+xml","image/bmp","image/vnd.microsoft.icon"];let ae=null;async function ma(){return ae?await ae:(ae=ha(),await ae)}async function ha(){const a=new Set;for(const e of pa)(bt?await va(e):ut(e))&&a.add(e);return a}const ge={};function ga(a){if(ge[a]===void 0){const e=bt?Aa(a):ut(a);ge[a]=e}return ge[a]}function ut(a){const e=["image/png","image/jpeg","image/gif"],t=globalThis.loaders?.imageFormatsNode||e;return!!globalThis.loaders?.parseImageNode&&t.includes(a)}function Aa(a){switch(a){case"image/avif":case"image/webp":return _a(a);default:return!0}}const xa={"image/avif":"data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=","image/webp":"data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA"};async function va(a){const e=xa[a];return e?await Ta(e):!0}function _a(a){try{return document.createElement("canvas").toDataURL(a).indexOf(`data:${a}`)===0}catch{return!1}}async function Ta(a){return new Promise(e=>{const t=new Image;t.src=a,t.onload=()=>e(t.height>0),t.onerror=()=>e(!1)})}const ya=`out vec3 pbr_vPosition;
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
`,Ea=`precision highp float;

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
`,wa=`struct PBRFragmentInputs {
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
`,Ve=`uniform pbrProjectionUniforms {
  mat4 modelViewProjectionMatrix;
  mat4 modelMatrix;
  mat4 normalMatrix;
  vec3 camera;
} pbrProjection;
`,Ra={name:"pbrProjection",vs:Ve,fs:Ve,getUniforms:a=>a,uniformTypes:{modelViewProjectionMatrix:"mat4x4<f32>",modelMatrix:"mat4x4<f32>",normalMatrix:"mat4x4<f32>",camera:"vec3<i32>"}},pt={props:{},uniforms:{},name:"pbrMaterial",dependencies:[Yt,Ra],source:wa,vs:ya,fs:Ea,defines:{LIGHTING_FRAGMENT:!0,HAS_NORMALMAP:!1,HAS_EMISSIVEMAP:!1,HAS_OCCLUSIONMAP:!1,HAS_BASECOLORMAP:!1,HAS_METALROUGHNESSMAP:!1,ALPHA_CUTOFF:!1,USE_IBL:!1,PBR_DEBUG:!1},getUniforms:a=>a,uniformTypes:{unlit:"i32",baseColorMapEnabled:"i32",baseColorFactor:"vec4<f32>",normalMapEnabled:"i32",normalScale:"f32",emissiveMapEnabled:"i32",emissiveFactor:"vec3<f32>",metallicRoughnessValues:"vec2<f32>",metallicRoughnessMapEnabled:"i32",occlusionMapEnabled:"i32",occlusionStrength:"f32",alphaCutoffEnabled:"i32",alphaCutoff:"f32",IBLenabled:"i32",scaleIBLAmbient:"vec2<f32>",scaleDiffBaseMR:"vec4<f32>",scaleFGDSpec:"vec4<f32>"}};class se{id;matrix=new D;display=!0;position=new M;rotation=new M;scale=new M(1,1,1);userData={};props={};constructor(e={}){const{id:t}=e;this.id=t||qt(this.constructor.name),this._setScenegraphNodeProps(e)}getBounds(){return null}destroy(){}delete(){this.destroy()}setProps(e){return this._setScenegraphNodeProps(e),this}toString(){return`{type: ScenegraphNode, id: ${this.id})}`}setPosition(e){return this.position=e,this}setRotation(e){return this.rotation=e,this}setScale(e){return this.scale=e,this}setMatrix(e,t=!0){t?this.matrix.copy(e):this.matrix=e}setMatrixComponents(e){const{position:t,rotation:r,scale:n,update:o=!0}=e;return t&&this.setPosition(t),r&&this.setRotation(r),n&&this.setScale(n),o&&this.updateMatrix(),this}updateMatrix(){const e=this.position,t=this.rotation,r=this.scale;return this.matrix.identity(),this.matrix.translate(e),this.matrix.rotateXYZ(t),this.matrix.scale(r),this}update(e={}){const{position:t,rotation:r,scale:n}=e;return t&&this.setPosition(t),r&&this.setRotation(r),n&&this.setScale(n),this.updateMatrix(),this}getCoordinateUniforms(e,t){t=t||this.matrix;const r=new D(e).multiplyRight(t),n=r.invert(),o=n.transpose();return{viewMatrix:e,modelMatrix:t,objectMatrix:t,worldMatrix:r,worldInverseMatrix:n,worldInverseTransposeMatrix:o}}_setScenegraphNodeProps(e){"position"in e&&this.setPosition(e.position),"rotation"in e&&this.setRotation(e.rotation),"scale"in e&&this.setScale(e.scale),"matrix"in e&&this.setMatrix(e.matrix),Object.assign(this.props,e)}}class H extends se{children;constructor(e={}){e=Array.isArray(e)?{children:e}:e;const{children:t=[]}=e;U.assert(t.every(r=>r instanceof se),"every child must an instance of ScenegraphNode"),super(e),this.children=t}getBounds(){const e=[[1/0,1/0,1/0],[-1/0,-1/0,-1/0]];return this.traverse((t,{worldMatrix:r})=>{const n=t.getBounds();if(!n)return;const[o,s]=n,i=new M(o).add(s).divide([2,2,2]);r.transformAsPoint(i,i);const c=new M(s).subtract(o).divide([2,2,2]);r.transformAsVector(c,c);for(let b=0;b<8;b++){const f=new M(b&1?-1:1,b&2?-1:1,b&4?-1:1).multiply(c).add(i);for(let l=0;l<3;l++)e[0][l]=Math.min(e[0][l],f[l]),e[1][l]=Math.max(e[1][l],f[l])}}),Number.isFinite(e[0][0])?e:null}destroy(){this.children.forEach(e=>e.destroy()),this.removeAll(),super.destroy()}add(...e){for(const t of e)Array.isArray(t)?this.add(...t):this.children.push(t);return this}remove(e){const t=this.children,r=t.indexOf(e);return r>-1&&t.splice(r,1),this}removeAll(){return this.children=[],this}traverse(e,{worldMatrix:t=new D}={}){const r=new D(t).multiplyRight(this.matrix);for(const n of this.children)n instanceof H?n.traverse(e,{worldMatrix:r}):e(n,{worldMatrix:r})}}class we extends se{model;bounds=null;managedResources;constructor(e){super(e),this.model=e.model,this.managedResources=e.managedResources||[],this.bounds=e.bounds||null,this.setProps(e)}destroy(){this.model&&(this.model.destroy(),this.model=null),this.managedResources.forEach(e=>e.destroy()),this.managedResources=[]}getBounds(){return this.bounds}draw(e){return this.model.draw(e)}}const Sa="4.5.4",ie={TRANSCODER:"basis_transcoder.js",TRANSCODER_WASM:"basis_transcoder.wasm",ENCODER:"basis_encoder.js",ENCODER_WASM:"basis_encoder.wasm"};let qe;async function ze(a){ea(a.modules);const e=ta("basis");return e||(qe||=Ia(a),await qe)}async function Ia(a){let e=null,t=null;return[e,t]=await Promise.all([await S(ie.TRANSCODER,"textures",a),await S(ie.TRANSCODER_WASM,"textures",a)]),e=e||globalThis.BASIS,await La(e,t)}function La(a,e){const t={};return e&&(t.wasmBinary=e),fe(()=>a(t),r=>{const{BasisFile:n,initializeBasis:o}=r;return o(),{BasisFile:n}})}let Ae;async function Ke(a){const e=a.modules||{};return e.basisEncoder?e.basisEncoder:(Ae=Ae||ja(a),await Ae)}async function ja(a){let e=null,t=null;return[e,t]=await Promise.all([await S(ie.ENCODER,"textures",a),await S(ie.ENCODER_WASM,"textures",a)]),e=e||globalThis.BASIS,await Oa(e,t)}function Oa(a,e){const t={};return e&&(t.wasmBinary=e),fe(()=>a(t),r=>{const{BasisFile:n,KTX2File:o,BasisEncoder:s,initializeBasis:i}=r;return i(),{BasisFile:n,KTX2File:o,BasisEncoder:s}})}const Fa=32854,Pa=32856,He=36194,Ma=33776,Ca=33779,ka=37493,Ba=35840,Na=35842,Ga=36196,Da=35986,Ua=34798,Va=37808,qa=36283,za=36285,We=36492,Ka=["","WEBKIT_","MOZ_"],Je={WEBGL_compressed_texture_s3tc:["bc1-rgb-unorm-webgl","bc1-rgba-unorm","bc2-rgba-unorm","bc3-rgba-unorm"],WEBGL_compressed_texture_s3tc_srgb:["bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm-srgb","bc2-rgba-unorm-srgb","bc3-rgba-unorm-srgb"],EXT_texture_compression_rgtc:["bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm"],EXT_texture_compression_bptc:["bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb"],WEBGL_compressed_texture_etc1:["etc1-rgb-unorm-webgl"],WEBGL_compressed_texture_etc:["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"],WEBGL_compressed_texture_pvrtc:["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"],WEBGL_compressed_texture_atc:["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"],WEBGL_compressed_texture_astc:["astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm","astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"]};let re=null;function Ha(a){if(!re){a=a||Wa()||void 0,re=new Set;for(const e of Ka)for(const t in Je)if(a&&a.getExtension(`${e}${t}`))for(const r of Je[t])re.add(r)}return re}function Wa(){try{return document.createElement("canvas").getContext("webgl")}catch{return null}}const w=[171,75,84,88,32,50,48,187,13,10,26,10];function Ja(a){const e=new Uint8Array(a);return!(e.byteLength<w.length||e[0]!==w[0]||e[1]!==w[1]||e[2]!==w[2]||e[3]!==w[3]||e[4]!==w[4]||e[5]!==w[5]||e[6]!==w[6]||e[7]!==w[7]||e[8]!==w[8]||e[9]!==w[9]||e[10]!==w[10]||e[11]!==w[11])}let Xe=Promise.resolve();const mt={etc1:{basisFormat:0,compressed:!0,format:Ga,textureFormat:"etc1-rgb-unorm-webgl"},etc2:{basisFormat:1,compressed:!0,format:ka,textureFormat:"etc2-rgba8unorm"},bc1:{basisFormat:2,compressed:!0,format:Ma,textureFormat:"bc1-rgb-unorm-webgl"},bc3:{basisFormat:3,compressed:!0,format:Ca,textureFormat:"bc3-rgba-unorm"},bc4:{basisFormat:4,compressed:!0,format:qa,textureFormat:"bc4-r-unorm"},bc5:{basisFormat:5,compressed:!0,format:za,textureFormat:"bc5-rg-unorm"},"bc7-m6-opaque-only":{basisFormat:6,compressed:!0,format:We,textureFormat:"bc7-rgba-unorm"},"bc7-m5":{basisFormat:6,compressed:!0,format:We,textureFormat:"bc7-rgba-unorm"},"pvrtc1-4-rgb":{basisFormat:8,compressed:!0,format:Ba,textureFormat:"pvrtc-rgb4unorm-webgl"},"pvrtc1-4-rgba":{basisFormat:9,compressed:!0,format:Na,textureFormat:"pvrtc-rgba4unorm-webgl"},"astc-4x4":{basisFormat:10,compressed:!0,format:Va,textureFormat:"astc-4x4-unorm"},"atc-rgb":{basisFormat:11,compressed:!0,format:Da,textureFormat:"atc-rgb-unorm-webgl"},"atc-rgba-interpolated-alpha":{basisFormat:12,compressed:!0,format:Ua,textureFormat:"atc-rgbai-unorm-webgl"},rgba32:{basisFormat:13,compressed:!1,format:Pa,textureFormat:"rgba8unorm"},rgb565:{basisFormat:14,compressed:!1,format:He,textureFormat:"rgb565unorm-webgl"},bgr565:{basisFormat:15,compressed:!1,format:He,textureFormat:"rgb565unorm-webgl"},rgba4444:{basisFormat:16,compressed:!1,format:Fa,textureFormat:"rgba4unorm-webgl"}};Object.freeze(Object.keys(mt));async function Xa(a){const e=Xe;let t;Xe=new Promise(r=>{t=r}),await e;try{return await a()}finally{t()}}async function $a(a,e={}){const t=dt(e);return await Xa(async()=>{if(!e.basis?.containerFormat||e.basis.containerFormat==="auto"){if(Ja(a)){const n=await Ke(t);return $e(n.KTX2File,a,e)}const{BasisFile:r}=await ze(t);return xe(r,a,e)}if(e.basis.module==="encoder"){const r=await Ke(t);return e.basis.containerFormat==="ktx2"?$e(r.KTX2File,a,e):xe(r.BasisFile,a,e)}else{const{BasisFile:n}=await ze(t);return xe(n,a,e)}})}function xe(a,e,t){const r=new a(new Uint8Array(e));try{if(!r.startTranscoding())throw new Error("Failed to start basis transcoding");const n=r.getNumImages(),o=[];for(let s=0;s<n;s++){const i=r.getNumLevels(s),c=[];for(let b=0;b<i;b++)c.push(Ya(r,s,b,t));o.push(c)}return o}finally{r.close(),r.delete()}}function Ya(a,e,t,r){const n=a.getImageWidth(e,t),o=a.getImageHeight(e,t),s=a.getHasAlpha(),{compressed:i,format:c,basisFormat:b,textureFormat:f}=ht(r,s),l=a.getImageTranscodedSizeInBytes(e,t,b),u=new Uint8Array(l);if(!a.transcodeImage(u,e,t,b,0,0))throw new Error("failed to start Basis transcoding");return{shape:"texture-level",width:n,height:o,data:u,compressed:i,...c!==void 0?{format:c}:{},...f!==void 0?{textureFormat:f}:{},hasAlpha:s}}function $e(a,e,t){const r=new a(new Uint8Array(e));try{if(!r.startTranscoding())throw new Error("failed to start KTX2 transcoding");const n=r.getLevels(),o=[];for(let s=0;s<n;s++)o.push(Qa(r,s,t));return[o]}finally{r.close(),r.delete()}}function Qa(a,e,t){const{alphaFlag:r,height:n,width:o}=a.getImageLevelInfo(e,0,0),{compressed:s,format:i,basisFormat:c,textureFormat:b}=ht(t,r),f=a.getImageTranscodedSizeInBytes(e,0,0,c),l=new Uint8Array(f);if(!a.transcodeImage(l,e,0,0,c,0,-1,-1))throw new Error("Failed to transcode KTX2 image");return{shape:"texture-level",width:o,height:n,data:l,compressed:s,...i!==void 0?{format:i}:{},...b!==void 0?{textureFormat:b}:{},levelSize:f,hasAlpha:r}}function ht(a,e){let t=a.basis?.format||"auto";t==="auto"&&(t=a.basis?.supportedTextureFormats?Re(a.basis.supportedTextureFormats):Re()),typeof t=="object"&&(t=e?t.alpha:t.noAlpha);const r=t.toLowerCase(),n=mt[r];if(!n)throw new Error(`Unknown Basis format ${t}`);return n}function Re(a=Ha()){const e=new Set(a);return k(e,["astc-4x4-unorm","astc-4x4-unorm-srgb"])?"astc-4x4":k(e,["bc7-rgba-unorm","bc7-rgba-unorm-srgb"])?{alpha:"bc7-m5",noAlpha:"bc7-m6-opaque-only"}:k(e,["bc1-rgb-unorm-webgl","bc1-rgb-unorm-srgb-webgl","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb"])?{alpha:"bc3",noAlpha:"bc1"}:k(e,["pvrtc-rgb4unorm-webgl","pvrtc-rgba4unorm-webgl","pvrtc-rgb2unorm-webgl","pvrtc-rgba2unorm-webgl"])?{alpha:"pvrtc1-4-rgba",noAlpha:"pvrtc1-4-rgb"}:k(e,["etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm"])?"etc2":e.has("etc1-rgb-unorm-webgl")?"etc1":k(e,["atc-rgb-unorm-webgl","atc-rgba-unorm-webgl","atc-rgbai-unorm-webgl"])?{alpha:"atc-rgba-interpolated-alpha",noAlpha:"atc-rgb"}:"rgb565"}function k(a,e){return e.some(t=>a.has(t))}const Za={dataType:null,batchType:null,name:"Basis",id:"basis",module:"textures",version:Sa,worker:!0,extensions:["basis","ktx2"],mimeTypes:["application/octet-stream","image/ktx2"],tests:["sB"],binary:!0,options:{basis:{format:"auto",containerFormat:"auto",module:"transcoder"}}},er={...Za,parse:$a};function tr(a){return{addressModeU:Ye(a.wrapS),addressModeV:Ye(a.wrapT),magFilter:ar(a.magFilter),...rr(a.minFilter)}}function Ye(a){switch(a){case 33071:return"clamp-to-edge";case 10497:return"repeat";case 33648:return"mirror-repeat";default:return}}function ar(a){switch(a){case 9728:return"nearest";case 9729:return"linear";default:return}}function rr(a){switch(a){case 9728:return{minFilter:"nearest"};case 9729:return{minFilter:"linear"};case 9984:return{minFilter:"nearest",mipmapFilter:"nearest"};case 9985:return{minFilter:"linear",mipmapFilter:"nearest"};case 9986:return{minFilter:"nearest",mipmapFilter:"linear"};case 9987:return{minFilter:"linear",mipmapFilter:"linear"};default:return{}}}function nr(a,e,t,r){const n={defines:{MANUAL_SRGB:!0,SRGB_FAST_APPROXIMATION:!0},bindings:{},uniforms:{camera:[0,0,0],metallicRoughnessValues:[1,1]},parameters:{},glParameters:{},generatedTextures:[]};n.defines.USE_TEX_LOD=!0;const{imageBasedLightingEnvironment:o}=r;return o&&(n.bindings.pbr_diffuseEnvSampler=o.diffuseEnvSampler.texture,n.bindings.pbr_specularEnvSampler=o.specularEnvSampler.texture,n.bindings.pbr_BrdfLUT=o.brdfLutTexture.texture,n.uniforms.scaleIBLAmbient=[1,1]),r?.pbrDebug&&(n.defines.PBR_DEBUG=!0,n.uniforms.scaleDiffBaseMR=[0,0,0,0],n.uniforms.scaleFGDSpec=[0,0,0,0]),t.NORMAL&&(n.defines.HAS_NORMALS=!0),t.TANGENT&&r?.useTangents&&(n.defines.HAS_TANGENTS=!0),t.TEXCOORD_0&&(n.defines.HAS_UV=!0),r?.imageBasedLightingEnvironment&&(n.defines.USE_IBL=!0),r?.lights&&(n.defines.USE_LIGHTS=!0),e&&or(a,e,n),n}function or(a,e,t){if(t.uniforms.unlit=!!e.unlit,e.pbrMetallicRoughness&&sr(a,e.pbrMetallicRoughness,t),e.normalTexture){$(a,e.normalTexture,"pbr_normalSampler","HAS_NORMALMAP",t);const{scale:r=1}=e.normalTexture;t.uniforms.normalScale=r}if(e.occlusionTexture){$(a,e.occlusionTexture,"pbr_occlusionSampler","HAS_OCCLUSIONMAP",t);const{strength:r=1}=e.occlusionTexture;t.uniforms.occlusionStrength=r}switch(e.emissiveTexture&&($(a,e.emissiveTexture,"pbr_emissiveSampler","HAS_EMISSIVEMAP",t),t.uniforms.emissiveFactor=e.emissiveFactor||[0,0,0]),e.alphaMode||"MASK"){case"MASK":const{alphaCutoff:r=.5}=e;t.defines.ALPHA_CUTOFF=!0,t.uniforms.alphaCutoff=r;break;case"BLEND":U.warn("glTF BLEND alphaMode might not work well because it requires mesh sorting")(),t.parameters.blend=!0,t.parameters.blendColorOperation="add",t.parameters.blendColorSrcFactor="src-alpha",t.parameters.blendColorDstFactor="one-minus-src-alpha",t.parameters.blendAlphaOperation="add",t.parameters.blendAlphaSrcFactor="one",t.parameters.blendAlphaDstFactor="one-minus-src-alpha",t.glParameters.blend=!0,t.glParameters.blendEquation=32774,t.glParameters.blendFunc=[770,771,1,771];break}}function sr(a,e,t){e.baseColorTexture&&$(a,e.baseColorTexture,"pbr_baseColorSampler","HAS_BASECOLORMAP",t),t.uniforms.baseColorFactor=e.baseColorFactor||[1,1,1,1],e.metallicRoughnessTexture&&$(a,e.metallicRoughnessTexture,"pbr_metallicRoughnessSampler","HAS_METALROUGHNESSMAP",t);const{metallicFactor:r=1,roughnessFactor:n=1}=e;t.uniforms.metallicRoughnessValues=[r,n]}function $(a,e,t,r,n){const o=e.texture.source.image;let s;o.compressed?s=o:s={data:o};const i={wrapS:10497,wrapT:10497,...e?.texture?.sampler},c=a.createTexture({id:e.uniformName||e.id,sampler:tr(i),...s});n.bindings[t]=c,r&&(n.defines[r]=!0),n.generatedTextures.push(c)}var F;(function(a){a[a.POINTS=0]="POINTS",a[a.LINES=1]="LINES",a[a.LINE_LOOP=2]="LINE_LOOP",a[a.LINE_STRIP=3]="LINE_STRIP",a[a.TRIANGLES=4]="TRIANGLES",a[a.TRIANGLE_STRIP=5]="TRIANGLE_STRIP",a[a.TRIANGLE_FAN=6]="TRIANGLE_FAN"})(F||(F={}));function ir(a){switch(a){case F.POINTS:return"point-list";case F.LINES:return"line-list";case F.LINE_STRIP:return"line-strip";case F.TRIANGLES:return"triangle-list";case F.TRIANGLE_STRIP:return"triangle-strip";default:throw new Error(String(a))}}const cr=`
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
`,br=`#version 300 es

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
`,fr=`#version 300 es
  out vec4 fragmentColor;

  void main(void) {
    vec3 pos = pbr_vPosition;
    fragmentColor = pbr_filterColor(vec4(1.0));
  }
`;function lr(a,e){const{id:t,geometry:r,parsedPPBRMaterial:n,vertexCount:o,modelOptions:s={}}=e;U.info(4,"createGLTFModel defines: ",n.defines)();const i=[],c={depthWriteEnabled:!0,depthCompare:"less",depthFormat:"depth24plus",cullMode:"back"},b={id:t,source:cr,vs:br,fs:fr,geometry:r,topology:r.topology,vertexCount:o,modules:[pt],...s,defines:{...n.defines,...s.defines},parameters:{...c,...n.parameters,...s.parameters}},f=new zt(a,b),{camera:l,...u}={...n.uniforms,...s.uniforms,...n.bindings,...s.bindings};return f.shaderInputs.setProps({pbrMaterial:u,pbrProjection:{camera:l}}),new we({managedResources:i,model:f})}const dr={modelOptions:{},pbrDebug:!1,imageBasedLightingEnvironment:void 0,lights:!0,useTangents:!1};function ur(a,e,t={}){const r={...dr,...t};return e.scenes.map(o=>pr(a,o,e.nodes,r))}function pr(a,e,t,r){const o=(e.nodes||[]).map(i=>gt(a,i,t,r));return new H({id:e.name||e.id,children:o})}function gt(a,e,t,r){if(!e._node){const s=(e.children||[]).map(c=>gt(a,c,t,r));e.mesh&&s.push(mr(a,e.mesh,r));const i=new H({id:e.name||e.id,children:s});if(e.matrix)i.setMatrix(e.matrix);else{if(i.matrix.identity(),e.translation&&i.matrix.translate(e.translation),e.rotation){const c=new D().fromQuaternion(e.rotation);i.matrix.multiplyRight(c)}e.scale&&i.matrix.scale(e.scale)}e._node=i}const n=t.find(o=>o.id===e.id);return n._node=e._node,e._node}function mr(a,e,t){if(!e._mesh){const n=(e.primitives||[]).map((s,i)=>hr(a,s,i,e,t)),o=new H({id:e.name||e.id,children:n});e._mesh=o}return e._mesh}function hr(a,e,t,r,n){const o=e.name||`${r.name||r.id}-primitive-${t}`,s=ir(e.mode||4),i=e.indices?e.indices.count:gr(e.attributes),c=Qe(o,e,s),b=nr(a,e.material,c.attributes,n),f=lr(a,{id:o,geometry:Qe(o,e,s),parsedPPBRMaterial:b,modelOptions:n.modelOptions,vertexCount:i});return f.bounds=[e.attributes.POSITION.min,e.attributes.POSITION.max],f}function gr(a){throw new Error("getVertexCount not implemented")}function Qe(a,e,t){const r={};for(const[n,o]of Object.entries(e.attributes)){const{components:s,size:i,value:c}=o;r[n]={size:i??s,value:c}}return new Qt({id:a,topology:t,indices:e.indices.value,attributes:r})}const ve=new Zt;function Ar(a,{input:e,interpolation:t,output:r},n,o){const s=e[e.length-1],i=a%s,c=e.findIndex(u=>u>=i),b=Math.max(0,c-1);if(!Array.isArray(n[o]))switch(o){case"translation":n[o]=[0,0,0];break;case"rotation":n[o]=[0,0,0,1];break;case"scale":n[o]=[1,1,1];break;default:U.warn(`Bad animation path ${o}`)()}const f=e[b],l=e[c];switch(t){case"STEP":_r(n,o,r[b]);break;case"LINEAR":if(l>f){const u=(i-f)/(l-f);xr(n,o,r[b],r[c],u)}break;case"CUBICSPLINE":if(l>f){const u=(i-f)/(l-f),A=l-f,T=r[3*b+1],y=r[3*b+2],I=r[3*c+0],p=r[3*c+1];vr(n,o,{p0:T,outTangent0:y,inTangent1:I,p1:p,tDiff:A,ratio:u})}break;default:U.warn(`Interpolation ${t} not supported`)();break}}function xr(a,e,t,r,n){if(!a[e])throw new Error;if(e==="rotation"){ve.slerp({start:t,target:r,ratio:n});for(let o=0;o<ve.length;o++)a[e][o]=ve[o]}else for(let o=0;o<t.length;o++)a[e][o]=n*r[o]+(1-n)*t[o]}function vr(a,e,{p0:t,outTangent0:r,inTangent1:n,p1:o,tDiff:s,ratio:i}){if(!a[e])throw new Error;for(let c=0;c<a[e].length;c++){const b=r[c]*s,f=n[c]*s;a[e][c]=(2*Math.pow(i,3)-3*Math.pow(i,2)+1)*t[c]+(Math.pow(i,3)-2*Math.pow(i,2)+i)*b+(-2*Math.pow(i,3)+3*Math.pow(i,2))*o[c]+(Math.pow(i,3)-Math.pow(i,2))*f}}function _r(a,e,t){if(!a[e])throw new Error;for(let r=0;r<t.length;r++)a[e][r]=t[r]}class Tr{animation;startTime=0;playing=!0;speed=1;constructor(e){this.animation=e.animation,this.animation.name||="unnamed",Object.assign(this,e)}setTime(e){if(!this.playing)return;const r=(e/1e3-this.startTime)*this.speed;this.animation.channels.forEach(({sampler:n,target:o,path:s})=>{Ar(r,n,o,s),wr(o,o._node)})}}class yr{animations;constructor(e){this.animations=e.animations.map((t,r)=>{const n=t.name||`Animation-${r}`;return new Tr({animation:{name:n,channels:t.channels}})})}animate(e){U.warn("GLTFAnimator#animate is deprecated. Use GLTFAnimator#setTime instead")(),this.setTime(e)}setTime(e){this.animations.forEach(t=>t.setTime(e))}getAnimations(){return this.animations}}const Er=new D;function wr(a,e){if(e.matrix.identity(),a.translation&&e.matrix.translate(a.translation),a.rotation){const t=Er.fromQuaternion(a.rotation);e.matrix.multiplyRight(t)}a.scale&&e.matrix.scale(a.scale)}const Rr={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Sr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function Ir(a){const e=Sr[a.componentType],t=Rr[a.type],r=t*a.count,{buffer:n,byteOffset:o=0}=a.bufferView?.data??{};return{typedArray:new e(n,o+(a.byteOffset||0),r),components:t}}function Lr(a){return(a.animations||[]).map((t,r)=>{const n=t.name||`Animation-${r}`,o=t.samplers.map(({input:i,interpolation:c="LINEAR",output:b})=>({input:Ze(a.accessors[i]),interpolation:c,output:Ze(a.accessors[b])})),s=t.channels.map(({sampler:i,target:c})=>({sampler:o[i],target:a.nodes[c.node??0],path:c.path}));return{name:n,channels:s}})}function Ze(a){if(!a._animation){const{typedArray:e,components:t}=Ir(a);if(t===1)a._animation=Array.from(e);else{const r=[];for(let n=0;n<e.length;n+=t)r.push(Array.from(e.slice(n,n+t)));a._animation=r}}return a._animation}function Se(a){if(ArrayBuffer.isView(a)||a instanceof ArrayBuffer||a instanceof ImageBitmap)return a;if(Array.isArray(a))return a.map(Se);if(a&&typeof a=="object"){const e={};for(const t in a)e[t]=Se(a[t]);return e}return a}function jr(a,e,t){e=Se(e);const r=ur(a,e,t),n=Lr(e),o=new yr({animations:n});return{scenes:r,animator:o}}function _(a,e){if(!a)throw new Error(e||"assert failed: gltf")}const At={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},xt={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},Or=1.33,et=["SCALAR","VEC2","VEC3","VEC4"],Fr=[[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125],[Float32Array,5126],[Float64Array,5130]],Pr=new Map(Fr),Mr={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Cr={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},kr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};function vt(a){return et[a-1]||et[0]}function le(a){const e=Pr.get(a.constructor);if(!e)throw new Error("Illegal typed array");return e}function ce(a,e){const t=kr[a.componentType],r=Mr[a.type],n=Cr[a.componentType],o=a.count*r,s=a.count*r*n;_(s>=0&&s<=e.byteLength);const i=xt[a.componentType],c=At[a.type];return{ArrayType:t,length:o,byteLength:s,componentByteSize:i,numberOfComponentsInElement:c}}function di(a){let{images:e,bufferViews:t}=a;e=e||[],t=t||[];const r=e.map(s=>s.bufferView);t=t.filter(s=>!r.includes(s));const n=t.reduce((s,i)=>s+i.byteLength,0),o=e.reduce((s,i)=>{const{width:c,height:b}=i.image;return s+c*b},0);return n+Math.ceil(4*o*Or)}function Br(a,e,t){const r=a.bufferViews[t];_(r);const n=r.buffer,o=e[n];_(o);const s=(r.byteOffset||0)+o.byteOffset;return new Uint8Array(o.arrayBuffer,s,r.byteLength)}function Nr(a,e,t){const r=typeof t=="number"?a.accessors?.[t]:t;if(!r)throw new Error(`No gltf accessor ${JSON.stringify(t)}`);const n=a.bufferViews?.[r.bufferView||0];if(!n)throw new Error(`No gltf buffer view for accessor ${n}`);const{arrayBuffer:o,byteOffset:s}=e[n.buffer],i=(s||0)+(r.byteOffset||0)+(n.byteOffset||0),{ArrayType:c,length:b,componentByteSize:f,numberOfComponentsInElement:l}=ce(r,n),u=f*l,A=n.byteStride||u;if(typeof n.byteStride>"u"||n.byteStride===u)return new c(o,i,b);const T=new c(b);for(let y=0;y<r.count;y++){const I=new c(o,i+y*A,l);T.set(I,y*l)}return T}function Gr(){return{asset:{version:"2.0",generator:"loaders.gl"},buffers:[],extensions:{},extensionsRequired:[],extensionsUsed:[]}}class x{gltf;sourceBuffers;byteLength;constructor(e){this.gltf={json:e?.json||Gr(),buffers:e?.buffers||[],images:e?.images||[]},this.sourceBuffers=[],this.byteLength=0,this.gltf.buffers&&this.gltf.buffers[0]&&(this.byteLength=this.gltf.buffers[0].byteLength,this.sourceBuffers=[this.gltf.buffers[0]])}get json(){return this.gltf.json}getApplicationData(e){return this.json[e]}getExtraData(e){return(this.json.extras||{})[e]}hasExtension(e){const t=this.getUsedExtensions().find(n=>n===e),r=this.getRequiredExtensions().find(n=>n===e);return typeof t=="string"||typeof r=="string"}getExtension(e){const t=this.getUsedExtensions().find(n=>n===e),r=this.json.extensions||{};return t?r[e]:null}getRequiredExtension(e){return this.getRequiredExtensions().find(r=>r===e)?this.getExtension(e):null}getRequiredExtensions(){return this.json.extensionsRequired||[]}getUsedExtensions(){return this.json.extensionsUsed||[]}getRemovedExtensions(){return this.json.extensionsRemoved||[]}getObjectExtension(e,t){return(e.extensions||{})[t]}getScene(e){return this.getObject("scenes",e)}getNode(e){return this.getObject("nodes",e)}getSkin(e){return this.getObject("skins",e)}getMesh(e){return this.getObject("meshes",e)}getMaterial(e){return this.getObject("materials",e)}getAccessor(e){return this.getObject("accessors",e)}getTexture(e){return this.getObject("textures",e)}getSampler(e){return this.getObject("samplers",e)}getImage(e){return this.getObject("images",e)}getBufferView(e){return this.getObject("bufferViews",e)}getBuffer(e){return this.getObject("buffers",e)}getObject(e,t){if(typeof t=="object")return t;const r=this.json[e]&&this.json[e][t];if(!r)throw new Error(`glTF file error: Could not find ${e}[${t}]`);return r}getTypedArrayForBufferView(e){e=this.getBufferView(e);const t=e.buffer,r=this.gltf.buffers[t];_(r);const n=(e.byteOffset||0)+r.byteOffset;return new Uint8Array(r.arrayBuffer,n,e.byteLength)}getTypedArrayForAccessor(e){const t=this.getAccessor(e);return Nr(this.gltf.json,this.gltf.buffers,t)}getTypedArrayForImageData(e){e=this.getAccessor(e);const t=this.getBufferView(e.bufferView),n=this.getBuffer(t.buffer).data,o=t.byteOffset||0;return new Uint8Array(n,o,t.byteLength)}addApplicationData(e,t){return this.json[e]=t,this}addExtraData(e,t){return this.json.extras=this.json.extras||{},this.json.extras[e]=t,this}addObjectExtension(e,t,r){return e.extensions=e.extensions||{},e.extensions[t]=r,this.registerUsedExtension(t),this}setObjectExtension(e,t,r){const n=e.extensions||{};n[t]=r}removeObjectExtension(e,t){const r=e?.extensions||{};if(r[t]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const n=this.json.extensionsRemoved;n.includes(t)||n.push(t)}delete r[t]}addExtension(e,t={}){return _(t),this.json.extensions=this.json.extensions||{},this.json.extensions[e]=t,this.registerUsedExtension(e),t}addRequiredExtension(e,t={}){return _(t),this.addExtension(e,t),this.registerRequiredExtension(e),t}registerUsedExtension(e){this.json.extensionsUsed=this.json.extensionsUsed||[],this.json.extensionsUsed.find(t=>t===e)||this.json.extensionsUsed.push(e)}registerRequiredExtension(e){this.registerUsedExtension(e),this.json.extensionsRequired=this.json.extensionsRequired||[],this.json.extensionsRequired.find(t=>t===e)||this.json.extensionsRequired.push(e)}removeExtension(e){if(this.json.extensions?.[e]){this.json.extensionsRemoved=this.json.extensionsRemoved||[];const t=this.json.extensionsRemoved;t.includes(e)||t.push(e)}this.json.extensions&&delete this.json.extensions[e],this.json.extensionsRequired&&this._removeStringFromArray(this.json.extensionsRequired,e),this.json.extensionsUsed&&this._removeStringFromArray(this.json.extensionsUsed,e)}setDefaultScene(e){this.json.scene=e}addScene(e){const{nodeIndices:t}=e;return this.json.scenes=this.json.scenes||[],this.json.scenes.push({nodes:t}),this.json.scenes.length-1}addNode(e){const{meshIndex:t,matrix:r}=e;this.json.nodes=this.json.nodes||[];const n={mesh:t};return r&&(n.matrix=r),this.json.nodes.push(n),this.json.nodes.length-1}addMesh(e){const{attributes:t,indices:r,material:n,mode:o=4}=e,i={primitives:[{attributes:this._addAttributes(t),mode:o}]};if(r){const c=this._addIndices(r);i.primitives[0].indices=c}return Number.isFinite(n)&&(i.primitives[0].material=n),this.json.meshes=this.json.meshes||[],this.json.meshes.push(i),this.json.meshes.length-1}addPointCloud(e){const r={primitives:[{attributes:this._addAttributes(e),mode:0}]};return this.json.meshes=this.json.meshes||[],this.json.meshes.push(r),this.json.meshes.length-1}addImage(e,t){const r=Kt(e),n=t||r?.mimeType,s={bufferView:this.addBufferView(e),mimeType:n};return this.json.images=this.json.images||[],this.json.images.push(s),this.json.images.length-1}addBufferView(e,t=0,r=this.byteLength){const n=e.byteLength;_(Number.isFinite(n)),this.sourceBuffers=this.sourceBuffers||[],this.sourceBuffers.push(e);const o={buffer:t,byteOffset:r,byteLength:n};return this.byteLength+=ee(n,4),this.json.bufferViews=this.json.bufferViews||[],this.json.bufferViews.push(o),this.json.bufferViews.length-1}addAccessor(e,t){const r={bufferView:e,type:vt(t.size),componentType:t.componentType,count:t.count,max:t.max,min:t.min};return this.json.accessors=this.json.accessors||[],this.json.accessors.push(r),this.json.accessors.length-1}addBinaryBuffer(e,t={size:3}){const r=this.addBufferView(e);let n={min:t.min,max:t.max};(!n.min||!n.max)&&(n=this._getAccessorMinMax(e,t.size));const o={size:t.size,componentType:le(e),count:Math.round(e.length/t.size),min:n.min,max:n.max};return this.addAccessor(r,Object.assign(o,t))}addTexture(e){const{imageIndex:t}=e,r={source:t};return this.json.textures=this.json.textures||[],this.json.textures.push(r),this.json.textures.length-1}addMaterial(e){return this.json.materials=this.json.materials||[],this.json.materials.push(e),this.json.materials.length-1}createBinaryChunk(){const e=this.byteLength,t=new ArrayBuffer(e),r=new Uint8Array(t);let n=0;for(const o of this.sourceBuffers||[])n=ba(o,r,n);this.json?.buffers?.[0]?this.json.buffers[0].byteLength=e:this.json.buffers=[{byteLength:e}],this.gltf.binary=t,this.sourceBuffers=[t],this.gltf.buffers=[{arrayBuffer:t,byteOffset:0,byteLength:t.byteLength}]}_removeStringFromArray(e,t){let r=!0;for(;r;){const n=e.indexOf(t);n>-1?e.splice(n,1):r=!1}}_addAttributes(e={}){const t={};for(const r in e){const n=e[r],o=this._getGltfAttributeName(r),s=this.addBinaryBuffer(n.value,n);t[o]=s}return t}_addIndices(e){return this.addBinaryBuffer(e,{size:1})}_getGltfAttributeName(e){switch(e.toLowerCase()){case"position":case"positions":case"vertices":return"POSITION";case"normal":case"normals":return"NORMAL";case"color":case"colors":return"COLOR_0";case"texcoord":case"texcoords":return"TEXCOORD_0";default:return e}}_getAccessorMinMax(e,t){const r={min:null,max:null};if(e.length<t)return r;r.min=[],r.max=[];const n=e.subarray(0,t);for(const o of n)r.min.push(o),r.max.push(o);for(let o=t;o<e.length;o+=t)for(let s=0;s<t;s++)r.min[0+s]=Math.min(r.min[0+s],e[o+s]),r.max[0+s]=Math.max(r.max[0+s],e[o+s]);return r}}function tt(a){return(a%1+1)%1}const _t={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16,BOOLEAN:1,STRING:1,ENUM:1},Dr={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:BigInt64Array,UINT64:BigUint64Array,FLOAT32:Float32Array,FLOAT64:Float64Array},Tt={INT8:1,UINT8:1,INT16:2,UINT16:2,INT32:4,UINT32:4,INT64:8,UINT64:8,FLOAT32:4,FLOAT64:8};function Me(a,e){return Tt[e]*_t[a]}function de(a,e,t,r){if(t!=="UINT8"&&t!=="UINT16"&&t!=="UINT32"&&t!=="UINT64")return null;const n=a.getTypedArrayForBufferView(e),o=ue(n,"SCALAR",t,r+1);return o instanceof BigInt64Array||o instanceof BigUint64Array?null:o}function ue(a,e,t,r=1){const n=_t[e],o=Dr[t],s=Tt[t],i=r*n,c=i*s;let b=a.buffer,f=a.byteOffset;return f%s!==0&&(b=new Uint8Array(b).slice(f,f+c).buffer,f=0),new o(Fe(b),f,i)}function Ce(a,e,t){const r=`TEXCOORD_${e.texCoord||0}`,n=t.attributes[r],o=a.getTypedArrayForAccessor(n),s=a.gltf.json,i=e.index,c=s.textures?.[i]?.source;if(typeof c<"u"){const b=s.images?.[c]?.mimeType,f=a.gltf.images?.[c];if(f&&typeof f.width<"u"){const l=[];for(let u=0;u<o.length;u+=2){const A=Ur(f,b,o,u,e.channels);l.push(A)}return l}}return[]}function yt(a,e,t,r,n){if(!t?.length)return;const o=[];for(const f of t){let l=r.findIndex(u=>u===f);l===-1&&(l=r.push(f)-1),o.push(l)}const s=new Uint32Array(o),i=a.gltf.buffers.push({arrayBuffer:s.buffer,byteOffset:s.byteOffset,byteLength:s.byteLength})-1,c=a.addBufferView(s,i,0),b=a.addAccessor(c,{size:1,componentType:le(s),count:s.length});n.attributes[e]=b}function Ur(a,e,t,r,n=[0]){const o={r:{offset:0,shift:0},g:{offset:1,shift:8},b:{offset:2,shift:16},a:{offset:3,shift:24}},s=t[r],i=t[r+1];let c=1;e&&(e.indexOf("image/jpeg")!==-1||e.indexOf("image/png")!==-1)&&(c=4);const b=Vr(s,i,a,c);let f=0;for(const l of n){const u=typeof l=="number"?Object.values(o)[l]:o[l],A=b+u.offset,T=Ht(a);if(T.data.length<=A)throw new Error(`${T.data.length} <= ${A}`);const y=T.data[A];f|=y<<u.shift}return f}function Vr(a,e,t,r=1){const n=t.width,o=tt(a)*(n-1),s=Math.round(o),i=t.height,c=tt(e)*(i-1),b=Math.round(c),f=t.components?t.components:r;return(b*n+s)*f}function Et(a,e,t,r,n){const o=[];for(let s=0;s<e;s++){const i=t[s],c=t[s+1]-t[s];if(c+i>r)break;const b=i/n,f=c/n;o.push(a.slice(b,b+f))}return o}function wt(a,e,t){const r=[];for(let n=0;n<e;n++){const o=n*t;r.push(a.slice(o,o+t))}return r}function Rt(a,e,t,r){if(t)throw new Error("Not implemented - arrayOffsets for strings is specified");if(r){const n=[],o=new TextDecoder("utf8");let s=0;for(let i=0;i<a;i++){const c=r[i+1]-r[i];if(c+s<=e.length){const b=e.subarray(s,c+s),f=o.decode(b);n.push(f),s+=c}}return n}return[]}const G="EXT_mesh_features",qr=G;async function zr(a,e){const t=new x(a);Hr(t,e)}function Kr(a,e){const t=new x(a);return Jr(t),t.createBinaryChunk(),t.gltf}function Hr(a,e){const t=a.gltf.json;if(t.meshes)for(const r of t.meshes)for(const n of r.primitives)Wr(a,n,e)}function Wr(a,e,t){if(!t?.gltf?.loadBuffers)return;const n=e.extensions?.[G]?.featureIds;if(n)for(const o of n){let s;if(typeof o.attribute<"u"){const i=`_FEATURE_ID_${o.attribute}`,c=e.attributes[i];s=a.getTypedArrayForAccessor(c)}else typeof o.texture<"u"&&t?.gltf?.loadImages?s=Ce(a,o.texture,e):s=[];o.data=s}}function Jr(a,e){const t=a.gltf.json.meshes;if(t)for(const r of t)for(const n of r.primitives)$r(a,n)}function Xr(a,e,t,r){e.extensions||(e.extensions={});let n=e.extensions[G];n||(n={featureIds:[]},e.extensions[G]=n);const{featureIds:o}=n,s={featureCount:t.length,propertyTable:r,data:t};o.push(s),a.addObjectExtension(e,G,n)}function $r(a,e){const t=e.extensions?.[G];if(!t)return;const r=t.featureIds;r.forEach((n,o)=>{if(n.data){const{accessorKey:s,index:i}=Yr(e.attributes),c=new Uint32Array(n.data);r[o]={featureCount:c.length,propertyTable:n.propertyTable,attribute:i},a.gltf.buffers.push({arrayBuffer:c.buffer,byteOffset:c.byteOffset,byteLength:c.byteLength});const b=a.addBufferView(c),f=a.addAccessor(b,{size:1,componentType:le(c),count:c.length});e.attributes[s]=f}})}function Yr(a){const e="_FEATURE_ID_",t=Object.keys(a).filter(o=>o.indexOf(e)===0);let r=-1;for(const o of t){const s=Number(o.substring(e.length));s>r&&(r=s)}return r++,{accessorKey:`${e}${r}`,index:r}}const Qr=Object.freeze(Object.defineProperty({__proto__:null,createExtMeshFeatures:Xr,decode:zr,encode:Kr,name:qr},Symbol.toStringTag,{value:"Module"})),V="EXT_structural_metadata",Zr=V;async function en(a,e){const t=new x(a);an(t,e)}function tn(a,e){const t=new x(a);return xn(t),t.createBinaryChunk(),t.gltf}function an(a,e){if(!e.gltf?.loadBuffers)return;const t=a.getExtension(V);t&&(e.gltf?.loadImages&&rn(a,t),nn(a,t))}function rn(a,e){const t=e.propertyTextures,r=a.gltf.json;if(t&&r.meshes)for(const n of r.meshes)for(const o of n.primitives)sn(a,t,o,e)}function nn(a,e){const t=e.schema;if(!t)return;const r=t.classes,n=e.propertyTables;if(r&&n)for(const o in r){const s=on(n,o);s&&bn(a,t,s)}}function on(a,e){for(const t of a)if(t.class===e)return t;return null}function sn(a,e,t,r){if(!e)return;const o=t.extensions?.[V]?.propertyTextures;if(o)for(const s of o){const i=e[s];cn(a,i,t,r)}}function cn(a,e,t,r){if(!e.properties)return;r.dataAttributeNames||(r.dataAttributeNames=[]);const n=e.class;for(const o in e.properties){const s=`${n}_${o}`,i=e.properties?.[o];if(!i)continue;i.data||(i.data=[]);const c=i.data,b=Ce(a,i,t);b!==null&&(yt(a,s,b,c,t),i.data=c,r.dataAttributeNames.push(s))}}function bn(a,e,t){const r=e.classes?.[t.class];if(!r)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const n=t.count;for(const o in r.properties){const s=r.properties[o],i=t.properties?.[o];if(i){const c=fn(a,e,s,n,i);i.data=c}}}function fn(a,e,t,r,n){let o=[];const s=n.values,i=a.getTypedArrayForBufferView(s),c=ln(a,t,n,r),b=dn(a,n,r);switch(t.type){case"SCALAR":case"VEC2":case"VEC3":case"VEC4":case"MAT2":case"MAT3":case"MAT4":{o=un(t,r,i,c);break}case"BOOLEAN":throw new Error(`Not implemented - classProperty.type=${t.type}`);case"STRING":{o=Rt(r,i,c,b);break}case"ENUM":{o=pn(e,t,r,i,c);break}default:throw new Error(`Unknown classProperty type ${t.type}`)}return o}function ln(a,e,t,r){return e.array&&typeof e.count>"u"&&typeof t.arrayOffsets<"u"?de(a,t.arrayOffsets,t.arrayOffsetType||"UINT32",r):null}function dn(a,e,t){return typeof e.stringOffsets<"u"?de(a,e.stringOffsets,e.stringOffsetType||"UINT32",t):null}function un(a,e,t,r){const n=a.array,o=a.count,s=Me(a.type,a.componentType),i=t.byteLength/s;let c;return a.componentType?c=ue(t,a.type,a.componentType,i):c=t,n?r?Et(c,e,r,t.length,s):o?wt(c,e,o):[]:c}function pn(a,e,t,r,n){const o=e.enumType;if(!o)throw new Error("Incorrect data in the EXT_structural_metadata extension: classProperty.enumType is not set for type ENUM");const s=a.enums?.[o];if(!s)throw new Error(`Incorrect data in the EXT_structural_metadata extension: schema.enums does't contain ${o}`);const i=s.valueType||"UINT16",c=Me(e.type,i),b=r.byteLength/c;let f=ue(r,e.type,i,b);if(f||(f=r),e.array){if(n)return mn({valuesData:f,numberOfElements:t,arrayOffsets:n,valuesDataBytesLength:r.length,elementSize:c,enumEntry:s});const l=e.count;return l?hn(f,t,l,s):[]}return ke(f,0,t,s)}function mn(a){const{valuesData:e,numberOfElements:t,arrayOffsets:r,valuesDataBytesLength:n,elementSize:o,enumEntry:s}=a,i=[];for(let c=0;c<t;c++){const b=r[c],f=r[c+1]-r[c];if(f+b>n)break;const l=b/o,u=f/o,A=ke(e,l,u,s);i.push(A)}return i}function hn(a,e,t,r){const n=[];for(let o=0;o<e;o++){const s=t*o,i=ke(a,s,t,r);n.push(i)}return n}function ke(a,e,t,r){const n=[];for(let o=0;o<t;o++)if(a instanceof BigInt64Array||a instanceof BigUint64Array)n.push("");else{const s=a[e+o],i=gn(r,s);i?n.push(i.name):n.push("")}return n}function gn(a,e){for(const t of a.values)if(t.value===e)return t;return null}const An="schemaClassId";function xn(a,e){const t=a.getExtension(V);if(t&&t.propertyTables)for(const r of t.propertyTables){const n=r.class,o=t.schema?.classes?.[n];r.properties&&o&&vn(r,o,a)}}function vn(a,e,t){for(const r in a.properties){const n=a.properties[r].data;if(n){const o=e.properties[r];if(o){const s=En(n,o,t);a.properties[r]=s}}}}function _n(a,e,t=An){let r=a.getExtension(V);r||(r=a.addExtension(V)),r.schema=Tn(e,t,r.schema);const n=yn(e,t,r.schema);return r.propertyTables||(r.propertyTables=[]),r.propertyTables.push(n)-1}function Tn(a,e,t){const r=t??{id:"schema_id"},n={properties:{}};for(const o of a){const s={type:o.elementType,componentType:o.componentType};n.properties[o.name]=s}return r.classes={},r.classes[e]=n,r}function yn(a,e,t){const r={class:e,count:0};let n=0;const o=t.classes?.[e];for(const s of a){if(n===0&&(n=s.values.length),n!==s.values.length&&s.values.length)throw new Error("Illegal values in attributes");o?.properties[s.name]&&(r.properties||(r.properties={}),r.properties[s.name]={values:0,data:s.values})}return r.count=n,r}function En(a,e,t){const r={values:0};if(e.type==="STRING"){const{stringData:n,stringOffsets:o}=Sn(a);r.stringOffsets=_e(o,t),r.values=_e(n,t)}else if(e.type==="SCALAR"&&e.componentType){const n=Rn(a,e.componentType);r.values=_e(n,t)}return r}const wn={INT8:Int8Array,UINT8:Uint8Array,INT16:Int16Array,UINT16:Uint16Array,INT32:Int32Array,UINT32:Uint32Array,INT64:Int32Array,UINT64:Uint32Array,FLOAT32:Float32Array,FLOAT64:Float64Array};function Rn(a,e){const t=[];for(const n of a)t.push(Number(n));const r=wn[e];if(!r)throw new Error("Illegal component type");return new r(t)}function Sn(a){const e=new TextEncoder,t=[];let r=0;for(const c of a){const b=e.encode(c);r+=b.length,t.push(b)}const n=new Uint8Array(r),o=[];let s=0;for(const c of t)n.set(c,s),o.push(s),s+=c.length;o.push(s);const i=new Uint32Array(o);return{stringData:n,stringOffsets:i}}function _e(a,e){return e.gltf.buffers.push({arrayBuffer:Fe(a.buffer),byteOffset:a.byteOffset,byteLength:a.byteLength}),e.addBufferView(a)}const In=Object.freeze(Object.defineProperty({__proto__:null,createExtStructuralMetadata:_n,decode:en,encode:tn,name:Zr},Symbol.toStringTag,{value:"Module"})),St="EXT_feature_metadata",Ln=St;async function jn(a,e){const t=new x(a);On(t,e)}function On(a,e){if(!e.gltf?.loadBuffers)return;const t=a.getExtension(St);t&&(e.gltf?.loadImages&&Fn(a,t),Pn(a,t))}function Fn(a,e){const t=e.schema;if(!t)return;const r=t.classes,{featureTextures:n}=e;if(r&&n)for(const o in r){const s=r[o],i=Cn(n,o);i&&Bn(a,i,s)}}function Pn(a,e){const t=e.schema;if(!t)return;const r=t.classes,n=e.featureTables;if(r&&n)for(const o in r){const s=Mn(n,o);s&&kn(a,t,s)}}function Mn(a,e){for(const t in a){const r=a[t];if(r.class===e)return r}return null}function Cn(a,e){for(const t in a){const r=a[t];if(r.class===e)return r}return null}function kn(a,e,t){if(!t.class)return;const r=e.classes?.[t.class];if(!r)throw new Error(`Incorrect data in the EXT_structural_metadata extension: no schema class with name ${t.class}`);const n=t.count;for(const o in r.properties){const s=r.properties[o],i=t.properties?.[o];if(i){const c=Nn(a,e,s,n,i);i.data=c}}}function Bn(a,e,t){const r=e.class;for(const n in t.properties){const o=e?.properties?.[n];if(o){const s=qn(a,o,r);o.data=s}}}function Nn(a,e,t,r,n){let o=[];const s=n.bufferView,i=a.getTypedArrayForBufferView(s),c=Gn(a,t,n,r),b=Dn(a,t,n,r);return t.type==="STRING"||t.componentType==="STRING"?o=Rt(r,i,c,b):Un(t)&&(o=Vn(t,r,i,c)),o}function Gn(a,e,t,r){return e.type==="ARRAY"&&typeof e.componentCount>"u"&&typeof t.arrayOffsetBufferView<"u"?de(a,t.arrayOffsetBufferView,t.offsetType||"UINT32",r):null}function Dn(a,e,t,r){return typeof t.stringOffsetBufferView<"u"?de(a,t.stringOffsetBufferView,t.offsetType||"UINT32",r):null}function Un(a){const e=["UINT8","INT16","UINT16","INT32","UINT32","INT64","UINT64","FLOAT32","FLOAT64"];return e.includes(a.type)||typeof a.componentType<"u"&&e.includes(a.componentType)}function Vn(a,e,t,r){const n=a.type==="ARRAY",o=a.componentCount,s="SCALAR",i=a.componentType||a.type,c=Me(s,i),b=t.byteLength/c,f=ue(t,s,i,b);return n?r?Et(f,e,r,t.length,c):o?wt(f,e,o):[]:f}function qn(a,e,t){const r=a.gltf.json;if(!r.meshes)return[];const n=[];for(const o of r.meshes)for(const s of o.primitives)zn(a,t,e,n,s);return n}function zn(a,e,t,r,n){const o={channels:t.channels,...t.texture},s=Ce(a,o,n);s&&yt(a,e,s,r,n)}const Kn=Object.freeze(Object.defineProperty({__proto__:null,decode:jn,name:Ln},Symbol.toStringTag,{value:"Module"})),Hn="4.5.4",q=!0,at=1735152710,Be=12,be=8,Wn=1313821514,Jn=5130562,Xn=0,$n=0,Yn=1;function Qn(a,e=0){return`${String.fromCharCode(a.getUint8(e+0))}${String.fromCharCode(a.getUint8(e+1))}${String.fromCharCode(a.getUint8(e+2))}${String.fromCharCode(a.getUint8(e+3))}`}function Zn(a,e=0,t={}){const r=new DataView(a),{magic:n=at}=t,o=r.getUint32(e,!1);return o===n||o===at}function eo(a,e,t=0,r={}){const n=new DataView(e),o=Qn(n,t+0),s=n.getUint32(t+4,q),i=n.getUint32(t+8,q);switch(Object.assign(a,{header:{byteOffset:t,byteLength:i,hasBinChunk:!1},type:o,version:s,json:{},binChunks:[]}),t+=Be,a.version){case 1:return to(a,n,t);case 2:return ao(a,n,t,r={});default:throw new Error(`Invalid GLB version ${a.version}. Only supports version 1 and 2.`)}}function to(a,e,t){Q(a.header.byteLength>Be+be);const r=e.getUint32(t+0,q),n=e.getUint32(t+4,q);return t+=be,Q(n===Xn),Ie(a,e,t,r),t+=r,t+=Le(a,e,t,a.header.byteLength),t}function ao(a,e,t,r){return Q(a.header.byteLength>Be+be),ro(a,e,t,r),t+a.header.byteLength}function ro(a,e,t,r){for(;t+8<=a.header.byteLength;){const n=e.getUint32(t+0,q),o=e.getUint32(t+4,q);switch(t+=be,o){case Wn:Ie(a,e,t,n);break;case Jn:Le(a,e,t,n);break;case $n:r.strict||Ie(a,e,t,n);break;case Yn:r.strict||Le(a,e,t,n);break}t+=ee(n,4)}return t}function Ie(a,e,t,r){const n=new Uint8Array(e.buffer,t,r),s=new TextDecoder("utf8").decode(n);return a.json=JSON.parse(s),ee(r,4)}function Le(a,e,t,r){return a.header.hasBinChunk=!0,a.binChunks.push({byteOffset:t,byteLength:r,arrayBuffer:e.buffer}),ee(r,4)}function It(a,e,t){if(a.startsWith("data:")||a.startsWith("http:")||a.startsWith("https:"))return a;const n=t?.baseUrl||no(e?.core?.baseUrl);if(!n)throw new Error(`'baseUrl' must be provided to resolve relative url ${a}`);return n.endsWith("/")?`${n}${a}`:`${n}/${a}`}function no(a){if(!a)return;if(a.endsWith("/"))return a;const e=a.lastIndexOf("/");return e>=0?a.slice(0,e+1):""}var rt=(function(){var a="b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuixkbeeeddddillviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WboY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbrl79IV9Rbwq;X8:kdbk:kYi5ud9:du8Jjjjjbcjq9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz:jjjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCaAcethXaxaDfhiaOaeaoaeao6E9RhQalcl4cifcd4hLazcjdfaAfhKcbhYabaOad2fg8AhEaHh3incbh5dnawTmbaxaYcd4fRbbh5kcbh8Eazcjdfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcjdfa8EaA2fa8FaAz:jjjjb8Aa8FaAfhixdkazcjdfa8EaA2fcbaAz:kjjjb8Aa8FhixekaPa8F9RaL6mva8FaLfhidnaCTmbaPai9RcK6mbaocdtc:q:G:cjbfcj:G:cjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bwar9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfcbaicdfa8J9c8N1:NfghRbbag9cjjjjjw:dg8J9qE86bbarcVfcbaha8J9c8M1:NfghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fcbaha8J9c8N1:NfgiRbbag9cjjjjjw:dg8J9qE86bbarc96fcbaia8J9c8M1:NfgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbw83bwarai8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasaYcd4fRbbgociGPlbedrbkaATmdazaYfh8Fazcjdfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeazaYfhaazcjdfhhcbhoceh8EaKh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaQaocefgofmbka8FaXfh8FcdhoaacdfhaahaXfhha8EceGhlcbh8EalmbxdkkaATmbaocl4h8EazaYfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaKhainazcjdfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E94aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3aYclfgYad6mbkaza8AaAcufad2fadz:jjjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcjqf8Kjjjjbaok:bsesu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecjez:kjjjb8Aav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhDaicefgiarfhqdndnaeci9pmbaqhexekcmcsawceSEhkcbhxcbhmaqhecbhlcbhoindndnaiRbbgrc;Ve0mbavc;abfaoarcu7gPcl4fcsGcitfgwydlhsawydbhzdndnarcsGgwak9pmbavalaPfcsGcdtfydbaxawEhraxawTgHfhxxekdnaeaD9nmbc9:hoxokdndnawcsSmbcehHamawcetfcWfhrxekaecefhrae8SbbgwcFeGhPdndnawcu9mmbarhexekaecvfheaPcFbGhPcrhwdninar8SbbgHcFbGawtaPVhPaHcu9kmearcefhrawcrfgwc8J9hmbxdkkarcefhekcehHaPce4cbaPceG9R7amfhrkarhmkavc;abfaocitfgwarBdbawasBdlavalcdtfarBdbavc;abfaocefcsGcitfgwazBdbawarBdlaocdfhoaHalfhldnadcd9hmbabar87elabas87edabaz87ebabcofhbxdkabarBdwabasBdlabazBdbabcxfhbxekdnarcpe0mbavalaDarcsGfRbbgwcl4gP9RcsGcdtfydbaxcefgsaPEhravalaw9RcsGcdtfydbasaPTgzfgsawcsGgPEhwaPThPdndnadcd9hmbabaw87elabar87edabax87ebcohHxekabawBdwabarBdlabaxBdbcxhHkavalcdtfaxBdbavc;abfaocitfgOarBdbaOaxBdlavalcefglcsGcdtfarBdbavc;abfaocefcsGcitfgOawBdbaOarBdlavalazfglcsGcdtfawBdbavc;abfaocdfcsGcitfgraxBdbarawBdlaocifhoabaHfhbalaPfhlasaPfhxxekdnaeaD9nmbc9:hoxlkaxcbaeRbbgwEgHarc;:eSgrfhsawcsGhOdndnawcl4gAmbascefhzxekashzavalaA9RcsGcdtfydbhskdndnaOmbazcefhxxekazhxavalaw9RcsGcdtfydbhzkdndnarTmbaecefhrxekaecdfhrae8SbegPcFeGhwdnaPcu9kmbaecofhHawcFbGhwcrhedninar8SbbgPcFbGaetawVhwaPcu9kmearcefhraecrfgec8J9hmbkaHhrxekarcefhrkawce4cbawceG9R7amfgmhHkdndnaAcsSmbarhwxekarcefhwar8SbbgecFeGhPdnaecu9kmbarcvfhsaPcFbGhPcrhedninaw8SbbgrcFbGaetaPVhParcu9kmeawcefhwaecrfgec8J9hmbkashwxekawcefhwkaPce4cbaPceG9R7amfgmhskdndnaOcsSmbawhexekawcefheaw8SbbgrcFeGhPdnarcu9kmbawcvfhzaPcFbGhPcrhrdninae8SbbgwcFbGartaPVhPawcu9kmeaecefhearcrfgrc8J9hmbkazhexekaecefhekaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabaz87elabas87edabaH87ebcohrxekabazBdwabasBdlabaHBdbcxhrkavc;abfaocitfgwasBdbawaHBdlavalcdtfaHBdbavc;abfaocefcsGcitfgwazBdbawasBdlavalcefglcsGcdtfasBdbavc;abfaocdfcsGcitfgwaHBdbawazBdlavalaATaAcsSVfglcsGcdtfazBdbalaOTaOcsSVfhlaocifhoabarfhbkaocsGhoalcsGhlaicefgiaq6mbkkcbc99aeaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk:4ioiue99dud99dud99dnaeTmbcbhiabhlindndnal8Uebgv:YgoJ:ji:1Salcof8UebgrciVgw:Y:vgDNJbbbZJbbb:;avcu9kEMgq:lJbbb9p9DTmbaq:Ohkxekcjjjj94hkkalclf8Uebhvalcdf8UebhxalarcefciGcetfak87ebdndnax:YgqaDNJbbbZJbbb:;axcu9kEMgm:lJbbb9p9DTmbam:Ohxxekcjjjj94hxkabaiarciGgkfcd7cetfax87ebdndnav:YgmaDNJbbbZJbbb:;avcu9kEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkalarcufciGcetfav87ebdndnawaw2:ZgPaPMaoaoN:taqaqN:tamamN:tgoJbbbbaoJbbbb9GE:raDNJbbbZMgD:lJbbb9p9DTmbaD:Ohrxekcjjjj94hrkalakcetfar87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk:Tvirud99eudndnadcl9hmbaeTmeindndnabRbbgiabcefgl8Sbbgvabcdfgo8Sbbgrf9R:YJbbuJabcifgwRbbgdce4adVgDcd4aDVgDcl4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax86bbdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao86bbdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai86bbdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad86bbabclfhbaecufgembxdkkaeTmbindndnab8Vebgiabcdfgl8Uebgvabclfgo8Uebgrf9R:YJbFu9habcofgw8Vebgdce4adVgDcd4aDVgDcl4aDVgDcw4aDVgD:Z:vgqNJbbbZMgk:lJbbb9p9DTmbak:Ohxxekcjjjj94hxkaoax87ebdndnaraif:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohoxekcjjjj94hokalao87ebdndnavaifar9R:YaqNJbbbZMgk:lJbbb9p9DTmbak:Ohixekcjjjj94hikabai87ebdndnaDadcetGadceGV:ZaqNJbbbZMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkawad87ebabcwfhbaecufgembkkk9teiucbcbyd:K:G:cjbgeabcifc98GfgbBd:K:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;LeeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiclfaeclfydbBdbaicwfaecwfydbBdbaicxfaecxfydbBdbaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk;aeedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdbaicxfalBdbaicwfalBdbaiclfalBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk83dbcj:Gdk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:K:Gdkl8W:qbb",e="b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuixkbbebeeddddilve9Weeeviebeoweuecj:Gdkr;Neqo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949WbwY9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVJ9V29VVbDl79IV9Rbqq:I9Dklbzik94evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaeai86b:q:W:cjbaecitab8Piw83i:q:G:cjbaecefgecjd9hmbkk:SBlEud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaialfgxar9RhodnadTgmmbavaoad;8qbbkaicefhPcj;abad9Uc;WFbGcjdadca0EhsdndndnadTmbaoadfhzcbhHinaeaH9nmdaxaP9RaD6miabaHad2fgOavcjdfasaeaH9RaHasfae6EgAaAcsfgoc9WGgCSEhXaPaDfhQaocl4cifcd4hLavcj;cbfaCcetfhKavcj;cbfaCci2fhYavcj;cbfaCfh8AcbhEaoc;ab6h3incbh5dnawTmbaPaEcd4fRbbh5kcbh8Eavcj;cbfh8Findndndndna5a8Ecet4ciGgoc9:fPdebdkaxaQ9RaC6mwdnaCTmbavcj;cbfa8EaC2faQaC;8qbbkaQaAfhQxdkaCTmeavcj;cbfa8EaC2fcbaC;8kbxekaxaQ9RaL6moaoclVcbawEhraQaLfhocbhidna3mbaxao9Rc;Gb6mbcbhlina8FalfhidndndndndndnaQalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaiczfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaoclffa8JRb:q:W:cjbfhoxikaicafaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbagaocwffa8JRb:q:W:cjbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbagaocdffa8JRb:q:W:cjbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaoclffaqRb:q:W:cjbfhoxikaic8Wfaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Ngicitpbi:q:G:cjbaiRb:q:W:cjbgipsaap5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spklbaiaocwffaqRb:q:W:cjbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitpbi:q:G:cjbaiRb:q:W:cjbgipsaoRbegqcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqRb:q:W:cjbfhokalc;abfhialcjefaC0meaihlaxao9Rc;Fb0mbkkdnaiaC9pmbaici4hlinaxao9RcK6mwa8FaifhqdndndndndndnaQaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLgacdp:meaapmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9oghpxiiiiiiiiiiiiiiiip8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaoclffa8JRb:q:W:cjbfhoxikaqaopbbwaopbbbgaclp:meaapmbzeHdOiAlCvXoQrLpxssssssssssssssssp9oghpxssssssssssssssssp8Jgap5b9cjF;8;4;W;G;ab9:9cU1:Nggcitpbi:q:G:cjbagRb:q:W:cjbggpsaap5e9cjF;8;4;W;G;ab9:9cU1:Ng8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPahaap9spkbbagaocwffa8JRb:q:W:cjbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbggcitpbi:q:G:cjbagRb:q:W:cjbggpsaoRbeg8Jcitpbi:q:G:cjbp9UpmbedilvorzHOACXQLpPpkbbagaocdffa8JRb:q:W:cjbfhokalcdfhlaiczfgiaC6mbkkaohQaoTmoka8FaCfh8Fa8Ecefg8Ecl9hmbkdndndndnawTmbazaEcd4fRbbglciGPlbedwbkaCTmdaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep9Taapxeeeeeeeeeeeeeeeeghp9op9Hp9rgaa8Kp9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep9Taaahp9op9Hp9rgap9Ug8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp9Ug8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp9Ug8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep9Taaahp9op9Hp9rgap9Ughp9Abbbaladfglahaaaapmlvorlvorlvorlvorp9Ughp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp9Ughp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp9Ug8Kp9AbbbaladfhlaoczfgoaC6mbxikkaCTmeaXaEfhlavaEfpbdbh8Kcbhoinalavcj;cbfaofpblbg8La8Aaofpblbg8MpmbzeHdOiAlCvXoQrLg8NaKaofpblbgyaYaofpblbg8PpmbzeHdOiAlCvXoQrLgIpmbezHdiOAlvCXorQLgacep:neaapxebebebebebebebebghp9op:bep9rgaa8Kp:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8NaIpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwKDYq8AkEx3m5P8Es8Fg8Laya8PpmwKDYq8AkEx3m5P8Es8Fg8MpmbezHdiOAlvCXorQLgacep:neaaahp9op:bep9rgap:oeg8Kp9Abbbaladfgla8Kaaaapmlvorlvorlvorlvorp:oeg8Kp9Abbbaladfgla8KaaaapmwDqkwDqkwDqkwDqkp:oeg8Kp9Abbbaladfgla8KaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9Abbbaladfgla8Ka8La8MpmwDKYqk8AExm35Ps8E8Fgacep:neaaahp9op:bep9rgap:oeghp9Abbbaladfglahaaaapmlvorlvorlvorlvorp:oeghp9AbbbaladfglahaaaapmwDqkwDqkwDqkwDqkp:oeghp9AbbbaladfglahaaaapmxmPsxmPsxmPsxmPsp:oeg8Kp9AbbbaladfhlaoczfgoaC6mbxdkkaCTmbaXaEfhrcbhocbalcl4gl9Rc8FGhiavaEfpbdbhhinaravcj;cbfaofpblbg8Ka8Aaofpblbg8LpmbzeHdOiAlCvXoQrLg8MaKaofpblbg8NaYaofpblbgypmbzeHdOiAlCvXoQrLg8PpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgaahp9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ma8PpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwKDYq8AkEx3m5P8Es8Fg8Ka8NaypmwKDYq8AkEx3m5P8Es8Fg8LpmbezHdiOAlvCXorQLgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9Abbbaradfgraha8Ka8LpmwDKYqk8AExm35Ps8E8Fgaaip:Reaaalp:Tep9qgap9rghp9Abbbaradfgrahaaaapmlvorlvorlvorlvorp9rghp9AbbbaradfgrahaaaapmwDqkwDqkwDqkwDqkp9rghp9AbbbaradfgrahaaaapmxmPsxmPsxmPsxmPsp9rghp9AbbbaradfhraoczfgoaC6mbkkaEclfgEad6mbkdnaXavcjdf9hmbaAad2goTmbaOavcjdfao;8qbbkdnammbavaXaAcufad2fad;8qbbkaAaHfhHc9:hoaQhPaQmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdasaeao9Raoasfae6Eaofgoae6mbkaial9RhPkcbc99axaP9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbkpPesu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnalaeci9UgrcHf6mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecje;8kbav9cu83iUav9cu83i8Wav9cu83iyav9cu83iaav9cu83iKav9cu83izav9cu83iwav9cu83ibaialfc9WfhDaicefgiarfhqdndnaeci9pmbaqhexekcmcsawceSEhkcbhxcbhmaqhecbhlcbhoindndnaiRbbgrc;Ve0mbavc;abfaoarcu7gPcl4fcsGcitfgwydlhsawydbhzdndnarcsGgwak9pmbavalaPfcsGcdtfydbaxawEhraxawTgHfhxxekdnaeaD9nmbc9:hoxokdndnawcsSmbcehHamawcetfcWfhrxekaecefhrae8SbbgwcFeGhPdndnawcu9mmbarhexekaecvfheaPcFbGhPcrhwdninar8SbbgHcFbGawtaPVhPaHcu9kmearcefhrawcrfgwc8J9hmbxdkkarcefhekcehHaPce4cbaPceG9R7amfhrkarhmkavc;abfaocitfgwarBdbawasBdlavalcdtfarBdbavc;abfaocefcsGcitfgwazBdbawarBdlaocdfhoaHalfhldnadcd9hmbabar87elabas87edabaz87ebabcofhbxdkabarBdwabasBdlabazBdbabcxfhbxekdnarcpe0mbavalaDarcsGfRbbgwcl4gP9RcsGcdtfydbaxcefgsaPEhravalaw9RcsGcdtfydbasaPTgzfgsawcsGgPEhwaPThPdndnadcd9hmbabaw87elabar87edabax87ebcohHxekabawBdwabarBdlabaxBdbcxhHkavalcdtfaxBdbavc;abfaocitfgOarBdbaOaxBdlavalcefglcsGcdtfarBdbavc;abfaocefcsGcitfgOawBdbaOarBdlavalazfglcsGcdtfawBdbavc;abfaocdfcsGcitfgraxBdbarawBdlaocifhoabaHfhbalaPfhlasaPfhxxekdnaeaD9nmbc9:hoxlkaxcbaeRbbgwEgHarc;:eSgrfhsawcsGhOdndnawcl4gAmbascefhzxekashzavalaA9RcsGcdtfydbhskdndnaOmbazcefhxxekazhxavalaw9RcsGcdtfydbhzkdndnarTmbaecefhrxekaecdfhrae8SbegPcFeGhwdnaPcu9kmbaecofhHawcFbGhwcrhedninar8SbbgPcFbGaetawVhwaPcu9kmearcefhraecrfgec8J9hmbkaHhrxekarcefhrkawce4cbawceG9R7amfgmhHkdndnaAcsSmbarhwxekarcefhwar8SbbgecFeGhPdnaecu9kmbarcvfhsaPcFbGhPcrhedninaw8SbbgrcFbGaetaPVhParcu9kmeawcefhwaecrfgec8J9hmbkashwxekawcefhwkaPce4cbaPceG9R7amfgmhskdndnaOcsSmbawhexekawcefheaw8SbbgrcFeGhPdnarcu9kmbawcvfhzaPcFbGhPcrhrdninae8SbbgwcFbGartaPVhPawcu9kmeaecefhearcrfgrc8J9hmbkazhexekaecefhekaPce4cbaPceG9R7amfgmhzkdndnadcd9hmbabaz87elabas87edabaH87ebcohrxekabazBdwabasBdlabaHBdbcxhrkavc;abfaocitfgwasBdbawaHBdlavalcdtfaHBdbavc;abfaocefcsGcitfgwazBdbawasBdlavalcefglcsGcdtfasBdbavc;abfaocdfcsGcitfgwaHBdbawazBdlavalaATaAcsSVfglcsGcdtfazBdbalaOTaOcsSVfhlaocifhoabarfhbkaocsGhoalcsGhlaicefgiaq6mbkkcbc99aeaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnalaecvf9pmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk;Toio97eue97aec98Ghedndnadcl9hmbaeTmecbhdinababpbbbgicKp:RecKp:Sep;6eglaicwp:RecKp:Sep;6ealp;Geaiczp:RecKp:Sep;6egvp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgwp9op9rp;Keglpxbb;:9cbb;:9cbb;:9cbb;:9calalp;Meaoaop;Meavaravawp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFbbbFbbbFbbbFbbbp9oaipxbbbFbbbFbbbFbbbFp9op9qalavp;Mearp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaoavp;Mearp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgDaDpbbbgipxbbbbbbFFbbbbbbFFgwp9oabpbbbgoaipmbediwDqkzHOAKY8AEgvczp:Reczp:Sep;6eglaoaipmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;6eavczp:Sep;6egvp;Gealp;Gep;Kep;Legipxbbbbbbbbbbbbbbbbp:2egralpxbbbjbbbjbbbjbbbjgqp9op9rp;Keglpxb;:FSb;:FSb;:FSb;:FSalalp;Meaiaip;Meavaravaqp9op9rp;Keglalp;Mep;Kep;Kep;Jep;Negvp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbp9oaiavp;Mearp;Keczp:Rep9qgialavp;Mearp;KepxFFbbFFbbFFbbFFbbp9oglpmwDKYqk8AExm35Ps8E8Fp9qpkbbabaoawp9oaialpmbezHdiOAlvCXorQLp9qpkbbabcafhbadclfgdae6mbkkk;2ileue97euo97dnaec98GgiTmbcbheinabcKfpx:ji:1S:ji:1S:ji:1S:ji:1SabpbbbglabczfgvpbbbgopmlvorxmPsCXQL358E8Fgrczp:Segwpxibbbibbbibbbibbbp9qp;6egDp;NegqaDaDp;MegDaDp;KealaopmbediwDqkzHOAKY8AEgDczp:Reczp:Sep;6eglalp;MeaDczp:Sep;6egoaop;Mearczp:Reczp:Sep;6egrarp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jep;Mepxbbn0bbn0bbn0bbn0gDp;KepxFFbbFFbbFFbbFFbbgkp9oaqaop;MeaDp;Keczp:Rep9qgoaqalp;MeaDp;Keakp9oaqarp;MeaDp;Keczp:Rep9qgDpmwDKYqk8AExm35Ps8E8Fglp5eawclp:RegqpEi:T:j83ibavalp5baqpEd:T:j83ibabcwfaoaDpmbezHdiOAlvCXorQLgDp5eaqpEe:T:j83ibabaDp5baqpEb:T:j83ibabcafhbaeclfgeai6mbkkkuee97dnadcd4ae2c98GgeTmbcbhdinababpbbbgicwp:Recwp:Sep;6eaicep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbabczfhbadclfgdae6mbkkk:Sodw97euaec98Ghedndnadcl9hmbaeTmecbhdinabpxbbuJbbuJbbuJbbuJabpbbbgicKp:TeglaicYp:Tep9qgvcdp:Teavp9qgvclp:Teavp9qgop;6ep;Negvaicwp:RecKp:SegraipxFbbbFbbbFbbbFbbbgwp9ogDp:Uep;6ep;Mepxbbn0bbn0bbn0bbn0gqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9oavaDarp:Xeaiczp:RecKp:Segip:Uep;6ep;Meaqp;Keawp9op9qavaDaraip:Uep:Xep;6ep;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qavaoalcep:Rep9oalpxebbbebbbebbbebbbp9op9qp;6ep;Meaqp;KecKp:Rep9qpkbbabczfhbadclfgdae6mbxdkkaeTmbcbhdinabczfgkpxbFu9hbFu9hbFu9hbFu9habpbbbglakpbbbgrpmlvorxmPsCXQL358E8Fgvczp:TegqavcHp:Tep9qgicdp:Teaip9qgiclp:Teaip9qgicwp:Teaip9qgop;6ep;NegialarpmbediwDqkzHOAKY8AEgDpxFFbbFFbbFFbbFFbbglp9ograDczp:Segwp:Ueavczp:Reczp:SegDp:Xep;6ep;Mepxbbn0bbn0bbn0bbn0gvp;Kealp9oaiarawaDp:Uep:Xep;6ep;Meavp;Keczp:Rep9qgwaiaoaqcep:Rep9oaqpxebbbebbbebbbebbbp9op9qp;6ep;Meavp;Keczp:ReaiaDarp:Uep;6ep;Meavp;Kealp9op9qgipmwDKYqk8AExm35Ps8E8FpkbbabawaipmbezHdiOAlvCXorQLpkbbabcafhbadclfgdae6mbkkk9teiucbcbydj:G:cjbgeabcifc98GfgbBdj:G:cjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkxebcj:Gdklz:zbb",t=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),r=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if(typeof WebAssembly!="object")return{supported:!1};var n=WebAssembly.validate(t)?i(e):i(a),o,s=WebAssembly.instantiate(n,{}).then(function(p){o=p.instance,o.exports.__wasm_call_ctors()});function i(p){for(var d=new Uint8Array(p.length),m=0;m<p.length;++m){var h=p.charCodeAt(m);d[m]=h>96?h-97:h>64?h-39:h+4}for(var g=0,m=0;m<p.length;++m)d[g++]=d[m]<60?r[d[m]]:(d[m]-60)*64+d[++m];return d.buffer.slice(0,g)}function c(p,d,m,h,g,E,O){var C=p.exports.sbrk,te=h+3&-4,L=C(te*g),W=C(E.length),Ge=new Uint8Array(p.exports.memory.buffer);Ge.set(E,W);var pe=d(L,h,g,W,E.length);if(pe==0&&O&&O(L,te,g),m.set(Ge.subarray(L,L+h*g)),C(L-C(0)),pe!=0)throw new Error("Malformed buffer data: "+pe)}var b={NONE:"",OCTAHEDRAL:"meshopt_decodeFilterOct",QUATERNION:"meshopt_decodeFilterQuat",EXPONENTIAL:"meshopt_decodeFilterExp",COLOR:"meshopt_decodeFilterColor"},f={ATTRIBUTES:"meshopt_decodeVertexBuffer",TRIANGLES:"meshopt_decodeIndexBuffer",INDICES:"meshopt_decodeIndexSequence"},l=[],u=0;function A(p){var d={object:new Worker(p),pending:0,requests:{}};return d.object.onmessage=function(m){var h=m.data;d.pending-=h.count,d.requests[h.id][h.action](h.value),delete d.requests[h.id]},d}function T(p){for(var d="self.ready = WebAssembly.instantiate(new Uint8Array(["+new Uint8Array(n)+"]), {}).then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });self.onmessage = "+I.name+";"+c.toString()+I.toString(),m=new Blob([d],{type:"text/javascript"}),h=URL.createObjectURL(m),g=l.length;g<p;++g)l[g]=A(h);for(var g=p;g<l.length;++g)l[g].object.postMessage({});l.length=p,URL.revokeObjectURL(h)}function y(p,d,m,h,g){for(var E=l[0],O=1;O<l.length;++O)l[O].pending<E.pending&&(E=l[O]);return new Promise(function(C,te){var L=new Uint8Array(m),W=++u;E.pending+=p,E.requests[W]={resolve:C,reject:te},E.object.postMessage({id:W,count:p,size:d,source:L,mode:h,filter:g},[L.buffer])})}function I(p){var d=p.data;self.ready.then(function(m){if(!d.id)return self.close();try{var h=new Uint8Array(d.count*d.size);c(m,m.exports[d.mode],h,d.count,d.size,d.source,m.exports[d.filter]),self.postMessage({id:d.id,count:d.count,action:"resolve",value:h},[h.buffer])}catch(g){self.postMessage({id:d.id,count:d.count,action:"reject",value:g})}})}return{ready:s,supported:!0,useWorkers:function(p){T(p)},decodeVertexBuffer:function(p,d,m,h,g){c(o,o.exports.meshopt_decodeVertexBuffer,p,d,m,h,o.exports[b[g]])},decodeIndexBuffer:function(p,d,m,h){c(o,o.exports.meshopt_decodeIndexBuffer,p,d,m,h)},decodeIndexSequence:function(p,d,m,h){c(o,o.exports.meshopt_decodeIndexSequence,p,d,m,h)},decodeGltfBuffer:function(p,d,m,h,g,E){c(o,o.exports[f[g]],p,d,m,h,o.exports[b[E]])},decodeGltfBufferAsync:function(p,d,m,h,g){return l.length>0?y(p,d,m,f[h],b[g]):s.then(function(){var E=new Uint8Array(p*d);return c(o,o.exports[f[h]],E,p,d,m,o.exports[b[g]]),E})}}})();function oo(a){return typeof a=="string"?a:["NONE","OCTAHEDRAL","QUATERNION","EXPONENTIAL","COLOR"][a]}async function so(a,e,t,r,n,o="NONE"){await rt.ready,rt.decodeGltfBuffer(a,e,t,r,n,oo(o))}async function Lt(a,e,t){if(!e.gltf?.decompressMeshes||!e.gltf.loadBuffers)return;io(a.json);const r=new x(a),n=a.json.bufferViews||[],o=n.map(s=>co(r,s,t));await Promise.all(o);for(const s of n)r.removeObjectExtension(s,t);for(const s of a.json.buffers||[])r.removeObjectExtension(s,t);r.removeExtension(t)}function io(a){const e=a.bufferViews||[];for(let r=0;r<e.length;r++){const n=e[r].extensions;if(n?.KHR_meshopt_compression&&n.EXT_meshopt_compression)throw new Error(`glTF bufferView ${r} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}const t=a.buffers||[];for(let r=0;r<t.length;r++){const n=t[r].extensions;if(n?.KHR_meshopt_compression&&n.EXT_meshopt_compression)throw new Error(`glTF buffer ${r} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`)}}async function co(a,e,t){const r=a.getObjectExtension(e,t);if(!r)return;const{byteOffset:n=0,byteLength:o,byteStride:s,count:i,mode:c,filter:b="NONE",buffer:f}=r,l=a.gltf.buffers[f],u=a.gltf.buffers[e.buffer],A=new Uint8Array(l.arrayBuffer,l.byteOffset+n,o),T=new Uint8Array(u.arrayBuffer,u.byteOffset+(e.byteOffset||0),e.byteLength);await so(T,i,s,A,c,b)}const jt="EXT_meshopt_compression";async function bo(a,e){await Lt(a,e,jt)}const fo=Object.freeze(Object.defineProperty({__proto__:null,decode:bo,name:jt},Symbol.toStringTag,{value:"Module"})),Ot="KHR_meshopt_compression";async function lo(a,e){await Lt(a,e,Ot)}const uo=Object.freeze(Object.defineProperty({__proto__:null,decode:lo,name:Ot},Symbol.toStringTag,{value:"Module"})),B="EXT_texture_webp",po=B;function mo(a,e){const t=new x(a);if(!ga("image/webp")){if(t.getRequiredExtensions().includes(B))throw new Error(`gltf: Required extension ${B} not supported by browser`);return}const{json:r}=t;for(const n of r.textures||[]){const o=t.getObjectExtension(n,B);o&&(n.source=o.source),t.removeObjectExtension(n,B)}t.removeExtension(B)}const ho=Object.freeze(Object.defineProperty({__proto__:null,name:po,preprocess:mo},Symbol.toStringTag,{value:"Module"})),N="EXT_texture_avif",go=N;async function Ao(a,e){const t=new x(a);if(!(await ma()).has("image/avif")){if(t.getRequiredExtensions().includes(N))throw new Error(`gltf: Required extension ${N} not supported by browser`);return}const{json:n}=t;for(const o of n.textures||[]){const s=t.getObjectExtension(o,N);s&&(o.source=s.source),t.removeObjectExtension(o,N)}t.removeExtension(N)}const xo=Object.freeze(Object.defineProperty({__proto__:null,name:go,preprocess:Ao},Symbol.toStringTag,{value:"Module"})),oe="KHR_texture_basisu",vo=oe;function _o(a,e){const t=new x(a),{json:r}=t;for(const n of r.textures||[]){const o=t.getObjectExtension(n,oe);o&&(n.source=o.source,t.removeObjectExtension(n,oe))}t.removeExtension(oe)}const To=Object.freeze(Object.defineProperty({__proto__:null,name:vo,preprocess:_o},Symbol.toStringTag,{value:"Module"})),yo="1.5.6",Eo="1.4.1",Te=`https://www.gstatic.com/draco/versioned/decoders/${yo}`,v={DECODER:"draco_wasm_wrapper.js",DECODER_WASM:"draco_decoder.wasm",FALLBACK_DECODER:"draco_decoder.js",ENCODER:"draco_encoder.js"},J={[v.DECODER]:`${Te}/${v.DECODER}`,[v.DECODER_WASM]:`${Te}/${v.DECODER_WASM}`,[v.FALLBACK_DECODER]:`${Te}/${v.FALLBACK_DECODER}`,[v.ENCODER]:`https://raw.githubusercontent.com/google/draco/${Eo}/javascript/${v.ENCODER}`};let ye;async function wo(a={},e){const t=a.modules||{};return t.draco3d?ye||=fe(()=>t.draco3d.createDecoderModule({}),r=>({draco:r})):ye||=Ro(a,e),await ye}function nt(a,e){if(a&&typeof a=="object"){if(a.default)return a.default;if(a[e])return a[e]}return a}async function Ro(a,e){let t,r;switch(e){case"js":t=await S(J[v.FALLBACK_DECODER],"draco",a,v.FALLBACK_DECODER);break;default:try{[t,r]=await Promise.all([await S(J[v.DECODER],"draco",a,v.DECODER),await S(J[v.DECODER_WASM],"draco",a,v.DECODER_WASM)])}catch{t=null,r=null}}return t=nt(t,"DracoDecoderModule"),t=t||globalThis.DracoDecoderModule,!t&&!K&&([t,r]=await Promise.all([await S(J[v.DECODER],"draco",{...a,useLocalLibraries:!0},v.DECODER),await S(J[v.DECODER_WASM],"draco",{...a,useLocalLibraries:!0},v.DECODER_WASM)]),t=nt(t,"DracoDecoderModule"),t=t||globalThis.DracoDecoderModule),await So(t,r)}function So(a,e){if(typeof a!="function")throw new Error("DracoDecoderModule could not be loaded");const t={};return e&&(t.wasmBinary=e),fe(r=>a({...t,onModuleLoaded:r}),r=>({draco:r}))}const Io="4.5.4";function Lo(a,e,t){const r=Ft(e.metadata),n=[],o=jo(e.attributes);for(const s in a){const i=a[s],c=ot(s,i,o[s]);n.push(c)}if(t){const s=ot("indices",t);n.push(s)}return{fields:n,metadata:r}}function jo(a){const e={};for(const t in a){const r=a[t];e[r.name||"undefined"]=r}return e}function ot(a,e,t){const r=t?Ft(t.metadata):void 0;return da(a,e,r)}function Ft(a){Object.entries(a);const e={};for(const t in a)e[`${t}.string`]=JSON.stringify(a[t]);return e}const st={POSITION:"POSITION",NORMAL:"NORMAL",COLOR:"COLOR_0",TEX_COORD:"TEXCOORD_0"},Oo={1:Int8Array,2:Uint8Array,3:Int16Array,4:Uint16Array,5:Int32Array,6:Uint32Array,9:Float32Array},Fo=4;class Po{draco;decoder;metadataQuerier;constructor(e){this.draco=e,this.decoder=new this.draco.Decoder,this.metadataQuerier=new this.draco.MetadataQuerier}destroy(){this.draco.destroy(this.decoder),this.draco.destroy(this.metadataQuerier)}parseSync(e,t={}){const r=new this.draco.DecoderBuffer;r.Init(new Int8Array(e),e.byteLength),this._disableAttributeTransforms(t);const n=this.decoder.GetEncodedGeometryType(r),o=n===this.draco.TRIANGULAR_MESH?new this.draco.Mesh:new this.draco.PointCloud;try{let s;switch(n){case this.draco.TRIANGULAR_MESH:s=this.decoder.DecodeBufferToMesh(r,o);break;case this.draco.POINT_CLOUD:s=this.decoder.DecodeBufferToPointCloud(r,o);break;default:throw new Error("DRACO: Unknown geometry type.")}if(!s.ok()||!o.ptr){const u=`DRACO decompression failed: ${s.error_msg()}`;throw new Error(u)}const i=this._getDracoLoaderData(o,n,t),c=this._getMeshData(o,i,t),b=la(c.attributes),f=Lo(c.attributes,i,c.indices);return{loader:"draco",loaderData:i,header:{vertexCount:o.num_points(),boundingBox:b},...c,schema:f}}finally{this.draco.destroy(r),o&&this.draco.destroy(o)}}_getDracoLoaderData(e,t,r){const n=this._getTopLevelMetadata(e),o=this._getDracoAttributes(e,r);return{geometry_type:t,num_attributes:e.num_attributes(),num_points:e.num_points(),num_faces:e instanceof this.draco.Mesh?e.num_faces():0,metadata:n,attributes:o}}_getDracoAttributes(e,t){const r={};for(let n=0;n<e.num_attributes();n++){const o=this.decoder.GetAttribute(e,n),s=this._getAttributeMetadata(e,n);r[o.unique_id()]={unique_id:o.unique_id(),attribute_type:o.attribute_type(),data_type:o.data_type(),num_components:o.num_components(),byte_offset:o.byte_offset(),byte_stride:o.byte_stride(),normalized:o.normalized(),attribute_index:n,metadata:s};const i=this._getQuantizationTransform(o,t);i&&(r[o.unique_id()].quantization_transform=i);const c=this._getOctahedronTransform(o,t);c&&(r[o.unique_id()].octahedron_transform=c)}return r}_getMeshData(e,t,r){const n=this._getMeshAttributes(t,e,r);if(!n.POSITION)throw new Error("DRACO: No position attribute found.");return e instanceof this.draco.Mesh?r.topology==="triangle-strip"?{topology:"triangle-strip",mode:4,attributes:n,indices:{value:this._getTriangleStripIndices(e),size:1}}:{topology:"triangle-list",mode:5,attributes:n,indices:{value:this._getTriangleListIndices(e),size:1}}:{topology:"point-list",mode:0,attributes:n}}_getMeshAttributes(e,t,r){const n={};for(const o of Object.values(e.attributes)){const s=this._deduceAttributeName(o,r);o.name=s;const i=this._getAttributeValues(t,o);if(i){const{value:c,size:b}=i;n[s]={value:c,size:b,byteOffset:o.byte_offset,byteStride:o.byte_stride,normalized:o.normalized}}}return n}_getTriangleListIndices(e){const r=e.num_faces()*3,n=r*Fo,o=this.draco._malloc(n);try{return this.decoder.GetTrianglesUInt32Array(e,n,o),new Uint32Array(this.draco.HEAPF32.buffer,o,r).slice()}finally{this.draco._free(o)}}_getTriangleStripIndices(e){const t=new this.draco.DracoInt32Array;try{return this.decoder.GetTriangleStripsFromMesh(e,t),ko(t)}finally{this.draco.destroy(t)}}_getAttributeValues(e,t){const r=Oo[t.data_type];if(!r)return console.warn(`DRACO: Unsupported attribute type ${t.data_type}`),null;const n=t.num_components,s=e.num_points()*n,i=s*r.BYTES_PER_ELEMENT,c=Mo(this.draco,r);let b;const f=this.draco._malloc(i);try{const l=this.decoder.GetAttribute(e,t.attribute_index);this.decoder.GetAttributeDataArrayForAllPoints(e,l,c,i,f),b=new r(this.draco.HEAPF32.buffer,f,s).slice()}finally{this.draco._free(f)}return{value:b,size:n}}_deduceAttributeName(e,t){const r=e.unique_id;for(const[s,i]of Object.entries(t.extraAttributes||{}))if(i===r)return s;const n=e.attribute_type;for(const s in st)if(this.draco[s]===n)return st[s];const o=t.attributeNameEntry||"name";return e.metadata[o]?e.metadata[o].string:`CUSTOM_ATTRIBUTE_${r}`}_getTopLevelMetadata(e){const t=this.decoder.GetMetadata(e);return this._getDracoMetadata(t)}_getAttributeMetadata(e,t){const r=this.decoder.GetAttributeMetadata(e,t);return this._getDracoMetadata(r)}_getDracoMetadata(e){if(!e||!e.ptr)return{};const t={},r=this.metadataQuerier.NumEntries(e);for(let n=0;n<r;n++){const o=this.metadataQuerier.GetEntryName(e,n);t[o]=this._getDracoMetadataField(e,o)}return t}_getDracoMetadataField(e,t){const r=new this.draco.DracoInt32Array;try{this.metadataQuerier.GetIntEntryArray(e,t,r);const n=Co(r);return{int:this.metadataQuerier.GetIntEntry(e,t),string:this.metadataQuerier.GetStringEntry(e,t),double:this.metadataQuerier.GetDoubleEntry(e,t),intArray:n}}finally{this.draco.destroy(r)}}_disableAttributeTransforms(e){const{quantizedAttributes:t=[],octahedronAttributes:r=[]}=e,n=[...t,...r];for(const o of n)this.decoder.SkipAttributeTransform(this.draco[o])}_getQuantizationTransform(e,t){const{quantizedAttributes:r=[]}=t,n=e.attribute_type();if(r.map(s=>this.decoder[s]).includes(n)){const s=new this.draco.AttributeQuantizationTransform;try{if(s.InitFromAttribute(e))return{quantization_bits:s.quantization_bits(),range:s.range(),min_values:new Float32Array([1,2,3]).map(i=>s.min_value(i))}}finally{this.draco.destroy(s)}}return null}_getOctahedronTransform(e,t){const{octahedronAttributes:r=[]}=t,n=e.attribute_type();if(r.map(s=>this.decoder[s]).includes(n)){const s=new this.draco.AttributeQuantizationTransform;try{if(s.InitFromAttribute(e))return{quantization_bits:s.quantization_bits()}}finally{this.draco.destroy(s)}}return null}}function Mo(a,e){switch(e){case Float32Array:return a.DT_FLOAT32;case Int8Array:return a.DT_INT8;case Int16Array:return a.DT_INT16;case Int32Array:return a.DT_INT32;case Uint8Array:return a.DT_UINT8;case Uint16Array:return a.DT_UINT16;case Uint32Array:return a.DT_UINT32;default:return a.DT_INVALID}}function Co(a){const e=a.size(),t=new Int32Array(e);for(let r=0;r<e;r++)t[r]=a.GetValue(r);return t}function ko(a){const e=a.size(),t=new Int32Array(e);for(let r=0;r<e;r++)t[r]=a.GetValue(r);return t}const Bo={dataType:null,batchType:null,name:"Draco",id:"draco",module:"draco",version:Io,worker:!0,extensions:["drc"],mimeTypes:["application/octet-stream"],binary:!0,tests:["DRACO"],options:{draco:{decoderType:typeof WebAssembly=="object"?"wasm":"js",extraAttributes:{},attributeNameEntry:void 0}}},No={...Bo,parse:Go};async function Go(a,e){const{draco:t}=await wo(dt(e),e?.draco?.decoderType||"wasm"),r=new Po(t);try{return r.parseSync(a,e?.draco)}finally{r.destroy()}}function Do(a){const e={};for(const t in a){const r=a[t];if(t!=="indices"){const n=Pt(r);e[t]=n}}return e}function Pt(a){const{buffer:e,size:t,count:r}=Uo(a);return{value:e,size:t,byteOffset:0,count:r,type:vt(t),componentType:le(e)}}function Uo(a){let e=a,t=1,r=0;return a&&a.value&&(e=a.value,t=a.size||1),e&&(ArrayBuffer.isView(e)||(e=Vo(e,Float32Array)),r=e.length/t),{buffer:e,size:t,count:r}}function Vo(a,e,t=!1){return a?Array.isArray(a)?new e(a):t&&!(a instanceof e)?new e(a):a:null}const j="KHR_draco_mesh_compression",qo=j;function zo(a,e,t){const r=new x(a);for(const n of Mt(r))r.getObjectExtension(n,j)}async function Ko(a,e,t){if(!e?.gltf?.decompressMeshes)return;const r=new x(a),n=[];for(const o of Mt(r))r.getObjectExtension(o,j)&&n.push(Wo(r,o,e,t));await Promise.all(n),r.removeExtension(j)}function Ho(a,e={}){const t=new x(a);for(const r of t.json.meshes||[])Jo(r),t.addRequiredExtension(j)}async function Wo(a,e,t,r){const n=a.getObjectExtension(e,j);if(!n)return;const o=a.getTypedArrayForBufferView(n.bufferView),s=ft(o.buffer,o.byteOffset),i={...t};delete i["3d-tiles"];const c=await lt(s,No,i,r),b=Do(c.attributes);for(const[f,l]of Object.entries(b))if(f in e.attributes){const u=e.attributes[f],A=a.getAccessor(u);A?.min&&A?.max&&(l.min=A.min,l.max=A.max)}e.attributes=b,c.indices&&(e.indices=Pt(c.indices)),a.removeObjectExtension(e,j),Xo(e)}function Jo(a,e,t=4,r,n){if(!r.DracoWriter)throw new Error("options.gltf.DracoWriter not provided");const o=r.DracoWriter.encodeSync({attributes:a}),s=n?.parseSync?.({attributes:a}),i=r._addFauxAttributes(s.attributes),c=r.addBufferView(o);return{primitives:[{attributes:i,mode:t,extensions:{[j]:{bufferView:c,attributes:i}}}]}}function Xo(a){if(!a.attributes&&Object.keys(a.attributes).length>0)throw new Error("glTF: Empty primitive detected: Draco decompression failure?")}function*Mt(a){for(const e of a.json.meshes||[])for(const t of e.primitives)yield t}const $o=Object.freeze(Object.defineProperty({__proto__:null,decode:Ko,encode:Ho,name:qo,preprocess:zo},Symbol.toStringTag,{value:"Module"})),z="KHR_texture_transform",Yo=z,ne=new M,Qo=new Pe,Zo=new Pe;async function es(a,e){const t=new x(a);if(!t.hasExtension(z)||!e.gltf?.loadBuffers)return;const n=a.json.materials||[];for(let o=0;o<n.length;o++)ts(o,a,t);n.some(o=>Ne(o).length>0)||t.removeExtension(z)}function ts(a,e,t){const r=e.json.materials?.[a],n=Ne(r),o=new Map;let s=as(e);for(const i of n){const c=i.extensions?.[z];if(c){const b=c.texCoord??i.texCoord??0,f=rs(b,c);let l=o.get(f);if(!l){if(l={sourceTexCoord:b,texCoord:s,matrix:cs(c)},!ns(e,a,l))continue;s++,o.set(f,l)}i.texCoord=l.texCoord,t.removeObjectExtension(i,z),i.extensions&&Object.keys(i.extensions).length===0&&delete i.extensions}}}function Ne(a){if(!a||typeof a!="object")return[];const e=a,t=[],r=e.extensions;Number.isFinite(e.index)&&r?.[z]&&t.push(e);for(const[n,o]of Object.entries(e))n!=="extras"&&t.push(...Ne(o));return t}function as(a){let e=-1;for(const t of a.json.meshes||[])for(const r of t.primitives)for(const n of Object.keys(r.attributes)){const o=/^TEXCOORD_(\d+)$/.exec(n);o&&(e=Math.max(e,Number(o[1])))}return e+1}function rs(a,e){const{offset:t=[0,0],rotation:r=0,scale:n=[1,1]}=e;return JSON.stringify([a,t,r,n])}function ns(a,e,t){const r=[],n=a.json.meshes||[];for(const o of n)for(const s of o.primitives){const i=s.material;Number.isFinite(i)&&e===i&&r.push(s)}if(r.length===0||r.some(o=>!os(a,o,t.sourceTexCoord)))return!1;for(const o of r)ss(a,o,t);return!0}function os(a,e,t){const r=e.attributes[`TEXCOORD_${t}`];if(!Number.isFinite(r))return!1;const n=a.json.accessors?.[r];if(!n||n.bufferView===void 0||n.sparse)return!1;const o=a.json.bufferViews?.[n.bufferView];return!!(o&&a.buffers[o.buffer])}function ss(a,e,t){const{sourceTexCoord:r,texCoord:n,matrix:o}=t,s=e.attributes[`TEXCOORD_${r}`];if(Number.isFinite(s)){const i=a.json.accessors?.[s];if(i&&i.bufferView!==void 0){const c=a.json.bufferViews?.[i.bufferView];if(c){const{arrayBuffer:b,byteOffset:f}=a.buffers[c.buffer],l=(f||0)+(i.byteOffset||0)+(c.byteOffset||0),{ArrayType:u,length:A}=ce(i,c),T=xt[i.componentType],y=At[i.type],I=c.byteStride||T*y,p=new Float32Array(A);for(let d=0;d<i.count;d++){const m=new u(b,l+d*I,2);ne.set(m[0],m[1],1),ne.transformByMatrix3(o),p.set([ne[0],ne[1]],d*y)}is(n,i,e,a,p)}}}}function is(a,e,t,r,n){r.buffers.push({arrayBuffer:Fe(n.buffer),byteOffset:0,byteLength:n.buffer.byteLength}),r.json.bufferViews=r.json.bufferViews||[];const o=r.json.bufferViews;o.push({buffer:r.buffers.length-1,byteLength:n.buffer.byteLength,byteOffset:0});const s=r.json.accessors;s&&(s.push({bufferView:o?.length-1,byteOffset:0,componentType:5126,count:e.count,type:"VEC2"}),t.attributes[`TEXCOORD_${a}`]=s.length-1)}function cs(a){const{offset:e=[0,0],rotation:t=0,scale:r=[1,1]}=a,n=new Pe().set(1,0,0,0,1,0,e[0],e[1],1),o=Qo.set(Math.cos(t),Math.sin(t),0,-Math.sin(t),Math.cos(t),0,0,0,1),s=Zo.set(r[0],0,0,0,r[1],0,0,0,1);return n.multiplyRight(o).multiplyRight(s)}const bs=Object.freeze(Object.defineProperty({__proto__:null,decode:es,name:Yo},Symbol.toStringTag,{value:"Module"})),P="KHR_lights_punctual",fs=P;async function ls(a){const e=new x(a),{json:t}=e,r=e.getExtension(P);r&&(e.json.lights=r.lights,e.removeExtension(P));for(const n of t.nodes||[]){const o=e.getObjectExtension(n,P);o&&(n.light=o.light),e.removeObjectExtension(n,P)}}async function ds(a){const e=new x(a),{json:t}=e;if(t.lights){const r=e.addExtension(P);_(!r.lights),r.lights=t.lights,delete t.lights}if(e.json.lights){for(const r of e.json.lights){const n=r.node;e.addObjectExtension(n,P,r)}delete e.json.lights}}const us=Object.freeze(Object.defineProperty({__proto__:null,decode:ls,encode:ds,name:fs},Symbol.toStringTag,{value:"Module"})),Z="KHR_materials_unlit",ps=Z;async function ms(a){const e=new x(a),{json:t}=e;for(const r of t.materials||[])r.extensions&&r.extensions.KHR_materials_unlit&&(r.unlit=!0),e.removeObjectExtension(r,Z);e.removeExtension(Z)}function hs(a){const e=new x(a),{json:t}=e;if(e.materials)for(const r of t.materials||[])r.unlit&&(delete r.unlit,e.addObjectExtension(r,Z,{}),e.addExtension(Z))}const gs=Object.freeze(Object.defineProperty({__proto__:null,decode:ms,encode:hs,name:ps},Symbol.toStringTag,{value:"Module"})),X="KHR_techniques_webgl",As=X;async function xs(a){const e=new x(a),{json:t}=e,r=e.getExtension(X);if(r){const n=_s(r,e);for(const o of t.materials||[]){const s=e.getObjectExtension(o,X);s&&(o.technique=Object.assign({},s,n[s.technique]),o.technique.values=Ts(o.technique,e)),e.removeObjectExtension(o,X)}e.removeExtension(X)}}async function vs(a,e){}function _s(a,e){const{programs:t=[],shaders:r=[],techniques:n=[]}=a,o=new TextDecoder;return r.forEach(s=>{if(Number.isFinite(s.bufferView))s.code=o.decode(e.getTypedArrayForBufferView(s.bufferView));else throw new Error("KHR_techniques_webgl: no shader code")}),t.forEach(s=>{s.fragmentShader=r[s.fragmentShader],s.vertexShader=r[s.vertexShader]}),n.forEach(s=>{s.program=t[s.program]}),n}function Ts(a,e){const t=Object.assign({},a.values);return Object.keys(a.uniforms||{}).forEach(r=>{a.uniforms[r].value&&!(r in t)&&(t[r]=a.uniforms[r].value)}),Object.keys(t).forEach(r=>{typeof t[r]=="object"&&t[r].index!==void 0&&(t[r].texture=e.getTexture(t[r].index))}),t}const ys=Object.freeze(Object.defineProperty({__proto__:null,decode:xs,encode:vs,name:As},Symbol.toStringTag,{value:"Module"})),Ct=[In,Qr,uo,fo,xo,ho,To,$o,us,gs,ys,bs,Kn];async function Es(a,e={},t){const r=Ct.filter(n=>kt(n.name,e));for(const n of r)await n.preprocess?.(a,e,t)}async function ws(a,e={},t){const r=Ct.filter(n=>kt(n.name,e));for(const n of r)await n.decode?.(a,e,t)}function kt(a,e){const t=e?.gltf?.excludeExtensions||{};return!(a in t&&!t[a])}const Ee="KHR_binary_glTF";function Rs(a){const e=new x(a),{json:t}=e;for(const r of t.images||[]){const n=e.getObjectExtension(r,Ee);n&&Object.assign(r,n),e.removeObjectExtension(r,Ee)}t.buffers&&t.buffers[0]&&delete t.buffers[0].uri,e.removeExtension(Ee)}const it={accessors:"accessor",animations:"animation",buffers:"buffer",bufferViews:"bufferView",images:"image",materials:"material",meshes:"mesh",nodes:"node",samplers:"sampler",scenes:"scene",skins:"skin",textures:"texture"},Ss={accessor:"accessors",animations:"animation",buffer:"buffers",bufferView:"bufferViews",image:"images",material:"materials",mesh:"meshes",node:"nodes",sampler:"samplers",scene:"scenes",skin:"skins",texture:"textures"};class Is{idToIndexMap={animations:{},accessors:{},buffers:{},bufferViews:{},images:{},materials:{},meshes:{},nodes:{},samplers:{},scenes:{},skins:{},textures:{}};json;normalize(e,t){this.json=e.json;const r=e.json;switch(r.asset&&r.asset.version){case"2.0":return;case void 0:case"1.0":break;default:console.warn(`glTF: Unknown version ${r.asset.version}`);return}if(!t.normalize)throw new Error("glTF v1 is not supported.");console.warn("Converting glTF v1 to glTF v2 format. This is experimental and may fail."),this._addAsset(r),this._convertTopLevelObjectsToArrays(r),Rs(e),this._convertObjectIdsToArrayIndices(r),this._updateObjects(r),this._updateMaterial(r)}_addAsset(e){e.asset=e.asset||{},e.asset.version="2.0",e.asset.generator=e.asset.generator||"Normalized to glTF 2.0 by loaders.gl"}_convertTopLevelObjectsToArrays(e){for(const t in it)this._convertTopLevelObjectToArray(e,t)}_convertTopLevelObjectToArray(e,t){const r=e[t];if(!(!r||Array.isArray(r))){e[t]=[];for(const n in r){const o=r[n];o.id=o.id||n;const s=e[t].length;e[t].push(o),this.idToIndexMap[t][n]=s}}}_convertObjectIdsToArrayIndices(e){for(const t in it)this._convertIdsToIndices(e,t);"scene"in e&&(e.scene=this._convertIdToIndex(e.scene,"scene"));for(const t of e.textures)this._convertTextureIds(t);for(const t of e.meshes)this._convertMeshIds(t);for(const t of e.nodes)this._convertNodeIds(t);for(const t of e.scenes)this._convertSceneIds(t)}_convertTextureIds(e){e.source&&(e.source=this._convertIdToIndex(e.source,"image"))}_convertMeshIds(e){for(const t of e.primitives){const{attributes:r,indices:n,material:o}=t;for(const s in r)r[s]=this._convertIdToIndex(r[s],"accessor");n&&(t.indices=this._convertIdToIndex(n,"accessor")),o&&(t.material=this._convertIdToIndex(o,"material"))}}_convertNodeIds(e){e.children&&(e.children=e.children.map(t=>this._convertIdToIndex(t,"node"))),e.meshes&&(e.meshes=e.meshes.map(t=>this._convertIdToIndex(t,"mesh")))}_convertSceneIds(e){e.nodes&&(e.nodes=e.nodes.map(t=>this._convertIdToIndex(t,"node")))}_convertIdsToIndices(e,t){e[t]||(console.warn(`gltf v1: json doesn't contain attribute ${t}`),e[t]=[]);for(const r of e[t])for(const n in r){const o=r[n],s=this._convertIdToIndex(o,n);r[n]=s}}_convertIdToIndex(e,t){const r=Ss[t];if(r in this.idToIndexMap){const n=this.idToIndexMap[r][e];if(!Number.isFinite(n))throw new Error(`gltf v1: failed to resolve ${t} with id ${e}`);return n}return e}_updateObjects(e){for(const t of this.json.buffers)delete t.type}_updateMaterial(e){for(const t of e.materials){t.pbrMetallicRoughness={baseColorFactor:[1,1,1,1],metallicFactor:1,roughnessFactor:1};const r=t.values?.tex||t.values?.texture2d_0||t.values?.diffuseTex,n=e.textures.findIndex(o=>o.id===r);n!==-1&&(t.pbrMetallicRoughness.baseColorTexture={index:n})}}}function Ls(a,e={}){return new Is().normalize(a,e)}function js(a,e){const t=a.basis,r=t?.format;return{...a,core:{...a.core,mimeType:e},basis:{...t,format:r&&r!=="auto"?r:Re(t?.supportedTextureFormats)}}}async function Os(a,e,t=0,r,n){return Fs(a,e,t,r),Ls(a,{normalize:r?.gltf?.normalize}),await Es(a,r,n),r?.gltf?.loadBuffers&&a.json.buffers&&await Ps(a,r,n),r?.gltf?.loadImages&&await Ms(a,r,n),await ws(a,r,n),a}function Fs(a,e,t,r){if(r.core?.baseUrl&&(a.baseUri=r.core?.baseUrl),e instanceof ArrayBuffer&&!Zn(e,t,r.glb)&&(e=new TextDecoder().decode(e)),typeof e=="string")a.json=ca(e);else if(e instanceof ArrayBuffer){const s={};t=eo(s,e,t,r.glb),_(s.type==="glTF",`Invalid GLB magic string ${s.type}`),a._glb=s,a.json=s.json}else _(!1,"GLTF: must be ArrayBuffer or string");const n=a.json.buffers||[];if(a.buffers=new Array(n.length).fill(null),a._glb&&a._glb.header.hasBinChunk){const{binChunks:s}=a._glb;a.buffers[0]={arrayBuffer:s[0].arrayBuffer,byteOffset:s[0].byteOffset,byteLength:s[0].byteLength}}const o=a.json.images||[];a.images=new Array(o.length).fill({})}async function Ps(a,e,t){const r=a.json.buffers||[];for(let n=0;n<r.length;++n){const o=r[n];if(o.uri){const{fetch:s}=t;_(s);const i=It(o.uri,e,t),b=await(await t?.fetch?.(i))?.arrayBuffer?.();a.buffers[n]={arrayBuffer:b,byteOffset:0,byteLength:b.byteLength},delete o.uri}else a.buffers[n]===null&&(a.buffers[n]={arrayBuffer:new ArrayBuffer(o.byteLength),byteOffset:0,byteLength:o.byteLength})}}async function Ms(a,e,t){const r=Cs(a),n=a.json.images||[],o=[];for(const s of r)o.push(ks(a,n[s],s,e,t));return await Promise.all(o)}function Cs(a){const e=new Set,t=a.json.textures||[];for(const r of t)r.source!==void 0&&e.add(r.source);return Array.from(e).sort()}async function ks(a,e,t,r,n){let o;if(e.uri&&!e.hasOwnProperty("bufferView")){const c=It(e.uri,r,n),{fetch:b}=n;o=await(await b(c)).arrayBuffer(),e.bufferView={data:o}}if(Number.isFinite(e.bufferView)){const c=Br(a.json,a.buffers,e.bufferView);o=ft(c.buffer,c.byteOffset,c.byteLength)}_(o,"glTF image has no data");const s=js(r,e.mimeType);let i=await lt(o,[Wt,er],s,n);i&&i[0]&&(i={compressed:!0,mipmaps:!1,width:i[0].width,height:i[0].height,data:i[0]}),a.images=a.images||[],a.images[t]=i}const je={dataType:null,batchType:null,name:"glTF",id:"gltf",module:"gltf",version:Hn,extensions:["gltf","glb"],mimeTypes:["model/gltf+json","model/gltf-binary"],text:!0,binary:!0,tests:["glTF"],parse:Bs,options:{gltf:{normalize:!0,loadBuffers:!0,loadImages:!0,decompressMeshes:!0}}};async function Bs(a,e={},t){const r={...je.options,...e};r.gltf={...je.options.gltf,...r.gltf};const n=e?.glb?.byteOffset||0;return await Os({},a,n,r,t)}const Ns={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Gs={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},R={TEXTURE_MAG_FILTER:10240,TEXTURE_MIN_FILTER:10241,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,REPEAT:10497,LINEAR:9729,NEAREST_MIPMAP_LINEAR:9986},Ds={magFilter:R.TEXTURE_MAG_FILTER,minFilter:R.TEXTURE_MIN_FILTER,wrapS:R.TEXTURE_WRAP_S,wrapT:R.TEXTURE_WRAP_T},Us={[R.TEXTURE_MAG_FILTER]:R.LINEAR,[R.TEXTURE_MIN_FILTER]:R.NEAREST_MIPMAP_LINEAR,[R.TEXTURE_WRAP_S]:R.REPEAT,[R.TEXTURE_WRAP_T]:R.REPEAT};function Vs(){return{id:"default-sampler",parameters:Us}}function qs(a){return Gs[a]}function zs(a){return Ns[a]}class Ks{baseUri="";jsonUnprocessed;json;buffers=[];images=[];postProcess(e,t={}){const{json:r,buffers:n=[],images:o=[]}=e,{baseUri:s=""}=e;return _(r),this.baseUri=s,this.buffers=n,this.images=o,this.jsonUnprocessed=r,this.json=this._resolveTree(e.json,t),this.json}_resolveTree(e,t={}){const r={...e};return this.json=r,e.bufferViews&&(r.bufferViews=e.bufferViews.map((n,o)=>this._resolveBufferView(n,o))),e.images&&(r.images=e.images.map((n,o)=>this._resolveImage(n,o))),e.samplers&&(r.samplers=e.samplers.map((n,o)=>this._resolveSampler(n,o))),e.textures&&(r.textures=e.textures.map((n,o)=>this._resolveTexture(n,o))),e.accessors&&(r.accessors=e.accessors.map((n,o)=>this._resolveAccessor(n,o))),e.materials&&(r.materials=e.materials.map((n,o)=>this._resolveMaterial(n,o))),e.meshes&&(r.meshes=e.meshes.map((n,o)=>this._resolveMesh(n,o))),e.nodes&&(r.nodes=e.nodes.map((n,o)=>this._resolveNode(n,o)),r.nodes=r.nodes.map((n,o)=>this._resolveNodeChildren(n))),e.skins&&(r.skins=e.skins.map((n,o)=>this._resolveSkin(n,o))),e.scenes&&(r.scenes=e.scenes.map((n,o)=>this._resolveScene(n,o))),typeof this.json.scene=="number"&&r.scenes&&(r.scene=r.scenes[this.json.scene]),r}getScene(e){return this._get(this.json.scenes,e)}getNode(e){return this._get(this.json.nodes,e)}getSkin(e){return this._get(this.json.skins,e)}getMesh(e){return this._get(this.json.meshes,e)}getMaterial(e){return this._get(this.json.materials,e)}getAccessor(e){return this._get(this.json.accessors,e)}getCamera(e){return this._get(this.json.cameras,e)}getTexture(e){return this._get(this.json.textures,e)}getSampler(e){return this._get(this.json.samplers,e)}getImage(e){return this._get(this.json.images,e)}getBufferView(e){return this._get(this.json.bufferViews,e)}getBuffer(e){return this._get(this.json.buffers,e)}_get(e,t){if(typeof t=="object")return t;const r=e&&e[t];return r||console.warn(`glTF file error: Could not find ${e}[${t}]`),r}_resolveScene(e,t){return{...e,id:e.id||`scene-${t}`,nodes:(e.nodes||[]).map(r=>this.getNode(r))}}_resolveNode(e,t){const r={...e,id:e?.id||`node-${t}`};return e.mesh!==void 0&&(r.mesh=this.getMesh(e.mesh)),e.camera!==void 0&&(r.camera=this.getCamera(e.camera)),e.skin!==void 0&&(r.skin=this.getSkin(e.skin)),e.meshes!==void 0&&e.meshes.length&&(r.mesh=e.meshes.reduce((n,o)=>{const s=this.getMesh(o);return n.id=s.id,n.primitives=n.primitives.concat(s.primitives),n},{primitives:[]})),r}_resolveNodeChildren(e){return e.children&&(e.children=e.children.map(t=>this.getNode(t))),e}_resolveSkin(e,t){const r=typeof e.inverseBindMatrices=="number"?this.getAccessor(e.inverseBindMatrices):void 0;return{...e,id:e.id||`skin-${t}`,inverseBindMatrices:r}}_resolveMesh(e,t){const r={...e,id:e.id||`mesh-${t}`,primitives:[]};return e.primitives&&(r.primitives=e.primitives.map((n,o)=>{const s={...n,attributes:{},indices:void 0,material:void 0},i=n.attributes;for(const c in i)s.attributes[c]=this.getAccessor(i[c]);return n.indices!==void 0&&(s.indices=this.getAccessor(n.indices)),n.material!==void 0&&(s.material=this.getMaterial(n.material)),Hs(s,r.id,o)})),r}_resolveMaterial(e,t){const r={...e,id:e.id||`material-${t}`};if(r.normalTexture&&(r.normalTexture={...r.normalTexture},r.normalTexture.texture=this.getTexture(r.normalTexture.index)),r.occlusionTexture&&(r.occlusionTexture={...r.occlusionTexture},r.occlusionTexture.texture=this.getTexture(r.occlusionTexture.index)),r.emissiveTexture&&(r.emissiveTexture={...r.emissiveTexture},r.emissiveTexture.texture=this.getTexture(r.emissiveTexture.index)),r.emissiveFactor||(r.emissiveFactor=r.emissiveTexture?[1,1,1]:[0,0,0]),r.pbrMetallicRoughness){r.pbrMetallicRoughness={...r.pbrMetallicRoughness};const n=r.pbrMetallicRoughness;n.baseColorTexture&&(n.baseColorTexture={...n.baseColorTexture},n.baseColorTexture.texture=this.getTexture(n.baseColorTexture.index)),n.metallicRoughnessTexture&&(n.metallicRoughnessTexture={...n.metallicRoughnessTexture},n.metallicRoughnessTexture.texture=this.getTexture(n.metallicRoughnessTexture.index))}return r}_resolveAccessor(e,t){const r=qs(e.componentType),n=zs(e.type),o=r*n,s={...e,id:e.id||`accessor-${t}`,bytesPerComponent:r,components:n,bytesPerElement:o,value:void 0,bufferView:void 0,sparse:void 0};if(e.bufferView!==void 0&&(s.bufferView=this.getBufferView(e.bufferView)),s.bufferView){const i=s.bufferView.buffer,{ArrayType:c,byteLength:b}=ce(s,s.bufferView),f=(s.bufferView.byteOffset||0)+(s.byteOffset||0)+i.byteOffset;let l=De(i.arrayBuffer,f,b);s.bufferView.byteStride&&(l=this._getValueFromInterleavedBuffer(i,f,s.bufferView.byteStride,s.bytesPerElement,s.count)),s.value=new c(l)}else{const{ArrayType:i}=ce(s,{byteLength:s.count*s.bytesPerElement});s.value=new i(s.count*s.components)}return e.sparse&&this._applySparseAccessor(s,e.sparse),s}_applySparseAccessor(e,t){const r=Ws(t.indices.componentType),n=this._getTypedArrayFromBufferView(r,this.getBufferView(t.indices.bufferView),t.indices.byteOffset||0,t.count),o=e.value.constructor,s=this._getTypedArrayFromBufferView(o,this.getBufferView(t.values.bufferView),t.values.byteOffset||0,t.count*e.components);for(let i=0;i<t.count;i++){const c=Number(n[i]);_(Number.isInteger(c)&&c>=0&&c<e.count,"glTF sparse accessor index is out of bounds");for(let b=0;b<e.components;b++){const f=c*e.components+b,l=i*e.components+b;Reflect.set(e.value,f,s[l])}}}_getTypedArrayFromBufferView(e,t,r,n){const o=n*e.BYTES_PER_ELEMENT;_(r+o<=t.byteLength,"glTF sparse accessor data exceeds its buffer view");const s=t.buffer,i=s.byteOffset+(t.byteOffset||0)+r,c=De(s.arrayBuffer,i,o);return new e(c)}_getValueFromInterleavedBuffer(e,t,r,n,o){const s=new Uint8Array(o*n);for(let i=0;i<o;i++){const c=t+i*r;s.set(new Uint8Array(e.arrayBuffer.slice(c,c+n)),i*n)}return s.buffer}_resolveTexture(e,t){return{...e,id:e.id||`texture-${t}`,sampler:typeof e.sampler=="number"?this.getSampler(e.sampler):Vs(),source:typeof e.source=="number"?this.getImage(e.source):void 0}}_resolveSampler(e,t){const r={id:e.id||`sampler-${t}`,...e,parameters:{}};for(const n in r){const o=this._enumSamplerParameter(n);o!==void 0&&(r.parameters[o]=r[n])}return r}_enumSamplerParameter(e){return Ds[e]}_resolveImage(e,t){const r={...e,id:e.id||`image-${t}`,image:null,bufferView:e.bufferView!==void 0?this.getBufferView(e.bufferView):void 0},n=this.images[t];return n&&(r.image=n),r}_resolveBufferView(e,t){const r=e.buffer,n=this.buffers[r].arrayBuffer;let o=this.buffers[r].byteOffset||0;return e.byteOffset&&(o+=e.byteOffset),{id:`bufferView-${t}`,...e,buffer:this.buffers[r],data:new Uint8Array(n,o,e.byteLength)}}_resolveCamera(e,t){const r={...e,id:e.id||`camera-${t}`};return r.perspective,r.orthographic,r}}function Hs(a,e,t){if(a.mode!==2&&a.mode!==6)return a;const r=a.indices?.value,n=a.indices?.count??Js(a),o=Xs(r,n),s=o<=65535?Uint16Array:Uint32Array,i=a.mode===2?Ys(r,n,s):Qs(r,n,s);return a.mode=a.mode===2?1:4,a.indices={id:`${e}-primitive-${t}-portable-indices`,components:1,bytesPerComponent:s.BYTES_PER_ELEMENT,bytesPerElement:s.BYTES_PER_ELEMENT,componentType:s===Uint16Array?5123:5125,normalized:!1,count:i.length,type:"SCALAR",min:i.length?[$s(i)]:void 0,max:i.length?[o]:void 0,value:i},a}function Ws(a){switch(a){case 5121:return Uint8Array;case 5123:return Uint16Array;case 5125:return Uint32Array;default:throw new Error(`Invalid glTF sparse index component type ${a}`)}}function Js(a){const e=Object.values(a.attributes)[0];return _(e,"glTF primitive must define at least one attribute"),e.count}function Xs(a,e){if(!a)return Math.max(0,e-1);let t=0;for(let r=0;r<e;r++)t=Math.max(t,Number(a[r]));return t}function $s(a){let e=1/0;for(const t of a)e=Math.min(e,t);return e}function Y(a,e){return a?Number(a[e]):e}function Ys(a,e,t){if(e<2)return new t(0);const r=new t(e*2);for(let n=0;n<e;n++)r[n*2]=Y(a,n),r[n*2+1]=Y(a,(n+1)%e);return r}function Qs(a,e,t){const r=Math.max(0,e-2),n=new t(r*3);for(let o=0;o<r;o++)n[o*3]=Y(a,0),n[o*3+1]=Y(a,o+1),n[o*3+2]=Y(a,o+2);return n}function Zs(a,e){return new Ks().postProcess(a,e)}async function ei(a){const e=[];return a.scenes.forEach(t=>{t.traverse(r=>{})}),await ti(()=>e.some(t=>!t.loaded))}async function ti(a){for(;a();)await new Promise(e=>requestAnimationFrame(e))}const ct=`uniform scenegraphUniforms {
  float sizeScale;
  float sizeMinPixels;
  float sizeMaxPixels;
  mat4 sceneModelMatrix;
  bool composeModelMatrix;
} scenegraph;
`,ai={name:"scenegraph",vs:ct,fs:ct,uniformTypes:{sizeScale:"f32",sizeMinPixels:"f32",sizeMaxPixels:"f32",sceneModelMatrix:"mat4x4<f32>",composeModelMatrix:"f32"}},ri=`#version 300 es
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
`,ni=`#version 300 es
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
`,Bt=[255,255,255,255],oi={scenegraph:{type:"object",value:null,async:!0},getScene:a=>a&&a.scenes?typeof a.scene=="object"?a.scene:a.scenes[a.scene||0]:a,getAnimator:a=>a&&a.animator,_animations:null,sizeScale:{type:"number",value:1,min:0},sizeMinPixels:{type:"number",min:0,value:0},sizeMaxPixels:{type:"number",min:0,value:Number.MAX_SAFE_INTEGER},getPosition:{type:"accessor",value:a=>a.position},getColor:{type:"accessor",value:Bt},_lighting:"flat",_imageBasedLightingEnvironment:void 0,getOrientation:{type:"accessor",value:[0,0,0]},getScale:{type:"accessor",value:[1,1,1]},getTranslation:{type:"accessor",value:[0,0,0]},getTransformMatrix:{type:"accessor",value:[]},loaders:[je]};class Nt extends Jt{getShaders(){const e={};let t;this.props._lighting==="pbr"?(t=pt,e.LIGHTING_PBR=1):t={name:"pbrMaterial"};const r=[Xt,$t,ai,t];return super.getShaders({defines:e,vs:ri,fs:ni,modules:r})}initializeState(){this.getAttributeManager().addInstanced({instancePositions:{size:3,type:"float64",fp64:this.use64bitPositions(),accessor:"getPosition",transition:!0},instanceColors:{type:"unorm8",size:this.props.colorFormat.length,accessor:"getColor",defaultValue:Bt,transition:!0},instanceModelMatrix:Gt})}updateState(e){super.updateState(e);const{props:t,oldProps:r}=e;t.scenegraph!==r.scenegraph?this._updateScenegraph():t._animations!==r._animations&&this._applyAnimationsProp(this.state.animator,t._animations)}finalizeState(e){super.finalizeState(e),this.state.scenegraph?.destroy()}get isLoaded(){return!!(this.state?.scenegraph&&super.isLoaded)}_updateScenegraph(){const e=this.props,{device:t}=this.context;let r=null;if(e.scenegraph instanceof se)r={scenes:[e.scenegraph]};else if(e.scenegraph&&typeof e.scenegraph=="object"){const i=e.scenegraph,c=i.json?Zs(i):i,b=jr(t,c,this._getModelOptions());r={gltf:c,...b},ei(b).then(()=>{this.setNeedsRedraw()}).catch(f=>{this.raiseError(f,"loading glTF")})}const n={layer:this,device:this.context.device},o=e.getScene(r,n),s=e.getAnimator(r,n);if(o instanceof H){this.state.scenegraph?.destroy(),this._applyAnimationsProp(s,e._animations);const i=[];o.traverse(c=>{c instanceof we&&i.push(c.model)}),this.setState({scenegraph:o,animator:s,models:i}),this.getAttributeManager().invalidateAll()}else o!==null&&me.warn("invalid scenegraph:",o)()}_applyAnimationsProp(e,t){if(!e||!t)return;const r=e.getAnimations();Object.keys(t).sort().forEach(n=>{const o=t[n];if(n==="*")r.forEach(s=>{Object.assign(s,o)});else if(Number.isFinite(Number(n))){const s=Number(n);s>=0&&s<r.length?Object.assign(r[s],o):me.warn(`animation ${n} not found`)()}else{const s=r.find(({animation:i})=>i.name===n);s?Object.assign(s,o):me.warn(`animation ${n} not found`)()}})}_getModelOptions(){const{_imageBasedLightingEnvironment:e}=this.props;let t;return e&&(typeof e=="function"?t=e({gl:this.context.gl,layer:this}):t=e),{imageBasedLightingEnvironment:t,modelOptions:{id:this.props.id,isInstanced:!0,bufferLayout:this.getAttributeManager().getBufferLayouts(),...this.getShaders()},useTangents:!1}}draw({context:e}){if(!this.state.scenegraph)return;this.props._animations&&this.state.animator&&(this.state.animator.animate(e.timeline.getTime()),this.setNeedsRedraw());const{viewport:t,renderPass:r}=this.context,{sizeScale:n,sizeMinPixels:o,sizeMaxPixels:s,coordinateSystem:i}=this.props,c={camera:t.cameraPosition},b=this.getNumInstances();this.state.scenegraph.traverse((f,{worldMatrix:l})=>{if(f instanceof we){const{model:u}=f;u.setInstanceCount(b);const A={sizeScale:n,sizeMinPixels:o,sizeMaxPixels:s,composeModelMatrix:Dt(t,i),sceneModelMatrix:l};u.shaderInputs.setProps({pbrProjection:c,scenegraph:A}),u.draw(r)}})}}Nt.defaultProps=oi;Nt.layerName="ScenegraphLayer";export{No as D,je as G,Nt as S,nr as a,lt as b,Zs as c,di as g,pt as p};
