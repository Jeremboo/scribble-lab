import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, Mesh,
  MeshToonMaterial, Color, SphereGeometry, PlaneGeometry, MeshLambertMaterial,
  Vector3, AmbientLight, PointLight, DirectionalLight, Fog,
} from 'three';

import { getRandomFloat, getNormalizedPosFromScreen, getDistanceBetweenNormalizedMousePosAndPos, radians } from 'utils';


let normalizedMouse = new Vector3();
/**/ /* ---- CORE ---- */
/**/ const mainColor = '#070707';
/**/ const secondaryColor = '#7e44a1';
/**/ const bgColor = 0xEDF2F4;
/**/ let windowWidth = window.innerWidth;
/**/ let windowHeight = window.innerHeight;
/**/ class Webgl {
/**/   constructor(w, h) {
/**/     this.meshCount = 0;
/**/     this.meshListeners = [];
/**/     this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
/**/     this.renderer.setPixelRatio(window.devicePixelRatio);
/**/     this.renderer.setClearColor(bgColor);
/**/     this.scene = new Scene();
         this.scene.fog = new Fog(bgColor, 0, 350)
/**/     this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
/**/     this.camera.position.set(0, 0, 10);
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

        this.camera.position.x += ((normalizedMouse.x * 2) - this.camera.position.x) * 0.08;
				this.camera.position.y += ((normalizedMouse.y * 1.5) - this.camera.position.y) * 0.08;
				this.camera.lookAt(new Vector3());

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

const SCALE_FORCE = 0.1;
const SCALE_VEL = 0.8;

const MOUSE_VEL = 0.07;

const ATTRACTION_FORCE = 0.1;
const ATTRACTION_VEL = 0.8;

// OBJECTS
class Ball extends Object3D {
  constructor({
    size = getRandomFloat(0.2, 0.3),
    position = new Vector3(
      getRandomFloat(-8, 8),
      getRandomFloat(-5, 5),
      getRandomFloat(-7, 2),
    ),
    color = secondaryColor,
  } = {}) {
    super();

    this.initialPosition = position;
    this.normalizedMouseVec = new Vector3();
    this.attractionRadius = size * 10;
    this.force = {
      scale: 0,
      position: new Vector3(),
    };

    this.material = new MeshToonMaterial({
      color: new Color(color),
      // flatShading: FlatShading,
      shininess: 10,
    });
    this.geometry = new SphereGeometry(size, 32, 32);
    this.mesh = new Mesh(this.geometry, this.material);
    this.position.copy(this.initialPosition);

    this.mesh.scale.multiplyScalar(0.001);

    this.add(this.mesh);

    this.update = this.update.bind(this);
  }

  update() {
    // this.rotation.x += 0.005;
    // this.rotation.y += 0.005;

    this.updateScale();
    this.updateMouseAttractionForce();
  }

  updateScale() {
    this.force.scale += (1 - this.mesh.scale.x) * SCALE_FORCE;
    this.mesh.scale.addScalar(this.force.scale);
    this.force.scale *= SCALE_VEL;
  }

  // Updated on mousemove
  updateMouseAttractionForce() {
    // mousePosition force
    const vecForce = getDistanceBetweenNormalizedMousePosAndPos(this.normalizedMouseVec, this.position, webgl.camera);
    const force = Math.max(0, this.attractionRadius - vecForce.length());
    this.force.position.add(vecForce.multiplyScalar(force * MOUSE_VEL));
    // gravity force
    this.force.position.sub(this.initialPosition.clone().sub(this.position).multiplyScalar(ATTRACTION_FORCE))
    // apply
    this.position.sub(this.force.position);
    // reduce force
    this.force.position.multiplyScalar(ATTRACTION_VEL);
  }
}

// START

// plane
const plane = new Mesh(new PlaneGeometry(800, 800, 32), new MeshLambertMaterial({ color: 0xEDF2F4 }))
plane.position.y = -20;
plane.rotation.x = -radians(90)
webgl.add(plane)
/**
 * LIGHTS
 */
const ambiantLight = new AmbientLight(0xffffff, 0.8)
webgl.add(ambiantLight)
const directionalLight = new DirectionalLight(0xffffff, 0.15)
directionalLight.position.set(0, 1, 0)
webgl.add(directionalLight)
const pointLight = new PointLight(0xfff7d7, 0.05)
pointLight.position.set(1, 0, 0)
webgl.add(pointLight)

const balls = [];
const nbrOfBalls = 200;
const colors = [
  '#53D8FB',
  '#DE1A1A',
  '#2D3047',
  '#ED217C',
  '#EDAE49',
];

let j = 0;
let interval = setInterval(() => {
  const b = new Ball({ color: colors[Math.floor(Math.random() * colors.length)] });
  balls.push(b);
  webgl.add(b);
  j++;

  if(j === nbrOfBalls) {
    clearInterval(interval);
  }
}, 20);

document.body.addEventListener('mousemove', (e) => {
  normalizedMouse = getNormalizedPosFromScreen(e.clientX, e.clientY)
  const l = balls.length;
  for (let i = 0; i < l; i++) {
    balls[i].normalizedMouseVec = normalizedMouse;
  }
});

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
