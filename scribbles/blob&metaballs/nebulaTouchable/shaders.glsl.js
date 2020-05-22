import { RGBToHSL, HSLToRGB, drawRadialGradient } from '../../../utils/glsl';

export const fragGlow = `
uniform vec3 color;
uniform sampler2D texture;

varying vec2 vUv;
varying float vAlpha;
varying float vTime;
varying float vIncrementedColor;

${RGBToHSL}
${HSLToRGB}
${drawRadialGradient}

void main() {
	vec3 HSLColor = RGBToHSL(color);
  HSLColor.x += vIncrementedColor;
  vec3 modifiedColor = HSLToRGB(HSLColor);

  // V1 ------
  // vec2 center = vec2(0.5, 0.5);
  // float a = drawRadialGradient(center, vUv, 1.0) * vAlpha;
  // gl_FragColor = vec4(vec3(color) * vTime, a);

  // V2 ------
  vec4 gradient = texture2D(texture, vUv);
  vec3 c = modifiedColor * vTime;
  float a = gradient.w * vAlpha;
  gl_FragColor = vec4(c * a, a);
}
`;

/**
 * * *******************
 * * VERT
 * * *******************
 */

export const vertGlow = `
// TODO 2020-04-03 jeremboo: TO SOLVE
// https://stackoverflow.com/questions/22053932/three-js-billboard-vertex-shader
// https://stackoverflow.com/questions/36510020/three-js-glsl-sprite-always-front-to-camera

attribute vec3 _position;
attribute vec2 _scale;
attribute float _alpha;
attribute float _time;
attribute float _incrementedColor;

uniform float scale;

varying vec2 vUv;
varying float vAlpha;
varying float vTime;
varying float vIncrementedColor;

void main() {
  vUv = vec2(
    position.x * 0.5 + 0.5,
    position.y * 0.5 + 0.5
  );
  vAlpha = _alpha;
  vTime = sin(_time);
  vIncrementedColor = _incrementedColor;

  vec4 mvPosition = modelViewMatrix * vec4(_position, 1.0);
	float billboard = sin( _position.x ) + sin( _position.y ) + sin( _position.z );
  mvPosition.xyz += position * billboard * vec3(_scale, 1.0) * scale;

  gl_Position = projectionMatrix * mvPosition;
}

`;