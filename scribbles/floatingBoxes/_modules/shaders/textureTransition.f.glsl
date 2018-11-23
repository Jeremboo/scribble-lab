uniform float u_transition;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;

varying vec2 vUv;

void main() {
  vec4 video1 = texture2D(u_texture1, vUv);
  vec4 video2 = texture2D(u_texture2, vUv);

  gl_FragColor = mix(video1, video2, u_transition);
}
