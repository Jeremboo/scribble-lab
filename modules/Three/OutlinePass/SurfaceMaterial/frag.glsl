varying float vSurfaceId;

uniform float maxSurfaceId;

void main() {
    // Do not render if the surfaceId is 0
  if(vSurfaceId == 0.0)
    discard;

    // Normalize the surfaceId when writing to texture
    // Surface ID needs rounding as precision can be lost in perspective correct interpolation
    // - see https://github.com/OmarShehata/webgl-outlines/issues/9 for other solutions eg. flat interpolation.
  float surfaceId = floor(vSurfaceId) / maxSurfaceId;
  gl_FragColor = vec4(surfaceId, 0.0, 0.0, 1.0);

    // For debug rendering, assign a random color to each surfaceId
  if(DEBUG_MODE == 0)
    return;
  int surfaceIdInt = int(floor(vSurfaceId) * 100.0);
  float R = mod(float(surfaceIdInt), 255.0) / 255.0;
  float G = mod(float((surfaceIdInt + 50)), 255.0) / 255.0;
  float B = mod(float((surfaceIdInt * 20)), 255.0) / 255.0;
  gl_FragColor = vec4(R, G, B, 1.0);
}