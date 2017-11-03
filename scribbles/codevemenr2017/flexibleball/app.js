import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh,
  MeshToonMaterial, Color, SphereGeometry, PlaneGeometry, MeshLambertMaterial,
  Vector3, AmbientLight, PointLight, DirectionalLight, Fog,
} from 'three';

import { getRandomFloat, getNormalizedPosFromScreen, getDistanceBetweenNormalizedMousePosAndPos, radians } from 'utils';

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
/**/     this.scene.fog = new Fog(bgColor, 0, 350)
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
/**/
/**/      this.camera.position.x += ((normalizedMouse.x) - this.camera.position.x) * 0.05;
/**/			this.camera.position.y += ((normalizedMouse.y) - this.camera.position.y) * 0.05;
/**/			this.camera.lookAt(new Vector3());
/**/
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

/* ---- CREATING ZONE ---- */

const SCALE_FORCE = 0.1;
const SCALE_VEL = 0.8;

const MOUSE_VEL = 0.02;

const ATTRACTION_FORCE = 0.05;
const ATTRACTION_VEL = 0.7;

const NBR_OF_BALLS = 0;
const COLORS = [
  '#0169c0',
  '#cf297e',
  '#419904',
];

// OBJECTS
class Ball extends Mesh {
  constructor({
    size = getRandomFloat(1, 3),
    position = new Vector3(
      getRandomFloat(-8, 8),
      getRandomFloat(-5, 5),
      getRandomFloat(-7, 0),
    ),
    color = secondaryColor,
  } = {}) {
    const material = new MeshToonMaterial({
      color: new Color(color),
      // flatShading: FlatShading,
      shininess: 10,
    });
    const geometry = new SphereGeometry(size, 32, 32);
    super(geometry, material);

    this.normalizedMouseVec = new Vector3();
    this.attractionRadius = size * 2;
    this.force = {
      scale: 0,
      position: new Vector3(),
      vertices: [],
    };

    this.initialVertices = [];
    this.initialPosition = position;
    this.position.copy(this.initialPosition);
    this.scale.multiplyScalar(0.001);

    for (let i = 0; i < this.geometry.vertices.length; i++) {
      const v = this.geometry.vertices[i].clone();
      this.initialVertices.push(v);
      this.force.vertices.push(new Vector3());
    }

    this.update = this.update.bind(this);
  }

  update() {
    // this.rotation.x += 0.005;
    // this.rotation.y += 0.005;

    this.updateScale();

    // apply forces
    this.updatePosition();
    this.updateVertices();
  }

  updateScale() {
    this.force.scale += (1 - this.scale.x) * SCALE_FORCE;
    this.scale.addScalar(this.force.scale);
    this.force.scale *= SCALE_VEL;
  }

  // apply the mouse force and the gravity force
  updatePosition() {
    // mousePosition force
    const vecForce = getDistanceBetweenNormalizedMousePosAndPos(this.normalizedMouseVec, this.position, webgl.camera);
    const force = Math.max(0, (this.attractionRadius) - vecForce.length());
    this.force.position.add(vecForce.multiplyScalar(force * MOUSE_VEL * 0.2));
    // gravity force
    this.force.position.sub(this.initialPosition.clone().sub(this.position).multiplyScalar(ATTRACTION_FORCE));
    // apply
    this.position.sub(this.force.position);
    // reduce force
    this.force.position.multiplyScalar(ATTRACTION_VEL);
  }

  updateVertices() {
    this.geometry.verticesNeedUpdate = true;

    let i;
    const l = this.geometry.vertices.length - 1;
    for (i = l; i >= 0; i--) {
      const vecForce = getDistanceBetweenNormalizedMousePosAndPos(this.normalizedMouseVec, this.geometry.vertices[i].clone().add(this.position), webgl.camera);
      const force = Math.max(0, (this.attractionRadius * 0.55) - vecForce.length());
      this.force.vertices[i].add(vecForce.multiplyScalar(force * 0.15));
      // gravity force
      this.force.vertices[i].sub(this.initialVertices[i].clone().sub(this.geometry.vertices[i]).multiplyScalar(0.4));
      // apply
      this.geometry.vertices[i].sub(this.force.vertices[i]);
      // reduce force
      this.force.vertices[i].multiplyScalar(0.5);
    }
  }
}

// #######
// START
// #######

// #######
// plane
const plane = new Mesh(
  new PlaneGeometry(800, 800, 32),
  new MeshLambertMaterial({ color: 0xEDF2F4 }),
);
plane.position.y = -20;
plane.rotation.x = -radians(90);
webgl.add(plane);
// #######
// lights
const ambiantLight = new AmbientLight(0xffffff, 0.8);
webgl.add(ambiantLight);
const directionalLight = new DirectionalLight(0xffffff, 0.15);
directionalLight.position.set(0, 1, 0);
webgl.add(directionalLight);
const pointLight = new PointLight(0xfff7d7, 0.05);
pointLight.position.set(1, 0, 0);
webgl.add(pointLight);

// #######
// balls
let j = 0;
let normalizedMouse = new Vector3();
const balls = [];
const bigBall = new Ball({ color: COLORS[0], position: new Vector3() });
balls.push(bigBall);
webgl.add(bigBall);

// push new balls each 20 ms
let interval = setInterval(() => {
  if (j >= NBR_OF_BALLS) {
    clearInterval(interval);
    return;
  }

  const b = new Ball({ color: COLORS[j % COLORS.length] });
  balls.push(b);
  webgl.add(b);
  j++;
}, 20);

// target mouse position in the 3D view
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
/**/ function _onResize() {
/**/   windowWidth = window.innerWidth;
/**/   windowHeight = window.innerHeight;
/**/   webgl.resize(windowWidth, windowHeight);
/**/ }
/**/ window.addEventListener('resize', _onResize);
/**/ window.addEventListener('orientationchange', _onResize);
/**/ /* ---- LOOP ---- */
/**/ function _loop() {
/**/ 	webgl.update();
/**/ 	requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
