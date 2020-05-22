import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Color, Line,
  SplineCurve, Path, Vector2,
  ShaderMaterial,
} from 'three';

import { getRandomFloat } from '../../../utils';

import OrbitControls from '../../../modules/OrbitControls';

/* ---- CORE ---- */
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
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
    this.mouseX = 0;
    this.mouseY = 0;
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }
  add(mesh) {
    this.scene.add(mesh);
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }

  handleMouseMove(event) {
    const AMPL = 5;
    this.mouseX = -((event.clientX / window.innerWidth) - 0.5) * AMPL;
    this.mouseY = ((event.clientY / window.innerHeight) - 0.5) * AMPL;
    console.log(this.mouseX, this.mouseY);
  }

  update() {
    this.camera.position.x += (this.mouseX - this.camera.position.x) * .05;
    this.camera.position.y += (this.mouseY - this.camera.position.y) * .05;
    //  console.log(this.camera.position);
    this.camera.lookAt(this.scene.position);

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

/* ---- ------------- ---- */
/* ---- CREATING ZONE ---- */

// OBJECTS
class RandomLineCurve extends Line {
  constructor({ amplitude = 0.5, nbrOfPoints = 4, length = 5, orientationY = -2, speed = 0.04 } = {}) {
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
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vUv = uv;
          vPos = position;
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float timer;
        uniform float lineHeight;
        uniform float spaceHeight;

        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float t = ceil(lineHeight - mod(vPos.x + timer, spaceHeight));
          // if (t > 0.0) {
          //   t = 1.0;
          // }
          gl_FragColor = vec4(color, t);
        }
      `,
      uniforms: {
        color: { type: 'v3', value: new Color(0xffffff) },
        timer: { type: 'f', value: getRandomFloat(0, 100) },
        lineHeight: { type: 'f', value: 2 },
        spaceHeight: { type: 'f', value: 20 },
      },
      transparent: true,
    });

    super(geometry, material);

    this.speed = speed;

    this.update = this.update.bind(this);
  }

  update() {
    // this.rotation.x += 0.01;
    this.material.uniforms.timer.value += this.speed;
    // this.rotation.y += 0.03;
  }
}

function addLine() {
  const curve = new RandomLineCurve({
    orientationY: getRandomFloat(0, 2),
    length: getRandomFloat(1, 4),
    amplitude: getRandomFloat(0.2, 0.6),
    nbrOfPoints: getRandomFloat(2, 6),
    speed: getRandomFloat(0.02, 0.08),
  });
  curve.rotation.x = getRandomFloat(0, Math.PI * 180);
  curve.position.set(
    getRandomFloat(-4, 2),
    getRandomFloat(-2, 2),
    getRandomFloat(-2, 2),
  );
  // curve.rotation.x = getRandomFloat(0, Math.PI * 180);
  webgl.add(curve);
}

// START
for (let i = 0; i < 500; i++) {
  addLine();
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
