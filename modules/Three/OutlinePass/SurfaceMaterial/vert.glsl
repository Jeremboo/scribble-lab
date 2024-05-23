#include <morphtarget_pars_vertex>

varying float vSurfaceId;

attribute float surfaceId;

void main() {
  #include <begin_vertex>
  #include <morphtarget_vertex>

  vSurfaceId = surfaceId;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
