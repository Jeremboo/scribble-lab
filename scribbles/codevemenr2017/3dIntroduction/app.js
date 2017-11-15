import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, Color,
  Vector3, SplineCurve, Path, Object3D, MeshBasicMaterial, ShapeGeometry,
  FontLoader,
} from 'three';
import { TimelineLite } from 'gsap';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

import fontFile from './font'
import { getRandomFloat, getRandomInt } from 'utils';

/* --------------------------- */
/* ----------- CORE ---------- */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
 constructor(w, h) {
   this.meshCount = 0;
   this.meshListeners = [];
   this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
   this.renderer.setPixelRatio(window.devicePixelRatio);
   this.scene = new Scene();
   this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
   this.camera.position.set(0, 0, 10);
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
 remove(mesh) {
   const idx = this.meshListeners.indexOf(mesh.update);
    if (idx < 0) return;
    this.scene.remove(mesh);
    this.meshListeners.splice(idx, 1);
    this.meshCount--;

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
/* --------- CORE END -------- */
/* --------------------------- */

/* --------------------------- */
/* ------ CREATING ZONE ------ */

export default class AnimatedText extends Object3D {
  constructor(text, font, { size = 1, letterSpacing = 0.03, color = '#000000' } = {}) {
    super();

    this.basePosition = 0;
    this.size = size;

    const letters = [...text];
    letters.forEach((letter) => {
      if (letter === ' ') {
        this.basePosition += size * 0.5;
      } else {
        const geom = new ShapeGeometry(
          font.generateShapes(letter, size, 1),
        );
        geom.computeBoundingBox();
        const mat = new MeshBasicMaterial({
          color,
          opacity: 0,
          transparent: true,
        });
        const mesh = new Mesh(geom, mat);

        mesh.position.x = this.basePosition;
        this.basePosition += geom.boundingBox.max.x + letterSpacing;
        this.add(mesh);
      }
    });
  }
  show(duration = 0.6) {
    const tm = new TimelineLite();
    tm.set({}, {}, `+=${duration * 1.1}`)
    this.children.forEach((letter) => {
      const data = {
        opacity: 0,
        position: -0.5,
      };
      tm.to(data, duration, { opacity: 1, position: 0, ease: Back.easeOut.config(2), onUpdate: () => {
        letter.material.opacity = data.opacity;
        letter.position.y = data.position;
        letter.position.z = data.position * 2;
        letter.rotation.x = data.position * 2;
      } }, `-=${duration - 0.03}`);
    });
  }
}

// START
// load font
// https://gero3.github.io/facetype.js/
const fontLoader = new FontLoader()
const fontAsset = fontLoader.parse(fontFile);
const text = new AnimatedText('CODEVEMBER', fontAsset);
text.position.x -= text.basePosition * 0.5;
text.position.y -= 0.5;
webgl.add(text)
text.show();

// animate lines

/* ---- CREATING ZONE END ---- */
/* --------------------------- */

/* --------------------------- */
/* ------- CORE FOOTER ------- */
class CameraMouseControl {
  constructor(camera) {
    this.camera = camera;
    this.lookAt = new Vector3();
    this.position = { x: 0, y: 0 };
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.update = this.update.bind(this);
    document.body.addEventListener('mousemove', this.handleMouseMove);
  }
  handleMouseMove(event) {
    this.position.x = -((event.clientX / window.innerWidth) - 0.5) * 2;
    this.position.y = ((event.clientY / window.innerHeight) - 0.5) * 4;
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.lookAt);
  }
}
const cameraControl = new CameraMouseControl(webgl.camera);
function _onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', _onResize);
window.addEventListener('orientationchange', _onResize);
/* ---- LOOP ---- */
function _loop() {
  webgl.update();
  cameraControl.update();
  requestAnimationFrame(_loop);
}
_loop();
/* ----- CORE FOOTER END ----- */
/* --------------------------- */
