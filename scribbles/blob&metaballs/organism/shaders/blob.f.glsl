
uniform vec2 resolution;
uniform sampler2D map;

uniform float sinAmpl;
uniform float sinFrequency;
uniform float sinSpeed;
uniform float pNoiseAmpl;
uniform float pNoiseFrequency;
uniform float pNoiseSpeed;
uniform float scatterScale;
uniform float scatterAmpl;
uniform float scatterSpeed;
uniform float scatterSeed;

uniform float blendDistance;

uniform float seed_1;
uniform float seed_2;
uniform float seed_3;
uniform float seed_4;
uniform float seed_5;
uniform float seed_6;
uniform float seed_7;
uniform float seed_8;
uniform float seed_9;
uniform float seed_10;

uniform vec3 diffuseColor;
uniform vec3 pinkColor;
uniform vec3 blueColor;
uniform float intensityColor;
uniform float mixColorGauge;
uniform float noisyColor;

uniform float rotationSpeed;
uniform float rotationX;

uniform float cameraRadius;

//uses most of the StackGL methods
//https://github.com/stackgl

//https://github.com/hughsk/glsl-square-frame
vec2 squareFrame(vec2 screenSize) {
  vec2 position = 2.0 * (gl_FragCoord.xy / screenSize.xy) - 1.0;
  position.x *= screenSize.x / screenSize.y;
  return position;
}


//https://github.com/stackgl/glsl-look-at/blob/gh-pages/index.glsl
mat3 calcLookAtMatrix(vec3 origin, vec3 target, float roll) {
  vec3 rr = vec3(sin(roll), cos(roll), 0.0);
  vec3 ww = normalize(target - origin);
  vec3 uu = normalize(cross(ww, rr));
  vec3 vv = normalize(cross(uu, ww));
  return mat3(uu, vv, ww);
}

//https://github.com/stackgl/glsl-camera-ray
vec3 getRay(mat3 camMat, vec2 screenPos, float lensLength) {
  return normalize(camMat * vec3(screenPos, lensLength));
}
vec3 getRay(vec3 origin, vec3 target, vec2 screenPos, float lensLength) {
  mat3 camMat = calcLookAtMatrix(origin, target, 0.0);
  return getRay(camMat, screenPos, lensLength);
}

/////////////////////////////////////////////////////////////////////////

// vec2 sphere( vec3 p, float radius, vec3 pos , vec4 quat)
// {
//     mat3 transform = rotationMatrix3( quat.xyz, quat.w );
//     float d = length( ( p * transform )-pos ) - radius;
//     return vec2(d,1);
// }
// OPTIMISATION MAMEN
vec2 sphere(vec3 p, float radius) {
  return vec2(length(p) - radius, 4.8);
}

//operations
vec2 unionAB(vec2 a, vec2 b){return vec2(min(a.x, b.x),1.);}
vec2 intersectionAB(vec2 a, vec2 b){return vec2(max(a.x, b.x),1.);}
vec2 blendAB( vec2 a, vec2 b, float t ){ return vec2(mix(a.x, b.x, t ),1.);}
vec2 subtract(vec2 a, vec2 b){ return vec2(max(-a.x, b.x),1.); }
//http://iquilezles.org/www/articles/smin/smin.htm
vec2 smin( vec2 a, vec2 b, float k ) {
  float h = clamp( 0.5+0.5*(b.x-a.x)/k, 0.0, 1.0 );
  vec2 mixed = mix( b, a, h );
  return vec2(mixed.x - k*h*(1.0-h), mixed.y);
}
//utils


//http://www.pouet.net/topic.php?post=367360
const vec3 pa = vec3(1., 57., 21.);
const vec4 pb = vec4(0., 57., 21., 78.);
float perlin(vec3 p) {
	vec3 i = floor(p);
	vec4 a = dot( i, pa ) + pb;
	vec3 f = cos((p-i)*acos(-1.))*(-.5)+.5;
	a = mix(sin(cos(a)*a),sin(cos(1.+a)*(1.+a)), f.x);
	a.xy = mix(a.xz, a.yw, f.y);
	return mix(a.x, a.y, f.z);
}

