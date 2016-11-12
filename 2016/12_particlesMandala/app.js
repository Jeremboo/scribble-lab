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

// http://inconvergent.net/shepherding-random-numbers/

/* ---- SETTINGS ---- */
const numberParticlesStart = 2000;
const particleSpeed = 0.3;
const velocity = 0.1;

/* ---- INIT ---- */
let particles = [];

const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);

/* ---- Particle ---- */
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.increment = Math.random();
    this.circleWidth = getRandomFloat(1, windowWidth);
    this.angle = Math.random();
    this.color = 'RGBA(226, 232, 192, 1.00)';
  }

  render() {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.x, this.y, 1, 0, Math.PI * 2);
    context.fill();
  }

  // windowWidth * 0.5 + (Math.cos(angle) * circleWidth),
  // windowHeight * 0.5 - (Math.sin(angle) * circleWidth)
  update() {
    this.increment++;
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
  context.fillStyle = 'RGBA(68, 55, 66, 0.02)';
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
