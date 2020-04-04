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

import Stars from 'Stars';
import OrbitControl from 'OrbitControl';
import InstancedGeom, { createPlaneBuffer } from 'InstancedGeom';

import fragGlow from './shaders/glow.f.glsl';
import vertGlow from './shaders/glow.v.glsl';
import textureUrl from 'glow-texture.png';

import { getRandomFloat, onCursorTouchMeshes } from 'utils';

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
    // this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.controls = new OrbitControl(this.camera, this.renderer.domElement);
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
  color: '#4118ca',
  brightness: 3.5,
  turbulence: 0.5,
  scale: 1,
  distance: 1,
  rotation: 0.01,
  // Global Noise
  noiseSpeed: 0.01,
  noiseSize: 0.15,
  noiseIntensity: 1.39,
  noiseOrientation: 1
};

const textureLoader = new TextureLoader();

const mouseForce = new Vector3();
const mousePosition = new Vector3();

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
    const instanciedMesh = new InstancedGeom(createPlaneBuffer(), nbr);

    // PROPS
    const positionAttribute = instanciedMesh.setAttribute('_position', 3);
    const initialPositions = new Float32Array(nbr * 3);

    const scaleAttribute = instanciedMesh.setAttribute('_scale', 2);

    const alphaAttribute = instanciedMesh.setAttribute('_alpha', 1);
    const initialAlpha = new Float32Array(nbr);

    const timeAttribute = instanciedMesh.setAttribute('_time', 1);
    const timeSpeed = new Float32Array(nbr);

    const translationForce = new Float32Array(nbr * 2);

    const incrementedColor = instanciedMesh.setAttribute(
      '_incrementedColor',
      1
    );

    for (let i = 0; i < nbr; i++) {
      // position
      const { x, y, z } = getRandomPosition(i);
      positionAttribute.setXYZ(i, x, y, z);
      initialPositions[i * 3 + 0] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;
      // scale
      const scale = getRandomFloat(0.1, 4);
      scaleAttribute.setXY(
        i,
        getRandomFloat(0.8, 1.2) * scale,
        getRandomFloat(0.8, 1.2) * scale
      );
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

    super(instanciedMesh, material);

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

      const distance = mousePosition.distanceTo(instancePosition);
      if (distance < 1.5) {
        instancePosition.sub(mouseForce.clone().multiplyScalar(distance * 2));

        // Incremented
        this.geometry.attributes._incrementedColor.setX(
          i,
          (this.geometry.attributes._incrementedColor.getX(i) + 0.02) % 1
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
        this.geometry.attributes._incrementedColor.getX(i) * 0.995
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
onCursorTouchMeshes(webgl.camera, [mousePlane], intersects => {
  const objectIntersected = intersects[0];
  if (objectIntersected) {
    mouseForce.add(
      mousePosition
        .clone()
        .sub(objectIntersected.point)
        .multiplyScalar(0.1)
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
gui.add(PROPS, 'rotation', 0, 0.1);
gui.add(PROPS, 'brightness', 0, 25);
gui.add(PROPS, 'turbulence', 0, 2);
gui.add(PROPS, 'scale', 0.001, 3).onChange(value => {
  nebula.updateScale();
});
gui.add(PROPS, 'distance', 0.001, 10).onChange(value => {
  nebula.updatePosition();
});

gui.add(PROPS, 'noiseSpeed', -0.03, 0.03);
gui.add(PROPS, 'noiseSize', 0, 10).onChange(value => {
  nebula.material.uniforms.noiseSize.value = value;
});
gui.add(PROPS, 'noiseOrientation', -1, 1).onChange(value => {
  nebula.material.uniforms.noiseOrientation.value = value;
});
gui.add(PROPS, 'noiseIntensity', 0, 1.5).onChange(value => {
  nebula.material.uniforms.noiseIntensity.value = value;
});

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
