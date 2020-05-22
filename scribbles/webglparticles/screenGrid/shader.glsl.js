import { classicNoise2D } from '../../../utils/glsl';

export const fragInstanced = `
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
`;
export const vertInstanced = `
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

  // The UVs to map the video on the grid
  vVideoUv = vec2(
    fboUv.x + (planeUv.x / tileGrid.x),
    fboUv.y + (planeUv.y / tileGrid.y)
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
`;
export const shaderSimulationPosition = `
uniform sampler2D initialPositionTexture;

uniform float perlinTime;
uniform float perlinDimention;
uniform float perlinForce;

uniform vec2 mousePosition;
uniform float attractionDistanceMax;
uniform float attractionVelocity;

varying vec2 vUv;

${classicNoise2D}

void main() {
  vec3 initialPos = texture2D(initialPositionTexture, vUv).xyz;

  // Create the noise depending on coordinate, time, dimention, force.
  float noise = classicNoise2D((vUv + perlinTime) * perlinDimention) * perlinForce;

  vec3 newPosition = initialPos + noise;

  // Define the  mouse force depending of the distance with it.
  float dist = min(attractionDistanceMax, distance(newPosition.xy, mousePosition));
  float force = (attractionDistanceMax - dist) * attractionVelocity;

  // V1 - Attract particle close to the mouse ------------------------------------------------------
  // Attract particles close to the mouse
  // vec2 attractedDistance = newPosition.xy + ((mousePosition - newPosition.xy) * force * 0.2);
  // newPosition = vec3(attractedDistance, newPosition.z);

  // V2 - Increase the Z close to the mouse --------------------------------------------------------
  float attractiveZ = (newPosition.z * force) + (newPosition.z * 0.2);
  newPosition = vec3(newPosition.xy, attractiveZ);

  // V3 - Vibrations close to the mouse ------------------------------------------------------------
  float vibSpeed = 0.4;
  float vibDimention = 50.0;
  float vibForce = 1.0;
  float vibrationNoise = classicNoise2D((vUv - (perlinTime * vibSpeed)) * vibDimention) * vibForce;

  float vibrationZ = (newPosition.z + (vibrationNoise * force)) + (newPosition.z * 0.2);
  newPosition = vec3(newPosition.xy, vibrationZ);

  // Displace the initial position with the noise
  gl_FragColor = vec4(newPosition, 1.0);
}
`;