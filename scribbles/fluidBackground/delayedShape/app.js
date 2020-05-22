import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D, SphereGeometry,
  MeshStandardMaterial, Mesh, Color, AmbientLight, DirectionalLight,
  WebGLRenderTarget, Vector2, RGBFormat
} from 'three';

import { classicNoise2D } from '../../../utils/glsl';

import PostFX from '../../../modules/PostFX';

const MAIN_COLOR = '#5435FF';

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float perlinForce;
  uniform float perlinDimension;
  uniform vec2 time;
  uniform vec3 color;
  uniform sampler2D savedFrames;
  uniform sampler2D newFrame;
  uniform vec2 resolution;

 ${classicNoise2D}

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    float noise = classicNoise2D((uv + time) * perlinDimension) * perlinForce;

    vec4 savedFramesTex = texture2D(savedFrames, uv * (1. - noise * 0.05)) * 0.97;
    vec3 c = mix(color, vec3(1, 1, 0), savedFramesTex.a);
    savedFramesTex.xyz *= c;
    vec3 newFrameTex = texture2D(newFrame, uv + noise).xyz;

    gl_FragColor = vec4(savedFramesTex.xyz + newFrameTex, 1.);

    // gl_FragColor = vec4(newFrameTex, 1.);
    // gl_FragColor = vec4(savedFramesTex, 1.);
  }
`;

const VERTEX_SHADER = `
  precision highp float;
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 1.0, 1.0);
  }
`;

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
    this.camera.position.set(0, 0, 10);
    this.dom = this.renderer.domElement;
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size

    this.postFX = new PostFX(this.renderer, FRAGMENT_SHADER, VERTEX_SHADER, {
      perlinForce: { value: 0.15 },
      perlinDimension: { value: 2.5 },
      time: { value: new Vector2(0, 0) },
      color: { value: new Color('#ff00ff') },
      savedFrames: { value: null },
    });

    this.fbo = new WebGLRenderTarget(this.postFX.resolution.x, this.postFX.resolution.y, {
      format: RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
    });
    this.fboClone = this.fbo.clone();

    this.fboIdx = 0;
    this.fbos = [this.fbo, this.fboClone];
    this.postFX.material.uniforms.savedFrames.value = this.fbos[this.fboIdx].texture;
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

    this.postFX.material.uniforms.time.value.x += 0.001;

    this.postFX.material.uniforms.savedFrames.value = this.fbos[this.fboIdx].texture;
    this.postFX.render(this.scene, this.camera);

    this.fboIdx = 1 - this.fboIdx;

    // Save the result
    this.renderer.setRenderTarget(this.fbos[this.fboIdx]);
    this.renderer.render(this.postFX.scene, this.postFX.dummyCamera);
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

// OBJECTS
class Shape extends Object3D {
  constructor() {
    super();

    this.material = new MeshStandardMaterial({
      color: new Color(MAIN_COLOR),
      // shading: FlatShading,
      // wireframe: true,
    });
    this.geometry = new SphereGeometry(1, 32, 32);
    this.mesh = new Mesh(this.geometry, this.material);

    this.add(this.mesh);
    this.scale.set(0.5, 0.5, 2);
    this.position.y = -1;

    this.update = this.update.bind(this);
  }

  update() {
    this.rotation.x += 0.02;
    this.rotation.y += 0.02;

    this.position.y += Math.sin(this.rotation.x * 2) * 0.05;
  }
}

// START
const shape = new Shape();
webgl.add(shape);



// LIGHT
const ambiantLight = new AmbientLight(0xffffff, 0.6);
webgl.scene.add(ambiantLight);

const directionalLight = new DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, -4, 10);
webgl.scene.add(directionalLight);


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
}
loop();