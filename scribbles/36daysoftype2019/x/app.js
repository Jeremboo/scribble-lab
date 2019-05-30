import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FontLoader, Vector3,
  AmbientLight, DirectionalLight,
  TextBufferGeometry, MeshStandardMaterial,
  TextureLoader, Clock,
  Vector2,
  MeshBasicMaterial
} from 'three';

import {
  EffectComposer, RenderPass, EffectPass, BloomEffect,
  BlendFunction,
  KernelSize
} from 'postprocessing';

import SelectiveBloomEffect from 'SelectiveBloomEffect';

import stoneMap from 'stone-map.jpg';
import stoneTexture from 'stone-texture.jpg';
import stoneNormalMap from 'stone-normalMap.jpg';
import stoneGlowMap from 'stone-glow.jpg';

import { getRandomFloat } from 'utils';

import OBJLoader from 'OBJLoader';
import letterX from 'letter_x.obj';

import CameraMouseControl from 'CameraMouseControl';

// import torsionVert from './shaders/torsion.v.glsl';
// import torsionFrag from './shaders/torsion.f.glsl';

const MAIN_COLOR = '#D028C5';
const BACKGROUND_COLOR = '#040507';

const clock = new Clock();

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
    this.renderer.setClearColor(new Color(BACKGROUND_COLOR));
    this.scene = new Scene();
    this.selectiveScene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 1.5);
    this.camera.lookAt(new Vector3(0, 0, 0));
    this.dom = this.renderer.domElement;

    this._composer = false;
    this._passes = {};
    this.initPostprocessing();

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
  addSelective(mesh) {
    this.selectiveScene.add(mesh);
    if (!mesh.update) return;
    this.meshListeners.push(mesh.update);
    this.meshCount++;
  }
  update() {
    let i = this.meshCount;
    while (--i >= 0) {
      this.meshListeners[i].apply(this, null);
    }
    // this.renderer.render(this.scene, this.camera);
    this._composer.render(clock.getDelta());
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this._composer.setSize(w, h);
  }
  initPostprocessing() {
    this._composer = new EffectComposer(this.renderer, {
      // stencilBuffer: true,
      // depthTexture: true,
    });

    // TODO add selective bloom effect

    // *********
    // EFFECTS
    // const smaaEffect = new SMAAEffect(assets.get("smaa-search"), assets.get("smaa-area"));
    // smaaEffect.setEdgeDetectionThreshold(0.065);

    const selectiveBloomEffect = new SelectiveBloomEffect(
      this.selectiveScene,
      this.camera,
      {
        blendFunction: BlendFunction.NORMAL,
      }
    );

    // PASSES
    const renderPass = new RenderPass(this.scene, this.camera);
    // renderPass.renderToScreen = true;
    this._composer.addPass(renderPass);

		// const pass = new EffectPass(camera, smaaEffect, bloomEffect);
		// const pass = new EffectPass(this.camera, selectiveBloomEffect);
		const pass = new EffectPass(this.camera);
		pass.renderToScreen = true;
		this._composer.addPass(pass);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);

/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

 // Lights
const ambiantLight = new AmbientLight(0xffffff, 1);
webgl.add(ambiantLight);

const directionalLight = new DirectionalLight(0xffffff, 2);
directionalLight.position.set(2, 5, 10);
webgl.add( directionalLight );

export default class X extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.y += 0.01;
  };
}

// START
const ObjLoader = new OBJLoader();
const loader = new TextureLoader();

ObjLoader.load(letterX, obj => {
  loader.load(stoneMap, (stoneMap) => {
    loader.load(stoneTexture, (utilMap) => {
      loader.load(stoneNormalMap, (normalMap) => {
        loader.load(stoneGlowMap, (glowMap) => {

          // Create the X to render
          const material = new MeshStandardMaterial({
            map : stoneMap,
            roughness : 0.15,
            metalness : 0.9,
            metalnessMap : utilMap,
            roughnessMap : utilMap,
            normalMap : normalMap,
            normalScale : new Vector2(5, 5)
          });
          const x = new X(obj.children[0].geometry, material);
          webgl.add(x);

          // Create the X to have glow render
          const selectiveMaterial = new MeshBasicMaterial({
            map : glowMap,
          });
          const xSelective = new X(obj.children[0].geometry, selectiveMaterial);
          webgl.addSelective(xSelective);

        });
      });
    });
  });
});

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove : [-1, 1],
  velocity: [0.1, 0.1]
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

function loop() {
  webgl.update();

  // Camera update
  cameraControl.update();

  requestAnimationFrame(loop);
}
loop();
