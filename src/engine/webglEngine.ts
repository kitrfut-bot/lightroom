/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PhotoAdjustments, LocalMask } from '../types/darkroom';

// Vertex shader: Full-quad rendering with texture coordinates
const VS_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

// Fragment shader: Multi-pass color science and non-destructive darkroom pipeline
const FS_SOURCE = `
precision highp float;

varying vec2 v_texCoord;

uniform sampler2D u_image;
uniform sampler2D u_maskTexture;
uniform int u_hasMaskTexture;

// Split comparison
uniform float u_splitRatio; // -1.0 for full processed, 0..1 for split
uniform int u_showOriginalOnly;

// Mask overlay visualization
uniform int u_showMaskOverlay;

// Basic tone controls
uniform float u_exposure;    // -5.0 to 5.0
uniform float u_contrast;    // -1.0 to 1.0
uniform float u_highlights;  // -1.0 to 1.0
uniform float u_shadows;     // -1.0 to 1.0
uniform float u_whites;      // -1.0 to 1.0
uniform float u_blacks;      // -1.0 to 1.0

// White balance & Presence
uniform float u_temp;        // normalized kelvin offset -1.0 to 1.0
uniform float u_tint;        // -1.0 to 1.0
uniform float u_vibrance;    // -1.0 to 1.0
uniform float u_saturation;  // -1.0 to 1.0

// Color grading (Shadows, Midtones, Highlights)
uniform vec3 u_shadowsGrading;    // rgb multiplier
uniform vec3 u_midtonesGrading;   // rgb multiplier
uniform vec3 u_highlightsGrading; // rgb multiplier
uniform float u_gradingBlending;
uniform float u_gradingBalance;

// Vignette
uniform float u_vignetteAmount;
uniform float u_vignetteMidpoint;
uniform float u_vignetteFeather;

// Local dynamic mask parameters
uniform int u_hasLinearMask;
uniform vec2 u_linearStart;
uniform vec2 u_linearEnd;
uniform int u_linearInvert;

uniform int u_hasRadialMask;
uniform vec2 u_radialCenter;
uniform vec2 u_radialRadius;
uniform float u_radialRotation;
uniform float u_radialFeather;
uniform int u_radialInvert;

uniform float u_maskExposure;
uniform float u_maskContrast;
uniform float u_maskSaturation;
uniform float u_maskTemp;

// Helper: Convert RGB to Luminance (Rec. 709)
float getLuminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Convert Kelvin temp & tint to RGB color multiplier
vec3 getWhiteBalance(float tempNorm, float tintVal) {
  // tempNorm: -1 (2000K cold) to +1 (10000K warm)
  vec3 balance = vec3(1.0);
  if (tempNorm > 0.0) {
    balance.r += tempNorm * 0.45;
    balance.b -= tempNorm * 0.35;
  } else {
    balance.r += tempNorm * 0.35;
    balance.b -= tempNorm * 0.45;
  }
  // Tint: green (-1) to magenta (+1)
  balance.g -= tintVal * 0.30;
  return max(balance, vec3(0.1));
}

// Compute dynamic linear gradient mask weight
float computeLinearWeight(vec2 uv) {
  vec2 dir = u_linearEnd - u_linearStart;
  float lenSq = dot(dir, dir);
  if (lenSq < 0.00001) return 0.0;
  float t = clamp(dot(uv - u_linearStart, dir) / lenSq, 0.0, 1.0);
  float weight = smoothstep(0.0, 1.0, 1.0 - t);
  if (u_linearInvert == 1) weight = 1.0 - weight;
  return weight;
}

// Compute dynamic radial gradient mask weight
float computeRadialWeight(vec2 uv) {
  vec2 d = uv - u_radialCenter;
  // Rotate
  float cosA = cos(u_radialRotation);
  float sinA = sin(u_radialRotation);
  vec2 rotated = vec2(d.x * cosA - d.y * sinA, d.x * sinA + d.y * cosA);
  vec2 scaled = rotated / max(u_radialRadius, vec2(0.001));
  float dist = length(scaled);
  float innerEdge = max(0.0, 1.0 - u_radialFeather);
  float weight = 1.0 - smoothstep(innerEdge, 1.0, dist);
  if (u_radialInvert == 1) weight = 1.0 - weight;
  return clamp(weight, 0.0, 1.0);
}

void main() {
  vec4 rawTex = texture2D(u_image, v_texCoord);
  vec3 origColor = rawTex.rgb;

  // Split view check: right side displays original
  if (u_showOriginalOnly == 1) {
    gl_FragColor = vec4(origColor, rawTex.a);
    return;
  }
  if (u_splitRatio >= 0.0 && u_splitRatio <= 1.0) {
    if (abs(v_texCoord.x - u_splitRatio) < 0.0015) {
      // Split divider line
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      return;
    }
    if (v_texCoord.x > u_splitRatio) {
      gl_FragColor = vec4(origColor, rawTex.a);
      return;
    }
  }

  vec3 color = origColor;

  // 1. Exposure (in EV stops: 2^EV)
  color *= pow(2.0, u_exposure);

  // 2. White Balance (Temp & Tint)
  vec3 wb = getWhiteBalance(u_temp, u_tint);
  color *= wb;

  // 3. Tone Zones: Highlights, Shadows, Whites, Blacks
  float lum = getLuminance(color);

  // Highlights compression/boost
  float hlFactor = smoothstep(0.5, 1.0, lum);
  color += color * (u_highlights * 0.45 * hlFactor);

  // Shadows recovery/crush
  float shFactor = 1.0 - smoothstep(0.0, 0.5, lum);
  color += (1.0 - color) * (u_shadows * 0.45 * shFactor);

  // Whites & Blacks
  float whFactor = smoothstep(0.75, 1.0, lum);
  color += color * (u_whites * 0.35 * whFactor);
  float blFactor = 1.0 - smoothstep(0.0, 0.25, lum);
  color += color * (u_blacks * 0.35 * blFactor);

  // 4. Contrast (S-Curve about 0.18 middle gray)
  if (abs(u_contrast) > 0.001) {
    float c = u_contrast * 0.5;
    color = (color - 0.18) * (1.0 + c) + 0.18;
  }

  // 5. 3-Way Color Grading (Shadows, Midtones, Highlights)
  float gradingLum = clamp(getLuminance(color), 0.0, 1.0);
  float balanceOffset = u_gradingBalance * 0.2;
  float blendZone = max(0.1, u_gradingBlending);

  // Weights for shadows, midtones, highlights
  float shadowWeight = smoothstep(0.5 + balanceOffset, 0.0, gradingLum);
  float highlightWeight = smoothstep(0.5 + balanceOffset, 1.0, gradingLum);
  float midtoneWeight = 1.0 - abs(gradingLum - (0.5 + balanceOffset)) * 2.0;
  midtoneWeight = clamp(midtoneWeight, 0.0, 1.0);

  color += (u_shadowsGrading - 1.0) * shadowWeight * 0.6;
  color += (u_midtonesGrading - 1.0) * midtoneWeight * 0.6;
  color += (u_highlightsGrading - 1.0) * highlightWeight * 0.6;

  // 6. Vibrance & Saturation
  float currentLum = getLuminance(color);
  float maxC = max(color.r, max(color.g, color.b));
  float minC = min(color.r, min(color.g, color.b));
  float sat = (maxC - minC) / max(maxC, 0.0001);

  // Vibrance selectively boosts less-saturated colors
  if (abs(u_vibrance) > 0.001) {
    float vibFactor = (1.0 - sat) * u_vibrance;
    color = mix(vec3(currentLum), color, 1.0 + vibFactor);
  }

  // Uniform Saturation
  if (abs(u_saturation) > 0.001) {
    color = mix(vec3(getLuminance(color)), color, 1.0 + u_saturation);
  }

  // 7. Local Mask Adjustments
  float maskWeight = 0.0;
  if (u_hasMaskTexture == 1) {
    vec4 maskSample = texture2D(u_maskTexture, v_texCoord);
    maskWeight = max(maskWeight, maskSample.r);
  }
  if (u_hasLinearMask == 1) {
    maskWeight = max(maskWeight, computeLinearWeight(v_texCoord));
  }
  if (u_hasRadialMask == 1) {
    maskWeight = max(maskWeight, computeRadialWeight(v_texCoord));
  }

  if (maskWeight > 0.001) {
    // Apply local mask adjustments
    vec3 localColor = color;
    localColor *= pow(2.0, u_maskExposure);
    if (abs(u_maskContrast) > 0.001) {
      localColor = (localColor - 0.18) * (1.0 + u_maskContrast * 0.5) + 0.18;
    }
    if (abs(u_maskSaturation) > 0.001) {
      localColor = mix(vec3(getLuminance(localColor)), localColor, 1.0 + u_maskSaturation);
    }
    vec3 maskWb = getWhiteBalance(u_maskTemp, 0.0);
    localColor *= maskWb;

    color = mix(color, localColor, maskWeight);
  }

  // 8. Vignette
  if (abs(u_vignetteAmount) > 0.01) {
    vec2 coord = (v_texCoord - 0.5) * 2.0;
    float dist = length(coord);
    float mid = u_vignetteMidpoint;
    float feather = max(0.01, u_vignetteFeather);
    float vig = smoothstep(mid - feather, mid + feather, dist);
    float vignetteFactor = 1.0 + (u_vignetteAmount * vig);
    color *= clamp(vignetteFactor, 0.0, 2.0);
  }

  // Clamp output range
  color = clamp(color, 0.0, 1.0);

  // 9. Mask Overlay Preview (translucent ruby tint where mask is active)
  if (u_showMaskOverlay == 1 && maskWeight > 0.01) {
    vec3 rubyColor = vec3(0.95, 0.2, 0.2);
    color = mix(color, rubyColor, maskWeight * 0.5);
  }

  gl_FragColor = vec4(color, rawTex.a);
}
`;

