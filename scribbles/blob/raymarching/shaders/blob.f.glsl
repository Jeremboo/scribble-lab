
uniform vec2 resolution;
uniform float time;
uniform sampler2D map;

uniform float sinAmpl;
uniform float sinFrequency;
uniform float sinSpeed;
uniform float pNoiseAmpl;
uniform float pNoiseFrequency;
uniform float pNoiseSpeed;
uniform float scatterScale;
uniform float scatterRot;
uniform float scatterAmpl;
uniform float scatterSpeed;
uniform float scatterSeed;

uniform float blendDistance;

//uses most of the StackGL methods
//https://github.com/stackgl

//https://github.com/hughsk/glsl-square-frame

vec2 squareFrame(vec2 screenSize) {
  vec2 position = 2.0 * (gl_FragCoord.xy / screenSize.xy) - 1.0;
  position.x *= screenSize.x / screenSize.y;
  return position;
}
vec2 squareFrame(vec2 screenSize, vec2 coord) {
  vec2 position = 2.0 * (coord.xy / screenSize.xy) - 1.0;
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

mat3 rotationMatrix3(vec3 axis, float angle)
{
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;

    return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c          );
}

/////////////////////////////////////////////////////////////////////////

//primitives

vec2 sphere( vec3 p, float radius, vec3 pos , vec4 quat)
{
    mat3 transform = rotationMatrix3( quat.xyz, quat.w );
    float d = length( ( p * transform )-pos ) - radius;
    return vec2(d,1);
}

vec2 roundBox(vec3 p, vec3 size, float corner, vec3 pos, vec4 quat )
{
    mat3 transform = rotationMatrix3( quat.xyz, quat.w );
    return vec2( length( max( abs( ( p-pos ) * transform )-size, 0.0 ) )-corner,1.);
}

vec2 torus( vec3 p, vec2 radii, vec3 pos, vec4 quat )
{
    mat3 transform = rotationMatrix3( quat.xyz, quat.w );
    vec3 pp = ( p - pos ) * transform;
    float d = length( vec2( length( pp.xz ) - radii.x, pp.y ) ) - radii.y;
    return vec2(d,1.);
}

vec2 cone( vec3 p, vec2 c, vec3 pos, vec4 quat  )
{
    mat3 transform = rotationMatrix3( quat.xyz, quat.w );
    vec3 pp = ( p - pos ) * transform;
    float q = length(pp.xy);
    return vec2( dot(c,vec2(q,pp.z)), 1. );
}

//http://www.pouet.net/topic.php?post=365312
vec2 cylinder( vec3 p, float h, float r, vec3 pos, vec4 quat ) {
    mat3 transform = rotationMatrix3( quat.xyz, quat.w );
    vec3 pp = (p - pos ) * transform;
    return vec2( max(length(pp.xz)-r, abs(pp.y)-h),1. );
}


//operations

vec2 unionAB(vec2 a, vec2 b){return vec2(min(a.x, b.x),1.);}
vec2 intersectionAB(vec2 a, vec2 b){return vec2(max(a.x, b.x),1.);}
vec2 blendAB( vec2 a, vec2 b, float t ){ return vec2(mix(a.x, b.x, t ),1.);}
vec2 subtract(vec2 a, vec2 b){ return vec2(max(-a.x, b.x),1.); }
//http://iquilezles.org/www/articles/smin/smin.htm
vec2 smin( vec2 a, vec2 b, float k ) { float h = clamp( 0.5+0.5*(b.x-a.x)/k, 0.0, 1.0 ); return vec2( mix( b.x, a.x, h ) - k*h*(1.0-h), 1. ); }

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


