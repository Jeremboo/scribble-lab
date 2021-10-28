import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  Color,
  ShaderMaterial,
  TextureLoader,
  AdditiveBlending,
  Vector2,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  Vector3
} from 'three';
import { GUI } from 'dat.gui';

import Stars from '../../../modules/Stars';
import OrbitControls from '../../../modules/OrbitControls';
import InstancedGeom, { createPlaneBuffer } from '../../../modules/InstancedGeom';

import { fragGlow, vertGlow } from './shaders.glsl';
const textureUrl = './assets/glow-texture.png';

import { getRandomFloat } from '../../../utils';
import { onCursorTouchMeshes } from '../../../utils/three';

/**
 * * *******************
 * * CORE
 * * *******************
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.camera.position.set(0, 0, 10);
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

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

const NUMBER_OF_PARTICLES = 300;

const PROPS = {
  color: '#1621ca',
  brightness: 5,
  scale: 2,
  turbulence: 0.95,
  distance: 1.3,
  rotation: 0.01,
  mouseDistance: 1.5,
  mouseForceVelocity: 0.095,
  colorFriction: 0.99,
  colorIncrement: 0.02
};

const textureLoader = new TextureLoader();

const mouseForce = new Vector3();
const mousePosition = new Vector3(99, 99, 99);

const instancePosition = new Vector3();

/**
 * * *******************
 * * NEBULA
 * * *******************
 */

const getRandomPosition = () => {
  const x = getRandomFloat(-1, 1) * PROPS.distance;
  const y = getRandomFloat(-2, 2) * PROPS.distance;
  const z = getRandomFloat(-1, 1) * PROPS.distance;
  return { x, y, z };
};

export default class Nebula extends Mesh {
  constructor(nbr = 100) {
    const instanciedGeom = new InstancedGeom(createPlaneBuffer(), nbr);

    // PROPS
    const positionAttribute = instanciedGeom.createAttribute('_position', 3);
    const initialPositions = new Float32Array(nbr * 3);

    const scaleAttribute = instanciedGeom.createAttribute('_scale', 2);

    const alphaAttribute = instanciedGeom.createAttribute('_alpha', 1);
    const initialAlpha = new Float32Array(nbr);

    const timeAttribute = instanciedGeom.createAttribute('_time', 1);
    const timeSpeed = new Float32Array(nbr);

    const translationForce = new Float32Array(nbr * 2);

    const incrementedColor = instanciedGeom.createAttribute(
      '_incrementedColor',
      1
    );

    for (let i = 0; i < nbr; i++) {
      // scale
      const scale = getRandomFloat(0.2, 1);
      scaleAttribute.setXY(i, scale, scale);
      // position
      const { x, y, z } = getRandomPosition(i);
      positionAttribute.setXYZ(i, x, y, z);
      initialPositions[i * 3 + 0] = x * scale;
      initialPositions[i * 3 + 1] = y * scale;
      initialPositions[i * 3 + 2] = z;
      // alpha
      const alpha = getRandomFloat(0.15, 0.3);
      alphaAttribute.setX(i, alpha);
      initialAlpha[i] = alpha;
      // time
      timeAttribute.setX(i, getRandomFloat(0, 10));
      timeSpeed[i] = 0.025 + getRandomFloat(-0.015, 0.005);
      // translationForce
      translationForce[i * 2 + 0] = getRandomFloat(-0.5, 0.5);
      translationForce[i * 2 + 1] = getRandomFloat(-0.5, 0.5);
      // incrementation
      incrementedColor[i] = getRandomFloat(0, 1);
    }

    // Material
    const material = new ShaderMaterial({
      uniforms: {
        color: { value: new Color(PROPS.color) },
        globalTime: { value: 1 },
        texture: { value: null },
        scale: { value: PROPS.scale },
        resolution: { value: new Vector2(windowWidth, windowHeight) },
        noiseSize: { value: PROPS.noiseSize },
        noiseIntensity: { value: PROPS.noiseIntensity },
        noiseOrientation: { value: PROPS.noiseOrientation }
      },
      vertexShader: vertGlow,
      fragmentShader: fragGlow,
      transparent: true,
      depthWrite: false
    });
    material.blending = AdditiveBlending;

    super(instanciedGeom, material);

    this.nbrOfInstances = nbr;

    this.timeSpeed = timeSpeed;
    this.initialAlpha = initialAlpha;
    this.initialPositions = initialPositions;
    this.translationForce = translationForce;

    textureLoader.load(textureUrl, text => {
      this.material.uniforms.texture.value = text;
    });

    this.update = this.update.bind(this);
    this.updateScale = this.updateScale.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
  }

  /**
   * * *******************
   * * Update
   * * *******************
   */
  updateScale() {
    this.material.uniforms.scale.value = PROPS.scale;
  }

  updatePosition() {
    for (let i = 0; i < this.nbrOfInstances; i++) {
      const { x, y, z } = getRandomPosition();
      this.geometry.attributes._position.setXYZ(i, x, y, z);
      this.initialPositions[i * 3 + 0] = x;
      this.initialPositions[i * 3 + 1] = y;
      this.initialPositions[i * 3 + 2] = z;
    }
  }

