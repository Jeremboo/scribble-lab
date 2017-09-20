import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Line,
  SplineCurve, Path, Vector2,
  ShaderMaterial,
} from 'three';

import { getRandomFloat } from 'utils';

import OrbitControl from 'OrbitControl';

import lineVert from './shaders/line.v.glsl';
import lineFrag from './shaders/line.f.glsl';

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
/**/     this.camera.position.set(0, 0, 10);
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
class Random2DCurve extends Line {
  constructor({ amplitude = 0.5, nbrOfPoints = 4, length = 5, orientationY = -2 } = {}) {
    const MAX_LENGTH = length / nbrOfPoints;
    const MIN_LENGTH = MAX_LENGTH * 0.5;

    const points = [];
    points.push(new Vector2(0, 0));
    for (let i = 0; i < nbrOfPoints; i++) {
      points.push(new Vector2(
        (MAX_LENGTH * i) + getRandomFloat(MIN_LENGTH, MAX_LENGTH),
        (amplitude * orientationY * i) + getRandomFloat(-amplitude, amplitude),
      ));
    }
    const curve = new SplineCurve(points);
    const path = new Path(curve.getPoints(50));
    const geometry = path.createPointsGeometry(50);
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
for (let i = 0; i < 1000; i++) {
  const curve = new Random2DCurve({
    orientationY: 2,
    length: getRandomFloat(3, 7),
    amplitude: 0.2,
  });
  curve.rotation.x = getRandomFloat(0, Math.PI * 180);
  webgl.add(curve);
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
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
