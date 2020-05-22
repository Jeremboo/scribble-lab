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

import { getPosXBetweenTwoNumbers } from '../../../utils';
import { distance } from '../../../utils/vec2';

const NBR_OF_POINTS = 50;
const MOUSE_DIST = 8;
const MOUSE_VEL = 0.2;


/**
* MOUSE
*/

class Mouse {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.direction = {
      x: 0,
      y: 0,
    };

    this.updateMousePosition = this.updateMousePosition.bind(this);
    document.body.addEventListener('mousemove', this.updateMousePosition);
  }

  updateMousePosition(e) {
    const x = e.x;
    const y = e.y;

    this.direction = {
      x: x - this.x,
      y: y - this.y,
    };

    this.x = x;
    this.y = y;
  }

  debugRender() {
    context.beginPath();
    context.strokeStyle = '#ff0000';
    context.moveTo(this.x, this.y);
    context.lineTo(this.x + (this.direction.x * 4), this.y + (this.direction.y * 4));
    context.closePath();
    context.stroke();
  }

  update() {
    this.direction.y -= this.direction.y * MOUSE_VEL;
  }
}
const mouse = new Mouse();

/**
* WAVE
*/
class Wave {
  // Save state here
  constructor(x, y, segmentLength, depth) {
    // TODO build the shape
    this.points = [];
    this.currentPoints = [];
    this.depth = depth;

    this.length = segmentLength * NBR_OF_POINTS;
    let i;
    for (i = 0; i < NBR_OF_POINTS + 2; i++) {

      const _x = x + (segmentLength * (i - 1));
      const _y = y;

      let cp2x = _x;
      let cp2y = _y;

      let cp1x;
      let cp1y;
      const previousPoint = this.points[i - 1];
      if (previousPoint) {
        cp1x = previousPoint.x;
        cp1y = previousPoint.y;
      }

      this.points.push({
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        x: _x,
        y: _y,
        forceY: 0,
      });
      // Clone the point poisitions
      this.currentPoints.push(Object.assign({}, this.points[i]));
    }
  }

  // Update values here
  update() {
    let i;
    const length = this.points.length - 1;
    for (i = 1; i < length; i++) {
      const p = this.points[i];
      const dist = distance(p.x, p.y, mouse.x, mouse.y);

      // Mouse influence for the wave
      const ratioOfInfluence = Math.max(
        0,
        getPosXBetweenTwoNumbers(0, MOUSE_DIST * Math.abs(mouse.direction.y), dist.dist),
      );

      // Apply the resistance force
      let currentForce = (this.points[i].y - this.currentPoints[i].y) * 0.1;
      // Apply mouse force of the line
      if (mouse.direction.y * dist.y > 0) {
        currentForce += ratioOfInfluence * mouse.direction.y;
      }
      this.currentPoints[i].forceY += currentForce;

      // Apply
      this.currentPoints[i].y += this.currentPoints[i].forceY;
      // Decrement
      this.currentPoints[i].forceY *= 0.9;

      // SMOOTH
      this.currentPoints[i].cp1x = this.currentPoints[i - 1].x;
      this.currentPoints[i].cp1y = this.currentPoints[i - 1].y;
      this.currentPoints[i].cp2x = this.currentPoints[i].x;
      this.currentPoints[i].cp2y = this.currentPoints[i].y;
    }
  }

  render() {
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 1;

    // Start the first point
    context.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);

    // Draw the waveLine
    let i;
    const length = this.currentPoints.length - 1;
    for (i = 1; i < length; i++) {
      const p = this.currentPoints[i];

      context.bezierCurveTo(
        p.cp1x,
        p.cp1y,
        p.cp2x,
        p.cp2y,
        p.x,
        p.y,
      );
    }

    context.lineTo(this.currentPoints[length].x, this.currentPoints[length].y);
    context.lineTo(this.currentPoints[length].x, this.currentPoints[0].y + this.depth);
    context.lineTo(this.currentPoints[0].x, this.currentPoints[0].y + this.depth);
    context.lineTo(this.currentPoints[0].x, this.currentPoints[0].y);
    context.closePath();
    context.fill();
  }


  // DEBUG
  // Show points
  debugRender() {
    let i;
    const length = this.points.length - 1;
    for (i = 1; i < length; i++) {
      const p = this.points[i];

      // POINTS
      context.beginPath();
      context.strokeStyle = '#ff0000';
      context.lineWidth = 10;
      context.arc(p.x, p.y, 1, 0, 2 * Math.PI, false);
      context.stroke();
      context.closePath();

      // MARKERS
      context.beginPath();
      context.fillStyle = '#0000ff';
      context.arc(p.cp1x, p.cp1y, 4, 0, 2 * Math.PI, false);
      context.arc(p.cp2x, p.cp2y, 4, 0, 2 * Math.PI, false);
      context.fill();
      context.closePath();

      // LINES
      context.beginPath();
      context.strokeStyle = '#0000ff';
      context.lineWidth = 1;
      context.moveTo(p.cp1x, p.cp1y);
      context.lineTo(this.points[i - 1].x, this.points[i - 1].y);
      context.moveTo(p.x, p.y);
      context.lineTo(p.cp2x, p.cp2y);
      context.closePath();
      context.stroke();
    }
  }
}


/**
 * START
 */
const wave = new Wave(0, windowHeight * 0.5, (windowWidth / (NBR_OF_POINTS - 1)), windowHeight * 0.5);

/**
* LOOP
*/
function loop() {
  mouse.update();
  wave.update();
  wave.render();
  // mouse.debugRender();
  // wave.debugRender();
}


/* ---- CREATING ZONE END ---- */
/**/ /* ---- LOOP ---- */
/**/ function _loop(){
/**/   context.clearRect(0,0, windowWidth, windowHeight);
/**/   loop();
/**/ 	 requestAnimationFrame(_loop);
/**/ }
/**/ _loop();
/**/ /* ---- LOOP END ---- */
