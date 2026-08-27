import { ShaderMaterial } from 'three';
import { groundElevationGlsl } from './boardNoise';
import surfaceFrag from '../../../modules/Three/OutlinePass/SurfaceMaterial/frag.glsl';

const vertexShader = `
uniform sampler2D uPerm;
uniform vec2 uNoiseOffset;
uniform vec2 uNoiseScale;
uniform float uNoiseAmpl;
uniform float uNoisePathElevation;
uniform float uPathX;
uniform vec2 uBoardOffset;
uniform float uTileZ;
uniform float uPathY;
uniform float uBoardHalfWidth;
uniform float uCurveHeightLeft;
uniform float uCurveHeightRight;
uniform float uCurveRadiusLeft;
uniform float uCurveRadiusRight;
uniform float uNoiseAmplSideLeft;
uniform float uNoiseAmplSideRight;
uniform vec2 uHillNoiseOffset;
uniform vec2 uHillNoiseScale;
uniform float uHillNoiseAmpl;

attribute float surfaceId;
varying float vSurfaceId;

${groundElevationGlsl}

void main() {
  vec3 pos = position;
  vec2 worldXZ = vec2(pos.x, -pos.y);
  vec2 grid = worldXZ + uBoardOffset + vec2(0.0, uTileZ);
  pos.z += getGroundElevation(grid) * 0.5;

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
        uTileZ: groundUniforms.uTileZ,
        uPathY: groundUniforms.uPathY,
        uBoardHalfWidth: groundUniforms.uBoardHalfWidth,
        uCurveHeightLeft: groundUniforms.uCurveHeightLeft,
        uCurveHeightRight: groundUniforms.uCurveHeightRight,
        uCurveRadiusLeft: groundUniforms.uCurveRadiusLeft,
        uCurveRadiusRight: groundUniforms.uCurveRadiusRight,
        uNoiseAmplSideLeft: groundUniforms.uNoiseAmplSideLeft,
        uNoiseAmplSideRight: groundUniforms.uNoiseAmplSideRight,
        uHillNoiseOffset: groundUniforms.uHillNoiseOffset,
        uHillNoiseScale: groundUniforms.uHillNoiseScale,
        uHillNoiseAmpl: groundUniforms.uHillNoiseAmpl,
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
