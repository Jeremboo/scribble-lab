import { drawRadialGradient, rotate2D } from '../../../utils/glsl';

export const surfaceVertSource = `
  attribute vec2 position;
  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    vUv = (position + 1.) * 0.5;
  }
`;
export const surfaceFragSource = `
  precision mediump float;

  uniform float scale;
  uniform float strength;
  uniform float brightness;
  uniform float shift;
  uniform float divider;
  uniform float time;
  uniform float rotation;
  uniform vec2 mousePosition;
  uniform sampler2D texture;

  varying vec2 vUv;

  ${drawRadialGradient}
  ${rotate2D}

  void main() {
    float circle = max(0.0, drawRadialGradient(mousePosition, vUv, scale)) * strength;

    vec2 st = (vUv - mousePosition * shift) * divider;

    // Distortion
    st += (mousePosition - vUv) * circle;

    st.x = 1.0 - st.x;
    st = rotate2D(st, rotation);
    st.y *= 2.0;
    float isPair = step(1.0, mod(st.y, 2.0));
    st.x += time * ((isPair * 2.0) - 1.0);

    vec2 transformedUv = fract(st);
    vec3 image = texture2D(texture, transformedUv).xyz + (circle * brightness);
    gl_FragColor = vec4(image, 1.0);
  }
`;