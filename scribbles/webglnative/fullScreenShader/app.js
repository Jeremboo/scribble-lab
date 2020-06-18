import canvasSketch from 'canvas-sketch';
import dat from 'dat.gui';
import imageController from 'dat.gui.image';
imageController(dat);

import Program from '../../../modules/WebGL/Program';
import Texture from '../../../modules/WebGL/Texture';
import { radians } from '../../../utils';

import { surfaceVertSource, surfaceFragSource } from './shader.glsl';


const PROPS = {
  texture: './_assets/arkestar.jpg',
  // Distortion
  scale: 2,
  strength: 1.37,
  brightness: 0.12,
  shift: 0.02,
  // Grid
  divider: 4.5,
  rotation: 35,
  speed: 1,
  duration: 2,
};

canvasSketch((props) => {
  const { canvas, context, styleWidth, styleHeight } = props;

  // * Textures
  const arkestarTexture = new Texture(context, PROPS.texture, {});

  // * Program
  const program = new Program(context, surfaceVertSource, surfaceFragSource);

   // * Attributes
  const fullScreenTriangleVertices = [-1, -1, -1, 3, 3, -1];
  program.addAttributePosition(fullScreenTriangleVertices, 2);

  // * Uniforms
  program.addUniforms({
    mousePosition: [0.5, 0.5],
    scale: PROPS.scale,
    strength: PROPS.strength,
    brightness: PROPS.brightness,
    shift: PROPS.shift,
    divider: PROPS.divider,
    rotation: PROPS.rotation,
    time: radians(PROPS.rotation),
    texture: arkestarTexture, // This is how to add a texture as uniform
  });
  // const mousePositionLoc = program.uniform2f('mousePosition', 0.5, 0.5);

  canvas.addEventListener('mousemove', (e) => {
    const x = e.offsetX / styleWidth;
    const y = 1 - e.offsetY / styleHeight;
    program.forceUpdateUniform('mousePosition', [x, y]);
  });
  canvas.addEventListener('mouseleave', () => {
    program.forceUpdateUniform('mousePosition', [0.5, 0.5]);
  });

  // * GUI
  const gui = new dat.GUI();
  const grid = gui.addFolder('Grid')
  grid.open();
  grid.add(PROPS, 'divider', 0.2, 10).onChange((value) => {
    program.forceUpdateUniform('divider', value);
  }).step(0.01);
  grid.add(PROPS, 'rotation', -45, 45).onChange((value) => {
    program.forceUpdateUniform('rotation', radians(value));
  }).step(0.01);
  grid.add(PROPS, 'speed', 1, 2).step(1);
  grid.addImage(PROPS, 'texture').onChange((imageData) => {
    // Update the texture itself not the uniform
    arkestarTexture.updateImageData(imageData);
  });
  const distortion = gui.addFolder('Distortion')
  distortion.open();
  distortion.add(PROPS, 'shift', 0, 0.5).onChange((value) => {
    program.forceUpdateUniform('shift', value);
  });
  distortion.add(PROPS, 'scale', 0, 3).onChange((value) => {
    program.forceUpdateUniform('scale', value);
  });
  distortion.add(PROPS, 'strength', -2, 2).onChange((value) => {
    program.forceUpdateUniform('strength', value);
  });
  distortion.add(PROPS, 'brightness', -2, 2).onChange((value) => {
    program.forceUpdateUniform('brightness', value);
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
      // Draw the program
      context.drawArrays(context.TRIANGLES, 0, program.count);
      // Update the uniform time
      program.forceUpdateUniform('time', playhead * PROPS.speed);
    }
  });
}, {
  fps: 15 ,
  duration: PROPS.duration,
  dimensions: [680, 680],
  scaleToView: true,
  animate: true,
  context: 'webgl',
});
