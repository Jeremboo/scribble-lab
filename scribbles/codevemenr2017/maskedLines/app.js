import {
  WebGLRenderer, Scene, PerspectiveCamera, Vector3,
  Clock, Mesh, MeshBasicMaterial, BoxGeometry, Color,
  TextureLoader,
} from 'three';

import {
  EffectComposer, RenderPass,
} from 'postprocessing';

import Wind, { WindLine } from 'Wind'
import IncrustationPass from 'IncrustationPass'

import { getRandomFloat } from 'utils';

const clock = new Clock();

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
   this.camera.position.set(0, 0, 5);
   this.dom = this.renderer.domElement;

   this._composer = false;
   this._passes = {};
   this.initPostprocessing();


   this.update = this.update.bind(this);
   this.resize = this.resize.bind(this);
   this.resize(w, h); // set render size
 }
  initPostprocessing() {
    this._composer = new EffectComposer(this.renderer, {
      // stencilBuffer: true,
      // depthTexture: true,
    });

   // *********
   // PASSES
    const renderPass = new RenderPass(this.scene, this.camera);
    // renderPass.renderToScreen = true;
    this._composer.addPass(renderPass);

    const incrustationPass = new IncrustationPass();
    incrustationPass.renderToScreen = true;
    this._composer.addPass(incrustationPass);
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
   // this.renderer.render(this.scene, this.camera);
   this._composer.render(clock.getDelta());
 }
 resize(w, h) {
   this.camera.aspect = w / h;
   this.camera.updateProjectionMatrix();
   this.renderer.setSize(w, h);
   this._composer.setSize(w, h);
 }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);
/* --------- CORE END -------- */
/* --------------------------- */

/* --------------------------- */
/* ------ CREATING ZONE ------ */

class CustomWindLine extends WindLine {
  constructor(props) {
    super(props);
    // console.log(this.material.uniforms.dashOffset)
    this.dying = 0;
    this.material.uniforms.dashOffset.value = 2;
    this.material.uniforms.opacity.value = 1;
  }
  update() {
    this.material.uniforms.dashOffset.value -= this.speed;
  }
}
// CUSTOM2
class CustomWindLine2 extends WindLine {
  constructor(props) {
    super(props);
    // console.log(this.material.uniforms.dashOffset)
    this.dying = 2;
    this.material.uniforms.dashOffset.value = 0;
    this.material.uniforms.opacity.value = 1;
  }
  update() {
    this.material.uniforms.dashOffset.value += this.speed;
  }
  isDied() {
    return this.material.uniforms.dashOffset.value > this.dying;
  }
}

const loader = new TextureLoader();
loader.load('https://i.imgur.com/462xXUs.png', (texture) => {

  // ADD CUSTOM PASS
  webgl._composer.passes[1].material.uniforms.tIncrustation.value = texture


  const windLines = new Wind({ frequency: 0.1, speed: 0.009 });
  windLines.addWindLine = () => {
    const line = new CustomWindLine({
      turbulence: 0.5,
      length: getRandomFloat(4, 5),
      disruptedOrientation: getRandomFloat(2, 1),
    });
    line.position.set(
      getRandomFloat(-1.8, -1.5),
      getRandomFloat(-1.8, -1.5),
      getRandomFloat(-1, 0),
    );
    windLines.lines.push(line);
    windLines.add(line);
    windLines.lineNbr++;
  }
  webgl.add(windLines);

  const windLines2 = new Wind({ frequency: 0.1, speed: 0.009 });
  windLines2.addWindLine = () => {
    const line = new CustomWindLine2({
      turbulence: 0.5,
      length: getRandomFloat(4, 5),
      disruptedOrientation: getRandomFloat(2, 1),
    });
    line.position.set(
      getRandomFloat(-1.8, -1.5),
      getRandomFloat(-1.8, -1.5),
      getRandomFloat(-1, 0),
    );
    windLines2.lines.push(line);
    windLines2.add(line);
    windLines2.lineNbr++;
  }
  webgl.add(windLines2);
});


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
