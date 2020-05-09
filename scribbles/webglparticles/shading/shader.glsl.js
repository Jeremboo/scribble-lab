export const fragInstanced = `
#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
varying vec3 vColor;

#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <normalmap_pars_fragment>

void main() {

	vec4 diffuseColor = vec4( diffuse * vColor, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
}

`;
export const vertInstanced = `
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

`;
export const vertDeth = `
attribute vec3 mcol0;
attribute vec3 mcol1;
attribute vec3 mcol2;
attribute vec3 mcol3;

varying vec4 vWorldPosition;

void main()	{

  mat4 matrix = mat4(
    vec4(mcol0, 0),
    vec4(mcol1, 0),
    vec4(mcol2, 0),
    vec4(mcol3, 1)
  );
  vec3 pos = (matrix * vec4(position, 1.0)).xyz;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
	vWorldPosition = worldPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}

`;
export const fragDeth =`
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
`;