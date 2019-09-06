precision highp float;

varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vDirection;
varying float vDepth;

uniform float contrast;
uniform float brightness;
uniform float directionForce;

const vec3 LIGHT = vec3(0.0, 10.0, -20.0);

float diffuse(vec3 N, vec3 L) {
	return max(dot(N, normalize(L)), 0.0);
}

vec3 diffuse(vec3 N, vec3 L, vec3 C) {
	return diffuse(N, L) * C;
}

void main() {
	vec3 color = vColor;

	// Shading
	float d = diffuse(vNormal, LIGHT) * contrast;
	d = mix(d, 1., .1) * brightness;
	color *= d;

	//float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
//gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

	// Fog
	float fogFactor = smoothstep( -200., -100., vDepth );
	color = mix(vec3(0., 0., 0.), color, fogFactor );

	// color += (vDirection * directionForce);

	gl_FragColor = vec4( color, 1.0 );
}
