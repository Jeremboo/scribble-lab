export const vertBlob = `float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}


uniform float timer;
uniform float complexity;
uniform float amplitude;
uniform float complexityAlpha;

varying float vDist;
varying float vColorDist;
varying float vAlphaDist;

void main()	{

  float displacement = noise(vec3( timer ) + position * complexity);
  vec3 newPos = position - position * displacement * amplitude;
  vDist = distance(position, newPos);

  float colorDisplacement = noise(vec3(4.0 + timer * 0.5) + position * 0.1);
  vec3 colorPos = position * colorDisplacement;
  vColorDist = distance(position, colorPos);

  float alphaDisplacement = noise(vec3(timer) + position * complexityAlpha);
  vec3 alphaPos = position * alphaDisplacement;
  vAlphaDist = distance(position, alphaPos);

  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPos, 1.0);
}
`;
export const fragBlob = `uniform vec3 color;
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
`;