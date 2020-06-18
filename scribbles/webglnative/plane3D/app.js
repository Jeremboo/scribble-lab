import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import { classicNoise2D } from '../../../utils/glsl';

import Program from '../../../modules/WebGL/Program';
import MouseControl from '../../../modules/WebGL/MouseControl';
import { vec3 } from '../../../utils/vec3';
import Camera from '../../../modules/WebGL/Camera';

// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

const PROPS = {
  speed: 0.02,
  strength: 0.3,
  x: 0,
};

const VERTEX = `
  attribute vec4 position;

  uniform mat4 viewProjectionMatrix;

  varying vec2 vUv;

  void main() {
    gl_Position = viewProjectionMatrix * position;
    vUv = position.xy + 0.5;
  }
`;

const FRAGMENT = `
  precision mediump float;

  uniform float time;
  uniform float strength;

  varying vec2 vUv;

  ${classicNoise2D}

  void main() {
    vec2 noiseUv = vec2(vUv.x + (time * 0.5), vUv.y - time);
    float noise = classicNoise2D(noiseUv) * strength;
    gl_FragColor = vec4(vUv + noise, 1.0, 1.0);
    // gl_FragColor = vec4(vec3(noise), 1.);
  }
`;

const TARGET = vec3(0, 0, 0);

canvasSketch(({ width, height, context, canvas }) => {
  // * Program
  const program = new Program(context, VERTEX, FRAGMENT);

  // * Attributes
  const vertices = [
    -0.5, 0.5, 0,
    -0.5, -0.5, 0,
    0.5, -0.5, 0,
    -0.5, 0.5, 0,
    0.5, 0.5, 0,
    0.5, -0.5, 0,
  ];
  program.addAttributePosition(vertices, 3);


  // * Camera

  // * V1: Full Native ---------------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------------------------
  // // Create the type of camera projection you want
  // // const matrix = orthographic(-1, 1, 1, -1, 400, -400);
  // const projectionMatrix = perspective(61, width / height, 0.001, 200);
  // const cameraPosition = vec3(PROPS.x, 0, 1);
  // // Compute the position and rotation at the same time
  // const cameraMatrix = lookAt(cameraPosition, TARGET);

  // const getViewProjectionMatrix = (objectMatrix) => {
  //   // Get view Matrix
  //   const viewMatrix = inverse(objectMatrix);
  //   // Return  view projection matrix
  //   return multiply(projectionMatrix, viewMatrix);
  // };

  // * V2: With Camera class ---------------------------------------------------------------------------------------------------------------
  // * -------------------------------------------------------------------------------------------------------------------------------------
  const camera = new Camera(45, width / height, 1, 1000);
  camera.setPosition(PROPS.x, 0, 2);
  camera.lookAt(TARGET);

  const mouseControl = new MouseControl(camera, { mouseMove: [-2, -2]});

  // * Uniforms
  // const viewProjMatLoc = program.uniformMat4('viewProjectionMatrix', getViewProjectionMatrix(cameraMatrix));
  program.addUniforms({
    viewProjectionMatrix: camera.getViewProjectionMatrix(),
    time: Math.random() * 10,
    strength: PROPS.strength
  });

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', -0.1, 0.1);
  gui.add(PROPS, 'strength', 0.1, 1).onChange((value) => {
    program.forceUpdateUniform('strength', value);
  });
  // gui.add(PROPS, 'x', -1, 1).onChange((value) => {
  //   // cameraPosition[0] = value;
  //   // const cameraMatrix = lookAt(cameraPosition, TARGET);
  //   // program.setUniformMat4(viewProjMatLoc, getViewProjectionMatrix(cameraMatrix));
  //   camera.x = value;
  //   camera.lookAt(TARGET);
  //   program.setUniformMat4(viewProjMatLoc, camera.getViewProjectionMatrix());
  // });

  // Bind the program to make it visible
  // Since we have only one program, it's not necessary to rebind it every frame
  program.useProgram();

  return ({
    resize() {
      context.viewport(0, 0, canvas.width, canvas.height);
      context.clearColor(1, 1, 1, 1);
      context.clear(context.COLOR_BUFFER_BIT);
    },
    render({ context, playhead }) {
      mouseControl.update();

      // Update uniforms
      program.forceUpdateUniform('viewProjectionMatrix', camera.getViewProjectionMatrix());
      program.forceUpdateUniform('time', program.uniforms.time.value + PROPS.speed);

      const count = 6; // Nbr of points to draw
      context.drawArrays(context.TRIANGLES, 0, count);

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
