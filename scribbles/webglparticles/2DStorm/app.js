import { GUI } from 'dat.gui/build/dat.gui';

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
const COLORS = ['#32234A', '#820263', '#D90368', '#883677', '#CA61C3'];

const props = {
  PARTICLE_NUMBERS: 500,
  LINE_WIDTH: 2,

  DEMISE_DISTANCE: 20,
  APPARITION_DISTANCE: 350,

  ROTATION_FORCE: 10,

  VEL_MAX: 5,
  VEL_MIN: 0,
  VEL_BRAKE_MIN: 0.9,
  VEL_BRAKE_MAX: 0.95,

  ATT_AMPL: 3.8, // To reduce the force of the attraction at cente,
  ATT_ZONE: 0.8,
  ATT_FORCE: 0.02,

};

// Helpers 1
const gui = new GUI();
const particleNumbers = gui.add(props, 'PARTICLE_NUMBERS', 1, 1500);
gui.add(props, 'LINE_WIDTH', 1, 10);
gui.add(props, 'DEMISE_DISTANCE', 0, 100);
gui.add(props, 'APPARITION_DISTANCE', 0, windowWidth);
gui.add(props, 'ROTATION_FORCE', 0, 100);

const velocity = gui.addFolder('Velocity');
const velMin = velocity.add(props, 'VEL_MIN', 0, 80);
const velMax = velocity.add(props, 'VEL_MAX', 0, 80);
const velBrakeMin = velocity.add(props, 'VEL_BRAKE_MIN', 0, 1);
const velBrakeMax = velocity.add(props, 'VEL_BRAKE_MAX', 0, 1);

const attraction = gui.addFolder('Attraction');
attraction.add(props, 'ATT_AMPL', 0, 10);
attraction.add(props, 'ATT_ZONE', 0, 1);
attraction.add(props, 'ATT_FORCE', 0, 0.1);


Math.sqr = (a) => a * a;
Math.randomF = (min, max) => Math.random() * (max - min) + min;
const getDist = (x1, y1, x2, y2) => Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1));
const getRandomAngle = () => Math.random() * Math.PI * 2;

const getRandomVelMax = () => Math.randomF(props.VEL_MIN, props.VEL_MAX);
const getRandomVelBrake = () => Math.randomF(props.VEL_BRAKE_MIN, props.VEL_BRAKE_MAX);

/* ---- PARTICLE ---- */
class Particle {
  constructor(x, y) {
    this.init(x, y);
    this.life = 0;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  init(x, y) {
    const angle = getRandomAngle();
    const radius = Math.randomF(0, props.APPARITION_DISTANCE);
    this.x = x || Math.cos(angle) * radius;
    this.y = y || Math.sin(angle) * radius;
    this.train = [];
    this.vel = {
      x: 0,
      y: 0,
      max: getRandomVelMax(),
      brake: getRandomVelBrake(),
    };
  }

  render() {
    context.beginPath();
    context.strokeStyle = this.color;
    context.lineWidth = props.LINE_WIDTH; // TODO augmenter la taille du trai en fonction de la distance ?

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
    if (dist < props.DEMISE_DISTANCE) {
      this.init();
      return;
    }

    const norm = {
      x: this.x / dist,
      y: this.y / dist,
    };

    // calculate force
    // http://www.mathopenref.com/graphfunctions.html?fx=(exp(a * (1 - x - b))) * c&xh=1&xl=0&yh=10&yl=-10&a=3.595744680851064&b=0.3&c=1.4&dh=10&dl=-4&d=5.6
    const f = Math.exp(props.ATT_AMPL * (props.ATT_ZONE - (dist / windowWidth))) * props.ATT_FORCE;
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
      x: normalizedOrthogonalVec.x * props.ROTATION_FORCE,
      y: normalizedOrthogonalVec.y * props.ROTATION_FORCE,
    };
  }
}

// START
let particles = [];

function init() {
  particles = [];
  for (let i = 0; i < props.PARTICLE_NUMBERS; i++) {
    particles.push(new Particle());
  }
}

init();

// HELPER 2
particleNumbers.onChange(() => {
  let i;
  const nbrOfParticles = particles.length;
  if (props.PARTICLE_NUMBERS > nbrOfParticles) {
    for (i = nbrOfParticles; i < props.PARTICLE_NUMBERS; i++) {
      particles.push(new Particle());
    }
  } else {
    for (i = props.PARTICLE_NUMBERS; i < nbrOfParticles; i++) {
      particles.splice(props.PARTICLE_NUMBERS, nbrOfParticles - props.PARTICLE_NUMBERS);
    }
  }
});
velMin.onChange(() => {
  particles.forEach(particle => {
    particle.vel.max = getRandomVelMax();
  });
});
velMax.onChange(() => {
  particles.forEach(particle => {
    particle.vel.max = getRandomVelMax();
  });
});
velBrakeMin.onChange(() => {
  particles.forEach(particle => {
    particle.vel.brake = getRandomVelBrake();
  });
});
velBrakeMax.onChange(() => {
  particles.forEach(particle => {
    particle.vel.brake = getRandomVelBrake();
  });
});
props.init = init;
gui.add(props, 'init');

// LOOP
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
