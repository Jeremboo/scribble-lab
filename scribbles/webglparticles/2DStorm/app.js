/**/ /* ---- CORE ---- */
/**/ const canvas = document.createElement('canvas');
/**/ const context = canvas.getContext('2d');
/**/ let windowWidth = canvas.width = window.innerWidth;
/**/ let windowHeight = canvas.height = window.innerHeight;
/**/ let origin = { x: windowWidth * 0.5, y: windowHeight * 0.5 };
/**/ context.translate(origin.x, origin.y);
/**/ canvas.id = 'canvas';
/**/ document.body.insertBefore(canvas, document.body.firstChild);
/**/ window.onresize = () => {
/**/   windowWidth = canvas.width = window.innerWidth;
/**/   windowHeight = canvas.height = window.innerHeight;
/**/ };
/**/ /* ---- CORE END ---- */


/* ---- CREATING ZONE ---- */

/* ---- SETTINGS ---- */
const PARTICLE_NUMBERS = 100;

const VEL_MAX = 5;
const VEL_MIN = 0;
const VEL_BRAKE_MIN = 0.9;
const VEL_BRAKE_MAX = 0.95;

const LINE_WIDTH = 5;

const DEMISE_DISTANCE = 10;

const ATTRACTIVE_AMPL = 3.8; // To reduce the force of the attraction at center
const ATTRACTIVE_ZONE = 0.1;
const ATTRACTIVE_FORCE = 0.02;

const ROTATION_FORCE = 10;

const COLORS = ['#32234A', '#820263', '#D90368', '#883677', '#CA61C3'];

Math.sqr = (a) => a * a;
Math.randomF = (min, max) => Math.random() * (max - min) + min;
const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1));
const getRandomAngle = () => Math.random() * Math.PI * 2;

/* ---- PARTICLE ---- */
class Particle {
  constructor(x, y) {
    this.init(x, y);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  init(x, y) {
    const angle = getRandomAngle();
    const radius = Math.randomF(0, windowWidth);
    this.x = x || Math.cos(angle) * radius;
    this.y = y || Math.sin(angle) * radius;
    this.train = [];
    this.vel = {
      x: 0,
      y: 0,
      max: Math.randomF(VEL_MIN, VEL_MAX),
      brake: Math.randomF(VEL_BRAKE_MIN, VEL_BRAKE_MAX),
    };
  }

  render() {
    context.beginPath();
    context.strokeStyle = this.color;
    context.lineWidth = LINE_WIDTH; // TODO augmenter la taille du trai en fonction de la distance ?

    let i = this.train.length - 1;
    for (i; i > 0; i--) {
      context.lineTo(this.train[i].x, this.train[i].y);
    }
    context.stroke();
  }

  update() {
    // init values
    const dist = getDist(this.x, this.y, 0, 0);

    // Init a Particle when he near the center
    if (dist < DEMISE_DISTANCE) {
      this.init();
      return;
    }

    const norm = {
      x: this.x / dist,
      y: this.y / dist,
    };

    // calculate force
    const f = Math.exp(ATTRACTIVE_AMPL * (1 - (dist / windowWidth) - ATTRACTIVE_ZONE)) * ATTRACTIVE_FORCE;
    const force = {
      x: norm.x * f,
      y: norm.y * f,
    };

    // update velocity
    this.vel.x += force.x;
    this.vel.y += force.y;

    if (Math.abs(this.vel.x) > this.vel.max) this.vel.x *= this.vel.brake;
    if (Math.abs(this.vel.y) > this.vel.max) this.vel.y *= this.vel.brake;

    // Apply attraction
    this.x -= this.vel.x;
    this.y -= this.vel.y;

    // Apply rotation
    const rf = this.getRotationForce();
    this.x += (rf.x * f);
    this.y += (rf.y * f);

    // Trains
    this.train.push({
      x: this.x,
      y: this.y,
    });
    if (this.train.length > 10) this.train.splice(0, 1);
  }

  getRotationForce() {
    // Get normalized orthogonal vector
    const orthogonalVec = {
      x: -this.y,
      y: this.x,
    };
    const dist = getDist(orthogonalVec.x, orthogonalVec.y, this.x, this.y);
    const normalizedOrthogonalVec = {
      x: orthogonalVec.x / dist,
      y: orthogonalVec.y / dist,
    };

    return {
      x: normalizedOrthogonalVec.x * ROTATION_FORCE,
      y: normalizedOrthogonalVec.y * ROTATION_FORCE,
    };
  }
}

// START
const particles = [];
for (let i = 0; i < PARTICLE_NUMBERS; i++) {
  particles.push(new Particle());
}

let i;
function loop() {
  for (i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].render();
  }
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(-origin.x, -origin.y, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ window.onresize = () => {
/**/   windowWidth = canvas.width = window.innerWidth;
/**/   windowHeight = canvas.height = window.innerHeight;
/**/   origin = { x: windowWidth * 0.5, y: windowHeight * 0.5 };
/**/   context.translate(origin.x, origin.y);
/**/ };
/**/ _loop();
/**/ /* ---- LOOP END ---- */
