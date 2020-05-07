import canvasSketch from 'canvas-sketch';

import { getRandomFloat, getXBetweenTwoNumbersWithPercent } from '../../../modules/utils';

const ANGLE_MAX = Math.PI * 180;
const AGING_SPEED = 0.03;
const FORCE = 0.09;
const SIZE_MAX = 20;
const SIZE_MIN = 5;

class Ball {
  constructor(expand = 0, x = 15, y = 15, color = '#ff0000') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.isDied = false;

    this.rMax = getRandomFloat(SIZE_MIN + expand, SIZE_MAX + expand);
    this.r = this.rMax * 0.5;
    this.angle = getRandomFloat(0, ANGLE_MAX);
    this.vel = (this.rMax * AGING_SPEED) + getRandomFloat(-AGING_SPEED, AGING_SPEED);
    this.vx = Math.cos(this.angle) * (SIZE_MAX - this.rMax) * FORCE;
    this.vy = Math.sin(this.angle) * (SIZE_MAX - this.rMax) * FORCE;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    // console.log(this.x, this.y);
    this.rMax -= this.vel;
    this.r += (this.rMax - this.r) * 0.2;
    if (this.r <= 0.2) {
      this.r = 0.1;
      this.isDied = true;
    }
  }

  render(context) {
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
    context.fill();
  }
}

class Balls {
  constructor() {
    this.balls = [];
    this.update = this.update.bind(this);
  }
  update(context, expand, mouseX, mouseY) {
    this.balls.push(new Ball(expand, mouseX, mouseY, '#C9F0FF'));

    for (let i = 0; i < this.balls.length; i++) {
      this.balls[i].update();
      this.balls[i].render(context);
    }
    this.balls = this.balls.filter(b => !b.isDied);
  }
}

canvasSketch(({ canvas, width, height, scaleX, scaleY }) => {
  let mouseX = width * 0.5;
  let mouseY = height - 50;
  const recordMousePosition = e => {
    const { left, top } = canvas.getBoundingClientRect();
    mouseX = (e.x - left) / scaleX;
    mouseY = (e.y - top) / scaleY;
  };
  canvas.addEventListener('mousemove', recordMousePosition);
  canvas.addEventListener('touchmove', recordMousePosition);

  // * START *****
  const boiling = new Balls(width, height);

  return ({ context, width, height, playhead }) => {
    const value = (Math.sin(playhead * Math.PI * 2) + 1) * 0.5;
    const fontSize = getXBetweenTwoNumbersWithPercent(10, 12, value);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    boiling.update(context, value * 40, mouseX, mouseY);
    context.beginPath();
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#C9F0FF';
    context.lineWidth = 2;
    context.arc(mouseX, mouseY, getXBetweenTwoNumbersWithPercent(15, 30, value), 0, Math.PI * 2, false);
    context.fill();
    context.stroke();
    context.beginPath();
    context.fillStyle = '#000000';
    context.font = `${fontSize}px sans-serif`;
    context.textAlign = 'center';
    context.fillText(Math.ceil(value * 100), mouseX, mouseY + (fontSize * 0.25));
  };
}, {
  fps: 24,
  duration: 4,
  dimensions: [1024, 1024],
  scaleToView: true,
  animate: true,
});
