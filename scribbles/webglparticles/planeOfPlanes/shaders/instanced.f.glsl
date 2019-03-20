uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform sampler2D videoTexture;
uniform float depthLightingForce;

varying vec2 vVideoUv;
varying float vTileDepth;

#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <normalmap_pars_fragment>

void main() {
	vec3 video = texture2D(videoTexture, vVideoUv).xyz;

	vec4 diffuseColor = vec4(video, opacity);
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
	outgoingLight += vTileDepth * depthLightingForce;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
}
