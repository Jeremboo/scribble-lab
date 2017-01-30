import { Container, Texture, Point, Graphics, mesh } from 'pixi.js';
import { canvasBuilder, applyImageToCanvas, existingValueBy, getDistBetweenTwoVec2 } from 'utils';
import rope from 'rope.png';
import ropePattern from 'ropePattern.png';
import ropeBegin from 'ropeBegin.png';
import ropeEnd from 'ropeEnd.png';

const GRAVITY = { x: 0, y: 8 };
const SPRING = 0.9;
const TENTION = 0.5;
const VEL = 0.1;

const ROPE_SEGMENT_LENGTH = 30;
const ROPE_WIDTH = 10;

export default class Rope extends Container {
  constructor(p1, p2, { color = 0xf4cd6a, textured = true } = {}) {
    super();
    if (!p1.x || !p1.y || !p2.x || !p2.y) {
      console.warging('the two first parameters must be vector2');
      return;
    }

    this.texture = null;
    this.nbrOfNodes = 0;
    this.points = [];
    this.oldPoints = [];
    this.attachedPoints = [];
    this.count = 0;

    // Normalize and place point to the line
    // http://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
    const { dist } = getDistBetweenTwoVec2(p1.x, p1.y, p2.x, p2.y);
    const u = {
      x: (p1.x - p2.x) / dist,
      y: (p1.y - p2.y) / dist,
    };
    let distToP1 = 0;
    while (distToP1 < dist) {
      this.addPoint(
        p1.x - (distToP1 * u.x),
        p1.y - (distToP1 * u.y),
      );
      distToP1 = this.nbrOfNodes * ROPE_SEGMENT_LENGTH;
    }
    this.addPoint(p2.x, p2.y);

    // DEBUG
    if (textured) {
      this.buildRopeTexture(() => {
        this.rope = new mesh.Rope(this.texture, this.points);
        this.rope.tint = color;
        this.addChild(this.rope);
      });
    } else {
      this.g = new Graphics();
      this.addChild(this.g);
    }

    this.update = this.update.bind(this);
  }

  addPoint(x, y) {
    this.nbrOfNodes++;
    this.points.push(new Point(x, y));
    this.oldPoints.push(new Point(x, y));
  }

  buildRopeTexture(callback) {
    let canvasRopePattern = null;
    let canvasRopeBegin = null;
    applyImageToCanvas(ropePattern, ROPE_WIDTH, ROPE_WIDTH).then(cRopePattern => {
      canvasRopePattern = cRopePattern;
      return applyImageToCanvas(ropeBegin, ROPE_WIDTH, ROPE_WIDTH);
    }).then(cRopeBegin => {
      canvasRopeBegin = cRopeBegin;
      return applyImageToCanvas(ropeEnd, ROPE_WIDTH, ROPE_WIDTH);
    }).then(cRopeEnd => {
      // build rope
      const ropeWidth = this.nbrOfNodes * ROPE_SEGMENT_LENGTH;
      const { canvas, context } = canvasBuilder(ropeWidth, ROPE_WIDTH);
      const nbrOfRopePattern = (ropeWidth / canvasRopePattern.height) - 1;
      context.drawImage(canvasRopeBegin, 0, 0);
      for (let i = 1; i < nbrOfRopePattern; i++) {
        context.drawImage(canvasRopePattern, i * ROPE_WIDTH, 0);
      }
      context.drawImage(cRopeEnd, ropeWidth - ROPE_WIDTH, 0);

      // this.texture = Texture.fromImage(rope);
      // this.texture = Texture.fromImage(canvas.toDataURL());
      this.texture = Texture.fromCanvas(canvas);
      callback();
    })
    .catch(err => {
      console.log(err);
    });
  }

  attachPoint(idx, x = 0, y = 0) {
    let point = existingValueBy(this.attachedPoints, value => (value.idx === idx));
    if (!point) {
      point = { idx, x, y };
      this.attachedPoints.push(point);
    } else {
      this.attachedPoints[this.attachedPoints.indexOf(point)] = { idx, x, y };
    }
    return point;
  }

  detachPoint(idx) {
    const existingValue = existingValueBy(this.attachedPoints, value => (value.idx === idx));
    if (existingValue) {
      this.attachedPoints.splice(this.attachedPoints.indexOf(existingValue), 1);
    } else {
      console.log(`ERROR : The point ${idx} is not attached`);
    }
  }

  update() {
    // http://codepen.io/chribbe/pen/aHhdE?editors=0010
    for (let i = 1; i < this.nbrOfNodes; i++) {
      this.oldPoints[i].x = this.points[i].x;
      this.oldPoints[i].y = this.points[i].y;

      // gravity
      this.points[i].x += GRAVITY.x;
      this.points[i].y += GRAVITY.y;

      // friction
      this.points[i].x += (this.points[i].x - this.oldPoints[i].x) * VEL;
      this.points[i].y += (this.points[i].y - this.oldPoints[i].y) * VEL;

      // tention
      const x = this.points[i].x - this.points[i - 1].x;
      const y = this.points[i].y - this.points[i - 1].y;
      const dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
      const f = (dist - ROPE_SEGMENT_LENGTH) * SPRING;
      const fx = (x / dist) * f;
      const fy = (y / dist) * f;
      this.points[i].x -= fx;
      this.points[i].y -= fy;
      this.points[i - 1].x += fx * TENTION;
      this.points[i - 1].y += fy * TENTION;
    }

    // UPDATE ATTACHED POINTS
    for (let j = 0; j < this.attachedPoints.length; j++) {
      const attachedPoint = this.attachedPoints[j];
      this.points[attachedPoint.idx].x = attachedPoint.x; // + (Math.cos(this.i) * 300);
      this.points[attachedPoint.idx].y = attachedPoint.y; // + (Math.sin(this.i) * 300);
    }

    if (this.g) this.renderPoints();
  }

  renderPoints() {
    this.g.clear();
    this.g.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.g.beginFill(0xffffff, 0);
      this.g.lineStyle(1, 0x48E5C2, 1);
      this.g.lineTo(this.points[i].x, this.points[i].y);
      this.g.endFill();
    }
  }
}
