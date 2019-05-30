varying vec2 vUv;
uniform sampler2D texture;

void main() {
  vec3 gradient = texture2D(texture, vUv).xyz;
  gl_FragColor = vec4(gradient, 1.0);
}