  update() {
    this.material.uniforms.globalTime.value += PROPS.noiseSpeed;

    for (let i = 0; i < this.nbrOfInstances; i++) {
      // time
      const localTime =
        this.geometry.attributes._time.getX(i) +
        this.timeSpeed[i] * PROPS.turbulence;
      this.geometry.attributes._time.setX(i, localTime);

      // Position
      instancePosition.set(
        this.geometry.attributes._position.getX(i),
        this.geometry.attributes._position.getY(i),
        this.geometry.attributes._position.getZ(i)
      );

      const distance =
        (mousePosition.distanceTo(instancePosition) / mouseForce.length()) *
        0.2;
      if (distance < PROPS.mouseDistance) {
        const dist = PROPS.mouseDistance - distance;
        instancePosition.sub(mouseForce.clone().multiplyScalar(dist * 2));

        // Incremented
        this.geometry.attributes._incrementedColor.setX(
          i,
          (this.geometry.attributes._incrementedColor.getX(i) +
            PROPS.colorIncrement) %
            1
        );
      }
      let x = this.initialPositions[i * 3 + 0];
      let y = this.initialPositions[i * 3 + 1];
      let z = this.initialPositions[i * 3 + 2];
      // Add the turbulence
      x += Math.sin(localTime) * this.translationForce[i * 2 + 0];
      y += Math.cos(localTime) * this.translationForce[i * 2 + 1];

      instancePosition.x += (x - instancePosition.x) * 0.1;
      instancePosition.y += (y - instancePosition.y) * 0.1;
      instancePosition.z += (z - instancePosition.z) * 0.1;

      this.geometry.attributes._position.setXYZ(
        i,
        instancePosition.x,
        instancePosition.y,
        instancePosition.z
      );

      // Alpha
      this.geometry.attributes._alpha.setX(
        i,
        (Math.sin(localTime) + 1) * this.initialAlpha[i] * PROPS.brightness
      );

      this.geometry.attributes._incrementedColor.setX(
        i,
        this.geometry.attributes._incrementedColor.getX(i) * PROPS.colorFriction
      );
    }

    // update
    this.geometry.attributes._time.needsUpdate = true;
    this.geometry.attributes._alpha.needsUpdate = true;
    this.geometry.attributes._position.needsUpdate = true;
    this.geometry.attributes._incrementedColor.needsUpdate = true;
  }
}

/**
 * * *******************
 * * START
 * * *******************
 */
const stars = new Stars();
webgl.add(stars);

const nebula = new Nebula(NUMBER_OF_PARTICLES);
webgl.add(nebula);

// Track the mouse position in 3d
// TODO 2020-04-04 jeremboo: try to find a better way
const mousePlaneGeom = new PlaneBufferGeometry(10, 10, 1);
const mousePlaneMat = new MeshBasicMaterial({ visible: false });
const mousePlane = new Mesh(mousePlaneGeom, mousePlaneMat);
// mousePlane.rotation.x = radians(-30);
webgl.add(mousePlane);
let firstIntersection = true;
onCursorTouchMeshes(webgl.camera, [mousePlane], intersects => {
  const objectIntersected = intersects[0];
  if (objectIntersected) {
    if (firstIntersection) {
      firstIntersection = false;
      mousePosition.copy(objectIntersected.point);
    }
    mouseForce.add(
      mousePosition
        .clone()
        .sub(objectIntersected.point)
        .multiplyScalar(PROPS.mouseForceVelocity)
    );
    mousePosition.copy(objectIntersected.point);
  }
});

/**
 * * *******************
 * * GUI
 * * *******************
 */

const gui = new GUI();
gui.addColor(PROPS, 'color').onChange(value => {
  nebula.material.uniforms.color.value.set(value);
});
gui.add(PROPS, 'rotation', 0, 1);
gui.add(PROPS, 'brightness', 0, 25);
gui.add(PROPS, 'scale', 0.001, 3).onChange(value => {
  nebula.updateScale();
});
gui.add(PROPS, 'turbulence', 0, 2);
gui.add(PROPS, 'distance', 0.001, 3).onChange(value => {
  nebula.updatePosition();
});

gui.add(PROPS, 'mouseForceVelocity', 0.001, 0.1);
gui.add(PROPS, 'colorFriction', 0.95, 0.99999).step(0.0001);
gui.add(PROPS, 'mouseDistance', 0.1, 4);
gui.add(PROPS, 'colorIncrement', 0.001, 0.1);

/**
 * * *******************
 * * RESIZE && LOOP
 * * *******************
 */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
// LOOP
function loop() {
  webgl.update();
  requestAnimationFrame(loop);
  nebula.y += PROPS.rotation;
  stars.rotation.y += 0.001;

  mousePlane.lookAt(webgl.camera.position);
  mouseForce.multiplyScalar(0.9);
}
loop();
