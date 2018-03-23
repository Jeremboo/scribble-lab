import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, SphereGeometry,
  MeshBasicMaterial, Mesh, Color, FlatShading, ShaderMaterial,
  DoubleSide,
} from 'three';

import OrbitControl from 'OrbitControl';

import vertBlob from './shaders/blob.v.glsl';
import fragBlob from './shaders/blob.f.glsl';

/**/ /* ---- CORE ---- */
/**/ const mainColor = '#1A1754';
/**/ const secondaryColor = '#681C25';
/**/ const bgColor = '#100C0E';
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

const props = {
  SPEED: 0.005,
  COMPLEXITY: 0.15,
  ALPHA_COMPLEXITY: 0.7,
  AMPLITUDE: 1,
  COLOR_TRANSITION: 1.5,
};
let timer = 0;

// OBJECTS
class Blob extends Object3D {
  constructor() {
    super();

    this.material = new MeshBasicMaterial({
      color: new Color(mainColor),
    });


    this.material = new ShaderMaterial({
      vertexShader: vertBlob,
      fragmentShader: fragBlob,
      uniforms: {
        timer: { type: 'f', value: timer },
        color: { type: 'v3', value: new Color(mainColor) },
        color2: { type: 'v3', value: new Color(secondaryColor) },
        complexity: { type: 'v3', value: props.COMPLEXITY },
        complexityAlpha: { type: 'f', value: props.ALPHA_COMPLEXITY },
        amplitude: { type: 'v3', value: props.AMPLITUDE },
        colorTransition: { type: 'f', value: props.COLOR_TRANSITION },
      },
      transparent: true,
      side: DoubleSide,
    });

    this.geometry = new SphereGeometry(3, 64, 64);
    this.mesh = new Mesh(this.geometry, this.material);
    this.geometry.scale(1.5, 1, 1.5);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    this.material.uniforms.timer.value = timer;
    this.material.needsUpdate = true;

    // this.rotation.x += 0.01;
    // this.rotation.y += 0.01;
  }
}

// START
function loop() {
  timer += props.SPEED;
}

const blob = new Blob();
webgl.add(blob);

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
/**/  loop();
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
