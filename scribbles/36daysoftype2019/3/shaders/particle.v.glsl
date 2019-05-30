uniform sampler2D positions;
uniform vec2 tileGrid;

attribute vec2 fboUv;

varying vec2 vVideoUv;
varying vec3 vViewPosition;

varying float vDepth;

attribute vec3 color;
varying vec3 vColor;

#ifndef FLAT_SHADED
 varying vec3 vNormal;
#endif

#include <fog_pars_vertex>

mat4 rotationY( in float angle ) {
	return mat4(	cos(angle),		0,		sin(angle),	0,
			 				0,		1.0,			 0,	0,
					-sin(angle),	0,		cos(angle),	0,
							0, 		0,				0,	1);
}

mat4 scale(float x, float y, float z){
    return mat4(
        vec4(x,   0.0, 0.0, 0.0),
        vec4(0.0, y,   0.0, 0.0),
        vec4(0.0, 0.0, z,   0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}

void main()	{


  vColor = color;

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
  float s = 1. + ((pos.z + pos.x) * 0.1);
  vec4 worldPosition = modelMatrix * vec4(position + pos, 1.0) * rotationY(pos.y * 0.5) * scale(
    s,
    s,
    s
    );

  vDepth = pos.z;

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;


  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}
