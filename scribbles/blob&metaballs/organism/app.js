import { Clock } from 'three';
import {
  EffectComposer, RenderPass
} from 'postprocessing';

import rm from '../../../modules/RayMarcher';
import Organism from './Organism';



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
renderPass.renderToScreen = true;
composer.addPass(renderPass);

// const bloomPass = new BloomPass({
//   intensity: 5,
//   resolution: 5,
//   kernelSize: 3,
//   distinction: 0.9,
// });
// bloomPass.renderToScreen = true;
// composer.addPass(bloomPass);


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