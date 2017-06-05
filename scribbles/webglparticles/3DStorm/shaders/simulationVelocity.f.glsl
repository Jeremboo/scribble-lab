uniform sampler2D texture;
uniform sampler2D velocityTexture;

uniform float demiseDistance;

uniform float attractionAmplitude;
uniform float attractionZone;
uniform float attractionForce;

uniform vec3 velMax;
uniform float velBrake:

varying vec2 vUv;

void main() {
  float dist = 0.0;
  vec3 vel = vec3(0.0);

  // Get the current position
  vec3 position = texture2D(texture, vUv).xyz;

  // Get the old velocit and position
  vec4 velocityTex = texture2D(velocityTexture, vUv);
  vec3 oldVel = velocityTex.xyz;
  float oldDist = velocityTex.a;

  // TODO get the dist between theres positions;
  float dist = 0.0;

  // if not to nearest
  if (dist > demiseDistance) {
    // TODO normalize the vector of difference: { pos / dist }
    vec3 normalized = pos / dist;

    // TODO caculate the force f = Math.exp(attractionAmplitude * (attractionZone - (dist / windowWidth))) * attractionForce
    float force = exp(attractionAmplitude * (attractionZone - (dist / windowWidth))) * attractionForce;
    // TODO create a force vector: { norm * f }
    normalized *= force;

    // TODO update velocity: { vel += force }
    vel = oldVel + normalized;

    // TODO increment velocity: if (Math.abs(vel) > velMax) vel *= velBrake;
    if (abs(vel.x) > velMax.x) { vel *= velBrake; }
    if (abs(vel.y) > velMax.y) { vel *= velBrake; }
    if (abs(vel.z) > velMax.z) { vel *= velBrake; }
  }

  gl_FragColor = vec4(vel, dist);
}
