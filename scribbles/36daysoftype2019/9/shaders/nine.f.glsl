precision highp float;
precision highp int;

varying vec2 vUv;
varying float vNoise;

uniform float timer;
uniform float perlinTransition;
uniform vec3 color;
uniform sampler2D textTexture;
uniform sampler2D gradientTexture;

void main() {
  vec3 newColor = color;
  float customNoise = abs(vNoise) * 0.1;
  newColor += customNoise;

  vec2 customUv = vUv;
  customUv.x *= 6.;
  customUv.y *= 8.;

  // https://thebookofshaders.com/09/
  customUv.y += ((step(1., mod(customUv.x, 2.0)) - 0.5)) * timer * 2.;
  vec4 text = texture2D(textTexture, customUv);
  newColor = text.xyz;

  vec3 gradientTexture = texture2D(gradientTexture, vUv).xyz;
  newColor *= gradientTexture;

  gl_FragColor = vec4(newColor, text.w);
}
