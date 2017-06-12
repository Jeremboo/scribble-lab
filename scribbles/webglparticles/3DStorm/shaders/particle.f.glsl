varying vec3 vColor;

void main() {
  gl_FragColor = vec4( vColor, vColor.z - 0.2 );
}
