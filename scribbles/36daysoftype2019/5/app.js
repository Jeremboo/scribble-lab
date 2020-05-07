import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, Clock, Fog,
  FontLoader, TextBufferGeometry,
  ShaderLib, UniformsUtils,
  ShaderMaterial,
} from 'three';
import {
  EffectComposer, RenderPass, EffectPass, OutlineEffect,
  BlendFunction, SMAAEffect
} from 'postprocessing';

import { vert, frag } from './shader.js'

const MAIN_COLOR = '#F64062';
const SECOND_COLOR = '#5127AB'; // '#7136ED';
const BACKGROUND_COLOR = 0x070707;

const clock = new Clock();

import fontFile from '../_assets/Glence Black_Regular';

import CameraMouseControl from '../../../modules/CameraMouseControl';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);

const CAMERA_DIST = 10;

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
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio) || 1);
    this.renderer.setClearColor(BACKGROUND_COLOR);
    this.scene = new Scene();
    this.scene.fog = new Fog(new Color(SECOND_COLOR), CAMERA_DIST - 0.8, CAMERA_DIST + 1);
    this.camera = new PerspectiveCamera(50, w / h, 0.3, 1000);
    this.camera.position.set(0, 0, CAMERA_DIST);
    this.dom = this.renderer.domElement;

    this._composer = new EffectComposer(this.renderer, {
      stencilBuffer: true,
      // depthTexture: true,
    });
    this._passes = {};

    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
  }
  add(mesh) {
    this.scene.add(mesh);
    this.outlineEffect.selectObject(mesh);
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
  initPostprocessing(areaImage, searchImage) {

    // *********
    // EFFECTS
    this.smaaEffect = new SMAAEffect(searchImage, areaImage);
    this.smaaEffect.setEdgeDetectionThreshold(0.05);

    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
			blendFunction: BlendFunction.SCREEN,
      resolutionScale: 1,
      edgeStrength: 100,
      pulseSpeed: 0.0,
      visibleEdgeColor: 0x000000,
      hiddenEdgeColor: BACKGROUND_COLOR,
      blurriness : 5,
      blur: true,
      xRay: true
		});

		this.outlineEffect.setSelection(this.scene.children);

    // PASSES
    const renderPass = new RenderPass(this.scene, this.camera);
    renderPass.renderToScreen = false;

    // const pass = new EffectPass(camera, smaaEffect, bloomEffect);
    const smaaPass = new EffectPass(this.camera, this.smaaEffect);
    smaaPass.renderToScreen = true;
		const outlinePass = new EffectPass(this.camera, this.outlineEffect);
    // outlinePass.renderToScreen = true;

    this._composer.addPass(renderPass);
    this._composer.addPass(outlinePass);
    this._composer.addPass(smaaPass);
  }
}





/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

// OBJECTS
class Five extends Mesh {
  constructor() {
    const uniforms = UniformsUtils.merge([
      ShaderLib.basic.uniforms,
      {
        diffuse : { value : new Color(MAIN_COLOR) },
        time : { value : 0 }
      },
    ]);
    const material = new ShaderMaterial({
      uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      fog : true,
    })


    const geometry = new TextBufferGeometry( '5', {
      font,
      size: 4,
      height: 0.8,
      curveSegments: 12,
      // bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelSegments: 10
    } );
    geometry.computeBoundingBox();
    geometry.translate(
      -geometry.boundingBox.max.x * 0.5,
      -geometry.boundingBox.max.y * 0.5,
      0
    )

    super(geometry, material);

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.y += 0.01;

    this.material.uniforms.time.value = clock.oldTime;
  }
}

// START
const areaImage = new Image();
const searchImage = new Image();

let webgl = false;
let cameraControl = false;

areaImage.addEventListener("load", () => {
  searchImage.addEventListener("load", () => {
    webgl = new Webgl(windowWidth, windowHeight);
    document.body.appendChild(webgl.dom);

    webgl.initPostprocessing(areaImage, searchImage);
    webgl.resize(windowWidth, windowHeight);

    const five = new Five();
    webgl.add(five);

    // CAMERA CONTROLLER
    cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-5, 5], velocity: [0.1, 0.1]});

    loop();

  });
  searchImage.src = SMAAEffect.searchImageDataURL;
});
areaImage.src = SMAAEffect.areaImageDataURL;



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

  // Camera update
  cameraControl.update();

  requestAnimationFrame(loop);
}

