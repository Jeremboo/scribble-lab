export const particleVert = `

// RenderTarget containing the transformed positions
uniform sampler2D positions;
uniform float pointSize;

void main() {
  // the mesh is a normalized square so the uvs = the xy positions of the vertices
  vec3 pos = texture2D( positions, position.xy ).xyz;
  // pos now contains a 3D position in space, we can use it as a regular vertex


  // regular projection of our position
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

  // sets the point size
  gl_PointSize = pointSize;
}

`;
export const particleFrag = `


  void main() {
    gl_FragColor = vec4(1.);
  }
  `;

export const positionFrag = `
  precision highp float;

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
  uniform float aspectRatio;


  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Grab data
    vec4 textureData = texture2D(texture, uv);
    vec2 currentPosition = textureData.xy;
    vec2 currentForce = textureData.zw;

    vec4 initialData = texture2D(initialDataTexture, uv);

    // The position
    float mask = texture2D(mask, initialData.xy + 0.5).x;

    if (mask == 0.) {
      gl_FragColor = vec4(-9999., -9999., 0., 0.);
      return;
    } else if(currentPosition.x == -9999.) {
      currentPosition = initialData.xy;
      currentForce = initialData.zw;
    }

    // Define the mouse attraction depending of the distance with it.
    // Use the aspect ratio to correct the dist scale
    vec2 currentPos = vec2(currentPosition.x * aspectRatio, currentPosition.y);
    vec2 mousePos = vec2(mousePosition.x * aspectRatio, mousePosition.y);
    float dist = min(attractionDistanceMax, distance(currentPos, mousePos));

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
`;