export const blobVert = `
  float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
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

  uniform float shapeAmplitude;
  uniform float shapeComplexity;
  uniform float shapeTimer;

  uniform float colorComplexity;
  uniform float colorTimer;

  uniform float alphaComplexity;
  uniform float alphaTimer;

  varying float vDist;
  varying float vColorDist;
  varying float vAlphaDist;

  vec3 noisyPosition(float timer, float complexity, float amplitude) {
    float displacement = noise(vec3( timer ) + position * complexity);
    vec3 noisyPos = position - position * displacement * amplitude;
    return noisyPos;
  }

  void main()	{

    vec3 newPos = noisyPosition(shapeTimer, shapeComplexity, shapeAmplitude);
    vDist = distance(position, newPos);

    vec3 colorPos = noisyPosition(colorTimer, colorComplexity, 1.0);
    vColorDist = distance(position, colorPos);

    vec3 alphaPos = noisyPosition(alphaTimer, alphaComplexity, 1.0);
    vAlphaDist = distance(position, alphaPos);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPos, 1.0);
  }
`;
export const blobFrag = `
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
`;