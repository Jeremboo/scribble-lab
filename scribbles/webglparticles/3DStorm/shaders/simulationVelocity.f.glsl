uniform sampler2D texture;
uniform sampler2D positionTexture;

uniform float demiseDistance;

uniform float attractionAmplitude;
uniform float attractionZone;
uniform float attractionForce;

uniform vec3 velMax;
uniform float velBrake;

varying vec2 vUv;

void main() {
  float dist = 1.0;
  vec3 vel = vec3(0.0);

  // Get the current position
  vec3 position = texture2D(positionTexture, vUv).xyz;

  // Get the old velocity
  vec4 velocityTex = texture2D(texture, vUv);
  vec3 oldVel = velocityTex.xyz;
  // float oldDist = velocityTex.a;

  // TODO get the dist between theres positions;
  dist = length(position); // distance(position, vec3(0.0));

  // if not to nearest
  if (dist > demiseDistance) {
    // TODO normalize the position vector to get a force
    vec3 normalized = position / dist; // normalize(position);

    // TODO caculate the force
    // float force = exp(attractionAmplitude * (attractionZone - (dist / 10.0))) * attractionForce;
    float force = 0.01;

    // TODO update velocity: { vel += force }
    vel = oldVel + (normalized * force);

    // TODO decrement velocity: if (Math.abs(vel) > velMax) vel *= velBrake;
    // if (abs(length(vel)) > 0.05) {
    //   vel = oldVel;
    // }
  }

  gl_FragColor = vec4(vel, dist);
}
