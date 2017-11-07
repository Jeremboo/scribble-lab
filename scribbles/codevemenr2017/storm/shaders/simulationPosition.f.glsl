
uniform sampler2D texture;
uniform sampler2D initialPositionTexture;

uniform float rotationCurve;
uniform float rotationDistance;
uniform float rotationForce;
uniform float t;

varying vec2 vUv;

void main() {
  // Get the old position
  vec3 initialPositionTexture = texture2D(initialPositionTexture, vUv).xyz;

  vec3 pos = vec3(
    cos(t + initialPositionTexture.y) * initialPositionTexture.x,
    -sin(t + initialPositionTexture.y) * initialPositionTexture.x,
    initialPositionTexture.z
  );

  gl_FragColor = vec4(pos, 1.0);
}
