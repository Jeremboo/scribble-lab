varying vec3 vNormal;
varying vec3 vPosition;

uniform vec3 color;
uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;

uniform vec3 lightsPosition[NBR_OF_LIGHTS];
uniform float lightsDistance[NBR_OF_LIGHTS];
uniform float lightsDiffuse[NBR_OF_LIGHTS];

float rand(float n){return fract(sin(n) * 43758.5453123);}


void main()	{
  // Based in ambient light
  vec4 addedLights = vec4(ambientLightColor * ambientLightIntensity, 1.0);

  float diffuse = 0.0;

  for(int l = 0; l < NBR_OF_LIGHTS; l++) {
    // Get the normalized directed light ray ( diff vect between light's position && && fragment position)
    vec3 lightDirection = normalize(lightsPosition[l] - vPosition);

    // Get the scalar light value
    float diffuseLighting = max(dot(vNormal, lightDirection), 0.0) * lightsDiffuse[l];


    // add to the lights's vector
    // float celIntensity = ceil(diffuseLighting * 8.0) / 8.0;
    addedLights.rgb += diffuseLighting;
    diffuse += diffuseLighting;
  }

  // TODO find a way to do not update the noise
  float noiseValue = rand(vPosition.x * vPosition.y);
  float diff = noiseValue - diffuse;

  vec3 c = color;
  if (diff > 0.49) {
    // diffuseLighting = 1. - diff;
    c -= addedLights.rgb;
  } else {
    // diffuseLighting = 0.5;
  }

  c += (addedLights.rgb * 0.1);


  gl_FragColor = vec4(c, 1.0);
}
