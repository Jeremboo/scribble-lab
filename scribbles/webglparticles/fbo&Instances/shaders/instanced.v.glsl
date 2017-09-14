uniform sampler2D positions;

attribute vec3 color;
attribute vec2 coord;

varying vec3 vColor;
varying vec3 vViewPosition;

#ifndef FLAT_SHADED
 varying vec3 vNormal;
#endif

#include <shadowmap_pars_vertex>

void main()	{

  #ifndef FLAT_SHADED
   vNormal = normalize( transformedNormal );
  #endif

  vColor = color;

  vec3 pos = texture2D(positions, coord).xyz;
  vec4 worldPosition = modelMatrix * vec4(position + (pos * 20.0), 1.0);

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;

  #include <shadowmap_vertex>
}
