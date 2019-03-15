import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, SphereBufferGeometry,
  Mesh, FlatShading, Color,
  ShaderMaterial, PointLightHelper, AmbientLight, PointLight,
  Vector3, Quaternion,
} from 'three';
import OrbitControls from 'OrbitControl';
import { GUI } from 'dat.gui';

import vertShadow from './shaders/shadow.v.glsl';
import fragShadow from './shaders/shadow.f.glsl';

/* ---- CORE ---- */
const bgColor = 0x222222;
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    if (bgColor) this.renderer.setClearColor(new Color(bgColor));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 150);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
/* ---- CREATING ZONE ---- */


const props = {
  showTardetedResult: false,
  rotationSpeed: 0.01,
  LIGHTS: [
    {
      position: new Vector3(60, 100, 100),
      distance: 700,
      intensity: 0.9,
    },
    /*{
      position: new Vector3(50, 0, 0),
      distance: 200,
      intensity: 0.8,
    },
    {
      position: new Vector3(0, 0, -50),
      distance: 200,
      intensity: 1,
    },*/
  ],
};

const worldToLocalDirection = (object, worldDirectionVector) => {
  object.updateMatrixWorld();
  const quat = new Quaternion();
  object.getWorldQuaternion(quat)
  return new Vector3().copy(worldDirectionVector).applyQuaternion(quat.inverse());
};

// ##
// SHADER
// https://learnopengl.com/#!Lighting/Basic-Lighting
// https://csantosbh.wordpress.com/2014/01/09/custom-shaders-with-three-js-uniforms-textures-and-lighting/
// http://blog.edankwan.com/post/three-js-advanced-tips-shadow
// https://aerotwist.com/tutorials/an-introduction-to-shaders-part-2/
// TODO : http://www.mathematik.uni-marburg.de/~thormae/lectures/graphics1/code/WebGLShaderLightMat/ShaderLightMat.html

// ##
// LIGHT
const ambientLight = new AmbientLight(0xffffff, 0.3);
webgl.scene.add(ambientLight);
let i;
const lights = [];
for (i = 0; i < props.LIGHTS.length; i++) {
  const { intensity, distance, position } = props.LIGHTS[i];
  const light = new PointLight(0xffffff, intensity, distance);
  light.position.copy(position);
  webgl.scene.add(light);
  lights.push(light);
}

// ##
// OBJECT
class NoisedObject extends Object3D {
  constructor(showTargetedResult) {
    super();
    const color = new Color('#F46B41');

    // ##
    // MATERIAL
    const colorVec3 = new Vector3(color.r, color.g, color.b);
    const uniforms = {};
    uniforms.color = {
      type: 'vec3',
      value: colorVec3,
    };
    uniforms.ambientLightColor = {
      type: 'vec3',
      value: new Vector3(ambientLight.color.r, ambientLight.color.g, ambientLight.color.b),
    };
    uniforms.ambientLightIntensity = {
      type: 'f',
      value: ambientLight.intensity,
    };
    uniforms.lightsPosition = {
      type: 'vec3v',
      value: this.getLightsWorldPosition(),
    };
    uniforms.lightsDistance = {
      type: 'fv1',
      value: lights.map(light => light.distance),
    };
    uniforms.lightsDiffuse = {
      type: 'fv1',
      value: lights.map(light => light.intensity),
    };
    this.material = new ShaderMaterial({
      vertexShader: vertShadow,
      fragmentShader: fragShadow,
      uniforms,
      shading: FlatShading,
      defines: { NBR_OF_LIGHTS: lights.length },
    });

    this.geometry = new SphereBufferGeometry(20, 32, 32);
    this.mesh = new Mesh(this.geometry, this.material);

    this.mesh.scale.y = 0.55;
    this.rotation.x = Math.PI * 0.5;

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  getLightsWorldPosition() {
    return lights.map(light => worldToLocalDirection(webgl.camera, light.position));
  }

  update() {
    // this.rotation.x += props.rotationSpeed;
    // this.rotation.y += props.rotationSpeed;

    // Update world position & rotation
    this.material.needsUpdate = true;
    if (this.material.uniforms) this.material.uniforms.lightsPosition.value = this.getLightsWorldPosition();
  }
}

// ##
// START
const noisedObject = new NoisedObject();
webgl.add(noisedObject);


// add light helpers
for (i = 0; i < props.LIGHTS.length; i++) {
  const helper = new PointLightHelper(lights[i], lights[i].distance * 0.01);
  webgl.scene.add(helper);
}

/* ---- CREATING ZONE END ---- */
/* ---- ON RESIZE ---- */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
/* ---- LOOP ---- */
function _loop() {
	webgl.update();
	requestAnimationFrame(_loop);
}
_loop();
