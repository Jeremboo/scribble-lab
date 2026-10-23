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

vec3 voidDisplaced(vec2 localXY) {
  vec3 pos = vec3(localXY.x, localXY.y, 0.0);
  vec2 worldXZ = vec2(pos.x, -pos.y);
  vec2 grid = worldXZ + uBoardOffset + vec2(0.0, uTileZ);
  gGrid = grid;
  gInfluence = deadInfluence(grid);
  float swell = noisejsPerlin2(grid * vec2(0.73, 0.81));
  pos.z += getGroundElevation(grid) * 0.5 + gInfluence * uVoidHeight * (1.0 + swell * 0.1);
  return pos;
}
`;
