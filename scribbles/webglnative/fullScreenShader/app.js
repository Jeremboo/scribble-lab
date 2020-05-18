import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

import Program from '../../../modules/Program';

import { surfaceVertSource, surfaceFragSource } from './shader.glsl';

const PROPS = {
  scale: 0.2,
  strength: 0.2,
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

  const scaleLoc = program.uniform1f('scale', PROPS.scale);
  const strengthLoc = program.uniform1f('strength', PROPS.strength);

  // * GUI
  const gui = new GUI();
  gui.add(PROPS, 'scale', 0, 1).onChange((value) => {
    program.setUniform1f(scaleLoc, value);
  });
  gui.add(PROPS, 'strength', 0, 1).onChange((value) => {
    program.setUniform1f(strengthLoc, value);
  });

  return ({
    resize() {
      context.viewport(0, 0, canvas.width, canvas.height);
      context.clearColor(1, 1, 1, 1);
      context.clear(context.COLOR_BUFFER_BIT);
    },
    render({ context }) {
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
