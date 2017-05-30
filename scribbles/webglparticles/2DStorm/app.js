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
const PARTICLE_NUMBERS = 1000;
const PARTICULE_AMPL = 0.4;
const FORCE_VELOCITY = 0.002;
const VEL_MAX = 0.001;
const VELOCITY = 0.95;

const COLORS = ['#32234A', '#820263', '#D90368', '#883677', '#CA61C3'];

Math.sqr = (a) => a * a;
Math.randomF = (min, max) => Math.random() * (max - min) + min;

function getDist(x1, y1, x2, y2) {
  return Math.sqrt(Math.sqr(y2 - y1) + Math.sqr(x2 - x1));
}

/* ---- Particle ---- */
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.vel = Math.randomF(-10, 10);
    this.vel = this.getRotationForce();

    this.vel = {
      x: 0,
      y: 0,
      max: Math.randomF(VEL_MAX - 1, VEL_MAX),
    };

    this.train = [];

    // temps
    // this.train.push({ x: this.x, y: this.y });
    // this.train.push({ x: this.x, y: this.y });

    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  initRandomPosition() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.randomF(0, 550);
    this.x = Math.cos(angle) * radius;
    this.y = Math.sin(angle) * radius;
    this.train = [];
  }

  render() {
    context.beginPath();
    context.strokeStyle = this.color;
    context.lineWidth = 1;

    // Show the vel vector
    // context.arc(this.x, this.y, 1, 0, 2 * Math.PI, false);
    //const force = this.getRotationForce();
    // context.moveTo(this.x, this.y);
    //context.lineTo(force.x + this.x, force.y + this.y);

    context.moveTo(this.train[0].x,this.train[0].y);
    let i = this.train.length - 1;
    for (i; i > 0; i--) {
      context.lineTo(this.train[i].x,this.train[i].y);
    }
    context.stroke();

    // TODO if it is near the center, init at a random position
    const dist = getDist(this.x, this.y, 0, 0);
    if (dist < 30) {
      this.initRandomPosition();
    }
  }

  update() {
    // Get force
    const force = {
      x: this.x * FORCE_VELOCITY,
      y: this.y * FORCE_VELOCITY,
    };

    this.vel.x += force.x;
    this.vel.y += force.y;

    this.x -= this.vel.x * PARTICULE_AMPL;
    this.y -= this.vel.y * PARTICULE_AMPL;

    const f = this.getRotationForce();
    this.x += (f.x * 0.3);
    this.y += (f.y * 0.3);

    if(Math.abs(this.vel.x) > this.vel.max)
        this.vel.x *= VELOCITY;
    if(Math.abs(this.vel.y) > this.vel.max)
        this.vel.y *= VELOCITY;

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

    // Get force
    const distFromOrigin = getDist(0, 0, this.x, this.y);
    const f = Math.exp(2) + (distFromOrigin * 0.02);

    return {
      x: normalizedOrthogonalVec.x * f,
      y: normalizedOrthogonalVec.y * f,
    };
  }
}

// START

const particles = [];

for (let i = 0; i < PARTICLE_NUMBERS; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.randomF(0, 550);
	particles.push(new Particle(
		Math.cos(angle) * radius,
		Math.sin(angle) * radius,
	));
}

function loop() {
  particles.map((p, index) => {
    p.update();
    p.render();
	});
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(-origin.x, -origin.y, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
