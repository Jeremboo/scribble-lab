
/**
 * **********
 * PROPS
 * **********
 */
const ANGLE_MAX = Math.PI * 180;
const AGING_SPEED = 0.03;
const FORCE = 0.09;
const SIZE_MAX = 20;
const SIZE_MIN = 5;

/**
 * **********
 * MOUSE AND WINDOW EVENT
 * **********
 */
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let mouseX = windowWidth * 0.5;
let mouseY = windowHeight - 50;
const recordMousePosition = e => {
  mouseX = e.x;
  mouseY = e.y;
};

window.addEventListener('mousemove', recordMousePosition);
window.addEventListener('touchmove', recordMousePosition);
window.onresize = () => {
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
};


/**
 * **********
 * UTILS
 * **********
 */
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
const createCanvas = (width = window.innerWidth, height = window.innerHeight) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  return {
    canvas,
    context,
    imageData: context.getImageData(0, 0, width, height),
  };
};
const radians = degrees => (degrees * Math.PI) / 180;
const getXBetweenTwoNumbersWithPercent = (min, max, x) => (min + (x * ((max - min))));


/**
 * **********
 * CANVAS
 * **********
 */
const { canvas, context } = createCanvas(windowWidth, windowHeight);
canvas.className = 'BoilingMouse';
document.body.appendChild(canvas);


/**
 * **********
 * CLASSES
 * **********
 */

/**
 * BALL
 */
class Ball {
  constructor(context, expand = 0, x = 15, y = 15, color = '#ff0000') {
    this.x = x;
    this.y = y;
    this.color = color;
    this.context = context;
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
    this.rMax -= this.vel;
    this.r += (this.rMax - this.r) * 0.2;
    if (this.r <= 0.2) {
      this.r = 0.1;
      this.isDied = true;
    }
  }

  render() {
    this.context.fillStyle = this.color;
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
    this.context.fill();
  }
}

/**
 * BALLS
 */
const Balls = (context) => {
  let i;
  let balls = [];

  return {
    update: (expant = 0) => {
      context.clearRect(0, 0, windowWidth, windowHeight);

      balls.push(new Ball(context, expant, mouseX, mouseY, '#000000'));
      const length = balls.length;

      for (i = 0; i < length; i++) {
        balls[i].update();
        balls[i].render();
      }
      balls = balls.filter(b => !b.isDied);
    },
  };
};

/**
 * **********
 * START
 * **********
 */
let t = radians(180);
let value = 0;

const boiling = new Balls(context);

function update() {
  t += 0.03;
  value = (Math.cos(t) + 1) * 0.5;
  const fontSize = getXBetweenTwoNumbersWithPercent(10, 12, value);
  boiling.update(value * 40);
  context.beginPath();
  context.fillStyle = '#ffffff';
  context.strokeStyle = '#000000';
  context.lineWidth = 4;
  context.arc(mouseX, mouseY, getXBetweenTwoNumbersWithPercent(15, 30, value), 0, Math.PI * 2, false);
  context.fill();
  context.stroke();
  context.beginPath();
  context.fillStyle = '#000000';
  context.font = `${fontSize}px sans-serif`;
  context.textAlign = 'center';
  context.fillText(Math.ceil(value * 100), mouseX, mouseY + (fontSize * 0.25));
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   update();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
