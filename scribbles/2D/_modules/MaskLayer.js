import { Graphics } from 'pixi.js';

export default class MaskLayer extends Graphics {
  constructor(width, height) {
    super();

    this._width = width;
    this._height = height;

    // Between 0 and 1
    this.topPosition = 0;
    this.bottomPosition = 0;
  }

  updatePosition(newPosition) {
    this.targetedPosition = newPosition;
  }

  animateTo(transition = 1, duration = 2) {
    this.timeline =  new TimelineMax({ onUpdate : () => {
      this.draw();
    }});
    this.timeline.to(this, duration, { topPosition : transition, ease : Power3.easeOut });
    this.timeline.to(this, duration * 1.25, { bottomPosition : transition, ease : Power3.easeOut }, 0);
    return this.timeline;
  }

  draw() {
    this.clear();

    this.beginFill('0xff0000');
    this.moveTo(0, 0);
    this.lineTo(this.topPosition * this._width, 0);
    this.lineTo(this.bottomPosition * this._width, this._height);
    this.lineTo(0, this._height);
    this.endFill();
  }

  reset() {
    this.timeline && this.timeline.kill();
    this.topPosition = 0;
    this.bottomPosition = 0;
  }
}