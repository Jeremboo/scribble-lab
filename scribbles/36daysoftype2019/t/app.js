import {
  WebGLRenderer, Scene, PerspectiveCamera, Object3D,
  MeshBasicMaterial, Mesh, Color,
  PlaneBufferGeometry, ShaderMaterial, TextureLoader,
  FontLoader, ShapeGeometry,
} from 'three';
import { TweenMax, Power4 } from 'gsap';


import OBJLoader from '../../../modules/OBJLoader';

import CameraMouseControl from '../../../modules/CameraMouseControl';

import { vert, frag } from './shader';

const gradient = './assets/gradient.jpg';
const letterTReversed = './assets/letter_t_reversed.obj';
import fontFile from '../_assets/Glence Black_Regular';

const fontLoader = new FontLoader();
const font = fontLoader.parse(fontFile);

const BACKGROUND_COLOR = '#040507';

const NOISE_SPEED     = 0.0035;
const PERLIN_FORCE     = 2;
const PERLIN_DIMENSION = 1.5;

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

 class Portail extends Object3D {
   constructor(reversedTGeometry) {
     super();

     const basicMaterial = new MeshBasicMaterial({
      color: 0x000000,
      wireframe : false,
    });

     this.size = 5;

     this.reversedMesh = new Mesh(
      reversedTGeometry,
      basicMaterial
     );
     this.reversedMesh.rotation.x = Math.PI / 2;
     this.reversedMesh.rotation.y = Math.PI;

     this.add(this.reversedMesh);

     this.meshLeft = new Mesh(
       new PlaneBufferGeometry(this.size * 4, this.size * 3, 1),
       basicMaterial
     );
     this.add(this.meshLeft);

     this.meshRight = new Mesh(
      new PlaneBufferGeometry(this.size * 4, this.size * 3, 1),
      basicMaterial
    );
    this.add(this.meshRight);

    this.meshTop = new Mesh(
      new PlaneBufferGeometry(this.size, this.size * 2, 1),
      basicMaterial
    );
    this.add(this.meshTop);
    this.meshBottom = new Mesh(
      new PlaneBufferGeometry(this.size, this.size, 1),
      basicMaterial
    );
    this.add(this.meshBottom);

    this.reset();

    this.update = this.update.bind(this);
   }

   fadeIn(callback) {
    TweenMax.to(this.position, 2, { y : 0, ease : Power4.easeOut });

    TweenMax.to(this.reversedMesh.scale, 1.5, { x: 1, z : 1,y : 1, ease : Power4.easeOut });

     TweenMax.to(this.meshLeft.position, 2, { x : -this.size * 2.5, ease: Power4.easeOut });
     TweenMax.to(this.meshRight.position, 2, { x : this.size * 2.5, ease: Power4.easeOut });
     TweenMax.to(this.meshTop.position, 2, { y : this.size * 1.5, ease: Power4.easeOut });
     TweenMax.to(this.meshBottom.position, 2, { y : -this.size, ease: Power4.easeOut });

     setTimeout(() => {
        callback();
     }, 2000);
   }

   update() {
    // this.reversedMesh.rotation.x += 0.1;
   }

   reset() {
    this.visible = false;
    this.position.set(0, -1, 0);
    this.reversedMesh.scale.set(0, 1, 1);

    this.meshLeft.position.x = -this.size * 2;
    this.meshRight.position.x = this.size * 2;
    this.meshTop.position.y = this.size * 1.5;
    this.meshBottom.position.y = -this.size;

    this.position.set(0, -1, 0);
    this.scale.set(1, 1, 1);
   }
 }


class T extends Object3D {
  constructor() {
    super();
    const geom = new ShapeGeometry(
      font.generateShapes('T', 3),
    );

    geom.computeBoundingBox();

    const mat = new MeshBasicMaterial({
      color : 0x000000,
    });

    this.mesh = new Mesh(geom, mat);
    this.mesh.position.x = -geom.boundingBox.max.x * 0.5;
    this.mesh.position.y = -geom.boundingBox.max.y * 0.5;
    this.add(this.mesh);

    this.reset();

    this.update = this.update.bind(this);
  }

  update() {
  }

  fadeIn (callback) {
    TweenMax.to(this.rotation, 2.5, { y : 0, ease : Expo.easeOut });
    TweenMax.to(this.position, 2, { y : 0, ease : Power4.easeOut });
    TweenMax.to(this.scale, 2, { y : 1, x : 1, ease : Power4.easeOut });
    setTimeout(() => {
      // TweenMax.killAll();
      callback();
    }, 2500);
  }

  reset() {
    this.visible = false;
    // this.rotation.y = -Math.PI;
    this.position.set(0, -1, 0);
    this.scale.set(0, 0.8, 1);
  }
}


// OBJECTS
class ColoredBackground extends Object3D {
  constructor(gradient) {
    super();

    const geometry = new PlaneBufferGeometry(40, 30, 20, 20);
    const material = new ShaderMaterial({
      uniforms : {
        timer              : { value : 0 },
        perlinForce        : { value : PERLIN_FORCE },
        perlinDimension    : { value : PERLIN_DIMENSION },
        perlinTransition   : { value : 1 },
        gradientDistortion : { value : 1.2 },
        gradientTexture    : { value : gradient }
      },
      vertexShader   : vert,
      fragmentShader : frag
    });

    this.background = new Mesh(geometry, material);
    this.add(this.background);

    this.update = this.update.bind(this);
  }

  update() {
    this.background.material.uniforms.timer.value += NOISE_SPEED;
  }
}

const loader = new OBJLoader();
loader.load(letterTReversed, obj => {
  const loader = new TextureLoader();
  loader.load(gradient, (texture) => {
    const coloredPlane = new ColoredBackground(texture);
    coloredPlane.position.z = -5
    webgl.add(coloredPlane);

    const t = new T();
    t.position.z = -1;
    t.visible = false;
    webgl.add(t);

    const portail = new Portail(obj.children[0].geometry);
    portail.visible = false;
    webgl.add(portail);

    function showT() {
      t.visible = true;
      t.fadeIn(() => {
        TweenMax.to(t.scale, 2, { x: 150, y: 150, ease : Power4.easeInOut });
        TweenMax.to(t.position, 2, {
          z: -2,
          y: -80,
          ease : Power4.easeInOut
        });

        setTimeout(() => {
          TweenMax.killAll();
          showPortail();
          t.reset();
        }, 1500);
      });
    }

    function showPortail() {
      portail.visible = true;
      portail.fadeIn(() => {
        TweenMax.to(portail.position, 3, {
          z : webgl.camera.position.z,
          y : -0.6,
          // x: -0.228,
          ease: Power4.easeInOut,
        });
        TweenMax.to(portail.scale, 3, {
          x: 20, y: 20,
          ease: Power4.easeInOut,
        });

        setTimeout(() => {
          TweenMax.killAll();
          portail.reset();
          showT();
        }, 2000);
      });
    }

    setTimeout(() => {
      showT();
    }, 1000);
  });
});



// CAMERA CONTROLLER
const cameraControl = new CameraMouseControl(webgl.camera, {
  mouseMove: [-4, -4],
  velocity: [0.1, 0.1],
});

cameraControl.increaseDeep = function(z) {
  this.camera.position.z += z;
  this.lookAt.z += z;
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
  webgl.update();
  cameraControl.update();
  requestAnimationFrame(loop);
}
loop();
