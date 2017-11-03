import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, Vector2, Vector3,
  Geometry, SplineCurve, Path, QuadraticBezierCurve3
} from 'three';

import OrbitControl from 'OrbitControl';

import { MeshLine, MeshLineMaterial } from 'three.meshline';

import { getRandomFloat } from 'utils';

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
/**/     this.camera.position.set(0, 0, 500);
/**/     this.controls = new OrbitControl(this.camera, this.renderer.domElement);
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

// START
// create point
const points = [];
for (let i = 0; i < 10; i++) {
  points.push(new Vector3(
    getRandomFloat(-5, 5),
    (-20 * i),
    0,
  ));
}
const curve = new SplineCurve(points);
const path = new Path(curve.getPoints(100));
const geometry = path.createPointsGeometry(100);

const line = new MeshLine();
line.setGeometry(geometry);


// create mesh line
const material = new MeshLineMaterial({
  color: new Color('#5c5c5c'),
  lineWidth: 2,
  dashArray: 0.1, // 0 -> no dash ; 1 -> alf dashline length ; 2 -> dashline === length
  dashOffset: 0, // increment im to animate the dash
  dashRatio: 0.5 // 0.5 -> balancing ; 0.1 -> more line : 0.9 -> more void
});
const mesh = new Mesh(line.geometry, material); // this syntax could definitely be improved!
mesh.position.y = 100;
webgl.add(mesh);


// update
function update() {
  mesh.material.uniforms.dashOffset.value += 0.001;
  mesh.rotation.y += 0.1;
}


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
      update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
