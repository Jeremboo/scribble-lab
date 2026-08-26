import { ShaderMaterial } from 'three';
import { noisejsPerlin2 } from './boardNoise';
import surfaceFrag from '../../../modules/Three/OutlinePass/SurfaceMaterial/frag.glsl';

const vertexShader = `
uniform sampler2D uPerm;
uniform vec2 uNoiseOffset;
uniform vec2 uNoiseScale;
uniform float uNoiseAmpl;
uniform float uNoisePathElevation;
uniform float uPathX;
uniform vec2 uBoardOffset;
uniform float uScrollZ;
uniform float uPathY;

attribute float surfaceId;
varying float vSurfaceId;

${noisejsPerlin2}

float getElevation(vec2 grid) {
  float noiseElevation = abs(noisejsPerlin2(
    vec2(
      (uNoiseOffset.x + grid.x) * uNoiseScale.x,
      (uNoiseOffset.y + grid.y + uPathY) * uNoiseScale.y
    )
  )) * uNoiseAmpl;

  float pathElevation = uNoisePathElevation - abs(grid.x - uPathX) * uNoisePathElevation;
  float starterElevation = 0.25 + min(1.0, max(0.0, grid.y) / 3.0);

  return max(0.0, (noiseElevation + pathElevation) * starterElevation);
}

void main() {
  vec3 pos = position;
  vec2 worldXZ = vec2(pos.x, -pos.y);
  vec2 grid = worldXZ + uBoardOffset - vec2(0.0, uScrollZ);
  pos.z += getElevation(grid) * 0.5;

  vSurfaceId = surfaceId;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

/**
 * Surface-ID material for OutlinePass that applies the same noise
 * displacement as GroundPlaneMaterial, so outlines match the visible mesh.
 */
export default class GroundSurfaceMaterial extends ShaderMaterial {
  constructor(groundUniforms) {
    super({
      defines: {
        DEBUG_MODE: 0,
      },
      uniforms: {
        uPerm: groundUniforms.uPerm,
        uNoiseOffset: groundUniforms.uNoiseOffset,
        uNoiseScale: groundUniforms.uNoiseScale,
        uNoiseAmpl: groundUniforms.uNoiseAmpl,
        uNoisePathElevation: groundUniforms.uNoisePathElevation,
        uPathX: groundUniforms.uPathX,
        uBoardOffset: groundUniforms.uBoardOffset,
        uScrollZ: groundUniforms.uScrollZ,
        uPathY: groundUniforms.uPathY,
        maxSurfaceId: { value: 1 },
      },
      vertexShader,
      fragmentShader: surfaceFrag,
    });
  }

  setDebugMode(isEnabled) {
    this.defines.DEBUG_MODE = isEnabled ? 1 : 0;
    this.needsUpdate = true;
  }
}
