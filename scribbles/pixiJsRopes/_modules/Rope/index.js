import { Container, Point, Graphics, mesh } from 'pixi.js';
import { existingValueBy } from '../../../../utils';
import { distance } from '../../../../utils/vec2';
import props from '../props';

import Marker from '../Marker';

export default class Rope extends Container {
  constructor(p1, p2) {
    super();
    if (!p1.x || !p1.y || !p2.x || !p2.y) {
      console.warging('the two first parameters must be vector2');
      return;
    }

    this.nbrOfNodes = 0;
    this.points = [];
    this.oldPoints = [];
    this.attachedPoints = [];
    this.count = 0;
    this.interacitonDist = props.SEGMENT_LENGTH / 2;
    this.idxPointOverred = -1;
    this.tention = { x: 1, y: 1 };

    this.marker = new Marker(0, 0, 5);

    // Normalize and place point to the line
    // http://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
    const { dist } = distance(p1.x, p1.y, p2.x, p2.y);
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

    this.update = this.update.bind(this);
    this.onCursorOver = this.onCursorOver.bind(this);
    this.onCursorOut = this.onCursorOut.bind(this);
    this.getAttachedPoint = this.getAttachedPoint.bind(this);
    this.updateCursorPosition = this.updateCursorPosition.bind(this);
    this.addTexture = this.addTexture.bind(this);
  }

  // BUILD
  addPoint(x, y) {
    this.nbrOfNodes++;
    this.points.push(new Point(x, y));
    this.oldPoints.push(new Point(x, y));
  }

  // VISUAL
  addTexture(texture = false, color = 0xf4cd6a) {
    if (texture) {
      this.rope = new mesh.Rope(texture, this.points);
      this.rope.tint = color;

      this.addChild(this.rope);
      this.addChild(this.marker);
    } else {
      this.g = new Graphics();
      this.addChild(this.g);
    }
  }

  // CORE
  attachPoint(idx, x = 0, y = 0) {
    let point = this.getAttachedPoint(idx);
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

  getAttachedPoint(idx) {
    const point = existingValueBy(this.attachedPoints, value => (value.idx === idx));
    if (typeof (point) === 'undefined') {
      return false;
    }
    return point;
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
    this.idxPointOverred = -1;
  }

  updateCursorPosition(e) {
    this.marker.hide();
    this.idxPointOverred = -1;

    let i = this.points.length - 1;
    let positioned = false;

    while (!positioned && i >= 0) {
      const { dist } = distance(
        e.data.global.x,
        e.data.global.y,
        this.points[i].x,
        this.points[i].y,
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
      // friction
      const oldP = {
        x: this.points[i].x,
        y: this.points[i].y,
      };

      this.points[i].x += (props.GRAVITY_X * this.tention.x);
      this.points[i].y += (props.GRAVITY_Y * this.tention.y);

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
