
uniform sampler2D texture;
uniform sampler2D initialPositionTexture;

uniform float rotationCurve;
uniform float rotationDistance;
uniform float rotationForce;
uniform float t;

varying vec2 vUv;

void main() {
  // init
  vec3 pos = vec3(0.0);

  // Get the old position
  vec3 oldPosition = texture2D(texture, vUv).xyz;

  vec3 newPosition = vec3(
    cos(t) * 2.0,
    -sin(t) * 2.0,
    oldPosition.z
  );

  gl_FragColor = vec4(newPosition, 1.0);
}
