import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  UniformsUtils, UniformsLib, ShaderMaterial,
  AmbientLight, Object3D,
  DirectionalLight, TextBufferGeometry, FontLoader,
} from 'three';

import CameraMouseControl from '../../../modules/CameraMouseControl';
import GPUSimulation from '../../../modules/GPUSimulation';

const fragInstanced = `uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;

uniform sampler2D videoTexture;
uniform float depthLightingForce;

varying vec2 vVideoUv;
varying float vDepth;

varying vec3 vColor;

#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <normalmap_pars_fragment>

void main() {
	vec3 video = texture2D(videoTexture, vVideoUv).xyz;

	vec4 diffuseColor = vec4(vColor, opacity);
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;

	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>

	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	outgoingLight += vViewPosition * 0.002;
	// outgoingLight -= vDepth * 0.01;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
}
`;
const vertInstanced = `
uniform sampler2D positions;
uniform vec2 tileGrid;

attribute vec2 fboUv;

varying vec2 vVideoUv;
varying vec3 vViewPosition;

varying float vDepth;

attribute vec3 color;
varying vec3 vColor;

#ifndef FLAT_SHADED
 varying vec3 vNormal;
#endif

#include <fog_pars_vertex>

mat4 rotationY( in float angle ) {
	return mat4(	cos(angle),		0,		sin(angle),	0,
			 				0,		1.0,			 0,	0,
					-sin(angle),	0,		cos(angle),	0,
							0, 		0,				0,	1);
}

mat4 scale(float x, float y, float z){
    return mat4(
        vec4(x,   0.0, 0.0, 0.0),
        vec4(0.0, y,   0.0, 0.0),
        vec4(0.0, 0.0, z,   0.0),
        vec4(0.0, 0.0, 0.0, 1.0)
    );
}

void main()	{
  vColor = color;

  // The UVs for an unique Tile
  vec2 planeUv = vec2(
    (position.x * 0.5) + 0.5,
    (position.y * 0.5) + 0.5
  );

  // The UVs of the whole grid
  vec2 pixellateVideoUv = vec2(
    fboUv.x,
    1. - fboUv.y
  );

  // The UVs to map the video on the grid
  vVideoUv = vec2(
    pixellateVideoUv.x + (planeUv.x / tileGrid.x),
    pixellateVideoUv.y + (planeUv.y / tileGrid.y)
  );


  // Basic vertex
  #ifndef FLAT_SHADED
   vNormal = normalize( transformedNormal );
  #endif

  vec3 pos = texture2D(positions, fboUv).xyz;
  float s = 1. + ((pos.z + pos.x) * 0.1);
  vec4 worldPosition = modelMatrix * vec4(position + pos, 1.0) * rotationY(pos.y * 0.5) * scale(
    s,
    s,
    s
    );

  vDepth = pos.z;

  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;


  gl_Position = projectionMatrix * mvPosition;

  #include <fog_vertex>
}`;
const shaderSimulationPosition = `
uniform sampler2D texture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 data = texture2D(texture, uv);

  vec3 newPosition = data.xyz;

  // Displace the initial position with the noise
  newPosition.y += data.w;
  newPosition.x -= data.w;
  gl_FragColor = vec4(newPosition, data.w);
}`;

import { getRandomAttribute } from '../../../modules/utils';


/**
* * *******************
* * PROPS
* * *******************
*/

const COLORS = ['#F29D60', '#F14982', '#5D34FB', '#D72FF7', '#EF2890'];
const WIREFRAME = false;
const SPACE = 40;

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color('#010101'));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 100);
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
  }
  add(mesh) {
    this.scene.add(mesh);
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

import fontFile from '../_assets/Glence Black_Regular';
import { getRandomFloat } from '../../../modules/utils';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);


/**
 * * *******************
 * * GRID OBJECT
 * * *******************
 */
class ParticleObject extends Object3D {
  constructor() {
    super();

    this.w = 80;
    this.h = 80;
    this.instanceCount = this.w * this.h;

    // Create the FBO simulation
    this.simulation = new GPUSimulation(webgl.renderer, { width : this.w, height : this.h });
    this.positionFBO = this.createFBOPosition();

    // Create the main mesh
    const material = this.createMaterial();
    const geometry = this.createInstanciedGeometry();

    this.mesh = new Mesh(geometry, material);
    this.add(this.mesh);

    // BIND
    this.update = this.update.bind(this);
  }

