import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, Color,
  Vector3, SplineCurve, Path,
} from 'three';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

import { getRandomFloat, getRandomInt } from 'utils';

/* --------------------------- */
/* ----------- CORE ---------- */
const mainColor = '#070707';
const secondaryColor = '#C9F0FF';
const bgColor = '#F2EFEA';
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
 constructor(w, h) {
   this.meshCount = 0;
   this.meshListeners = [];
   this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
   this.renderer.setPixelRatio(window.devicePixelRatio);
   this.renderer.setClearColor(new Color(bgColor));
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
  '#3CDBD3',
  '#E8E288',
  '#7DCE82',
  '#FF8360',
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
const curves = [];
for (let i = 0; i < NBR_OF_LINES; i++) {
  const dashedCurve = new DashedCurve();
  dashedCurve.rotation.x = getRandomFloat(0, 3);
  webgl.add(dashedCurve);
  curves.push(dashedCurve);
}


/* ---- CREATING ZONE END ---- */
/* --------------------------- */

/* --------------------------- */
/* ------- CORE FOOTER ------- */
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
    this.position.x = -((event.clientX / window.innerWidth) - 0.5) * 500;
    this.position.y = ((event.clientY / window.innerHeight) - 0.5) * 500;
  }
  update() {
    this.camera.position.x += (this.position.x - this.camera.position.x) * 0.05;
    this.camera.position.y += (this.position.y - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.lookAt);
  }
}
const cameraControl = new CameraMouseControl(webgl.camera);
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