/////////////////////////////////////////////////////////////////////////

// STOP ! ! !

// HAMMER TIME !

/////////////////////////////////////////////////////////////////////////
float randomSphere(vec3 position, float seed) {
  // rotiantation of the mvt and litte rotation
  float orientation = (seed * 4.) + (seed * scatterSpeed * 0.5);
  // fluctive distance with the center
  float dist = sin(scatterSpeed + seed * 20.) * abs(scatterAmpl - (seed * 3.)) * scatterAmpl * 0.1;

  vec3 pos = vec3(
    position.x + (cos(orientation) * dist),
    position.y - (sin(orientation) * dist),
    position.z - (cos(orientation) * 1.)
  );

  return length(pos) - (scatterScale * seed * seed * 2.);
}


const int steps = 50;
const int shadowSteps = 4;
const int ambienOcclusionSteps = 3;
const float PI = 3.14159;
vec2 field( vec3 position ) {
    float sinuzoide = sin(sinSpeed + (position.y * sinFrequency)) * sinAmpl;
    float pNoise = perlin((position * pNoiseFrequency) + pNoiseSpeed) * pNoiseAmpl;

    // BIG BLOB ---------------------------------------------------------------------------------
    // scatter
    // vec3 p1 = position;
    // float orientation = scatterRot;
    // p1.x += cos(orientation) * sin(scatterSpeed) * scatterAmpl;
    // p1.y -= sin(orientation) * sin(scatterSpeed) * scatterAmpl;
    // p1.z -= sin(orientation) * sin(scatterSpeed) * scatterAmpl;
    //
    // vec2 mainSphere = sphere(p1, 0.1 * scatterScale, zero, quat) + sinuzoide + pNoise;
    // return mainSphere;

    // MULTIPLE SPHERES --------------------------------------------------------------------------
    vec2 mainSphere = vec2(randomSphere(position, 1.), 1.0);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_1), seed_1), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_2), seed_2), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_3), seed_3), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_4), seed_4), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_5), seed_5), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_6), seed_6), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_7), seed_7), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_8), seed_8), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_9), seed_9), blendDistance);
    mainSphere = smin(mainSphere, vec2(randomSphere(position, seed_10), seed_10), blendDistance);
    return mainSphere + sinuzoide + pNoise;
}

/////////////////////////////////////////////////////////////////////////

// the methods below this need the field function

/////////////////////////////////////////////////////////////////////////


//the actual raymarching from:
//https://github.com/stackgl/glsl-raytrace/blob/master/index.glsl

vec2 raymarching( vec3 rayOrigin, vec3 rayDir, float maxd, float precis ) {

    float latest = precis * 2.0;
    float dist   = 0.0;
    float type   = -1.0;
    vec2  res    = vec2(-1.0, -1.0);
    for (int i = 0; i < steps; i++) {

        if (latest < precis || dist > maxd) break;

        vec2 result = field( rayOrigin + rayDir * dist );
        latest = result.x;
        type   = result.y;
        dist  += latest;
    }

    if (dist < maxd) { res = vec2(dist, type); }
    return res;
}

//https://github.com/stackgl/glsl-sdf-normal

vec3 calcNormal(vec3 pos, float eps) {
  const vec3 v1 = vec3( 1.0,-1.0,-1.0);
  const vec3 v2 = vec3(-1.0,-1.0, 1.0);
  const vec3 v3 = vec3(-1.0, 1.0,-1.0);
  const vec3 v4 = vec3( 1.0, 1.0, 1.0);

  return normalize( v1 * field( pos + v1*eps ).x +
                    v2 * field( pos + v2*eps ).x +
                    v3 * field( pos + v3*eps ).x +
                    v4 * field( pos + v4*eps ).x );
}

vec3 calcNormal(vec3 pos) {
  return calcNormal(pos, 0.002);
}


//shadows & AO

//https://www.shadertoy.com/view/Xds3zN

float softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax, in float K )
{
	float res = 1.0;
    float t = mint;
    for( int i=0; i<shadowSteps; i++ )
    {
		float h = field( ro + rd*t ).x;
        res = min( res, K * h/t );
        t += clamp( h, 0.02, 0.10 );
        if( h<0.001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<ambienOcclusionSteps; i++ )
    {
        float hr = 0.01 + 0.12*float(i)/float( ambienOcclusionSteps );
        vec3 aopos =  nor * hr + pos;
        float dd = field( aopos ).x;
        occ += -(dd-hr)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}


vec3 rimlight( vec3 pos, vec3 nor )
{
    vec3 v = normalize(-pos);
    float vdn = 1.0 - max(dot(v, nor), 0.0);
    return vec3(smoothstep(0., 1.0, vdn));
}



void main() {
    // default color ( background ) --------------------------------------------------
    vec2 xy = gl_FragCoord.xy / resolution;

    // Linear gradient background
    // gl_FragColor = mix(
    //   vec4(0.9, 0.9, 0.9, 1.0),
    //   vec4(1., 1., 1., 1.0),
    //   smoothstep(0.1, 1.0, xy.x)
    // );
    // gl_FragColor = vec4(0.05, 0.11, 0.33, 0.96);
    // https://gamedev.stackexchange.com/questions/83853/how-to-implement-color-changing-fragment-shader
    gl_FragColor = vec4(0.02, 0.03, 0.07, 1.0);

    float cameraAngle   = 0.2;

    vec2  screenPos    = squareFrame( resolution );
    float lensLength   = 2.5;
    vec3  rayOrigin    = vec3( cameraRadius * sin(cameraAngle + rotationSpeed), rotationX, cameraRadius * cos(cameraAngle + rotationSpeed));
    vec3  rayTarget    = vec3(0, 0, 0);
    vec3  rayDirection = getRay(rayOrigin, rayTarget, screenPos, lensLength);


    float maxDist = 50.;
    vec2 collision = raymarching( rayOrigin, rayDirection, maxDist, .01 );

    if (collision.x > -0.5) {
        //"world" position
        vec3 pos = rayOrigin + rayDirection * collision.x;

        //normal vector
        vec3 nor = calcNormal( pos );

        // color
        vec3 col = vec3(0., 0., 0.);

        // Add diffuse color ------------------------------------------------------------------------
        col += (diffuseColor + collision.y) * noisyColor;
        // col += collision.y * collision.y * intensityColor;

        // Add mapping reflection (Spherical Environment Mapping) ------------------------------------
        // TODO AMELIORER CA C EST PAS MAL
        vec2 uv = nor.xy / 2. + .5;
        vec3 tex = texture2D( map, uv ).rgb;
        col += (tex * tex * tex) * .2;

        // Lighting -----------------------------------------------------------------------------------
        // vec3 lig0 = vec3(0., -0.2, 0.5);
        // float light0 = max(0.0, dot(lig0, nor)) * 0.2;

        vec3 lig1 = normalize( vec3( -.2, .2, .5) );
        vec3 color1 = vec3(.7, .7, .7);
        vec3 light1 = max( .0, dot( lig1, nor) ) * color1;
        col += light1 * .05;

        // Unknown but potentially cool effects ---------------------------------------------------------
        //AO : usually too strong
        // float occ = calcAO( pos, nor );
        // col -= occ * 0.2;

        //shadows ...?
        float sha = softshadow( pos, lig1, .025, 2.5, 2. );
        col -= max((.3 - sha), -.01) * .2;

        // float dep = ( ( collision.x + .5 ) / ( maxDist * .5 ) );
        // col -= dep * .1;

        // Mix 2 colors according to the colors ---------------------------------------------------------
        col -= mix(blueColor, pinkColor, smoothstep(-1.5, 2.5, clamp(pos.z + mixColorGauge, 0., 1.)));
        // TODO test with perlin perlin((position * pNoiseFrequency) + pNoiseSpeed) * pNoiseAmpl

        gl_FragColor = vec4(col * col * intensityColor, 1.);
    }
}
