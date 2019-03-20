uniform sampler2D positions;
uniform vec2 tileGrid;

attribute vec2 fboUv;

varying vec2 vVideoUv;
varying vec3 vViewPosition;

varying float vTileDepth;

#ifndef FLAT_SHADED
 varying vec3 vNormal;
#endif

#include <shadowmap_pars_vertex>

void main()	{

  // The UVs for an unique Tile
  vec2 planeUv = vec2(
    (position.x * 0.5) + 0.5,
    (position.y * 0.5) + 0.5
  );

  // The UVs of the whole grid
  vec2 pixellateVideoUv = vec2(
    fboUv.x,
    1. - fboUv.y
  );

  // The UVs to map the video on the grid
  vVideoUv = vec2(
    pixellateVideoUv.x + (planeUv.x / tileGrid.x),
    pixellateVideoUv.y + (planeUv.y / tileGrid.y)
  );


  // Basic vertex
  #ifndef FLAT_SHADED
   vNormal = normalize( transformedNormal );
  #endif

  vec3 pos = texture2D(positions, fboUv).xyz;
  vec4 worldPosition = modelMatrix * vec4(position + pos, 1.0);

  vTileDepth = pos.z;

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;


  gl_Position = projectionMatrix * mvPosition;

  #include <shadowmap_vertex>
}
