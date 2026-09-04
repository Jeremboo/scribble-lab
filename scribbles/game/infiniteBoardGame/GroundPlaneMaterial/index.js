import {
  ShaderMaterial,
  Color,
  Vector2,
  UniformsUtils,
  UniformsLib,
} from 'three';
import gsap from 'gsap';
import { createPermTexture, groundElevationGlsl } from '../boardNoise';
import props from '../props';

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

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vElevation;

#include <common>
#include <shadowmap_pars_vertex>

${groundElevationGlsl}

vec3 getDisplacedLocalPosition(vec2 localXY) {
  vec3 pos = vec3(localXY.x, localXY.y, 0.0);
  vec2 worldXZ = vec2(pos.x, -pos.y);
  // Tile center is baked into noise so adjacent tiles share seamless coordinates
  vec2 grid = worldXZ + uBoardOffset + vec2(0.0, uTileZ);
  float elevation = getGroundElevation(grid) * 0.5;
  pos.z += elevation;
  return pos;
}

void main() {
  // Plane rotated -PI/2 on X: local (x, y, z) → world (x, z, -y)
  vec3 pos = getDisplacedLocalPosition(position.xy);
  vElevation = pos.z;

  // World-space normal from heightfield neighbors
  float eps = 0.4;
  vec3 pL = getDisplacedLocalPosition(position.xy + vec2(-eps, 0.0));
  vec3 pR = getDisplacedLocalPosition(position.xy + vec2(eps, 0.0));
  vec3 pD = getDisplacedLocalPosition(position.xy + vec2(0.0, -eps));
  vec3 pU = getDisplacedLocalPosition(position.xy + vec2(0.0, eps));

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

  #include <shadowmap_vertex>
}
`;

const fragmentShader = `
uniform vec3 uColor;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vElevation;

#include <common>
#include <packing>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

float toonStep(float NdotL) {
  if (NdotL > 0.6) return 1.0;
  if (NdotL > 0.2) return 0.65;
  if (NdotL > 0.0) return 0.4;
  return 0.25;
}

void main() {
  vec3 normal = normalize(vNormal);
  float shadow = getShadowMask();

  vec3 lighting = ambientLightColor;

  #if (NUM_DIR_LIGHTS > 0)
    DirectionalLight directionalLight = directionalLights[0];
    float NdotL = dot(normal, directionalLight.direction);
    lighting += directionalLight.color * toonStep(NdotL) * shadow;
  #endif

  // Keep a bit of elevation read even in shadow
  float elevShade = 1.0 - smoothstep(0.0, 3.0, vElevation) * 0.15;
  vec3 color = uColor * lighting * elevShade;

  gl_FragColor = vec4(color, 1.0);
}
`;

export default class GroundPlaneMaterial extends ShaderMaterial {
  constructor(tileZ = 0) {
    super({
      lights: true,
      uniforms: UniformsUtils.merge([
        UniformsLib.lights,
        {
          uPerm: { value: createPermTexture() },
          uColor: { value: new Color(props.bgColors[0]) },
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
        },
      ]),
      vertexShader,
      fragmentShader,
    });
  }

  syncFromProps() {
    gsap.killTweensOf(this._bgColorTween);
    this.uniforms.uColor.value.set(props.bgColors[0]);
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
  }

  setPathY(y) {
    this.uniforms.uPathY.value = y;
  }

  setBgColor(color, duration = 1) {
    gsap.killTweensOf(this._bgColorTween);
    if (duration <= 0) {
      this.uniforms.uColor.value.set(color);
      return;
    }
    this._bgColorTween = { color: '#' + this.uniforms.uColor.value.getHexString() };
    gsap.to(this._bgColorTween, {
      color,
      duration,
      onUpdate: () => {
        this.uniforms.uColor.value.set(this._bgColorTween.color);
      },
    });
  }
}
