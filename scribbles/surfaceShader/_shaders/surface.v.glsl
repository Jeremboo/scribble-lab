attribute vec2 position;

varying vec2 vUv;

void main() {
  // Compute the UV
  vUv = (position + 1.) * 0.5;

  // Place the triangle (in 2D)
  gl_Position = vec4(position, 0., 1.);
}