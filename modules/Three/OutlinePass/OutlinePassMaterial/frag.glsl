 // #include <packing>
// The above include imports "perspectiveDepthToViewZ"
// and other GLSL functions from ThreeJS we need for reading depth.

uniform sampler2D sceneColorBuffer;
uniform sampler2D surfaceBuffer;
uniform vec2 screenSize;
uniform vec3 outlineColor;
uniform int thickness;

// uniform sampler2D depthBuffer;
// uniform vec4 multiplierParameters;
// uniform float cameraNear;
// uniform float cameraFar;

varying vec2 vUv;

// // Helper functions for reading from depth buffer.
// float readDepth (sampler2D depthSampler, vec2 coord) {
//   float fragCoordZ = texture2D(depthSampler, coord).x;
//   float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
//   return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
// }
// float getLinearDepth(vec3 pos) {
//   return -(viewMatrix * vec4(pos, 1.0)).z;
// }
// float getLinearScreenDepth(sampler2D map) {
//     vec2 uv = gl_FragCoord.xy * screenSize;
//     return readDepth(map,uv);
// }
// // Helper functions for reading normals and depth of neighboring pixels.
// float getPixelDepth(int x, int y) {
//   // screenSize is pixel size
//   // vUv is current position
//   return readDepth(depthBuffer, vUv + screenSize * vec2(x, y));
// }

// float saturateValue(float num) {
//   return clamp(num, 0.0, 1.0);
// }

// "surface value" is either the normal or the "surfaceID"
vec3 getSurfaceValue(int x, int y) {
  vec3 val = texture2D(surfaceBuffer, vUv + screenSize * vec2(x, y)).rgb;
  return val;
}

// TODO 2024-01-04 jeremboo: This can be optimized with less passes if needed
float getSurfaceIdDiff(vec3 surfaceValue) {
  float surfaceIdDiff = 0.0;
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(thickness, 0));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, thickness));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, thickness));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, -thickness));

  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(thickness, thickness));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(thickness, -thickness));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-thickness, thickness));
  surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-thickness, -thickness));
  return surfaceIdDiff;
}

void main() {
  vec4 sceneColor = texture2D(sceneColorBuffer, vUv);

  vec3 surfaceValue = getSurfaceValue(0, 0);
  float surfaceValueDiff = getSurfaceIdDiff(surfaceValue);

  // If the diff as some changes, set it to 1
  if(surfaceValueDiff != 0.0)
    surfaceValueDiff = 1.0;

  float outline = surfaceValueDiff;

  // Combine outline with scene color.
  vec4 outlineColor = vec4(outlineColor, 1.0);
  gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));

  // DEBUG
  if(DEBUG_MODE == 1) {
    gl_FragColor = vec4(surfaceValue, 1.0);
  }

  // NOT USED

  // If we want to use the depth
  // float depth = getPixelDepth(0, 0);
  // float depthDiff = 0.0;
  // depthDiff += abs(depth - getPixelDepth(1, 0));
  // depthDiff += abs(depth - getPixelDepth(-1, 0));
  // depthDiff += abs(depth - getPixelDepth(0, 1));
  // depthDiff += abs(depth - getPixelDepth(0, -1));
  // float depthBias = multiplierParameters.x;
  // float depthMultiplier = multiplierParameters.y;
  // depthDiff = depthDiff * depthMultiplier;
  // depthDiff = saturateValue(depthDiff);
  // depthDiff = pow(depthDiff, depthBias);

  // If we want to use the normals
  // float normalBias = multiplierParameters.z;
  // float normalMultiplier = multiplierParameters.w;
  // surfaceValueDiff = surfaceValueDiff * normalMultiplier;
  // surfaceValueDiff = saturateValue(surfaceValueDiff);
  // surfaceValueDiff = pow(surfaceValueDiff, normalBias);

  // Show depth map
  // gl_FragColor = vec4(vec3(depth), 1.0);

  // Show outline only
  // gl_FragColor = vec4(vec3(outline * outlineColor), 1.0);
}