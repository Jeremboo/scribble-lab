import canvasSketch from 'canvas-sketch';
import { GUI } from 'dat.gui';

const PROPS = {
  speed: 0.03,
  size: 100,
  mainColor: '#C9F0FF',
  bgColor: '#ffffff'
};

class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.time = 0;
    this.size = PROPS.size;

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
  }

  update() {
    this.time += PROPS.speed;
    this.size = (Math.sin(this.time + PROPS.speed) * PROPS.size) + PROPS.size * 2;
  }

  render(context) {
    context.beginPath();
    context.fillStyle = PROPS.mainColor;
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
  }
}

canvasSketch(({ width, height }) => {

  // * START *****
  const circle = new Circle(width * 0.5, height * 0.5);

  // * GUI *******
  const gui = new GUI();
  gui.add(PROPS, 'speed', 0, 0.1);

  return ({ context, width, height }) => {
    context.fillStyle = PROPS.bgColor;
    context.fillRect(0, 0, width, height);

    // * UPDATE **
    circle.update();
    circle.render(context);
  };
}, {
  // fps: 30,
  // duration: 3,
  dimensions: [ 2048, 2048 ],
  scaleToView: true,
  animate: true,
});
