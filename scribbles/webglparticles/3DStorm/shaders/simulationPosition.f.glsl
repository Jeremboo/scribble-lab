uniform sampler2D texture;

varying vec2 vUv;

void main() {
	vec3 position = texture2D(texture, vUv).xyz;
	// vec3 velocity = texture2D(textureVelocity, vUv).xyz;

	gl_FragColor = vec4(position, 1.0);
}
