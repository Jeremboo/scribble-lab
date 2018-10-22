uniform sampler2D tDiffuse;
uniform float timer;
uniform float blackLayer;
uniform float range;

varying vec2 vUv;

// 2D Random
float random (in vec2 st) {
    return fract(sin(dot(
      st.xy,
      vec2(12.9898,78.233))) * 43758.5453123
    );
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  float rand = max(random(vUv * timer), range);
  gl_FragColor = vec4(color.xyz * rand * blackLayer, color.a);
}
