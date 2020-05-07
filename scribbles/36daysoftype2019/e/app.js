import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FontLoader, Vector3,
  UniformsUtils, AmbientLight, ShaderLib, DirectionalLight,
  TextBufferGeometry, PointLight, MeshStandardMaterial
} from 'three';

import { getRandomFloat } from '../../../modules/utils';

import fontFile from '../_assets/Glence Black_Regular';

import CameraMouseControl from '../../../modules/CameraMouseControl';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);


const MAIN_COLOR = '#D028C5';
const BACKGROUND_COLOR = '#040507';

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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(new Vector3(0, 0, 0));
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

 // Lights
const ambiantLight = new AmbientLight(0xffffff, 1);
webgl.add(ambiantLight);

const directionalLight = new DirectionalLight(new Color('#FF00BD'), 2 );
directionalLight.position.set(0, 10, 10);
webgl.add( directionalLight );

const light1 = new PointLight(new Color('#ff0040'), 2, 50 );
webgl.add( light1 );

const light2 = new PointLight(new Color('#13122A'), 2, 50 );
webgl.add( light2 );



// TODO : USE THAT => https://github.com/mattdesl/webgl-wireframes

export default class E extends Mesh {
  constructor() {

    const geometry = new TextBufferGeometry( 'E', {
      font,
      size: 2.5,
      height: 0.7,
      curveSegments: 12,
      // bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelSegments: 10
    } );
    geometry.computeBoundingBox();

    const uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        diffuse         : { value : new Color(MAIN_COLOR) },
        torsionForce    : { value : 0 },
      },
    ]);

    const material = new MeshStandardMaterial({
      color : new Color(MAIN_COLOR),
      wireframe : true,
    });

    super(geometry, material);

    this.position.x = -geometry.boundingBox.max.x * 0.5;
    this.position.y = -geometry.boundingBox.max.y * 0.5;
    this.position.z = -0.15

    this.t = 0;
  }
}


// START
for (let i = 0; i < 5; i++ ) {
  const e = new E(1, 3);
  e.position.x += getRandomFloat(-0.005, 0.005);
  e.position.y += getRandomFloat(-0.005, 0.005);
  e.position.z += getRandomFloat(-0.005, 0.005);
  webgl.add(e);
}

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-5, 5], velocity: [0.1, 0.1]});

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
let t = 0;

light1.position.x = 1;
light1.position.z = 1;

light2.position.x = -1;
light2.position.z = 1;

function loop() {
  t += 0.1;
  ambiantLight.intensity = Math.max(0.2, Math.min(1.2, ambiantLight.intensity + getRandomFloat(-0.1, 0.1)))
  directionalLight.position.y += Math.sin(t * 1);
  directionalLight.position.x += Math.cos(t + 10);

  light1.position.y += Math.sin(t * 0.2) * 0.5;
  light2.position.y += Math.cos(20 + t * 0.1) * 0.2;


  webgl.update();

  // Camera update
  cameraControl.update();

  requestAnimationFrame(loop);
}
loop();
