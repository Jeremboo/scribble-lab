varying vec3 vNormal;
varying vec3 vPosition;

void main()	{
  vNormal = normalMatrix * normal;
  vPosition = position;

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
