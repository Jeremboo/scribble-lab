import { RGBToHSL, HSLToRGB, classicNoise2D, drawRadialGradient } from '../../../utils/glsl';

export const fragGlow = `uniform vec3 color;
uniform float alpha;
uniform float time;
uniform sampler2D texture;
uniform vec3 resolution;
uniform float globalTime;
uniform float noiseSize;
uniform float noiseIntensity;
uniform float noiseOrientation;

varying vec2 vUv;

${RGBToHSL}
${HSLToRGB}
${classicNoise2D}
${drawRadialGradient}

void main() {
  // Create a noise related to the screen and not the geometry face
  vec2 screenUV = vec2(gl_FragCoord.xy / resolution.xy);
  vec2 globalTime = vec2(globalTime, globalTime * noiseOrientation);
  float screenNoise = classicNoise2D((screenUV + globalTime) * noiseSize) * noiseIntensity;

  vec3 HSLColor = RGBToHSL(color);
  HSLColor.x += screenNoise;
  vec3 modifiedColor = HSLToRGB(HSLColor);


  // V1 ------
  // vec2 center = vec2(0.5, 0.5);
  // float a = drawRadialGradient(center, vUv, 1.0) * alpha;
  // gl_FragColor = vec4(vec3(color) * time, a);

  // V2 ------
  vec4 gradient = texture2D(texture, vUv);
  vec3 c = modifiedColor * time;
  float a = gradient.w * alpha;
  gl_FragColor = vec4(c * a, a);
}
`;
export const vertGlow = `uniform float scale;

varying vec2 vUv;

void main() {
  vUv = uv;

  // https://stackoverflow.com/questions/5467007/inverting-rotation-in-3d-to-make-an-object-always-face-the-camera/5487981#5487981
  // https://www.geeks3d.com/20140807/billboarding-vertex-shader-glsl/
  mat4 modelView = modelViewMatrix;
  modelView[0][0] = scale;
  modelView[0][1] = 0.0;
  modelView[0][2] = 0.0;
  modelView[1][0] = 0.0;
  modelView[1][1] = scale;
  modelView[1][2] = 0.0;
  modelView[2][0] = 0.0;
  modelView[2][1] = 0.0;
  modelView[2][2] = 1.0;

  vec4 mvPosition = modelView * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}

`;