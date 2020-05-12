import p2 from 'p2';

// * PROPS ****
const RAD_360 = Math.PI * 2;
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUB_STEPS = 10;
const PROPS = {
  nbrOfCircle: 30,
  mainColor: '#ffffff',
  bgColor: '#000000',
  radius: 20,
  entranceSize: 90,
  entranceWidth: -8,
  entranceAngle: 0.029,
  friction: 1,
  velocity: 15000,
  mass: 5,
  securityDistance: 150,
  mouseVelocity: 1000,
  mouseMass: 20
};

// Utils
Math.sqr = x => x * x;
const magnitude = (x, y) => Math.sqrt(Math.sqr(x) + Math.sqr(y));
const normalize = (x, y) => {
  const mag = magnitude(x, y);
  return [x / mag, y / mag];
}
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min);
const getInitialRandomPosition = (width, height) => {
  return [
    getRandomFloat(-PROPS.radius, width * 0.9),
    getRandomFloat(-PROPS.radius, height + PROPS.radius)
  ]
};
const getRandomPosition = (width, height) => {
  return [
    getRandomFloat(-PROPS.radius * 2, -PROPS.radius),
    getRandomFloat(-height , height * 2)
  ]
};

// Canvas
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// * PHYSIC ****
const world = new p2.World({
  gravity: [5, 0],
});
world.solver.tolerance = 0.001;
world.sleepMode = p2.World.BODY_SLEEPING;

const stageBody = new p2.Body();
world.addBody(stageBody);

// Walls
const wall1 = new p2.Body({
  mass: 0,
  angle: -Math.PI * PROPS.entranceAngle,
});
world.addBody(wall1);
const wall2 = new p2.Body({
  mass: 0,
  angle: Math.PI * PROPS.entranceAngle,
});
world.addBody(wall2);

const updateWalls = (width, height) => {
  const wallSize = (height - PROPS.entranceSize) * 0.5;
  wall1.position[0] = width - PROPS.entranceWidth;
  wall1.position[1] = wallSize * 0.5;
  if (wall1.shapes[0]) {
    wall1.removeShape(wall1.shapes[0])
  }
  wall1.addShape(new p2.Box({ width: 50, height: wallSize }));
  wall2.position[0] = width - PROPS.entranceWidth;
  wall2.position[1] = wallSize + PROPS.entranceSize + wallSize * 0.5;
  if (wall2.shapes[0]) {
    wall2.removeShape(wall2.shapes[0])
  }
  wall2.addShape(new p2.Box({ width: 50, height: wallSize }));
}

// Mouse
const mouse = new p2.Body({
  mass: PROPS.mouseMass,
});
mouse.addShape(new p2.Circle({ radius: PROPS.radius }));
world.addBody(mouse);

 // * TARGET ****
 const target = [0, 0];
 const updateTarget = (width, height) => {
   target[0] = width * 1.1;
   target[1] = height * 0.5;
 }
 // * Circle ****
class Circle {
  constructor(idx, x, y) {
    this.idx = idx;
    this.position = [x, y];
    this.initialPosition = [x, y];
    this.radius = PROPS.radius;
    this.force = [0, 0];

    // Physic
    this.body = new p2.Body({
      mass: PROPS.mass,
      position: [x, y],
    });

    // Add a circle shape to the body
    this.shape = new p2.Circle({ radius: PROPS.radius });
    this.body.addShape(this.shape);

    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
  }

  applyForce(force) {
    this.body.applyForce(force);
  }

  updateIdx() {
    this.idx -= 1;
  }

  update({ width, height, state }) {
    if (state) {
      const positionX = width + PROPS.radius - (this.idx * PROPS.securityDistance);
      this.force[0] = positionX - this.position[0];
      this.force[1] = (height * 0.5) - this.position[1];
      this.force[0] *= 50;
      this.force[1] *= 50;
    } else {
      this.force = normalize(
        target[0] - this.position[0],
        target[1] - this.position[1]
      );
      this.force[0] *= PROPS.velocity;
      this.force[1] *= PROPS.velocity;
    }

    this.body.applyForce(this.force);
    this.body.applyDamping(PROPS.friction);

    if (this.body.position[0] > width + PROPS.radius) {
      this.body.position = getRandomPosition(width, height);
      this.body.force = [0, 0];
      if (state) {
        this.idx = PROPS.nbrOfCircle + this.idx;
      }
    }
    this.position[0] = this.body.position[0];
    this.position[1] = this.body.position[1];
  }

