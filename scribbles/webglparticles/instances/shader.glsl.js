export const fragInstanced = `
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
`;