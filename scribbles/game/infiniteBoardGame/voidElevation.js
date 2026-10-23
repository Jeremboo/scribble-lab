import { groundElevationGlsl } from './boardNoise';

/**
 * Dead-cell swell on top of the ground heightfield.
 * Cell centers sit on integer grid coordinates (same space as Ground).
 * Uniforms are declared by the materials that include this chunk.
 */
export const voidDisplaceGlsl = `
${groundElevationGlsl}

float gInfluence;
vec2 gGrid;

float sampleDead(vec2 cell) {
  vec2 uv = (floor(cell) + 0.5) / uDeadSize;
  float inside = step(0.0, cell.x) * step(cell.x, uBoardWidth - 0.001);
  inside *= step(0.0, cell.y) * step(cell.y, uDeadSize.y - 0.001);
  return texture2D(uDead, clamp(uv, vec2(0.001), vec2(0.999))).r * inside;
}

float deadInfluence(vec2 grid) {
  vec2 origin = floor(grid + 0.5);
  float radius = max(uVoidRadius, 0.001);
  float inner = radius * 0.22;
  float influence = 0.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 cell = origin + vec2(float(i), float(j));
      float dead = sampleDead(cell);
      float dist = length(grid - cell);
      float falloff = 1.0 - smoothstep(inner, radius, dist);
      influence += dead * falloff;
    }
  }
  return clamp(influence, 0.0, 1.0);
}

float wakeInfluence(vec2 grid) {
  float behind = uFrontY - grid.y;
  float front = smoothstep(0.15, 3.8, behind);
  float dist = abs(grid.x - uPathX);
  float reach = uBoardHalfWidth + max(behind, 0.0) * uWakeSpread;
  float lateral = 1.0 - smoothstep(reach * 0.42, reach, dist);
  float wake = front * lateral;
  float edge = noisejsPerlin2(grid * vec2(0.31, 0.24));
  wake += edge * 0.16 * (1.0 - smoothstep(0.4, 0.95, wake));
  return clamp(wake, 0.0, 1.0);
}

vec3 voidDisplaced(vec2 localXY) {
  vec3 pos = vec3(localXY.x, localXY.y, 0.0);
  vec2 worldXZ = vec2(pos.x, -pos.y);
  vec2 grid = worldXZ + uBoardOffset + vec2(0.0, uTileZ);
  gGrid = grid;

  float dead = 0.0;
  if (abs(grid.x - uPathX) < uBoardHalfWidth + uVoidRadius + 2.0) {
    dead = deadInfluence(grid);
  }
  float wake = wakeInfluence(grid);
  gInfluence = max(dead, wake);

  float behind = max(uFrontY - grid.y, 0.0);
  float rise = smoothstep(0.0, max(uWakeRise, 0.001), behind);
  float swell = noisejsPerlin2(grid * vec2(0.17, 0.13));
  float mound = dead * uVoidHeight;
  float blanket = wake * uVoidHeight * (mix(0.7, uWakeHeight, rise) + behind * 0.045);
  pos.z += getGroundElevation(grid) * 0.5 + max(mound, blanket) * (1.0 + swell * 0.12);
  return pos;
}
`;
