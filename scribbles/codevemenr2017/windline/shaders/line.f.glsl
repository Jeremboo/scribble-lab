uniform vec3 color;
uniform float timer;
uniform float lineHeight;
uniform float spaceHeight;

varying vec2 vUv;
varying vec3 vPos;

void main() {
  float t = ceil(lineHeight - mod(vPos.x + timer, spaceHeight));
  // if (t > 0.0) {
  //   t = 1.0;
  // }
	gl_FragColor = vec4(color, t);
}
