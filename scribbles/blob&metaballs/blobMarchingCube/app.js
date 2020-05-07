import {
  WebGLRenderer, Scene, PerspectiveCamera, MeshPhongMaterial,
  Color, PointLight, AmbientLight, Vector3,
} from 'three';

import { getRandomFloat } from '../../../modules/utils';

import MarchingCubes from '../../../modules/MarchingCubes';
import OrbitControls from '../../../modules/OrbitControls';

const props = {
  turbulence: 0.0019,
  speed: 0.1,
};

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
         this.renderer.gammaInput = true;
         this.renderer.gammaOutput = true;
         // this.renderer.autoClear = false;
/**/     if (bgColor) this.renderer.setClearColor(new Color(bgColor));
/**/     this.scene = new Scene();
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 200);
/**/     this.controls = new OrbitControls(this.camera, this.dom);
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

class Metaballs extends MarchingCubes {
  constructor(resolution, material) {
    super(resolution, material, true, true);
    this.enableUvs = false;
    this.enableColors = false;

    this.balls = [];
    this.substract = 10;
    this.strength = 12;

    this.t = Math.random() * 1000;

    this.update = this.update.bind(this);
  }

  add(position) {
    this.balls.push({
      position,
      turbulence: getRandomFloat(-props.turbulence, props.turbulence),
      speed: getRandomFloat(-props.speed, props.speed),
    });
    this.strength = 1.2 / ((Math.sqrt(this.balls.length) - 1) / 4 + 1);
  }

  update() {
    this.t += 1;
    this.rotation.y += 0.0001;
    this.reset();

    let i;
    for (i = 0; i < this.balls.length; i++) {
      this.balls[i].position.add(new Vector3(
        Math.cos(this.t * this.balls[i].speed) * this.balls[i].turbulence,
        -Math.sin(this.t * this.balls[i].speed) * this.balls[i].turbulence,
        0,
      ));
      // updatePositions
      this.addBall(
        this.balls[i].position.x + 0.5,
        this.balls[i].position.y + 0.5,
        this.balls[i].position.z + 0.5,
        this.strength, this.substract
      );
    }
  }
}

// LIGHTS

// const light = new DirectionalLight(0xeedddd);
// light.position.set(0, -100, -100);
// webgl.add(light);

const pointLight = new PointLight(0x20498f, 0.5);
pointLight.position.set(-200, -50, 300);
webgl.add(pointLight);
const pointLightBlue = new PointLight(0xf56cb4, 0.5);
pointLightBlue.position.set(150, 50, 200);
webgl.add(pointLightBlue);
const ambientLight = new AmbientLight(0xFDF0F3, 0.7);
webgl.add(ambientLight);

const metaballs = new Metaballs(50, new MeshPhongMaterial({ color: 0xffffff }));
metaballs.position.set(0, 0, 0);
metaballs.scale.set(70, 70, 70);
webgl.add(metaballs);

for (let i = 0; i < 10; i++) {
  metaballs.add(new Vector3(
    getRandomFloat(-0.1, 0.1),
    getRandomFloat(-0.1, 0.1),
    getRandomFloat(-0.1, 0.1),
  ));
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
