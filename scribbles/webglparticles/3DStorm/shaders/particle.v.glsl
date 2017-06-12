
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
