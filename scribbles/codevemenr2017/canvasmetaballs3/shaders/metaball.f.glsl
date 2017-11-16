uniform sampler2D backgroundTexture;
uniform vec2 littleBubblePosition;

varying vec2 vUv;

float drawGradientArc(vec2 center, vec2 currentPosition, float scale) {
  float dist = distance(center, currentPosition) * (2.0 / scale);
  return 1.0 - dist;
}

void main() {
  vec2 center = vec2(0.5, 0.5);

  float alpha = drawGradientArc(center, vUv, 0.4) + drawGradientArc(littleBubblePosition, vUv, 0.3);
  // ---
  // if (alpha <= 0.0) discard;
  // gl_FragColor = texture2D(backgroundTexture, vUv);
  // --- OR MORE OPTI
  // http://theorangeduck.com/page/avoiding-shader-conditionals
  gl_FragColor = texture2D(backgroundTexture, vUv) * max(sign(alpha), 0.0);
  // ---
}
