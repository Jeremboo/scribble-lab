import { classicNoise2D } from '../../../modules/utils.glsl';

export const vert = `
varying vec2 vUv;

uniform float timer;
uniform float perlinDimension;
uniform float perlinForce;
uniform float perlinTransition;

uniform float gradientDistortion;

${classicNoise2D}

void main()	{
  float noise = classicNoise2D((uv + timer) * perlinDimension) * perlinForce;
  // noise = (noise + 0.5);
  vUv = vec2(
    (uv.x) * (noise + 0.5) + (uv.y * gradientDistortion),
    (uv.y) * (noise + 0.5)
  ) * 0.6;

  vec3 newPosition = position;

  // noise *= perlinTransition * 0.01;
  // newPosition += noise;

  vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;

  gl_Position = projectionMatrix * mvPosition;
}
`;
export const frag = `
precision highp float;
precision highp int;

varying vec2 vUv;

uniform float timer;
uniform float perlinTransition;
uniform vec3 color;
uniform sampler2D gradientTexture;

void main() {
  vec3 newColor = color;
  newColor += vUv.x * 0.25;

  vec3 gradient = texture2D(gradientTexture, vUv).xyz;
  newColor = mix(newColor, gradient, perlinTransition);

  gl_FragColor = vec4(newColor, 1.0);
}
`;