  /**
   * * *******************
   * * FBO Simulation
   */
  createFBOPosition() {
    // Create the data
    const dataPosition = this.simulation.createDataTexture();
    const textureArraySize = this.instanceCount * 4;

    for (let i = 0; i < textureArraySize; i += 4) {
      // V1 ----------------------------------------------------------------------------------------
      dataPosition.image.data[i] = getRandomFloat(-SPACE * 0.7, SPACE * 0.7);
      dataPosition.image.data[i + 1] = getRandomFloat(-SPACE * 5, SPACE * 0.5);
      dataPosition.image.data[i + 2] = getRandomFloat(-SPACE * 0.7, SPACE * 0.7);
      // V2 ----------------------------------------------------------------------------------------
      // const v = getrandomPosWithinASphere(getRandomFloat(-SPACE, SPACE));
      // dataPosition.image.data[i] = v.x;
      // dataPosition.image.data[i + 1] = v.y;
      // dataPosition.image.data[i + 2] = v.z;

      // Rotation speed
      dataPosition.image.data[i + 3] = getRandomFloat(-0.03, 0.03);
    }

    // Create the FBO simulation
    return this.simulation.createSimulation(
      'texturePosition', shaderSimulationPosition, dataPosition, {
        uniforms: {},
      },
    );
  }

  /**
   * * *******************
   * * Instance Mesh Methods
   */
  createMaterial() {
    const uniforms = UniformsUtils.merge([
      UniformsLib.common,
      UniformsLib.lights,
      {
        positions : { value: this.positionFBO.output.texture },
      },
    ]);

    return new ShaderMaterial({
      uniforms,
      vertexShader: vertInstanced,
      fragmentShader: fragInstanced,
      lights: true,
      wireframe : WIREFRAME,
      flatShading: FlatShading,
    });
  }

  createInstanciedGeometry() {

    const geometry = new TextBufferGeometry( '3', {
      font,
      size: 2.5,
      height: 0.7,
      curveSegments: 12,
      // bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelSegments: 10
    } );

    // Create custom FBO UV to have the good coordinate into the shader
    const fboUv = new InstancedBufferAttribute(
      new Float32Array(this.instanceCount * 2), 2,
    );
    const colors = new InstancedBufferAttribute(
      new Float32Array(this.instanceCount * 3), 3
    );
    for (let i = 0; i < this.instanceCount; i++) {
      const x = (i % this.w) / this.h;
      const y = (Math.floor((i / this.h)) / this.h);
      fboUv.setXY(i, x, y);

      const c = new Color(getRandomAttribute(COLORS));
      colors.setXYZ(i, c.r, c.g, c.b);
    }

    // Instance of the geometry + properties
    const instanciedGeometry = new InstancedBufferGeometry();
    instanciedGeometry.addAttribute('position', geometry.attributes.position);
    instanciedGeometry.addAttribute('fboUv', fboUv);
    instanciedGeometry.addAttribute('color', colors);

    return instanciedGeometry;
  }

  /**
   * * *******************
   * * Update
   */
  update() {
    // FBO update
    this.simulation.updateAll();
    // this.simulation.helper.update();
    // this.positionFBO.material.uniforms.perlinTime.value += WAVE_SPEED;

    // Instancied mesh update with the FBO
    this.mesh.material.uniforms.positions.value = this.positionFBO.output.texture;
  }
}

/**
 * * *******************
 * * SCENE
 * * *******************
 */

// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.scene.add(ambiantLight);

const directionalLight = new DirectionalLight(0xffffff, 0.3);
directionalLight.position.set(10, -4, 10);
webgl.scene.add(directionalLight);

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-100, -100], velocity: [0.1, 0.1]});


/**
 * * *******************
 * * START
 * * *******************
 */

const particles = new ParticleObject();
webgl.add(particles);

document.body.addEventListener('click', () => {
  particles.mesh.material.wireframe = !particles.mesh.material.wireframe;
});

/**
 * * *******************
 * * UPDATE
 * * *******************
 */
const update = () => {
  // Camera update
  cameraControl.update();

  particles.mesh.rotation.y += 0.002;
  webgl.update();
};

/**
 * * *******************
 * * RESIZE && LOOP
 * * *******************
 */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
// LOOP
function loop() {
  update();
  requestAnimationFrame(loop);
}
loop();
