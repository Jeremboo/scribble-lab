import {
  Mesh, ShaderMaterial, Color, PlaneBufferGeometry, TextureLoader, NearestFilter, LinearFilter,
  RepeatWrapping, DoubleSide, Texture,
  Vector3,
  MeshStandardMaterial,
  Vector2,
  PointLight,
  AmbientLight
} from 'three';
import gsap from 'gsap';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import AudioCanvas from './audioCanvas';
import OrbitControls from '../../../modules/OrbitControls';
import CameraMouseControl from '../../../modules/CameraMouseControl';
import Stars from '../../../modules/Stars';
import { horizontalTwist } from '../../../utils/glsl';

// TODO 2023-10-06 jeremboo: AJOUTER GRATIENT AND SHADOWS
// TODO 2023-10-05 jeremboo: ADD OTHER ANIMATIONS / DISTORTIONS / ...
// TODO 2023-10-07 jeremboo: Améliorer les particules pour qu'elles soient plus subtiles
// TODO 2023-10-07 jeremboo: Rendre la ligne moins rectiligne
// TODO 2023-10-07 jeremboo: Ajouter la vignette partout en postprocessing
// TODO 2023-10-07 jeremboo: PARALLAX entre les 2 lignes
// TODO 2023-10-07 jeremboo: Avoir les deux lignes un tout petit peut dissocié

const PROPS = {
  ui: true,
  vignette: true,
  orbitControl: false,
  canvas: false,
  mainColor: '#EF8E17',
  bgColor: '#D61D1D',
  colorPattern: ["#EF8E17", "#1D40F3", "#90FF38", "#F96BFC"],
  // Shader props
  vertDivider: 4,
  infiniteShift: -0.0007,
  infiniteSlice: 0,
  infiniteWave: 0.025,
  tSkew: 0,
  waveStrengh: 0.05,
  waveLenght: 1.1,
  curve: 5,
  curvePow: 1,
  curveShift: 1,
  // Twist
  twistStrenght: 0,
  infiniteTwistShift: 0,
  // PHYSICS
  velocity: 0.02,
  friction: 0.9,
  scaleY: 1.2,
};

class Album extends Mesh {

  constructor() {
    const geometry = new PlaneBufferGeometry(4, 4, 1, 1);
    const material = new MeshStandardMaterial({
    });
    super(geometry, material);

    this.position.z = -3;
    this.rotation.y = Math.PI;

    this.handleMouseMove = this.handleMouseMove.bind(this);

    document.body.addEventListener('mousemove', this.handleMouseMove);

    this.isVisible = false;
  }

  handleMouseMove (e) {
    if (!this.isVisible) return;

    const mousePosition = new Vector2(
      e.clientX / window.innerWidth - 0.5,
      e.clientY / window.innerHeight - 0.5
      );

    this.lookAt(new Vector3(mousePosition.x * 2, -mousePosition.y * 2, 2));
  }

  animateIn() {
    this.isVisible = false;
    gsap.to(this.rotation, { duration: 3, y: 0, ease: "elastic.out(1, 0.5)" });
    gsap.to(this.position, { duration: 2, z: 1, ease: "elastic.out(1, 0.5)", onComplete: () => {
      this.isVisible = true;
    } });

  }

  update() {

  }
}