const int steps = 50;
const int shadowSteps = 4;
const int ambienOcclusionSteps = 3;
const float PI = 3.14159;
vec2 field( vec3 position ) {
    //position
    vec3 zero = vec3(0.);
    // rotation
    vec4 quat = vec4( 1., .1 , 0., .2 );
    // FIELD EXAMPLES ---------------------------------------------------------------------------------
    // //noise
    // vec3 noise = position * .25;
    // // noise += time * .1;
    // float pnoise = 1. + perlin( noise );
    // //box
    // vec2 rb = roundBox( position, vec3(2.0,2.0,2.0),  0.5, zero, quat + vec4( 1., 1., 1., PI / 4. ) );
    // //torus
    // vec2 to0 = torus( position, vec2( 4.0,.15), zero, vec4( 1., 0., 0., 0. + time * .2 ) );
    // vec2 to1 = torus( position, vec2( 4.0,.15), zero, vec4( 0., 0., 1., PI *.5 + time * .2 ) );
    // //spheres
    // vec2 sre = sphere( position, 3.0, zero, quat );
    // vec2 sce = sphere( position, 1., zero, quat ) + perlin( position + time ) * .25;
    // //composition
    // return smin(sce, smin(to0, smin(to1, subtract(sre, rb), pnoise), pnoise), pnoise);

    // BIG BLOB ---------------------------------------------------------------------------------
    // scatter
    vec3 p1 = position;
    float orientation = scatterRot;
    p1.x += cos(orientation) * sin(scatterSpeed) * scatterAmpl;
    p1.y -= sin(orientation) * sin(scatterSpeed) * scatterAmpl;
    p1.z -= sin(orientation) * sin(scatterSpeed) * scatterAmpl;

    float sinuzoide = sin(sinSpeed + (p1.y * sinFrequency)) * sinAmpl;
    float pNoise = perlin((p1 * pNoiseFrequency) + pNoiseSpeed) * pNoiseAmpl;
    vec2 mainSphere = sphere(p1, 3. - scatterScale, zero, quat) + sinuzoide + pNoise;
    // return mainSphere;

    // MULTIPLE SPHERES --------------------------------------------------------------------------
    vec3 p_1 = position;
    float or_1 = scatterRot + 10.2;
    p_1.x += cos(or_1) * sin(scatterSpeed) * scatterAmpl;
    p_1.y -= sin(or_1) * sin(scatterSpeed) * scatterAmpl;
    p_1.z -= sin(or_1) * sin(scatterSpeed) * scatterAmpl;
    mainSphere = smin(mainSphere, sphere(p_1, 1., zero, quat), blendDistance);

    vec3 p_2 = position;
    float or_2 = scatterRot + 20.2;
    p_2.x += cos(or_2) * sin(scatterSpeed + 10.) * scatterAmpl;
    p_2.y -= sin(or_2) * sin(scatterSpeed + 10.) * scatterAmpl;
    p_2.z -= sin(or_2) * sin(scatterSpeed + 10.) * scatterAmpl;
    mainSphere = smin(mainSphere, sphere(p_2, 1., zero, quat), blendDistance);

    vec3 p_3 = position;
    float or_3 = scatterRot + 32.;
    p_3.x += cos(or_3) * sin(scatterSpeed + 14.) * scatterAmpl;
    p_3.y -= sin(or_3) * sin(scatterSpeed + 14.) * scatterAmpl;
    p_3.z += sin(or_3) * sin(scatterSpeed + 14.) * scatterAmpl;
    mainSphere = smin(mainSphere, sphere(p_3, 1., zero, quat), blendDistance);
    
    // float size = 0.2 + 0.1 * abs(cos(time));
    // vec3 q1 = position;
    
    // const int n = 10;
    // for (int i = 1; i < n; i++){
    //     float distX = -sin(time) * 0.4;
    // 	float distY = cos(time) * 0.4;

    //     // size = abs(cos(float(n) * size));
    //     q1 += vec3(distX, distY, 0.);
    // 	vec2 d1 = sphere(q1, sin(float(i) * 3.) * .8, zero, quat);

    // 	float blendDistance = .8;
    // 	d = smin(d, d1, blendDistance);
    // }
    
    return mainSphere;
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
    vec3 color0 = vec3(0.35, 0.47, 0.56); // blue
    vec3 color1 = vec3(0.90, 0.76, 0.85); // purple

    // default color ( background ) --------------------------------------------------
    // vec2 xy = gl_FragCoord.xy / resolution;
    // gl_FragColor = vec4( mix( color0, color1, sin( xy.y + 0.5 ) ) * 2., 1. );

    float cameraAngle   = 0.; // 0.8 * time;
    float cameraRadius  = 20.;

    vec2  screenPos    = squareFrame( resolution );
    float lensLength   = 2.5;
    vec3  rayOrigin    = vec3( cameraRadius * sin(cameraAngle), 0., cameraRadius * cos(cameraAngle));
    vec3  rayTarget    = vec3(0, 0, 0);
    vec3  rayDirection = getRay(rayOrigin, rayTarget, screenPos, lensLength);


    float maxDist = 50.;
    vec2 collision = raymarching( rayOrigin, rayDirection, maxDist, .01 );

    if (collision.x > -0.5) {
        //"world" position
        vec3 pos = rayOrigin + rayDirection * collision.x;

        //diffuse color
        vec3 col = vec3( .8,.8,.8 );

        //normal vector
        vec3 nor = calcNormal( pos );

        //reflection (Spherical Environment Mapping)
        vec2 uv = nor.xy / 2. + .5;
        vec3 tex = texture2D( map, uv ).rgb;
        col += tex * .1;

        vec3 lig0 = normalize( vec3(-0.5, 0.75, -0.5) );
        vec3 light0 =  max( 0.0, dot( lig0, nor) ) * color0;

        vec3 lig1 = normalize( vec3( 0.5, -0.75, 0.5) );
        vec3 light1 = max( 0.0, dot( lig1, nor) ) * color1;

        //AO : usually too strong
        float occ = calcAO( pos, nor );

        //shadows ...?
        // float sha = softshadow( pos, lig0, .025, 2.5, 2. );

        float dep = ( ( collision.x + .5 ) / ( maxDist * .5 ) );
        gl_FragColor = vec4( ( col + light0 + light1 ) * occ * dep, 1. );
    }
}
