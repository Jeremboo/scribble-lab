import {
  WebGLRenderer, Scene,
  Mesh, Color, PlaneGeometry, MeshBasicMaterial,
  Vector3, AmbientLight, DirectionalLight, PCFSoftShadowMap, ShadowMaterial,
  OrthographicCamera, Raycaster, VideoTexture,
  LinearFilter, RGBFormat,
} from 'three';

import FloatingCube from 'FloatingCube';
import TransitionalTextureMaterial from 'TransitionalTextureMaterial';

import { getNormalizedPosFromScreen } from 'utils';

import omniwomenURL from 'Omniwomen.mp4';
import sweetPursuitURL from 'SweetPursuit.mp4';

// PROPS
const MAIN_COLOR = '#C9F0FF';
const SECONDARY_COLOR = '#070707';
const BACKGROUND_COLOR = '#ffffff';

const HAS_TOUCH = 'ontouchstart' in document.documentElement ||
  navigator.maxTouchPoints > 0 ||
  navigator.msMaxTouchPoints > 0
;

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
    this.camera.left = -5 * (w / h);
    this.camera.right = 5 * (w / h);
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

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

// Cube variable
let floatingCube = false;

// Interaction variables
let currentCubeIntersect = false;
let cubeDragged = false;
const mouseRaycaster = new Raycaster();
const draggingVector = new Vector3();
const draggingPoint = new Vector3();

// Material variables
let texture1 = false;
let texture2 = false;
let videoOmniwomen = false;
let videoSweetPursuit = false;
const textureTransitionMaterial = new TransitionalTextureMaterial(
  texture1,
  texture2,
  {
    isVideo: true,
    transitionDuration: 0.5,
  },
);

/**
 * * *******************
 * * CREATE CUBE TOOL
 */

function createFloatingCube(x = 0, y = 0, props) {
  floatingCube = new FloatingCube(x, y, props);
  // HACK floating cube
  floatingCube.update = () => {
    floatingCube.attractPosition();
    floatingCube.attractRotation();
  };
  webgl.add(floatingCube);
}

/**
 * * *******************
 * * LOAD VIDEOS TOOLS
 */

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const videoPlayer = document.createElement('video');
    videoPlayer.width = 512;
    videoPlayer.height = 512;
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    const source = document.createElement('source');
    source.id = 'mp4';
    source.type = 'video/mp4';
    videoPlayer.appendChild(source);

    if (!videoPlayer.canPlayType('video/mp4')) {
      reject();
      return;
    }

    videoPlayer.addEventListener('canplaythrough', () => {
      resolve(videoPlayer);
    });
    videoPlayer.src = url;
    if (videoPlayer.readyState > 3) {
      resolve(videoPlayer);
    }
  });
}

async function loadVideos() {
  try {
    videoOmniwomen = await loadVideo(omniwomenURL);
    videoOmniwomen.play();
    texture1 = new VideoTexture(videoOmniwomen);
    texture1.minFilter = LinearFilter;
    texture1.magFilter = LinearFilter;
    texture1.format = RGBFormat;
    textureTransitionMaterial.uniforms.u_texture1.value = texture1;

    videoSweetPursuit = await loadVideo(sweetPursuitURL);
    // videoSweetPursuit.play();
    texture2 = new VideoTexture(videoSweetPursuit);
    texture2.minFilter = LinearFilter;
    texture2.magFilter = LinearFilter;
    texture2.format = RGBFormat;
    textureTransitionMaterial.uniforms.u_texture2.value = texture2;
  } catch (e) {
    console.error(e);
    // TODO ne charger qu'une image
  }
}

/**
 * * *******************
 * * MOUSE HANDLERS
 */

function handleDownEvent(e) {
  if (currentCubeIntersect) {
    // TODO play videos
    cubeDragged = currentCubeIntersect.object;
    document.body.style.cursor = 'grabbing';

    draggingPoint.x = e.x || e.clientX || (e.touches && e.touches[0].clientX) || 0;
    draggingPoint.y = e.y || e.clientY || (e.touches && e.touches[0].clientY) || 0;
  }
}

function handleUpEvent() {
  if (cubeDragged) {
    document.body.style.cursor = (currentCubeIntersect) ? 'grab' : 'auto';
    cubeDragged.targetedRotation.set(0, 0, 0);
    cubeDragged = false;
  }
}

function handleMoveEvent(e) {
  const x = e.x || e.clientY || (e.touches && e.touches[0].clientY) || 0;
  const y = e.y || e.clientY || (e.touches && e.touches[0].clientY) || 0;

  // Apply force to the cube
  if (cubeDragged) {
    draggingVector.set(
      (y - draggingPoint.y) || 0,
      (x - draggingPoint.x) || 0,
      0,
    );
    const dist = draggingVector.length();
    currentCubeIntersect.object.targetedRotation.copy(draggingVector.multiplyScalar(0.009));
    if (dist > 150) {
      textureTransitionMaterial.switch();
      handleUpEvent();
    }
  } else {
     // Check the intersections between the mouse and a cube
    const normalizedPosition = getNormalizedPosFromScreen(x, y);
    mouseRaycaster.setFromCamera(normalizedPosition, webgl.camera);
    const intersects = mouseRaycaster.intersectObjects(webgl.scene.children);

    currentCubeIntersect =
      intersects[0] &&
      (intersects[0].object.uuid !== planeShadow.uuid) &&
      intersects[0]
    ;

    document.body.style.cursor = (currentCubeIntersect) ? 'grab' : 'auto';
  }
}

/**
 * * *******************
 * * START
 */

loadVideos().then(() => {
  createFloatingCube(0, 0, {
    scale: 4,
    color: MAIN_COLOR,
    disapear: false,
    rotationFriction: 0.9,
  });

  // V1 ------------------------------------------------------------
  // floatingCube.setMaterial(new MeshToonMaterial({
  //   map: texture,
  // }));
  // V2 ------------------------------------------------------------
  floatingCube.setMaterial(textureTransitionMaterial);

  window.addEventListener(HAS_TOUCH ? 'touchmove' : 'mousemove', handleMoveEvent);
  window.addEventListener(HAS_TOUCH ? 'touchstart' : 'mousedown', handleDownEvent);
  window.addEventListener(HAS_TOUCH ? 'touchend' : 'mouseup', handleUpEvent);
});


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
