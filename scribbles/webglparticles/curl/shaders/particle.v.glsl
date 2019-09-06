precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

uniform sampler2D tSimulation;
uniform sampler2D tOldSimulation;
uniform sampler2D tForce;

attribute vec3 position;
attribute vec3 normal;

attribute vec2 aUvs;
attribute vec3 aColors;

varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vDirection;
varying float vDepth;

mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
	vec3 rr = vec3(sin(roll), cos(roll), 0.0);
	vec3 ww = normalize(target - origin);
	vec3 uu = normalize(cross(ww, rr));
	vec3 vv = normalize(cross(uu, ww));

	return mat3(uu, vv, ww);
}
void main() {
	vColor = aColors;
	vNormal = normal;

	vec3 texturePosition = texture2D(tSimulation, aUvs).xyz;
	vec3 oldTexturePosition = texture2D(tOldSimulation, aUvs).xyz;

	vec3 currentPosition = position;

	// scale
	vec3 force = texture2D(tForce, aUvs).xyz;
	currentPosition.z *= max(.8, length(force) * 0.01);

	// rotation of the mesh depending of the direction
	// https://github.com/spite/polygon-shredder/blob/master/index.html
	// l.556
	mat4 localRotation = mat4( calcLookAtMatrix( texturePosition, oldTexturePosition, 0.0 ) );
	currentPosition = (localRotation * vec4(currentPosition, 1.0)).xyz;

	  // Update the position depending on the FBO
  currentPosition += texturePosition;

  vDirection = texturePosition - oldTexturePosition;

  vec4 mvPosition = modelViewMatrix * vec4( currentPosition, 1.0 );
  vDepth = mvPosition.z;

  gl_Position = projectionMatrix * mvPosition;
}
