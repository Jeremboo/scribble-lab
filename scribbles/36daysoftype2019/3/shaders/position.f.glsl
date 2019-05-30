uniform sampler2D texture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 data = texture2D(texture, uv);

  vec3 newPosition = data.xyz;

  // Displace the initial position with the noise
  newPosition.y += data.w;
  newPosition.x -= data.w;
  gl_FragColor = vec4(newPosition, data.w);
}
