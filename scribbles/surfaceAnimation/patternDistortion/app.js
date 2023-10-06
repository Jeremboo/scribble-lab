import {
  Mesh, ShaderMaterial, Color, PlaneBufferGeometry, TextureLoader, NearestFilter, LinearFilter,
  RepeatWrapping, Vector2,
  Vector3
} from 'three';
import gsap from 'gsap';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import OrbitControls from '../../../modules/OrbitControls';
import CameraMouseControl from '../../../modules/CameraMouseControl';

const PROPS = {
  mainColor: '#EF8E17',
  bgColor: '#D61D1D',
  patterns: ["#EF8E17", "#D61D1D", "#1D40F3"],
  // Shader props
  vertDivider: 4,
  infiniteShift: 0,
  infiniteSlice: 0,
  infiniteWave: 0.005,
  tSkew: 0,
  tWave: 0,
  waveSin: 4,
  scaleY: 12,
  scaleYPow: 10,
  scaleYShift: 0,
  // PHYSICS
  velocity: 0.02,
  friction: 0.9,
};


// TODO 2023-10-05 jeremboo: ADD MOUSE CONTROL
// TODO 2023-10-05 jeremboo: ADD OTHER ANIMATIONS / DISTORTIONS / ...
class CustomMesh extends Mesh {
  constructor() {
    const geometry = new PlaneBufferGeometry(20, 8);
    const material = new ShaderMaterial({
      transparent: true,
      uniforms: {
        tTexture: { value: null },
        tVertDivider: { value: PROPS.vertDivider },
        tInfiniteSlice: { value: 0 },
        tInfiniteWave: { value: 0 },
        tInfiniteShift: { value: 0 },
        tShift: { value: 0 },
        tSkew: { value: PROPS.tSkew },
        tWave: { value: PROPS.tWave },
        tWaveSin: { value: PROPS.waveSin },
        tscaleY: { value: PROPS.scaleY },
        tscaleYPow: { value: PROPS.scaleYPow },
        tscaleYShift: { value: PROPS.scaleYShift },
      },
      fragmentShader: `
        uniform sampler2D tTexture;
        uniform float tVertDivider;
        uniform float tShift;
        uniform float tSkew;

        uniform float tInfiniteShift;
        uniform float tInfiniteSlice;
        uniform float tInfiniteWave;

        uniform float tWave;
        uniform float tWaveSin;

        uniform float tscaleY;
        uniform float tscaleYPow;
        uniform float tscaleYShift;

        varying vec2 vUv;

        void main() {
          vec2 transformedUv = vUv;

          //Skew
          transformedUv.x -= (transformedUv.y - 0.5) * tSkew;

          // Divider
          transformedUv.x *= tVertDivider;
          transformedUv.y *= 4.0;

          // Wave
          transformedUv.y += sin((transformedUv.x * tWaveSin) + tInfiniteWave) * tWave;

          // ScaleY / Curve
          float mult = sin(vUv.x * 3.14 * tscaleYShift);
          transformedUv.y = transformedUv.y + (transformedUv.y * pow(mult, tscaleYPow) * tscaleY) - pow(mult, tscaleYPow) * 2. * tscaleY;

          if (transformedUv.y > 3.) {
            discard;
          }
          if (transformedUv.y < 1.) {
            discard;
          }

          // Upside down
          if (transformedUv.y <= 2.0) {
            transformedUv.y = 1.0 - transformedUv.y;
            transformedUv.x += tInfiniteSlice;
          } else {
            transformedUv.x -= tInfiniteSlice;
          }

          transformedUv.x += tShift + tInfiniteShift;

          vec4 tex = texture2D(tTexture, transformedUv);

          gl_FragColor = tex;
        }
      `,
      vertexShader: `
        varying vec2 vUv;
        void main () {
          vUv = uv;
          vec3 transformed = position.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
    });
    super(geometry, material);

    this.targetedPosition = new Vector3();
    this.force = new Vector3();

    this.update = this.update.bind(this);
  }

  update({ playhead }) {
    this.material.uniforms.tInfiniteShift.value += PROPS.infiniteShift;
    this.material.uniforms.tInfiniteSlice.value += PROPS.infiniteSlice;
    this.material.uniforms.tInfiniteWave.value += PROPS.infiniteWave;

    // this.rotation.x += 0.01;


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

// TODO 2023-10-05 jeremboo: FAIRE UN PLACE AVEC PLEINS DE VERTICES POUR DEFORMER TOUT CA
// TODO 2023-10-05 jeremboo: AJOUTER DES PARTICULES POUR DE LA PROFONDEUR
// TODO 2023-10-06 jeremboo: TWIST TO CHANGE COLOR
// TODO 2023-10-06 jeremboo: Color change
// TODO 2023-10-06 jeremboo: Background color

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas });
  renderer.setClearColor(PROPS.bgColor, 1);
  const controls = new OrbitControls(renderer.camera, context.canvas);
  // const cameraControl = new CameraMouseControl(renderer.camera, { mouseMove : [-5, -5], velocity: [0.1, 0.1]});


  // * START *****
  const mesh = new CustomMesh();
  renderer.add(mesh);

  const loader = new TextureLoader();
  loader.load('./assets/texture.png', (texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    texture.minFilter = LinearFilter;

    mesh.material.uniforms.tTexture.value = texture;
    mesh.material.needsUpdate = true;
  });

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
    animateDivider: (ease = "ease.out", duration = 0.8) => {
      const newValue = Math.max(1, Math.floor(Math.random() * 6));
      gsap.to(mesh.material.uniforms.tVertDivider, {
        duration, value: Math.max(1, Math.floor(Math.random() * 6)),
        ease
      });
      const diff = mesh.material.uniforms.tVertDivider.value - newValue;
      // gsap.to(mesh.material.uniforms.tShift, { duration: 0.8, value: (mesh.material.uniforms.tShift.value + diff) * 0.5 })
    },
    animateDividerWithBounce: () => {
      FUNCTIONS.animateDivider("elastic.out(1, 0.3)", 1.5);
    },
    moveAndSkew: () => {
      const duration = 2;
      const ease = 'back.inOut(1.1)';
      gsap.to(mesh.material.uniforms.tShift, {
        duration,
        value: mesh.material.uniforms.tShift.value - 1,
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
    moveBounce: () => {
      let prev = mesh.material.uniforms.tShift.value;
      const targetedValue = mesh.material.uniforms.tShift.value - 2;
      gsap.to(mesh.material.uniforms.tShift, {
        duration: 4,
        value: targetedValue,
        ease: "elastic.out(0.9, 0.4)",
        onUpdate: () => {
          // const diff = 1 + (mesh.material.uniforms.tShift.value - prev) * 10;
          // prev = mesh.material.uniforms.tShift.value;
          // mesh.material.uniforms.tVertDivider.value = 4 * diff;
          mesh.material.uniforms.tVertDivider.value = 4 - (targetedValue - mesh.material.uniforms.tShift.value) * 1;
        }
      });
      // gsap.to(mesh.material.uniforms.tVertDivider, {
      //   duration: 4 * 0.25,
      //   yoyo: true,
      //   repeat: 1,
      //   value: 1,
      //   // ease: "elastic.out(0.9, 0.4)",
      // });
    },
    animateWave: () => {
      mesh.material.uniforms.tWave.value = PROPS.tWave;
      mesh.material.uniforms.tWaveSin.value = PROPS.waveSin;
      gsap.to(mesh.material.uniforms.tWave, {
        duration: 1,
        // yoyo: true,
        // repeat: 1,
        value: 0.1,
        // ease: ''
      });
      gsap.to(mesh.material.uniforms.tWaveSin, { value: 0.01, delay: 1 });
      gsap.to(mesh.material.uniforms.tWave, { duration: 0.5, value: 0, delay: 1 });
    }
  }

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'scaleYShift', 0, 1).onChange((newValue) => {
    mesh.material.uniforms.tscaleYShift.value = newValue;
  }).step(0.1);
  gui.add(PROPS, 'scaleYPow', 0, 20).onChange((newValue) => {
    mesh.material.uniforms.tscaleYPow.value = newValue;
  });
  gui.add(PROPS, 'scaleY', 0, 20).onChange((newValue) => {
    mesh.material.uniforms.tscaleY.value = newValue;
  });
  gui.add(PROPS, 'tSkew', 0, 0.1).onChange((newValue) => {
    mesh.material.uniforms.tSkew.value = newValue;
    mesh.rotation.x = -newValue;
  });
  gui.add(PROPS, 'waveSin', 0, 10).onChange((newValue) => {
    mesh.material.uniforms.tWaveSin.value = newValue;
  });
  gui.add(PROPS, 'tWave', 0, 1).onChange((newValue) => {
    mesh.material.uniforms.tWave.value = newValue;
  }).step(0.01);
  gui.add(PROPS, 'vertDivider', 1, 10).step(1).onChange((newvalue) => {
    mesh.material.uniforms.tVertDivider.value = newvalue;
  });

  const physicFolder = gui.addFolder('physic');
  physicFolder.add(PROPS, 'velocity', 0.001, 0.2);
  physicFolder.add(PROPS, 'friction', 0.01, 0.99);

  const animationFolder = gui.addFolder('animation Ideas');
  animationFolder.open();
  animationFolder.add(PROPS, 'infiniteSlice', -0.01, 0.01).step(0.001);
  animationFolder.add(PROPS, 'infiniteShift', -0.005, 0.005).step(0.0001);
  animationFolder.add(PROPS, 'infiniteWave', -0.01, 0.01).step(0.001);
  animationFolder.add(FUNCTIONS, 'slice');
  animationFolder.add(FUNCTIONS, 'animateDivider');
  animationFolder.add(FUNCTIONS, 'bounce');
  animationFolder.add(FUNCTIONS, 'move').name('move to');
  animationFolder.add(mesh.targetedPosition, 'z', -10, 5);
  animationFolder.add(FUNCTIONS, 'animateDividerWithBounce');
  animationFolder.add(FUNCTIONS, 'moveAndSkew');
  animationFolder.add(FUNCTIONS, 'animateWave');
  animationFolder.add(FUNCTIONS, 'moveBounce');

  return {
    resize(props) {
      renderer.resize(props);
    },
    render(props) {
      // cameraControl.update();
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
