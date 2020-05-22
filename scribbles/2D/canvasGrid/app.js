import { distance } from '../../../utils/vec2';

/**
 * * *******************
 * * CORE
 * * *******************
 */
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
let windowWidth = canvas.width = window.innerWidth;
let windowHeight = canvas.height = window.innerHeight;
canvas.id = 'canvas';
document.body.insertBefore(canvas, document.body.firstChild);
window.onresize = () => {
  windowWidth = canvas.width = window.innerWidth;
  windowHeight = canvas.height = window.innerHeight;
};


/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

const CIRCLE_WIDTH = 1;
const ATTRACTION_RADIUS = 100;
const MOUSE_VEL = 0.001;
const GRAVITY_VEL = 0.1;
const FRICTION = 0.8;

const mousePosition = { x : -9999, y : -9999 };

class Dot {
  // Save state here
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;

    this.radius = CIRCLE_WIDTH;

    this.force = { x: 0, y : 0 };
  }

  // Update values here
  update() {
    const { x, y, dist } = distance(this.initialX, this.initialY, mousePosition.x, mousePosition.y);
    const force = Math.max(0, ATTRACTION_RADIUS - dist);

    // Mouse force
    if (force) {
      this.force.x += x * force * MOUSE_VEL;
      this.force.y += y * force * MOUSE_VEL;
    }

    // Gravity force
    this.force.x -= (this.initialX - this.x) * GRAVITY_VEL;
    this.force.y -= (this.initialY - this.y) * GRAVITY_VEL;

    // Update position
    this.x -= this.force.x;
    this.y -= this.force.y;

    // Friction
    this.force.x *= FRICTION;
    this.force.y *= FRICTION;
  }

  render() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}


const MARGIN = 20;

const nbrOfLine = Math.ceil(windowWidth / MARGIN);
const nbrOfRow = Math.ceil(windowHeight / MARGIN);

const cubeWidth = nbrOfLine * MARGIN;
const cubeHeight = nbrOfRow * MARGIN;

const origin = {
  x : (windowWidth - cubeWidth) * 0.5,
  y : (windowHeight - cubeHeight) * 0.5,
};

const dots = [];
for (let i = 1; i < nbrOfLine; i++) {
  for (let j = 1; j < nbrOfRow; j++) {
    const dot = new Dot(
      origin.x + (i * MARGIN),
      origin.y + (j * MARGIN),
      );
      dots.push(dot);
    }
  }

// Loop
let k;
const l = dots.length;
function loop() {
  for (k = 0; k < l; k++) {
    dots[k].update();
    dots[k].render();
  }
}


// target mouse position in the 3D view
document.body.addEventListener('mousemove', (e) => {
  mousePosition.x = e.clientX;
  mousePosition.y = e.clientY;
});


/**
 * * *******************
 * * LOOP
 * * *******************
 */
function _loop() {
  context.clearRect(0, 0, windowWidth, windowHeight);
  loop();
 	requestAnimationFrame(_loop);
}
_loop();
