export const particleFrag = `
  precision highp float;

  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vDirection;
  varying float vDepth;

  uniform float contrast;
  uniform float brightness;
  uniform float directionForce;

  const vec3 LIGHT = vec3(0.0, 10.0, -20.0);

  float diffuse(vec3 N, vec3 L) {
    return max(dot(N, normalize(L)), 0.0);
  }

  vec3 diffuse(vec3 N, vec3 L, vec3 C) {
    return diffuse(N, L) * C;
  }

  void main() {
    vec3 color = vColor;

    // Shading
    float d = diffuse(vNormal, LIGHT) * contrast;
    d = mix(d, 1., .1) * brightness;
    color *= d;

    //float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
  //gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

    // Fog
    float fogFactor = smoothstep( -200., -100., vDepth );
    color = mix(vec3(0., 0., 0.), color, fogFactor );

    // color += (vDirection * directionForce);

    gl_FragColor = vec4( color, 1.0 );
  }
`;

export const particleVert = `
  precision highp float;

  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;

  uniform sampler2D tSimulation;
  uniform sampler2D tOldSimulation;
  uniform sampler2D tForce;

  attribute vec3 position;
  attribute vec3 normal;

  attribute vec2 aUvs;
  attribute vec3 aColors;

  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vDirection;
  varying float vDepth;

  mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
    vec3 rr = vec3(sin(roll), cos(roll), 0.0);
    vec3 ww = normalize(target - origin);
    vec3 uu = normalize(cross(ww, rr));
    vec3 vv = normalize(cross(uu, ww));

    return mat3(uu, vv, ww);
  }
  void main() {
    vColor = aColors;
    vNormal = normal;

    vec3 texturePosition = texture2D(tSimulation, aUvs).xyz;
    vec3 oldTexturePosition = texture2D(tOldSimulation, aUvs).xyz;

    vec3 currentPosition = position;

    // scale
    vec3 force = texture2D(tForce, aUvs).xyz;
    currentPosition.z *= max(.8, length(force) * 0.01);

    // rotation of the mesh depending of the direction
    // https://github.com/spite/polygon-shredder/blob/master/index.html
    // l.556
    mat4 localRotation = mat4( calcLookAtMatrix( texturePosition, oldTexturePosition, 0.0 ) );
    currentPosition = (localRotation * vec4(currentPosition, 1.0)).xyz;

      // Update the position depending on the FBO
    currentPosition += texturePosition;

    vDirection = texturePosition - oldTexturePosition;

    vec4 mvPosition = modelViewMatrix * vec4( currentPosition, 1.0 );
    vDepth = mvPosition.z;

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const positionFrag = `
  precision highp float;

  uniform sampler2D texture;
  uniform sampler2D t_currentForce;
  uniform float expantion;
  uniform float complexity;
  uniform float speed;

  /* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
  vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r-0.5;
  }

  const float F3 =  0.3333333;
  const float G3 =  0.1666667;
  float snoise(vec3 p) {

    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));

    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e*(1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy*(1.0 - e);

    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0*G3;
    vec3 x3 = x - 1.0 + 3.0*G3;

    vec4 w, d;

    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);

    w = max(0.6 - w, 0.0);

    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);

    w *= w;
    w *= w;
    d *= w;

    return dot(d, vec4(52.0));
  }

  vec3 snoiseVec3( vec3 x ){

    float s  = snoise(vec3( x ));
    float s1 = snoise(vec3( x.y - 19.1 , x.z + 33.4 , x.x + 47.2 ));
    float s2 = snoise(vec3( x.z + 74.2 , x.x - 124.5 , x.y + 99.4 ));
    vec3 c = vec3( s , s1 , s2 );
    return c;

  }


  vec3 curlNoise( vec3 p ){

    const float e = .1;
    vec3 dx = vec3( e   , 0.0 , 0.0 );
    vec3 dy = vec3( 0.0 , e   , 0.0 );
    vec3 dz = vec3( 0.0 , 0.0 , e   );

    vec3 p_x0 = snoiseVec3( p - dx );
    vec3 p_x1 = snoiseVec3( p + dx );
    vec3 p_y0 = snoiseVec3( p - dy );
    vec3 p_y1 = snoiseVec3( p + dy );
    vec3 p_z0 = snoiseVec3( p - dz );
    vec3 p_z1 = snoiseVec3( p + dz );

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const float divisor = 1.0 / ( 2.0 * e );
    return normalize( vec3( x , y , z ) * divisor );

  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec3 position = texture2D(texture, uv).xyz;
    vec3 force = texture2D(t_currentForce, uv).xyz;

    // Apply the force to attract the position to the center
    position += force;

    // Apply noise on the position
    position += curlNoise((position * complexity) + expantion) * speed;

    gl_FragColor = vec4(position, 1.0);
  }
`;
export const velocityFrag = `
  precision highp float;

  uniform sampler2D texture;
  uniform sampler2D t_currentPosition;
  uniform sampler2D t_infos;
  uniform vec3 mousePosition;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec3 currentForce = texture2D( texture, uv ).xyz;
    vec3 currentPosition = texture2D( t_currentPosition, uv ).xyz;
    vec3 infos = texture2D( t_infos, uv ).xyz;

    vec3 dist = mousePosition - currentPosition;

    vec3 force = normalize(dist) * min(.2, max(.001, length(dist) - infos.z));
    currentForce += force * infos.x;
    currentForce *= infos.y;

    gl_FragColor = vec4(currentForce, 1.0);
  }
`;