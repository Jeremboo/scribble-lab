import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshToonMaterial, Mesh, Color, FlatShading, PlaneBufferGeometry,
  AmbientLight, DirectionalLight,
  Vector3,
} from 'three';

import { addCursorMoveListener, getDistBetweenTwoVec2 } from 'utils';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#A3BCF9';
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
/**/     this.camera.position.set(0, 1, 10);
// this.camera.lookAt(new Vector3(0, 0, 0))
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
      addInLoop(update) {
        this.meshListeners.push(update);
        this.meshCount++;
      }
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

const COLUMNS = 5;
const PROJECTS_NUMBER = 30;

const PANEL = {
  w: 1.5,
  h: 1.5,
  m: 0.08,
};
const AREA = 2;
const AMPL = 0.4;

// OBJECTS
class Panel extends Mesh {
  constructor() {
    const geometry = new BoxGeometry(PANEL.w, PANEL.h, 0.05);
    const material = new MeshToonMaterial({
      color: new Color(secondaryColor),
      flatShading: FlatShading,
      // wireframe: true,
    });
    super(geometry, material);

    this.targetedZ = 0;

    this.update = this.update.bind(this);
  }

  updatePosition(position) {
    const { dist } = getDistBetweenTwoVec2(
      this.position.x,
      this.position.y,
      position.x,
      position.y,
    );
    // TODO update rotation
    if (dist < AREA) {
      // TODO aimanté la carré à la position
      this.targetedZ = (AREA - dist) * AMPL;
    } else {
      this.targetedZ = 0;
    }
  }

  update() {
    this.position.z += (this.targetedZ - this.position.z) * 0.3;
  }
}

// START

// LIGHTS
// const pointLight = new DirectionalLight(0x20498f, 0.5);
// pointLight.position.set(-20, -5, 30);
// webgl.add(pointLight);
const pointLightBlue = new DirectionalLight(0xffffff);
pointLightBlue.position.set(0, 2, 2);
webgl.add(pointLightBlue);
const ambientLight = new AmbientLight(0xFDF0F3, 0.1);
webgl.add(ambientLight);

// PANNELS
const panels = [];
// place panels
for (let i = 0; i < PROJECTS_NUMBER; i++) {
  const panel = new Panel();
  panel.position.set(
    (i % COLUMNS) * (PANEL.w + PANEL.m),
    -Math.floor(i / COLUMNS) * (PANEL.h + PANEL.m),
    0,
  );
  webgl.add(panel);
  panels.push(panel);
}
// ##############
// place tracer
// ##############
const anchorTopLeft = new Vector3(
  panels[0].position.x,
  panels[0].position.y,
  -0.1,
);
const anchorBottomRight = new Vector3(
  panels[panels.length - 1].position.x,
  panels[panels.length - 1].position.y,
  -0.1,
);
const vectorToCenterize = anchorBottomRight.clone().sub(anchorTopLeft).multiplyScalar(0.5);
// anchorTopLeft.sub(vectorToCenterize);
// anchorBottomRight.sub(vectorToCenterize);
for (let i = 0; i < PROJECTS_NUMBER; i++) {
  panels[i].position.sub(vectorToCenterize);
}
const tracer = new Mesh(
  new PlaneBufferGeometry(
    (anchorBottomRight.x - anchorTopLeft.x) + 1,
    (anchorTopLeft.y - anchorBottomRight.y) + 0.5,
    1
  ),
  new MeshToonMaterial({ color: 0xff0000, visible: false })
);
// tracer.position.add(vectorToCenterize);
webgl.add(tracer);

addCursorMoveListener(tracer, webgl.camera, webgl.scene, (intersect) => {
  for (let i = 0; i < PROJECTS_NUMBER; i++) {
    panels[i].updatePosition(intersect.point);
  }
});

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