export interface RenderOptions {
  splitRatio?: number; // -1 for off, 0..1 for split
  showOriginalOnly?: boolean;
  showMaskOverlay?: boolean;
  activeMask?: LocalMask | null;
}

export interface HistogramData {
  r: Uint32Array;
  g: Uint32Array;
  b: Uint32Array;
  lum: Uint32Array;
  clippedHighlights: number;
  clippedShadows: number;
  maxCount: number;
}

export class WebGLEngine {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private imageTexture: WebGLTexture | null = null;
  private maskTexture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private imageWidth = 0;
  private imageHeight = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initGL();
  }

  private initGL() {
    const gl =
      this.canvas.getContext('webgl', {
        preserveDrawingBuffer: true,
        antialias: false,
        alpha: false
      }) ||
      (this.canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    this.gl = gl;

    const vs = this.compileShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;

    // Cache uniform locations
    const uniformNames = [
      'u_image',
      'u_maskTexture',
      'u_hasMaskTexture',
      'u_splitRatio',
      'u_showOriginalOnly',
      'u_showMaskOverlay',
      'u_exposure',
      'u_contrast',
      'u_highlights',
      'u_shadows',
      'u_whites',
      'u_blacks',
      'u_temp',
      'u_tint',
      'u_vibrance',
      'u_saturation',
      'u_shadowsGrading',
      'u_midtonesGrading',
      'u_highlightsGrading',
      'u_gradingBlending',
      'u_gradingBalance',
      'u_vignetteAmount',
      'u_vignetteMidpoint',
      'u_vignetteFeather',
      'u_hasLinearMask',
      'u_linearStart',
      'u_linearEnd',
      'u_linearInvert',
      'u_hasRadialMask',
      'u_radialCenter',
      'u_radialRadius',
      'u_radialRotation',
      'u_radialFeather',
      'u_radialInvert',
      'u_maskExposure',
      'u_maskContrast',
      'u_maskSaturation',
      'u_maskTemp'
    ];

    uniformNames.forEach((name) => {
      this.uniformLocations[name] = gl.getUniformLocation(program, name);
    });

    // Vertex positions quad
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
      ]),
      gl.STATIC_DRAW
    );

    // Texture coords quad (Y flipped for WebGL texture orientation)
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0
      ]),
      gl.STATIC_DRAW
    );
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public setImage(imageSource: TexImageSource, width: number, height: number) {
    const gl = this.gl;
    if (!gl) return;
    this.imageWidth = width;
    this.imageHeight = height;

    if (!this.imageTexture) {
      this.imageTexture = gl.createTexture();
    }

    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageSource);
  }

  public updateBrushMask(canvasSource: HTMLCanvasElement | null) {
    const gl = this.gl;
    if (!gl) return;

    if (!canvasSource) {
      if (this.maskTexture) {
        gl.deleteTexture(this.maskTexture);
        this.maskTexture = null;
      }
      return;
    }

    if (!this.maskTexture) {
      this.maskTexture = gl.createTexture();
    }
    gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasSource);
  }

  // Convert grading hue/sat/lum to RGB multipliers
  private colorGradingToRGB(hue: number, sat: number, lum: number): [number, number, number] {
    const s = sat / 100;
    const l = lum / 100;
    const hRad = (hue * Math.PI) / 180;
    // Tint offsets
    const r = 1.0 + Math.cos(hRad) * s * 0.8 + l * 0.5;
    const g = 1.0 + Math.cos(hRad - (2 * Math.PI) / 3) * s * 0.8 + l * 0.5;
    const b = 1.0 + Math.cos(hRad + (2 * Math.PI) / 3) * s * 0.8 + l * 0.5;
    return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
  }

  public render(adjustments: PhotoAdjustments, options: RenderOptions = {}) {
    const gl = this.gl;
    if (!gl || !this.program || !this.imageTexture) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    // Bind image texture (unit 0)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
    gl.uniform1i(this.uniformLocations['u_image'], 0);

    // Bind mask texture if available (unit 1)
    if (this.maskTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
      gl.uniform1i(this.uniformLocations['u_maskTexture'], 1);
      gl.uniform1i(this.uniformLocations['u_hasMaskTexture'], 1);
    } else {
      gl.uniform1i(this.uniformLocations['u_hasMaskTexture'], 0);
    }

    // Split & compare uniforms
    gl.uniform1f(this.uniformLocations['u_splitRatio'], options.splitRatio ?? -1.0);
    gl.uniform1i(this.uniformLocations['u_showOriginalOnly'], options.showOriginalOnly ? 1 : 0);
    gl.uniform1i(this.uniformLocations['u_showMaskOverlay'], options.showMaskOverlay ? 1 : 0);

    // Basic Tone
    gl.uniform1f(this.uniformLocations['u_exposure'], adjustments.exposure);
    gl.uniform1f(this.uniformLocations['u_contrast'], adjustments.contrast / 100);
    gl.uniform1f(this.uniformLocations['u_highlights'], adjustments.highlights / 100);
    gl.uniform1f(this.uniformLocations['u_shadows'], adjustments.shadows / 100);
    gl.uniform1f(this.uniformLocations['u_whites'], adjustments.whites / 100);
    gl.uniform1f(this.uniformLocations['u_blacks'], adjustments.blacks / 100);

    // White Balance & Presence
    // Kelvin 2000 to 10000 -> normalized offset around 5500
    const tempNorm = (adjustments.temp - 5500) / 4500;
    gl.uniform1f(this.uniformLocations['u_temp'], tempNorm);
    gl.uniform1f(this.uniformLocations['u_tint'], adjustments.tint / 100);
    gl.uniform1f(this.uniformLocations['u_vibrance'], adjustments.vibrance / 100);
    gl.uniform1f(this.uniformLocations['u_saturation'], adjustments.saturation / 100);

    // Color Grading
    const cg = adjustments.colorGrading;
    const [sr, sg, sb] = this.colorGradingToRGB(cg.shadows.hue, cg.shadows.sat, cg.shadows.lum);
    const [mr, mg, mb] = this.colorGradingToRGB(cg.midtones.hue, cg.midtones.sat, cg.midtones.lum);
    const [hr, hg, hb] = this.colorGradingToRGB(cg.highlights.hue, cg.highlights.sat, cg.highlights.lum);

    gl.uniform3f(this.uniformLocations['u_shadowsGrading'], sr, sg, sb);
    gl.uniform3f(this.uniformLocations['u_midtonesGrading'], mr, mg, mb);
    gl.uniform3f(this.uniformLocations['u_highlightsGrading'], hr, hg, hb);
    gl.uniform1f(this.uniformLocations['u_gradingBlending'], cg.blending / 100);
    gl.uniform1f(this.uniformLocations['u_gradingBalance'], cg.balance / 100);

    // Vignette
    gl.uniform1f(this.uniformLocations['u_vignetteAmount'], adjustments.vignette.amount / 100);
    gl.uniform1f(this.uniformLocations['u_vignetteMidpoint'], adjustments.vignette.midpoint / 100);
    gl.uniform1f(this.uniformLocations['u_vignetteFeather'], adjustments.vignette.feather / 100);

    // Active Mask parameters
    const activeMask = options.activeMask;
    if (activeMask && activeMask.enabled) {
      gl.uniform1f(this.uniformLocations['u_maskExposure'], activeMask.adjustments.exposure);
      gl.uniform1f(this.uniformLocations['u_maskContrast'], activeMask.adjustments.contrast / 100);
      gl.uniform1f(this.uniformLocations['u_maskSaturation'], activeMask.adjustments.saturation / 100);
      gl.uniform1f(this.uniformLocations['u_maskTemp'], activeMask.adjustments.temp / 100);

      if (activeMask.type === 'linear_gradient' && activeMask.linearGradient) {
        gl.uniform1i(this.uniformLocations['u_hasLinearMask'], 1);
        gl.uniform2f(
          this.uniformLocations['u_linearStart'],
          activeMask.linearGradient.startX,
          activeMask.linearGradient.startY
        );
        gl.uniform2f(
          this.uniformLocations['u_linearEnd'],
          activeMask.linearGradient.endX,
          activeMask.linearGradient.endY
        );
        gl.uniform1i(this.uniformLocations['u_linearInvert'], activeMask.inverted ? 1 : 0);
      } else {
        gl.uniform1i(this.uniformLocations['u_hasLinearMask'], 0);
      }

      if (activeMask.type === 'radial_gradient' && activeMask.radialGradient) {
        gl.uniform1i(this.uniformLocations['u_hasRadialMask'], 1);
        gl.uniform2f(
          this.uniformLocations['u_radialCenter'],
          activeMask.radialGradient.centerX,
          activeMask.radialGradient.centerY
        );
        gl.uniform2f(
          this.uniformLocations['u_radialRadius'],
          activeMask.radialGradient.radiusX,
          activeMask.radialGradient.radiusY
        );
        gl.uniform1f(this.uniformLocations['u_radialRotation'], activeMask.radialGradient.rotation);
        gl.uniform1f(this.uniformLocations['u_radialFeather'], activeMask.radialGradient.feather);
        gl.uniform1i(this.uniformLocations['u_radialInvert'], activeMask.inverted ? 1 : 0);
      } else {
        gl.uniform1i(this.uniformLocations['u_hasRadialMask'], 0);
      }
    } else {
      gl.uniform1i(this.uniformLocations['u_hasLinearMask'], 0);
      gl.uniform1i(this.uniformLocations['u_hasRadialMask'], 0);
      gl.uniform1f(this.uniformLocations['u_maskExposure'], 0);
      gl.uniform1f(this.uniformLocations['u_maskContrast'], 0);
      gl.uniform1f(this.uniformLocations['u_maskSaturation'], 0);
      gl.uniform1f(this.uniformLocations['u_maskTemp'], 0);
    }

    // Bind Quad Attributes
    const aPosition = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const aTexCoord = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // Calculate live histogram data
  public computeHistogram(): HistogramData {
    const gl = this.gl;
    const rBins = new Uint32Array(256);
    const gBins = new Uint32Array(256);
    const bBins = new Uint32Array(256);
    const lumBins = new Uint32Array(256);

    if (!gl) {
      return {
        r: rBins,
        g: gBins,
        b: bBins,
        lum: lumBins,
        clippedHighlights: 0,
        clippedShadows: 0,
        maxCount: 1
      };
    }

    // Sample pixels from rendered canvas
    const sampleWidth = Math.min(this.canvas.width, 256);
    const sampleHeight = Math.min(this.canvas.height, 256);
    const pixelData = new Uint8Array(sampleWidth * sampleHeight * 4);

    gl.readPixels(0, 0, sampleWidth, sampleHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

    let clippedHighlights = 0;
    let clippedShadows = 0;
    let maxCount = 0;

    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      rBins[r]++;
      gBins[g]++;
      bBins[b]++;
      lumBins[lum]++;

      if (r > 252 && g > 252 && b > 252) clippedHighlights++;
      if (r < 4 && g < 4 && b < 4) clippedShadows++;

      if (lumBins[lum] > maxCount) maxCount = lumBins[lum];
    }

    return {
      r: rBins,
      g: gBins,
      b: bBins,
      lum: lumBins,
      clippedHighlights,
      clippedShadows,
      maxCount: Math.max(1, maxCount)
    };
  }

  // Render to a full-resolution offscreen canvas and export as Blob
  public exportBlob(
    adjustments: PhotoAdjustments,
    width: number,
    height: number,
    format: 'image/jpeg' | 'image/png',
    quality = 0.95
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = width;
      exportCanvas.height = height;

      const exportEngine = new WebGLEngine(exportCanvas);
      if (this.imageTexture && this.gl) {
        // Read original image back or re-render
        exportEngine.setImage(this.canvas, width, height);
      }
      exportEngine.render(adjustments, { splitRatio: -1 });

      exportCanvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        format,
        quality
      );
    });
  }

  public destroy() {
    const gl = this.gl;
    if (!gl) return;
    if (this.imageTexture) gl.deleteTexture(this.imageTexture);
    if (this.maskTexture) gl.deleteTexture(this.maskTexture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    if (this.program) gl.deleteProgram(this.program);
    this.gl = null;
  }
}
