import {
  Mesh, ShaderMaterial, Color, PlaneBufferGeometry, TextureLoader, NearestFilter, LinearFilter,
  RepeatWrapping, Vector2, DoubleSide,
  Vector3
} from 'three';
import gsap from 'gsap';
import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import Renderer from '../../../modules/Renderer.three';
import OrbitControls from '../../../modules/OrbitControls';
import CameraMouseControl from '../../../modules/CameraMouseControl';
import { horizontalTwist } from '../../../utils/glsl';

// TODO 2023-10-05 jeremboo: AJOUTER DES PARTICULES POUR DE LA PROFONDEUR
// TODO 2023-10-06 jeremboo: AJOUTER GRATIENT AND SHADOWS
// TODO 2023-10-05 jeremboo: ADD MOUSE CONTROL
// TODO 2023-10-05 jeremboo: ADD OTHER ANIMATIONS / DISTORTIONS / ...

const PROPS = {
  withUI: false,
  mainColor: '#EF8E17',
  bgColor: '#D61D1D',
  colorPattern: ["#EF8E17", "#1D40F3", "#90FF38", "#F96BFC"],
  // Shader props
  vertDivider: 4,
  infiniteShift: 0,
  infiniteSlice: 0,
  infiniteWave: 0.005,
  tSkew: 0,
  waveStrengh: 0,
  waveLenght: 4,
  curve: 0,
  curvePow: 10,
  curveShift: 1,
  // Twist
  twistStrenght: 0,
  infiniteTwistShift: 0,
  // PHYSICS
  velocity: 0.02,
  friction: 0.9,
};

class CustomMesh extends Mesh {
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

    this.targetedPosition = new Vector3();
    this.force = new Vector3();

    this.update = this.update.bind(this);
  }

  update({ playhead }) {
    this.material.uniforms.tInfiniteShift.value += PROPS.infiniteShift;
    this.material.uniforms.tInfiniteSlice.value += PROPS.infiniteSlice;
    this.material.uniforms.tInfiniteWave.value += PROPS.infiniteWave;
    this.material.uniforms.tInfiniteTwistShift.value += PROPS.infiniteTwistShift;

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

function toggleUI() {
  document.body.classList.toggle('ui');
}

if (PROPS.withUI) {
  toggleUI();
}

canvasSketch(({ context }) => {
  const renderer = new Renderer({ canvas: context.canvas, transparent: true });

  const controls = new OrbitControls(renderer.camera, context.canvas);
  // const cameraControl = new CameraMouseControl(renderer.camera, { mouseMove : [-5, -5], velocity: [0.1, 0.1]});


  // * START *****
  const mesh = new CustomMesh(new Color(PROPS.colorPattern[0]), new Color(PROPS.colorPattern[1]));
  renderer.add(mesh);

  const mesh2 = new CustomMesh(new Color(PROPS.colorPattern[2]), new Color(PROPS.colorPattern[3]));
  mesh2.rotation.x += Math.PI;
  mesh2.position.z -= 0.1;
  renderer.add(mesh2);

  const loader = new TextureLoader();
  loader.load('./assets/texture.png', (texture) => {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;
    texture.minFilter = LinearFilter;

    mesh.material.uniforms.tTexture.value = texture;
    mesh.material.needsUpdate = true;
    mesh2.material.uniforms.tTexture.value = texture;
    mesh2.material.needsUpdate = true;
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
    curve: () => {
      gsap.to(mesh.material.uniforms.tcurve, { duration : 1, value: mesh.material.uniforms.tcurve.value < 0.5 ? 20 : 0, ease: "power3.inOut" })
    }
  }

  // * GUI *******
  const gui = new GUI();
  // CURVE
  gui.add(PROPS, 'withUI').onChange(toggleUI);
  gui.add(PROPS, 'curve', 0, 20).onChange((newValue) => {
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
  animationFolder.add(PROPS, 'infiniteWave', -0.01, 0.01).step(0.001);
  animationFolder.add(PROPS, 'infiniteTwistShift', 0, 0.01);
  animationFolder.add(FUNCTIONS, 'slice');
  animationFolder.add(FUNCTIONS, 'bounce');
  animationFolder.add(FUNCTIONS, 'move').name('moveBounce');
  animationFolder.add(mesh.targetedPosition, 'z', -10, 5).name('moveZBounce')
  animationFolder.add(FUNCTIONS, 'divide');
  animationFolder.add(FUNCTIONS, 'divideBounce');
  animationFolder.add(FUNCTIONS, 'move');
  animationFolder.add(FUNCTIONS, 'moveAndSkew');
  animationFolder.add(FUNCTIONS, 'moveBounce');
  animationFolder.add(FUNCTIONS, 'animateWave');
  animationFolder.add(FUNCTIONS, 'twist');
  animationFolder.add(FUNCTIONS, 'twistBounce');
  animationFolder.add(FUNCTIONS, 'curve');

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
