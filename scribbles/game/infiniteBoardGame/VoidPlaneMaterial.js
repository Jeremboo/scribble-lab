import {
  ShaderMaterial,
  Vector2,
} from 'three';
import { createPermTexture } from './boardNoise';
import { voidDisplaceGlsl } from './voidElevation';
import props from './props';

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
uniform float uFrontY;
uniform float uWakeHeight;
uniform float uWakeSpread;
uniform float uWakeRise;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDead;
varying vec2 vGrid;

#include <common>

${voidDisplaceGlsl}

void main() {
  vec3 pos = voidDisplaced(position.xy);
  vDead = gInfluence;
  vGrid = gGrid;

  float eps = 0.2;
  vec3 pL = voidDisplaced(position.xy + vec2(-eps, 0.0));
  vec3 pR = voidDisplaced(position.xy + vec2(eps, 0.0));
  vec3 pD = voidDisplaced(position.xy + vec2(0.0, -eps));
  vec3 pU = voidDisplaced(position.xy + vec2(0.0, eps));

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vec3 wL = (modelMatrix * vec4(pL, 1.0)).xyz;
  vec3 wR = (modelMatrix * vec4(pR, 1.0)).xyz;
  vec3 wD = (modelMatrix * vec4(pD, 1.0)).xyz;
  vec3 wU = (modelMatrix * vec4(pU, 1.0)).xyz;
  vec3 worldNormal = normalize(cross(wR - wL, wU - wD));

  vNormal = normalize((viewMatrix * vec4(worldNormal, 0.0)).xyz);

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float uVoidCutoff;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vDead;
varying vec2 vGrid;

void main() {
  if (vDead < uVoidCutoff) discard;

  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  float ndv = clamp(abs(dot(normal, viewDir)), 0.0, 1.0);
  float slope = pow(1.0 - ndv, 0.75);
  float fresnel = pow(1.0 - ndv, 2.2);

  // Slopes keep a cold trace so the swell reads. Camera-facing pit stays black.
  vec3 slopeTint = vec3(0.045, 0.014, 0.09);
  vec3 rim = vec3(0.2, 0.07, 0.38);
  float lip = smoothstep(uVoidCutoff, 0.34, vDead) * (1.0 - smoothstep(0.72, 1.0, vDead));
  vec3 color = slopeTint * slope;
  color += rim * fresnel * mix(0.25, 1.0, lip);

  float speck = fract(sin(dot(floor(vGrid * 9.0), vec2(127.1, 311.7))) * 43758.5453);
  float star = smoothstep(0.988, 1.0, speck) * fresnel * (1.0 - smoothstep(0.25, 0.8, vDead));
  color += vec3(0.62, 0.7, 0.95) * star * 0.18;

  float absorb = smoothstep(0.55, 1.0, vDead) * ndv;
  color = mix(color, vec3(0.0), absorb);

  gl_FragColor = vec4(color, 1.0);
}
`;

export default class VoidPlaneMaterial extends ShaderMaterial {
  /**
   * @param {number} tileZ
   * @param {import('./VoidField').default} field
   * @param {{ value: number }} frontUniform
   */
  constructor(tileZ, field, frontUniform) {
    super({
      uniforms: {
        uPerm: { value: createPermTexture() },
        uDead: field.deadUniform,
        uDeadSize: { value: field.size },
        uBoardWidth: { value: field.boardWidth },
        uNoiseOffset: { value: new Vector2(props.noiseX, props.noiseY) },
        uNoiseScale: { value: new Vector2(props.noiseScaleX, props.noiseScaleY) },
        uNoiseAmpl: { value: props.noiseAmpl },
        uNoisePathElevation: { value: props.noisePathElevation },
        uPathX: { value: Math.floor(props.boardWidth / 2) },
        uBoardOffset: {
          value: new Vector2(props.boardWidth * 0.5, props.boardHeight * 0.5),
        },
        uTileZ: { value: tileZ },
        uPathY: { value: 0 },
        uBoardHalfWidth: { value: props.boardWidth * 0.5 },
        uCurveHeightLeft: { value: props.groundCurveHeightLeft },
        uCurveHeightRight: { value: props.groundCurveHeightRight },
        uCurveRadiusLeft: { value: props.groundCurveRadiusLeft },
        uCurveRadiusRight: { value: props.groundCurveRadiusRight },
        uNoiseAmplSideLeft: { value: props.groundNoiseAmplSideLeft },
        uNoiseAmplSideRight: { value: props.groundNoiseAmplSideRight },
        uHillNoiseOffset: { value: new Vector2(props.hillNoiseX, props.hillNoiseY) },
        uHillNoiseScale: { value: new Vector2(props.hillNoiseScaleX, props.hillNoiseScaleY) },
        uHillNoiseAmpl: { value: props.hillNoiseAmpl },
        uVoidHeight: { value: props.voidHeight },
        uVoidRadius: { value: props.voidRadius },
        uFrontY: frontUniform,
        uWakeHeight: { value: props.voidWakeHeight },
        uWakeSpread: { value: props.voidWakeSpread },
        uWakeRise: { value: props.voidWakeRise },
        uVoidCutoff: { value: 0.07 },
      },
      vertexShader,
      fragmentShader,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  syncFromProps() {
    this.uniforms.uNoiseOffset.value.set(props.noiseX, props.noiseY);
    this.uniforms.uNoiseScale.value.set(props.noiseScaleX, props.noiseScaleY);
    this.uniforms.uNoiseAmpl.value = props.noiseAmpl;
    this.uniforms.uNoisePathElevation.value = props.noisePathElevation;
    this.uniforms.uCurveHeightLeft.value = props.groundCurveHeightLeft;
    this.uniforms.uCurveHeightRight.value = props.groundCurveHeightRight;
    this.uniforms.uCurveRadiusLeft.value = props.groundCurveRadiusLeft;
    this.uniforms.uCurveRadiusRight.value = props.groundCurveRadiusRight;
    this.uniforms.uNoiseAmplSideLeft.value = props.groundNoiseAmplSideLeft;
    this.uniforms.uNoiseAmplSideRight.value = props.groundNoiseAmplSideRight;
    this.uniforms.uHillNoiseOffset.value.set(props.hillNoiseX, props.hillNoiseY);
    this.uniforms.uHillNoiseScale.value.set(props.hillNoiseScaleX, props.hillNoiseScaleY);
    this.uniforms.uHillNoiseAmpl.value = props.hillNoiseAmpl;
    this.uniforms.uVoidHeight.value = props.voidHeight;
    this.uniforms.uVoidRadius.value = props.voidRadius;
    this.uniforms.uWakeHeight.value = props.voidWakeHeight;
    this.uniforms.uWakeSpread.value = props.voidWakeSpread;
    this.uniforms.uWakeRise.value = props.voidWakeRise;
  }

  setPathY(y) {
    this.uniforms.uPathY.value = y;
  }
}
