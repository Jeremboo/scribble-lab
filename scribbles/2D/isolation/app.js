import p2 from 'p2';
import { getRandomFloat, magnitude } from '../../../modules/utils';


// * PROPS ****
const RAD_360 = Math.PI * 2;
const FIXED_TIME_STEP = 1 / 60;
const MAX_SUB_STEPS = 10;
const PROPS = {
  nbrOfCircle: 30,
  mainColor: '#000000',
  bgColor: '#ffffff',
  radius: 20,
  entranceSize: 90,
  entranceWidth: -8,
  entranceAngle: 0.029,
  friction: 1,
  velocity: 15000,
  mass: 5,
};

// Utils
const normalize = (x, y) => {
  const mag = magnitude(x, y);
  return [x / mag, y / mag];
}
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
    this.shape = new p2.Circle({ radius: this.radius });
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
      const positionX = width + PROPS.radius - (this.idx * 150);
      this.force[0] = positionX - this.position[0];
      this.force[1] = (height * 0.5) - this.position[1];
      this.force[0] *= 100;
      this.force[1] *= 100;

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
    context.fillStyle = PROPS.mainColor;
    context.arc(this.position[0], this.position[1], this.radius, 0, RAD_360);
    context.fill();
  }
}

/**
 * * *******************
 * * START
 * * *******************
 */
let lastTime;
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
    if(!state) {
      console.log('force')
      for (let i = 0 ; i < circles.length; i++) {
        circles[i].applyForce([getRandomFloat(10000, 1500000), getRandomFloat(-100000, 100000)]);
      }
    }
  },
  onResize: ({ width, height }) => {
    canvas.width = width;
    canvas.height = height;
    updateWalls(width, height);
    updateTarget(width, height);
  },
  onTick: (props) => {
    const { width, height, timestamp, state } = props;
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
    // context.rect(
    //   wall2.position[0] - wall1.shapes[0].width * 0.5,
    //   wall1.position[1] - wall1.shapes[0].height * 0.5,
    //   wall2.shapes[0].width,
    //   wall1.shapes[0].height
    // );
    // context.rect(
    //   wall2.position[0] - wall1.shapes[0].width * 0.5,
    //   wall2.position[1] - wall2.shapes[0].height * 0.5,
    //   wall2.shapes[0].width,
    //   wall2.shapes[0].height
    // );
    context.stroke();

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
  onPointerMove: (data) => {},
})

