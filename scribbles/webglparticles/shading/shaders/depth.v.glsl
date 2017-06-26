attribute vec3 mcol0;
attribute vec3 mcol1;
attribute vec3 mcol2;
attribute vec3 mcol3;

varying vec4 vWorldPosition;

void main()	{

  mat4 matrix = mat4(
    vec4(mcol0, 0),
    vec4(mcol1, 0),
    vec4(mcol2, 0),
    vec4(mcol3, 1)
  );
  vec3 pos = (matrix * vec4(position, 1.0)).xyz;

  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
	vWorldPosition = worldPosition;

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
