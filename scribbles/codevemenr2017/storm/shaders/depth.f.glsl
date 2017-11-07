// Based on : https://github.com/mrdoob/three.js/blob/r86/src/renderers/shaders/ShaderLib/depth_frag.glsl
// See also the old : https://github.com/mrdoob/three.js/blob/r75/src/renderers/shaders/ShaderLib/depthRGBA_frag.glsl#L32 

#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

void main() {

  #include <clipping_planes_fragment>

  vec4 diffuseColor = vec4( 1.0 );

  #include <map_fragment>
  #include <alphamap_fragment>
  #include <alphatest_fragment>

  #include <logdepthbuf_fragment>

  gl_FragColor = packDepthToRGBA( gl_FragCoord.z );
}
