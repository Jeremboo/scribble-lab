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
  '#F6D2E6',
  '#8F71F0',
  '#5BC0F0',
];

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
/**/     this.camera.position.set(0, 0, 25);
/**/     this.controls = new OrbitControl(this.camera, this.renderer.domElement);
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
  //   intensity: 1,
  //   resolution: 0.9,
  //   kernelSize: 4,
  //   distinction: 2,
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

    this.t = 0;
    this.speedX = Math.random() * 0.9;
    this.amplX = (Math.random() * 0.1) + 0.1;
    this.speedY = (Math.random() * 0.1) + 0.1;
    this.amplY = Math.random() * 0.1;

    this.update = this.update.bind(this);
  }

  update() {
    this.t += this.speedX;
    this.position.x += Math.sin(this.t) * this.amplX;
    this.position.y += Math.cos(this.t) * this.amplY;
    this.position.z += Math.cos(this.t * 0.3) * this.amplY;

    this.lookAt(webgl.camera.position);
  }
}

// START
const bubbles = [];
const size = 2;
for (let i = 0; i < 50; i++) {
  const bubble = new Bubble(size);
  // bubble.scale.multiplyScalar(getRandomFloat(1, 2));
  bubbles.push(bubble);
  bubble.position.copy(getRandomPosAroundASphere(size * 0.2));
  webgl.add(bubble);
}


/* ---- CREATING ZONE END ---- */
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
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
