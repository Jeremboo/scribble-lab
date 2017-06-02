uniform sampler2D texture;

varying vec2 vUv;

void main() {
	vec3 position = texture2D(texture, vUv).xyz;

	gl_FragColor = vec4(vec3(position.x, position.y + 0.01, 0), 1.0);
}
