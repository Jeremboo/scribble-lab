export const surfaceVertSource = `
  attribute vec2 position;

  varying vec2 vUv;

  void main() {
    // Compute the UV
    vUv = (position + 1.) * 0.5;

    // Place the triangle (in 2D)
    gl_Position = vec4(position, 0., 1.);
  }
`;
export const surfaceFragSource = `
  precision mediump float;

  uniform vec3 color;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vec3(vUv, 1.) * color, 1.);
  }
`;