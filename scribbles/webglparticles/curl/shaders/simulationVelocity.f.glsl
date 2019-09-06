precision highp float;

uniform sampler2D texture;
uniform sampler2D t_currentPosition;
uniform sampler2D t_infos;
uniform vec3 mousePosition;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution.xy;

	vec3 currentForce = texture2D( texture, uv ).xyz;
	vec3 currentPosition = texture2D( t_currentPosition, uv ).xyz;
	vec3 infos = texture2D( t_infos, uv ).xyz;

	vec3 dist = mousePosition - currentPosition;

	vec3 force = normalize(dist) * min(.2, max(.001, length(dist) - infos.z));
	currentForce += force * infos.x;
	currentForce *= infos.y;

	gl_FragColor = vec4(currentForce, 1.0);
}
