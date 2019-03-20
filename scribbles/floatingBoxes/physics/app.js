import {
  WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry,
  Mesh, Color, PlaneGeometry, ShadowMaterial,
  AmbientLight, DirectionalLight, MeshPhongMaterial, PCFSoftShadowMap,
} from 'three';
import p2 from 'p2';

import {
  getRandomFloat, getCameraVisionFieldSizeFromPosition, onCursorTouchMeshes, radians,
} from 'utils';


// GLOBAL
const NBR_OF_BOXES = 20;
const OCCURANCE_DELAY = 75;
const MAIN_COLOR = '#C9F0FF';
const SECONDARY_COLOR = '#070707';
const BACKGROUND_COLOR = '#ffffff';
// BOX
const BOX_SIZE_MIN = 0.5;
const BOX_SIZE_MAX = 1.5;
const BOX_FRICTION = 0.5;
const BOX_MASS = 5;
const BOX_ROTATION_Z = 0.1;
// INTERACTION
const FRICTION_BOX_OVERFLOWN = 0.1;
const FRICTION_BOX_TOUCHED = 0.9;

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
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 10);
    this.dom = this.renderer.domElement;

    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);

    this.viewSize = { width: -1, height: -1 };
    this.resize(w, h); // set render size
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
    this.renderer.render(this.scene, this.camera);
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    // Compute the width and the height of the visible scene
    this.viewSize = getCameraVisionFieldSizeFromPosition(this.camera.target, this.camera);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * 2D ENGINE
 * * *******************
 */

// ************
// * WORLD
const world = new p2.World({
  gravity: [0, 0],
  // gravity: [0, -9.82],
});

// ************
// * STAGE
// DEFINE THE BORDER LIMIT
const alfWidth = webgl.viewSize.width * 0.5;
const alfHeight = webgl.viewSize.height * 0.5;

// Floor
// V1 ----------------------------------------
// const floorBody = new p2.Body({
//   position: [0, -alfHeight],
// });
// const floor = new p2.Plane();
// floorBody.addShape(floor);
// world.addBody(floorBody);
// // Roof
// const roofBody = new p2.Body({
//   position: [0, alfHeight],
//   angle: radians(180),
// });
// const roof = new p2.Plane();
// roofBody.addShape(roof);
// world.addBody(roofBody);
// // Left Wall
// const wallLeftBody = new p2.Body({
//   position: [-alfWidth, 0],
//   angle: radians(-90),
// });
// const wallLeft = new p2.Plane();
// wallLeftBody.addShape(wallLeft);
// world.addBody(wallLeftBody);
// // Right Wall
// const wallRightBody = new p2.Body({
//   position: [alfWidth, 0],
//   angle: radians(90),
// });
// const wallRight = new p2.Plane();
// walRigthBody.addShape(wallRight);
// world.addBody(wallRightBody);

// V2 ----------------------------------------
const stageBody = new p2.Body();
world.addBody(stageBody);
const floor = new p2.Plane();
stageBody.addShape(floor, [0, -alfHeight]);
// Roof
const roof = new p2.Plane();
stageBody.addShape(roof, [0, alfHeight], radians(180));
// Left Wall
const wallLeft = new p2.Plane();
stageBody.addShape(wallLeft, [-alfWidth, 0], radians(-90));
// Right Wall
const wallRight = new p2.Plane();
stageBody.addShape(wallRight, [alfWidth, 0], radians(90));

