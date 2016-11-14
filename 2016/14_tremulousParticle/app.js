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
const NBR_PARTICLES_START = 1000;
const P_SPEED = 0.03;
const VEL = 0.9;
const NOISE_AMPL = 0.5;
const DIST_AMPL = 80;
const DIST_FREQ = 0.999;
const COLORS = [
  [244, 91, 105],
  [194, 9, 90],
  [254, 185, 95],
  [247, 23, 53],
  [238, 207, 109],
];

const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getDistBetweenTwoVec2 = (x1, y1, x2, y2) =>
Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1))
;

/* ---- Particle ---- */
function Particle(x, y) {
  this.x = x;
  this.y = y;

  this.targetedPos = { x: this.x, y: this.y };
  this.savedPos = { x: this.x, y: this.y };
  this.force = { x: 0, y: 0 };
  this.vel = { x: 0, y: 0 };

  this.color = COLORS[getRandomInt(0, COLORS.length - 1)];
}

Particle.prototype.render = function() {
  context.beginPath();
  const f =  Math.sqrt(Math.sqr(this.force.x) + Math.sqr(this.force.y)) - 0.5;
  context.fillStyle = `RGBA(${this.color}, ${f})`;
  context.arc(this.x, this.y, 1 + f, 0, Math.PI * 2);
  context.fill();
};
Particle.prototype.update = function() {
  if (Math.random() > DIST_FREQ) {
    this.updadeTargetPos();
  }

  this.vel.x = (this.vel.x * VEL) + getRandomFloat(-NOISE_AMPL, NOISE_AMPL);
  this.vel.y = (this.vel.y * VEL) + getRandomFloat(-NOISE_AMPL, NOISE_AMPL);

  this.force.x = (this.targetedPos.x - this.savedPos.x) * P_SPEED;
  this.force.y = (this.targetedPos.y - this.savedPos.y) * P_SPEED;

  this.savedPos.x += this.force.x;
  this.savedPos.y += this.force.y;
  this.x += this.force.x + this.vel.x;
  this.y += this.force.y + this.vel.y;
};

Particle.prototype.toDepart = function(x, y) {
  if (getDistBetweenTwoVec2(this.targetedPos.x, this.targetedPos.y, x, y) < DIST_AMPL) {
    this.updadeTargetPos();
  }
};
Particle.prototype.updadeTargetPos = function(x = getRandomFloat(-DIST_AMPL, DIST_AMPL), y = getRandomFloat(-DIST_AMPL, DIST_AMPL)) {
  this.savedPos.x = this.x;
  this.savedPos.y = this.y;
  this.targetedPos.x = this.x + x;
  this.targetedPos.y = this.y + y;
};

Particle.prototype.setPosition = function(pos, coor) {
  if (coor === 'x') {
    this.x = pos;
  } else if (coor === 'y') {
    this.y = pos;
  }
};

const particles = [];

/* ---- Functions ----*/
function loop() {
  let i;
  const length = particles.length;
  context.beginPath();
  context.rect(0, 0, windowWidth, windowHeight)
  context.fillStyle = 'RGBA(9, 4, 70, 0.1)';
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
  for (i = 0; i < NBR_PARTICLES_START; i++) {
    particles.push(new Particle(
      getRandomFloat(0, windowWidth),
      getRandomFloat(0, windowHeight),
  ));
  }
}
init();

window.addEventListener('mousemove', (e) => {
  let i;
  const length = particles.length;
  for (i = 0; i < length; i++) {
    particles[i].toDepart(e.clientX, e.clientY);
  }
});

loop();
