import { Container, Texture, Point, Graphics, mesh } from 'pixi.js';
import { canvasBuilder, applyImageToCanvas, existingValueBy } from 'utils';
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
  constructor(x = 0, y = 0, length = 60, { color = 0xf4cd6a, textured = true } = {}) {
    super();

    this.texture = null;
    this.nbrOfNodes = Math.round(length / ROPE_SEGMENT_LENGTH) + 1;
    this.points = [];
    this.oldPoints = [];
    this.attachedPoints = [];
    this.count = 0;

    for (let i = 0; i < this.nbrOfNodes; i++) {
      this.points.push(new Point(
        (i * ROPE_SEGMENT_LENGTH) + x,
        y
      ));
      this.oldPoints.push(new Point(
        (i * ROPE_SEGMENT_LENGTH) + x,
        y
      ));
    }

    this.position.x = 0;
    this.position.y = 0;

    this.update = this.update.bind(this);

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

    this.attachPoint(0, x, y);
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

  attachPoint(idx, x, y) {
    const existingValue = existingValueBy(this.attachedPoints, value => (value.idx === idx));
    if (!existingValue) {
      this.attachedPoints.push({ idx, x, y });
    } else {
      this.attachedPoints[this.attachedPoints.indexOf(existingValue)] = { idx, x, y };
    }
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
