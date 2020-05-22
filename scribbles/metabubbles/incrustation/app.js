import {
  WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, TextureLoader, Clock,
} from 'three';
import {
  EffectComposer, RenderPass,
} from 'postprocessing';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import IncrustationPass from '../../../modules/IncrustationPass';

import { getRandomFloat } from '../../../utils';

const clock = new Clock();


/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#C9F0FF';
/**/ const bgColor = false // 'rgb(0, 0, 0)';
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
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
/**/     // this.renderer.render(this.scene, this.camera);
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
  // renderPass.renderToScreen = true;
  this._composer.addPass(renderPass);

  // TODO add new custo pass (MASK PASS)
  this.incrustationPass = new IncrustationPass();
  this.incrustationPass.renderToScreen = true;
  this._composer.addPass(this.incrustationPass);
}

/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

// OBJECTS
class RandomCube extends Mesh {
  constructor() {
    const material = new MeshBasicMaterial({
      color: new Color('#00ff00'),
    });
    const geometry = new BoxGeometry(1, 1, 1);
    super(geometry, material);

    this.position.set(
      getRandomFloat(-4, 4),
      getRandomFloat(-3, 3),
      getRandomFloat(-2, 5),
    );

    this.scale.set(
      getRandomFloat(0.2, 2),
      getRandomFloat(0.2, 2),
      getRandomFloat(0.2, 2),
    );

    this.speed = getRandomFloat(0.01, 0.05);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += this.speed;
    this.rotation.y += this.speed;
  }
}

// START
// START
const cubes = [];
// Load background image and create bubbles
const loader = new TextureLoader();
loader.load('https://i.imgur.com/462xXUs.png', (texture) => {
  webgl.incrustationPass.material.uniforms.tIncrustation.value = texture;
  for (let i = 0; i < 15; i++) {
    const cube = new RandomCube(texture);
    cubes.push(cube);
    webgl.add(cube);
  }
});

/* ---- CREATING ZONE END ---- */
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [3, 3], velocity : [0.1, 0.1]});

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
