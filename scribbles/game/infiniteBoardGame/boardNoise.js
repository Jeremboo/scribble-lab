import { Noise } from 'noisejs';
import {
  DataTexture,
  LuminanceFormat,
  NearestFilter,
  UnsignedByteType,
  ClampToEdgeWrapping,
} from 'three';

// Fixed seed so JS + GLSL share the same permutation table
export const boardNoise = new Noise(0);

export function createPermTexture() {
  const data = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    data[i] = boardNoise.perm[i];
  }
  const texture = new DataTexture(data, 512, 1, LuminanceFormat, UnsignedByteType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * GLSL port of noisejs perlin2 (seed 0).
 * Requires uniform sampler2D uPerm (512x1 luminance from createPermTexture).
 */
export const noisejsPerlin2 = `
float noisejsFade(float t) {
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float noisejsPerm(float i) {
  return floor(texture2D(uPerm, vec2((i + 0.5) / 512.0, 0.5)).r * 255.0 + 0.5);
}

vec2 noisejsGrad2(float hash) {
  float idx = floor(mod(hash, 12.0));
  if (idx < 0.5) return vec2(1.0, 1.0);
  if (idx < 1.5) return vec2(-1.0, 1.0);
  if (idx < 2.5) return vec2(1.0, -1.0);
  if (idx < 3.5) return vec2(-1.0, -1.0);
  if (idx < 4.5) return vec2(1.0, 0.0);
  if (idx < 5.5) return vec2(-1.0, 0.0);
  if (idx < 6.5) return vec2(1.0, 0.0);
  if (idx < 7.5) return vec2(-1.0, 0.0);
  if (idx < 8.5) return vec2(0.0, 1.0);
  if (idx < 9.5) return vec2(0.0, -1.0);
  if (idx < 10.5) return vec2(0.0, 1.0);
  return vec2(0.0, -1.0);
}

float noisejsPerlin2(vec2 p) {
  float X = floor(p.x);
  float Y = floor(p.y);
  float x = p.x - X;
  float y = p.y - Y;
  X = mod(X, 256.0);
  Y = mod(Y, 256.0);

  float pY = noisejsPerm(Y);
  float pY1 = noisejsPerm(Y + 1.0);

  float n00 = dot(noisejsGrad2(noisejsPerm(X + pY)), vec2(x, y));
  float n01 = dot(noisejsGrad2(noisejsPerm(X + pY1)), vec2(x, y - 1.0));
  float n10 = dot(noisejsGrad2(noisejsPerm(X + 1.0 + pY)), vec2(x - 1.0, y));
  float n11 = dot(noisejsGrad2(noisejsPerm(X + 1.0 + pY1)), vec2(x - 1.0, y - 1.0));

  float u = noisejsFade(x);
  float v = noisejsFade(y);
  return mix(mix(n00, n10, u), mix(n01, n11, u), v);
}
`;
