uniform vec3 color;
uniform vec3 color2;

uniform float colorRange;
uniform float colorAmplitude;

uniform float alphaRange;


varying float vDist;
varying float vColorDist;
varying float vAlphaDist;

void main() {

  // FIXME remplace if
  vec3 selectedColor = color;
  // if (vColorDist > colorRange) {
  //   selectedColor = color2;
  // }

  selectedColor = mix(color, color2, (vColorDist - colorRange) * colorAmplitude);

  float alpha = 0.0;
  if (vAlphaDist > alphaRange) {
    alpha = 1.0;
  }

  gl_FragColor = vec4(selectedColor + (selectedColor * vDist * 0.5), alpha);
}
