import {
  ShaderMaterial,
  Color,
  Vector2,
  UniformsUtils,
  UniformsLib,
} from 'three';
import { createPermTexture, noisejsPerlin2 } from '../boardNoise';
import props from '../props';

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

varying vec3 vNormal;
varying vec3 vViewPosition;
varying float vElevation;

#include <common>
#include <shadowmap_pars_vertex>

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

vec3 getDisplacedLocalPosition(vec2 localXY) {
  vec3 pos = vec3(localXY.x, localXY.y, 0.0);
  vec2 worldXZ = vec2(pos.x, -pos.y);
  vec2 grid = worldXZ + uBoardOffset - vec2(0.0, uScrollZ);
  float elevation = getElevation(grid) * 0.5;
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
  constructor() {
    super({
      lights: true,
      uniforms: UniformsUtils.merge([
        UniformsLib.lights,
        {
          uPerm: { value: createPermTexture() },
          uColor: { value: new Color(props.bgColor) },
          uNoiseOffset: { value: new Vector2(props.noiseX, props.noiseY) },
          uNoiseScale: { value: new Vector2(props.noiseScaleX, props.noiseScaleY) },
          uNoiseAmpl: { value: props.noiseAmpl },
          uNoisePathElevation: { value: props.noisePathElevation },
          uPathX: { value: Math.floor(props.boardWidth / 2) },
          uBoardOffset: {
            value: new Vector2(props.boardWidth * 0.5, props.boardHeight * 0.5),
          },
          uScrollZ: { value: 0 },
          uPathY: { value: 0 },
        },
      ]),
      vertexShader,
      fragmentShader,
    });
  }

  syncFromProps() {
    this.uniforms.uColor.value.set(props.bgColor);
    this.uniforms.uNoiseOffset.value.set(props.noiseX, props.noiseY);
    this.uniforms.uNoiseScale.value.set(props.noiseScaleX, props.noiseScaleY);
    this.uniforms.uNoiseAmpl.value = props.noiseAmpl;
    this.uniforms.uNoisePathElevation.value = props.noisePathElevation;
  }

  setScrollZ(z) {
    this.uniforms.uScrollZ.value = z;
  }

  setPathY(y) {
    this.uniforms.uPathY.value = y;
  }
}
