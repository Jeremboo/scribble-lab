

export const particleFrag = `
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4( vColor, vColor.z - 0.2 );
  }
`;

export const particleVert = `
  // RenderTarget containing the transformed positions
  uniform sampler2D positions;
  uniform float pointSize;

  varying vec3 vColor;

  void main() {
    // the mesh is a normalized square so the uvs = the xy positions of the vertices
    vec3 pos = texture2D( positions, position.xy ).xyz;
    // pos now contains a 3D position in space, we can use it as a regular vertex

    // DEBUG
    vColor = pos;

    // regular projection of our position
    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

    // sets the point size
    gl_PointSize = (10.0 - length(pos.xy)) * pointSize;
  }
`;

/**
 * * *******************
 * * SIMULATION
 * * *******************
 */

export const positionSimFrag = `
  precision highp float;

  uniform sampler2D texture;
  uniform sampler2D velocityTexture;
  uniform sampler2D initialPositionTexture;

  uniform float demiseDistance;

  uniform float rotationCurve;
  uniform float rotationDistance;
  uniform float rotationForce;

  varying vec2 uv;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // init
    vec3 pos = vec3(0.0);

    // Get the old position
    vec3 oldPosition = texture2D(texture, uv).xyz;

    // Get the velocity and distance
    vec4 velocityTex = texture2D(velocityTexture, uv);
    vec2 vel = velocityTex.xy;
    float force = 0.0; // velocityTex.z;
    float dist = velocityTex.a;

    // if to nearest
    if (dist < demiseDistance) {
      // init att the default position
      pos = texture2D(initialPositionTexture, uv).xyz;
    } else {
      // VELOCITY
      pos = oldPosition - vec3(vel, 0.0);

      // ROTATION
      // Get orthogonal vector { x: -posY, y: posX }
      vec3 ortho = vec3(-pos.y, pos.x, pos.z);
      // Normalize the orthogonal vector
      vec3 orthoNormalized = normalize(ortho);
      // Apply the rotation
      force = exp(rotationCurve * ((10.0 * rotationDistance) - dist)) * rotationForce;
      pos += orthoNormalized * force;
    }

    gl_FragColor = vec4(pos, 1.0);
  }
`;

export const velocitySimFrag = `
  precision highp float;

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

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    // TEXTURES
    // Get the current position
    vec2 position = texture2D(positionTexture, uv).xy;
    // Get the old velocity
    vec4 velocityTex = texture2D(texture, uv);
    vec2 oldVel = velocityTex.xy;
    // props
    vec2 props = texture2D(propsTexture, uv).xy;
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
`;