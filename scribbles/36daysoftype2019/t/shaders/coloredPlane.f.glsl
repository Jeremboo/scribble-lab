precision highp float;
precision highp int;

varying vec2 vUv;

uniform float timer;
uniform float perlinTransition;
uniform vec3 color;
uniform sampler2D gradientTexture;

void main() {
  vec3 newColor = color;
  newColor += vUv.x * 0.25;

  vec3 gradient = texture2D(gradientTexture, vUv).xyz;
  newColor = mix(newColor, gradient, perlinTransition);

  gl_FragColor = vec4(newColor, 1.0);
}
