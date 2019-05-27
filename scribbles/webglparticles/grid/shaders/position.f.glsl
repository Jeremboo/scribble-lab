uniform sampler2D texture;
uniform sampler2D initialDataTexture;
uniform sampler2D mask;

uniform float perlinTime;
uniform float perlinDimention;
uniform float perlinForce;

uniform vec2 mousePosition;
uniform float attractionDistanceMax;
uniform float attractionVelocity;
uniform float anchorVelocity;
uniform float anchorFriction;
uniform float screenRatio;


void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  // Grab data
  vec4 textureData = texture2D(texture, uv);
  vec2 currentPosition = textureData.xy;
  vec2 currentForce = textureData.zw;

  vec4 initialData = texture2D(initialDataTexture, uv);

  // The position
  vec2 maskUv = vec2(
    (initialData.x / screenRatio) + 0.5,
    initialData.y + 0.5
  );
  float mask = texture2D(mask, maskUv).x;

  if (mask == 0.) {
    gl_FragColor = vec4(-9999., -9999., 0., 0.);
    return;
  } else if(currentPosition.x == -9999.) {
    currentPosition = initialData.xy;
    currentForce = initialData.zw;
  }

  // Define the mouse attraction depending of the distance with it.
  float dist = min(attractionDistanceMax, distance(currentPosition, mousePosition));
  float force = (attractionDistanceMax - dist) * attractionVelocity;

  // V1 - Attract particle close to the mouse ------------------------------------------------------
  currentPosition += (mousePosition - currentPosition) * force;

  // Anchor attraction
  currentForce += (initialData.xy - currentPosition) * anchorVelocity;
  currentForce *= anchorFriction;
  currentPosition += currentForce;

  // Save the new position and velocity
  gl_FragColor = vec4(currentPosition, currentForce);
}
