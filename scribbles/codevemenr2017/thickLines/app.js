import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, BoxGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, Vector2, Vector3,
  Geometry, SplineCurve, Path,
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

// OBJECTS
class WindLine extends Mesh {
  constructor({ amplitude = 0.5, nbrOfPoints = 4, length = 5, orientationY = -2 } = {}) {
    const maxLength = length / nbrOfPoints;
    const minLength = maxLength * 0.5;

    // const points = [];
    // points.push(new Vector2(0, 0));
    // for (let i = 0; i < nbrOfPoints; i++) {
    //   points.push(new Vector2(
    //     (maxLength * i) + getRandomFloat(minLength, maxLength),
    //     (amplitude * orientationY * i) + getRandomFloat(-amplitude, amplitude),
    //   ));
    // }
    // const curve = new SplineCurve(points);
    // const path = new Path(curve.getPoints(50));
    // const geometry = path.createPointsGeometry(50);


    const geometry = new Geometry();
    for (let j = 0; j < Math.PI; j += 2 * Math.PI / 100 ) {
      geometry.vertices.push(new Vector3(
        (maxLength * j) + getRandomFloat(minLength, maxLength),
        (amplitude * orientationY * j) + getRandomFloat(-amplitude, amplitude),
        0,
      ));
    }
    const line = new MeshLine();
    line.setGeometry( geometry );

    const material = new ShaderMaterial({
      vertexShader: lineVert,
      fragmentShader: lineFrag,
      uniforms: {
        color: { type: 'v3', value: new Color(0x000000) },
        timer: { type: 'f', value: 0 },
      },
    });

    super(geometry, material);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += 0.01;
    this.material.uniforms.timer.value = this.rotation.x * 2;
    // this.rotation.y += 0.03;
  }
}

// START
//const ex = new Example();
// webgl.add(ex);


// const geometry = new Geometry();
// for (let j = 0; j < Math.PI; j += 2 * Math.PI / 100 ) {
//   const v = new Vector3( Math.cos( j ), Math.sin( j ), 0 );
//   geometry.vertices.push( v );
// }
const points = [];
points.push(new Vector2(0, 0));
for (let i = 0; i < 10; i++) {
  points.push(new Vector3(
    (10 * i) + getRandomFloat(2, 10),
    10 + getRandomFloat(-5, 5),
    0,
  ));
}
const curve = new SplineCurve(points);
const path = new Path(curve.getPoints(100));
const geometry = path.createPointsGeometry(100);


const lineGeometry = new Geometry();
for (let j = 0; j < geometry.vertices.length; j++) {
  lineGeometry.vertices.push(new Vector3(0, 0, 0));
}
const line = new MeshLine();
line.setGeometry(geometry, p => 2 - p);
// line.setGeometry(lineGeometry, p => 2 - p);

const material = new MeshLineMaterial({
  color: new Color('#ff00ff'),
  lineWidth: 2,
  visibility: 0,
  // sizeAttenuation: false,
  // near: webgl.camera.near,
  // far: webgl.camera.far,
});
const mesh = new Mesh( line.geometry, material ); // this syntax could definitely be improved!
webgl.add( mesh );

let i = 0;
function update() {
  // material.uniforms.lineWidth.value -= 0.01;
  material.uniforms.visibility.value += 0.1;

  // const lastPoint = geometry.vertices[geometry.vertices.length - 1];
  // const currentPoint = geometry.vertices[i];
  // if (currentPoint !== lastPoint) {
  //   i = (i + 1) % (geometry.vertices.length);
  // }
  // line.advance(geometry.vertices[i]);
  // mesh.rotation.x += 0.01;
  // mesh.rotation.y += 0.01;
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
