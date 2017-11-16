import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, TextureLoader, Clock,
  Vector3,
} from 'three';
import {
  EffectComposer, RenderPass, BlurPass,
} from 'postprocessing';


import { getRandomFloat } from 'utils';

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
  renderPass.renderToScreen = true;
  this._composer.addPass(renderPass);

  // TODO add new custo pass (MASK PASS)
}

/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

// OBJECTS
class RandomGeometry extends Mesh {
  constructor() {
    super();

    this.material = new MeshBasicMaterial({
      color: new Color('#00ff00'),
      shading: FlatShading,
    });
    this.geometry = new BoxGeometry(1, 1, 1);
    this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += 0.03;
    this.rotation.y += 0.03;
  }
}

// START
// START
const bubbles = [];
// Load background image and create bubbles
const loader = new TextureLoader();
loader.load('https://i.imgur.com/462xXUs.png', (texture) => {
  for (let i = 0; i < 10; i++) {
    const bubble = new RandomGeometry(texture);
    bubbles.push(bubble);
    bubble.position.set(
      getRandomFloat(-6, 6),
      getRandomFloat(-4, 4),
      getRandomFloat(-4, 4),
    );
    webgl.add(bubble);
  }
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
    this.position.x = ((event.clientX / window.innerWidth) - 0.5) * 3;
    this.position.y = -((event.clientY / window.innerHeight) - 0.5) * 3;
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.1;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.1;
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
