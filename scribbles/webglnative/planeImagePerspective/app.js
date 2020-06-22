import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  ShaderMaterial,
  Mesh,
  Color,
  PlaneBufferGeometry,
  TextureLoader,
  DoubleSide
} from 'three';
import { TweenLite } from 'gsap';
import dat from 'dat.gui';
import imageController from './dat.gui.image';
imageController(dat);
import OrbitControls from '../../../modules/OrbitControls';

const BACKGROUND_COLOR = '#ffffff';
const TEXTURE_URL = './texture.png';

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
    this.camera = new PerspectiveCamera(50, w / h, 1, 1000);
    this.camera.position.set(0, 0, 10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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

const PROPS = {
  intensity: 2,
  texture: TEXTURE_URL,
  color: '#aaee00'
};

const tl = new TextureLoader();

// OBJECTS
class PerspectiveImage extends Mesh {
  constructor() {
    const geometry = new PlaneBufferGeometry(8, 8, 500, 500);
    const material = new ShaderMaterial({
      uniforms: {
        texture: { value: null },
        intensity: { value: PROPS.intensity }
      },
      side: DoubleSide,
      fragmentShader: `

        varying vec2 vUv;
        varying vec4 vTexture;

        void main() {
          vec4 color = vec4(1.0, 0.0, 0.0, 1.0);
          gl_FragColor = vTexture;
        }
      `,
      vertexShader: `
        uniform sampler2D texture;
        uniform float intensity;

        varying vec2 vUv;
        varying vec4 vTexture;

        void main() {
          vUv = uv;
          vUv.y = vUv.y;
          vec4 img = texture2D(texture, vUv);
          vTexture = img;

          vec4 mvPosition = modelMatrix * vec4( position, 1.0 );
          mvPosition.z += img.x * intensity - (intensity * 0.5);

          gl_Position = projectionMatrix * viewMatrix * mvPosition;
        }
      `
    });
    super(geometry, material);

    tl.load(PROPS.texture, texture => {
      this.material.uniforms.texture.value = texture;
    });

    this.update = this.update.bind(this);
  }

  update() {}
}

// START
const imagePlane = new PerspectiveImage();
webgl.add(imagePlane);

/**
 * * *******************
 * * GUI
 * * *******************
 */

const gui = new dat.GUI();
gui
  .add(PROPS, 'intensity', -10, 10)
  .onChange(value => {
    imagePlane.material.uniforms.intensity.value = value;
  })
  .listen();
// gui.addColor(PROPS, 'color');

/**
 * * *******************
 * * HACK DAT GUI C'EST TIPAR
 * * *******************
 */

// Usage
gui
  .addImage(PROPS, 'texture')
  .name('super texture')
  .listen()
  .onChange((image, firstTime) => {
    if (firstTime) return;
    TweenLite.to(imagePlane.material.uniforms.intensity, 0.3, {
      value: 0,
      ease: Power2.easeIn,
      onUpdate: () => {
        PROPS.intensity = imagePlane.material.uniforms.intensity.value;
      },
      onComplete: () => {
        imagePlane.material.uniforms.texture.value.needsUpdate = true;
        imagePlane.material.uniforms.texture.value.image = image;

        TweenLite.to(imagePlane.material.uniforms.intensity, 0.5, {
          value: 2,
          ease: Power2.easeOut,
          onUpdate: () => {
            PROPS.intensity = imagePlane.material.uniforms.intensity.value;
          }
        });
      }
    });
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
}
loop();
