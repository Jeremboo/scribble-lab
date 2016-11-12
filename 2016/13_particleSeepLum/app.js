/**/ /* ---- CORE ---- */
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ let windowWidth = canvas.width = window.innerWidth;
/**/ let windowHeight = canvas.height = window.innerHeight;
/**/ canvas.id = 'canvas';
/**/ document.body.insertBefore(canvas, document.body.firstChild);
/**/ window.onresize = () => {
/**/   windowWidth = canvas.width = window.innerWidth;
/**/   windowHeight = canvas.height = window.innerHeight;
/**/ };
/**/ /* ---- CORE END ---- */
/* ---- CREATING ZONE ---- */

// http://inconvergent.net/shepherding-random-numbers/
Math.sqr = (a) => a * a;

/* ---- SETTINGS ---- */
const numberParticlesStart = 500;
const particleSpeed = 0.01;
const velocity = 0.9;
const noiseAmpl = 0.5;
const targetNoiseAmpl = 200;

/* ---- INIT ---- */
let particles = [];

const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
let increment = 0;

/* ---- Particle ---- */
function Particle(x, y) {
  this.x = x;
  this.y = y;

  this.targetedPos = { x: this.x, y: this.y };
  this.savedPos = { x: this.x, y: this.y };
  this.vel = { x: 0, y: 0 };
  this.force = { x: 0, y: 0 };

  this.color = 'rgba(255, 255, 255, 0.5)';
}
Particle.prototype.render = function() {
  context.beginPath();
  const f =  Math.sqrt(Math.sqr(this.force.x) + Math.sqr(this.force.y));
  //context.fillStyle = `rgba(255, 255, 255, ${f})`;
  context.fillStyle = `rgba(255, 255, 255, 1)`;
  context.arc(this.x, this.y, 1 + (f * 2), 0, Math.PI * 2);
  context.fill();
};
Particle.prototype.update = function() {
  if (Math.random() > 0.999) {
    this.targetedPos.x = this.x + getRandomFloat(-targetNoiseAmpl, targetNoiseAmpl);
    this.targetedPos.y = this.y + getRandomFloat(-targetNoiseAmpl, targetNoiseAmpl);
  }

  this.vel.x += getRandomFloat(-noiseAmpl, noiseAmpl);
  this.vel.y += getRandomFloat(-noiseAmpl, noiseAmpl);

  const newPos = {
    x: (this.targetedPos.x - this.x) * particleSpeed,
    y: (this.targetedPos.y - this.y) * particleSpeed,
  };

  this.force.x = newPos.x;
  this.force.y = newPos.y;

  this.x += this.force.x + this.vel.x;
  this.y += this.force.y + this.vel.y;

  this.vel.x *= velocity;
  this.vel.y *= velocity;
};

Particle.prototype.setPosition = function(pos, coor) {
  if (coor === 'x') {
    this.x = pos;
  } else if (coor === 'y') {
    this.y = pos;
  }
};

/* ---- Functions ----*/
function loop() {
  let i;
  increment++;
  const length = particles.length;
  context.beginPath();
  context.rect(0, 0, windowWidth, windowHeight)
  context.fillStyle = 'rgba(0, 0, 0, 0.1)';
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
    particles.push(new Particle(
      getRandomFloat(0, windowWidth),
      getRandomFloat(0, windowHeight),
  ));
  }
}
init();

window.addEventListener('click', () => {
  particles = [];
  context.clearRect(0,0, windowWidth, windowHeight);
  init();
});

loop();
