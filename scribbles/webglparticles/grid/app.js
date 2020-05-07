import {
  WebGLRenderer, Scene,
  ShaderMaterial, OrthographicCamera, Vector2,
  Texture, ClampToEdgeWrapping, NearestFilter
} from 'three';
import { GUI } from 'dat.gui';

import GPUSimulation from '../../../modules/GPUSimulation';
import Particles from '../_modules/Particles';


import { particleVert, particleFrag, positionFrag } from './shader.glsl';

import { Power4, TimelineLite } from 'gsap';

/* ---- CORE ---- */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

class Webgl {
  constructor(w, h) {
    this.meshCount = 0;
    this.meshListeners = [];
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.scene = new Scene();
    // this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera = new OrthographicCamera(
      1 / -2,
      1 / 2,
      1 / 2,
      1 / -2,
      1, 1000);
    this.camera.position.set(0, 0, 2);
    this.dom = this.renderer.domElement;
    this.dom.id = 'canvas';
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
    this.resize(w, h); // set render size
    this.onUpdate = f => f;
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
    this.onUpdate();
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
const webgl = new Webgl(windowWidth, windowHeight);
document.body.appendChild(webgl.dom);
/* ---- CREATING ZONE ---- */

/**
 * DOCS
 *
 * FBO: http://barradeau.com/blog/?p=621
 */

 // PROPS
const PROPS = {
  attractionDistanceMax : 0.2,
  attractionVelocity : 0.6,
  anchorVelocity : 0.02,
  anchorFriction : 0.9,
  margin : 10
};

// COMPUTED PROPS
const NBR_OF_ROWS = Math.floor(windowWidth / PROPS.margin);
const NBR_OF_LINES = Math.floor(windowHeight / PROPS.margin);
const shiftX = (1 / NBR_OF_ROWS) * 0.5;
const shiftY = (1 / NBR_OF_LINES) * 0.5;
const NBR_OF_POINTS = NBR_OF_ROWS * NBR_OF_LINES;

const TEXTURE_SIZE = GPUSimulation.defineTextureSize(NBR_OF_POINTS);


/**
 * * *******************
 * * GUI
 * * *******************
 */
const gui = new GUI();
gui.close();

/**
 * * *******************
 * * CANVAS
 * * *******************
 */

const canvas = document.createElement('canvas');
canvas.width          = 64 * webgl.camera.aspect;
canvas.height         = 64;
canvas.style.position = 'fixed';
canvas.style.bottom   = '0';
canvas.style.left     = '0';
canvas.style.border   = '1px solid red';
document.body.appendChild(canvas);

const canvasTexture = new Texture(canvas);
canvasTexture.wrapS = ClampToEdgeWrapping,
canvasTexture.wrapT = ClampToEdgeWrapping,
canvasTexture.minFilter = NearestFilter,
canvasTexture.magFilter = NearestFilter,
canvasTexture.needsUpdate = true;

const context = canvas.getContext('2d');

class Mask {
  constructor() {
    this.width = canvas.width * 0.8;
    this.height = canvas.height * 0.2;
    this.percentTop = 0;
    this.percentBottom = 0;
  }

  fadeIn() {

    const timeline = new TimelineLite();
    timeline.to(this, 1, { percentTop : 1, ease : Power4.easeInOut });
    timeline.to(this, 1, { percentBottom : 1, ease : Power4.easeInOut }, 0.2);
    timeline.to(this, 1, { width : canvas.width * 0.2, ease : Power2.easeInOut },'+=0.5');
    timeline.to(this, 1, { height : canvas.height * 0.8, ease : Power2.easeInOut }, '-=0.7');

    timeline.to(this, 1, { width : canvas.width, ease : Power2.easeInOut }, '+=0.4');
    timeline.to(this, 1, { height : canvas.height, ease : Power2.easeInOut }, '-=1');
  }

  update() {}