class AudioLine extends Mesh {
  constructor(color1, color2) {
    const geometry = new PlaneBufferGeometry(20, 8, 50, 50);
    const material = new ShaderMaterial({
      transparent: true,
      // side: DoubleSide,
      // wireframe: true,
      uniforms: {
        tColor1: { value: color1 },
        tColor2: { value: color2 },
        tTexture: { value: null },
        tVertDivider: { value: PROPS.vertDivider },
        tInfiniteSlice: { value: 0 },
        tInfiniteWave: { value: 0 },
        tInfiniteShift: { value: 0 },
        tShift: { value: 0 },
        tSkew: { value: PROPS.tSkew },
        tWave: { value: PROPS.waveStrengh },
        tWaveSin: { value: PROPS.waveLenght },
        tcurve: { value: PROPS.curve },
        tcurvePow: { value: PROPS.curvePow },
        tcurveShift: { value: PROPS.curveShift },
        twistStrenght: { value: PROPS.twistStrenght },
        tInfiniteTwistShift: { value: PROPS.infiniteTwistShift },
      },
      fragmentShader: `
        uniform sampler2D tTexture;

        uniform vec3 tColor1;
        uniform vec3 tColor2;

        uniform float tVertDivider;
        uniform float tShift;
        uniform float tSkew;

        uniform float tInfiniteShift;
        uniform float tInfiniteSlice;
        uniform float tInfiniteWave;

        uniform float tWave;
        uniform float tWaveSin;

        uniform float tcurve;
        uniform float tcurvePow;
        uniform float tcurveShift;

        varying vec2 vUv;

        void main() {
          // gl_FragColor = vec4(1.0);
          // return;

          vec2 transformedUv = vUv;

          //Skew
          transformedUv.x -= (transformedUv.y - 0.5) * tSkew;

          // Divider
          transformedUv.x *= tVertDivider;
          transformedUv.y *= 4.0;

          // Wave
          transformedUv.y += sin((transformedUv.x * tWaveSin) + tInfiniteWave) * tWave;

          // ScaleY / Curve
          float mult = sin(vUv.x * 3.14 * tcurveShift);
          transformedUv.y = transformedUv.y + (transformedUv.y * pow(mult, tcurvePow) * tcurve) - pow(mult, tcurvePow) * 2. * tcurve;

          // Hide the top and the bottom repetition
          if (transformedUv.y > 2.98) discard;
          if (transformedUv.y < 1.02) discard;

          // Upside down
          if (transformedUv.y < 2.0) {
            transformedUv.y = 1.01 - transformedUv.y;
            transformedUv.x += tInfiniteSlice;
          } else {
            transformedUv.y += 0.01;
            transformedUv.x -= tInfiniteSlice;
          }

          transformedUv.x += tShift + tInfiniteShift;

          vec4 tex = texture2D(tTexture, transformedUv);

          gl_FragColor = vec4(
            mix(tColor1.xyz, tColor2.xyz, tex.r),
            tex.a
          );
        }
      `,
      vertexShader: `
        uniform float twistStrenght;
        uniform float tInfiniteTwistShift;

        varying vec2 vUv;

        ${horizontalTwist}

        void main () {
          vUv = uv;
          vec3 transformed = position.xyz;

          vec4 torced = horizontalTwist(vec4(transformed, 1.0), transformed.x * twistStrenght + tInfiniteTwistShift);

          gl_Position = projectionMatrix * modelViewMatrix * torced;
        }
      `,
    });
    super(geometry, material);


    this.force = new Vector3();
    this.position.set(0, 20, 20);
    this.targetedPosition = new Vector3(0, 20, 20);

    this.update = this.update.bind(this);
    this.animateIn = this.animateIn.bind(this);

    this.scale.y = PROPS.scaleY;
  }

  animateIn() {
    this.position.y = 0;
    this.position.z = 3;
    this.targetedPosition.set(0, 0.5, 0.2);
  }

  update({ playhead }) {
    this.material.uniforms.tInfiniteShift.value += PROPS.infiniteShift;
    this.material.uniforms.tInfiniteSlice.value += PROPS.infiniteSlice;
    this.material.uniforms.tInfiniteWave.value += PROPS.infiniteWave;
    this.material.uniforms.tInfiniteTwistShift.value += PROPS.infiniteTwistShift;

    // Get the gravity
    this.force.x += (this.position.x - this.targetedPosition.x) * PROPS.velocity;
    this.force.y += (this.position.y - this.targetedPosition.y) * PROPS.velocity;
    this.force.z += (this.position.z - this.targetedPosition.z) * PROPS.velocity;
    // Apply a force to the position
    this.position.sub(this.force);
    // Reduce the force
    this.force.multiplyScalar(PROPS.friction);
  }
}

function toggleClass(classname) { document.body.classList.toggle(classname); }
function toggleUI() { toggleClass('ui'); }
function toggleVignette() { toggleClass('vignette'); }
function toggleCanvas() { toggleClass('canvas'); }

if (PROPS.ui) { toggleUI(); }
if (PROPS.vignette) { toggleVignette(); }
if (PROPS.canvas) { toggleCanvas(); }

