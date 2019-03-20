uniform sampler2D initialPositionTexture;

uniform float perlinTime;
uniform float perlinDimention;
uniform float perlinForce;

uniform vec2 mousePosition;
uniform float attractionDistanceMax;
uniform float attractionVelocity;

varying vec2 vUv;

// Perlin method
// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 *
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
  vec3 initialPos = texture2D(initialPositionTexture, vUv).xyz;

  // Create the noise depending on coordinate, time, dimention, force.
  float noise = cnoise((vUv + perlinTime) * perlinDimention) * perlinForce;

  vec3 newPosition = initialPos + noise;

  // Define the  mouse force depending of the distance with it.
  float dist = min(attractionDistanceMax, distance(newPosition.xy, mousePosition));
  float force = (attractionDistanceMax - dist) * attractionVelocity;

  // V1 - Attract particle close to the mouse ------------------------------------------------------
  // Attract particles close to the mouse
  // vec2 attractedDistance = newPosition.xy + ((mousePosition - newPosition.xy) * force * 0.2);
  // newPosition = vec3(attractedDistance, newPosition.z);

  // V2 - Increase the Z close to the mouse --------------------------------------------------------
  float attractiveZ = (newPosition.z * force) + (newPosition.z * 0.2);
  newPosition = vec3(newPosition.xy, attractiveZ);

  // V3 - Vibrations close to the mouse ------------------------------------------------------------
  float vibSpeed = 0.4;
  float vibDimention = 50.0;
  float vibForce = 1.0;
  float vibrationNoise = cnoise((vUv - (perlinTime * vibSpeed)) * vibDimention) * vibForce;

  float vibrationZ = (newPosition.z + (vibrationNoise * force)) + (newPosition.z * 0.2);
  newPosition = vec3(newPosition.xy, vibrationZ);

  // Displace the initial position with the noise
  gl_FragColor = vec4(newPosition, 1.0);
}