  render() {
    const x = (canvas.width - this.width) * 0.5;
    const y = (canvas.height - this.height) * 0.5;

    context.fillStyle = '#000000';
    context.rect(0, 0, canvas.width, canvas.height);
    context.fill();

    context.beginPath();
    context.fillStyle = '#ffffff';

    context.moveTo(x, y);
    context.lineTo(x + (this.width * this.percentTop), y);
    context.lineTo(x + (this.width * this.percentBottom), y + this.height);
    context.lineTo(x, y + this.height);
    context.fill();
  }
}

const mask = new Mask();
mask.fadeIn();



/**
 * * *******************
 * * GRID SYSTEM
 * * *******************
 */

/**
 * * *******************
 * * FBO
 * * *******************
 */
const gpuSim = new GPUSimulation(webgl.renderer, { width : TEXTURE_SIZE, height : TEXTURE_SIZE });
gpuSim.initHelper(windowWidth, windowHeight);

/**
 * DATA TEXTURE
 */
let i;
const dataDotPosition = gpuSim.createDataTexture();
const textureLength = dataDotPosition.image.data.length;

// Set particle positions
for (i = 0; i < textureLength; i += 4) {
  const currentPoint = i / 4;
  if (currentPoint < NBR_OF_POINTS) {
    // Position X and Y
    const positionX = ((currentPoint % NBR_OF_ROWS) / NBR_OF_ROWS) + shiftX;
    const positionY = (Math.floor(currentPoint / NBR_OF_ROWS) / NBR_OF_LINES) + shiftY;

    dataDotPosition.image.data[i] = positionX - 0.5;
    dataDotPosition.image.data[i + 1] = positionY - 0.5;
  } else {
    dataDotPosition.image.data[i] = 999;
    dataDotPosition.image.data[i + 1] = 999;
  }

  // Initial Force
  dataDotPosition.image.data[i + 2] = 0.001;
  dataDotPosition.image.data[i + 3] = -0.002;
}

// Create a simulation and set uniforms for the simulation
const positionFBO = gpuSim.createSimulation('texturePositions', positionFrag, dataDotPosition, {
  uniforms: {
    positionTexture         : { value : null },
    initialDataTexture      : { value: dataDotPosition },
    mousePosition           : { value: new Vector2(-9999, -9999) },
    attractionDistanceMax   : { value : PROPS.attractionDistanceMax },
    attractionVelocity      : { value : PROPS.attractionVelocity },
    anchorVelocity          : { value : PROPS.anchorVelocity },
    anchorFriction          : { value : PROPS.anchorFriction },
    aspectRatio             : { value : webgl.camera.aspect },
    mask                    : { value : canvasTexture },
  },
});

/**
 *************
 * PARTICLE
 *************
 */
const particleMaterial = new ShaderMaterial({
  uniforms: {
    positions   : { value: positionFBO.output.texture },
    mask        : { value : null },
    pointSize   : { value: 3 },
  },
  vertexShader: particleVert,
  fragmentShader: particleFrag,
});

// Create a system of particle
const particles = new Particles(TEXTURE_SIZE, TEXTURE_SIZE, particleMaterial);
webgl.add(particles);

window.addEventListener('mousemove', (e) => {
  const x = (e.offsetX / windowWidth) - 0.5;
  const y = 0.5 - (e.offsetY / windowHeight);
  positionFBO.material.uniforms.mousePosition.value.set(x, y);
});

/**
 **********
 * UPDATE
 **********
 */


console.log(positionFBO);
webgl.onUpdate = () => {
  mask.update();
  mask.render();

  canvasTexture.needsUpdate = true;

  // update all simulations with the textures computed
  gpuSim.updateSimulation(positionFBO);

  // update only one simulation always with the initialDataTexture.
  // gpuSim.updateSimulation(positionFBO, positionFBO.initialDataTexture);
  gpuSim.helper.update();
};

/* ---- CREATING ZONE END ---- */
/* ---- ON RESIZE ---- */
function onResize() {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  positionFBO.material.uniforms.aspectRatio.value = webgl.camera.aspect;
  webgl.resize(windowWidth, windowHeight);
}
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', onResize);
/* ---- LOOP ---- */
function _loop() {
	webgl.update();
	requestAnimationFrame(_loop);
}
_loop();
