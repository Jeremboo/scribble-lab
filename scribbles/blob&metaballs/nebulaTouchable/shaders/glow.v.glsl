
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

