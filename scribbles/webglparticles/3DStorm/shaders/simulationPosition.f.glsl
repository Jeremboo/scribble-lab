uniform sampler2D texture;
uniform sampler2D velocityTexture;
uniform sampler2D initialPositionTexture;

uniform float demiseDistance;
uniform float rotationForce;

varying vec2 vUv;

void main() {
  // init
  vec3 pos = vec3(0.0, 0.0, 0.0);

  // Get the old position
  vec3 oldPosition = texture2D(texture, vUv).xyz;

  // Get the velocity and distance
  vec4 velocityTex = texture2D(velocityTexture, vUv);
  vec2 vel = velocityTex.xy;
  float force = velocityTex.z;
  float dist = velocityTex.a;

  // if to nearest
  if (dist < demiseDistance) {
    // init att the default position
    pos = texture2D(initialPositionTexture, vUv).xyz;
  } else {
    // VELOCITY
    pos = oldPosition - vec3(vel, 0.0);

    // ROTATION
    // Get orthogonal vector { x: -posY, y: posX }
    vec3 ortho = vec3(-pos.y, pos.x, pos.z);
    // Normalize the orthogonal vector
    vec3 orthoNormalized = normalize(ortho);
    // Apply the rotation
    pos += orthoNormalized * force * rotationForce * 100.0;
  }

  gl_FragColor = vec4(pos, 1.0);
}