  render() {
    context.beginPath();
    context.strokeStyle = PROPS.mainColor;
    context.lineWidth = 8;
    context.arc(this.position[0], this.position[1], this.radius - 1, 0, RAD_360);
    context.stroke();

    // context.beginPath();
    // context.fillStyle = PROPS.mainColor;
    // const normalizedForce = normalize(this.force[0], this.force[1]);
    // context.arc(
    //   this.position[0] + normalizedForce[0] * 10,
    //   this.position[1] + normalizedForce[1] * 10,
    //   4, 0, RAD_360);
    // context.fill();
  }
}

/**
 * * *******************
 * * START
 * * *******************
 */
let lastTime;
let mouseForce = [];
const mousePosition = [0, 0];
const circles = [];

IS.create({
  onInit: ({ width, height }) => {
    canvas.width = width;
    canvas.height = height;
    updateWalls(width, height);
    updateTarget(width, height);

    for(let i = 0 ; i < PROPS.nbrOfCircle; i++) {
      const circle = new Circle(i, ...getInitialRandomPosition(width, height));
      world.addBody(circle.body);
      circles.push(circle);
    }
  },
  onChangeState: (state) => {
    mouse.removeShape(mouse.shapes[0]);
    if(!state) {
      for (let i = 0 ; i < circles.length; i++) {
        circles[i].applyForce([getRandomFloat(10000, 1500000), getRandomFloat(-100000, 100000)]);
      }
      mouse.addShape(new p2.Circle({ radius: PROPS.radius }));
    } else {
      mouse.addShape(new p2.Circle({
        radius: PROPS.securityDistance,
      }));
    }
  },
  onResize: ({ width, height }) => {
    canvas.width = width;
    canvas.height = height;
    updateWalls(width, height);
    updateTarget(width, height);
  },
  onTick: (props) => {
    const { width, height, timestamp, state, isPointerInside } = props;
    context.fillStyle = PROPS.bgColor;
    context.fillRect(0, 0, width, height);

    // Walls
    context.beginPath();
    context.rect(
      width - 2,
      wall1.position[1] - wall1.shapes[0].height * 0.5,
      1,
      wall1.shapes[0].height
    );
    context.rect(
      width - 2,
      wall2.position[1] - wall2.shapes[0].height * 0.5,
      1,
      wall2.shapes[0].height
    );
    context.lineWidth = 8;
    context.stroke();

    // Mouse
    if (isPointerInside) {
      mouseForce[0] = (mousePosition[0] - mouse.position[0]) * PROPS.mouseVelocity;
      mouseForce[1] = (mousePosition[1] - mouse.position[1]) * PROPS.mouseVelocity;
    } else {
      mouseForce = normalize(
        target[0] - mouse.position[0],
        target[1] - mouse.position[1]
      );
      mouseForce[0] *= PROPS.velocity * 4;
      mouseForce[1] *= PROPS.velocity * 4;

      if (mouse.position[0] > width + PROPS.radius) {
        mouse.position = getRandomPosition(width, height);
        mouse.force = [0, 0];
      }
    }
    mouse.applyForce(mouseForce);
    mouse.applyDamping(PROPS.friction);

    context.beginPath();
    context.fillStyle = PROPS.mainColor;
    context.arc(mouse.position[0], mouse.position[1], PROPS.radius, 0, RAD_360);
    context.fill();

    // const normalizedMouse = normalize(mouse.force[0], mouse.force[1]);
    // context.beginPath();
    // context.fillStyle = PROPS.bgColor;
    // context.arc(mouse.position[0] + normalizedMouse[0] * 10, mouse.position[1] + normalizedMouse[1] * 10, 4, 0, RAD_360);
    // context.fill();

    // * UPDATE PHYSIC **
    const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
    world.step(FIXED_TIME_STEP, deltaTime, MAX_SUB_STEPS);
    lastTime = timestamp;

    // * UPDATE **
    const updateIncrement = state && Math.random() > 0.98;
    for (let i = 0 ; i < circles.length; i++) {
      if (updateIncrement) {
        circles[i].updateIdx();
      }
      circles[i].update(props);
      circles[i].render();
    }
  },
  onPointerMove: ({ x, y }) => {
    mousePosition[0] = x;
    mousePosition[1] = y;
  },
})

