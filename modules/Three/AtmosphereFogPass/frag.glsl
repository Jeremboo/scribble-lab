#include <packing>

uniform sampler2D tDiffuse;
uniform sampler2D depthBuffer;

uniform float cameraNear;
uniform float cameraFar;

uniform vec3 fogColorNear;
uniform vec3 fogColorFar;
uniform float fogNear;
uniform float fogFar;
uniform float fogNearInfluence;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);

  float depth = texture2D(depthBuffer, vUv).x;
  float viewZ = perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
  float fogDepth = -viewZ;

  // Early atmospheric veil (object → slightly influenced by fogNear)
  float nearVeil = smoothstep(0.0, fogNear, fogDepth) * fogNearInfluence;
  // Distance band where objects converge toward fogFar
  float atmospheric = smoothstep(fogNear, fogFar, fogDepth);

  vec3 fogCol = mix(fogColorNear, fogColorFar, atmospheric);
  float fogAmount = max(nearVeil * (1.0 - atmospheric), atmospheric);

  gl_FragColor = vec4(mix(color.rgb, fogCol, fogAmount), color.a);
}
