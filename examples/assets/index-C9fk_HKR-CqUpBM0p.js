const l={name:"create-texture-unorm",inject:{"fs:#decl":"uniform sampler2D textureName;","fs:DECKGL_FILTER_COLOR":`
      color = texture(textureName, geometry.uv);
    `},getUniforms:e=>({textureName:e.textureName})},r=`
  const vec3 D65 = vec3(
      0.95047, // Xn
      1.00000, // Yn
      1.08883 // Zn
  );

  vec3 cielabToRgb(vec3 labTex) {
    // labTex in [0,1] from RGB8 texture
    float L = labTex.r * 255.0;
    float a = (labTex.g - 0.5) * 255.0;
    float b = (labTex.b - 0.5) * 255.0;

    float y = (L + 16.0) / 116.0;
    float x = (a / 500.0) + y;
    float z = y - (b / 200.0);

    vec3 xyz;
    vec3 v = vec3(x, y, z);
    vec3 v3 = v * v * v;

    xyz = D65 * mix(
      (v - 16.0 / 116.0) / 7.787,
      v3,
      step(0.008856, v3)
    );

    vec3 rgb = mat3(
      3.2406, -1.5372, -0.4986,
      -0.9689, 1.8758, 0.0415,
      0.0557, -0.2040, 1.0570
    ) * xyz;

    // sRGB gamma
    rgb = mix(
      12.92 * rgb,
      1.055 * pow(rgb, vec3(1.0 / 2.4)) - 0.055,
      step(0.0031308, rgb)
    );

    return clamp(rgb, 0.0, 1.0);
  }
`,b={name:"cielab-to-rgb",inject:{"fs:#decl":r,"fs:DECKGL_FILTER_COLOR":`
      color.rgb = cielabToRgb(color);
    `}},o=`
  vec3 cmykToRgb(vec4 cmyk) {
    // cmyk in [0.0, 1.0]
    float invK = 1.0 - cmyk.a;

    return vec3(
        (1.0 - cmyk.r) * invK,
        (1.0 - cmyk.g) * invK,
        (1.0 - cmyk.b) * invK
    );
  }
`,m={name:"cmyk-to-rgb",inject:{"fs:#decl":o,"fs:DECKGL_FILTER_COLOR":`
      color.rgb = cmykToRgb(color);
    `}},a=`
  vec3 ycbcrToRgb(vec3 ycbcr) {
    // ycbcr in [0.0, 1.0]
    float y = ycbcr.r;
    float cb = ycbcr.g - 0.5;
    float cr = ycbcr.b - 0.5;

    return vec3(
        y + 1.40200 * cr,
        y - 0.34414 * cb - 0.71414 * cr,
        y + 1.77200 * cb
    );
  }
`,n={name:"ycbcr-to-rgb",inject:{"fs:#decl":a,"fs:DECKGL_FILTER_COLOR":`
      color.rgb = ycbcrToRgb(color.rgb);
    `}},f={name:"colormap",inject:{"fs:#decl":"uniform sampler2D colormapTexture;","fs:DECKGL_FILTER_COLOR":`
      color = texture(colormapTexture, vec2(color.r, 0.));
    `},getUniforms:e=>({colormapTexture:e.colormapTexture})},c="nodata",t=`uniform ${c}Uniforms {
  float value;
} ${c};
`,v={name:c,fs:t,inject:{"fs:DECKGL_FILTER_COLOR":`
    if (color.r == nodata.value) {
      discard;
    }
    `},uniformTypes:{value:"f32"},getUniforms:e=>({value:e.value})};export{m as CMYKToRGB,f as Colormap,l as CreateTexture,v as FilterNoDataVal,n as YCbCrToRGB,b as cieLabToRGB};
