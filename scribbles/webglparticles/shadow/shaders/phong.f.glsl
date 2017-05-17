varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform vec3 color;
uniform vec3 ambientLightColor;
uniform float ambientLightIntensity;

uniform vec3 lightsPosition[NBR_OF_LIGHTS];
uniform float lightsDistance[NBR_OF_LIGHTS];
uniform float lightsIntensity[NBR_OF_LIGHTS];

void main()	{
  // Based in ambient light
  vec4 addedLights = vec4(ambientLightColor * ambientLightIntensity, 1.0);

  for(int l = 0; l < NBR_OF_LIGHTS; l++) {
    // Get the normalized directed light ray ( diff vect between light's position && && fragment position)
    vec3 lightDirection = normalize(lightsPosition[l] - vWorldPosition);

    // Get the scalar light value
    float diffuseLighting = clamp(dot(vNormal, lightDirection), 0.0, 1.0) * lightsIntensity[l];

    // add to the lights's vector
    addedLights.rgb += diffuseLighting;
  }

  gl_FragColor = vec4(color, 1.0) * addedLights;
}
