import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import { classicNoise2D } from '../../../utils/glsl';

import Renderer from '../../../modules/WebGL/Renderer';
import Camera from '../../../modules/WebGL/Camera';
import Mesh from '../../../modules/WebGL/Mesh';

// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

const PROPS = {
  speed: 0.02,
  strength: 0.3,
};

const FRAGMENT_1 = `
  precision mediump float;

  uniform float time;
  uniform float strength;

  varying vec2 vUv;

  ${classicNoise2D}

  void main() {
    vec2 noiseUv = vec2(vUv.x + (time * 0.5), vUv.y - time);
    float noise = classicNoise2D(noiseUv) * strength;
    gl_FragColor = vec4(vUv + noise, 1.0, 1.0);
  }
`;

const FRAGMENT_2 = `
  precision mediump float;

  varying vec2 vUv;

  void main() {
    gl_FragColor = vec4(vUv, 0.0, 1.0);
  }
`;

canvasSketch(({ width, height, context, canvas }) => {
  // * Camera
  const camera = new Camera(45, width / height, 1, 1000);
  camera.setPosition(0, 0, 2);

  // * Renderer
  const renderer = new Renderer(context);

  // * Mesh
  /**
   * NOTE 2020-06-21 jeremboo:
   * The Mesh is a Object3D who contain a program.
   * It will manage its position relative to the camera by it's own.
   */
  const mainMesh = new Mesh(context, camera, {
    fragment: FRAGMENT_1,
    uniforms: {
      time: Math.random() * 10,
      strength: PROPS.strength,
    }
  });
  mainMesh.scale(1.2, 1.2, 1);
  renderer.addProgram(mainMesh.program);

  const secondMesh = new Mesh(context, camera, {
    fragment: FRAGMENT_2,
  });
  secondMesh.translate(-0.5, 0.5, 0);
  secondMesh.scale(0.5, 0.5, 1);
  renderer.addProgram(secondMesh.program);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', -0.1, 0.1);
  gui.add(PROPS, 'strength', 0.1, 1).onChange((value) => {
    mainMesh.program.uniforms.strength.value = value;
  });

  return ({
    resize() {
      context.viewport(0, 0, canvas.width, canvas.height);
      context.clearColor(1, 1, 1, 1);
      context.clear(context.COLOR_BUFFER_BIT);
    },
    render({ context, playhead }) {
      mainMesh.program.uniforms.time.value += PROPS.speed;

      renderer.render();
    }
  });
}, {
  fps: 15,
  duration: 4,
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
