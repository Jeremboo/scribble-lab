uniform sampler2D positions;

attribute vec2 coord;

varying vec4 vWorldPosition;

void main()	{

  vec3 pos = texture2D(positions, coord).xyz;

  vec4 worldPosition = modelMatrix * vec4(position + (pos * 20.0), 1.0);
	vWorldPosition = worldPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
