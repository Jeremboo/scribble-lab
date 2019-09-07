precision highp float;
precision highp int;

varying vec2 vUv;

uniform sampler2D background;
uniform float timer;

void main() {
  vec3 bg = texture2D(background, vUv).xyz;
  bg.y += vUv.x * cos(timer * 10.) * 0.1;
  bg.z -= vUv.y * sin(timer * 5.);
  gl_FragColor = vec4(bg, 1.0);
}
