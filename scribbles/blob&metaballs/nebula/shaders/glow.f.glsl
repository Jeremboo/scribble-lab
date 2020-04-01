uniform vec3 color;
uniform float alpha;
uniform float time;
uniform sampler2D texture;

varying vec2 vUv;

float drawRadialGradient(vec2 center, vec2 currentPosition, float scale) {
  float dist = distance(center, currentPosition) * (2.0 / scale);
  return 1.0 - dist;
}

void main() {

  // V1 ------
  // vec2 center = vec2(0.5, 0.5);
  // float a = drawRadialGradient(center, vUv, 1.0) * alpha;
  // gl_FragColor = vec4(vec3(color) * time, a);

  // V2 ------
  vec4 gradient = texture2D(texture, vUv);
  vec3 c = color * time;
  float a = gradient.w * alpha;
  gl_FragColor = vec4(c * a, a);
}
