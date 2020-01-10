uniform vec3 touchPosition;
uniform float shift;
uniform float gradientSize;
uniform float speed;
uniform vec3 color;
uniform vec3 rayColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Gradien throught the sphere
  vec3 normal = normalize(vNormal) + (touchPosition * (shift + speed));
  vec3 direction = normalize(touchPosition - vPosition) * gradientSize;
  float diffuseLighting = abs(dot(normal, direction));
  // float diffuseLighting = dot(normal, direction);

  // Ripple
  // float noiseRippleAmpl = 50.;
  // float xx = noise * noiseRippleAmpl * sin((time * rippleSpeed) + diffuseLighting * rippleMultiplier);
  // float ripple = mix(diffuseLighting, xx, explode) * explode;

  vec3 c = mix(rayColor, color, min(1., max(0., diffuseLighting)));

  gl_FragColor = vec4(c, 1.);
}
