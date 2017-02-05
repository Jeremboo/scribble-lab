import dat from 'dat-gui';

export const NONE = 0;
// Rope is drawing
export const DRAWING = 1;
// Rope is moving
export const MOVING = 2;

const props = {
  GRAVITY_X: 0,
  GRAVITY_Y: 5,
  SPRING: 0.4,
  TENTION: 1,
  VEL: 0.75,
  SEGMENT_LENGTH: 15,
  ROPE_WIDTH: 10,
  mouseEvent: NONE,
  ropeOverred: false,
};

const gui = new dat.GUI();
gui.add(props, 'GRAVITY_X', 0, 20);
gui.add(props, 'GRAVITY_Y', 0, 20);
gui.add(props, 'SPRING', 0, 1.5);
gui.add(props, 'TENTION', 0.2, 1);
gui.add(props, 'VEL', 0, 1);
gui.add(props, 'SEGMENT_LENGTH', 1, 100);

export default props;
