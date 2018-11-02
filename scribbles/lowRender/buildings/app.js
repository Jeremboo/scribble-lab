import { getDistBetweenTwoVec2, getRandomInt, getRandomItem } from 'utils';

// const WIDTH = 80;
// const HEIGHT = 60;
const WIDTH = 80;
const HEIGHT = 60;

const ZOOM = 2;

const BUILDING_SIZE_MIN = 1;
const BUILDING_SIZE_MAX = 4;

// MAX => 80 = 3
const ELEVATION_MIN = 1;
const ELEVATION_MAX = Math.min(HEIGHT / 2.5, 45);

const SPEED_MIN = 1;
const SPEED_MAX = 3;

const POINTER_SIZE_MIN = 1;
const POINTER_SIZE_MAX = 4;

// 80x60 === 0.9
const FREQUENCY = Math.max(0.001, Math.min(0.999, (1 - (0.017 * ((WIDTH + HEIGHT) / 10)))));


const CLEAN_SPEED = 0.01;
const PERSPECTIVE = 0.75;

const COLORS = [
  '#f6ea80',
  '#58ebf0',
  '#e491a8',
  '#7b73dc',
  '#b0f2b2',
  '#e6799a',
  '#ffffff',
  '#333333',
];

const BACKGROUND_COLOR = '0, 0, 0';

/**
 * * *******************
 * * CORE
 * * *******************
 */
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

canvas.id = 'canvas';
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.width = `${WIDTH * ZOOM}px`;
canvas.style.height = `${HEIGHT * ZOOM}px`;
document.body.insertBefore(canvas, document.body.firstChild);


/**
 * * *******************
 * * CREATING ZONE
 * * *******************
 */

const DIR = {
  LEFT: 'left',
  RIGHT: 'right',
  UP: 'up',
  DOWN: 'down',
  NONE: 'none',
};

const BUILT_DIRECTIONS = [
  { vertical: DIR.UP, horizontal: DIR.RIGHT },
  { vertical: DIR.UP, horizontal: DIR.LEFT },
  { vertical: DIR.DOWN, horizontal: DIR.LEFT },
  { vertical: DIR.DOWN, horizontal: DIR.RIGHT },
];

class Building {
  // Save state here
  constructor(x, y) {
    this.pointerSize = getRandomInt(POINTER_SIZE_MIN, POINTER_SIZE_MAX);
    this.speed = getRandomInt(SPEED_MIN, SPEED_MAX);
    this.width = getRandomInt(BUILDING_SIZE_MIN, BUILDING_SIZE_MAX);
    this.height = getRandomInt(BUILDING_SIZE_MIN, BUILDING_SIZE_MAX);
    this.color = getRandomItem(COLORS);
    this.startingPosition = { x, y };
    this.position = Object.assign({}, this.startingPosition);

    this.buildDirectionIdx = 0;
    this.currentSizeBuild = this.width;
    this.direction = BUILT_DIRECTIONS[this.buildDirectionIdx];

    this.isAlive = true;
    this.elevation = 0;
    this.elevationMax = getRandomInt(ELEVATION_MIN, ELEVATION_MAX);
  }

  // Update values here
  update() {
    const { dist } = getDistBetweenTwoVec2(
      this.startingPosition.x,
      this.startingPosition.y,
      this.position.x,
      this.position.y,
    );

    if (dist > this.currentSizeBuild) {
      // Switch targeted size
      this.currentSizeBuild = (this.currentSizeBuild === this.width) ? this.height : this.width;
      // Swith orientation !
      this.buildDirectionIdx = (this.buildDirectionIdx + 1) % BUILT_DIRECTIONS.length;
      this.direction = BUILT_DIRECTIONS[this.buildDirectionIdx];

      if (this.buildDirectionIdx === 0) {
        this.position.y -= 1;
        this.elevation += 1;

        if (this.elevation > this.elevationMax) this.isAlive = false;
      }

      this.startingPosition = Object.assign({}, this.position);
    }

    // Update the position depending to the orientation
    const speed = {
      x: (this.direction.horizontal !== DIR.NONE && (this.speed * ((this.direction.horizontal === DIR.LEFT) ? -1 : 1))) || 0,
      y: (this.direction.vertical !== DIR.NONE && (this.speed * PERSPECTIVE * ((this.direction.vertical === DIR.UP) ? -1 : 1))) || 0,
    };
    this.position.x += speed.x;
    this.position.y += speed.y;
  }

  render() {
    context.beginPath();
    // draw Something Here
    context.fillStyle = this.color;
    context.fillRect(this.position.x, this.position.y, this.pointerSize, this.pointerSize);

    context.stroke();
    context.fill();
  }
}


/**
 * * *******************
 * * START
 * * *******************
 */

context.fillStyle = `rgba(${BACKGROUND_COLOR}, 1)`;
context.fillRect(0, 0, WIDTH, HEIGHT);
// const building = new Building(15, 15);

let buildings = [];

let i = 0;

function loop() {
  if (Math.random() > FREQUENCY) {
    const b = new Building(
      getRandomInt(0, WIDTH),
      getRandomInt(0, HEIGHT + ELEVATION_MAX),
    );
    buildings.push(b);
  }

  for (i = 0; i < buildings.length; i++) {
    buildings[i].update();
    buildings[i].render();
  }

  buildings = buildings.filter(building => building.isAlive);
}


/**
 * * *******************
 * * LOOP
 * * *******************
 */
const cleanerColor = `rgba(${BACKGROUND_COLOR}, ${CLEAN_SPEED})`;
function l() {
  // context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = cleanerColor;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  loop();
 	requestAnimationFrame(l);
}
l();
