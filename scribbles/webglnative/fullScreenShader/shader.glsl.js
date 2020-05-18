import { drawRadialGradient } from '../../../modules/utils.glsl';

export const surfaceVertSource = `
  attribute vec2 position;

  varying vec2 vUv;

  void main() {
    // Place the triangle (in 2D)

    gl_Position = vec4(position, 0.0, 1.0);
    vUv = (position + 1.) * 0.5;
  }
`;
export const surfaceFragSource = `
  precision mediump float;

  uniform vec3 color;
  uniform float scale;
  uniform float strength;
  uniform vec2 mousePosition;

  varying vec2 vUv;

  ${drawRadialGradient}

  void main() {
    float circle = max(0.0, drawRadialGradient(mousePosition, vUv, scale)) * strength;
    vec3 color = vec3(vUv, 1.0) + circle;
    gl_FragColor = vec4(color, 1.);
  }
`;