#define PHONG

attribute vec3 mcol0;
attribute vec3 mcol1;
attribute vec3 mcol2;
attribute vec3 mcol3;
attribute vec3 color;
varying vec3 vColor;

varying vec3 vViewPosition;

#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif

void main()	{

  vColor = color;

  #ifndef FLAT_SHADED
  	vNormal = normalize( transformedNormal );
  #endif

  #include <begin_vertex>

  mat4 matrix = mat4(
    vec4(mcol0, 0),
    vec4(mcol1, 0),
    vec4(mcol2, 0),
    vec4(mcol3, 1)
  );
  transformed = (matrix * vec4(position, 1.0)).xyz;

	#include <project_vertex>

	vViewPosition = - mvPosition.xyz;
}
