uniform sampler2D backgroundTexture;
uniform vec2 littleBubblePosition;
uniform vec3 color;

varying vec2 vUv;

float drawRadialGradient(vec2 center, vec2 currentPosition, float scale) {
  float dist = distance(center, currentPosition) * (2.0 / scale);
  return 1.0 - dist;
}

void main() {
  vec2 center = vec2(0.5, 0.5);

  float alpha = drawRadialGradient(center, vUv, 0.4) + drawRadialGradient(littleBubblePosition, vUv, 0.3);
  // ---
  // if (alpha <= 0.0) discard;
  // gl_FragColor = texture2D(backgroundTexture, vUv);
  // --- OR MORE OPTI
  // http://theorangeduck.com/page/avoiding-shader-conditionals
  // gl_FragColor = texture2D(backgroundTexture, vUv) * max(sign(alpha), 0.0);

  gl_FragColor = vec4(color, 1.) * max(sign(alpha), 0.0);
  // ---
}
