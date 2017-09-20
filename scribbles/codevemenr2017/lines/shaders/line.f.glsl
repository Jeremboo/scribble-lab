uniform vec3 color;
uniform float timer;

varying vec2 vUv;
varying vec3 vPos;

void main() {
  float t = 1.0 - mod(vPos.x + timer, 10.0);
	gl_FragColor = vec4(color, t);
}
