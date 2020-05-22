import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, TextureLoader, Clock,
  Raycaster, Vector3,
} from 'three';

import {
  EffectComposer, RenderPass,
} from 'postprocessing';

import Bubble from '../_modules/Bubble';

import AnimatedText3D from '../../../modules/AnimatedText3D';
import IncrustationPass from '../../../modules/IncrustationPass';
import { getRandomFloat } from '../../../utils';
import { getNormalizedPosFromScreen } from '../../../utils/three';

const mask3 = './assets/bubble_mask_1.jpg';

const BACKGROUND_COLOR = '#ffffff';

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
const clock = new Clock();
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 10);
    this.dom = this.renderer.domElement;

    this.composer = false;
    this.passes = {};
    this.initPostprocessing();

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
    this.scene.remove(mesh);
    if (!mesh.update) return;
    const index = this.meshListeners.indexOf(mesh.update);
    if (index > -1) this.meshListeners.splice(index, 1);
    this.meshCount--;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    // this.renderer.render(this.scene, this.camera);
    this.composer.render(clock.getDelta());
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  // POST PROCESSING
  initPostprocessing() {
    this.composer = new EffectComposer(this.renderer, {
      // stencilBuffer: true,
      // depthTexture: true,
    });

    // *********
    // PASSES
    const renderPass = new RenderPass(this.scene, this.camera);
    // renderPass.renderToScreen = true;
    this.composer.addPass(renderPass);

    this.incrustationPass = new IncrustationPass();
    this.incrustationPass.renderToScreen = true;
    this.composer.addPass(this.incrustationPass);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */


let bubbles = [];
let isReady = false;
let mouseVec = { x: 0, y: 0 };
const raycaster = new Raycaster();
// Load background image and create bubbles
const loader = new TextureLoader();

function updateBubbles() {
  // Add bubble
  if (bubbles.length < 60 && Math.random() > 0.85) {
    const bubble = new Bubble(new Vector3(
      getRandomFloat(-6, 6),
      getRandomFloat(-10, 1),
      getRandomFloat(-10, 8),
    ),
    getRandomFloat(0.1, 6), // Scale
    getRandomFloat(0.02, 0.06), // Speed
    );
    bubbles.push(bubble);
    webgl.add(bubble);
    bubble.show();
  }

  // Remove hidden bubbles
  bubbles = bubbles.filter((bubble) => {
    const isDead = (bubble.position.y > 10);
    if (isDead) webgl.remove(bubble);
    return !isDead;
  });

  // Update UVs
  raycaster.setFromCamera(mouseVec, webgl.camera);
  const intersects = raycaster.intersectObjects(bubbles);

  // Handle interset
  let i, j;
  // Check each bubbles
  for (i = 0; i < bubbles.length; i++) {
    // Check if the current bubble is intersected
    let isIntersected = false;
    if (intersects.length > 0) {
      j = 0;
      while (j < intersects.length && !isIntersected) {
        if (intersects[j].object.uuid === bubbles[i].uuid) {
          isIntersected = true;
          bubbles[i].handleMouseMove(intersects[j].uv);
        }
        j += 1;
      }
    }
    // Else, call mouse Out
    if (!isIntersected && bubbles[i].mouseIn) {
      bubbles[i].mouseOut();
    }
  }
}


// START
loader.load(mask3, (texture) => {
  isReady = true;
  webgl.incrustationPass.material.uniforms.tIncrustation.value = texture;
  const text = new AnimatedText3D('Bubbles.', {
    size: 1,
    letterSpacing: 0.01,
  });
  text.position.x -= text.basePosition * 0.5;
  text.position.y -= 0.5;
  webgl.add(text);

  setTimeout(() => {
    text.show(1);
  }, 2500);
});

/* ---- CREATING ZONE END ---- */
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
    // Update the camera position
    this.position.x = ((event.clientX / window.innerWidth) - 0.5) * 4;
    this.position.y = -((event.clientY / window.innerHeight) - 0.5) * 1.5;

    // Looking for bubble touched
    mouseVec = getNormalizedPosFromScreen(
      event.clientX || event.touches[0].clientX,
      event.clientY || event.touches[0].clientY,
    );
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.1;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.1;
    this.camera.lookAt(this.lookAt);
  }
}
const cameraControl = new CameraMouseControl(webgl.camera);

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
  webgl.update();
  cameraControl.update();
  if (isReady) updateBubbles();
  requestAnimationFrame(loop);
}
loop();
