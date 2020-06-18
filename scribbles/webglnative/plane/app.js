import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import { classicNoise2D } from '../../../utils/glsl';

// import { createProgramFromScript, createAttribute } from '../../../utils/webgl';
import Program from '../../../modules/WebGL/Program';

// https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html

const PROPS = {
  speed: 0.02,
  strength: 0.3,
};

const VERTEX = `
  attribute vec2 position;

  uniform vec2 screenSize;

  varying vec2 vUv;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    vUv = position + 0.5;
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
  }
`;

canvasSketch(({ width, height, context, canvas }) => {

  // * Program
  // const program = createProgramFromScript(context, VERTEX, FRAGMENT);
  // context.useProgram(program);
  const program = new Program(context, VERTEX, FRAGMENT);

  // * Attributes
  const vertices = [
    -0.5, 0.5,
    -0.5, -0.5,
    0.5, -0.5,
    -0.5, 0.5,
    0.5, 0.5,
    0.5, -0.5,
  ];
  // createAttribute(context, program, 'position', vertices, 2);
  program.addAttributePosition(vertices, 2);

  // * Uniforms
  // const screenSizeUniformLoc = context.getUniformLocation(program, 'screenSize');
  // const timeUniformLoc = context.getUniformLocation(program, 'time');
  // const strengthUniformLoc = context.getUniformLocation(program, 'strength');
  program.addUniforms({
    screenSize: [width, height],
    time: Math.random() * 10,
    strength: PROPS.strength
  });

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', -0.1, 0.1);
  gui.add(PROPS, 'strength', 0.1, 1).onChange((value) => {
    program.forceUpdateUniform('strength', value);
  });

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
      // Update uniform
      // const time = context.getUniform(program, timeUniformLoc);
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
