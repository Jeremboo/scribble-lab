uniform sampler2D texture;
uniform sampler2D velocityTexture;
uniform sampler2D initialPositionTexture;

uniform float demiseDistance;
uniform float rotationForce;

varying vec2 vUv;

void main() {
  vec3 pos = vec3(0.0, 0.0, 0.0);

  // Get the old position
  vec3 oldPosition = texture2D(texture, vUv).xyz;

  // Get the velocity and distance
  vec4 velocityTex = texture2D(velocityTexture, vUv);
  vec3 vel = velocityTex.xyz;
  float dist = velocityTex.a;

  // if to nearest
  if (dist < demiseDistance) {
    pos = texture2D(initialPositionTexture, vUv).xyz;
  } else {
    // Apply velocity { pos -= vel }
    pos = oldPosition - vel;

    // TODO get orthogonal vector { x: -posY, y: posX }
    // TODO get dist ort/pos
    // TODO normalize l'orthogonal vector
    // TODO apply rotationForce to the normalized vector

    // TODO apply normalizedrotationForce { pos += rotationForce }
  }

  gl_FragColor = vec4(pos, 1.0);
}
