import { classicNoise2D } from '../../../utils/glsl';

export const vert = `
uniform float timer;

varying vec2 vUv;

${classicNoise2D}

void main() {
    float noise = classicNoise2D((uv + timer) * 1.) * 1.;

    vec3 newPosition = position;
    newPosition.z += 0.5 + noise;

    vec4 modelViewPosition = modelViewMatrix * vec4( newPosition, 1. );

    vUv = vec2(newPosition.z * 1.1, 0.);

    gl_Position = projectionMatrix * modelViewPosition;
}
`;
export const frag = `
uniform sampler2D texture;

varying vec2 vUv;

void main() {
  vec3 gradient = texture2D(texture, vUv).xyz;
  gl_FragColor = vec4(gradient, 1.0);
}
`;