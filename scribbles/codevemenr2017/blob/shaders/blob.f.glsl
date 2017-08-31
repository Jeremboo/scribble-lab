uniform vec3 color;
uniform vec3 color2;
uniform float colorTransition;

varying float vDist;
varying float vColorDist;
varying float vAlphaDist;

void main() {

  vec3 selectedColor = color;
  if (vColorDist > colorTransition) {
    selectedColor = color2;
  }

  float alpha = 0.0;
  float alphaTransition = colorTransition + 0.5;
  if (vAlphaDist > alphaTransition) {
    alpha = 1.0;
  }

  gl_FragColor = vec4(selectedColor + selectedColor * vDist * 0.5, alpha);
}
