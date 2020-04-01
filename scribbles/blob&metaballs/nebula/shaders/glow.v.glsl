uniform float scale;

varying vec2 vUv;

void main() {
  vUv = uv;

  // https://stackoverflow.com/questions/5467007/inverting-rotation-in-3d-to-make-an-object-always-face-the-camera/5487981#5487981
  // https://www.geeks3d.com/20140807/billboarding-vertex-shader-glsl/
  mat4 modelView = modelViewMatrix;
  modelView[0][0] = scale;
  modelView[0][1] = 0.0;
  modelView[0][2] = 0.0;
  modelView[1][0] = 0.0;
  modelView[1][1] = scale;
  modelView[1][2] = 0.0;
  modelView[2][0] = 0.0;
  modelView[2][1] = 0.0;
  modelView[2][2] = 1.0;

  vec4 mvPosition = modelView * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}

