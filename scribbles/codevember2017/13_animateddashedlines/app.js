import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, Color,
  Vector3, SplineCurve, Path,
} from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import { getRandomFloat, getRandomInt } from '../../../utils';

const message = document.createElement('p');
message.className = 'message';
message.innerHTML = 'Click to randomize';
document.body.appendChild(message);

/* --------------------------- */
/* ----------- CORE ---------- */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
 constructor(w, h) {
   this.meshCount = 0;
   this.meshListeners = [];
   this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
   this.renderer.setPixelRatio(window.devicePixelRatio);
   this.scene = new Scene();
   this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
   this.camera.position.set(0, 0, 500);
   this.dom = this.renderer.domElement;
   this.update = this.update.bind(this);
   this.resize = this.resize.bind(this);
   this.resize(w, h); // set render size
 }
 add(mesh) {
   this.scene.add(mesh);
   if (!mesh.update) return;
   this.meshListeners.push(mesh.update);
   this.meshCount++;
 }
 remove(mesh) {
   const idx = this.meshListeners.indexOf(mesh.update);
    if (idx < 0) return;
    this.scene.remove(mesh);
    this.meshListeners.splice(idx, 1);
    this.meshCount--;

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
/* --------- CORE END -------- */
/* --------------------------- */

/* --------------------------- */
/* ------ CREATING ZONE ------ */

const LINE_WIDTH = 1.5;
const NBR_OF_LINES = 15;
const NBR_OF_CURVES = 10;
const SIZE = 600;
const AMPL_MAX = 60;
const COLORS = [
  '#02C39A',
  '#00A896',
  '#028090',
  '#05668D',
  '#FBB13C',
  '#EF476F',
];

class DashedCurve extends Mesh {
  constructor({
    size = SIZE,
    ampl = AMPL_MAX,
    dashArray = getRandomFloat(0.01, 2),
    dashOffset = 0,
    dashRatio = getRandomFloat(0.1, 0.9),
    color = COLORS[getRandomInt(0, COLORS.length - 1)],
    rotationSpeed = getRandomFloat(0.003, 0.03)
  } = {}) {
    const segmentLength = Math.floor(size / NBR_OF_CURVES);
    // create points
    const points = [];
    points.push(new Vector3(0, 0, 0));
    for (let i = 1; i < NBR_OF_CURVES - 1; i++) {
      const ratio = 1 - Math.abs(0.5 - ((segmentLength * i) / size));
      points.push(new Vector3(
        (-segmentLength * i),
        getRandomFloat(-ampl, ampl) * ratio,
        getRandomFloat(-ampl, ampl) * ratio,
      ));
    }
    points.push(new Vector3(-segmentLength * NBR_OF_CURVES, 0, 0));
    // create geometry
    const curve = new SplineCurve(points);
    const path = new Path(curve.getPoints(100));
    const geometry = path.createPointsGeometry(100);
    const line = new MeshLine();
    line.setGeometry(geometry, p => {
      const a = ((0.5 - Math.abs(0.5 - p)) * 5);
      return a;
    });
    // create material
    // create mesh line
    const material = new MeshLineMaterial({
      color: new Color(color),
      lineWidth: LINE_WIDTH,
      // 0 -> no dash ; 1 -> alf dashline length ; 2 -> dashline === length
      dashArray,
       // increment him to animate the dash
      dashOffset,
       // 0.5 -> balancing ; 0.1 -> more line : 0.9 -> more void
      dashRatio,
      // side: DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    super(line.geometry, material);
    this.position.x = size * 0.5;
    this.rotationSpeed = rotationSpeed;

    this.update = this.update.bind(this);
  }

  update() {
    this.material.uniforms.dashOffset.value += 0.005;
    this.rotation.x += this.rotationSpeed;
  }
}

// ########
// START
// Lines
const curves = [];
function addCurvedLine(i) {
  const dashedCurve = new DashedCurve({ color: COLORS[i % (COLORS.length)] });
  dashedCurve.rotation.x = getRandomFloat(0, 3);
  webgl.add(dashedCurve);
  curves.push(dashedCurve);
}
for (let i = 0; i < NBR_OF_LINES; i++) {
  addCurvedLine(i);
}

document.body.addEventListener('click', () => {
  for (let i = 0; i < NBR_OF_LINES; i++) {
    webgl.remove(curves[0]);
    curves.splice(0, 1);
  }
  for (let i = 0; i < NBR_OF_LINES; i++) {
    addCurvedLine(i);
  }
});

/* ---- CREATING ZONE END ---- */
/* --------------------------- */

/* --------------------------- */
/* ------- CORE FOOTER ------- */
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [500, 500], velocity : [0.05, 0.05]});

function _onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', _onResize);
window.addEventListener('orientationchange', _onResize);
/* ---- LOOP ---- */
function _loop() {
  webgl.update();
  cameraControl.update();
  requestAnimationFrame(_loop);
}
_loop();
/* ----- CORE FOOTER END ----- */
/* --------------------------- */
