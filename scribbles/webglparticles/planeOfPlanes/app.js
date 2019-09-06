import {
  WebGLRenderer, Scene, PerspectiveCamera,
  Mesh, Color, FlatShading,
  InstancedBufferGeometry, InstancedBufferAttribute,
  UniformsUtils, UniformsLib, ShaderMaterial,
  AmbientLight, BufferAttribute, Texture,
  LinearFilter, RGBFormat, PlaneBufferGeometry, Object3D,
  MeshBasicMaterial, DirectionalLight,
} from 'three';

import CameraMouseControl from 'CameraMouseControl';
// import OrbitControls from 'OrbitControl';
import GPUSimulation from 'GPUSimulation';

import fragInstanced from './shaders/instanced.f.glsl';
import vertInstanced from './shaders/instanced.v.glsl';
import shaderSimulationPosition from './shaders/simulationPosition.f.glsl';

import { loadVideo, onCursorTouchMeshes } from 'utils';

import videoTest from 'videoTest1.mp4';

/**
* * *******************
* * PROPS
* * *******************
*/

const TILE_RADIUS         = 1;
const TILE_SIZE           = TILE_RADIUS * 2;
const TILE_MARGIN         = 0.2;
const TILE_LIGHTING_FORCE = 0.02;

const WAVE_SPEED     = 0.008;
const WAVE_FORCE     = 4;
const WAVE_DIMENTION = 2;

const ATTRACTION_DISTANCE_MAX = 30;
const ATTRACTION_VELOCITY     = 0.1;

// Props auto computed

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
    this.renderer.setClearColor(new Color('#010101'));
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 200);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
 * * https://threejs.org/examples/?q=video#webgl_materials_video
 * * *******************
 */

/**
 * * *******************
 * * GRID OBJECT
 * * *******************
 */
class VideoGrid extends Object3D {
  constructor(videoElement, tilePerPixel = 8) {
    super();

    // PROPS
    this.tilePerPixel = tilePerPixel;

    this.videoWidth = videoElement.videoWidth;
    this.videoHeight = videoElement.videoHeight;

    this.horizontalTileNbr = Math.floor(this.videoWidth / this.tilePerPixel);
    this.verticalTileNbr = Math.floor(this.videoHeight / this.tilePerPixel);

    this.instanceCount = this.horizontalTileNbr * this.verticalTileNbr;

    this.lineWidth = (TILE_SIZE + TILE_MARGIN) * this.horizontalTileNbr;
    this.lineHeight = (TILE_SIZE + TILE_MARGIN) * this.verticalTileNbr;

    // Create the FBO simulation
    // TODO try to not create a simulation each time
    this.simulation = new GPUSimulation(webgl.renderer, {
      width: this.horizontalTileNbr,
      height: this.verticalTileNbr
    });
    // this.simulation.initHelper(windowWidth, windowHeight);
    this.positionFBO = this.createFBOPosition();

    // Create the main mesh
    const material = this.createMaterial();
    const geometry = this.createInstanciedGeometry();

    // ! TODO waiting for r103 to use VideoTexture intead https://github.com/mrdoob/three.js/issues/13379
    const textureVideo = new Texture(videoElement);
    textureVideo.minFilter = LinearFilter;
    textureVideo.magFilter = LinearFilter;
    textureVideo.format = RGBFormat;

    material.uniforms.videoTexture.value = textureVideo;

    this.mesh = new Mesh(geometry, material);
    this.add(this.mesh);

    // Create the mesh usefull add over effect
    this.layerMesh = new Mesh(
      new PlaneBufferGeometry(this.lineWidth, this.lineHeight, 1),
      new MeshBasicMaterial({
        wireframe: true,
        visible: false
      }),
    );
    this.add(this.layerMesh);

    // BIND
    this.update = this.update.bind(this);

    // Auto play
    videoElement.play();
  }

  /**
   * * *******************
   * * FBO Simulation
   */
  createFBOPosition() {
    // Create the data
    const dataPosition = this.simulation.createDataTexture();
    const textureArraySize = this.instanceCount * 4;

    for (let i = 0; i < textureArraySize; i += 4) {
      const idx = i / 4;
      // X - Y
      dataPosition.image.data[i] = ((idx % this.horizontalTileNbr) * (TILE_SIZE + TILE_MARGIN)) - (this.lineWidth * 0.5);
      dataPosition.image.data[i + 1] = Math.floor(idx / this.horizontalTileNbr) * (TILE_SIZE + TILE_MARGIN) - (this.lineHeight * 0.5);

      // Glitched Z
      dataPosition.image.data[i + 2] = Math.random() > 0.5 ? Math.random() * 4 : 0;

      // Empty for now
      dataPosition.image.data[i + 3] = 1;
    }

    // Create the FBO simulation
    return this.simulation.createSimulation(
      'texturePosition', shaderSimulationPosition, dataPosition, {
        uniforms: {
          // Fist position of each particle
          initialPositionTexture: { type: 't', value: dataPosition },
          // Perlin parameters
          perlinTime      : { value : 0 },
          perlinDimention : { value : WAVE_DIMENTION },
          perlinForce     : { value : WAVE_FORCE },
          // Mouse Attraction
          mousePosition   : { value : { x: -9999, y: -9999 }},
          attractionDistanceMax : { value : ATTRACTION_DISTANCE_MAX },
          attractionVelocity    : { value : ATTRACTION_VELOCITY }
        },
      },
    );
  }

