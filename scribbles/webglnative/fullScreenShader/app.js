import canvasSketch from 'canvas-sketch';
import dat from 'dat.gui';
import imageController from 'dat.gui.image';
imageController(dat);

import Program from '../../../modules/Program';
import { radians } from '../../../modules/utils';
import { createTextureFromUrl } from '../../../modules/utils.webgl';

import { surfaceVertSource, surfaceFragSource } from './shader.glsl';


const PROPS = {
  texture: './_assets/arkestar.jpg',
  // Distortion
  scale: 2,
  strength: 0.1,
  brightness: 1.4,
  shift: 0.1,
  // Grid
  divider: 4.5,
  rotation: -35,
  speed: 0.006,
};

canvasSketch((props) => {
  const { canvas, context, styleWidth, styleHeight } = props;

  // * Program
  const program = new Program(context, surfaceVertSource, surfaceFragSource);

   // * Attributes
  const fullScreenTriangleVertices = [-1, -1, -1, 3, 3, -1];
  program.createAttribute('position', fullScreenTriangleVertices, 2);

  // * Uniforms
  const mousePositionLoc = program.uniform2f('mousePosition', 0.5, 0.5);
  canvas.addEventListener('mousemove', (e) => {
    const x = e.offsetX / styleWidth;
    const y = 1 - e.offsetY / styleHeight;
    program.setUniform2f(mousePositionLoc, x, y);
  });
  canvas.addEventListener('mouseleave', () => {
    program.setUniform2f(mousePositionLoc, 0.5, 0.5);
  })

  const scaleLoc = program.uniform1f('scale', PROPS.scale);
  const strengthLoc = program.uniform1f('strength', PROPS.strength);
  const brightnessLoc = program.uniform1f('brightness', PROPS.brightness);
  const shiftLoc = program.uniform1f('shift', PROPS.shift);
  const dividerLoc = program.uniform1f('divider', PROPS.divider);
  const rotationLoc = program.uniform1f('rotation', PROPS.rotation);
  const timeLoc = program.uniform1f('time', radians(PROPS.rotation));

  createTextureFromUrl(context, PROPS.texture).then((texture) => {
    program.uniformTexture('texture', texture);
  });

  // * GUI
  const gui = new dat.GUI();
  const grid = gui.addFolder('Grid')
  grid.open();
  grid.add(PROPS, 'divider', 0.2, 10).onChange((value) => {
    program.setUniform1f(dividerLoc, value);
  }).step(0.01);
  grid.add(PROPS, 'rotation', -45, 45).onChange((value) => {
    program.setUniform1f(rotationLoc, radians(value));
  }).step(0.01);
  grid.add(PROPS, 'speed', -0.03, 0.03);
  grid.addImage(PROPS, 'texture')
  const distortion = gui.addFolder('Distortion')
  distortion.open();
  distortion.add(PROPS, 'shift', 0, 0.5).onChange((value) => {
    program.setUniform1f(shiftLoc, value);
  });
  distortion.add(PROPS, 'scale', 0, 3).onChange((value) => {
    program.setUniform1f(scaleLoc, value);
  });
  distortion.add(PROPS, 'strength', -1, 1).onChange((value) => {
    program.setUniform1f(strengthLoc, value);
  });
  distortion.add(PROPS, 'brightness', -2, 2).onChange((value) => {
    program.setUniform1f(brightnessLoc, value);
  });

  return ({
    resize() {
      context.viewport(0, 0, canvas.width, canvas.height);
      context.clearColor(1, 1, 1, 1);
      context.clear(context.COLOR_BUFFER_BIT);
    },
    render({ context }) {
      const time = program.getUniform(timeLoc);
      program.setUniform1f(timeLoc, time + PROPS.speed);

      const count = 3; // Nbr of points to draw
      context.drawArrays(context.TRIANGLES, 0, count);
    }
  });
}, {
  fps: 15 ,
  duration: 4,
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
