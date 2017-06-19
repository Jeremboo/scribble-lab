uniform sampler2D texture;
uniform sampler2D positionTexture;

uniform sampler2D propsTexture;

uniform float maxDistance;
uniform float demiseDistance;

uniform float attractionCurve;
uniform float attractionDistance;
uniform float attractionForce;

// uniform float velMax;
// uniform float velBrake;

varying vec2 vUv;

void main() {
  // TEXTURES
  // Get the current position
  vec2 position = texture2D(positionTexture, vUv).xy;
  // Get the old velocity
  vec4 velocityTex = texture2D(texture, vUv);
  vec2 oldVel = velocityTex.xy;
  // props
  vec2 props = texture2D(propsTexture, vUv).xy;
  float velMax = props.x;
  float velBrake = props.y;

  // INIT needed values
  vec2 vel = vec2(0.0);
  float dist = length(position); // distance(position, vec2(0.0));
  float force = 1.0;

  // If not to nearest
  if (dist > demiseDistance) {
    // Normalized force direction
    vec2 normalized = position / dist; // normalize(position);

    // Force amplitude
    // http://www.mathopenref.com/graphfunctions.html?fx=(exp(a%20*%20(1%20-%20x%20-%20b)))%20*%20c&xh=1&xl=0&yh=10&yl=-10&a=3.595744680851064&b=0.3&c=1.4&dh=10&dl=-4&d=5.6
    force = exp(attractionCurve * ((maxDistance * attractionDistance) - dist)) * 0.0001 * attractionForce;

    // Update the velocity
    vel = (oldVel + (normalized * force));

    // Decrement velocity
    if (dist > velMax) {
      vel *= velBrake;
    }
  }

  gl_FragColor = vec4(vel.xy, force, dist);
}
