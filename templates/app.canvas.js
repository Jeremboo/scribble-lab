import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

const RAD_360 = Math.PI * 2;
const PROPS = {
  speed: 1,
  size: 200,
  amplitude: 20,
  mainColor: '#C9F0FF',
  bgColor: '#ffffff'
};

class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PROPS.size;

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
  }

  update(playhead) {
    this.size = PROPS.size + (Math.sin(playhead * RAD_360 * PROPS.speed % RAD_360) * PROPS.amplitude);
  }

  render(context) {
    context.beginPath();
    context.fillStyle = PROPS.mainColor;
    context.arc(this.x, this.y, this.size, 0, RAD_360);
    context.fill();
  }
}

canvasSketch(({ width, height }) => {

  // * START *****
  const circle = new Circle(width * 0.5, height * 0.5);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', 1, 10).step(1);

  return ({
    resize({ width, height }) {},
    update({ context, width, height, playhead }) {
      context.fillStyle = PROPS.bgColor;
      context.fillRect(0, 0, width, height);

      // * UPDATE **
      circle.update(playhead);
      circle.render(context);
    }
  });
}, {
  fps: 24,
  duration: 4,
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
});
