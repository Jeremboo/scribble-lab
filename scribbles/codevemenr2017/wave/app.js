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

const NBR_OF_POINTS = 10;

/**
* WAVE
*/
class Wave {
  // Save state here
  constructor(x, y, segmentLength, depth) {
    // TODO build the shape
    this.points = [];
    this.depth = depth;

    this.length = segmentLength * NBR_OF_POINTS;
    let i;
    for (i = 0; i < NBR_OF_POINTS; i++) {

      const _x = x + (segmentLength * i);
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
      });
    }
  }

  // Update values here
  update() {}

  render() {
    context.beginPath();
    context.strokeStyle = '#000000';
    context.lineWidth = 1;

    // Start the first point
    context.moveTo(this.points[0].x, this.points[0].y);

    // Draw the waveLine
    let i;
    const length = this.points.length - 1;
    for (let i = 1; i < length; i++) {
      const p = this.points[i];

      context.bezierCurveTo(
        p.cp1x,
        p.cp1y,
        p.cp2x,
        p.cp2y,
        p.x,
        p.y,
      );
    }

    context.lineTo(this.points[length].x, this.points[length].y);
    context.lineTo(this.points[length].x, this.points[0].y + this.depth);
    context.lineTo(this.points[0].x, this.points[0].y + this.depth);
    context.lineTo(this.points[0].x, this.points[0].y);
    context.closePath();
    context.fill();
  }


  // DEBUG
  // Show points
  debugRender() {
    let i;
    const length = this.points.length - 1;
    for (let i = 1; i < length; i++) {
      const p = this.points[i];

      // POINTS
      context.beginPath();
      context.strokeStyle = '#ff0000';
      context.lineWidth = 10;
      context.arc(p.x, p.y, 5, 0, 2 * Math.PI, false);
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
  wave.update();
  wave.render();
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
