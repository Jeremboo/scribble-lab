import { ShaderMaterial } from 'three';
import { voidDisplaceGlsl } from './voidElevation';

const vertexShader = `
uniform sampler2D uPerm;
uniform sampler2D uDead;
uniform vec2 uDeadSize;
uniform float uBoardWidth;
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
uniform float uVoidHeight;
uniform float uVoidRadius;

attribute float surfaceId;
varying float vSurfaceId;
varying float vDead;

${voidDisplaceGlsl}

void main() {
  vec3 pos = voidDisplaced(position.xy);
  vDead = gInfluence;
  vSurfaceId = surfaceId;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const fragmentShader = `
uniform float uVoidCutoff;
uniform float maxSurfaceId;

varying float vSurfaceId;
varying float vDead;

void main() {
  if (vDead < uVoidCutoff) discard;
  if (vSurfaceId == 0.0) discard;

  float surfaceId = floor(vSurfaceId + 0.5);
  gl_FragColor = vec4(surfaceId, 0.0, 0.0, 1.0);

  if (DEBUG_MODE == 0) return;
  int surfaceIdInt = int(floor(vSurfaceId) * 100.0);
  float R = mod(float(surfaceIdInt), 255.0) / 255.0;
  float G = mod(float((surfaceIdInt + 50)), 255.0) / 255.0;
  float B = mod(float((surfaceIdInt * 20)), 255.0) / 255.0;
  gl_FragColor = vec4(R, G, B, 1.0);
}
`;

/**
 * Outline surface pass for the void. Same swell as the visible material,
 * discarded where the void is invisible so cell outlines stay absorbed
 * only under the mound.
 */
export default class VoidSurfaceMaterial extends ShaderMaterial {
  constructor(voidUniforms) {
    super({
      defines: {
        DEBUG_MODE: 0,
      },
      uniforms: {
        uPerm: voidUniforms.uPerm,
        uDead: voidUniforms.uDead,
        uDeadSize: voidUniforms.uDeadSize,
        uBoardWidth: voidUniforms.uBoardWidth,
        uNoiseOffset: voidUniforms.uNoiseOffset,
        uNoiseScale: voidUniforms.uNoiseScale,
        uNoiseAmpl: voidUniforms.uNoiseAmpl,
        uNoisePathElevation: voidUniforms.uNoisePathElevation,
        uPathX: voidUniforms.uPathX,
        uBoardOffset: voidUniforms.uBoardOffset,
        uTileZ: voidUniforms.uTileZ,
        uPathY: voidUniforms.uPathY,
        uBoardHalfWidth: voidUniforms.uBoardHalfWidth,
        uCurveHeightLeft: voidUniforms.uCurveHeightLeft,
        uCurveHeightRight: voidUniforms.uCurveHeightRight,
        uCurveRadiusLeft: voidUniforms.uCurveRadiusLeft,
        uCurveRadiusRight: voidUniforms.uCurveRadiusRight,
        uNoiseAmplSideLeft: voidUniforms.uNoiseAmplSideLeft,
        uNoiseAmplSideRight: voidUniforms.uNoiseAmplSideRight,
        uHillNoiseOffset: voidUniforms.uHillNoiseOffset,
        uHillNoiseScale: voidUniforms.uHillNoiseScale,
        uHillNoiseAmpl: voidUniforms.uHillNoiseAmpl,
        uVoidHeight: voidUniforms.uVoidHeight,
        uVoidRadius: voidUniforms.uVoidRadius,
        uVoidCutoff: voidUniforms.uVoidCutoff,
        maxSurfaceId: { value: 1 },
      },
      vertexShader,
      fragmentShader,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  setDebugMode(isEnabled) {
    this.defines.DEBUG_MODE = isEnabled ? 1 : 0;
    this.needsUpdate = true;
  }
}
