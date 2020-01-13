precision mediump float;

uniform vec3 color;

varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vec3(vUv, 1.) * color, 1.);
}