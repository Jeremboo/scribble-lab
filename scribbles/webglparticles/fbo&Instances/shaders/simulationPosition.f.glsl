
uniform sampler2D texture;
uniform sampler2D initialPositionTexture;

uniform float rotationCurve;
uniform float rotationDistance;
uniform float rotationForce;

varying vec2 vUv;

void main() {
  // init
  vec3 pos = vec3(0.0);

  // Get the old position
  vec3 oldPosition = texture2D(texture, vUv).xyz;

  if (oldPosition.z > 2.0) {
    oldPosition = texture2D(initialPositionTexture, vUv).xyz;
  }

  // Get the velocity and distance
  vec2 vel = vec2(0.01);
  float force = 0.0;

  // VELOCITY
  pos = oldPosition;

  // ROTATION
  // Get orthogonal vector { x: -posY, y: posX }
  vec3 ortho = vec3(-pos.y, pos.x, pos.z);
  // Normalize the orthogonal vector
  vec3 orthoNormalized = normalize(ortho);
  // Apply the rotation
  force = exp(rotationCurve * ((10.0 * rotationDistance))) * rotationForce;
  pos += orthoNormalized * force;

  gl_FragColor = vec4(pos, 1.0);
}
