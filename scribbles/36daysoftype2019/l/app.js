import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  ShaderMaterial, Mesh, Color, ShaderLib, UniformsUtils,
  AmbientLight, PointLight, DoubleSide, Vector3,
} from 'three';

import { TimelineMax, Power2, Power4 } from 'gsap'

import OBJLoader from 'OBJLoader';

import letterL from 'letter_l.obj';

import CameraMouseControl from 'CameraMouseControl';

import torsionVert from '../l/shaders/torsion.v.glsl';
import torsionFrag from '../l/shaders/torsion.f.glsl';

const MAIN_COLOR = '#ffffff';
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
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0.75, 0.5, 1.4);
    this.camera.lookAt(new Vector3());
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h);
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
const ambiantLight = new AmbientLight(0xD61474, 1);
webgl.add(ambiantLight);

const light1 = new PointLight( new Color('#DC415C'), 0.75, 100 );
light1.position.z = 1;
light1.position.x = 1;
webgl.add( light1 );

const light2 = new PointLight( new Color('#462ADF'), 0.75, 100 );
light2.position.z = 2;
light2.position.x = -1;
webgl.add( light2 );

// OBJECTS
class L extends Object3D {
  constructor(geometry) {
    super();

    const uniforms = UniformsUtils.merge([
      ShaderLib.standard.uniforms,
      {
        diffuse         : { value : new Color(MAIN_COLOR) },
        torsionForce    : { value : 0 },
      },
    ]);

    const mat = new ShaderMaterial({
      uniforms,
      vertexShader: torsionVert,
      fragmentShader: torsionFrag,
      lights: true,
      side : DoubleSide,
    });

    this.mesh = new Mesh(geometry, mat);

    geometry.computeBoundingBox();

    this.mesh.position.x = -geometry.boundingBox.max.x * 0.5;
    this.mesh.position.y = -geometry.boundingBox.max.y * 0.5;

    this.add(this.mesh)

    this.t = 0;

    this.timeline = new TimelineMax({ repeat : -1, paused : true });
    this.timeline.set(this.mesh.material.uniforms.torsionForce, { value : 0 })
    this.timeline.to(this.mesh.material.uniforms.torsionForce, 3, { value : 10, ease : Power2.easeOut });
    this.timeline.to(this.mesh.rotation, 3, { y : Math.PI * 0.6, ease : Expo.easeOut }, 0)
    this.timeline.to(this.mesh.material.uniforms.torsionForce, 2, { value : 0, ease : Elastic.easeOut.config(1, 0.3) }, 3);
    this.timeline.to(this.mesh.rotation, 2, { y : 0, ease : Elastic.easeOut.config(1, 0.2) }, 3)

    this.update = this.update.bind(this);
  }

  update() {

  }
}

const loader = new OBJLoader();
loader.load(letterL, obj => {
    const l = new L(obj.children[0].geometry);
    l.rotation.y = -Math.PI * 0.1;
    webgl.add(l);

    const tm = new TimelineMax({
    });
    tm.fromTo(l.position, 2, { y : -0.5, }, { y : 0, ease : Power4.easeOut });
    tm.fromTo(l.scale, 2, { x : 0.0001, y : 0.0001, z : 0.0001, }, { x : 1, y : 1, z : 1, ease : Power4.easeOut }, 0);
    tm.add(() => {
      l.timeline.play();
    }, '-=0.5');
	}, xhr => {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	}, (error) => {
		console.error(error);
	}
);


// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [0.1, -1],
  velocity: [0.1, 0.1],
});

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

function loop() {
  webgl.update();

  // Camera update
  cameraControl.update();

  requestAnimationFrame(loop);

}
loop();
