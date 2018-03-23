import {
  WebGLRenderer, Scene, PerspectiveCamera,
  MeshBasicMaterial, Mesh, Color, TextureLoader, Clock,
  Vector3, PlaneBufferGeometry, ShaderMaterial, SphereGeometry, DoubleSide,
  MeshDepthMaterial,
} from 'three';
import {
  EffectComposer, RenderPass, BlurPass, BloomPass,
} from 'postprocessing';


import OrbitControl from 'OrbitControl';

import MetaballPass from 'MetaballPass';

import fragMetaball from './shaders/metaball.f.glsl';
import vertMetaball from './shaders/metaball.v.glsl';

import { getRandomFloat, radians, getRandomPosAroundASphere } from 'utils';

const clock = new Clock();

const COLORS = [
  '#e7a7cb',
  '#ac99ee',
  '#85cced',
];

const props = {
  amplitude: 0.09,
  speed: 0.2,
};

/**/ /* ---- CORE ---- */
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 35);
// this.controls = new OrbitControl(this.camera, this.renderer.domElement);
/**/     this.dom = this.renderer.domElement;

  this._composer = false;
  this._passes = {};
  this.initPostprocessing();

/**/     this.update = this.update.bind(this);
/**/     this.resize = this.resize.bind(this);
/**/     this.resize(w, h); // set render size
/**/   }
/**/   add(mesh) {
/**/     this.scene.add(mesh);
/**/     if (!mesh.update) return;
/**/     this.meshListeners.push(mesh.update);
/**/     this.meshCount++;
/**/   }
/**/   update() {
/**/     let i = this.meshCount;
/**/     while (--i >= 0) {
/**/       this.meshListeners[i].apply(this, null);
/**/     }
/**/    // this.renderer.render(this.scene, this.camera);
          this._composer.render(clock.getDelta());
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this.renderer.setSize(w, h);
        this._composer.setSize(w, h);
/**/   }

initPostprocessing() {
  this._composer = new EffectComposer(this.renderer, {
    // stencilBuffer: true,
    // depthTexture: true,
  });

  // *********
  // PASSES
  const renderPass = new RenderPass(this.scene, this.camera);
  // renderPass.overrideMaterial = new MeshDepthMaterial();
  // renderPass.renderToScreen = true;
  this._composer.addPass(renderPass);


  const metaballPass = new MetaballPass();
  metaballPass.renderToScreen = true;
  this._composer.addPass(metaballPass);

  // const bloomPass = new BloomPass({
  //   intensity: 10,
  //   resolution: 0.9,
  //   kernelSize: 4,
  //   distinction: 20,
  // });
  // bloomPass.renderToScreen = true;
  // this._composer.addPass(bloomPass);
}

/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

class Bubble extends Mesh {
  constructor(size) {
    const geom = new PlaneBufferGeometry(size, size, size, 1);
    // const geom = new SphereGeometry(size, 32, 32, 0, Math.PI)
    // const geom = new SphereGeometry(size, 32, 32)
    const material = new ShaderMaterial({
      vertexShader: vertMetaball,
      fragmentShader: fragMetaball,
      uniforms: {
        color: { type: 'c', value: new Color(COLORS[Math.floor(Math.random() * COLORS.length)]) },
      },
      transparent: true,
      depthWrite: false,
      // depthTest: false,
      side: DoubleSide,
    });
    super(geom, material);

    this.t = Math.random() * 1000;
    this.speed = getRandomFloat(-props.speed, props.speed);
    this.amplitude = getRandomFloat(-props.amplitude, props.amplitude);

    this.update = this.update.bind(this);
  }

  update() {
    this.t += this.speed;
    this.position.x += Math.sin(this.t) * this.amplitude;
    this.position.y += Math.cos(this.t) * this.amplitude;
    this.position.z += Math.cos(this.t * 0.04) * this.amplitude * 0.1;

    this.lookAt(webgl.camera.position);
  }
}

// START
const size = 3;
const bubbles = [];
for (let i = 0; i < 50; i++) {
  const bubble = new Bubble(size);
  // bubble.scale.multiplyScalar(getRandomFloat(1, 2));
  bubbles.push(bubble);
  bubble.position.copy(getRandomPosAroundASphere(size * 0.2));
  webgl.add(bubble);
}


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
    this.position.x = -((event.clientX / window.innerWidth) - 0.5) * 80;
    this.position.y = ((event.clientY / window.innerHeight) - 0.5) * 40;
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.5;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.5;
    this.camera.lookAt(this.lookAt);
  }
}
const cameraControl = new CameraMouseControl(webgl.camera);
/**/
/**/
/**/ /* ---- ON RESIZE ---- */
/**/ function onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', onResize);
/**/ window.addEventListener('orientationchange', onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/ 	webgl.update();
      cameraControl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
