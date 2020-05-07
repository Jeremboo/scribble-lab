import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Raycaster,
  Mesh, PlaneGeometry, ShaderMaterial, TextureLoader,
  Vector2,
} from 'three';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import { getNormalizedPosFromScreen, getRandomFloat } from '../../../modules/utils';

import { bubbleVert, bubbleFrag } from '../_modules/shaders.glsl';


/**/ /* ---- CORE ---- */
/**/ const bgColor = '#ffffff';
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
/**/     this.renderer.render(this.scene, this.camera);
/**/   }
/**/   resize(w, h) {
/**/     this.camera.aspect = w / h;
/**/     this.camera.updateProjectionMatrix();
/**/     this.renderer.setSize(w, h);
/**/   }
/**/ }
/**/ const webgl = new Webgl(windowWidth, windowHeight);
/**/ document.body.appendChild(webgl.dom);
/**/
/**/
/* ---- CREATING ZONE ---- */

const props = {
  MOUSE_DIST: 0.3,
  MOUSE_VEL: 1,
  CENTER_VEL: 0.5,
  FORCE_VEL: 0.9,
};

// ###############
// BUBBLE
// ###############
class Bubble extends Mesh {
  constructor(backgroundTexture) {
    const geom = new PlaneGeometry(5, 5, 10, 10);
    const material = new ShaderMaterial({
      vertexShader: bubbleVert,
      fragmentShader: bubbleFrag,
      uniforms: {
        backgroundTexture: { type: 't', value: backgroundTexture },
        littleBubblePosition: { type: 'v2', value: new Vector2(0.5, 0.5) },
        color: { value: new Color('#00ff00') },
      },
      transparent: true,
      depthWrite: false,
    });
    super(geom, material);

    this.mouseIn = false;
    this.center = new Vector2(0.5, 0.5);
    this.mousePosition = new Vector2(0.5, 0.5);
    this.littleBubblePosition = new Vector2(0.5, 0.5);
    this.littleBubbleForce = new Vector2();

    this.update = this.update.bind(this);
  }

  update() {
    // Get mouse force
    const vecForce = this.mousePosition.clone().sub(this.littleBubblePosition);
    const force = Math.max(props.MOUSE_DIST - vecForce.length(), 0) * props.MOUSE_VEL;
    this.littleBubbleForce.add(vecForce.multiplyScalar(force));
    // Apply mouse force and decrement him
    this.littleBubblePosition.add(this.littleBubbleForce);
    this.littleBubbleForce.multiplyScalar(props.FORCE_VEL);
    // Apply gravity force (to the center)
    this.littleBubblePosition.add(this.center.clone().sub(this.littleBubblePosition).multiplyScalar(props.CENTER_VEL));

    // update material
    this.material.uniforms.littleBubblePosition.value = this.littleBubblePosition;
  }

  searchCollision(intersects) {
    let i = 0;
    let targetedObjectIntersected = false;
    while (i < intersects.length && !targetedObjectIntersected) {
      if (intersects[i].object.uuid === this.uuid) {
        targetedObjectIntersected = true;
        this.mouseIn = true;
        this.mousePosition = intersects[i].uv;
      }
      i += 1;
    }
    if (!targetedObjectIntersected && this.mouseIn) {
      this.mouseIn = false;
      this.mousePosition.set(0.5, 0.5);
    }
  }
}

// START
const bubbles = [];
// Load background image and create bubbles
const loader = new TextureLoader();
loader.load('https://i.imgur.com/462xXUs.png', (texture) => {
  if (!texture.img) {
    console.log('TEXTURE NOT LOADED');
  }
  for (let i = 0; i < 30; i++) {
    const bubble = new Bubble(texture);
    bubbles.push(bubble);
    bubble.position.set(
      getRandomFloat(-6, 6),
      getRandomFloat(-4, 4),
      getRandomFloat(-4, 4),
    );
    webgl.add(bubble);
  }
});

// Mouse event
const raycaster = new Raycaster();
const moveEvent = 'ontouchstart' in (window || navigator.msMaxTouchPoints) ? 'touchmove' : 'mousemove';
window.addEventListener(moveEvent, (e) => {
  const mouseVec = getNormalizedPosFromScreen(
    e.clientX || e.touches[0].clientX,
    e.clientY || e.touches[0].clientY,
  );
  raycaster.setFromCamera(mouseVec, webgl.camera);
  const intersects = raycaster.intersectObjects(webgl.scene.children);

  for (let i = 0; i < bubbles.length; i++) {
    bubbles[i].searchCollision(intersects);
  }
});

/* ---- CREATING ZONE END ---- */
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [3, 3]});

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
