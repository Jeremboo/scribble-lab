
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform float tx,ty;

varying vec4 vUv;

void main() {
  vec3 base = texture2DProj(tDiffuse, vUv).xyz;

  gl_FragColor = vec4( base * color, 1.0 );
}