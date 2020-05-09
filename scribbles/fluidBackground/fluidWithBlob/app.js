import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Vector3,
  AmbientLight, Clock,
} from 'three';
import {
  EffectComposer, RenderPass, BlurPass,
} from 'postprocessing';
// import OrbitControls from 'vendors/OrbitControls';

import NoisePass from '../../../modules/NoisePass';

import Blob from './modules/Blob';
import props, { gui } from './modules/props';

const clock = new Clock();

/* ---- CORE ---- */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x100C0E);
    this.scene = new Scene();
    // this.scene.fog = new Fog(0xFEFEFE, 0.5, 20);

    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, -props.Y, 0);
    this.camera.lookAt(new Vector3(0, 0, 0));
    gui.add(props, 'Y', 0, 4, 0.01).onChange(() => {
      this.camera.position.y = -props.Y;
      this.camera.lookAt(new Vector3(0, 0, 0));
    });

    this.composer = false;
    this.passes = [];
    this.initPostprocessing();

    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
  }

  initPostprocessing() {
    this.composer = new EffectComposer(this.renderer, {
      // stencilBuffer: true,
      // depthTexture: true,
    });

    // *********
    // PASSES
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom
    this.passes.blurPass = new BlurPass({
      resolutionScale: props.BLUR_RESOLUTION,
      kernelSize: props.BLUR_KERNEL_SIZE,
    });
    // this.passes.blurPass.renderToScreen = true;
    this.composer.addPass(this.passes.blurPass);

    // NoisePass
    this.passes.noisePass = new NoisePass({
      speed: props.NOISE_SPEED,
      range: props.NOISE_RANGE,
      blackLayer: props.NOISE_BLACK_LAYER,
    });
    this.passes.noisePass.renderToScreen = true;
    this.composer.addPass(this.passes.noisePass);

    // *********
    // GUI
    const postProcessFolder = gui.addFolder('PostProcess');
    postProcessFolder.add(props.debug.postProcess, 'disabled').name('disable').onChange(() => {
      // TODO : loop for disable all passes
      this.passes.blurPass.enabled = !props.debug.postProcess.disabled;
      this.passes.noisePass.enabled = !props.debug.postProcess.disabled;

      // RenderToScreen for the renderPass
      this.composer.passes[0].renderToScreen = props.debug.postProcess.disabled;
    });
    const blurFolder = postProcessFolder.addFolder('BLUR');
    blurFolder.add(props, 'BLUR_RESOLUTION', 0, 1).name('RESOLUTION').onChange(() => {
      this.passes.blurPass.resolutionScale = props.BLUR_RESOLUTION;
      this.composer.setSize(this.width, this.height);
    });
    blurFolder.add(props, 'BLUR_KERNEL_SIZE', 0, 5).name('KERNEL_SIZE').step(1).onChange(() => {
      this.passes.blurPass.kernelSize = props.BLUR_KERNEL_SIZE;
    });
    const noiseFolder = postProcessFolder.addFolder('NOISE');
    noiseFolder.add(props, 'NOISE_RANGE', 0, 1).name('RANGE').onChange(() => {
      this.passes.noisePass.material.uniforms.range.value = props.NOISE_RANGE;
    });
    noiseFolder.add(props, 'NOISE_BLACK_LAYER', 0, 1).name('BLACK_LAYER').onChange(() => {
      this.passes.noisePass.material.uniforms.blackLayer.value = props.NOISE_BLACK_LAYER;
    });
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

    if (this.composer) {
      this.composer.render(clock.getDelta());
      return;
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(this.width, this.height);
    }
  }
}

const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);
/* ---- CREATING ZONE ---- */

// LIGHT
const ambiantLight = new AmbientLight(0xffffff, 0.5);
webgl.add(ambiantLight);

// OBJECTS
const blob = new Blob();
webgl.add(blob);

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
