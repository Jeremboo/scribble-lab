// #define SHADER_NAME vertInstanced
// precision highp float;
// uniform mat4 modelViewMatrix;
// uniform mat4 projectionMatrix;
// attribute vec3 position;
attribute vec3 mcol0;
attribute vec3 mcol1;
attribute vec3 mcol2;
attribute vec3 mcol3;

attribute vec3 color;

varying vec3 vColor;

void main()	{

  mat4 matrix = mat4(
    vec4(mcol0, 0),
    vec4(mcol1, 0),
    vec4(mcol2, 0),
    vec4(mcol3, 1)
  );

  vec3 positionEye = (modelViewMatrix * matrix * vec4(position, 1.0)).xyz;

  vColor = color;

  gl_Position = projectionMatrix * vec4(positionEye, 1.0);
}
