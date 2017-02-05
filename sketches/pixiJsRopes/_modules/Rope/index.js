import { Container, Texture, Point, Graphics, mesh } from 'pixi.js';
import { canvasBuilder, applyImageToCanvas, existingValueBy, getDistBetweenTwoVec2 } from 'utils';
import props, { NONE, DRAWING, MOVING } from 'props';
import rope from 'rope.png';
import ropePattern from 'ropePattern.png';
import ropeBegin from 'ropeBegin.png';
import ropeEnd from 'ropeEnd.png';

import Marker from '../Marker';

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
    this.interacitonDist = props.SEGMENT_LENGTH / 2;

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
      distToP1 = this.nbrOfNodes * props.SEGMENT_LENGTH;
    }
    this.addPoint(p2.x, p2.y);

    // MARKER
    this.marker = new Marker(0, 0, 5);

    // DEBUG
    if (textured) {
      this.buildRopeTexture(() => {
        this.rope = new mesh.Rope(this.texture, this.points);
        this.rope.tint = color;
        this.addChild(this.rope);
        this.addChild(this.marker);
      });
    } else {
      this.g = new Graphics();
      this.addChild(this.g);
    }

    this.update = this.update.bind(this);
    this.onCursorOver = this.onCursorOver.bind(this);
    this.onCursorOut = this.onCursorOut.bind(this);
    this.updateCursorPosition = this.updateCursorPosition.bind(this);
  }

  // INIT
  addPoint(x, y) {
    this.nbrOfNodes++;
    this.points.push(new Point(x, y));
    this.oldPoints.push(new Point(x, y));
  }

  buildRopeTexture(callback) {
    let canvasRopePattern = null;
    let canvasRopeBegin = null;
    applyImageToCanvas(ropePattern, props.ROPE_WIDTH, props.ROPE_WIDTH).then(cRopePattern => {
      canvasRopePattern = cRopePattern;
      return applyImageToCanvas(ropeBegin, props.ROPE_WIDTH, props.ROPE_WIDTH);
    }).then(cRopeBegin => {
      canvasRopeBegin = cRopeBegin;
      return applyImageToCanvas(ropeEnd, props.ROPE_WIDTH, props.ROPE_WIDTH);
    }).then(cRopeEnd => {
      // build rope
      const ropeWidth = this.nbrOfNodes * props.SEGMENT_LENGTH;
      const { canvas, context } = canvasBuilder(ropeWidth, props.ROPE_WIDTH);
      const nbrOfRopePattern = (ropeWidth / canvasRopePattern.height) - 1;
      context.drawImage(canvasRopeBegin, 0, 0);
      for (let i = 1; i < nbrOfRopePattern; i++) {
        context.drawImage(canvasRopePattern, i * props.ROPE_WIDTH, 0);
      }
      context.drawImage(cRopeEnd, ropeWidth - props.ROPE_WIDTH, 0);

      // this.texture = Texture.fromImage(rope);
      // this.texture = Texture.fromImage(canvas.toDataURL());
      this.texture = Texture.fromCanvas(canvas);
      callback();
    })
    .catch(console.log);
  }

  // CORE
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

  pointIsAttached(idx) {
    return this.attachedPoints.indexOf(idx) !== -1;
  }

  // LISTENERS
  addListener() {
    this.rope.buttonMode = true;
    this.rope.interactive = true;
    this.rope.on('pointerover', this.onCursorOver);
    this.rope.on('pointerout', this.onCursorOut);
  }

  removeListener() {
    if (this.rope) {
      this.rope.buttonMode = false;
      this.rope.interactive = false;
      this.rope.off('pointerover', this.onCursorOver);
      this.rope.off('pointerout', this.onCursorOut);
      this.onCursorOut();
    }
  }

  // MOUSE EFFECTS
  onCursorOver() {
    this.rope.on('mousemove', this.updateCursorPosition);
    this.over = true;
    props.ropeOverred = this;
  }

  onCursorOut() {
    this.rope.off('mousemove', this.updateCursorPosition);
    this.marker.hide(() => {
      this.over = false;
    });
    props.ropeOverred = false;
    this.idxPointOverred = false;
  }

  updateCursorPosition(e) {
    this.marker.hide();
    this.idxPointOverred = false;

    let i = this.points.length - 1;
    let positioned = false;

    while (!positioned && i >= 0) {
      const { dist } = getDistBetweenTwoVec2(
        e.data.global.x,
        e.data.global.y,
        this.points[i].x,
        this.points[i].y
      );

      if (dist < this.interacitonDist) {
        positioned = true;
        this.marker.show(this.points[i].x, this.points[i].y);
        this.points[i].y -= 1;
        this.points[i].x += 1;
        this.idxPointOverred = i;
      }
      i--;
    }
  }

  // RENDERING
  update() {
    // http://codepen.io/chribbe/pen/aHhdE?editors=0010
    // gravity
    for (let i = 1; i < this.nbrOfNodes; i++) {
      this.points[i].x += props.GRAVITY_X;
      this.points[i].y += props.GRAVITY_Y;
    }

    for (let i = 1; i < this.nbrOfNodes; i++) {
      // friction
      const oldP = {
        x: this.points[i].x,
        y: this.points[i].y,
      };
      this.points[i].x += (this.points[i].x - this.oldPoints[i].x) * props.VEL;
      this.points[i].y += (this.points[i].y - this.oldPoints[i].y) * props.VEL;
      this.oldPoints[i] = oldP;

      // tention
      const x = this.points[i].x - this.points[i - 1].x;
      const y = this.points[i].y - this.points[i - 1].y;
      const dist = Math.sqrt(Math.sqr(y) + Math.sqr(x));
      const f = (dist - props.SEGMENT_LENGTH) * props.TENTION;
      const fx = (x / dist) * f;
      const fy = (y / dist) * f;
      this.points[i].x -= fx;
      this.points[i].y -= fy;
      this.points[i - 1].x += fx * props.SPRING;
      this.points[i - 1].y += fy * props.SPRING;
    }

    // UPDATE ATTACHED POINTS
    for (let j = 0; j < this.attachedPoints.length; j++) {
      const attachedPoint = this.attachedPoints[j];
      this.points[attachedPoint.idx].x = attachedPoint.x; // + (Math.cos(this.i) * 300);
      this.points[attachedPoint.idx].y = attachedPoint.y; // + (Math.sin(this.i) * 300);
    }

    if (this.over) this.marker.update();
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
