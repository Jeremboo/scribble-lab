import {
  WebGLRenderer, Scene,
  Mesh, Color, PlaneGeometry, MeshBasicMaterial,
  AmbientLight, DirectionalLight, PCFSoftShadowMap, ShadowMaterial,
  OrthographicCamera,
} from 'three';

import FloatingCube from 'FloatingCube';


const MAIN_COLOR = '#C9F0FF';
const SECONDARY_COLOR = '#070707';
const BACKGROUND_COLOR = '#ffffff';

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap; // default THREE.PCFShadowMap
    this.scene = new Scene();

    // this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera = new OrthographicCamera(-5 * (w / h), 5 * (w / h), 5, -5, 1, 1000);
    this.camera.position.set(0, 0, 10);

    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
  }
  add(mesh) {
    this.scene.add(mesh);
    if (mesh.update) this.addLoop(mesh.update);
  }
  addLoop(update) {
    this.meshListeners.push(update);
    this.meshCount++;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * ENVIRONMENT
 * * *******************
 */

// Plane
const planeShadowMaterial = new ShadowMaterial({
  color: new Color(SECONDARY_COLOR),
});
planeShadowMaterial.opacity = 0.05;

const planeShadow = new Mesh(new PlaneGeometry(10, 8, 1), planeShadowMaterial);
planeShadow.receiveShadow = true;
webgl.add(planeShadow);

const plane = new Mesh(
  new PlaneGeometry(12, 10, 1),
  new MeshBasicMaterial({
    color: BACKGROUND_COLOR,
  }),
);
webgl.add(plane);

// Lights
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.add(ambiantLight);
const directionalLight = new DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(-2, 1, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
webgl.add(directionalLight);
// const pointLight = new PointLight(0xfff7d7, 0.05);
// pointLight.position.set(-2, 1, 1);
// webgl.add(pointLight);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

// Floating object
function createFloatingCube(x = 0, y = 0, props) {
  const floatingObj = new FloatingCube(x, y, Object.assign({ color: MAIN_COLOR }, props));
  webgl.add(floatingObj);
}

// V1 --------------------------------------------------------------------------------------------------------------------
// const NBR_OF_CUBES = 15;
// const FREQUENCY = 0.9;
// let nbrOfCubes = 0;
// webgl.addLoop(() => {
//   if (nbrOfCubes <= NBR_OF_CUBES && Math.random() > FREQUENCY) {
//     nbrOfCubes++;
//     createFloatingCube(
//       getRandomFloat(-4, 4),
//       getRandomFloat(-3, 3),
//       { scale: 1 }
//     );
//   }
// });

// V2 --------------------------------------------------------------------------------------------------------------------
const MARGIN = 0.15;
const RECURCIVE_RANDOM = 0.3;

const LEFT  = 'left';
const RIGHT = 'right';
const UP    = 'top';
const DOWN  = 'bottom';
function createCubeGroup(x, y, scale, forbidenFaces = []) {
  // create the current cube
  createFloatingCube(x, y, { scale, force: 0.003 });

  setTimeout(() => {
    // Compute the new sizes
    const newScale = scale * 0.4;
    const border = (scale * 0.5) - (newScale * 0.5);
    const pos = (scale * 0.5) + (newScale * 0.5) + MARGIN;

    if (newScale > 0.1) {
      // LEFT
      if (Math.random() > RECURCIVE_RANDOM && forbidenFaces.indexOf(LEFT) === -1) {
        (Math.random() > 0.5)
          ? createCubeGroup(x - pos, y + border, newScale, [...forbidenFaces, RIGHT]) // Left - Up
          : createCubeGroup(x - pos, y - border, newScale, [...forbidenFaces, RIGHT]) // Left - Down
        ;
      }
      // RIGTH
      if (Math.random() > RECURCIVE_RANDOM && forbidenFaces.indexOf(RIGHT) === -1) {
        (Math.random() > 0.5)
          ? createCubeGroup(x + pos, y + border, newScale, [...forbidenFaces, LEFT]) // Right - Up
          : createCubeGroup(x + pos, y - border, newScale, [...forbidenFaces, LEFT]) // Right - Down
        ;
      }
      // UP
      if (Math.random() > RECURCIVE_RANDOM && forbidenFaces.indexOf(UP) === -1) {
        (Math.random() > 0.5)
          ? createCubeGroup(x - border, y + pos, newScale, [...forbidenFaces, DOWN]) // Up - Left
          : createCubeGroup(x + border, y + pos, newScale, [...forbidenFaces, DOWN]) // Up - Right
        ;
      }
      // DOWN
      if (Math.random() > RECURCIVE_RANDOM && forbidenFaces.indexOf(DOWN) === -1) {
        (Math.random() > 0.5)
          ? createCubeGroup(x - border, y - pos, newScale, [...forbidenFaces, UP]) // Down - Left
          : createCubeGroup(x + border, y - pos, newScale, [...forbidenFaces, UP]) // Down - Right
        ;
      }
    }
  }, 200);
}
createCubeGroup(0, 0, 3.5);

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
  requestAnimationFrame(loop);
}
loop();
