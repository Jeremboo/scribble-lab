/**/ /* ---- CORE ---- */
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ let windowWidth = canvas.width = window.innerWidth;
/**/ let windowHeight = canvas.height = window.innerHeight;
/**/ let origin = { x: windowWidth * 0.5, y: windowHeight * 0.5 };
/**/ canvas.id = 'canvas';
/**/ document.body.insertBefore(canvas, document.body.firstChild);
/**/ window.onresize = () => {
/**/   windowWidth = canvas.width = window.innerWidth;
/**/   windowHeight = canvas.height = window.innerHeight;
/**/   origin = { x: windowWidth * 0.5, y: windowHeight * 0.5 };
/**/ };
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

/* ---- SETTINGS ---- */
const numberParticlesStart = 500;
const CIRCLE_WIDTH_MAX = 150;
const ROTATION_SPEED = 0.02;
const MOVE_RANGE = 100;
const VEL = 0.01;
const DIST_FREQ = 0.99;

/* ---- INIT ---- */
let particles = [];

const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

/* ---- Particle ---- */
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.increment = Math.random() * Math.PI * 2;
    this.circleWidth = getRandomFloat(1, CIRCLE_WIDTH_MAX);
    this.targetedWidth = this.circleWidth;
    this.angle = Math.random();
    this.color = 'rgba(255, 255, 255, 0.5)';
  }

  render() {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.x, this.y, 4, 0, Math.PI * 2);
    context.fill();
  }

  update() {
    this.increment += ROTATION_SPEED;

    if (Math.random() > DIST_FREQ) {
      this.targetedWidth = this.circleWidth + getRandomFloat(-MOVE_RANGE, MOVE_RANGE);
      this.targetedWidth = this.targetedWidth < CIRCLE_WIDTH_MAX
        ? this.targetedWidth
        : CIRCLE_WIDTH_MAX
      ;
    }
    this.circleWidth += (this.targetedWidth - this.circleWidth) * VEL;

    this.x = origin.x + (Math.cos(this.increment) * this.circleWidth);
    this.y = origin.y + (Math.sin(this.increment) * this.circleWidth);
  }
}

/* ---- Functions ----*/
function loop() {
  let i;
  const length = particles.length;
  context.beginPath();
  context.rect(0, 0, windowWidth, windowHeight)
  context.fillStyle = 'RGBA(3, 25, 39, 0.02)';
  context.fill();
  context.closePath();
  for (i = 0; i < length; i++) {
    particles[i].update();
    particles[i].render();
  }
  requestAnimationFrame(loop);
}

/* ---- START ---- */
function init() {
  let i;
  for (i = 0; i < numberParticlesStart; i++) {
    particles.push(new Particle());
  }
}
init();

window.addEventListener('click', () => {
  particles = [];
  context.clearRect(0,0, windowWidth, windowHeight);
  init();
});

loop();