  /**
   * * *******************
   * * Instance Mesh Methods
   */
  createMaterial() {
    const uniforms = UniformsUtils.merge([
      UniformsLib.common,
      UniformsLib.lights,
      UniformsLib.shadowmap,
      {
        positions          : { value: this.positionFBO.output.texture }, // must be updated into the loop
        videoTexture       : { value: null },
        tileGrid           : { value: { x: this.horizontalTileNbr, y: this.verticalTileNbr }},
        depthLightingForce : { value: TILE_LIGHTING_FORCE }
      },
    ]);

    return new ShaderMaterial({
      uniforms,
      vertexShader: vertInstanced,
      fragmentShader: fragInstanced,
      lights: true,
      flatShading: FlatShading,
    });
  }

  createInstanciedGeometry() {
    // Base geometry
    const planeVertices = new Float32Array( [
      -TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS,
       TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS,
       TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,

       TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,
      -TILE_RADIUS,  TILE_RADIUS,  TILE_RADIUS,
      -TILE_RADIUS, -TILE_RADIUS,  TILE_RADIUS
    ] );
    const planePositionAttribute = new BufferAttribute(planeVertices, 3);

    // Create custom FBO UV to have the good coordinate into the shader
    const fboUv = new InstancedBufferAttribute(
      new Float32Array(this.instanceCount * 2), 2,
    );
    for (let i = 0; i < this.instanceCount; i++) {
      const x = (i % this.horizontalTileNbr) / this.horizontalTileNbr;
      const y = (Math.floor((i / this.horizontalTileNbr)) / this.verticalTileNbr);

      fboUv.setXY(i, x, y);
    }

    // Instance of the geometry + properties
    const instanciedGeometry = new InstancedBufferGeometry();
    instanciedGeometry.addAttribute('position', planePositionAttribute);
    instanciedGeometry.addAttribute('fboUv', fboUv);

    return instanciedGeometry;
  }

  /**
   * * *******************
   * * Update
   */
  update() {
    // FBO update
    this.simulation.updateAll();
    // this.simulation.helper.update();
    this.positionFBO.material.uniforms.perlinTime.value += WAVE_SPEED;

    // Video update
    // ! Temporary fix
    this.mesh.material.uniforms.videoTexture.value.needsUpdate = true;

    // Instancied mesh update with the FBO
    this.mesh.material.uniforms.positions.value = this.positionFBO.output.texture;
  }

  updateCursorPosition(cursorUVPosition) {
    // Position have to be normalized
    this.positionFBO.material.uniforms.mousePosition.value.x = cursorUVPosition.x;
    this.positionFBO.material.uniforms.mousePosition.value.y = cursorUVPosition.y;
  }
}

/**
 * * *******************
 * * SCENE
 * * *******************
 */

// LIGHTS
const ambiantLight = new AmbientLight(0xffffff, 0.9);
webgl.scene.add(ambiantLight);

// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, { mouseMove : [-100, -100], velocity: [0.1, 0.1]});


/**
 * * *******************
 * * START
 * * *******************
 */

async function createVideoGrid() {
  // Load video
  const videoElement = await loadVideo(videoTest, { loop: true, muted: true });

  const videoGrid = new VideoGrid(videoElement);
  webgl.add(videoGrid);

  // On mouse move
  onCursorTouchMeshes(webgl.camera, [videoGrid.layerMesh], (intersects) => {
    const objectIntersected = intersects[0];
    if (objectIntersected) {
      videoGrid.updateCursorPosition(objectIntersected.point);
    } else {
      // TODO fade out
      videoGrid.updateCursorPosition({ x: -9999, y: -9999 });
      console.log('tracer out')
    }
  });
}

createVideoGrid();

/**
 * * *******************
 * * UPDATE
 * * *******************
 */
const update = () => {
  // Camera update
  cameraControl.update();

  webgl.update();
};

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
  update();
  requestAnimationFrame(loop);
}
loop();
