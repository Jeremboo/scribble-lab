import {
  WebGLRenderer, Scene,
  Mesh, Color, PlaneGeometry, MeshBasicMaterial,
  Vector3, AmbientLight, DirectionalLight, PCFSoftShadowMap, ShadowMaterial,
  OrthographicCamera,
} from 'three';

import FloatingCube from '../_modules/FloatingCube';


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
let floatingCube = false;
function createFloatingCube(x = 0, y = 0, props) {
  floatingCube = new FloatingCube(x, y, props);
  webgl.add(floatingCube);
}

createFloatingCube(0, 0, { scale: 4, color: MAIN_COLOR, disapear: false });

/**
 * * *******************
 * * MOUSE FORCE VECTOR
 * * *******************
 */

const oldPosition = { x: 0, y: 0 };
const newPosition = { x: 0, y: 0 };
const force = new Vector3();

function handleMouseMove(e) {
  newPosition.x = e.x || e.clientX || (e.touches && e.touches[0].clientX);
  newPosition.y = e.y || e.clientY || (e.touches && e.touches[0].clientY);

  force.x = newPosition.x - oldPosition.x || 0;
  force.y = oldPosition.y - newPosition.y || 0;

  const vel = force.length() * 0.009;
  force.normalize().multiplyScalar(vel);

  oldPosition.x = newPosition.x;
  oldPosition.y = newPosition.y;


  floatingCube.applyForce(new Vector3(
    -force.y,
    force.x,
    0,
  ));
}

window.addEventListener('mousemove', handleMouseMove);

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
