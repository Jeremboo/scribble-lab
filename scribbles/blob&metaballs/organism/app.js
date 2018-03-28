import rm from 'RayMarcher';
import Organism from './Organism';

import { Clock } from 'three';

import {
  EffectComposer, RenderPass, BlurPass, BloomPass,
} from 'postprocessing';

// https://gitlab.com/Jeremboo/watermelon-sugar/blob/develop/src/js/webgl/index.js
const organism = new Organism();
organism.initGUI();

// Post processing
const clock = new Clock();
const composer = new EffectComposer(rm.renderer, {
  // stencilBuffer: true,
  // depthTexture: true,
});
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(rm.scene, rm.renderCamera);
// renderPass.renderToScreen = true;
composer.addPass(renderPass);

const bloomPass = new BloomPass({
  intensity: 5,
  resolution: 5,
  kernelSize: 3,
  distinction: 0.9,
});
bloomPass.renderToScreen = true;
composer.addPass(bloomPass);


// START
function animate() {
  requestAnimationFrame(animate);
  organism.update();
  // rm.update();
  composer.render(clock.getDelta());
  // rm.render();
}

function onResize(e) {
  rm.setSize(window.innerWidth, window.innerHeight);
}

function init() {
  rm.setMaterial(organism.material);

  window.addEventListener('resize', onResize, false);
  onResize();
  document.body.appendChild(rm.domElement);

  // start the loop
  animate();
}

init();


// /* ---- CREATING ZONE END ---- */
// class CameraMouseControl {
//   constructor(camera) {
//     this.t = 0;
//     this.speed = 0;
//     this.camera = camera;
//     this.lookAt = new Vector3();
//     this.position = { x: 0, y: 0 };
//     this.handleMouseMove = this.handleMouseMove.bind(this);
//     this.update = this.update.bind(this);
//     document.body.addEventListener('mousemove', this.handleMouseMove);
//   }
//   handleMouseMove(event) {
//     this.speed = ((event.clientX / window.innerWidth) - 0.5);
//     this.position.y = (((event.clientY / window.innerHeight) - 0.5) * 5);
//   }
//   update() {
//     this.t += 0.04 * this.speed;
//      // Position
//      this.camera.position.x = Math.cos(this.t) * 10;
//      this.camera.position.z = Math.sin(this.t) * 10;
//      this.camera.rotation.z = 10.3;
//     // this.camera.position.x += (this.position.x - this.camera.position.x) * 0.1;
//     this.camera.position.y += (this.position.y - this.camera.position.y) * 0.1;
//     for (let i = 0; i < bubbles.length; i++) {
//       bubbles[i].lookAt(this.camera.position)
//     }
//     this.camera.lookAt(this.lookAt);
//   }
// }
// const cameraControl = new CameraMouseControl(webgl.camera);