let t = 0;

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas, transparent: true });

  const controls = new OrbitControls(renderer.camera, context.canvas);
  controls.enableRotate = PROPS.orbitControl;
  const cameraControl = new CameraMouseControl(renderer.camera, { mouseMove : [-2.5, -5], velocity: [0.02, 0.04]});


  // * START *****
  const stars = new Stars(100, { scalarMin: 8, scalarMax: 10, rotation: 0.001, opacity: 1, speed: 0.02 });
  renderer.add(stars);

  const mesh = new AudioLine(new Color(PROPS.colorPattern[0]), new Color(PROPS.colorPattern[1]));
  renderer.add(mesh);

  const mesh2 = new AudioLine(new Color(PROPS.colorPattern[2]), new Color(PROPS.colorPattern[3]));
  mesh2.rotation.x += Math.PI;
  mesh2.position.z -= 0.1;
  renderer.add(mesh2);

  // * Texture
  const setTexture = (texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    texture.minFilter = LinearFilter;
    mesh.material.uniforms.tTexture.value = texture;
    mesh.material.needsUpdate = true;
    mesh2.material.uniforms.tTexture.value = texture;
    mesh2.material.needsUpdate = true;
    texture.needsUpdate = true;
  }

  const audioCanvas = new AudioCanvas();
  const audioTexture = new Texture(audioCanvas.canvas);
  setTexture(audioTexture);

  setTimeout(() => {
    mesh.animateIn();
    mesh2.animateIn();
    gsap.fromTo(mesh.material.uniforms.tcurve, { value: 100 }, { duration : 0.5, value: 5, ease: "elastic.out(0.01, 0.4)", delay: 0 });
  }, 1000);

  // * Functions *

  const FUNCTIONS = {
    bounce: () => {
      mesh.force.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5),
      );
    },
    move: () => {
      mesh.targetedPosition.set(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5),
      );
    },
    slice: () => {
      gsap.fromTo(PROPS, { infiniteSlice: 0 }, { duration: 0.8, repeat: 1, yoyo: true, infiniteSlice: 0.01 })
    },
    divide: (ease = "ease.out", duration = 0.8) => {
      const newValue = Math.max(1, Math.floor(Math.random() * 6));
      gsap.to(mesh.material.uniforms.tVertDivider, {
        duration, value: Math.max(1, Math.floor(Math.random() * 6)),
        ease
      });
    },
    divideBounce: () => {
      FUNCTIONS.divide("elastic.out(1, 0.3)", 1.5);
    },
    moveAndSkew: () => {
      const duration = 3;
      const ease = 'back.inOut(1.2)';
      gsap.to(mesh.material.uniforms.tShift, {
        duration,
        value: mesh.material.uniforms.tShift.value - 2,
        ease
      });
      gsap.to(mesh.material.uniforms.tSkew, {
        duration: duration * 0.5,
        yoyo: true,
        repeat: 1,
        value: 0.05,
        ease
      });
    },
    move: () => {
      gsap.to(mesh.material.uniforms.tShift, {
        duration: 3,
        ease: "power4.inOut",
        value: mesh.material.uniforms.tShift.value - 2,
      });
    },
    moveBounce: () => {
      const targetedValue = mesh.material.uniforms.tShift.value - 2;
      gsap.to(mesh.material.uniforms.tShift, {
        duration: 4,
        value: targetedValue,
        ease: "elastic.out(1, 0.5)",
        onUpdate: () => {
          mesh.material.uniforms.tVertDivider.value = 4 - (targetedValue - mesh.material.uniforms.tShift.value) * 2;
          // mesh.material.uniforms.tVertDivider.value = 4 - (mesh.material.uniforms.tShift.value - targetedValue) * 2;
        }
      });
    },
    animateWave: () => {
      mesh.material.uniforms.tWave.value = PROPS.tWave;
      mesh.material.uniforms.tWaveSin.value = PROPS.waveLenght;
      gsap.to(mesh.material.uniforms.tWave, {
        duration: 1,
        // yoyo: true,
        // repeat: 1,
        value: 0.1,
        // ease: ''
      });
      gsap.to(mesh.material.uniforms.tWaveSin, { value: 0.01, delay: 1 });
      gsap.to(mesh.material.uniforms.tWave, { duration: 0.5, value: 0, delay: 1 });
    },
    twist: (ease, durationBounce = 1, durationTwist = 0.5, force = 0.1) => {
      gsap.to(mesh.material.uniforms.tInfiniteTwistShift, {
        duration: durationBounce,
        value: mesh.material.uniforms.tInfiniteTwistShift.value + Math.PI,
        ease,
      });
      gsap.to(mesh.material.uniforms.twistStrenght, {
        duration: durationTwist,
        value: force,
      });
      gsap.to(mesh.material.uniforms.twistStrenght, {
        duration: durationBounce - durationTwist,
        delay: durationTwist,
        value: 0,
        ease
      });
      gsap.to(mesh2.material.uniforms.tInfiniteTwistShift, {
        duration: durationBounce,
        value: mesh2.material.uniforms.tInfiniteTwistShift.value + Math.PI,
        ease,
      });
      gsap.to(mesh2.material.uniforms.twistStrenght, {
        duration: durationTwist,
        value: force,
      });
      gsap.to(mesh2.material.uniforms.twistStrenght, {
        duration: durationBounce - durationTwist,
        delay: durationTwist,
        value: 0,
        ease
      });
      document.body.classList.toggle('twisted');
    },
    twistBounce: () => {
      FUNCTIONS.twist("elastic.out(1, 0.4)", 4, 0.6, 0.1)
    },
    toggleScale: () => {
      gsap.to(mesh.material.uniforms.tcurve, { duration : 1, value: mesh.material.uniforms.tcurve.value < 0.5 ? 20 : 0, ease: "power3.inOut" })
    },
    showAlbum: () => {
      album.animateIn();
      mesh.visible = false;
      mesh2.visible = false;
    }
  }

  // * GUI *******
  const gui = new GUI();
  gui.close();
  const uiFolder = gui.addFolder('ui');
  uiFolder.add(PROPS, 'ui').onChange(toggleUI);
  // uiFolder.add(PROPS, 'vignette').onChange(toggleVignette);
  uiFolder.add(PROPS, 'orbitControl').onChange(() => {
    controls.enableRotate = PROPS.orbitControl;
  });
  uiFolder.add(PROPS, 'canvas').onChange(toggleCanvas);
  gui.add(PROPS, 'scaleY', 0, 2).onChange((newValue) => {
    mesh.scale.y = newValue;
    mesh2.scale.y = newValue;
  });
  // CURVE
  gui.add(PROPS, 'curve', 0, 100).onChange((newValue) => {
    mesh.material.uniforms.tcurve.value = newValue;
  });
  gui.add(PROPS, 'curvePow', 0, 20).onChange((newValue) => {
    mesh.material.uniforms.tcurvePow.value = newValue;
  });
  gui.add(PROPS, 'curveShift', 1, 2).onChange((newValue) => {
    mesh.material.uniforms.tcurveShift.value = newValue;
  }).step(0.1);
  // SKEW
  gui.add(PROPS, 'tSkew', 0, 0.1).onChange((newValue) => {
    mesh.material.uniforms.tSkew.value = newValue;
    mesh.rotation.x = -newValue;
  });
  gui.add(PROPS, 'waveStrengh', 0, 1).onChange((newValue) => {
    mesh.material.uniforms.tWave.value = newValue;
  }).step(0.01);
  gui.add(PROPS, 'waveLenght', 0, 10).onChange((newValue) => {
    mesh.material.uniforms.tWaveSin.value = newValue;
  });
  gui.add(PROPS, 'vertDivider', 1, 10).step(1).onChange((newvalue) => {
    mesh.material.uniforms.tVertDivider.value = newvalue;
  });
  gui.add(PROPS, 'twistStrenght', 0, 1).onChange((newValue) => {
    mesh.material.uniforms.twistStrenght.value = newValue;
  }).step(0.001);


  const physicFolder = gui.addFolder('physic');
  physicFolder.add(PROPS, 'velocity', 0.001, 0.2);
  physicFolder.add(PROPS, 'friction', 0.01, 0.99);

  const animationFolder = gui.addFolder('animation Ideas');
  animationFolder.open();
  animationFolder.add(PROPS, 'infiniteSlice', -0.01, 0.01).step(0.001);
  animationFolder.add(PROPS, 'infiniteShift', -0.005, 0.005).step(0.0001);
  animationFolder.add(PROPS, 'infiniteWave', -0.05, 0.05).step(0.001);
  animationFolder.add(PROPS, 'infiniteTwistShift', 0, 0.01);
  animationFolder.add(FUNCTIONS, 'slice');
  animationFolder.add(FUNCTIONS, 'bounce');
  animationFolder.add(FUNCTIONS, 'moveBounce');
  animationFolder.add(FUNCTIONS, 'divideBounce');
  animationFolder.add(FUNCTIONS, 'twistBounce');
  // animationFolder.add(mesh.targetedPosition, 'z', -10, 5).name('moveZBounce')
  animationFolder.add(FUNCTIONS, 'move');
  animationFolder.add(FUNCTIONS, 'divide');
  animationFolder.add(FUNCTIONS, 'moveAndSkew');
  // animationFolder.add(FUNCTIONS, 'animateWave');
  animationFolder.add(FUNCTIONS, 'twist');
  // animationFolder.add(FUNCTIONS, 'toggleScale');
  animationFolder.add(FUNCTIONS, 'showAlbum');


  // ALBUM

  const ambient = new AmbientLight(0xffffff, 0.8, 100);
  renderer.add(ambient);
  const light = new PointLight(0xffffff, 0.3, 100);
  light.position.set(1, 1, 4);
  renderer.add(light);

  const album = new Album();
  renderer.add(album);
  const loader = new TextureLoader();
  loader.load('./assets/album.png', (texture) => {
    album.material.map = texture;
    album.material.needsUpdate = true;
  });

  loader.load('./assets/5814-normal.jpeg', (texture) => {
    console.log('loaded');
    album.material.normalMap = texture;
    album.material.normalScale.x = 0.5;
    album.material.normalScale.y = 0.5;
    album.material.needsUpdate = true;
  });



  return {
    resize(props) {
      renderer.resize(props);
    },
    render(props) {
      audioCanvas.update();
      audioCanvas.render();
      audioTexture.needsUpdate = true;
      t += 0.01;
      if (!PROPS.orbitControl) {
        cameraControl.update();
      }

      album.update();

      renderer.update(props);

    },
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
}, {
  fps: 15, // 24
  duration: 4,
  // dimensions: [480, 480], // need fullscreen
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
