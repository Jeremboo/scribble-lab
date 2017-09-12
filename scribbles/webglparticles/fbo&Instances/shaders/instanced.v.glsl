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

#include <shadowmap_pars_vertex>

void main()	{

 vColor = color;

 #ifndef FLAT_SHADED
	 vNormal = normalize( transformedNormal );
 #endif

 mat4 matrix = mat4(
	 vec4(mcol0, 0),
	 vec4(mcol1, 0),
	 vec4(mcol2, 0),
	 vec4(mcol3, 1)
 );
 vec3 pos = (matrix * vec4(position, 1.0)).xyz;

 vec4 worldPosition = modelMatrix * vec4(pos, 1.0);

 vec4 mvPosition = viewMatrix * worldPosition;
 vViewPosition = -mvPosition.xyz;

 gl_Position = projectionMatrix * mvPosition;

 #include <shadowmap_vertex>
}