/**
 * * *******************
 * * RENDER
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

// Lights
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.add(ambiantLight);
const directionalLight = new DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(
  -webgl.viewSize.width * 0.5,
  webgl.viewSize.height * 0.5,
  10,
);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadowDarkness = 0.2;
webgl.add(directionalLight);

// Box
class Box extends Mesh {
  constructor({
    size = getRandomFloat(BOX_SIZE_MIN, BOX_SIZE_MAX),
    mass = BOX_MASS,
    friction = BOX_FRICTION,
  } = {}) {
    // Create object
    const material = new MeshPhongMaterial({
      color: new Color(MAIN_COLOR),
    });
    const geometry = new BoxGeometry(size, size, size);
    super(geometry, material);
    this.castShadow = true;
    // this.receiveShadow = true;

    this.size = size;
    this.friction = friction;
    this.position.set(
      getRandomFloat(-0.5, 0.5),
      getRandomFloat(-0.5, 0.5),
      this.size * 0.5,
      );

    // Physic
    this.body = new p2.Body({
      mass,
      position: [this.position.x, this.position.y],
    });

    // Add a circle shape to the body
    this.shape = new p2.Box({ width: size, height: size });
    this.body.addShape(this.shape);
    world.addBody(this.body);

    this.update = this.update.bind(this);
  }

  /**
   * Apply an impulsion to the box
   * @param {Array[2]} impulseVector
   * @param {Array[2]} uv
   */
  applyImpulse(impulseVector, uv) {
    // TODO do not add impulse because it accumulate velocity.instead of just move a little more
    this.body.applyImpulse(
      impulseVector,
      [
        uv[0] * this.size,
        uv[1] * this.size,
      ],
    );
  }

  update() {
    // Apply friction
    // http://schteppe.github.io/p2.js/docs/classes/Body.html#method_applyDamping
    this.body.applyDamping(this.friction);
    // Update angle close to zero
    this.body.angle -= this.body.angle * BOX_ROTATION_Z;
    // Update 3D renderer
    this.position.set(...this.body.position, this.position.z);
    this.rotation.z = this.body.angle;
  }
}

/**
 * * *******************
 * * INTERACTIONS
 * * *******************
 */

let touchedBox = false;
let currentIntersectBox = false;
let currentMousePosition = { x: 0, y: 0 };

onCursorTouchMeshes(webgl.camera, webgl.scene.children, (intersects) => {
  currentIntersectBox =
    intersects[0] &&
    (intersects[0].object.uuid !== planeShadow.uuid) &&
    intersects[0]
  ;
  if (!currentIntersectBox) touchedBox = false;
});
document.body.addEventListener('mousedown', () => {
  if (currentIntersectBox) touchedBox = currentIntersectBox.object;
});
document.body.addEventListener('mouseup', () => {
  touchedBox = false;
});
document.body.addEventListener('mousemove', (e) => {
  const { x, y } = e;
  // Mouse interaction
  if (currentIntersectBox || touchedBox) {
    const friction = (touchedBox)
      ? FRICTION_BOX_TOUCHED
      : FRICTION_BOX_OVERFLOWN
    ;
    currentIntersectBox.object.applyImpulse([
      (x - currentMousePosition.x) * friction,
      (currentMousePosition.y - y) * friction,
    ], [
      currentIntersectBox.uv.x - 0.5,
      currentIntersectBox.uv.y - 0.5,
    ]);
  }
  currentMousePosition = { x, y };
});

/**
 * * *******************
 * * START
 * * *******************
 */
const boxes = [];
for (let i = 0; i < NBR_OF_BOXES; i++) {
  setTimeout(() => {
    const box = new Box();
    boxes.push(box);
    webgl.add(box);
  }, OCCURANCE_DELAY * i);
}

/**
 * * *******************
 * * RESIZE && LOOP
 * * *******************
 */
// LOOP
let lastTime;
const fixedTimeStep = 1 / 60; // seconds
const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
function loop(time) {
  webgl.update();

  // P2 update
  const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
  world.step(fixedTimeStep, deltaTime, maxSubSteps);
  lastTime = time;

  requestAnimationFrame(loop);
}
loop();

// RESIZE
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);

  // Resier stage
  wallLeft.position[0] = -(webgl.viewSize.width * 0.5);
  wallRight.position[0] = webgl.viewSize.width * 0.5;
  // floor.position[1] = -(webgl.viewSize.height * 0.5);
  // roof.position[1] = webgl.viewSize.height * 0.5;
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
