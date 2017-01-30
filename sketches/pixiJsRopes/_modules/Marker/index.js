import { Graphics } from 'pixi.js';
import { radians, easing } from 'utils';

export default class Marker extends Graphics {
  constructor(x, y) {
    super();

    this.position = { x, y };
    this.rotation = Math.random() * 10;
    this.size = 10;

    this.beginFill(0x2C2B3C, 0);
    this.lineStyle(2, 0xFCFAF9);
    this.circle = this.arc(0, 0, this.size, 0, radians(325));
    this.endFill();

    this.hideMarker();
  }

  move(x, y) {
    this.position = { x, y };
  }

  showMarker(x, y) {
    this.position = { x, y };
    this.animateScale(1);
  }

  hideMarker() {
    this.animateScale(0);
  }

  animateScale(value) {
    this.isAnimated = true;
    this.targetedScale = value;
  }

  update() {
    this.rotation += 0.1;

    // AnimateScale
    if (this.isAnimated) {
      easing(this.targetedScale, this.scale.x, {
        vel: 0.2,
        update: v => {
          this.scale.x = this.scale.y = v;
        },
        callback: () => {
          this.isAnimated = false;
        },
      });
    }
  }
}
