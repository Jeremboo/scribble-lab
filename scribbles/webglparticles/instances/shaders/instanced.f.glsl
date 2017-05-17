// #define SHADER_NAME fragInstanced
// #extension GL_OES_standard_derivatives : enable
// precision highp float;

varying vec3 vColor;

void main()	{
  gl_FragColor = vec4(vColor, 1.0);
}
